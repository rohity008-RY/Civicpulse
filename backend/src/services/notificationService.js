const supabase = require('../config/supabase');

const REP_TABLES = [
  ['corporator_id', 'corporators'],
  ['mla_id', 'mlas'],
  ['mp_id', 'mps'],
];

function cleanIds(ids = []) {
  return [...new Set(ids.filter(Boolean))];
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
  return createNotification(issue?.user_id, type, title, body, {
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
