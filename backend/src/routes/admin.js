const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, isAdmin, isAdminOrMod } = require('../middleware/auth');

const IMPORT_HEADERS = [
  'state_code', 'state_name', 'city', 'zone_name', 'ward_number', 'ward_name',
  'corporator_name', 'corporator_party', 'corporator_phone', 'corporator_email',
  'mla_name', 'mla_party', 'mla_constituency', 'mla_phone', 'mla_email',
  'term_start', 'term_end', 'source_url'
];

const todayIso = () => new Date().toISOString().slice(0, 10);
const clean = (value) => String(value ?? '').trim();
const upper = (value) => clean(value).toUpperCase();

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  cells.push(value);
  return cells.map(clean);
}

function parseCsv(text) {
  const lines = clean(text).split(/\r?\n/).filter((line) => clean(line) && !clean(line).startsWith('#'));
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
  });
}

function normalizeImportRows(body) {
  if (Array.isArray(body.rows)) return body.rows;
  const raw = body.csv || body.data || body.text || '';
  if (Array.isArray(raw)) return raw;
  if (body.format === 'json') {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.rows || [];
  }
  return parseCsv(raw);
}

function normalizeRepRow(row) {
  const normalized = {};
  IMPORT_HEADERS.forEach((key) => { normalized[key] = clean(row[key]); });

  normalized.state_code = upper(row.state_code || row.state || row.state_abbr || 'MH') || 'MH';
  normalized.state_name = clean(row.state_name || row.state || 'Maharashtra') || 'Maharashtra';
  normalized.city = clean(row.city || row.municipality || row.local_body || 'Mumbai') || 'Mumbai';
  normalized.zone_name = clean(row.zone_name || row.zone || row.assembly_constituency || row.mla_constituency || normalized.city);
  normalized.ward_number = clean(row.ward_number || row.ward_no || row.ward || row.ward_code);
  normalized.ward_name = clean(row.ward_name || row.ward_area || row.name || normalized.ward_number);
  normalized.corporator_name = clean(row.corporator_name || row.corporator || row.councillor_name || row.councillor);
  normalized.corporator_party = clean(row.corporator_party || row.party || row.councillor_party);
  normalized.mla_name = clean(row.mla_name || row.mla);
  normalized.mla_party = clean(row.mla_party || row.assembly_party);
  normalized.mla_constituency = clean(row.mla_constituency || row.constituency || row.assembly_constituency || normalized.zone_name);
  normalized.term_start = clean(row.term_start || row.corporator_term_start || row.mla_term_start || todayIso());
  normalized.term_end = clean(row.term_end || row.corporator_term_end || row.mla_term_end);
  normalized.source_url = clean(row.source_url || row.source || '');
  return normalized;
}

async function findOrCreateZone(row, sourceUrl) {
  const { data: existing } = await supabase
    .from('zones')
    .select('id, name, city, state_code, state_name, mla_id, mp_id')
    .eq('state_code', row.state_code)
    .ilike('city', row.city)
    .ilike('name', row.zone_name)
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase.from('zones').insert({
    id: uuidv4(),
    state_code: row.state_code,
    state_name: row.state_name,
    city: row.city,
    name: row.zone_name,
    source_url: sourceUrl || row.source_url || null,
  }).select('id, name, city, state_code, state_name, mla_id, mp_id').single();
  if (error) throw error;
  return data;
}

async function findOrCreateWard(row, zone, sourceUrl) {
  let query = supabase
    .from('wards')
    .select('id, name, ward_number, city, state_code, state_name, zone_id')
    .eq('zone_id', zone.id)
    .limit(1);

  if (row.ward_number) query = query.ilike('ward_number', row.ward_number);
  else query = query.ilike('name', row.ward_name);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    await supabase.from('wards').update({
      state_code: row.state_code,
      state_name: row.state_name,
      city: row.city,
      name: row.ward_name || existing.name,
      ward_number: row.ward_number || existing.ward_number,
      source_url: sourceUrl || row.source_url || existing.source_url || null,
      updated_at: new Date(),
    }).eq('id', existing.id);
    return { ...existing, state_code: row.state_code, state_name: row.state_name, city: row.city };
  }

  const { data, error } = await supabase.from('wards').insert({
    id: uuidv4(),
    zone_id: zone.id,
    state_code: row.state_code,
    state_name: row.state_name,
    city: row.city,
    name: row.ward_name || row.ward_number,
    ward_number: row.ward_number || null,
    source_url: sourceUrl || row.source_url || null,
  }).select('id, name, ward_number, city, state_code, state_name, zone_id').single();
  if (error) throw error;
  return data;
}

async function importRepresentatives(rows, { actor, format, sourceUrl }) {
  const errors = [];
  let imported = 0;
  const mlaCache = new Map();

  for (const [index, rawRow] of rows.entries()) {
    try {
      const row = normalizeRepRow(rawRow);
      if (!row.city || (!row.ward_number && !row.ward_name)) {
        throw new Error('city and ward_number/ward_name required');
      }
      if (!row.corporator_name && !row.mla_name) {
        throw new Error('corporator_name or mla_name required');
      }

      const zone = await findOrCreateZone(row, sourceUrl);
      const ward = await findOrCreateWard(row, zone, sourceUrl);

      if (row.corporator_name) {
        await supabase.from('corporators')
          .update({ is_active: false, updated_at: new Date() })
          .eq('ward_id', ward.id)
          .eq('is_active', true);

        const { error } = await supabase.from('corporators').insert({
          id: uuidv4(),
          ward_id: ward.id,
          name: row.corporator_name,
          party: row.corporator_party || null,
          phone: row.corporator_phone || null,
          email: row.corporator_email || null,
          term_start: row.term_start,
          term_end: row.term_end || null,
          is_active: true,
          injected_by: actor.id,
          source_url: sourceUrl || row.source_url || null,
          data_source: sourceUrl ? 'URL_IMPORT' : 'ADMIN_UPLOAD',
        });
        if (error) throw error;
      }

      if (row.mla_name) {
        const cacheKey = `${zone.id}:${row.mla_name}:${row.mla_constituency}`;
        let mlaId = mlaCache.get(cacheKey);
        if (!mlaId) {
          await supabase.from('mlas')
            .update({ is_active: false, updated_at: new Date() })
            .eq('zone_id', zone.id)
            .eq('is_active', true);

          const { data: mla, error } = await supabase.from('mlas').insert({
            id: uuidv4(),
            zone_id: zone.id,
            state_code: row.state_code,
            state_name: row.state_name,
            city: row.city,
            name: row.mla_name,
            party: row.mla_party || null,
            constituency: row.mla_constituency,
            phone: row.mla_phone || null,
            email: row.mla_email || null,
            term_start: row.term_start,
            term_end: row.term_end || null,
            is_active: true,
            injected_by: actor.id,
            source_url: sourceUrl || row.source_url || null,
            data_source: sourceUrl ? 'URL_IMPORT' : 'ADMIN_UPLOAD',
          }).select('id').single();
          if (error) throw error;
          mlaId = mla.id;
          mlaCache.set(cacheKey, mlaId);
        }
        await supabase.from('zones').update({ mla_id: mlaId, updated_at: new Date() }).eq('id', zone.id);
      }

      imported += 1;
    } catch (err) {
      errors.push({ row: index + 2, error: err.message });
    }
  }

  const { data: batch } = await supabase.from('rep_import_batches').insert({
    actor_id: actor.id,
    actor_role: actor.role,
    source_url: sourceUrl || null,
    format,
    rows_received: rows.length,
    rows_imported: imported,
    rows_failed: errors.length,
    errors,
  }).select().single();

  return { batch, rows_received: rows.length, rows_imported: imported, rows_failed: errors.length, errors };
}

// All admin routes require authentication
router.use(authenticate);

// ─── REPRESENTATIVES ──────────────────────────────────────────

// GET all corporators
router.get('/reps/corporators', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('corporators')
    .select('*, wards(name, zone_id, zones(name))').order('injected_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ corporators: data });
});

// POST inject corporator
router.post('/reps/corporators', isAdmin, async (req, res) => {
  try {
    const { ward_id, name, party, phone, email, photo_url, term_start, term_end } = req.body;
    if (!ward_id || !name || !term_start)
      return res.status(400).json({ error: 'ward_id, name, term_start required' });

    // Deactivate existing active corporator for this ward
    await supabase.from('corporators').update({ is_active: false }).eq('ward_id', ward_id).eq('is_active', true);

    const { data, error } = await supabase.from('corporators').insert({
      id: uuidv4(), ward_id, name, party, phone, email, photo_url,
      term_start, term_end, is_active: true, injected_by: req.user.id
    }).select('*, wards(name)').single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_log').insert({
      actor_id: req.user.id, actor_role: req.user.role,
      action: 'CORPORATOR_INJECTED', target_type: 'corporator',
      target_id: data.id, metadata: { name, ward_id }
    });

    res.status(201).json({ corporator: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update corporator
router.put('/reps/corporators/:id', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('corporators')
    .update({ ...req.body, updated_at: new Date() }).eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ corporator: data });
});

// POST bulk import representatives from CSV/JSON pasted or uploaded by admin
router.post('/reps/import', isAdmin, async (req, res) => {
  try {
    const format = req.body.format || (Array.isArray(req.body.rows) ? 'json' : 'csv');
    const rows = normalizeImportRows(req.body);
    if (!rows.length) return res.status(400).json({ error: 'No import rows found' });

    const result = await importRepresentatives(rows, {
      actor: req.user,
      format,
      sourceUrl: req.body.source_url || null,
    });

    await supabase.from('audit_log').insert({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'REPRESENTATIVES_IMPORTED',
      target_type: 'rep_import_batch',
      target_id: result.batch?.id,
      metadata: result,
    });

    res.status(result.rows_failed ? 207 : 201).json({ import: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST import representatives from a direct CSV/JSON URL controlled by admin
router.post('/reps/import-url', isAdmin, async (req, res) => {
  try {
    const { url, format = 'csv' } = req.body;
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Valid http(s) url required' });

    const response = await fetch(url);
    if (!response.ok) return res.status(400).json({ error: `Source returned ${response.status}` });
    const text = await response.text();
    const rows = format === 'json'
      ? normalizeImportRows({ format: 'json', data: text })
      : parseCsv(text);

    if (!rows.length) return res.status(400).json({ error: 'No rows found at source URL' });
    const result = await importRepresentatives(rows, { actor: req.user, format, sourceUrl: url });
    res.status(result.rows_failed ? 207 : 201).json({ import: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reps/imports', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('rep_import_batches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ imports: data });
});

// POST inject MLA
router.post('/reps/mlas', isAdmin, async (req, res) => {
  try {
    const { zone_id, name, party, constituency, phone, email, photo_url, term_start } = req.body;
    await supabase.from('mlas').update({ is_active: false }).eq('zone_id', zone_id).eq('is_active', true);

    const { data, error } = await supabase.from('mlas').insert({
      id: uuidv4(), zone_id, name, party, constituency, phone, email, photo_url,
      term_start, is_active: true, injected_by: req.user.id
    }).select().single();

    if (error) throw error;
    // Update zone mla_id
    await supabase.from('zones').update({ mla_id: data.id }).eq('id', zone_id);

    res.status(201).json({ mla: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST inject MP
router.post('/reps/mps', isAdmin, async (req, res) => {
  try {
    const { zone_ids, name, party, constituency, phone, email, photo_url, term_start } = req.body;
    const { data, error } = await supabase.from('mps').insert({
      id: uuidv4(), name, party, constituency, phone, email, photo_url,
      term_start, is_active: true, injected_by: req.user.id
    }).select().single();
    if (error) throw error;

    if (zone_ids?.length) {
      await supabase.from('zones').update({ mp_id: data.id }).in('id', zone_ids);
    }
    res.status(201).json({ mp: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SLA CONFIG ───────────────────────────────────────────────

router.get('/sla', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('sla_config')
    .select('*, wards(name)').eq('is_active', true).order('category');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sla_configs: data });
});

router.post('/sla', isAdmin, async (req, res) => {
  try {
    const { ward_id, category, sla_value, sla_unit, escalation_rep } = req.body;
    const { data, error } = await supabase.from('sla_config').insert({
      id: uuidv4(), ward_id: ward_id || null, category, sla_value,
      sla_unit, escalation_rep: escalation_rep || 'MLA',
      is_active: true, created_by: req.user.id
    }).select().single();
    if (error) throw error;
    res.status(201).json({ sla: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sla/:id', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('sla_config')
    .update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sla: data });
});

// ─── ANALYTICS (Admin + Moderator view) ──────────────────────

router.get('/analytics/overview', isAdminOrMod, async (req, res) => {
  try {
    const [total, open, escalated, resolved, trending] = await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).not('escalated_at', 'is', null),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).gt('trending_score', 10),
    ]);

    const { data: categoryBreakdown } = await supabase.rpc('get_category_breakdown').maybeSingle()
      || { data: null };

    const { data: recentIssues } = await supabase.from('issues')
      .select('id, title, category, status, trending_score, upvote_count, created_at, wards(name)')
      .order('created_at', { ascending: false }).limit(10);

    res.json({
      stats: {
        total: total.count,
        open: open.count,
        escalated: escalated.count,
        resolved: resolved.count,
        trending: trending.count,
        resolution_rate: total.count ? Math.round((resolved.count / total.count) * 100) : 0
      },
      recent_issues: recentIssues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Zone-wise performance
router.get('/analytics/zones', isAdminOrMod, async (req, res) => {
  try {
    const { data, error } = await supabase.from('zones').select(`
      id, name,
      wards(id, name,
        issues(id, status, created_at, resolved_at, escalated_at)
      )
    `);
    if (error) throw error;

    const zoneStats = data.map(zone => {
      const allIssues = zone.wards.flatMap(w => w.issues);
      const resolved = allIssues.filter(i => i.status === 'RESOLVED');
      const escalated = allIssues.filter(i => i.escalated_at);
      return {
        id: zone.id, name: zone.name,
        total: allIssues.length,
        resolved: resolved.length,
        escalated: escalated.length,
        resolution_rate: allIssues.length
          ? Math.round((resolved.length / allIssues.length) * 100) : 0
      };
    });
    res.json({ zones: zoneStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit log (admin only)
router.get('/audit-log', isAdmin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const { data, error } = await supabase.from('audit_log')
    .select('*, users(name, role)')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ logs: data });
});

// User management
router.get('/users', isAdmin, async (req, res) => {
  const { page = 1, limit = 50, role } = req.query;
  let query = supabase.from('users').select('id, name, email, phone, role, is_active, created_at')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (role) query = query.eq('role', role);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

router.put('/users/:id/role', isAdmin, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['CITIZEN','CORPORATOR','MLA','MP','MODERATOR','ADMIN'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const { data, error } = await supabase.from('users')
    .update({ role }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

router.post('/reps/link-user', isAdmin, async (req, res) => {
  try {
    const { user_id, email, role, rep_type, rep_id } = req.body;
    const targetRole = role || rep_type;
    const validRoles = ['CORPORATOR','MLA','MP'];
    if (!validRoles.includes(targetRole)) return res.status(400).json({ error: 'role must be CORPORATOR, MLA, or MP' });
    if (!rep_id) return res.status(400).json({ error: 'rep_id required' });
    if (!user_id && !email) return res.status(400).json({ error: 'user_id or email required' });

    let userQuery = supabase.from('users').select('*');
    if (user_id) userQuery = userQuery.eq('id', user_id);
    else userQuery = userQuery.ilike('email', email);
    const { data: user, error: userError } = await userQuery.limit(1).maybeSingle();
    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: 'User not found. Ask them to sign up first, then link here.' });

    const table = targetRole === 'CORPORATOR' ? 'corporators' : targetRole === 'MLA' ? 'mlas' : 'mps';
    const repUpdates = { user_id: user.id };
    if (table !== 'mps') repUpdates.updated_at = new Date();
    const { data: rep, error: repError } = await supabase
      .from(table)
      .update(repUpdates)
      .eq('id', rep_id)
      .select('*')
      .single();
    if (repError) throw repError;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: targetRole })
      .eq('id', user.id)
      .select('id, name, email, phone, role, is_active, created_at')
      .single();
    if (updateError) throw updateError;

    await supabase.from('audit_log').insert({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: 'REP_USER_LINKED',
      target_type: table,
      target_id: rep.id,
      metadata: { user_id: user.id, role: targetRole },
    });

    res.json({ user: updatedUser, representative: rep, rep_type: targetRole });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reps/mlas', isAdmin, async (req, res) => {
  const { data, error } = await supabase.from('mlas')
    .select('*, zones(name, city, state_name)')
    .order('injected_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ mlas: data });
});

router.get('/report-card-requests', isAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('report_card_requests')
    .select('*, users(name, email, role)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ requests: data || [] });
});

router.put('/report-card-requests/:id', isAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const nextStatus = status === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const updates = {
      status: nextStatus,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      updated_at: new Date(),
    };
    if (nextStatus === 'REJECTED') updates.review_note = note || 'Rejected by admin';
    const { data, error } = await supabase
      .from('report_card_requests')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;

    await supabase.from('audit_log').insert({
      actor_id: req.user.id,
      actor_role: req.user.role,
      action: `REPORT_CARD_${nextStatus}`,
      target_type: 'report_card_request',
      target_id: data.id,
      metadata: { note: note || null },
    });

    res.json({ request: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
