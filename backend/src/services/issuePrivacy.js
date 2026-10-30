function redactAnonymousOwner(issue, viewer) {
  if (!issue?.is_anonymous) return issue;
  const canSeeOwner = viewer?.id === issue.user_id || ['ADMIN', 'MODERATOR'].includes(viewer?.role);
  return { ...issue, users: null, user_id: canSeeOwner ? issue.user_id : null };
}

module.exports = { redactAnonymousOwner };
