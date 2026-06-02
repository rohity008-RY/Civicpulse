require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const issueRoutes     = require('./routes/issues');
const feedRoutes      = require('./routes/feed');
const repRoutes       = require('./routes/reps');
const adminRoutes     = require('./routes/admin');
const voiceRoutes     = require('./routes/voice');
const notifRoutes     = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const representativeDashboardRoutes = require('./routes/representativeDashboard');

const { startEscalationJob } = require('./services/escalationJob');
const { startTrendingJob }   = require('./services/trendingJob');
const logger = require('./utils/logger');

const app = express();

// ─── Security & Middleware ────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/issues',      issueRoutes);
app.use('/api/feed',        feedRoutes);
app.use('/api/reps',        repRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/rep',         representativeDashboardRoutes);
app.use('/api/voice',       voiceRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/analytics',   analyticsRoutes);

// ─── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ─── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`CivicsPulse API running on port ${PORT}`);
  // Start background jobs
  startEscalationJob();
  startTrendingJob();
});

module.exports = app;
