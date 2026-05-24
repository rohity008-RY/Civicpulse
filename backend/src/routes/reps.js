const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { optionalAuth } = require('../middleware/auth');

// GET /api/reps/corporators/:id — public profile
router.get('/corporators/:id', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('corporators')
      .select('*, wards(name, zone_id, zones(name))')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Not found' });

    // Monthly stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: issues } = await supabase
      .from('issues')
      .select('id, status, created_at, resolved_at, escalated_at, upvote_count, trending_score')
      .eq('corporator_id', req.params.id)
      .gte('created_at', monthStart);

    const total      = issues?.length || 0;
    const resolved   = issues?.filter(i => i.status === 'RESOLVED').length || 0;
    const escalated  = issues?.filter(i => i.escalated_at).length || 0;
    const totalVotes = issues?.reduce((s, i) => s + (i.upvote_count || 0), 0) || 0;
    const trending   = issues?.filter(i => i.trending_score > 10).length || 0;

    const avgDays = resolved > 0
      ? issues.filter(i => i.resolved_at).reduce((s, i) => {
          return s + (new Date(i.resolved_at) - new Date(i.created_at)) / 86400000;
        }, 0) / resolved
      : 0;

    const pressureIndex = total > 0
      ? Math.min(100, Math.round(
          (escalated / total) * 50 + (trending / Math.max(total, 1)) * 30 + Math.min(20, totalVotes / 100)
        ))
      : 0;

    res.json({
      corporator: data,
      stats: { total, resolved, escalated, trending, total_votes: totalVotes, avg_days: +avgDays.toFixed(1), pressure_index: pressureIndex, resolution_rate: total ? Math.round((resolved / total) * 100) : 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reps/mlas/:id
router.get('/mlas/:id', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mlas')
      .select('*, zones(name)')
      .eq('id', req.params.id)
      .single();
    if (error) return res.status(404).json({ error: 'Not found' });

    const { data: issues } = await supabase
      .from('issues')
      .select('id, status, escalated_at, upvote_count, trending_score')
      .eq('mla_id', req.params.id);

    const total    = issues?.length || 0;
    const resolved = issues?.filter(i => i.status === 'RESOLVED').length || 0;
    const escalated = issues?.filter(i => i.escalated_at).length || 0;

    res.json({
      mla: data,
      stats: { total, resolved, escalated, resolution_rate: total ? Math.round((resolved / total) * 100) : 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reps/leaderboard — public rep rankings
router.get('/leaderboard', async (req, res) => {
  try {
    const { zone_id, month, year } = req.query;
    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year  ? parseInt(year)  : now.getFullYear();

    const monthStart = new Date(y, m - 1, 1).toISOString();
    const monthEnd   = new Date(y, m, 0, 23, 59, 59).toISOString();

    let query = supabase.from('corporators')
      .select('id, name, party, photo_url, wards(id, name, zone_id, zones(name))')
      .eq('is_active', true);
    if (zone_id) query = query.eq('wards.zone_id', zone_id);

    const { data: corps } = await query;

    const rankings = await Promise.all((corps || []).map(async (corp) => {
      const { data: issues } = await supabase.from('issues')
        .select('status, escalated_at, resolved_at, created_at, upvote_count')
        .eq('corporator_id', corp.id)
        .gte('created_at', monthStart).lte('created_at', monthEnd);

      const total    = issues?.length || 0;
      const resolved = issues?.filter(i => i.status === 'RESOLVED').length || 0;
      const escalated = issues?.filter(i => i.escalated_at).length || 0;
      const avgDays  = resolved > 0
        ? issues.filter(i => i.resolved_at)
            .reduce((s, i) => s + (new Date(i.resolved_at) - new Date(i.created_at)) / 86400000, 0) / resolved
        : 0;

      return {
        ...corp,
        stats: {
          total, resolved, escalated,
          resolution_rate: total ? Math.round((resolved / total) * 100) : 0,
          avg_days: +avgDays.toFixed(1)
        }
      };
    }));

    rankings.sort((a, b) => b.stats.resolution_rate - a.stats.resolution_rate);
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json({ rankings, month: m, year: y });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reps/ward-lookup?lat=&lng=
router.get('/ward-lookup', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const { data, error } = await supabase.rpc('find_ward_by_point', {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });

    if (error || !data) return res.status(404).json({ error: 'Ward not found for this location' });

    // Enrich with rep details
    const { data: corp } = await supabase
      .from('corporators').select('id, name, party, photo_url')
      .eq('ward_id', data.id).eq('is_active', true).maybeSingle();

    const { data: zone } = await supabase
      .from('zones').select('id, name, mla_id, mp_id').eq('id', data.zone_id).single();

    const { data: mla } = zone?.mla_id
      ? await supabase.from('mlas').select('id, name, party, photo_url').eq('id', zone.mla_id).maybeSingle()
      : { data: null };

    res.json({ ward: data, zone, corporator: corp, mla });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
