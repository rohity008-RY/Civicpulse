const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { optionalAuth } = require('../middleware/auth');
const { resolveRequestLanguage, localizeIssues } = require('../services/languageService');

const MODERATION_VISIBLE = ['VISIBLE', 'UNDER_REVIEW'];
const PRIVILEGED_ROLES = ['ADMIN', 'MODERATOR'];

function applyModerationVisibility(query, user) {
  if (PRIVILEGED_ROLES.includes(user?.role)) return query;
  return query.in('moderation_status', MODERATION_VISIBLE);
}

function parsePoint(location) {
  if (!location) return { lat: null, lng: null };
  if (Array.isArray(location.coordinates)) {
    return { lng: location.coordinates[0] ?? null, lat: location.coordinates[1] ?? null };
  }
  if (typeof location === 'string') {
    const match = location.match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/i);
    if (match) return { lng: Number(match[1]), lat: Number(match[2]) };
  }
  return { lat: null, lng: null };
}

// ─── GET /api/feed/home ───────────────────────────────────────
router.get('/home', optionalAuth, async (req, res) => {
  try {
    const { ward_id, state_code, city, category, status, scope, sort = 'newest', page = 1, limit = 20 } = req.query;

    let query = supabase.from('issues')
      .select(`id, public_id, title, description, category, status, location_label, created_at, original_language,
               state_code, state_name, city, ward_number,
               upvote_count, comment_count, share_count, trending_score, trending_rank,
               is_community_spotlight, escalated_at, escalated_to_role,
               sla_deadline, reopened_at, reopen_count, moderation_status, is_anonymous, source,
               users(name, avatar_url),
               issue_media(cdn_url, media_type),
               corporators(name, party, photo_url),
               mlas(name, party, photo_url),
               wards(name, ward_number, city, state_name)`)
      .neq('status', 'CLOSED')
      .range((page - 1) * limit, page * limit - 1);
    query = applyModerationVisibility(query, req.user);

    if (ward_id)  query = query.eq('ward_id', ward_id);
    if (state_code) query = query.eq('state_code', String(state_code).toUpperCase());
    if (city) query = query.ilike('city', city);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    if (scope === 'mine' || scope === 'my_escalated') {
      if (!req.user) return res.status(401).json({ error: 'Sign in required for personal feed' });
      query = query.eq('user_id', req.user.id);
      if (scope === 'my_escalated') query = query.not('escalated_at', 'is', null);
    }

    switch (sort) {
      case 'trending':  query = query.order('trending_score', { ascending: false }); break;
      case 'upvotes':   query = query.order('upvote_count', { ascending: false }); break;
      case 'escalated': query = query.not('escalated_at', 'is', null).order('escalated_at', { ascending: false }); break;
      default:          query = query.order('created_at', { ascending: false });
    }

    const { data: issues, error } = await query;
    if (error) throw error;

    if (req.user) {
      const ids = issues.map(i => i.id);
      const { data: votes } = await supabase.from('upvotes')
        .select('issue_id').eq('user_id', req.user.id).in('issue_id', ids);
      const voteSet = new Set(votes?.map(v => v.issue_id));
      issues.forEach(i => { i.user_has_upvoted = voteSet.has(i.id); });
    }

    const languageCode = resolveRequestLanguage(req);
    const localizedIssues = await localizeIssues(issues, languageCode);
    res.json({ issues: localizedIssues, language_code: languageCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/feed/escalated ─────────────────────────────────
router.get('/escalated', optionalAuth, async (req, res) => {
  try {
    const { zone_id, state_code, city, category, sort = 'trending', page = 1, limit = 20 } = req.query;

    let query = supabase.from('issues')
      .select(`id, public_id, title, description, category, status, location_label, created_at, original_language,
               state_code, state_name, city, ward_number,
               upvote_count, comment_count, share_count, trending_score, trending_rank,
               escalated_at, escalated_to_role, escalated_to_mp_at, sla_deadline, reopened_at, reopen_count, moderation_status,
               users(name, avatar_url),
               issue_media(cdn_url, media_type),
               corporators(name, party, photo_url),
               mlas(id, name, party, photo_url),
               mps(id, name, party, photo_url),
               wards(name, ward_number, city, state_name), zones(name, city, state_name)`)
      .not('escalated_at', 'is', null)
      .range((page - 1) * limit, page * limit - 1);
    query = applyModerationVisibility(query, req.user);

    if (zone_id)  query = query.eq('zone_id', zone_id);
    if (state_code) query = query.eq('state_code', String(state_code).toUpperCase());
    if (city) query = query.ilike('city', city);
    if (category) query = query.eq('category', category);

    switch (sort) {
      case 'trending': query = query.order('trending_score', { ascending: false }); break;
      case 'newest':   query = query.order('escalated_at', { ascending: false }); break;
      case 'upvotes':  query = query.order('upvote_count', { ascending: false }); break;
      default:         query = query.order('trending_score', { ascending: false });
    }

    const { data: issues, error } = await query;
    if (error) throw error;

    if (req.user) {
      const ids = issues.map(i => i.id);
      const { data: votes } = await supabase.from('upvotes')
        .select('issue_id').eq('user_id', req.user.id).in('issue_id', ids);
      const voteSet = new Set(votes?.map(v => v.issue_id));
      issues.forEach(i => { i.user_has_upvoted = voteSet.has(i.id); });
    }

    const languageCode = resolveRequestLanguage(req);
    const localizedIssues = await localizeIssues(issues, languageCode);
    res.json({ issues: localizedIssues, language_code: languageCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/feed/trending ───────────────────────────────────
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { zone_id, state_code, city, limit = 10 } = req.query;

    let query = supabase.from('issues')
      .select(`id, public_id, title, description, category, status, location_label, created_at, original_language,
               state_code, state_name, city, ward_number,
               upvote_count, comment_count, share_count, trending_score, trending_rank,
               escalated_at, escalated_to_role, reopened_at, reopen_count, moderation_status,
               issue_media(cdn_url, media_type),
               corporators(name, photo_url),
               mlas(name, photo_url), mps(name, photo_url),
               wards(name, ward_number, city, state_name), zones(name, city, state_name)`)
      .neq('status', 'CLOSED')
      .gt('trending_score', 5)
      .order('trending_score', { ascending: false })
      .limit(limit);
    query = applyModerationVisibility(query, req.user);

    if (zone_id) query = query.eq('zone_id', zone_id);
    if (state_code) query = query.eq('state_code', String(state_code).toUpperCase());
    if (city) query = query.ilike('city', city);

    const { data: issues, error } = await query;
    if (error) throw error;

    const languageCode = resolveRequestLanguage(req);
    const localizedIssues = await localizeIssues(issues, languageCode);
    res.json({ issues: localizedIssues, language_code: languageCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/feed/map — public ward/city issue points ────────
router.get('/map', optionalAuth, async (req, res) => {
  try {
    const { state_code, city, ward_id, status, limit = 100 } = req.query;
    let query = supabase.from('issues')
      .select(`id, public_id, title, category, status, location, location_label, created_at,
               state_code, state_name, city, ward_number, ward_id, upvote_count, trending_score,
               wards(name, ward_number, city, state_name),
               corporators(name, party), mlas(name, party)`)
      .neq('status', 'CLOSED')
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 100);
    query = applyModerationVisibility(query, req.user);

    if (state_code) query = query.eq('state_code', String(state_code).toUpperCase());
    if (city) query = query.ilike('city', city);
    if (ward_id) query = query.eq('ward_id', ward_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const points = (data || []).map((issue) => {
      const point = parsePoint(issue.location);
      return {
        ...issue,
        lat: point.lat,
        lng: point.lng,
        location: undefined,
      };
    });
    res.json({ points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/feed/digest — lightweight public insights ───────
router.get('/digest', optionalAuth, async (req, res) => {
  try {
    let query = supabase.from('issues')
      .select('id, category, status, city, ward_number, ward_id, upvote_count, trending_score, escalated_at, resolved_at, created_at, wards(name)')
      .neq('status', 'CLOSED')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .limit(1000);
    query = applyModerationVisibility(query, req.user);

    const { data: issues, error } = await query;
    if (error) throw error;

    const category = {};
    const wards = {};
    for (const issue of issues || []) {
      category[issue.category] = (category[issue.category] || 0) + 1;
      const wardName = issue.wards?.name || issue.ward_number || issue.city || 'Unmapped';
      if (!wards[wardName]) wards[wardName] = { ward: wardName, total: 0, resolved: 0, escalated: 0, upvotes: 0 };
      wards[wardName].total += 1;
      wards[wardName].resolved += issue.status === 'RESOLVED' ? 1 : 0;
      wards[wardName].escalated += issue.escalated_at ? 1 : 0;
      wards[wardName].upvotes += issue.upvote_count || 0;
    }

    res.json({
      window_days: 30,
      totals: {
        issues: issues?.length || 0,
        resolved: (issues || []).filter((issue) => issue.status === 'RESOLVED').length,
        escalated: (issues || []).filter((issue) => issue.escalated_at).length,
        upvotes: (issues || []).reduce((sum, issue) => sum + (issue.upvote_count || 0), 0),
      },
      category_breakdown: Object.entries(category).map(([name, total]) => ({ name, total })),
      ward_hotspots: Object.values(wards).sort((a, b) => b.total - a.total).slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/feed/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, resolved, reps, reopened, underReview] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      supabase.from('corporators').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('issues').select('*', { count: 'exact', head: true }).gt('reopen_count', 0),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('moderation_status', 'UNDER_REVIEW'),
    ]);
    res.json({
      total_issues: total.count || 0,
      resolved_issues: resolved.count || 0,
      resolution_rate: total.count ? Math.round((resolved.count / total.count) * 100) : 0,
      active_reps: reps.count || 0,
      reopened_issues: reopened.count || 0,
      under_review_issues: underReview.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
