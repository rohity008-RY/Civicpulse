const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');

test('following routes bind every write to the signed-in citizen and exclude hidden reports', async () => {
  const userA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const issueId = '11111111-1111-4111-8111-111111111111';
  const hiddenId = '22222222-2222-4222-8222-222222222222';
  const issues = [{ id: issueId, moderation_status: 'VISIBLE' }, { id: hiddenId, moderation_status: 'HIDDEN' }];
  let followers = [];
  const fake = {
    from(table) {
      let action = 'select';
      let payload;
      const tests = [];
      const query = {
        select() { return this; }, order() { return this; }, limit() { return this; },
        eq(key, value) { tests.push(row => row[key] === value); return this; },
        in(key, values) { tests.push(row => key === 'issues.moderation_status' ? values.includes(issues.find(issue => issue.id === row.issue_id)?.moderation_status) : values.includes(row[key])); return this; },
        upsert(value) { action = 'upsert'; payload = value; return this; },
        delete() { action = 'delete'; return this; },
        maybeSingle() { return this.then(result => ({ data: result.data[0] || null, error: null })); },
        then(resolve, reject) {
          if (table === 'issue_followers' && action === 'upsert' && !followers.some(row => row.user_id === payload.user_id && row.issue_id === payload.issue_id)) followers.push(payload);
          if (table === 'issue_followers' && action === 'delete') followers = followers.filter(row => !tests.every(predicate => predicate(row)));
          const rows = table === 'issues' ? issues : table === 'issue_followers' ? followers : [];
          const data = rows.filter(row => tests.every(predicate => predicate(row))).map(row => table === 'issue_followers' ? { ...row, issues: issues.find(issue => issue.id === row.issue_id) } : row);
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const mocks = [
    ['../src/config/supabase', fake],
    ['../src/middleware/auth', { authenticate(req, res, next) { if (!req.headers['x-qa-user']) return res.status(401).json({ error: 'Authentication required' }); req.user = { id: req.headers['x-qa-user'] }; next(); } }],
    ['../src/services/languageService', { resolveRequestLanguage: () => 'en', localizeIssues: async value => value }],
  ].map(([path, exports]) => { const id = require.resolve(path); const previous = require.cache[id]; require.cache[id] = { id, filename: id, loaded: true, exports }; return { id, previous }; });
  const routerId = require.resolve('../src/routes/community');
  delete require.cache[routerId];
  const app = express();
  app.use(express.json());
  app.use('/community', require(routerId));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/community`;
  const request = (path, method = 'GET', user = userA, body = {}) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(user ? { 'x-qa-user': user } : {}) }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) });
  try {
    assert.equal((await request('/following', 'GET', null)).status, 401);
    assert.equal((await request('/issues/not-an-id/follow', 'POST')).status, 400);
    assert.equal((await request(`/issues/${hiddenId}/follow`, 'POST')).status, 404);
    assert.equal((await request(`/issues/${issueId}/follow`, 'POST', userA, { user_id: userB })).status, 200);
    assert.equal(followers[0].user_id, userA);
    assert.equal((await request(`/issues/${issueId}/follow`, 'POST')).status, 200);
    assert.equal(followers.length, 1);
    assert.equal((await request(`/issues/${issueId}/follow`, 'DELETE', userB)).status, 200);
    assert.equal(followers.length, 1);
    const list = await (await request('/following')).json();
    assert.deepEqual(list.issue_ids, [issueId]);
    assert.equal((await request('/preferences', 'PUT', userA, { email_digest: 'true' })).status, 400);
    assert.equal((await request(`/issues/${issueId}/follow`, 'DELETE')).status, 200);
    assert.equal(followers.length, 0);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    delete require.cache[routerId];
    for (const entry of mocks) { if (entry.previous) require.cache[entry.id] = entry.previous; else delete require.cache[entry.id]; }
  }
});
