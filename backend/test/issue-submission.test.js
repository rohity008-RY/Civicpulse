const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const express = require('express');

test('attachment outages do not lose a citizen report or create a false submission failure', async () => {
  const userId = randomUUID();
  const wardId = randomUUID();
  const tables = { issues: [], issue_history: [], issue_media: [] };
  const db = { from(table) {
    let action = 'select'; let value; const filters = [];
    const query = {
      select() { return this; },
      insert(payload) { action = 'insert'; value = payload; return this; },
      update(payload) { action = 'update'; value = payload; return this; },
      eq(key, expected) { filters.push(row => row[key] === expected); return this; },
      single() { return this.then(result => ({ data: result.data[0], error: result.error })); },
      then(resolve, reject) {
        const rows = tables[table] || [];
        if (action === 'insert') rows.push(...(Array.isArray(value) ? value : [value]));
        const matched = rows.filter(row => filters.every(predicate => predicate(row)));
        if (action === 'update') matched.forEach(row => Object.assign(row, value));
        return Promise.resolve({ data: matched.map(row => ({ ...row })), error: null }).then(resolve, reject);
      },
    };
    return query;
  } };
  const next = (req, res, next) => next();
  const geo = async () => ({ ward_id: wardId, city: 'QA', state_code: 'IN' });
  const mocks = [
    ['../src/config/supabase', db],
    ['../src/middleware/auth', { authenticate(req, res, next) { req.user = { id: userId, role: 'CITIZEN' }; next(); }, optionalAuth: next, isRep: next, isAdminOrMod: next }],
    ['../src/services/geoService', { resolveRepresentatives: geo, resolveRepresentativesByWard: geo, resolveRepresentativesByHierarchy: geo }],
    ['../src/services/slaService', { computeSlaDeadline: async () => new Date(Date.now() + 86400000).toISOString() }],
    ['../src/services/mediaService', { uploadMedia: async () => { throw new Error('QA simulated storage outage'); } }],
    ['../src/services/languageService', { resolveRequestLanguage: () => 'en', localizeIssues: async value => value, upsertOriginalTranslation: async () => {}, primeIssueTranslations: async () => {} }],
    ['../src/services/notificationService', { createNotification: async () => {}, notifyIssueOwner: async () => {}, notifyMappedRepresentatives: async () => {} }],
  ].map(([path, exports]) => { const id = require.resolve(path); const previous = require.cache[id]; require.cache[id] = { id, filename: id, loaded: true, exports }; return { id, previous }; });
  const routerId = require.resolve('../src/routes/issues');
  delete require.cache[routerId];
  const app = express(); app.use(express.json()); app.use('/issues', require(routerId));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/issues`;
  try {
    const data = new FormData();
    data.append('title', 'QA photo fallback'); data.append('description', 'Text must still be saved');
    data.append('category', 'OTHER'); data.append('ward_id', wardId);
    data.append('media', new Blob(['QA image bytes'], { type: 'image/png' }), 'qa.png');
    const response = await fetch(base, { method: 'POST', body: data });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.ok(body.media_warning);
    assert.equal(body.issue.title, 'QA photo fallback');
    assert.equal(tables.issues.length, 1);
    assert.equal(tables.issue_history.length, 1);
    assert.equal(tables.issue_media.length, 0);
    const typed = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'QA typed report', category: 'OTHER', ward_id: wardId, is_anonymous: true }) });
    assert.equal(typed.status, 201);
    assert.equal((await typed.json()).issue.is_anonymous, true);
    assert.equal(tables.issues.length, 2);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    delete require.cache[routerId];
    for (const entry of mocks) { if (entry.previous) require.cache[entry.id] = entry.previous; else delete require.cache[entry.id]; }
  }
});
