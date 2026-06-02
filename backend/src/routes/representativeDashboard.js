const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveRequestLanguage, localizeIssues } = require('../services/languageService');
const {
  getRepresentativeIdentity,
  applyIssueScope,
  monthWindow,
  summarizeIssues,
} = require('../services/representativeService');
const { buildCsv, buildPdf } = require('../services/reportExportService');

const isRepresentative = requireRole('CORPORATOR', 'MLA', 'MP', 'ADMIN');

router.use(authenticate, isRepresentative);

async function requireIdentity(req, res) {
  const identity = await getRepresentativeIdentity(req.user);
  if (!identity) {
    res.status(403).json({
      error: 'Representative account is not linked to an active corporator/MLA record yet. Ask admin to link it.',
      code: 'REP_NOT_LINKED',
    });
    return null;
  }
  return identity;
}

function baseIssueQuery() {
  return supabase.from('issues').select(`
    id, title, description, category, status, location_label, created_at, updated_at,
    original_language, state_code, state_name, city, ward_number, ward_id, zone_id,
    corporator_id, mla_id, mp_id, upvote_count, comment_count, share_count,
    trending_score, escalated_at, sla_deadline, resolved_at,
    users(name, avatar_url),
    wards(name, ward_number, city, state_name),
    corporators(id, name, party, photo_url),
    mlas(id, name, party, photo_url)
  `);
}

async function getScopedIssues(identity, { status, month, year, limit = 100 } = {}) {
  const window = month || year ? monthWindow(month, year) : null;
  let query = applyIssueScope(baseIssueQuery(), identity)
    .neq('status', 'CLOSED')
    .order('created_at', { ascending: false })
    .limit(Number(limit) || 100);

  if (status) query = query.eq('status', status);
  if (window) query = query.gte('created_at', window.start).lt('created_at', window.end);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getRequestWithIdentity(id, user) {
  const { data: request, error } = await supabase
    .from('report_card_requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  if (user.role !== 'ADMIN' && request.requester_id !== user.id) {
    const denied = new Error('Access denied');
    denied.status = 403;
    throw denied;
  }

  const identity = user.role === 'ADMIN'
    ? {
        rep_type: request.rep_type,
        rep_id: request.rep_id,
        display_name: request.scope?.display_name || request.rep_type,
        ward_id: request.scope?.ward_id || null,
        zone_id: request.scope?.zone_id || null,
      }
    : await getRepresentativeIdentity(user);

  return { request, identity };
}

router.get('/me', async (req, res) => {
  try {
    const identity = await requireIdentity(req, res);
    if (!identity) return;
    const issues = await getScopedIssues(identity, { limit: 200 });
    res.json({ identity, stats: summarizeIssues(issues) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/me/issues', async (req, res) => {
  try {
    const identity = await requireIdentity(req, res);
    if (!identity) return;
    const issues = await getScopedIssues(identity, req.query);
    const languageCode = resolveRequestLanguage(req);
    const localizedIssues = await localizeIssues(issues, languageCode);
    res.json({ identity, issues: localizedIssues, stats: summarizeIssues(issues), language_code: languageCode });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/me/report-card-requests', async (req, res) => {
  try {
    const identity = await requireIdentity(req, res);
    if (!identity) return;
    const { data, error } = await supabase
      .from('report_card_requests')
      .select('*')
      .eq('requester_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ requests: data || [] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/me/report-card-requests', async (req, res) => {
  try {
    const identity = await requireIdentity(req, res);
    if (!identity) return;
    const window = monthWindow(req.body.month, req.body.year);
    const { data, error } = await supabase.from('report_card_requests').insert({
      id: uuidv4(),
      requester_id: req.user.id,
      requester_role: req.user.role,
      rep_type: identity.rep_type,
      rep_id: identity.rep_id,
      scope: {
        display_name: identity.display_name,
        ward_id: identity.ward_id || null,
        zone_id: identity.zone_id || null,
      },
      month: window.month,
      year: window.year,
      format: 'PDF_CSV',
      status: 'REQUESTED',
    }).select().single();
    if (error) throw error;
    res.status(201).json({ request: data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/report-card-requests/:id/export/:format', async (req, res) => {
  try {
    const { request, identity } = await getRequestWithIdentity(req.params.id, req.user);
    if (request.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Report card is not approved yet' });
    }

    const issues = await getScopedIssues(identity, {
      month: request.month,
      year: request.year,
      limit: 1000,
    });
    const stats = summarizeIssues(issues);
    const filename = `civicspulse-report-card-${request.month}-${request.year}-${request.id}`;

    if (req.params.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(buildCsv({ request, identity, stats, issues }));
    }

    if (req.params.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(buildPdf({ request, identity, stats, issues }));
    }

    return res.status(400).json({ error: 'Export format must be pdf or csv' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
