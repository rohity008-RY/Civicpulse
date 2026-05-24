const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// ─── Verify JWT ───────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, home_ward_id, avatar_url, is_active')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    if (!user.is_active) return res.status(403).json({ error: 'Account suspended' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Optional Auth (public routes that benefit from user context) ──
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next();
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users').select('*').eq('id', decoded.sub).single();
    req.user = user;
  } catch (_) {}
  next();
};

// ─── Role Guard ───────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      error: 'Access denied',
      required: roles,
      current: req.user.role
    });
  next();
};

// ─── Shorthand role guards ────────────────────────────────────
const isAdmin      = requireRole('ADMIN');
const isAdminOrMod = requireRole('ADMIN', 'MODERATOR');
const isRep        = requireRole('CORPORATOR', 'MLA', 'MP', 'ADMIN');
const isCorp       = requireRole('CORPORATOR', 'ADMIN');
const isMLA        = requireRole('MLA', 'ADMIN');
const isMP         = requireRole('MP', 'ADMIN');

module.exports = { authenticate, optionalAuth, requireRole, isAdmin, isAdminOrMod, isRep, isCorp, isMLA, isMP };
