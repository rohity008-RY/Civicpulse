const { test } = require('node:test');
const assert = require('node:assert/strict');
const { redactAnonymousOwner } = require('../src/services/issuePrivacy');

test('anonymous reports hide owner identity from public readers and unrelated representatives', () => {
  const issue = { id: 'report', user_id: 'owner', is_anonymous: true, users: { name: 'Private name' } };
  for (const viewer of [undefined, { id: 'other', role: 'CITIZEN' }, { id: 'rep', role: 'MLA' }]) {
    const result = redactAnonymousOwner(issue, viewer);
    assert.equal(result.user_id, null);
    assert.equal(result.users, null);
  }
  assert.equal(issue.user_id, 'owner');
  assert.equal(issue.users.name, 'Private name');
});

test('the owner and moderation roles retain ownership access without revealing public profile details', () => {
  const issue = { user_id: 'owner', is_anonymous: true, users: { name: 'Private name' } };
  for (const viewer of [{ id: 'owner', role: 'CITIZEN' }, { id: 'admin', role: 'ADMIN' }, { id: 'mod', role: 'MODERATOR' }]) {
    const result = redactAnonymousOwner(issue, viewer);
    assert.equal(result.user_id, 'owner');
    assert.equal(result.users, null);
  }
  const publicIssue = { ...issue, is_anonymous: false };
  assert.equal(redactAnonymousOwner(publicIssue), publicIssue);
});
