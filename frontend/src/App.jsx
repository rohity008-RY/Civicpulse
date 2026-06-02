import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  Database,
  Download,
  Eye,
  FileText,
  Flame,
  Globe2,
  KeyRound,
  Lightbulb,
  ListFilter,
  Loader2,
  LocateFixed,
  LogOut,
  MapPin,
  Mic,
  Megaphone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Siren,
  Square,
  ThumbsUp,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from './utils/api';
import { useAuthStore } from './store/authStore';
import { useLanguageStore } from './store/languageStore';
import { categoryLabel, statusLabel, useT } from './utils/i18n';

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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
let googleIdentityPromise;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (googleIdentityPromise) return googleIdentityPromise;

  googleIdentityPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Google sign-in script failed to load'));
    document.head.appendChild(script);
  });

  return googleIdentityPromise;
}

const DEFAULT_LOCATION = {
  lat: 19.076,
  lng: 72.8777,
  location_label: 'Mumbai',
};

const formatWard = (ward) => (
  [ward?.ward_number, ward?.name, ward?.city, ward?.state_name].filter(Boolean).join(' · ')
);

const filterWards = (wards, search) => {
  const value = search.trim().toLowerCase();
  return (wards || []).filter((ward) => {
    if (!value) return true;
    return [ward.name, ward.ward_number, ward.city, ward.state_name]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(value));
  });
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

function LanguageSelect({ label = false, className = '' }) {
  const { t, languages, language } = useT();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { isAuthenticated, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const savePreference = useMutation({
    mutationFn: (preferred_language) => api.put('/api/auth/me', { preferred_language }),
    onSuccess: (response) => {
      updateUser(response.data.user);
      queryClient.invalidateQueries();
    },
    onError: () => toast.error('Could not save language preference'),
  });

  const changeLanguage = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    queryClient.invalidateQueries();
    if (isAuthenticated) savePreference.mutate(nextLanguage);
  };

  return (
    <label className={`language-select ${className}`}>
      <Globe2 size={16} />
      {label && <span>{t('language')}</span>}
      <select value={language} onChange={changeLanguage} aria-label={t('language')}>
        {languages.map((item) => (
          <option key={item.code} value={item.code}>{item.nativeName}</option>
        ))}
      </select>
    </label>
  );
}

function AppShell({ children }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useT();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/icon.png" alt="" className="brand-mark" />
          <span>
            <strong>CivicsPulse</strong>
            <small>Mumbai civic reporting</small>
          </span>
        </Link>

        <nav className="topnav" aria-label="Primary">
          <Link to="/">{t('feed')}</Link>
          <Link to="/raise">{t('raiseIssue')}</Link>
          {isAuthenticated && <Link to="/profile">{t('profile')}</Link>}
          {['CORPORATOR', 'MLA', 'MP'].includes(user?.role) && <Link to="/rep">Rep desk</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin">{t('admin')}</Link>}
        </nav>

        <div className="top-actions">
          <LanguageSelect />
          {isAuthenticated ? (
            <>
              <Link className="user-chip" to="/profile">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="user-chip-avatar" />
                ) : (
                  <CircleUserRound size={16} />
                )}
                {user?.name || 'Citizen'}
              </Link>
              <button className="icon-button" type="button" onClick={() => { logout(); navigate('/'); }} aria-label={t('signOut')}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link className="button secondary" to="/login">{t('signIn')}</Link>
          )}
          <Link className="button primary" to="/raise">
            <Plus size={17} />
            {t('raiseIssue')}
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

function StatStrip() {
  const motionProps = useMotionProps();
  const { t } = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['feed-stats'],
    queryFn: () => api.get('/api/feed/stats').then((r) => r.data),
  });

  const stats = [
    { label: t('statsTotal'), value: data?.total_issues ?? 0, icon: BarChart3 },
    { label: t('statsResolved'), value: data?.resolved_issues ?? 0, icon: CheckCircle2 },
    { label: t('statsRate'), value: `${data?.resolution_rate ?? 0}%`, icon: ShieldCheck },
    { label: t('statsReps'), value: data?.active_reps ?? 0, icon: Megaphone },
  ];

  return (
    <section className="stats-grid" aria-label="CivicsPulse statistics">
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
  const { t } = useT();

  return (
    <motion.section
      className="portal-hero"
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="hero-copy">
        <p className="eyebrow">{t('citizenPortal')}</p>
        <h1>{t('heroTitle')}</h1>
        <p className="lede">
          {t('heroCopy')}
        </p>
        <div className="hero-actions">
          <Link className="button primary large" to="/raise">
            <Siren size={18} />
            {t('raiseIssue')}
          </Link>
          <a className="button secondary large" href="#daily-puzzle">
            <Trophy size={18} />
            {t('dailyPuzzle')}
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
  const { t } = useT();
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
          <p className="eyebrow">{t('dailyPuzzle')}</p>
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
  const { t, language } = useT();
  const { isAuthenticated } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const privateFeed = sort === 'mine' || sort === 'my_escalated';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['issues', language, category, sort],
    queryFn: () => api.get('/api/feed/home', {
      params: {
        category: category || undefined,
        sort: privateFeed ? 'newest' : sort,
        scope: privateFeed ? sort : undefined,
        limit: 40,
      },
    }).then((r) => r.data),
    enabled: !privateFeed || isAuthenticated,
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
            <p className="eyebrow">{t('citizenStreak')}</p>
            <h2>{t('habitTitle')}</h2>
            <div className="streak-row">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <p>{t('habitCopy')}</p>
          </motion.aside>
        </div>

        <div className="workspace-header feed-heading">
          <div>
            <p className="eyebrow">{t('liveFeed')}</p>
            <h2>{t('browseReports')}</h2>
          </div>
        </div>

        <div className="feed-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </label>

          <label className="select-field">
            <ListFilter size={17} />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">{t('allCategories')}</option>
              {CATEGORIES.map(([value]) => <option key={value} value={value}>{categoryLabel(language, value)}</option>)}
            </select>
          </label>

          <label className="select-field">
            <Flame size={17} />
            <select
              value={sort}
              onChange={(event) => {
                const next = event.target.value;
                if ((next === 'mine' || next === 'my_escalated') && !isAuthenticated) {
                  toast.error('Sign in to see your personal reports');
                  return;
                }
                setSort(next);
              }}
            >
              <option value="newest">{t('newest')}</option>
              <option value="trending">{t('trending')}</option>
              <option value="upvotes">{t('mostUpvoted')}</option>
              <option value="escalated">{t('escalated')}</option>
              <option value="mine">My Issues</option>
              <option value="my_escalated">My Escalated</option>
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
  const { t, language } = useT();
  const status = statusLabel(language, issue.status);
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
        <span className="pill category">{categoryLabel(language, issue.category)}</span>
        <span className="pill status">{status}</span>
      </div>

      <h2>{issue.title}</h2>
      <p>{issue.description || t('noDescription')}</p>

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
              toast.error(t('signIn'));
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
          {t('view')}
        </Link>
      </div>
    </motion.article>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="empty-state">
      <Siren size={30} />
      <h2>{t('emptyTitle')}</h2>
      <p>{t('emptyCopy')}</p>
      <Link className="button primary" to="/raise">{t('raiseIssue')}</Link>
    </div>
  );
}

function AuthPanel({ compact = false, redirectTo = '/raise' }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t, language } = useT();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [locatingWard, setLocatingWard] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);
  const googleButtonRef = useRef(null);

  const locations = useQuery({
    queryKey: ['signup-locations'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    enabled: mode === 'register',
    staleTime: 10 * 60 * 1000,
  });
  const wards = locations.data?.wards || [];
  const selectedWard = wards.find((ward) => ward.id === selectedWardId);
  const visibleWards = useMemo(() => filterWards(wards, wardSearch).slice(0, 6), [wards, wardSearch]);

  const finishAuth = (data, message) => {
    login(data.user, data.token);
    setLanguage(data.user?.preferred_language || language);
    toast.success(message);
    navigate(redirectTo);
  };

  const auth = useMutation({
    mutationFn: async () => {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? { ...form, preferred_language: language, home_ward_id: selectedWardId }
        : { email: form.email, password: form.password, preferred_language: language };
      const { data } = await api.post(endpoint, payload);
      return data;
    },
    onSuccess: (data) => {
      finishAuth(data, mode === 'register' ? t('accountCreated') : t('signedIn'));
    },
    onError: (error) => toast.error(error.response?.data?.error || t('authFailed')),
  });

  const googleAuth = useMutation({
    mutationFn: async (credential) => {
      const { data } = await api.post('/api/auth/social', {
        provider: 'google',
        id_token: credential,
        preferred_language: language,
      });
      return data;
    },
    onSuccess: (data) => finishAuth(data, t('signedIn')),
    onError: (error) => toast.error(error.response?.data?.error || t('googleSignInFailed')),
  });

  const forgotPassword = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/auth/forgot-password', { email: form.email });
      return data;
    },
    onSuccess: (data) => {
      setResetInfo(data);
      toast.success(t('resetLinkSent'));
    },
    onError: (error) => toast.error(error.response?.data?.error || t('resetRequestFailed')),
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current || mode === 'forgot') return undefined;

    let cancelled = false;
    const target = googleButtonRef.current;
    target.innerHTML = '';

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) googleAuth.mutate(response.credential);
          },
        });
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          width: Math.min(360, target.offsetWidth || 320),
        });
      })
      .catch(() => {
        if (!cancelled) toast.error(t('googleUnavailable'));
      });

    return () => {
      cancelled = true;
      target.innerHTML = '';
    };
  }, [mode, language]);

  const submitAuth = (event) => {
    event.preventDefault();
    if (mode === 'forgot') {
      forgotPassword.mutate();
      return;
    }
    if (mode === 'register' && !selectedWardId) {
      toast.error('Select your ward or use current location before creating account');
      return;
    }
    auth.mutate();
  };

  const useCurrentWard = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }
    setLocatingWard(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data } = await api.get('/api/reps/ward-lookup', {
            params: { lat: position.coords.latitude, lng: position.coords.longitude },
          });
          if (data.ward?.id) {
            setSelectedWardId(data.ward.id);
            setWardSearch(data.ward.name || data.ward.ward_number || '');
            toast.success(`Ward detected: ${data.ward.name || data.ward.ward_number}`);
          } else {
            toast.error('No ward matched this location. Please search manually.');
          }
        } catch (error) {
          toast.error(error.response?.data?.error || 'Could not detect ward. Please search manually.');
        } finally {
          setLocatingWard(false);
        }
      },
      () => {
        setLocatingWard(false);
        toast.error('Location permission was not granted. Please search manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <section className={`auth-panel ${compact ? 'compact' : ''}`}>
      {mode !== 'forgot' ? (
        <div className="auth-tabs" role="tablist">
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            {t('register')}
          </button>
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            {t('signIn')}
          </button>
        </div>
      ) : (
        <div className="auth-mode-heading">
          <KeyRound size={19} />
          <div>
            <h2>{t('forgotPassword')}</h2>
            <p>{t('forgotPasswordCopy')}</p>
          </div>
        </div>
      )}

      <form onSubmit={submitAuth} className="auth-form">
        <LanguageSelect label />
        {mode === 'register' && (
          <label>
            {t('fullName')}
            <input
              required
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              placeholder="Your name"
            />
          </label>
        )}
        <label>
          {t('email')}
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
            placeholder="you@example.com"
          />
        </label>
        {mode !== 'forgot' && (
          <label>
            {t('password')}
            <input
              required
              minLength={8}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
              placeholder="Minimum 8 characters"
            />
            {!!form.password && (
              <span className="password-toggle">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
                Show password
              </span>
            )}
          </label>
        )}
        {mode === 'register' && (
          <fieldset className="signup-ward-fieldset">
            <legend>Ward / zone number</legend>
            <div className="ward-signup-actions">
              <button className="button secondary" type="button" onClick={useCurrentWard} disabled={locatingWard}>
                {locatingWard ? <Loader2 size={17} className="spin" /> : <LocateFixed size={17} />}
                Use current location
              </button>
              {selectedWard && <span className="inline-status success-text">Selected {formatWard(selectedWard)}</span>}
            </div>
            <input
              value={wardSearch}
              onChange={(event) => setWardSearch(event.target.value)}
              placeholder="Search ward, zone, city, or state"
            />
            <div className="ward-options compact">
              {locations.isLoading && <span className="muted-row">Loading wards...</span>}
              {!locations.isLoading && locations.isError && <span className="muted-row">Could not load wards. Try again or ask admin to import data.</span>}
              {!locations.isLoading && !locations.isError && visibleWards.map((ward) => (
                <button
                  key={ward.id}
                  type="button"
                  className={selectedWardId === ward.id ? 'active' : ''}
                  onClick={() => setSelectedWardId(ward.id)}
                >
                  <strong>{ward.name}</strong>
                  <span>{formatWard(ward)}</span>
                </button>
              ))}
              {!locations.isLoading && !locations.isError && !visibleWards.length && (
                <span className="muted-row">No wards found for this search.</span>
              )}
            </div>
          </fieldset>
        )}
        {mode === 'login' && (
          <button type="button" className="text-button auth-link" onClick={() => { setMode('forgot'); setResetInfo(null); }}>
            {t('forgotPasswordQuestion')}
          </button>
        )}
        <button
          type="submit"
          className="button primary"
          disabled={auth.isPending || forgotPassword.isPending}
        >
          {auth.isPending || forgotPassword.isPending ? <Loader2 size={17} className="spin" /> : <ShieldCheck size={17} />}
          {mode === 'forgot' ? t('sendResetLink') : mode === 'register' ? t('createAccount') : t('signIn')}
        </button>
        {mode === 'forgot' && resetInfo && (
          <div className="reset-result">
            <strong>{t('resetRequestReceived')}</strong>
            <p>
              {resetInfo.reset_url
                ? t('resetEmailNotConfigured')
                : resetInfo.email_configured
                  ? t('resetEmailConfigured')
                  : t('resetIfAccountExists')}
            </p>
            {resetInfo.reset_url && (
              <a className="button secondary" href={resetInfo.reset_url}>
                {t('openResetLink')}
              </a>
            )}
          </div>
        )}
        {mode === 'forgot' ? (
          <button type="button" className="text-button auth-link" onClick={() => setMode('login')}>
            {t('backToSignIn')}
          </button>
        ) : (
          <>
            <div className="auth-divider"><span>{t('or')}</span></div>
            {GOOGLE_CLIENT_ID ? (
              <div className="google-button-wrap" ref={googleButtonRef} aria-label={t('continueWithGoogle')} />
            ) : (
              <button type="button" className="button secondary google-fallback" disabled>
                <Globe2 size={17} />
                {t('googleNeedsSetup')}
              </button>
            )}
            {googleAuth.isPending && (
              <p className="inline-status"><Loader2 size={14} className="spin" /> {t('googleSigningIn')}</p>
            )}
          </>
        )}
      </form>
    </section>
  );
}

function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useT();
  if (isAuthenticated) return <Navigate to="/raise" replace />;

  return (
    <AppShell>
      <section className="auth-page">
        <div>
          <p className="eyebrow">{t('authEyebrow')}</p>
          <h1>{t('authTitle')}</h1>
          <p className="lede">
            {t('authCopy')}
          </p>
        </div>
        <AuthPanel />
      </section>
    </AppShell>
  );
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const { t } = useT();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);

  const resetPassword = useMutation({
    mutationFn: async () => {
      if (form.password !== form.confirm) throw new Error(t('passwordMismatch'));
      const { data } = await api.post('/api/auth/reset-password', {
        token,
        password: form.password,
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.user && data.token) login(data.user, data.token);
      toast.success(t('passwordResetDone'));
      navigate('/profile');
    },
    onError: (error) => toast.error(error.response?.data?.error || error.message || t('passwordResetFailed')),
  });

  return (
    <AppShell>
      <section className="auth-page reset-page">
        <div>
          <p className="eyebrow">{t('passwordReset')}</p>
          <h1>{t('chooseNewPassword')}</h1>
          <p className="lede">{t('resetPasswordCopy')}</p>
        </div>
        <section className="auth-panel">
          {!token ? (
            <div className="notice">
              <AlertTriangle size={18} />
              {t('resetTokenMissing')}
            </div>
          ) : (
            <form className="auth-form" onSubmit={(event) => { event.preventDefault(); resetPassword.mutate(); }}>
              <label>
                {t('password')}
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                />
              </label>
              <label>
                {t('confirmPassword')}
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={(event) => setForm((state) => ({ ...state, confirm: event.target.value }))}
                  placeholder="Repeat password"
                />
                {(form.password || form.confirm) && (
                  <span className="password-toggle">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(event) => setShowPassword(event.target.checked)}
                    />
                    Show password
                  </span>
                )}
              </label>
              <button type="submit" className="button primary" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? <Loader2 size={17} className="spin" /> : <KeyRound size={17} />}
                {t('resetPasswordButton')}
              </button>
            </form>
          )}
          <Link className="text-button auth-link" to="/login">{t('backToSignIn')}</Link>
        </section>
      </section>
    </AppShell>
  );
}

function RaiseIssuePage() {
  const { isAuthenticated, user } = useAuthStore();
  const { t, language } = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'POTHOLE',
    location_label: '',
    is_anonymous: false,
  });
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locating, setLocating] = useState(false);
  const [media, setMedia] = useState([]);
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(user?.home_ward_id || '');
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceStep, setVoiceStep] = useState('idle');
  const [voiceError, setVoiceError] = useState('');
  const [transcript, setTranscript] = useState('');

  const locations = useQuery({
    queryKey: ['raise-locations'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const wards = locations.data?.wards || [];
  const selectedWard = wards.find((ward) => ward.id === selectedWardId);
  const visibleWards = useMemo(() => filterWards(wards, wardSearch).slice(0, 8), [wards, wardSearch]);

  const submitIssue = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('location_label', form.location_label.trim() || selectedWard?.name || location.location_label || 'Mumbai');
      fd.append('is_anonymous', String(form.is_anonymous));
      fd.append('lat', String(location.lat));
      fd.append('lng', String(location.lng));
      fd.append('source', voiceStep === 'review' ? 'VOICE' : 'TYPED');
      fd.append('language_code', language);
      if (selectedWard) {
        fd.append('ward_id', selectedWard.id);
        fd.append('ward_name', selectedWard.name || '');
        fd.append('ward_number', selectedWard.ward_number || '');
        fd.append('city', selectedWard.city || '');
        fd.append('state_code', selectedWard.state_code || '');
        fd.append('state_name', selectedWard.state_name || '');
      }
      media.forEach((item) => fd.append('media', item.file, item.file.name));
      const { data } = await api.post('/api/issues', fd);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.media_warning || 'Issue raised');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['feed-stats'] });
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
      async (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          location_label: form.location_label || 'Current location',
        });
        try {
          const { data } = await api.get('/api/reps/ward-lookup', {
            params: { lat: position.coords.latitude, lng: position.coords.longitude },
          });
          if (data.ward?.id) {
            setSelectedWardId(data.ward.id);
            setWardSearch(data.ward.name || data.ward.ward_number || '');
            setForm((state) => ({ ...state, location_label: state.location_label || data.ward.name || 'Current location' }));
            toast.success(`Location added and mapped to ${data.ward.name || 'ward'}`);
          } else {
            toast.success('Location added');
          }
        } catch {
          toast.success('Location added. Select ward manually if needed.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Location permission was not granted');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addMedia = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const slots = Math.max(0, 4 - media.length);
    if (files.length > slots) toast.error('Maximum 4 media files');
    const next = files.slice(0, slots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setMedia((state) => [...state, ...next]);
    event.target.value = '';
  };

  const removeMedia = (id) => {
    setMedia((state) => {
      const item = state.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return state.filter((entry) => entry.id !== id);
    });
  };

  const stopTracks = () => {
    mediaRecorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop());
  };

  const startRecording = async () => {
    if (recording || voiceStep === 'processing') return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceError('Voice recording is not available in this browser. Please type the issue manually.');
      return;
    }

    try {
      setVoiceMode(true);
      setVoiceStep('starting');
      setVoiceError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        if (blob.size) handleAudioReady(blob);
        stopTracks();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setVoiceStep('recording');
    } catch {
      setVoiceMode(false);
      setVoiceStep('idle');
      setVoiceError('Microphone permission was not granted. Please type the issue manually.');
      toast.error('Microphone permission was not granted');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      setVoiceMode(false);
      setVoiceStep('idle');
      setVoiceError('Microphone recording was not ready. Please type the issue manually.');
      return;
    }
    setRecording(false);
    setVoiceStep('processing');
    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopTracks();
    audioChunksRef.current = [];
    setRecording(false);
    setVoiceMode(false);
    setVoiceStep('idle');
  };

  const handleAudioReady = async (blob) => {
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'recording.webm');
      fd.append('language', language);
      const { data: stt } = await api.post('/api/voice/transcribe', fd);
      setTranscript(stt.transcript || '');
      const { data: nlp } = await api.post('/api/voice/extract', { transcript: stt.transcript, language_code: language });
      const { title, category, description } = nlp.extracted || {};
      setForm((state) => ({
        ...state,
        title: title || state.title,
        description: description || state.description,
        category: category || state.category,
      }));
      setVoiceStep('review');
      toast.success('Voice details added. Please review before submitting.');
    } catch (error) {
      const message = error.response?.data?.code === 'OPENAI_NOT_CONFIGURED'
        ? 'Voice AI is not configured yet. Typed issue submission is ready.'
        : (error.response?.data?.error || 'Could not transcribe audio. Please type the issue manually.');
      setVoiceError(message);
      setVoiceMode(false);
      setVoiceStep('idle');
      toast.error(message);
    } finally {
      setRecording(false);
    }
  };

  return (
    <AppShell>
      <section className="raise-layout">
        <div className="raise-main">
          <Link to="/" className="back-link"><ArrowLeft size={16} /> {t('backToFeed')}</Link>
          <div className="section-heading">
            <p className="eyebrow">{t('newReport')}</p>
            <h1>{t('raiseWeb')}</h1>
          </div>

          {!isAuthenticated && (
            <div className="notice">
              <AlertTriangle size={18} />
              <span>{t('signInBeforeSubmit')}</span>
            </div>
          )}

          <div className="voice-panel">
            <div>
              <p className="eyebrow">{t('voiceAssist')}</p>
              <strong>{voiceStep === 'processing' ? t('processingAudio') : voiceStep === 'recording' ? t('listeningNow') : t('speakOrType')}</strong>
              <span>{t('voiceCopy')}</span>
            </div>
            <div className="voice-actions">
              {recording ? (
                <button className="button primary" type="button" onClick={stopRecording}>
                  <Square size={16} />
                  {t('stop')}
                </button>
              ) : (
                <button className="button secondary" type="button" onClick={startRecording} disabled={voiceStep === 'processing'}>
                  {voiceStep === 'processing' ? <Loader2 size={17} className="spin" /> : <Mic size={17} />}
                  {t('voice')}
                </button>
              )}
              {(voiceMode || recording) && (
                <button className="icon-button" type="button" onClick={cancelRecording} aria-label="Cancel voice recording">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {voiceStep === 'review' && (
            <div className="notice success-notice">
              <ShieldCheck size={18} />
              <span>AI filled the form from your voice. Review details before submitting{transcript ? `: "${transcript.slice(0, 90)}${transcript.length > 90 ? '...' : ''}"` : '.'}</span>
            </div>
          )}

          {voiceError && (
            <div className="notice">
              <AlertTriangle size={18} />
              <span>{voiceError}</span>
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
              if (!selectedWard && !location) {
                toast.error('Choose a ward or add location before submitting');
                return;
              }
              submitIssue.mutate();
            }}
          >
            <fieldset>
              <legend>{t('category')}</legend>
              <div className="category-grid">
                {CATEGORIES.map(([value]) => (
                  <button
                    key={value}
                    type="button"
                    className={form.category === value ? 'active' : ''}
                    onClick={() => setForm((state) => ({ ...state, category: value }))}
                  >
                    {categoryLabel(language, value)}
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              {t('issueTitle')}
              <input
                required
                maxLength={80}
                value={form.title}
                onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))}
                placeholder="Large pothole near station exit"
              />
            </label>

            <label>
              {t('description')}
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
                {t('locationLabel')}
                <input
                  value={form.location_label}
                  onChange={(event) => setForm((state) => ({ ...state, location_label: event.target.value }))}
                  placeholder="Andheri West, Mumbai"
                />
              </label>
              <button className="button secondary location-button" type="button" onClick={getLocation} disabled={locating}>
                {locating ? <Loader2 size={17} className="spin" /> : <LocateFixed size={17} />}
                {t('useCurrent')}
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

            <fieldset>
              <legend>{t('wardMapping')}</legend>
              {selectedWard && (
                <div className="selected-ward">
                  <strong>Mapped to {selectedWard.name}</strong>
                  <span>{formatWard(selectedWard)}</span>
                </div>
              )}
              <input
                value={wardSearch}
                onChange={(event) => setWardSearch(event.target.value)}
                placeholder="Search ward, city, or state"
              />
              <div className="ward-options">
                {locations.isLoading && <span className="muted-row">Loading wards...</span>}
                {!locations.isLoading && locations.isError && <span className="muted-row">Could not load wards. You can still submit with GPS.</span>}
                {!locations.isLoading && !locations.isError && visibleWards.map((ward) => (
                  <button
                    key={ward.id}
                    type="button"
                    className={selectedWardId === ward.id ? 'active' : ''}
                    onClick={() => {
                      setSelectedWardId(ward.id);
                      setForm((state) => ({ ...state, location_label: state.location_label || ward.name }));
                    }}
                  >
                    <strong>{ward.name}</strong>
                    <span>{formatWard(ward)}</span>
                  </button>
                ))}
                {!locations.isLoading && !locations.isError && !visibleWards.length && (
                  <span className="muted-row">No wards found for this search.</span>
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend>{t('photosVideo')}</legend>
              <div className="media-uploader">
                {media.map((item) => (
                  <div className="media-thumb" key={item.id}>
                    {item.file.type.startsWith('image/') ? (
                      <img src={item.preview} alt="" />
                    ) : (
                      <span>{item.file.name}</span>
                    )}
                    <button type="button" onClick={() => removeMedia(item.id)} aria-label="Remove media">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {media.length < 4 && (
                  <button className="media-add" type="button" onClick={() => fileRef.current?.click()}>
                    <Camera size={18} />
                    Add
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={addMedia} />
              </div>
            </fieldset>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(event) => setForm((state) => ({ ...state, is_anonymous: event.target.checked }))}
              />
              {t('submitAnon')}
            </label>

            <button className="button primary submit-button" type="submit" disabled={submitIssue.isPending}>
              {submitIssue.isPending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              {t('submitIssue')}
            </button>
          </form>
        </div>

        <aside className="raise-side">
          {isAuthenticated ? (
            <div className="side-panel">
              <ShieldCheck size={22} />
              <h2>{t('readySubmit')}</h2>
              <p>{t('readyCopy')}</p>
            </div>
          ) : (
            <AuthPanel compact />
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function RepSummary({ title, rep }) {
  const { t } = useT();
  return (
    <div className="rep-card">
      <span>{title}</span>
      {rep ? (
        <>
          <strong>{rep.name}</strong>
          <small>{[rep.party, rep.constituency].filter(Boolean).join(' · ') || 'Mapped representative'}</small>
        </>
      ) : (
        <>
          <strong>{t('notMapped')}</strong>
          <small>{t('adminCanImport')}</small>
        </>
      )}
    </div>
  );
}

function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useT();

  const { data, isLoading } = useQuery({
    queryKey: ['issue', id, language],
    queryFn: () => api.get(`/api/issues/${id}`).then((r) => r.data),
  });

  const issue = data?.issue;
  const timeline = [...(issue?.issue_history || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <AppShell>
      <section className="detail-page">
        <button className="back-link" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          {t('back')}
        </button>

        {isLoading ? (
          <div className="detail-card loading-card" />
        ) : !issue ? (
          <EmptyState />
        ) : (
          <div className="detail-stack">
            <article className="detail-card">
              <div className="issue-meta">
                <span className="pill category">{categoryLabel(language, issue.category)}</span>
                <span className="pill status">{statusLabel(language, issue.status)}</span>
              </div>
              <h1>{issue.title}</h1>
              <p>{issue.description || t('noDescription')}</p>
              <div className="detail-grid">
                <span><MapPin size={17} /> {issue.wards?.name || issue.location_label || issue.city || 'Mumbai'}</span>
                <span><ThumbsUp size={17} /> {issue.upvote_count || 0} {t('upvotes')}</span>
                <span><Clock3 size={17} /> {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
              </div>
            </article>

            <section className="detail-card">
              <h2>{t('mappedReps')}</h2>
              <div className="rep-grid">
                <RepSummary title={t('corporator')} rep={issue.corporators} />
                <RepSummary title={t('mla')} rep={issue.mlas} />
                <RepSummary title={t('mp')} rep={issue.mps} />
              </div>
            </section>

            <section className="detail-card">
              <h2>{t('timeline')}</h2>
              <div className="timeline-list">
                {timeline.length ? timeline.map((item) => (
                  <div className="timeline-item" key={`${item.action}-${item.created_at}`}>
                    <strong>{String(item.action || 'UPDATE').replace(/_/g, ' ')}</strong>
                    <span>{item.actor_role || 'SYSTEM'} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    {item.note && <p>{item.note}</p>}
                  </div>
                )) : (
                  <div className="timeline-item">
                    <strong>CREATED</strong>
                    <span>CITIZEN · {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ProfileSettingsPage() {
  const { isAuthenticated, user, updateUser, logout } = useAuthStore();
  const { t, language } = useT();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(user?.home_ward_id || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  const locations = useQuery({
    queryKey: ['profile-locations'],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  const wards = locations.data?.wards || [];
  const visibleWards = useMemo(() => filterWards(wards, wardSearch).slice(0, 8), [wards, wardSearch]);
  const selectedWard = wards.find((ward) => ward.id === selectedWardId);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/api/auth/me', {
        name,
        phone,
        home_ward_id: selectedWardId || null,
        preferred_language: language,
      });
      return data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      toast.success(t('profileSaved'));
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Profile update failed'),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('avatar', file, file.name);
      const { data } = await api.post('/api/auth/me/avatar', fd);
      return data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      setAvatarPreview(data.user.avatar_url);
      toast.success('Profile photo updated');
    },
    onError: (error) => {
      setAvatarPreview(user?.avatar_url || '');
      toast.error(error.response?.data?.error || 'Profile photo upload failed');
    },
  });

  const removeAvatar = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/api/auth/me', { avatar_url: null });
      return data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      setAvatarPreview('');
      toast.success('Profile photo removed');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Could not remove profile photo'),
  });

  const pickAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file);
    event.target.value = '';
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <section className="auth-page">
          <div>
            <p className="eyebrow">Citizen profile</p>
            <h1>{t('citizenProfile')}</h1>
            <p className="lede">Your home ward helps CivicsPulse map reports to the right corporator and MLA.</p>
          </div>
          <AuthPanel redirectTo="/profile" />
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="profile-layout">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> {t('backToFeed')}</Link>

        <div className="profile-card profile-hero">
          <button className="avatar-preview" type="button" onClick={() => avatarInputRef.current?.click()}>
            {avatarPreview ? <img src={avatarPreview} alt="" /> : <span>{user?.name?.charAt(0) || 'C'}</span>}
          </button>
          <div>
            <p className="eyebrow">{t('citizenProfile')}</p>
            <h1>{user?.name || 'Citizen'}</h1>
            <p className="lede">{user?.email || user?.phone || 'CivicsPulse account'}</p>
            <div className="profile-actions">
              <button className="button secondary" type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadAvatar.isPending}>
                {uploadAvatar.isPending ? <Loader2 size={17} className="spin" /> : <Upload size={17} />}
                Change photo
              </button>
              {avatarPreview && (
                <button className="button secondary danger-button" type="button" onClick={() => removeAvatar.mutate()} disabled={removeAvatar.isPending}>
                  Remove
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={pickAvatar} hidden />
            </div>
          </div>
        </div>

        <form
          className="profile-card profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveProfile.mutate();
          }}
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('accountDetails')}</p>
              <h2>{t('profileTitle')}</h2>
            </div>
          </div>

          <label>
            {t('name')}
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
          </label>

          <label>
            {t('phone')}
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Mobile number" />
          </label>

          <LanguageSelect label className="profile-language" />

          <fieldset>
            <legend>{t('homeWard')}</legend>
            {selectedWard && (
              <div className="selected-ward">
                <strong>{selectedWard.name}</strong>
                <span>{formatWard(selectedWard)}</span>
              </div>
            )}
            <input
              value={wardSearch}
              onChange={(event) => setWardSearch(event.target.value)}
              placeholder="Search city, ward number, or ward name"
            />
            <div className="ward-options">
              {locations.isLoading && <span className="muted-row">Loading wards...</span>}
              {!locations.isLoading && locations.isError && <span className="muted-row">Could not load wards. Please try again later.</span>}
              {!locations.isLoading && !locations.isError && visibleWards.map((ward) => (
                <button
                  key={ward.id}
                  type="button"
                  className={selectedWardId === ward.id ? 'active' : ''}
                  onClick={() => setSelectedWardId(ward.id)}
                >
                  <strong>{ward.name}</strong>
                  <span>{formatWard(ward)}</span>
                </button>
              ))}
              {!locations.isLoading && !locations.isError && !visibleWards.length && <span className="muted-row">No wards found for this search.</span>}
            </div>
          </fieldset>

          <div className="profile-footer-actions">
            <button className="button primary submit-button" type="submit" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
              {t('saveProfile')}
            </button>
            <button className="button secondary danger-button" type="button" onClick={() => { logout(); navigate('/'); }}>
              <LogOut size={17} />
              {t('signOut')}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

function RepresentativeDeskPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { t, language } = useT();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [reportForm, setReportForm] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const isRep = ['CORPORATOR', 'MLA', 'MP'].includes(user?.role);

  const repSummary = useQuery({
    queryKey: ['rep-summary'],
    queryFn: () => api.get('/api/rep/me').then((r) => r.data),
    enabled: isAuthenticated && isRep,
  });

  const issuesQuery = useQuery({
    queryKey: ['rep-issues', language, statusFilter],
    queryFn: () => api.get('/api/rep/me/issues', {
      params: { status: statusFilter || undefined, limit: 100 },
    }).then((r) => r.data),
    enabled: isAuthenticated && isRep,
  });

  const requestsQuery = useQuery({
    queryKey: ['rep-report-requests'],
    queryFn: () => api.get('/api/rep/me/report-card-requests').then((r) => r.data),
    enabled: isAuthenticated && isRep,
  });

  const updateStatus = useMutation({
    mutationFn: ({ issueId, status }) => api.patch(`/api/issues/${issueId}/status`, { status, note: statusNote }),
    onSuccess: () => {
      setStatusNote('');
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['rep-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Status update failed'),
  });

  const requestReport = useMutation({
    mutationFn: () => api.post('/api/rep/me/report-card-requests', reportForm),
    onSuccess: () => {
      toast.success('Report card request sent to admin');
      queryClient.invalidateQueries({ queryKey: ['rep-report-requests'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Report request failed'),
  });

  const downloadExport = async (request, format) => {
    try {
      const { data } = await api.get(`/api/rep/report-card-requests/${request.id}/export/${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `civicspulse-report-card-${request.month}-${request.year}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Download failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <section className="auth-page">
          <div>
            <p className="eyebrow">Representative desk</p>
            <h1>Sign in to manage tagged posts</h1>
            <p className="lede">Corporator and MLA accounts are linked by admin after representative data is uploaded.</p>
          </div>
          <AuthPanel redirectTo="/rep" />
        </section>
      </AppShell>
    );
  }

  if (!isRep) {
    return (
      <AppShell>
        <section className="detail-page">
          <div className="notice">
            <AlertTriangle size={18} />
            <span>Your account is a citizen account. Admin must link you as a Corporator or MLA before this desk opens.</span>
          </div>
        </section>
      </AppShell>
    );
  }

  const issues = issuesQuery.data?.issues || [];
  const stats = repSummary.data?.stats || issuesQuery.data?.stats || {};
  const identity = repSummary.data?.identity || issuesQuery.data?.identity;
  const requests = requestsQuery.data?.requests || [];

  return (
    <AppShell>
      <section className="rep-layout">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Representative desk</p>
            <h1>{identity?.display_name || user?.name}</h1>
            <p className="lede">Review posts tagged to your ward or zone, update status, and request approved report cards.</p>
          </div>
        </div>

        <div className="stats-grid compact-stats">
          {[
            ['Tagged posts', stats.total_issues || 0],
            ['In progress', stats.in_progress_issues || 0],
            ['Resolved', stats.resolved_issues || 0],
            ['Resolution rate', `${stats.resolution_rate || 0}%`],
          ].map(([label, value]) => (
            <div className="stat-card" key={label}>
              <span>{value}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        <div className="rep-grid-layout">
          <section className="admin-panel">
            <div className="panel-title">
              <Megaphone size={19} />
              <h2>Tagged posts</h2>
            </div>
            <div className="feed-toolbar rep-toolbar">
              <label className="select-field">
                <ListFilter size={17} />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </label>
              <input value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Optional timeline note" />
            </div>

            <div className="rep-issue-list">
              {issuesQuery.isLoading && <div className="loading-card rep-row" />}
              {!issuesQuery.isLoading && issues.map((issue) => (
                <article className="rep-row" key={issue.id}>
                  <div>
                    <span className="pill status">{statusLabel(language, issue.status)}</span>
                    <h3>{issue.title}</h3>
                    <p>{issue.wards?.name || issue.location_label || issue.city || 'Mapped area'}</p>
                  </div>
                  <div className="rep-actions">
                    <Link className="text-button" to={`/issues/${issue.id}`}><Eye size={16} /> View</Link>
                    <button className="button secondary" type="button" onClick={() => updateStatus.mutate({ issueId: issue.id, status: 'IN_PROGRESS' })}>
                      In progress
                    </button>
                    <button className="button primary" type="button" onClick={() => updateStatus.mutate({ issueId: issue.id, status: 'RESOLVED' })}>
                      Resolved
                    </button>
                  </div>
                </article>
              ))}
              {!issuesQuery.isLoading && !issues.length && <p className="lede">No tagged posts found for this filter.</p>}
            </div>
          </section>

          <aside className="admin-panel">
            <div className="panel-title">
              <FileText size={19} />
              <h2>Report card</h2>
            </div>
            <form
              className="report-form"
              onSubmit={(event) => {
                event.preventDefault();
                requestReport.mutate();
              }}
            >
              <label>
                Month
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={reportForm.month}
                  onChange={(event) => setReportForm((state) => ({ ...state, month: Number(event.target.value) }))}
                />
              </label>
              <label>
                Year
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={reportForm.year}
                  onChange={(event) => setReportForm((state) => ({ ...state, year: Number(event.target.value) }))}
                />
              </label>
              <button className="button primary" type="submit" disabled={requestReport.isPending}>
                {requestReport.isPending ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
                Request PDF + CSV
              </button>
            </form>

            <div className="request-list">
              {requests.map((request) => (
                <div className="mapping-row" key={request.id}>
                  <strong>{request.month}/{request.year} · {request.status}</strong>
                  <small>{new Date(request.created_at).toLocaleString()}</small>
                  {request.status === 'APPROVED' ? (
                    <span className="download-actions">
                      <button className="text-button" type="button" onClick={() => downloadExport(request, 'pdf')}><Download size={15} /> PDF</button>
                      <button className="text-button" type="button" onClick={() => downloadExport(request, 'csv')}><Download size={15} /> CSV</button>
                    </span>
                  ) : (
                    <span>{request.review_note || 'Waiting for admin approval'}</span>
                  )}
                </div>
              ))}
              {!requests.length && <p className="lede">No report-card requests yet.</p>}
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

const SAMPLE_REP_CSV = `state_code,state_name,city,zone_name,ward_number,ward_name,corporator_name,corporator_party,corporator_phone,corporator_email,mla_name,mla_party,mla_constituency,mla_phone,mla_email,term_start,term_end,source_url
MH,Maharashtra,Mumbai,A,A,Colaba,Colaba Corporator,Party,+911111111111,colaba-corp@example.com,Colaba MLA,Party,Colaba,+912222222222,colaba-mla@example.com,2026-01-01,,https://official-source.example/colaba
MH,Maharashtra,Mumbai,H-West,H-West,Bandra West,Bandra Corporator,Party,+913333333333,bandra-corp@example.com,Bandra MLA,Party,Bandra West,+914444444444,bandra-mla@example.com,2026-01-01,,https://official-source.example/bandra
MH,Maharashtra,Mumbai,K-West,K-West,Andheri West,Andheri Corporator,Party,+915555555555,andheri-corp@example.com,Andheri MLA,Party,Andheri West,+916666666666,andheri-mla@example.com,2026-01-01,,https://official-source.example/andheri`;

function AdminImportPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useT();
  const [importText, setImportText] = useState(SAMPLE_REP_CSV);
  const [sourceUrl, setSourceUrl] = useState('');
  const [linkForm, setLinkForm] = useState({ email: '', role: 'CORPORATOR', rep_id: '' });
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

  const corporators = useQuery({
    queryKey: ['admin-corporators'],
    queryFn: () => api.get('/api/admin/reps/corporators').then((r) => r.data),
    enabled: isAdmin,
  });

  const mlas = useQuery({
    queryKey: ['admin-mlas'],
    queryFn: () => api.get('/api/admin/reps/mlas').then((r) => r.data),
    enabled: isAdmin,
  });

  const reportRequests = useQuery({
    queryKey: ['admin-report-requests'],
    queryFn: () => api.get('/api/admin/report-card-requests').then((r) => r.data),
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

  const linkRepresentative = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/admin/reps/link-user', {
        email: linkForm.email.trim(),
        role: linkForm.role,
        rep_id: linkForm.rep_id,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Representative user linked');
      setLinkForm((state) => ({ ...state, email: '', rep_id: '' }));
      queryClient.invalidateQueries({ queryKey: ['admin-corporators'] });
      queryClient.invalidateQueries({ queryKey: ['admin-mlas'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Representative link failed'),
  });

  const reviewReport = useMutation({
    mutationFn: ({ id, status }) => api.put(`/api/admin/report-card-requests/${id}`, { status }),
    onSuccess: () => {
      toast.success('Report request updated');
      queryClient.invalidateQueries({ queryKey: ['admin-report-requests'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Report review failed'),
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
            <h1>{t('adminAccess')}</h1>
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
  const representativeOptions = linkForm.role === 'MLA' ? (mlas.data?.mlas || []) : (corporators.data?.corporators || []);
  const pendingReports = reportRequests.data?.requests || [];

  return (
    <AppShell>
      <section className="admin-layout">
        <div className="section-heading">
          <p className="eyebrow">Backend data control</p>
          <h1>{t('adminTitle')}</h1>
          <p className="lede">{t('adminCopy')}</p>
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
              <h2>{t('manualImport')}</h2>
            </div>

            <div className="template-tools">
              <a
                className="button secondary"
                href="/representative-import-template.csv"
                download="civicpulse-representative-import-template.csv"
              >
                <Download size={17} />
                {t('downloadSample')}
              </a>
              <button className="button secondary" type="button" onClick={() => setImportText(SAMPLE_REP_CSV)}>
                <FileText size={17} />
                {t('loadSample')}
              </button>
            </div>
            <p className="template-help">
              Download the CSV, update ward/corporator/MLA rows, then upload it here or paste the edited rows below.
            </p>

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
              {t('importData')}
            </button>
          </form>

          <aside className="admin-panel">
            <div className="panel-title">
              <Database size={19} />
              <h2>{t('currentMapping')}</h2>
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
            <ShieldCheck size={19} />
            <h2>Representative onboarding</h2>
          </div>
          <form
            className="admin-mini-form"
            onSubmit={(event) => {
              event.preventDefault();
              linkRepresentative.mutate();
            }}
          >
            <label>
              Signed-up user email
              <input
                type="email"
                value={linkForm.email}
                onChange={(event) => setLinkForm((state) => ({ ...state, email: event.target.value }))}
                placeholder="representative@example.com"
                required
              />
            </label>
            <label>
              Role
              <select
                value={linkForm.role}
                onChange={(event) => setLinkForm({ email: linkForm.email, role: event.target.value, rep_id: '' })}
              >
                <option value="CORPORATOR">Corporator</option>
                <option value="MLA">MLA</option>
              </select>
            </label>
            <label>
              Representative record
              <select
                value={linkForm.rep_id}
                onChange={(event) => setLinkForm((state) => ({ ...state, rep_id: event.target.value }))}
                required
              >
                <option value="">Choose mapped representative</option>
                {representativeOptions.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} · {rep.wards?.name || rep.zones?.name || rep.constituency || rep.email || 'Mapped area'}
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary" type="submit" disabled={linkRepresentative.isPending}>
              {linkRepresentative.isPending ? <Loader2 size={17} className="spin" /> : <ShieldCheck size={17} />}
              Link role
            </button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="panel-title">
            <FileText size={19} />
            <h2>Report-card approvals</h2>
          </div>
          <div className="import-history">
            {pendingReports.map((request) => (
              <div key={request.id} className="mapping-row report-review-row">
                <strong>{request.rep_type} · {request.month}/{request.year} · {request.status}</strong>
                <small>{request.users?.name || request.users?.email || request.requester_id}</small>
                {request.status === 'REQUESTED' ? (
                  <span className="review-actions">
                    <button className="button primary" type="button" onClick={() => reviewReport.mutate({ id: request.id, status: 'APPROVED' })}>
                      Approve
                    </button>
                    <button className="button secondary danger-button" type="button" onClick={() => reviewReport.mutate({ id: request.id, status: 'REJECTED' })}>
                      Reject
                    </button>
                  </span>
                ) : (
                  <span>{request.review_note || `Reviewed ${request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : ''}`}</span>
                )}
              </div>
            ))}
            {!pendingReports.length && <p className="lede">No report-card requests yet.</p>}
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-title">
            <Clock3 size={19} />
            <h2>{t('recentImports')}</h2>
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
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProfileSettingsPage />} />
      <Route path="/rep" element={<RepresentativeDeskPage />} />
      <Route path="/admin" element={<AdminImportPage />} />
      <Route path="/issues/:id" element={<IssueDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
