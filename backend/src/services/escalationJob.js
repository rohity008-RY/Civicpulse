const cron = require('node-cron');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function runEscalation() {
  logger.info('Running escalation check...');
  try {
    // Find all issues past SLA, not yet resolved/closed
    const { data: overdueIssues, error } = await supabase
      .from('issues')
      .select(`id, title, user_id, ward_id, zone_id,
               corporator_id, mla_id, mp_id, status,
               sla_deadline, escalated_at,
               sla_config:ward_id(sla_minutes, escalation_rep)`)
      .not('status', 'in', '("RESOLVED","CLOSED","ESCALATED_TO_MLA","ESCALATED_TO_MP")')
      .lt('sla_deadline', new Date().toISOString())
      .not('sla_deadline', 'is', null);

    if (error) throw error;
    if (!overdueIssues?.length) return logger.info('No overdue issues found.');

    logger.info(`Found ${overdueIssues.length} overdue issues`);

    for (const issue of overdueIssues) {
      await escalateIssue(issue);
    }

    // Second escalation: MLA-escalated issues past secondary SLA (3 days default)
    const { data: mlaOverdue } = await supabase
      .from('issues')
      .select('id, title, user_id, mp_id, mla_id, escalated_at')
      .eq('status', 'ESCALATED_TO_MLA')
      .lt('escalated_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

    if (mlaOverdue?.length) {
      for (const issue of mlaOverdue) {
        if (issue.mp_id) await escalateToMP(issue);
      }
    }
  } catch (err) {
    logger.error('Escalation job error:', err.message);
  }
}

async function escalateIssue(issue) {
  const { error } = await supabase.from('issues').update({
    status: 'ESCALATED_TO_MLA',
    escalated_at: new Date().toISOString(),
    escalated_to_role: 'MLA',
    escalated_to_id: issue.mla_id,
    updated_at: new Date().toISOString()
  }).eq('id', issue.id);

  if (error) return logger.error(`Failed to escalate issue ${issue.id}: ${error.message}`);

  await supabase.from('issue_history').insert({
    issue_id: issue.id, action: 'ESCALATED_TO_MLA',
    actor_id: null, actor_role: 'SYSTEM',
    note: 'SLA breach — auto-escalated to MLA'
  });

  logger.info(`Issue ${issue.id} escalated to MLA`);
}

async function escalateToMP(issue) {
  await supabase.from('issues').update({
    status: 'ESCALATED_TO_MP',
    escalated_to_mp_at: new Date().toISOString(),
    escalated_to_role: 'MP',
    escalated_to_id: issue.mp_id,
    updated_at: new Date().toISOString()
  }).eq('id', issue.id);

  await supabase.from('issue_history').insert({
    issue_id: issue.id, action: 'ESCALATED_TO_MP',
    actor_id: null, actor_role: 'SYSTEM',
    note: 'MLA SLA breach — escalated to MP'
  });

  logger.info(`Issue ${issue.id} escalated to MP`);
}

function startEscalationJob() {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', runEscalation);
  logger.info('Escalation job started (every 15 min)');
}

module.exports = { startEscalationJob };
