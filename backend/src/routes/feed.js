const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { optionalAuth } = require('../middleware/auth');
const { resolveRequestLanguage, localizeIssues } = require('../services/languageService');

// ─── GET /api/feed/home ───────────────────────────────────────
router.get('/home', optionalAuth, async (req, res) => {
  try {
    const { ward_id, state_code, city, category, status, scope, sort = 'newest', page = 1, limit = 20 } = req.query;

    let query = supabase.from('issues')
      .select(`id, title, description, category, status, location_label, created_at, original_language,
               state_code, state_name, city, ward_number,
               upvote_count, comment_count, share_count, trending_score, trending_rank,
               is_community_spotlight, escalated_at, escalated_to_role,
               sla_deadline, is_anonymous, source,
               users(name, avatar_url),
               issue_media(cdn_url, media_type),
               corporators(name, party, photo_url),
               mlas(name, party, photo_url),
               wards(name, ward_number, city, state_name)`)
      .neq('status', 'CLOSED')
      .range((page - 1) * limit, page * limit - 1);

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
      .select(`id, title, description, category, status, location_label, created_at, original_language,
               state_code, state_name, city, ward_number,
               upvote_count, comment_count, share_count, trending_score, trending_rank,
               escalated_at, escalated_to_role, escalated_to_mp_at, sla_deadline,
               users(name, avatar_url),
               issue_media(cdn_url, media_type),
               corporators(name, party, photo_url),
               mlas(id, name, party, photo_url),
               mps(id, name, party, photo_url),
               wards(name, ward_number, city, state_name), zones(name, city, state_name)`)
      .not('escalated_at', 'is', null)
      .range((page - 1) * limit, page * limit - 1);

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
      .select(`id, title, description, category, status, location_label, created_at, original_language,
               state_code, state_name, city, ward_number,
               upvote_count, comment_count, share_count, trending_score, trending_rank,
               escalated_at, escalated_to_role,
               issue_media(cdn_url, media_type),
               corporators(name, photo_url),
               mlas(name, photo_url), mps(name, photo_url),
               wards(name, ward_number, city, state_name), zones(name, city, state_name)`)
      .neq('status', 'CLOSED')
      .gt('trending_score', 5)
      .order('trending_score', { ascending: false })
      .limit(limit);

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

// ─── GET /api/feed/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [total, resolved, reps] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      supabase.from('corporators').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    res.json({
      total_issues: total.count || 0,
      resolved_issues: resolved.count || 0,
      resolution_rate: total.count ? Math.round((resolved.count / total.count) * 100) : 0,
      active_reps: reps.count || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
