import React, { useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  Database,
  Eye,
  FileText,
  Flame,
  Lightbulb,
  ListFilter,
  Loader2,
  LocateFixed,
  LogOut,
  MapPin,
  Megaphone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Siren,
  ThumbsUp,
  Trophy,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from './utils/api';
import { useAuthStore } from './store/authStore';

const CATEGORIES = [
  ['POTHOLE', 'Pothole'],
  ['GARBAGE', 'Garbage'],
  ['WATER', 'Water'],
  ['STREETLIGHT', 'Streetlight'],
  ['SAFETY', 'Safety'],
  ['TREE', 'Tree'],
  ['OTHER', 'Other'],
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES);

const STATUS_LABELS = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  ESCALATED_TO_MLA: 'Escalated to MLA',
  ESCALATED_TO_MP: 'Escalated to MP',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const DEFAULT_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
  location_label: 'Mumbai',
};

const DAILY_PUZZLES = [
  {
    title: 'Pothole priority',
    prompt: 'A deep pothole sits outside a school gate. What detail makes the report fastest to act on?',
    choices: ['Exact gate or landmark', 'Angry caption only', 'No category selected'],
    answer: 0,
    note: 'Precise landmarks help crews route the issue without back-and-forth.',
  },
  {
    title: 'Water leak clue',
    prompt: 'A pipe has been leaking for two days. Which photo is most useful?',
    choices: ['Close-up of water source', 'Selfie far from leak', 'Random street view'],
    answer: 0,
    note: 'A clear source photo helps separate pipe leaks from drainage overflow.',
  },
  {
    title: 'Streetlight check',
    prompt: 'Two streetlights are out on the same lane. What should the issue title include?',
    choices: ['Pole numbers or nearest shop', 'Only “bad road”', 'No location label'],
    answer: 0,
    note: 'Pole numbers or a nearby shop make night-safety reports easier to verify.',
  },
  {
    title: 'Garbage escalation',
    prompt: 'A garbage pile keeps returning after cleanup. What makes the report stronger?',
    choices: ['Repeat timing and location', 'Only one-word title', 'Unrelated image'],
    answer: 0,
    note: 'Repeat timing shows pattern, not just a one-time pickup request.',
  },
  {
    title: 'Tree hazard call',
    prompt: 'A branch is leaning over a busy footpath. Which category fits best?',
    choices: ['TREE', 'WATER', 'OTHER'],
    answer: 0,
    note: 'Correct category gets the report to the right operational queue.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function useMotionProps() {
  const reduced = useReducedMotion();
  return reduced
    ? { initial: false, animate: undefined, variants: undefined }
    : { initial: 'hidden', animate: 'visible', variants: fadeUp };
}

function getDailyPuzzle() {
  const start = new Date('2026-01-01T00:00:00+05:30').getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return {
    key: `civic-puzzle-${day}`,
    puzzle: DAILY_PUZZLES[Math.abs(day) % DAILY_PUZZLES.length],
  };
}

function AppShell({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/icon.png" alt="" className="brand-mark" />
          <span>
            <strong>CivicPulse</strong>
            <small>Mumbai civic reporting</small>
          </span>
        </Link>

        <nav className="topnav" aria-label="Primary">
          <Link to="/">Feed</Link>
          <Link to="/raise">Raise issue</Link>
          {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
        </nav>

        <div className="top-actions">
          {isAuthenticated ? (
            <>
              <span className="user-chip">
                <CircleUserRound size={16} />
                {user?.name || 'Citizen'}
              </span>
              <button className="icon-button" type="button" onClick={() => { logout(); navigate('/'); }} aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link className="button secondary" to="/login">Sign in</Link>
          )}
          <Link className="button primary" to="/raise">
            <Plus size={17} />
            Raise issue
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function StatStrip() {
  const motionProps = useMotionProps();
  const { data, isLoading } = useQuery({
    queryKey: ['feed-stats'],
    queryFn: () => api.get('/api/feed/stats').then((r) => r.data),
  });

  const stats = [
    { label: 'Total issues', value: data?.total_issues ?? 0, icon: BarChart3 },
    { label: 'Resolved', value: data?.resolved_issues ?? 0, icon: CheckCircle2 },
    { label: 'Resolution rate', value: `${data?.resolution_rate ?? 0}%`, icon: ShieldCheck },
    { label: 'Active reps', value: data?.active_reps ?? 0, icon: Megaphone },
  ];

  return (
    <section className="stats-grid" aria-label="CivicPulse statistics">
      {stats.map(({ label, value, icon: Icon }) => (
        <motion.div className="stat-card" key={label} {...motionProps} whileHover={{ y: -4 }}>
          <Icon size={18} />
          <span>{isLoading ? '...' : value}</span>
          <small>{label}</small>
        </motion.div>
      ))}
    </section>
  );
}

function PortalHero() {
  const reduced = useReducedMotion();

  return (
    <motion.section
      className="portal-hero"
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="hero-copy">
        <p className="eyebrow">Citizen portal</p>
        <h1>Raise civic issues and keep your ward moving</h1>
        <p className="lede">
          Report potholes, leaks, garbage, safety hazards, and streetlight problems from one public dashboard.
        </p>
        <div className="hero-actions">
          <Link className="button primary large" to="/raise">
            <Siren size={18} />
            Raise issue
          </Link>
          <a className="button secondary large" href="#daily-puzzle">
            <Trophy size={18} />
            Daily puzzle
          </a>
        </div>
      </div>

      <motion.figure
        className="hero-image-card"
        initial={reduced ? false : { opacity: 0, scale: 0.97 }}
        animate={reduced ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.08, ease: 'easeOut' }}
      >
        <img src="/civic-hero.png" alt="Citizens documenting a pothole on a Mumbai street" />
        <figcaption>
          <span><MapPin size={14} /> Mumbai</span>
          <strong>Community report in progress</strong>
        </figcaption>
      </motion.figure>
    </motion.section>
  );
}

function DailyPuzzleCard() {
  const reduced = useReducedMotion();
  const { key, puzzle } = getDailyPuzzle();
  const [selected, setSelected] = useState(() => {
    const stored = window.localStorage.getItem(key);
    return stored === null ? null : Number(stored);
  });

  const solved = selected === puzzle.answer;

  const choose = (index) => {
    setSelected(index);
    window.localStorage.setItem(key, String(index));
  };

  return (
    <motion.section
      id="daily-puzzle"
      className="daily-puzzle"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="puzzle-header">
        <span className="puzzle-icon"><Lightbulb size={20} /></span>
        <div>
          <p className="eyebrow">Daily civic puzzle</p>
          <h2>{puzzle.title}</h2>
        </div>
        <span className="puzzle-date"><CalendarDays size={15} /> Today</span>
      </div>

      <p className="puzzle-prompt">{puzzle.prompt}</p>

      <div className="puzzle-options">
        {puzzle.choices.map((choice, index) => {
          const picked = selected === index;
          const right = index === puzzle.answer;
          const reveal = selected !== null;
          return (
            <motion.button
              key={choice}
              type="button"
              className={`puzzle-option ${picked ? 'picked' : ''} ${reveal && right ? 'right' : ''} ${reveal && picked && !right ? 'wrong' : ''}`}
              onClick={() => choose(index)}
              whileHover={reduced ? undefined : { x: 4 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {choice}
            </motion.button>
          );
        })}
      </div>

      {selected !== null && (
        <motion.div
          className={`puzzle-result ${solved ? 'solved' : 'retry'}`}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
        >
          <Trophy size={17} />
          <span>{solved ? 'Nice civic instinct.' : 'Close, but this one needs a sharper report.'} {puzzle.note}</span>
        </motion.div>
      )}
    </motion.section>
  );
}

function DashboardPage() {
  const reduced = useReducedMotion();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['issues', category, sort],
    queryFn: () => api.get('/api/feed/home', {
      params: {
        category: category || undefined,
        sort,
        limit: 40,
      },
    }).then((r) => r.data),
  });

  const issues = useMemo(() => {
    const value = search.trim().toLowerCase();
    return (data?.issues || []).filter((issue) => {
      if (!value) return true;
      return [issue.title, issue.description, issue.location_label, issue.wards?.name]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value));
    });
  }, [data?.issues, search]);

  return (
    <AppShell>
      <section className="workspace">
        <PortalHero />

        <StatStrip />

        <div className="portal-grid">
          <DailyPuzzleCard />
          <motion.aside
            className="activity-panel"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
          >
            <p className="eyebrow">Citizen streak</p>
            <h2>Make civic action a habit</h2>
            <div className="streak-row">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <p>Try the daily puzzle, upvote useful reports, and raise clear issues when you spot them.</p>
          </motion.aside>
        </div>

        <div className="workspace-header feed-heading">
          <div>
            <p className="eyebrow">Live civic feed</p>
            <h2>Browse recent reports</h2>
          </div>
        </div>

        <div className="feed-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by issue, ward, or location"
            />
          </label>

          <label className="select-field">
            <ListFilter size={17} />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="select-field">
            <Flame size={17} />
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="trending">Trending</option>
              <option value="upvotes">Most upvoted</option>
              <option value="escalated">Escalated</option>
            </select>
          </label>
        </div>

        <motion.section className="issue-grid" aria-label="Issue feed" variants={stagger} initial={reduced ? false : 'hidden'} animate={reduced ? undefined : 'visible'}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => <div className="issue-card loading-card" key={index} />)
          ) : issues.length ? (
            issues.map((issue) => <IssueCard key={issue.id} issue={issue} onRefresh={refetch} />)
          ) : (
            <EmptyState />
          )}
        </motion.section>
      </section>
    </AppShell>
  );
}

function IssueCard({ issue, onRefresh }) {
  const reduced = useReducedMotion();
  const { isAuthenticated } = useAuthStore();
  const status = STATUS_LABELS[issue.status] || issue.status || 'Open';
  const created = issue.created_at ? formatDistanceToNow(new Date(issue.created_at), { addSuffix: true }) : '';
  const isEscalated = Boolean(issue.escalated_at);

  const upvote = useMutation({
    mutationFn: () => api.post(`/api/issues/${issue.id}/upvote`),
    onSuccess: () => onRefresh?.(),
    onError: (error) => toast.error(error.response?.data?.error || 'Unable to upvote'),
  });

  return (
    <motion.article
      className={`issue-card ${isEscalated ? 'is-escalated' : ''}`}
      variants={fadeUp}
      whileHover={reduced ? undefined : { y: -5, transition: { duration: 0.16 } }}
    >
      <div className="issue-meta">
        <span className="pill category">{CATEGORY_LABELS[issue.category] || 'Other'}</span>
        <span className="pill status">{status}</span>
      </div>

      <h2>{issue.title}</h2>
      <p>{issue.description || 'No description added yet.'}</p>

      <div className="issue-location">
        <MapPin size={15} />
        <span>{issue.wards?.name || issue.location_label || 'Mumbai'}</span>
      </div>

      <div className="issue-footer">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (!isAuthenticated) {
              toast.error('Sign in to upvote');
              return;
            }
            upvote.mutate();
          }}
          disabled={upvote.isPending}
        >
          <ThumbsUp size={16} />
          {issue.upvote_count || 0}
        </button>
        <span className="quiet">
          <Clock3 size={15} />
          {created}
        </span>
        <Link to={`/issues/${issue.id}`} className="text-button">
          <Eye size={16} />
          View
        </Link>
      </div>
    </motion.article>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Siren size={30} />
      <h2>No issues match this view</h2>
      <p>Raise the first report for your area or clear the filters.</p>
      <Link className="button primary" to="/raise">Raise issue</Link>
    </div>
  );
}

function AuthPanel({ compact = false, redirectTo = '/raise' }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const auth = useMutation({
    mutationFn: async () => {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? form
        : { email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);
      return data;
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success(mode === 'register' ? 'Account created' : 'Signed in');
      navigate(redirectTo);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Authentication failed'),
  });

  return (
    <section className={`auth-panel ${compact ? 'compact' : ''}`}>
      <div className="auth-tabs" role="tablist">
        <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
          Register
        </button>
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
          Sign in
        </button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); auth.mutate(); }} className="auth-form">
        {mode === 'register' && (
          <label>
            Full name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              placeholder="Your name"
            />
          </label>
        )}
        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            value={form.password}
            onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
            placeholder="Minimum 8 characters"
          />
        </label>
        <button type="submit" className="button primary" disabled={auth.isPending}>
          {auth.isPending ? <Loader2 size={17} className="spin" /> : <ShieldCheck size={17} />}
          {mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/raise" replace />;

  return (
    <AppShell>
      <section className="auth-page">
        <div>
          <p className="eyebrow">Citizen access</p>
          <h1>Create an account to raise and track issues</h1>
          <p className="lede">
            Your reports are connected to a real backend and can be followed from the feed after submission.
          </p>
        </div>
        <AuthPanel />
      </section>
    </AppShell>
  );
}

function RaiseIssuePage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'POTHOLE',
    location_label: '',
    is_anonymous: false,
  });
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locating, setLocating] = useState(false);

  const submitIssue = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('location_label', form.location_label.trim() || location.location_label || 'Mumbai');
      fd.append('is_anonymous', String(form.is_anonymous));
      fd.append('lat', String(location.lat));
      fd.append('lng', String(location.lng));
      fd.append('source', 'TYPED');
      const { data } = await api.post('/api/issues', fd);
      return data;
    },
    onSuccess: (data) => {
      toast.success('Issue raised');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      navigate(`/issues/${data.issue.id}`);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Issue submission failed'),
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          location_label: form.location_label || 'Current location',
        });
        setLocating(false);
        toast.success('Location added');
      },
      () => {
        setLocating(false);
        toast.error('Location permission was not granted');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <AppShell>
      <section className="raise-layout">
        <div className="raise-main">
          <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to feed</Link>
          <div className="section-heading">
            <p className="eyebrow">New civic report</p>
            <h1>Raise an issue from the web</h1>
          </div>

          {!isAuthenticated && (
            <div className="notice">
              <AlertTriangle size={18} />
              <span>Sign in or create an account before submitting.</span>
            </div>
          )}

          <form
            className="issue-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isAuthenticated) {
                toast.error('Please sign in before submitting');
                return;
              }
              submitIssue.mutate();
            }}
          >
            <fieldset>
              <legend>Category</legend>
              <div className="category-grid">
                {CATEGORIES.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={form.category === value ? 'active' : ''}
                    onClick={() => setForm((state) => ({ ...state, category: value }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              Issue title
              <input
                required
                maxLength={80}
                value={form.title}
                onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
                placeholder="Large pothole near station exit"
              />
            </label>

            <label>
              Description
              <textarea
                rows={5}
                maxLength={500}
                value={form.description}
                onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
                placeholder="Add context, landmark, severity, or timing"
              />
            </label>

            <div className="location-row">
              <label>
                Location label
                <input
                  value={form.location_label}
                  onChange={(event) => setForm((state) => ({ ...state, location_label: event.target.value }))}
                  placeholder="Andheri West, Mumbai"
                />
              </label>
              <button className="button secondary location-button" type="button" onClick={getLocation} disabled={locating}>
                {locating ? <Loader2 size={17} className="spin" /> : <LocateFixed size={17} />}
                Use current
              </button>
            </div>

            <div className="coordinate-row">
              <label>
                Latitude
                <input
                  required
                  type="number"
                  step="any"
                  value={location.lat}
                  onChange={(event) => setLocation((state) => ({ ...state, lat: Number(event.target.value) }))}
                />
              </label>
              <label>
                Longitude
                <input
                  required
                  type="number"
                  step="any"
                  value={location.lng}
                  onChange={(event) => setLocation((state) => ({ ...state, lng: Number(event.target.value) }))}
                />
              </label>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(event) => setForm((state) => ({ ...state, is_anonymous: event.target.checked }))}
              />
              Submit anonymously in public feed
            </label>

            <button className="button primary submit-button" type="submit" disabled={submitIssue.isPending}>
              {submitIssue.isPending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              Submit issue
            </button>
          </form>
        </div>

        <aside className="raise-side">
          {isAuthenticated ? (
            <div className="side-panel">
              <ShieldCheck size={22} />
              <h2>Ready to submit</h2>
              <p>Your report will be stored in Supabase and appear in the public feed.</p>
            </div>
          ) : (
            <AuthPanel compact />
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.get(`/api/issues/${id}`).then((r) => r.data),
  });

  const issue = data?.issue;

  return (
    <AppShell>
      <section className="detail-page">
        <button className="back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>

        {isLoading ? (
          <div className="detail-card loading-card" />
        ) : !issue ? (
          <EmptyState />
        ) : (
          <article className="detail-card">
            <div className="issue-meta">
              <span className="pill category">{CATEGORY_LABELS[issue.category] || 'Other'}</span>
              <span className="pill status">{STATUS_LABELS[issue.status] || issue.status}</span>
            </div>
            <h1>{issue.title}</h1>
            <p>{issue.description || 'No description added yet.'}</p>
            <div className="detail-grid">
              <span><MapPin size={17} /> {issue.wards?.name || issue.location_label || 'Mumbai'}</span>
              <span><ThumbsUp size={17} /> {issue.upvote_count || 0} upvotes</span>
              <span><Clock3 size={17} /> {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
            </div>
          </article>
        )}
      </section>
    </AppShell>
  );
}

const SAMPLE_REP_CSV = `state_code,state_name,city,zone_name,ward_number,ward_name,corporator_name,corporator_party,corporator_phone,corporator_email,mla_name,mla_party,mla_constituency,mla_phone,mla_email,term_start,source_url
MH,Maharashtra,Mumbai,K-West,K-West,Andheri West,Sample Corporator,Independent,,,Sample MLA,Independent,Andheri West,,,2026-01-01,`;

function AdminImportPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [importText, setImportText] = useState(SAMPLE_REP_CSV);
  const [sourceUrl, setSourceUrl] = useState('');
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'ADMIN';

  const locations = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const imports = useQuery({
    queryKey: ['rep-imports'],
    queryFn: () => api.get('/api/admin/reps/imports').then((r) => r.data),
    enabled: isAdmin,
  });

  const uploadImport = useMutation({
    mutationFn: async () => {
      if (sourceUrl.trim() && !importText.trim()) {
        const { data } = await api.post('/api/admin/reps/import-url', { url: sourceUrl.trim(), format: 'csv' });
        return data;
      }
      const { data } = await api.post('/api/admin/reps/import', {
        format: 'csv',
        data: importText,
        source_url: sourceUrl.trim() || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      const result = data.import;
      toast.success(`Imported ${result.rows_imported}/${result.rows_received} rows`);
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      queryClient.invalidateQueries({ queryKey: ['rep-imports'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Import failed'),
  });

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportText(await file.text());
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <section className="auth-page">
          <div>
            <p className="eyebrow">Admin access</p>
            <h1>Sign in as admin to upload representative data</h1>
            <p className="lede">The import updates state-city-ward records, maps corporators to wards, and maps MLAs through zones.</p>
          </div>
          <AuthPanel redirectTo="/admin" />
        </section>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <section className="detail-page">
          <div className="notice">
            <AlertTriangle size={18} />
            <span>Only ADMIN users can upload representative data.</span>
          </div>
        </section>
      </AppShell>
    );
  }

  const wards = locations.data?.wards || [];
  const latestImports = imports.data?.imports || [];

  return (
    <AppShell>
      <section className="admin-layout">
        <div className="section-heading">
          <p className="eyebrow">Backend data control</p>
          <h1>Upload corporator and MLA mapping</h1>
          <p className="lede">Store data as state → city → ward, assign corporators per ward, and attach MLAs to zones for feed mapping.</p>
        </div>

        <div className="admin-grid">
          <form
            className="admin-panel"
            onSubmit={(event) => {
              event.preventDefault();
              uploadImport.mutate();
            }}
          >
            <div className="panel-title">
              <Upload size={19} />
              <h2>Manual import</h2>
            </div>

            <label>
              Official source URL
              <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://official-site.gov.in/reps.csv" />
            </label>

            <label className="file-picker">
              <FileText size={18} />
              Upload CSV file
              <input type="file" accept=".csv,.txt,.json" onChange={readFile} />
            </label>

            <label>
              CSV / JSON rows
              <textarea rows={12} value={importText} onChange={(event) => setImportText(event.target.value)} />
            </label>

            <button className="button primary submit-button" type="submit" disabled={uploadImport.isPending}>
              {uploadImport.isPending ? <Loader2 size={18} className="spin" /> : <Database size={18} />}
              Import and map data
            </button>
          </form>

          <aside className="admin-panel">
            <div className="panel-title">
              <Database size={19} />
              <h2>Current mapping</h2>
            </div>
            <div className="mapping-stats">
              <span><strong>{wards.length}</strong><small>wards loaded</small></span>
              <span><strong>{new Set(wards.map((ward) => ward.city)).size}</strong><small>cities</small></span>
              <span><strong>{new Set(wards.map((ward) => ward.state_code)).size}</strong><small>states</small></span>
            </div>
            <div className="mapping-list">
              {wards.slice(0, 12).map((ward) => (
                <div key={ward.id} className="mapping-row">
                  <strong>{ward.name}</strong>
                  <small>{[ward.ward_number, ward.city, ward.state_name].filter(Boolean).join(' · ')}</small>
                  <span>{ward.corporators?.[0]?.name || 'No corporator mapped'}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="admin-panel">
          <div className="panel-title">
            <Clock3 size={19} />
            <h2>Recent imports</h2>
          </div>
          <div className="import-history">
            {latestImports.map((batch) => (
              <div key={batch.id} className="mapping-row">
                <strong>{batch.rows_imported}/{batch.rows_received} rows imported</strong>
                <small>{new Date(batch.created_at).toLocaleString()}</small>
                <span>{batch.source_url || batch.format}</span>
              </div>
            ))}
            {!latestImports.length && <p className="lede">No imports yet.</p>}
          </div>
        </section>
      </section>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/raise" element={<RaiseIssuePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminImportPage />} />
      <Route path="/issues/:id" element={<IssueDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
