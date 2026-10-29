const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const wkx = require('wkx');
const { Client } = require('pg');
const { parsePoint } = require('../src/services/pointService');

test('map coordinates decode GeoJSON, WKT, WKB and PostGIS EWKB consistently', () => {
  const point = new wkx.Point(72.8777, 19.076);
  point.srid = 4326;
  for (const input of [point.toGeoJSON(), point.toWkt(), point.toWkb(), point.toEwkb().toString('hex'), `\\x${point.toEwkb().toString('hex')}`]) {
    assert.deepEqual(parsePoint(input), { lat: 19.076, lng: 72.8777 });
  }
});

test('missing, malformed, out-of-range and non-point geometry never become invented map pins', () => {
  for (const input of [null, '', 'not a location', 'POINT(10 120)', { type: 'Point', coordinates: [181, 0] }, { type: 'LineString', coordinates: [[1, 2], [3, 4]] }]) {
    assert.deepEqual(parsePoint(input), { lat: null, lng: null });
  }
  assert.deepEqual(parsePoint('POINT(0 0)'), { lat: 0, lng: 0 });
});

test('private citizen APIs reject unsigned and invalid sessions', { skip: !process.env.TEST_API_BASE }, async () => {
  for (const path of ['/api/community/following', '/api/community/preferences', '/api/community/activity']) {
    assert.equal((await fetch(process.env.TEST_API_BASE + path)).status, 401, path);
    assert.equal((await fetch(process.env.TEST_API_BASE + path, { headers: { Authorization: 'Bearer invalid' } })).status, 401, path);
  }
});

test('public feed, ward filter and real map return usable data', { skip: !process.env.TEST_API_BASE }, async () => {
  const base = process.env.TEST_API_BASE;
  const response = await fetch(`${base}/api/feed/home`);
  assert.equal(response.status, 200);
  const feed = await response.json();
  assert.ok(Array.isArray(feed.issues));
  assert.ok(feed.issues.filter(issue => issue.is_anonymous).every(issue => issue.users === null));
  const withWard = feed.issues.find(issue => issue.ward_id);
  if (withWard) {
    const filtered = await fetch(`${base}/api/feed/home?ward_id=${withWard.ward_id}`).then(r => r.json());
    assert.ok(filtered.issues.every(issue => issue.ward_id === withWard.ward_id));
  }
  const map = await fetch(`${base}/api/feed/map?limit=200`).then(r => r.json());
  assert.ok(Array.isArray(map.points));
  assert.ok(map.points.every(point => (point.lat === null && point.lng === null) || (Number.isFinite(point.lat) && Number.isFinite(point.lng) && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180)));
});

test('follows are unique and repair confirmation enforces ownership and one-time atomic history', { skip: !process.env.SUPABASE_DB_URL }, async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: true, ca: readFileSync(process.env.SUPABASE_CA_FILE, 'utf8') }, connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    await client.query('BEGIN');
    const owner = randomUUID();
    const neighbour = randomUUID();
    const issue = randomUUID();
    for (const id of [owner, neighbour]) await client.query('INSERT INTO users(id, name, email, role) VALUES ($1, $2, $3, $4)', [id, 'QA transaction only', `${id}@example.com`, 'CITIZEN']);
    await client.query('INSERT INTO issues(id, user_id, title, category, status) VALUES ($1, $2, $3, $4, $5)', [issue, owner, 'QA rollback-only repair', 'POTHOLE', 'RESOLVED']);
    await client.query('INSERT INTO issue_followers(issue_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [issue, neighbour]);
    await client.query('INSERT INTO issue_followers(issue_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [issue, neighbour]);
    assert.equal((await client.query('SELECT COUNT(*)::int AS n FROM issue_followers WHERE issue_id = $1', [issue])).rows[0].n, 1);
    await client.query('SAVEPOINT wrong_owner');
    await assert.rejects(client.query('SELECT confirm_citizen_resolution($1, $2)', [issue, neighbour]));
    await client.query('ROLLBACK TO SAVEPOINT wrong_owner');
    assert.ok((await client.query('SELECT confirm_citizen_resolution($1, $2) AS confirmed', [issue, owner])).rows[0].confirmed);
    await client.query('SAVEPOINT repeat_confirmation');
    await assert.rejects(client.query('SELECT confirm_citizen_resolution($1, $2)', [issue, owner]));
    await client.query('ROLLBACK TO SAVEPOINT repeat_confirmation');
    assert.equal((await client.query("SELECT COUNT(*)::int AS n FROM issue_history WHERE issue_id = $1 AND action = 'CITIZEN_CONFIRMED'", [issue])).rows[0].n, 1);
    assert.equal((await client.query("SELECT has_table_privilege('anon', 'issue_followers', 'SELECT') AS allowed")).rows[0].allowed, false);
    assert.equal((await client.query("SELECT has_function_privilege('anon', 'confirm_citizen_resolution(uuid,uuid)', 'EXECUTE') AS allowed")).rows[0].allowed, false);
  } finally { await client.query('ROLLBACK'); await client.end(); }
});
