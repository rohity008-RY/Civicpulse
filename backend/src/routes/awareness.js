const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');

const DEFAULT_ITEMS = [
  {
    id: 'fallback-monsoon',
    slug: 'monsoon-waterlogging-readiness',
    title: 'Monsoon watch: report waterlogging early',
    summary: 'Add a clear photo, road name, and nearest landmark so drainage teams can identify repeat flooding points quickly.',
    category: 'ALERT',
    city: 'Mumbai',
    ward_label: 'All wards',
    action_label: 'Raise water issue',
    priority: 50,
    is_active: true,
  },
  {
    id: 'fallback-pothole',
    slug: 'pothole-photo-guide',
    title: 'Better pothole reports get faster routing',
    summary: 'Stand safely, capture the road edge and landmark, and choose the pothole category so the issue reaches the right queue.',
    category: 'GUIDE',
    city: 'Mumbai',
    ward_label: 'Roads',
    action_label: 'Learn report tips',
    priority: 40,
    is_active: true,
  },
  {
    id: 'fallback-garbage',
    slug: 'garbage-repeat-hotspots',
    title: 'Repeat garbage dumping needs pattern details',
    summary: 'Mention timing, nearby shop/building, and whether cleanup has already happened so ward officers can spot repeat dumping.',
    category: 'AWARENESS',
    city: 'Mumbai',
    ward_label: 'Sanitation',
    action_label: 'Report garbage',
    priority: 35,
    is_active: true,
  },
  {
    id: 'fallback-streetlight',
    slug: 'streetlight-night-safety',
    title: 'Night safety: map dark streetlight stretches',
    summary: 'If multiple lights are off, include pole numbers or both ends of the lane to help repair crews inspect in one visit.',
    category: 'SAFETY',
    city: 'Mumbai',
    ward_label: 'Public safety',
    action_label: 'Report streetlight',
    priority: 30,
    is_active: true,
  },
];

const writeFields = ['slug', 'title', 'summary', 'category', 'city', 'ward_label', 'action_label', 'action_url', 'priority', 'starts_at', 'ends_at', 'is_active'];

function sanitizePayload(body = {}) {
  const payload = {};
  for (const field of writeFields) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  if (!payload.slug && payload.title) {
    payload.slug = String(payload.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
  }
  if (payload.priority !== undefined) payload.priority = Number(payload.priority) || 0;
  return payload;
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const includeInactive = req.user?.role === 'ADMIN' && req.query.include_inactive === 'true';
    let query = supabase
      .from('awareness_items')
      .select('*')
      .order('priority', { ascending: false })
      .order('starts_at', { ascending: false })
      .limit(Number(req.query.limit) || 12);

    if (!includeInactive) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data?.length ? data : DEFAULT_ITEMS, source: data?.length ? 'database' : 'fallback' });
  } catch (err) {
    res.json({ items: DEFAULT_ITEMS, source: 'fallback', warning: err.message });
  }
});

router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const payload = sanitizePayload(req.body);
    if (!payload.title || !payload.summary) return res.status(400).json({ error: 'title and summary are required' });
    const { data, error } = await supabase
      .from('awareness_items')
      .insert({ ...payload, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const payload = sanitizePayload(req.body);
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('awareness_items')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('awareness_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ item: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
