const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, optionalAuth, isRep, isAdminOrMod } = require('../middleware/auth');
const { resolveRepresentatives, resolveRepresentativesByWard, resolveRepresentativesByHierarchy } = require('../services/geoService');
const { computeSlaDeadline } = require('../services/slaService');
const { uploadMedia } = require('../services/mediaService');
const {
  resolveRequestLanguage,
  localizeIssues,
  upsertOriginalTranslation,
  primeIssueTranslations,
} = require('../services/languageService');
const { getRepresentativeIdentity, canManageIssue } = require('../services/representativeService');
const {
  createNotification,
  notifyIssueOwner,
  notifyMappedRepresentatives,
} = require('../services/notificationService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const MODERATION_VISIBLE = ['VISIBLE', 'UNDER_REVIEW'];
const PRIVILEGED_ROLES = ['ADMIN', 'MODERATOR'];

function slugPart(value, fallback, max = 4) {
  const cleaned = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (cleaned || fallback).slice(0, max);
}

function buildPublicIssueId(issue) {
  return [
    'CP',
    slugPart(issue.state_code, 'IN', 2),
    slugPart(issue.city, 'CITY', 4),
    String(issue.id || uuidv4()).replace(/-/g, '').slice(0, 8).toUpperCase(),
  ].join('-');
}

function canSeeModerated(user) {
  return PRIVILEGED_ROLES.includes(user?.role);
}

function applyModerationVisibility(query, user) {
  if (canSeeModerated(user)) return query;
  return query.in('moderation_status', MODERATION_VISIBLE);
}

function publicIssueTitle(issue) {
  return issue?.public_id ? `${issue.public_id}: ${issue.title}` : issue?.title || 'CivicsPulse issue';
}

// ─── GET /api/issues — list with filters ─────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { ward_id, zone_id, state_code, city, category, status, mine, escalated, sort = 'created_at', page = 1, limit = 20 } = req.query;
    let query = supabase.from('issues')
      .select(`*, users:users!issues_user_id_fkey(name, avatar_url), issue_media(cdn_url, media_type),
               corporators(name, party, photo_url), mlas(name, party, photo_url),
               wards(name, ward_number, city, state_name), zones(name, city, state_name)`)
      .neq('status', 'CLOSED')
      .range((page - 1) * limit, page * limit - 1);
    query = applyModerationVisibility(query, req.user);

    if (ward_id)  query = query.eq('ward_id', ward_id);
    if (zone_id)  query = query.eq('zone_id', zone_id);
    if (state_code) query = query.eq('state_code', String(state_code).toUpperCase());
    if (city) query = query.ilike('city', city);
    if (category) query = query.eq('category', category);
    if (status)   query = query.eq('status', status);
    if (mine === 'true' || mine === true) {
      if (!req.user) return res.status(401).json({ error: 'Sign in required for personal issues' });
      query = query.eq('user_id', req.user.id);
    }
    if (escalated === 'true' || escalated === true) query = query.not('escalated_at', 'is', null);

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

    const languageCode = resolveRequestLanguage(req);
    data.forEach(issue => { if (issue.is_anonymous) issue.users = null; });
    const issues = await localizeIssues(data, languageCode);
    res.json({ issues, total: count, page: +page, limit: +limit, language_code: languageCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/issues/track/:publicId — public tracking lookup ──
router.get('/track/:publicId', optionalAuth, async (req, res) => {
  try {
    let query = supabase.from('issues')
      .select(`*, users:users!issues_user_id_fkey(name, avatar_url),
               issue_media(id, cdn_url, s3_url, media_type),
               issue_history(action, actor_role, note, metadata, created_at),
               wards(name, ward_number, city, state_name), zones(name),
               corporators(id, name, party, photo_url, phone),
               mlas(id, name, party, photo_url, constituency),
               mps(id, name, party, photo_url, constituency)`)
      .ilike('public_id', req.params.publicId)
      .limit(1);
    query = applyModerationVisibility(query, req.user);

    const { data: issue, error } = await query.maybeSingle();
    if (error || !issue) return res.status(404).json({ error: 'Issue not found' });

    const languageCode = resolveRequestLanguage(req);
    if (issue.is_anonymous) issue.users = null;
    const [localizedIssue] = await localizeIssues([issue], languageCode);
    res.json({ issue: localizedIssue, language_code: languageCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/issues/:id ──────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let query = supabase.from('issues')
      .select(`*, users:users!issues_user_id_fkey(name, avatar_url),
               issue_media(id, cdn_url, s3_url, media_type),
               issue_history(action, actor_role, note, metadata, created_at),
               wards(name, ward_number, city, state_name), zones(name),
               corporators(id, name, party, photo_url, phone),
               mlas(id, name, party, photo_url, constituency),
               mps(id, name, party, photo_url, constituency)`)
      .eq('id', req.params.id);
    query = applyModerationVisibility(query, req.user);

    const { data: issue, error } = await query.single();

    if (error) return res.status(404).json({ error: 'Issue not found' });

    if (req.user) {
      const { data: vote } = await supabase.from('upvotes')
        .select('id').eq('issue_id', issue.id).eq('user_id', req.user.id).maybeSingle();
      issue.user_has_upvoted = !!vote;
    }

    const languageCode = resolveRequestLanguage(req);
    if (issue.is_anonymous) issue.users = null;
    const [localizedIssue] = await localizeIssues([issue], languageCode);
    res.json({ issue: localizedIssue, language_code: languageCode });
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
    if (hasPoint && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lng)) > 180)) {
      return res.status(400).json({ error: 'Choose a valid map location' });
    }
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
    const original_language = resolveRequestLanguage(req);

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
      source: source || 'TYPED',
      original_language
    }).select().single();

    if (error) throw error;

    const public_id = buildPublicIssueId(issue);
    const { data: issueWithPublicId, error: publicIdError } = await supabase
      .from('issues')
      .update({ public_id })
      .eq('id', issueId)
      .select()
      .single();
    if (publicIdError) throw publicIdError;
    const savedIssue = issueWithPublicId || { ...issue, public_id };

    let media_warning = null;

    // Upload media files
    if (req.files?.length) {
      try {
        const mediaInserts = await Promise.all(req.files.map(f => uploadMedia(f, issueId)));
        await supabase.from('issue_media').insert(mediaInserts);
      } catch (uploadErr) {
        if (uploadErr.code !== 'S3_NOT_CONFIGURED') throw uploadErr;
        media_warning = 'Issue raised. Media storage is not configured yet, so photos/videos were not uploaded.';
      }
    }

    // Log history
    await supabase.from('issue_history').insert({
      issue_id: issueId, action: 'CREATED', actor_id: req.user.id, actor_role: req.user.role
    });

    await upsertOriginalTranslation(savedIssue, original_language);
    primeIssueTranslations(savedIssue).catch((err) => {
      console.warn(`Translation priming failed for issue ${issueId}: ${err.message}`);
    });

    await createNotification(
      req.user.id,
      'ISSUE_SUBMITTED',
      'Issue submitted',
      `${public_id} is now visible in your ward feed.`,
      { issue_id: issueId, public_id }
    );
    notifyMappedRepresentatives(
      savedIssue,
      'ISSUE_ASSIGNED',
      'New tagged issue',
      publicIssueTitle(savedIssue),
      { category: savedIssue.category }
    ).catch((err) => console.warn(`Representative notification failed: ${err.message}`));

    res.status(201).json({
      issue: {
        ...savedIssue,
        language_code: original_language,
        translation_status: 'original',
      },
      media_warning,
      language_code: original_language,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/issues/:id/status ────────────────────────────
router.patch('/:id/status', authenticate, isRep, upload.single('proof'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['ASSIGNED','IN_PROGRESS','RESOLVED'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const { data: currentIssue, error: currentError } = await supabase.from('issues')
      .select('id, public_id, user_id, title, status, reopen_count, ward_id, zone_id, corporator_id, mla_id, mp_id')
      .eq('id', req.params.id)
      .single();
    if (currentError || !currentIssue) return res.status(404).json({ error: 'Issue not found' });

    const identity = await getRepresentativeIdentity(req.user);
    if (!canManageIssue(identity, currentIssue)) {
      return res.status(403).json({
        error: 'This issue is not mapped to your representative account',
        code: 'ISSUE_NOT_IN_REP_SCOPE',
      });
    }

    const updates = { status, updated_at: new Date() };
    if (req.file) {
      if (status !== 'RESOLVED' || !req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Resolution proof must be an image for a resolved report' });
      updates.resolved_proof_url = (await uploadMedia(req.file, currentIssue.id)).cdn_url;
    }
    if (status !== 'RESOLVED') updates.resolution_confirmed_at = null;
    if (status === 'RESOLVED') updates.resolved_at = new Date(), updates.resolved_by_role = req.user.role;

    const { data: issue, error } = await supabase.from('issues')
      .update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    await supabase.from('issue_history').insert({
      issue_id: req.params.id, action: `STATUS_${status}`,
      actor_id: req.user.id, actor_role: req.user.role, note
    });

    const notificationType = status === 'RESOLVED'
      ? 'ISSUE_RESOLVED'
      : status === 'IN_PROGRESS'
        ? 'ISSUE_IN_PROGRESS'
        : 'ISSUE_ASSIGNED';
    await notifyIssueOwner(
      { ...currentIssue, ...issue },
      notificationType,
      status === 'RESOLVED' ? 'Issue marked resolved' : 'Issue status updated',
      `${publicIssueTitle({ ...currentIssue, ...issue })} is now ${status.replace(/_/g, ' ').toLowerCase()}.`,
      { status, note: note || null }
    );

    res.json({ issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/issues/:id/reopen ──────────────────────────────
router.post('/:id/reopen', authenticate, async (req, res) => {
  try {
    const { note } = req.body;
    const { data: currentIssue, error: currentError } = await supabase.from('issues')
      .select('id, public_id, user_id, title, status, reopen_count, ward_id, zone_id, corporator_id, mla_id, mp_id')
      .eq('id', req.params.id)
      .single();
    if (currentError || !currentIssue) return res.status(404).json({ error: 'Issue not found' });

    const identity = await getRepresentativeIdentity(req.user);
    const isOwner = currentIssue.user_id === req.user.id;
    const canReopen = isOwner || canManageIssue(identity, currentIssue) || canSeeModerated(req.user);
    if (!canReopen) return res.status(403).json({ error: 'Only the issue owner, mapped representative, or admin can reopen this issue' });
    if (!['RESOLVED', 'CLOSED'].includes(currentIssue.status)) {
      return res.status(400).json({ error: 'Only resolved or closed issues can be reopened' });
    }

    const { data: issue, error } = await supabase.from('issues')
      .update({
        status: 'OPEN',
        resolved_at: null,
        resolved_by_role: null,
        resolution_confirmed_at: null,
        reopened_at: new Date(),
        reopened_by: req.user.id,
        reopen_count: (currentIssue.reopen_count || 0) + 1,
        updated_at: new Date(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('issue_history').insert({
      issue_id: req.params.id,
      action: 'REOPENED',
      actor_id: req.user.id,
      actor_role: req.user.role,
      note: note || 'Citizen reopened this issue for follow-up',
    });

    await notifyIssueOwner(
      { ...currentIssue, ...issue },
      'ISSUE_REOPENED',
      'Issue reopened',
      `${publicIssueTitle({ ...currentIssue, ...issue })} is open again for follow-up.`,
      { note: note || null }
    );
    notifyMappedRepresentatives(
      { ...currentIssue, ...issue },
      'ISSUE_REOPENED',
      'Issue reopened',
      publicIssueTitle({ ...currentIssue, ...issue }),
      { note: note || null }
    ).catch((err) => console.warn(`Reopen representative notification failed: ${err.message}`));

    res.json({ issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/issues/:id/report ──────────────────────────────
router.post('/:id/report', authenticate, async (req, res) => {
  try {
    const { reason = 'OTHER', details = '' } = req.body;
    const { data: issue, error: issueError } = await supabase.from('issues')
      .select('id, public_id, user_id, title, moderation_status')
      .eq('id', req.params.id)
      .single();
    if (issueError || !issue) return res.status(404).json({ error: 'Issue not found' });

    const { data: report, error } = await supabase.from('issue_reports')
      .upsert({
        issue_id: req.params.id,
        reporter_id: req.user.id,
        reason,
        details,
        status: 'OPEN',
      }, { onConflict: 'issue_id,reporter_id' })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('issues')
      .update({
        moderation_status: issue.moderation_status === 'HIDDEN' || issue.moderation_status === 'REJECTED'
          ? issue.moderation_status
          : 'UNDER_REVIEW',
        updated_at: new Date(),
      })
      .eq('id', req.params.id);

    await supabase.from('issue_history').insert({
      issue_id: req.params.id,
      action: 'REPORTED',
      actor_id: req.user.id,
      actor_role: req.user.role,
      note: reason,
      metadata: { details },
    });

    res.status(201).json({ report, moderation_status: 'UNDER_REVIEW' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/issues/:id/moderation ─────────────────────────
router.patch('/:id/moderation', authenticate, isAdminOrMod, async (req, res) => {
  try {
    const { moderation_status, moderation_reason = '' } = req.body;
    const validStatuses = ['VISIBLE', 'UNDER_REVIEW', 'HIDDEN', 'REJECTED'];
    if (!validStatuses.includes(moderation_status)) {
      return res.status(400).json({ error: 'Invalid moderation status' });
    }

    const { data: issue, error } = await supabase.from('issues')
      .update({
        moderation_status,
        moderation_reason,
        moderated_by: req.user.id,
        moderated_at: new Date(),
        updated_at: new Date(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('issue_reports')
      .update({
        status: moderation_status === 'VISIBLE' ? 'DISMISSED' : 'REVIEWED',
        reviewed_by: req.user.id,
        reviewed_at: new Date(),
      })
      .eq('issue_id', req.params.id)
      .eq('status', 'OPEN');

    await supabase.from('issue_history').insert({
      issue_id: req.params.id,
      action: `MODERATION_${moderation_status}`,
      actor_id: req.user.id,
      actor_role: req.user.role,
      note: moderation_reason || null,
    });

    res.json({ issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/issues/:id/duplicates ───────────────────────────
router.get('/:id/duplicates', optionalAuth, async (req, res) => {
  try {
    const { data: issue, error } = await supabase
      .from('issues')
      .select('id, category, ward_id, city, title')
      .eq('id', req.params.id)
      .single();
    if (error || !issue) return res.status(404).json({ error: 'Issue not found' });

    let query = supabase.from('issues')
      .select('id, public_id, title, category, status, location_label, ward_id, city, upvote_count, created_at, wards(name)')
      .neq('id', issue.id)
      .eq('category', issue.category)
      .neq('status', 'CLOSED')
      .order('upvote_count', { ascending: false })
      .limit(5);
    query = applyModerationVisibility(query, req.user);
    if (issue.ward_id) query = query.eq('ward_id', issue.ward_id);
    else if (issue.city) query = query.ilike('city', issue.city);

    const { data, error: dupError } = await query;
    if (dupError) throw dupError;
    res.json({ duplicates: data || [] });
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
      const { data: issue } = await supabase
        .from('issues')
        .select('id, public_id, user_id, title, upvote_count')
        .eq('id', req.params.id)
        .maybeSingle();
      const nextCount = (issue?.upvote_count || 0) + 1;
      if ([5, 10, 25, 50, 100].includes(nextCount)) {
        await notifyIssueOwner(
          issue,
          'UPVOTE_MILESTONE',
          'Your issue is gaining support',
          `${publicIssueTitle(issue)} reached ${nextCount} upvotes.`,
          { upvote_count: nextCount }
        );
      }
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

    const { data: issue } = await supabase
      .from('issues')
      .select('id, public_id, user_id, title')
      .eq('id', req.params.id)
      .maybeSingle();

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
    if (issue?.user_id && issue.user_id !== req.user.id) {
      await notifyIssueOwner(
        issue,
        isRepRole ? 'OFFICIAL_RESPONSE' : 'COMMENT_ADDED',
        isRepRole ? 'Official response added' : 'New comment on your issue',
        publicIssueTitle(issue),
        { comment_id: data.id, comment_type }
      );
    }
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
    const { data: issue } = await supabase
      .from('issues')
      .select('share_count')
      .eq('id', req.params.id)
      .maybeSingle();
    await supabase.from('issues')
      .update({ share_count: (issue?.share_count || 0) + 1, updated_at: new Date() })
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
      .select('user_id').eq('id', req.params.cid).single();

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
