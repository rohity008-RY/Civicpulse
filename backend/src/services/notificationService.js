const supabase = require('../config/supabase');

const REP_TABLES = [
  ['corporator_id', 'corporators'],
  ['mla_id', 'mlas'],
  ['mp_id', 'mps'],
];

function cleanIds(ids = []) {
  return [...new Set(ids.filter(Boolean))];
}

async function sendExpoPush(userIds, title, body, data = {}) {
  const ids = cleanIds(userIds);
  if (!ids.length || typeof fetch !== 'function') return;

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, fcm_token')
      .in('id', ids)
      .not('fcm_token', 'is', null);
    if (error) throw error;

    const messages = (users || [])
      .map((user) => user.fcm_token)
      .filter((token) => /^Expo(nent)?PushToken\[/i.test(token))
      .map((to) => ({
        to,
        sound: 'default',
        title,
        body,
        data,
      }));

    if (!messages.length) return;
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    if (!response.ok) throw new Error(`Expo push returned ${response.status}`);
  } catch (err) {
    console.warn(`Expo push skipped: ${err.message}`);
  }
}

async function createNotification(userId, type, title, body, data = {}) {
  if (!userId) return null;
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data,
      })
      .select()
      .single();
    if (error) throw error;
    sendExpoPush([userId], title, body, data).catch((err) => {
      console.warn(`Expo push failed: ${err.message}`);
    });
    return notification;
  } catch (err) {
    console.warn(`Notification skipped (${type}): ${err.message}`);
    return null;
  }
}

async function createNotifications(userIds, type, title, body, data = {}) {
  const ids = cleanIds(userIds);
  if (!ids.length) return [];
  const rows = ids.map((user_id) => ({
    user_id,
    type,
    title,
    body,
    data,
  }));

  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .insert(rows)
      .select();
    if (error) throw error;
    sendExpoPush(ids, title, body, data).catch((err) => {
      console.warn(`Expo push failed: ${err.message}`);
    });
    return notifications || [];
  } catch (err) {
    console.warn(`Notifications skipped (${type}): ${err.message}`);
    return [];
  }
}

async function getRepresentativeUserIds(issue) {
  const lookups = REP_TABLES
    .filter(([field]) => issue?.[field])
    .map(async ([field, table]) => {
      const { data } = await supabase
        .from(table)
        .select('user_id')
        .eq('id', issue[field])
        .maybeSingle();
      return data?.user_id || null;
    });

  return cleanIds(await Promise.all(lookups));
}

async function notifyIssueOwner(issue, type, title, body, extra = {}) {
  const { data: followers } = await supabase.from('issue_followers')
    .select('user_id, issues!inner(moderation_status)').eq('issue_id', issue?.id)
    .in('issues.moderation_status', ['VISIBLE', 'UNDER_REVIEW']);
  return createNotifications([issue?.user_id, ...(followers || []).map(row => row.user_id)], type, title, body, {
    issue_id: issue?.id,
    public_id: issue?.public_id,
    ...extra,
  });
}

async function notifyMappedRepresentatives(issue, type, title, body, extra = {}) {
  const ids = await getRepresentativeUserIds(issue);
  return createNotifications(ids, type, title, body, {
    issue_id: issue?.id,
    public_id: issue?.public_id,
    ward_id: issue?.ward_id,
    zone_id: issue?.zone_id,
    ...extra,
  });
}

module.exports = {
  createNotification,
  createNotifications,
  getRepresentativeUserIds,
  notifyIssueOwner,
  notifyMappedRepresentatives,
};
