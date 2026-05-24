const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, isAdmin, isAdminOrMod } = require('../middleware/auth');

// All admin routes require authentication
router.use(authenticate);

// ─── REPRESENTATIVES ──────────────────────────────────────────

// GET all corporators
router.get('/reps/corporators', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('corporators')
    .select('*, wards(name, zone_id, zones(name))').order('injected_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ corporators: data });
});

// POST inject corporator
router.post('/reps/corporators', isAdmin, async (req, res) => {
  try {
    const { ward_id, name, party, phone, email, photo_url, term_start, term_end } = req.body;
    if (!ward_id || !name || !term_start)
      return res.status(400).json({ error: 'ward_id, name, term_start required' });

    // Deactivate existing active corporator for this ward
    await supabase.from('corporators').update({ is_active: false }).eq('ward_id', ward_id).eq('is_active', true);

    const { data, error } = await supabase.from('corporators').insert({
      id: uuidv4(), ward_id, name, party, phone, email, photo_url,
      term_start, term_end, is_active: true, injected_by: req.user.id
    }).select('*, wards(name)').single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_log').insert({
      actor_id: req.user.id, actor_role: req.user.role,
      action: 'CORPORATOR_INJECTED', target_type: 'corporator',
      target_id: data.id, metadata: { name, ward_id }
    });

    res.status(201).json({ corporator: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update corporator
router.put('/reps/corporators/:id', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('corporators')
    .update({ ...req.body, updated_at: new Date() }).eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ corporator: data });
});

// POST inject MLA
router.post('/reps/mlas', isAdmin, async (req, res) => {
  try {
    const { zone_id, name, party, constituency, phone, email, photo_url, term_start } = req.body;
    await supabase.from('mlas').update({ is_active: false }).eq('zone_id', zone_id).eq('is_active', true);

    const { data, error } = await supabase.from('mlas').insert({
      id: uuidv4(), zone_id, name, party, constituency, phone, email, photo_url,
      term_start, is_active: true, injected_by: req.user.id
    }).select().single();

    if (error) throw error;
    // Update zone mla_id
    await supabase.from('zones').update({ mla_id: data.id }).eq('id', zone_id);

    res.status(201).json({ mla: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST inject MP
router.post('/reps/mps', isAdmin, async (req, res) => {
  try {
    const { zone_ids, name, party, constituency, phone, email, photo_url, term_start } = req.body;
    const { data, error } = await supabase.from('mps').insert({
      id: uuidv4(), name, party, constituency, phone, email, photo_url,
      term_start, is_active: true, injected_by: req.user.id
    }).select().single();
    if (error) throw error;

    if (zone_ids?.length) {
      await supabase.from('zones').update({ mp_id: data.id }).in('id', zone_ids);
    }
    res.status(201).json({ mp: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SLA CONFIG ───────────────────────────────────────────────

router.get('/sla', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('sla_config')
    .select('*, wards(name)').eq('is_active', true).order('category');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sla_configs: data });
});

router.post('/sla', isAdmin, async (req, res) => {
  try {
    const { ward_id, category, sla_value, sla_unit, escalation_rep } = req.body;
    const { data, error } = await supabase.from('sla_config').insert({
      id: uuidv4(), ward_id: ward_id || null, category, sla_value,
      sla_unit, escalation_rep: escalation_rep || 'MLA',
      is_active: true, created_by: req.user.id
    }).select().single();
    if (error) throw error;
    res.status(201).json({ sla: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sla/:id', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('sla_config')
    .update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sla: data });
});

// ─── ANALYTICS (Admin + Moderator view) ──────────────────────

router.get('/analytics/overview', isAdminOrMod, async (req, res) => {
  try {
    const [total, open, escalated, resolved, trending] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).not('escalated_at', 'is', null),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).gt('trending_score', 10),
    ]);

    const { data: categoryBreakdown } = await supabase.rpc('get_category_breakdown').maybeSingle()
      || { data: null };

    const { data: recentIssues } = await supabase.from('issues')
      .select('id, title, category, status, trending_score, upvote_count, created_at, wards(name)')
      .order('created_at', { ascending: false }).limit(10);

    res.json({
      stats: {
        total: total.count,
        open: open.count,
        escalated: escalated.count,
        resolved: resolved.count,
        trending: trending.count,
        resolution_rate: total.count ? Math.round((resolved.count / total.count) * 100) : 0
      },
      recent_issues: recentIssues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Zone-wise performance
router.get('/analytics/zones', isAdminOrMod, async (req, res) => {
  try {
    const { data, error } = await supabase.from('zones').select(`
      id, name,
      wards(id, name,
        issues(id, status, created_at, resolved_at, escalated_at)
      )
    `);
    if (error) throw error;

    const zoneStats = data.map(zone => {
      const allIssues = zone.wards.flatMap(w => w.issues);
      const resolved = allIssues.filter(i => i.status === 'RESOLVED');
      const escalated = allIssues.filter(i => i.escalated_at);
      return {
        id: zone.id, name: zone.name,
        total: allIssues.length,
        resolved: resolved.length,
        escalated: escalated.length,
        resolution_rate: allIssues.length
          ? Math.round((resolved.length / allIssues.length) * 100) : 0
      };
    });
    res.json({ zones: zoneStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit log (admin only)
router.get('/audit-log', isAdmin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const { data, error } = await supabase.from('audit_log')
    .select('*, users(name, role)')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ logs: data });
});

// User management
router.get('/users', isAdmin, async (req, res) => {
  const { page = 1, limit = 50, role } = req.query;
  let query = supabase.from('users').select('id, name, email, phone, role, is_active, created_at')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (role) query = query.eq('role', role);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

router.put('/users/:id/role', isAdmin, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['CITIZEN','CORPORATOR','MLA','MP','MODERATOR','ADMIN'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const { data, error } = await supabase.from('users')
    .update({ role }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

module.exports = router;
