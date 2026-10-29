const cron = require('node-cron');
const supabase = require('../config/supabase');

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sendWeeklyDigests() {
  if (!process.env.RESEND_API_KEY || !process.env.PASSWORD_RESET_FROM_EMAIL) return;
  const { data: subscribers, error } = await supabase.from('citizen_preferences')
    .select('user_id, last_digest_at, users!inner(email, is_active)').eq('email_digest', true);
  if (error) return console.warn('Weekly digest subscriber lookup failed');
  for (const subscriber of subscribers || []) {
    if (!subscriber.users?.is_active || !subscriber.users.email) continue;
    if (subscriber.last_digest_at && Date.now() - Date.parse(subscriber.last_digest_at) < 6 * 86400000) continue;
    const { data: followed, error: followsError } = await supabase.from('issue_followers')
      .select('issues!inner(id, title, status, updated_at, moderation_status)').eq('user_id', subscriber.user_id)
      .in('issues.moderation_status', ['VISIBLE', 'UNDER_REVIEW'])
      .gte('issues.updated_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(20);
    if (followsError || !followed?.length) continue;
    const site = process.env.FRONTEND_URL || 'https://civicspulse.in';
    const list = followed.map(({ issues: issue }) => `<li><a href="${site}/issues/${issue.id}">${escapeHtml(issue.title)}</a> — ${escapeHtml(issue.status.replace(/_/g, ' '))}</li>`).join('');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `citizen-digest-${subscriber.user_id}-${new Date().toISOString().slice(0, 10)}` },
        body: JSON.stringify({ from: process.env.PASSWORD_RESET_FROM_EMAIL, to: subscriber.users.email, subject: 'Your CivicsPulse weekly report updates', html: `<h1>Your neighbourhood updates</h1><ul>${list}</ul><p><a href="${site}/updates">Manage your weekly email preference</a></p>` }),
      });
      if (!response.ok) throw new Error('Email provider rejected digest');
      await supabase.from('citizen_preferences').update({ last_digest_at: new Date().toISOString() }).eq('user_id', subscriber.user_id);
    } catch { console.warn('Weekly digest delivery failed; will retry next run'); }
  }
}

function startDigestJob() {
  cron.schedule('0 9 * * 1', sendWeeklyDigests, { timezone: 'Asia/Kolkata' });
}

module.exports = { startDigestJob, sendWeeklyDigests };
