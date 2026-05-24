const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const { count: unread } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    res.json({ notifications: data, unread_count: unread || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/mark-read
router.post('/mark-read', authenticate, async (req, res) => {
  try {
    const { ids } = req.body; // array of notification IDs, or empty for all
    let query = supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id);

    if (ids?.length) query = query.in('id', ids);

    await query;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
