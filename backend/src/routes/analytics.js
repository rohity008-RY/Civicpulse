const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, isAdminOrMod } = require('../middleware/auth');

router.use(authenticate, isAdminOrMod);

// GET /api/analytics/overview — already in admin, expose here too
router.get('/overview', async (req, res) => {
  try {
    const [total, open, escalated, resolved, trending] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).not('escalated_at', 'is', null),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).gt('trending_score', 10),
    ]);
    res.json({
      total: total.count, open: open.count,
      escalated: escalated.count, resolved: resolved.count,
      trending: trending.count,
      resolution_rate: total.count ? Math.round((resolved.count / total.count) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/category-breakdown
router.get('/categories', async (req, res) => {
  try {
    const categories = ['POTHOLE','GARBAGE','WATER','STREETLIGHT','SAFETY','TREE','OTHER'];
    const breakdown = await Promise.all(categories.map(async cat => {
      const { count } = await supabase.from('issues')
        .select('*', { count: 'exact', head: true }).eq('category', cat);
      return { category: cat, count: count || 0 };
    }));
    res.json({ breakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/voice-metrics
router.get('/voice', async (req, res) => {
  try {
    const { count: total } = await supabase.from('issues')
      .select('*', { count: 'exact', head: true }).eq('source', 'VOICE');
    const { count: typed } = await supabase.from('issues')
      .select('*', { count: 'exact', head: true }).eq('source', 'TYPED');
    res.json({ voice: total || 0, typed: typed || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
