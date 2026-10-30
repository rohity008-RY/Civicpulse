const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID, createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

test('representatives cannot manage unrelated or null-mapped reports', () => {
  const dbId = require.resolve('../src/config/supabase');
  const previous = require.cache[dbId];
  require.cache[dbId] = { id: dbId, filename: dbId, loaded: true, exports: {} };
  const serviceId = require.resolve('../src/services/representativeService');
  delete require.cache[serviceId];
  try {
    const { canManageIssue } = require(serviceId);
    const issue = { corporator_id: null, ward_id: null, mla_id: null, zone_id: null, mp_id: null };
    assert.equal(canManageIssue({ rep_type: 'CORPORATOR', rep_id: 'corp', ward_id: null }, issue), false);
    assert.equal(canManageIssue({ rep_type: 'MLA', rep_id: 'mla', zone_id: null }, issue), false);
    assert.equal(canManageIssue({ rep_type: 'MP', rep_id: null }, issue), false);
    assert.equal(canManageIssue({ rep_type: 'CORPORATOR', rep_id: 'corp', ward_id: 'ward' }, { ...issue, ward_id: 'other' }), false);
    assert.equal(canManageIssue({ rep_type: 'CORPORATOR', rep_id: 'corp', ward_id: 'ward' }, { ...issue, ward_id: 'ward' }), true);
    assert.equal(canManageIssue({ rep_type: 'MLA', rep_id: 'mla', zone_id: 'zone' }, { ...issue, zone_id: 'zone' }), true);
    assert.equal(canManageIssue({ is_admin: true }, issue), true);
  } finally {
    delete require.cache[serviceId];
    if (previous) require.cache[dbId] = previous; else delete require.cache[dbId];
  }
});

test('onboarding validates wards, protects roles, authenticates citizens and rejects suspended Google accounts', async () => {
  const wardId = randomUUID();
  const users = [];
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-test-secret-not-a-production-credential';
  const db = {
    from(table) {
      const filters = [];
      let action = 'select';
      let payload;
      const query = {
        select() { return this; },
        eq(key, value) { filters.push(row => row[key] === value); return this; },
        insert(value) { action = 'insert'; payload = value; return this; },
        update(value) { action = 'update'; payload = value; return this; },
        single() { return this.then(result => ({ data: result.data[0] || null, error: result.error })); },
        maybeSingle() { return this.single(); },
        then(resolve, reject) {
          const rows = table === 'users' ? users : table === 'wards' ? [{ id: wardId }] : [];
          if (action === 'insert') rows.push({ session_version: 0, ...payload });
          const matches = rows.filter(row => filters.every(predicate => predicate(row)));
          if (action === 'update') matches.forEach(row => Object.assign(row, payload));
          return Promise.resolve({ data: matches.map(row => ({ ...row })), error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const mocks = [
    ['../src/config/supabase', db],
    ['../src/services/googleAuthService', { verifyGoogleIdToken: async token => {
      if (token !== 'verified-qa-google') throw Object.assign(new Error('Invalid Google credential'), { status: 401 });
      return { uid: 'qa-google', email: 'google-qa@example.com', name: 'QA Google Citizen' };
    } }],
  ].map(([path, exports]) => { const id = require.resolve(path); const previous = require.cache[id]; require.cache[id] = { id, filename: id, loaded: true, exports }; return { id, previous }; });
  const routesId = require.resolve('../src/routes/auth');
  const middlewareId = require.resolve('../src/middleware/auth');
  delete require.cache[routesId]; delete require.cache[middlewareId];
  const app = express();
  app.use(express.json());
  app.use('/auth', require(routesId));
  app.get('/private', require(middlewareId).authenticate, (req, res) => res.json({ id: req.user.id }));
  app.get('/optional', require(middlewareId).optionalAuth, (req, res) => res.json({ signedIn: Boolean(req.user) }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + '/auth' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const signup = { name: 'QA Citizen', email: 'qa+onboarding@example.com', password: 'CivicsPulse#QA2026', preferred_language: 'hi' };
  try {
    assert.equal((await post('/register', signup)).status, 400);
    assert.equal((await post('/register', { ...signup, home_ward_id: randomUUID() })).status, 400);
    const registered = await post('/register', { ...signup, home_ward_id: wardId, role: 'ADMIN', is_active: false });
    assert.equal(registered.status, 201);
    const account = await registered.json();
    assert.equal(account.user.role, 'CITIZEN');
    assert.equal(account.user.preferred_language, 'hi');
    assert.equal(account.user.home_ward_id, wardId);
    assert.equal(account.user.password_hash, undefined);
    assert.equal(users[0].is_active, true);
    assert.equal((await post('/register', { ...signup, home_ward_id: wardId })).status, 409);
    assert.equal((await post('/login', { email: signup.email })).status, 400);
    assert.equal((await post('/login', { email: signup.email, password: 'incorrect' })).status, 401);
    const login = await post('/login', { email: signup.email, password: signup.password, preferred_language: 'mr' });
    assert.equal(login.status, 200);
    const session = await login.json();
    assert.equal(session.user.preferred_language, 'mr');
    const headers = { Authorization: `Bearer ${session.token}` };
    assert.equal((await fetch(base + '/private', { headers })).status, 200);
    users[0].session_version = 1;
    assert.equal((await fetch(base + '/private', { headers })).status, 401);
    assert.equal((await fetch(base + '/optional', { headers })).status, 200);
    assert.equal((await (await fetch(base + '/optional', { headers })).json()).signedIn, false);
    assert.equal((await post('/social', { provider: 'google', id_token: 'invalid' })).status, 401);
    assert.equal((await post('/social', { provider: 'google', id_token: 'verified-qa-google' })).status, 422);
    assert.equal((await post('/social', { provider: 'google', id_token: 'verified-qa-google', home_ward_id: wardId })).status, 200);
    const googleUser = users.find(user => user.social_uid === 'qa-google');
    assert.equal(googleUser.role, 'CITIZEN');
    googleUser.is_active = false;
    assert.equal((await post('/social', { provider: 'google', id_token: 'verified-qa-google' })).status, 403);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    delete require.cache[routesId]; delete require.cache[middlewareId];
    for (const entry of mocks) { if (entry.previous) require.cache[entry.id] = entry.previous; else delete require.cache[entry.id]; }
    if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
  }
});

test('password resets are atomic, expire, revoke old sessions and are inaccessible to public database roles', { skip: !process.env.SUPABASE_DB_URL }, async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: true, ca: readFileSync(process.env.SUPABASE_CA_FILE, 'utf8') }, connectionTimeoutMillis: 15000 });
  await client.connect();
  const userId = randomUUID();
  const tokenHash = createHash('sha256').update(randomUUID()).digest('hex');
  const passwordHash = await bcrypt.hash('QA reset-only password', 10);
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO users(id,name,email,role,is_active) VALUES ($1,$2,$3,$4,true)', [userId, 'QA rollback-only reset', `${userId}@example.com`, 'CITIZEN']);
    await client.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour')", [userId, tokenHash]);
    assert.equal((await client.query('SELECT complete_password_reset($1,$2) AS id', [tokenHash, passwordHash])).rows[0].id, userId);
    const account = (await client.query('SELECT password_hash,session_version FROM users WHERE id=$1', [userId])).rows[0];
    assert.equal(account.session_version, 1);
    assert.ok(await bcrypt.compare('QA reset-only password', account.password_hash));
    await client.query('SAVEPOINT reused');
    await assert.rejects(client.query('SELECT complete_password_reset($1,$2)', [tokenHash, passwordHash]));
    await client.query('ROLLBACK TO SAVEPOINT reused');
    const expired = createHash('sha256').update(randomUUID()).digest('hex');
    await client.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES ($1,$2,NOW()-INTERVAL '1 minute')", [userId, expired]);
    await client.query('SAVEPOINT expired');
    await assert.rejects(client.query('SELECT complete_password_reset($1,$2)', [expired, passwordHash]));
    await client.query('ROLLBACK TO SAVEPOINT expired');
    assert.equal((await client.query("SELECT has_table_privilege('anon','password_reset_tokens','SELECT') AS allowed")).rows[0].allowed, false);
    assert.equal((await client.query("SELECT has_function_privilege('anon','complete_password_reset(text,text)','EXECUTE') AS allowed")).rows[0].allowed, false);
  } finally { await client.query('ROLLBACK'); await client.end(); }
});
