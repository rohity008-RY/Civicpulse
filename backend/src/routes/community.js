const express = require('express');
const { validate: isUuid } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { localizeIssues, resolveRequestLanguage } = require('../services/languageService');
const router = express.Router();
router.use(authenticate);

router.get('/activity', async (req, res) => {
  const results = await Promise.all([
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id),
    supabase.from('upvotes').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id),
    supabase.from('issue_followers').select('issue_id', { count: 'exact', head: true }).eq('user_id', req.user.id),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).not('resolution_confirmed_at', 'is', null),
  ]);
  if (results.some(result => result.error)) return res.status(500).json({ error: 'Could not load civic activity' });
  res.json(Object.fromEntries(['reports', 'supported', 'following', 'confirmed'].map((key, i) => [key, results[i].count || 0])));
});

router.get('/following', async (req, res) => {
  try {
    const { data, error } = await supabase.from('issue_followers')
      .select('issue_id, issues!inner(id, public_id, title, description, category, status, location_label, ward_id, created_at, original_language, updated_at, moderation_status, upvote_count, wards(name), issue_media(cdn_url, media_type))')
      .eq('user_id', req.user.id).in('issues.moderation_status', ['VISIBLE', 'UNDER_REVIEW'])
      .order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    const ids = data.map(row => row.issue_id);
    const { data: votes } = ids.length ? await supabase.from('upvotes').select('issue_id').eq('user_id', req.user.id).in('issue_id', ids) : { data: [] };
    const voteSet = new Set((votes || []).map(vote => vote.issue_id));
    res.json({ issue_ids: ids, issues: await localizeIssues(data.map(row => ({ ...row.issues, user_has_upvoted: voteSet.has(row.issue_id) })), resolveRequestLanguage(req)) });
  } catch (err) { res.status(500).json({ error: 'Could not load followed reports' }); }
});

router.post('/issues/:id/follow', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid issue ID' });
  try {
    const { data: issue, error: issueError } = await supabase.from('issues').select('id')
      .eq('id', req.params.id).in('moderation_status', ['VISIBLE', 'UNDER_REVIEW']).maybeSingle();
    if (issueError) throw issueError;
    if (!issue) return res.status(404).json({ error: 'Public report not found' });
    const { error } = await supabase.from('issue_followers')
      .upsert({ user_id: req.user.id, issue_id: issue.id }, { onConflict: 'issue_id,user_id', ignoreDuplicates: true });
    if (error) throw error;
    res.json({ following: true });
  } catch (err) { res.status(500).json({ error: 'Could not follow this report' }); }
});

router.delete('/issues/:id/follow', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid issue ID' });
  try {
    const { error } = await supabase.from('issue_followers').delete()
      .eq('user_id', req.user.id).eq('issue_id', req.params.id);
    if (error) throw error;
    res.json({ following: false });
  } catch { res.status(500).json({ error: 'Could not unfollow this report' }); }
});

router.get('/preferences', async (req, res) => {
  const { data, error } = await supabase.from('citizen_preferences')
    .select('email_digest').eq('user_id', req.user.id).maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not load notification preferences' });
  res.json({ email_digest: data?.email_digest || false, email_available: Boolean(process.env.RESEND_API_KEY && process.env.PASSWORD_RESET_FROM_EMAIL) });
});

router.put('/preferences', async (req, res) => {
  if (typeof req.body.email_digest !== 'boolean') return res.status(400).json({ error: 'email_digest must be true or false' });
  if (req.body.email_digest && !(process.env.RESEND_API_KEY && process.env.PASSWORD_RESET_FROM_EMAIL)) {
    return res.status(503).json({ error: 'Email delivery is not configured. In-app updates are available.' });
  }
  const { error } = await supabase.from('citizen_preferences').upsert({
    user_id: req.user.id, email_digest: req.body.email_digest, updated_at: new Date().toISOString(),
  });
  if (error) return res.status(500).json({ error: 'Could not save notification preferences' });
  res.json({ email_digest: req.body.email_digest });
});

router.post('/issues/:id/confirm-resolution', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid issue ID' });
  const { data, error } = await supabase.rpc('confirm_citizen_resolution', { p_issue_id: req.params.id, p_user_id: req.user.id });
  if (error) return res.status(409).json({ error: 'Only the report owner can confirm a resolved issue, once.' });
  res.json({ resolution_confirmed_at: data });
});

module.exports = router;
