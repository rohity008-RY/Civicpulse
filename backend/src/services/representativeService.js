const supabase = require('../config/supabase');

const REP_SELECTS = {
  CORPORATOR: 'id, user_id, ward_id, name, email, is_active, wards(id, name, ward_number, city, state_name, zone_id)',
  MLA: 'id, user_id, zone_id, name, email, constituency, is_active, zones(id, name, city, state_name)',
  MP: 'id, user_id, name, email, constituency, is_active',
};

const ROLE_TABLE = {
  CORPORATOR: 'corporators',
  MLA: 'mlas',
  MP: 'mps',
};

async function findRepRecord(role, user) {
  const table = ROLE_TABLE[role];
  if (!table) return null;

  const select = REP_SELECTS[role];
  const byUser = await supabase
    .from(table)
    .select(select)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (byUser.error) throw byUser.error;
  if (byUser.data) return byUser.data;

  if (!user.email) return null;
  const byEmail = await supabase
    .from(table)
    .select(select)
    .ilike('email', user.email)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (byEmail.error) throw byEmail.error;
  return byEmail.data || null;
}

async function getRepresentativeIdentity(user) {
  if (!user) return null;
  if (user.role === 'ADMIN') {
    return { role: 'ADMIN', rep_type: 'ADMIN', is_admin: true, display_name: user.name || 'Admin' };
  }

  const record = await findRepRecord(user.role, user);
  if (!record) return null;

  if (user.role === 'CORPORATOR') {
    return {
      role: user.role,
      rep_type: 'CORPORATOR',
      rep_id: record.id,
      ward_id: record.ward_id,
      zone_id: record.wards?.zone_id || null,
      display_name: record.name,
      record,
    };
  }

  if (user.role === 'MLA') {
    return {
      role: user.role,
      rep_type: 'MLA',
      rep_id: record.id,
      zone_id: record.zone_id,
      display_name: record.name,
      record,
    };
  }

  if (user.role === 'MP') {
    return {
      role: user.role,
      rep_type: 'MP',
      rep_id: record.id,
      display_name: record.name,
      record,
    };
  }

  return null;
}

function applyIssueScope(query, identity) {
  if (!identity || identity.is_admin) return query;
  if (identity.rep_type === 'CORPORATOR') {
    let scoped = query.eq('corporator_id', identity.rep_id);
    return scoped;
  }
  if (identity.rep_type === 'MLA') {
    return identity.zone_id
      ? query.or(`mla_id.eq.${identity.rep_id},zone_id.eq.${identity.zone_id}`)
      : query.eq('mla_id', identity.rep_id);
  }
  if (identity.rep_type === 'MP') {
    return query.eq('mp_id', identity.rep_id);
  }
  return query;
}

function canManageIssue(identity, issue) {
  if (!identity || !issue) return false;
  if (identity.is_admin) return true;
  if (identity.rep_type === 'CORPORATOR') {
    return issue.corporator_id === identity.rep_id || issue.ward_id === identity.ward_id;
  }
  if (identity.rep_type === 'MLA') {
    return issue.mla_id === identity.rep_id || issue.zone_id === identity.zone_id;
  }
  if (identity.rep_type === 'MP') {
    return issue.mp_id === identity.rep_id;
  }
  return false;
}

function monthWindow(month, year) {
  const now = new Date();
  const m = Number(month) || now.getMonth() + 1;
  const y = Number(year) || now.getFullYear();
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { month: m, year: y, start: start.toISOString(), end: end.toISOString() };
}

function summarizeIssues(issues = []) {
  const resolved = issues.filter((issue) => issue.status === 'RESOLVED');
  const escalated = issues.filter((issue) => issue.escalated_at || String(issue.status || '').startsWith('ESCALATED'));
  const totalResolutionDays = resolved.reduce((sum, issue) => {
    if (!issue.resolved_at || !issue.created_at) return sum;
    return sum + ((new Date(issue.resolved_at) - new Date(issue.created_at)) / 86400000);
  }, 0);
  const now = Date.now();
  const slaBreaches = issues.filter((issue) => {
    if (!issue.sla_deadline) return false;
    const deadline = new Date(issue.sla_deadline).getTime();
    const closedAt = issue.resolved_at ? new Date(issue.resolved_at).getTime() : now;
    return closedAt > deadline;
  }).length;

  return {
    total_issues: issues.length,
    open_issues: issues.filter((issue) => ['OPEN', 'ASSIGNED'].includes(issue.status)).length,
    in_progress_issues: issues.filter((issue) => issue.status === 'IN_PROGRESS').length,
    resolved_issues: resolved.length,
    escalated_issues: escalated.length,
    sla_breaches: slaBreaches,
    total_upvotes: issues.reduce((sum, issue) => sum + (issue.upvote_count || 0), 0),
    resolution_rate: issues.length ? Math.round((resolved.length / issues.length) * 100) : 0,
    avg_resolution_days: resolved.length ? Number((totalResolutionDays / resolved.length).toFixed(1)) : 0,
  };
}

module.exports = {
  getRepresentativeIdentity,
  applyIssueScope,
  canManageIssue,
  monthWindow,
  summarizeIssues,
};
