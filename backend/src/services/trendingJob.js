const cron = require('node-cron');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

async function recalculateTrending() {
  logger.info('Running trending score recalculation...');
  try {
    // Get recently active issues (updated in last 30 min)
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: issues, error } = await supabase
      .from('issues')
      .select('id, upvote_count, comment_count, share_count, status, created_at, escalated_at, escalated_to_mp_at, updated_at')
      .neq('status', 'CLOSED')
      .gt('updated_at', cutoff);

    if (error) throw error;
    if (!issues?.length) return;

    const updates = issues.map(issue => {
      const base = (issue.upvote_count * 3) + (issue.comment_count * 2) + issue.share_count;

      const escalationMult = issue.escalated_to_mp_at ? 3.5
        : issue.escalated_at ? 2.0
        : issue.is_community_spotlight ? 1.5 : 1.0;

      const hoursAgo = Math.max(
        (Date.now() - new Date(issue.updated_at).getTime()) / (1000 * 60 * 60),
        0
      );
      const recencyDecay = 1 / Math.pow(hoursAgo + 2, 1.5);
      const zoneReach = 1; // simplified — full version queries distinct zones of upvoters

      const score = Math.round(base * escalationMult * recencyDecay * zoneReach * 100) / 100;

      return { id: issue.id, trending_score: score };
    });

    // Batch update
    for (const u of updates) {
      await supabase.from('issues').update({ trending_score: u.trending_score }).eq('id', u.id);
    }

    logger.info(`Updated trending scores for ${updates.length} issues`);
  } catch (err) {
    logger.error('Trending job error:', err.message);
  }
}

function startTrendingJob() {
  cron.schedule('*/15 * * * *', recalculateTrending);
  logger.info('Trending job started (every 15 min)');
}

module.exports = { startTrendingJob };
