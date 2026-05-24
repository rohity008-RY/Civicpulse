const supabase = require('../config/supabase');
const cron = require('node-cron');
const logger = require('../utils/logger');

// ─── Compute SLA deadline for a new issue ────────────────────
async function computeSlaDeadline(ward_id, category) {
  // Ward-specific config wins over global (NULL ward_id)
  const { data: config } = await supabase
    .from('sla_config')
    .select('sla_minutes, sla_value, sla_unit')
    .eq('category', category)
    .eq('is_active', true)
    .or(`ward_id.eq.${ward_id},ward_id.is.null`)
    .order('ward_id', { nullsFirst: false }) // ward-specific first
    .limit(1)
    .maybeSingle();

  const minutes = config?.sla_minutes || 7 * 24 * 60; // fallback 7 days
  const deadline = new Date(Date.now() + minutes * 60 * 1000);
  return deadline.toISOString();
}

// ─── Format SLA for display ───────────────────────────────────
function formatSlaDisplay(sla_deadline) {
  const now = new Date();
  const deadline = new Date(sla_deadline);
  const diffMs = deadline - now;

  if (diffMs < 0) {
    const overdue = Math.abs(diffMs);
    const days = Math.floor(overdue / (1000 * 60 * 60 * 24));
    const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { overdue: true, text: days > 0 ? `${days}d ${hours}h overdue` : `${hours}h overdue` };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) return { overdue: false, text: `${months} month${months > 1 ? 's' : ''} left` };
  if (days > 0)   return { overdue: false, text: `${days} day${days > 1 ? 's' : ''} left` };
  return { overdue: false, text: `${hours}h left` };
}

module.exports = { computeSlaDeadline, formatSlaDisplay };
