const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, optionalAuth, isRep, isAdminOrMod } = require('../middleware/auth');
const { resolveRepresentatives, resolveRepresentativesByWard, resolveRepresentativesByHierarchy } = require('../services/geoService');
const { computeSlaDeadline } = require('../services/slaService');
const { uploadMedia } = require('../services/mediaService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ─── GET /api/issues — list with filters ─────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { ward_id, zone_id, state_code, city, category, status, sort = 'created_at', page = 1, limit = 20 } = req.query;
    let query = supabase.from('issues')
      .select(`*, users(name, avatar_url), issue_media(cdn_url, media_type),
               corporators(name, party, photo_url), mlas(name, party, photo_url),
               wards(name, ward_number, city, state_name), zones(name, city, state_name)`)
      .neq('status', 'CLOSED')
      .range((page - 1) * limit, page * limit - 1);

    if (ward_id)  query = query.eq('ward_id', ward_id);
    if (zone_id)  query = query.eq('zone_id', zone_id);
    if (state_code) query = query.eq('state_code', String(state_code).toUpperCase());
    if (city) query = query.ilike('city', city);
    if (category) query = query.eq('category', category);
    if (status)   query = query.eq('status', status);

    if (sort === 'trending') query = query.order('trending_score', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;

    // Attach user upvote status
    if (req.user) {
      const ids = data.map(i => i.id);
      const { data: votes } = await supabase.from('upvotes')
        .select('issue_id').eq('user_id', req.user.id).in('issue_id', ids);
      const voteSet = new Set(votes?.map(v => v.issue_id));
      data.forEach(i => { i.user_has_upvoted = voteSet.has(i.id); });
    }

    res.json({ issues: data, total: count, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/issues/:id ──────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data: issue, error } = await supabase.from('issues')
      .select(`*, users(name, avatar_url),
               issue_media(id, cdn_url, s3_url, media_type),
               issue_history(action, actor_role, note, created_at),
               wards(name), zones(name),
               corporators(id, name, party, photo_url, phone),
               mlas(id, name, party, photo_url, constituency),
               mps(id, name, party, photo_url, constituency)`)
      .eq('id', req.params.id).single();

    if (error) return res.status(404).json({ error: 'Issue not found' });

    if (req.user) {
      const { data: vote } = await supabase.from('upvotes')
        .select('id').eq('issue_id', issue.id).eq('user_id', req.user.id).maybeSingle();
      issue.user_has_upvoted = !!vote;
    }

    res.json({ issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/issues — create ────────────────────────────────
router.post('/', authenticate, upload.array('media', 4), async (req, res) => {
  try {
    const {
      title, description, category, lat, lng, location_label, is_anonymous, source,
      ward_id, state_code, state_name, city, ward_number, ward_name
    } = req.body;
    if (!title || !category)
      return res.status(400).json({ error: 'title and category required' });

    const hasPoint = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
    if (!hasPoint && !ward_id && !(city && (ward_number || ward_name))) {
      return res.status(400).json({ error: 'lat/lng or ward selection required' });
    }

    // Resolve ward/zone/reps from GPS
    let geo;
    if (ward_id) {
      geo = await resolveRepresentativesByWard(ward_id);
    } else if (city && (ward_number || ward_name)) {
      geo = await resolveRepresentativesByHierarchy({ state_code, state_name, city, ward_number, ward_name });
      if (!geo.ward_id && hasPoint) {
        geo = await resolveRepresentatives(parseFloat(lat), parseFloat(lng));
      }
    } else {
      geo = await resolveRepresentatives(parseFloat(lat), parseFloat(lng));
    }

    const sla_deadline = await computeSlaDeadline(geo.ward_id, category);

    const issueId = uuidv4();
    const { data: issue, error } = await supabase.from('issues').insert({
      id: issueId,
      user_id: req.user.id,
      title, description, category,
      status: 'OPEN',
      location: hasPoint ? `POINT(${lng} ${lat})` : null,
      location_label,
      state_code: geo.state_code || state_code || null,
      state_name: geo.state_name || state_name || null,
      city: geo.city || city || null,
      ward_number: geo.ward_number || ward_number || null,
      ward_id: geo.ward_id,
      zone_id: geo.zone_id,
      corporator_id: geo.corporator_id,
      mla_id: geo.mla_id,
      mp_id: geo.mp_id,
      sla_deadline,
      is_anonymous: is_anonymous === 'true',
      source: source || 'TYPED'
    }).select().single();

    if (error) throw error;

    // Upload media files
    if (req.files?.length) {
      const mediaInserts = await Promise.all(req.files.map(f => uploadMedia(f, issueId)));
      await supabase.from('issue_media').insert(mediaInserts);
    }

    // Log history
    await supabase.from('issue_history').insert({
      issue_id: issueId, action: 'CREATED', actor_id: req.user.id, actor_role: req.user.role
    });

    res.status(201).json({ issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/issues/:id/status ────────────────────────────
router.patch('/:id/status', authenticate, isRep, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['ASSIGNED','IN_PROGRESS','RESOLVED'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const updates = { status, updated_at: new Date() };
    if (status === 'RESOLVED') updates.resolved_at = new Date(), updates.resolved_by_role = req.user.role;

    const { data: issue, error } = await supabase.from('issues')
      .update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    await supabase.from('issue_history').insert({
      issue_id: req.params.id, action: `STATUS_${status}`,
      actor_id: req.user.id, actor_role: req.user.role, note
    });

    res.json({ issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/issues/:id/upvote ─────────────────────────────
router.post('/:id/upvote', authenticate, async (req, res) => {
  try {
    const { data: existing } = await supabase.from('upvotes')
      .select('id').eq('issue_id', req.params.id).eq('user_id', req.user.id).maybeSingle();

    if (existing) {
      await supabase.from('upvotes').delete()
        .eq('issue_id', req.params.id).eq('user_id', req.user.id);
      res.json({ upvoted: false });
    } else {
      await supabase.from('upvotes').insert({ issue_id: req.params.id, user_id: req.user.id });
      res.json({ upvoted: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/issues/:id/comments ────────────────────────────
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('comments')
      .select('*, users(name, avatar_url, role)')
      .eq('issue_id', req.params.id)
      .eq('is_deleted', false)
      .eq('is_hidden', false)
      .order('comment_type', { ascending: false }) // REP_OFFICIAL first
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ comments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/issues/:id/comments ───────────────────────────
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { body, parent_id } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' });

    const isRepRole = ['CORPORATOR','MLA','MP'].includes(req.user.role);
    const comment_type = isRepRole ? 'REP_OFFICIAL' : 'CITIZEN';

    const { data, error } = await supabase.from('comments').insert({
      issue_id: req.params.id,
      user_id: req.user.id,
      body: body.trim(),
      parent_id: parent_id || null,
      comment_type
    }).select('*, users(name, avatar_url, role)').single();

    if (error) throw error;
    res.status(201).json({ comment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/issues/:id/share ──────────────────────────────
router.post('/:id/share', optionalAuth, async (req, res) => {
  try {
    const { platform } = req.body;
    await supabase.from('shares').insert({
      issue_id: req.params.id,
      user_id: req.user?.id || null,
      platform
    });
    await supabase.from('issues')
      .update({ share_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/issues/:id/comments/:cid ────────────────────
router.delete('/:id/comments/:cid', authenticate, async (req, res) => {
  try {
    const { data: comment } = await supabase.from('comments')
      .select('user_id').eq('id', req.cid).single();

    const canDelete = req.user.role === 'ADMIN' || req.user.role === 'MODERATOR'
      || comment.user_id === req.user.id;

    if (!canDelete) return res.status(403).json({ error: 'Access denied' });

    await supabase.from('comments').update({ is_deleted: true }).eq('id', req.params.cid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
