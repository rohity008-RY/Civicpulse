import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
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
  Flag,
  Globe2,
  KeyRound,
  Lightbulb,
  ListFilter,
  Loader2,
  LocateFixed,
  LogOut,
  Map,
  MapPin,
  Mic,
  Megaphone,
  Newspaper,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Siren,
  Square,
  ThumbsUp,
  Trophy,
  Upload,
  X,
  Home as HomeIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from './utils/api';
import { useAuthStore } from './store/authStore';
import { normalizeLanguage, useLanguageStore } from './store/languageStore';
import { categoryLabel, statusLabel, useT } from './utils/i18n';
import CitizenHome, { CitizenUpdates } from './components/citizen/CitizenHome';
import IssueActions from './components/citizen/IssueActions';
import { citizenText } from './components/citizen/copy';
const IssueMap = lazy(() => import('./components/citizen/IssueMap'));
import {
  BRAND_NAME,
  CATEGORY_SEO_PAGES,
  DEFAULT_IMAGE as SEO_DEFAULT_IMAGE,
  SEO_LANGUAGES,
  STATIC_SEO_ROUTES,
  WARD_SEO_PAGES,
  absoluteUrl,
  cleanPath,
  getAlternates,
  getCategoryByPath,
  getLocalizedPath,
  getLocalizedSeoCopy,
  getSeoPageByPath,
  getWardBySlug,
} from './utils/seoContent.mjs';

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

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function ensureLink(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function buildFaqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function buildWebPageSchema({ title, description, url, language }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    inLanguage: SEO_LANGUAGES.find((item) => item.code === language)?.locale || 'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      name: BRAND_NAME,
      url: absoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      url: absoluteUrl('/'),
      logo: absoluteUrl('/icon.png'),
    },
  };
}

function SEOHead({
  title,
  description,
  canonicalPath = '/',
  alternatesPath = canonicalPath,
  keywords = [],
  image = SEO_DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  schema = [],
}) {
  const { language } = useT();
  const canonicalUrl = absoluteUrl(canonicalPath);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  const keywordText = keywords.filter(Boolean).join(', ');
  const schemaJson = JSON.stringify([
    buildWebPageSchema({ title, description, url: canonicalUrl, language }),
    ...schema.filter(Boolean),
  ]);

  useEffect(() => {
    document.documentElement.lang = language || 'en';
    document.title = title;
    ensureMeta('meta[name="description"]', { name: 'description', content: description });
    ensureMeta('meta[name="robots"]', { name: 'robots', content: robots });
    if (keywordText) ensureMeta('meta[name="keywords"]', { name: 'keywords', content: keywordText });
    ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: BRAND_NAME });
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    ensureMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl });
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    ensureMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl });
    ensureLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

    document.head.querySelectorAll('link[data-civicspulse-hreflang]').forEach((element) => element.remove());
    getAlternates(alternatesPath).forEach((alternate) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = alternate.hreflang;
      link.href = alternate.href;
      link.setAttribute('data-civicspulse-hreflang', 'true');
      document.head.appendChild(link);
    });

    let script = document.head.querySelector('script[data-civicspulse-jsonld]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-civicspulse-jsonld', 'true');
      document.head.appendChild(script);
    }
    script.textContent = schemaJson;
  }, [alternatesPath, canonicalUrl, description, imageUrl, keywordText, language, robots, schemaJson, title, type]);

  return null;
}

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

const FALLBACK_AWARENESS_ITEMS = [
  {
    id: 'fallback-monsoon',
    title: 'Monsoon watch: report waterlogging early',
    summary: 'Add a clear photo, road name, and nearest landmark so drainage teams can identify repeat flooding points quickly.',
    category: 'ALERT',
    city: 'Mumbai',
    ward_label: 'All wards',
    action_label: 'Raise water issue',
  },
  {
    id: 'fallback-pothole',
    title: 'Better pothole reports get faster routing',
    summary: 'Stand safely, capture the road edge and landmark, and choose the pothole category so the issue reaches the right queue.',
    category: 'GUIDE',
    city: 'Mumbai',
    ward_label: 'Roads',
    action_label: 'Learn report tips',
  },
  {
    id: 'fallback-garbage',
    title: 'Repeat garbage dumping needs pattern details',
    summary: 'Mention timing, nearby shop/building, and whether cleanup has already happened so ward officers can spot repeat dumping.',
    category: 'AWARENESS',
    city: 'Mumbai',
    ward_label: 'Sanitation',
    action_label: 'Report garbage',
  },
];

const AUTH_TIPS = [
  ['Photo evidence', 'Wide photo plus close-up helps teams verify faster.', Camera],
  ['Right category', 'Pothole, garbage, water, safety, tree, or streetlight routes the work.', ListFilter],
  ['Representative mapping', 'Ward and zone data connects reports to Corporator and MLA dashboards.', ShieldCheck],
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

function NotificationCenter() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/api/notifications', { params: { limit: 8 } }).then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: open ? false : 60000,
  });

  const markRead = useMutation({
    mutationFn: () => api.post('/api/notifications/mark-read', { ids: [] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!isAuthenticated) return null;

  const list = notifications.data?.notifications || [];
  const unread = notifications.data?.unread_count || 0;

  return (
    <div className="notification-center">
      <button
        className="icon-button notification-button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notification-popover">
          <div className="notification-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="text-button" type="button" onClick={() => markRead.mutate()}>
                Mark read
              </button>
            )}
          </div>
          {notifications.isLoading ? (
            <p className="lede">Loading updates...</p>
          ) : list.length ? (
            list.map((item) => (
              <Link
                key={item.id}
                className={`notification-row ${item.is_read ? '' : 'unread'}`}
                to={item.data?.issue_id ? `/issues/${item.data.issue_id}` : item.data?.report_card_request_id ? '/rep' : '/'}
                onClick={() => setOpen(false)}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
                <small>{new Date(item.created_at).toLocaleString()}</small>
              </Link>
            ))
          ) : (
            <p className="lede">No notifications yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function SeoFooter() {
  const priorityLinks = [
    ['Mumbai civic reporting', '/mumbai'],
    ['Public issue tracker', '/public-issues'],
    ['Civic news', '/civic-news'],
    ['Daily civic puzzle', '/daily-civic-puzzle'],
    ['Corporator list', '/corporator-list-mumbai'],
    ['MLA list', '/mla-list-mumbai'],
  ];
  const categoryLinks = CATEGORY_SEO_PAGES.slice(0, 6).map((page) => [page.category, page.path]);
  const wardLinks = WARD_SEO_PAGES.slice(0, 6).map((ward) => [ward.name, `/mumbai/wards/${ward.slug}`]);

  return (
    <footer className="seo-footer">
      <div>
        <strong>{BRAND_NAME}</strong>
        <p>Mumbai civic reporting, ward issue tracking, and representative mapping for citizens.</p>
      </div>
      <nav aria-label="SEO discovery links">
        <section>
          <h2>Explore</h2>
          {priorityLinks.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
        </section>
        <section>
          <h2>Report by category</h2>
          {categoryLinks.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
        </section>
        <section>
          <h2>Popular wards</h2>
          {wardLinks.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
        </section>
      </nav>
    </footer>
  );
}

function AppShell({ children, compactAuth = false }) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, language } = useT();
  const c = citizenText(language);

  return (
    <div className="app-shell">
      <header className={`topbar ${compactAuth ? 'compact-auth-topbar' : ''}`}>
        <Link to="/" className="brand">
          <img src="/icon.png" alt="" className="brand-mark" />
          <span>
            <strong>CivicsPulse</strong>
            <small>Your neighbourhood. Your voice.</small>
          </span>
        </Link>

        {!compactAuth && (
          <nav className="topnav" aria-label="Primary">
            <NavLink to="/" end><HomeIcon size={16} />{c.home}</NavLink>
            <NavLink to="/nearby"><MapPin size={16} />{c.nearby}</NavLink>
            <NavLink to="/updates"><Bell size={16} />{c.updates}</NavLink>
            <NavLink to="/headlines"><Newspaper size={16} />{t('headlines')}</NavLink>
            {['CORPORATOR', 'MLA', 'MP'].includes(user?.role) && <NavLink to="/rep">Rep desk</NavLink>}
            {user?.role === 'ADMIN' && <NavLink to="/admin">{t('admin')}</NavLink>}
          </nav>
        )}

        <div className="top-actions">
          {!compactAuth && <LanguageSelect />}
          {isAuthenticated && !compactAuth && <NotificationCenter />}
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
          ) : compactAuth ? (
            <Link className="button secondary" to="/">Explore feed</Link>
          ) : (
            <Link className="button secondary" to="/login">{t('signIn')}</Link>
          )}
          {!compactAuth && (
            <Link className="button primary" to="/raise">
              <Plus size={17} />
              {t('raiseIssue')}
            </Link>
          )}
        </div>
      </header>

      <main>{children}</main>
      {!compactAuth && <SeoFooter />}
      {!compactAuth && <nav className="citizen-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" end><HomeIcon size={20} /><span>{c.home}</span></NavLink>
        <NavLink to="/nearby"><MapPin size={20} /><span>{c.nearby}</span></NavLink>
        <NavLink to="/raise" className="citizen-nav-report"><span className="citizen-nav-plus"><Plus size={24} /></span><span>{c.report}</span></NavLink>
        <NavLink to="/updates"><Bell size={20} /><span>{c.updates}</span></NavLink>
        <NavLink to="/profile"><CircleUserRound size={20} /><span>{t('profile')}</span></NavLink>
      </nav>}
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

function CivicPulseMapPanel() {
  const reduced = useReducedMotion();
  const { language } = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['public-map-pulse', language],
    queryFn: () => Promise.all([
      api.get('/api/feed/map', { params: { limit: 18 } }).then((r) => r.data),
      api.get('/api/feed/digest').then((r) => r.data),
    ]).then(([mapData, digestData]) => ({ mapData, digestData })),
  });

  const points = data?.mapData?.points || [];
  const hotspots = data?.digestData?.ward_hotspots || [];

  return (
    <motion.section
      className="pulse-map-panel"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="panel-title">
        <Map size={19} />
        <h2>Live civic pulse</h2>
      </div>
      <div className="pulse-map-grid">
        <div className="mini-map">
          {isLoading ? (
            <div className="loading-card map-loading" />
          ) : points.length ? (
            points.slice(0, 12).map((point, index) => (
              <Link
                key={point.id}
                className={`map-pin pin-${index % 6}`}
                to={`/issues/${point.id}`}
                style={{ '--pin-x': `${12 + ((index * 23) % 76)}%`, '--pin-y': `${16 + ((index * 31) % 68)}%` }}
                title={point.title}
              >
                <span>{point.trending_score > 10 ? '!' : index + 1}</span>
              </Link>
            ))
          ) : (
            <p className="lede">No public map items yet.</p>
          )}
        </div>
        <div className="hotspot-list">
          <strong>Ward hotspots this month</strong>
          {hotspots.slice(0, 5).map((item) => (
            <div className="hotspot-row" key={item.ward}>
              <span>{item.ward}</span>
              <small>{item.total} reports · {item.resolved} resolved · {item.escalated} escalated</small>
            </div>
          ))}
          {!hotspots.length && <p className="lede">Hotspots appear after reports are raised.</p>}
        </div>
      </div>
    </motion.section>
  );
}

function TrackIssueBox() {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState('');

  const trackIssue = useMutation({
    mutationFn: async () => {
      const code = trackingCode.trim().toUpperCase();
      if (!code) throw new Error('Enter a CivicsPulse issue ID');
      const { data } = await api.get(`/api/issues/track/${encodeURIComponent(code)}`);
      return data.issue;
    },
    onSuccess: (issue) => {
      setTrackingCode('');
      navigate(`/issues/${issue.id}`);
    },
    onError: (error) => toast.error(error.response?.data?.error || error.message || 'Issue not found'),
  });

  return (
    <section className="track-box">
      <div>
        <p className="eyebrow">Track report</p>
        <h2>Find any issue by ID</h2>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          trackIssue.mutate();
        }}
      >
        <input
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
          placeholder="CP-MH-MUMB-A1AC61EB"
          aria-label="CivicsPulse issue ID"
        />
        <button className="button primary" type="submit" disabled={trackIssue.isPending}>
          {trackIssue.isPending ? <Loader2 size={17} className="spin" /> : <Search size={17} />}
          Track
        </button>
      </form>
    </section>
  );
}

function PublicIssueTracker({ compact = false }) {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState('');
  const tracker = useMutation({
    mutationFn: async () => {
      const code = trackingCode.trim().toUpperCase();
      if (!code) throw new Error('Enter a CivicsPulse issue ID');
      const { data } = await api.get(`/api/issues/track/${encodeURIComponent(code)}`);
      return data.issue;
    },
    onSuccess: (issue) => {
      setTrackingCode('');
      navigate(`/issues/${issue.id}`);
    },
    onError: (error) => toast.error(error.response?.data?.error || error.message || 'Issue not found'),
  });

  return (
    <section className={`public-tracker ${compact ? 'compact' : ''}`}>
      <div>
        <p className="eyebrow">Public tracking</p>
        <h2>Track any report without login</h2>
        <p>Use your public CivicsPulse ID to see status, representative mapping, and timeline.</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          tracker.mutate();
        }}
      >
        <input
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
          placeholder="CP-MH-MUMB-A1AC61EB"
          aria-label="CivicsPulse public issue ID"
        />
        <button className="button primary" type="submit" disabled={tracker.isPending}>
          {tracker.isPending ? <Loader2 size={17} className="spin" /> : <Search size={17} />}
          Track
        </button>
      </form>
    </section>
  );
}

function LoginImpactStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['login-impact-stats'],
    queryFn: () => Promise.all([
      api.get('/api/feed/stats').then((r) => r.data),
      api.get('/api/feed/digest').then((r) => r.data).catch(() => null),
    ]).then(([stats, digest]) => ({ stats, digest })),
  });

  const stats = data?.stats || {};
  const digest = data?.digest || {};
  const items = [
    ['Reports raised', stats.total_issues ?? 0, BarChart3],
    ['Resolved', stats.resolved_issues ?? 0, CheckCircle2],
    ['Active wards', digest.ward_hotspots?.length ?? 0, Map],
    ['Representatives', stats.active_reps ?? 0, Megaphone],
  ];

  return (
    <section className="login-impact-grid" aria-label="CivicsPulse impact">
      {items.map(([label, value, Icon]) => (
        <div className="login-impact-tile" key={label}>
          <Icon size={17} />
          <strong>{isLoading ? '...' : value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}

function AuthAwarenessCarousel() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const { data } = useQuery({
    queryKey: ['login-awareness-items'],
    queryFn: () => api.get('/api/awareness', { params: { limit: 8 } }).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const items = data?.items?.length ? data.items : FALLBACK_AWARENESS_ITEMS;
  const item = items[active % items.length];

  useEffect(() => {
    if (reduced || items.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % items.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [items.length, reduced]);

  return (
    <section className="awareness-carousel">
      <div className="awareness-topline">
        <span><Newspaper size={16} /> Awareness news</span>
        <small>{item.city || 'Mumbai'} · {item.ward_label || 'All wards'}</small>
      </div>
      <motion.div
        key={item.id || item.slug}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="awareness-category">{item.category || 'AWARENESS'}</span>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
      </motion.div>
      <div className="awareness-dots" aria-label="Awareness carousel controls">
        {items.map((entry, index) => (
          <button
            key={entry.id || entry.slug || index}
            type="button"
            className={index === active % items.length ? 'active' : ''}
            onClick={() => setActive(index)}
            aria-label={`Show awareness item ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function WardDetectPreview() {
  const [locating, setLocating] = useState(false);
  const [ward, setWard] = useState(null);

  const detectWard = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data } = await api.get('/api/reps/ward-lookup', {
            params: { lat: position.coords.latitude, lng: position.coords.longitude },
          });
          setWard(data.ward || null);
          if (data.ward) toast.success(`Ward detected: ${data.ward.name || data.ward.ward_number}`);
        } catch (error) {
          toast.error(error.response?.data?.error || 'Could not detect ward. You can still search manually while signing up.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error('Location permission was not granted. Manual ward search is available.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <section className="ward-detect-card">
      <div>
        <p className="eyebrow">Ward auto-detect</p>
        <h2>Map your issue to the right people</h2>
        <p>{ward ? `Detected ${formatWard(ward)}.` : 'Use GPS during signup or search your ward manually.'}</p>
      </div>
      <button className="button secondary" type="button" onClick={detectWard} disabled={locating}>
        {locating ? <Loader2 size={17} className="spin" /> : <LocateFixed size={17} />}
        Detect my ward
      </button>
    </section>
  );
}

function AuthMiniPuzzle() {
  const { key, puzzle } = getDailyPuzzle();
  const [selected, setSelected] = useState(() => {
    const stored = window.localStorage.getItem(`${key}-login`);
    return stored === null ? null : Number(stored);
  });
  const solved = selected === puzzle.answer;

  const choose = (index) => {
    setSelected(index);
    window.localStorage.setItem(`${key}-login`, String(index));
  };

  return (
    <section className="login-puzzle">
      <div className="puzzle-header compact">
        <span className="puzzle-icon"><Lightbulb size={18} /></span>
        <div>
          <p className="eyebrow">Daily civic puzzle</p>
          <h2>{puzzle.title}</h2>
        </div>
      </div>
      <p>{puzzle.prompt}</p>
      <div className="login-puzzle-options">
        {puzzle.choices.map((choice, index) => (
          <button
            key={choice}
            type="button"
            className={`${selected === index ? 'picked' : ''} ${selected !== null && index === puzzle.answer ? 'right' : ''}`}
            onClick={() => choose(index)}
          >
            {choice}
          </button>
        ))}
      </div>
      {selected !== null && <small>{solved ? 'Good civic instinct.' : 'Try this tip:'} {puzzle.note}</small>}
    </section>
  );
}

function CivicLoginVisual() {
  return (
    <figure className="login-visual">
      <img src="/civic-hero.png" alt="Mumbai citizens documenting a civic issue" />
      <figcaption>
        <span><MapPin size={14} /> Mumbai ward network</span>
        <strong>Photo, voice, GPS, and public tracking in one flow</strong>
      </figcaption>
    </figure>
  );
}

function AwarenessTipCards() {
  return (
    <section className="auth-tip-grid" aria-label="How to raise better civic reports">
      {AUTH_TIPS.map(([title, copy, Icon]) => (
        <article key={title}>
          <Icon size={18} />
          <strong>{title}</strong>
          <span>{copy}</span>
        </article>
      ))}
    </section>
  );
}

function VoiceEntryCard() {
  return (
    <section className="voice-entry-card">
      <span><Mic size={18} /></span>
      <div>
        <strong>Speak your issue</strong>
        <p>Open the voice-assisted form, review AI-filled details, then sign in to submit.</p>
      </div>
      <Link className="button secondary" to="/raise?voice=1">Start</Link>
    </section>
  );
}

function DashboardPage() {
  const page = getSeoPageByPath('/');
  return <><SEOHead title={page.title} description={page.description} canonicalPath="/" keywords={page.keywords} /><AppShell><CitizenHome DailyPuzzle={DailyPuzzleCard} ReportTracker={TrackIssueBox} /></AppShell></>;
}

function CitizenPage({ mode }) {
  const path = mode === 'updates' ? '/updates' : mode === 'mine' ? '/my-reports' : '/nearby';
  return <><SEOHead title={`${mode === 'updates' ? 'Your updates' : mode === 'mine' ? 'Your reports' : 'Nearby civic reports'} | CivicsPulse`} description="Follow the progress of civic reports in your neighbourhood." canonicalPath={path} noindex={mode !== 'nearby'} /><AppShell>{mode === 'updates' ? <CitizenUpdates DailyPuzzle={DailyPuzzleCard} /> : <CitizenHome mode={mode} DailyPuzzle={DailyPuzzleCard} />}</AppShell></>;
}

function HeadlineCard({ issue, kind = 'latest' }) {
  const reduced = useReducedMotion();
  const { language } = useT();
  const created = issue.created_at ? formatDistanceToNow(new Date(issue.created_at), { addSuffix: true }) : '';
  const label = kind === 'trending'
    ? 'Trending'
    : kind === 'escalated'
      ? 'Escalated'
      : issue.status === 'RESOLVED'
        ? 'Resolved'
        : 'Latest';

  return (
    <motion.article
      className={`headline-card ${kind}`}
      variants={fadeUp}
      whileHover={reduced ? undefined : { y: -4, transition: { duration: 0.16 } }}
    >
      <div className="headline-topline">
        <span>{label}</span>
        {issue.public_id && <small>{issue.public_id}</small>}
      </div>
      <h2>{issue.title}</h2>
      <p>{issue.description || 'No description added yet.'}</p>
      <div className="headline-meta">
        <span><MapPin size={15} /> {issue.wards?.name || issue.location_label || issue.city || 'Mumbai'}</span>
        <span>{categoryLabel(language, issue.category)}</span>
        <span>{statusLabel(language, issue.status)}</span>
      </div>
      <div className="headline-footer">
        <span><ThumbsUp size={15} /> {issue.upvote_count || 0}</span>
        <span><Clock3 size={15} /> {created}</span>
        <Link className="text-button" to={`/issues/${issue.id}`}>
          <Eye size={16} />
          Read
        </Link>
      </div>
    </motion.article>
  );
}

function HeadlinesPage() {
  const reduced = useReducedMotion();
  const { t, language } = useT();
  const headlinesSeo = getSeoPageByPath('/headlines');
  const [scope, setScope] = useState('all');

  const latest = useQuery({
    queryKey: ['headlines-latest', language],
    queryFn: () => api.get('/api/feed/home', { params: { sort: 'newest', limit: 18 } }).then((r) => r.data),
  });
  const trending = useQuery({
    queryKey: ['headlines-trending', language],
    queryFn: () => api.get('/api/feed/home', { params: { sort: 'trending', limit: 8 } }).then((r) => r.data),
  });
  const escalated = useQuery({
    queryKey: ['headlines-escalated', language],
    queryFn: () => api.get('/api/feed/escalated', { params: { limit: 8, sort: 'newest' } }).then((r) => r.data),
  });
  const digest = useQuery({
    queryKey: ['headlines-digest'],
    queryFn: () => api.get('/api/feed/digest').then((r) => r.data),
  });

  const headlineBuckets = useMemo(() => {
    const latestIssues = latest.data?.issues || [];
    const trendingIssues = trending.data?.issues || [];
    const escalatedIssues = escalated.data?.issues || [];
    const seen = new Set();
    const addKind = (items, kind) => items
      .filter((issue) => {
        if (seen.has(issue.id)) return false;
        seen.add(issue.id);
        return true;
      })
      .map((issue) => ({ issue, kind }));

    return [
      ...addKind(trendingIssues, 'trending'),
      ...addKind(escalatedIssues, 'escalated'),
      ...addKind(latestIssues, 'latest'),
    ];
  }, [latest.data, trending.data, escalated.data]);

  const visibleHeadlines = headlineBuckets.filter(({ kind, issue }) => {
    if (scope === 'all') return true;
    if (scope === 'trending') return kind === 'trending';
    if (scope === 'escalated') return kind === 'escalated' || Boolean(issue.escalated_at);
    if (scope === 'resolved') return issue.status === 'RESOLVED';
    return true;
  }).slice(0, 18);

  const isLoading = latest.isLoading || trending.isLoading || escalated.isLoading;
  const hotspots = digest.data?.ward_hotspots || [];
  const totals = digest.data?.totals || {};

  return (
    <>
      <SEOHead
        title={headlinesSeo.title}
        description={headlinesSeo.description}
        canonicalPath="/headlines"
        alternatesPath="/headlines"
        keywords={headlinesSeo.keywords}
        schema={[
          buildBreadcrumbSchema([
            { name: BRAND_NAME, path: '/' },
            { name: 'Civic headlines', path: '/headlines' },
          ]),
        ]}
      />
      <AppShell>
      <section className="headlines-layout">
        <div className="headlines-hero">
          <div>
            <p className="eyebrow">{t('civicHeadlines')}</p>
            <h1>{t('headlinesTitle')}</h1>
            <p className="lede">{t('headlinesCopy')}</p>
          </div>
          <div className="headline-summary">
            <Newspaper size={24} />
            <strong>{totals.issues || 0}</strong>
            <span>reports in the 30-day civic pulse</span>
          </div>
        </div>

        <div className="headline-tabs" role="tablist" aria-label="Headline filters">
          {[
            ['all', 'All headlines'],
            ['trending', 'Trending'],
            ['escalated', 'Escalated'],
            ['resolved', 'Resolved'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={scope === value ? 'active' : ''}
              onClick={() => setScope(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="headlines-grid">
          <motion.section
            className="headline-list"
            variants={stagger}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'visible'}
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <div className="headline-card loading-card" key={index} />)
            ) : visibleHeadlines.length ? (
              visibleHeadlines.map(({ issue, kind }) => <HeadlineCard key={issue.id} issue={issue} kind={kind} />)
            ) : (
              <EmptyState />
            )}
          </motion.section>

          <aside className="headline-side">
            <section className="headline-side-panel">
              <div className="panel-title">
                <Flame size={19} />
                <h2>Hot wards</h2>
              </div>
              {hotspots.slice(0, 8).map((item) => (
                <div className="headline-hotspot" key={item.ward}>
                  <strong>{item.ward}</strong>
                  <span>{item.total} reports · {item.resolved} resolved · {item.upvotes} upvotes</span>
                </div>
              ))}
              {!hotspots.length && <p className="lede">Hotspots will appear when new reports are raised this month.</p>}
            </section>

            <section className="headline-side-panel">
              <div className="panel-title">
                <BarChart3 size={19} />
                <h2>Pulse snapshot</h2>
              </div>
              <div className="headline-metrics">
                <span><strong>{totals.resolved || 0}</strong><small>Resolved</small></span>
                <span><strong>{totals.escalated || 0}</strong><small>Escalated</small></span>
                <span><strong>{totals.upvotes || 0}</strong><small>Upvotes</small></span>
              </div>
            </section>
          </aside>
        </div>
      </section>
      </AppShell>
    </>
  );
}

function getSeoFaqs(page, ward, category) {
  if (ward) {
    return [
      {
        question: `How do I report a civic issue in ${ward.name}?`,
        answer: `Open CivicsPulse, choose the right category, add a photo or voice note, select ${ward.name}, and submit the report for public tracking.`,
      },
      {
        question: `Can reports in ${ward.name} be mapped to representatives?`,
        answer: 'Yes. CivicsPulse uses ward and zone data so issues can be connected to mapped corporator and MLA dashboards when representative records are available.',
      },
    ];
  }
  if (category) {
    return [
      {
        question: `What should I include in a ${category.category.toLowerCase()} report?`,
        answer: 'Add a clear title, exact location or landmark, ward, category, and photo evidence wherever safe.',
      },
      {
        question: 'Can I track the report after submitting?',
        answer: 'Yes. CivicsPulse creates a public tracking ID so citizens can follow status, representative mapping, and timeline updates.',
      },
    ];
  }
  return [
    {
      question: 'What is CivicsPulse?',
      answer: 'CivicsPulse is a civic reporting and public issue tracking platform for Mumbai citizens.',
    },
    {
      question: 'Which civic issues can I report?',
      answer: 'Citizens can report potholes, garbage, water leakage, streetlights, safety hazards, tree issues, and other local problems.',
    },
  ];
}

function PublicIssuePreview({ category, ward }) {
  const { language } = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['seo-public-issues', language, category?.key, ward?.slug],
    queryFn: () => api.get('/api/feed/home', {
      params: {
        category: category?.key?.toUpperCase(),
        limit: 6,
      },
    }).then((r) => r.data),
    staleTime: 60000,
  });

  const issues = data?.issues || [];

  return (
    <section className="seo-panel">
      <div className="panel-title">
        <Newspaper size={19} />
        <h2>Recent public reports</h2>
      </div>
      <div className="seo-issue-preview">
        {isLoading && Array.from({ length: 3 }).map((_, index) => <div className="loading-card seo-preview-card" key={index} />)}
        {!isLoading && issues.slice(0, 6).map((issue) => (
          <Link className="seo-preview-card" key={issue.id} to={`/issues/${issue.id}`}>
            <strong>{issue.title}</strong>
            <span>{issue.wards?.name || issue.location_label || ward?.name || 'Mumbai'} · {statusLabel(language, issue.status)}</span>
          </Link>
        ))}
        {!isLoading && !issues.length && (
          <p className="lede">Public reports will appear here after citizens raise issues in the live feed.</p>
        )}
      </div>
    </section>
  );
}

function RepresentativeSeoPanel({ type }) {
  const locations = useQuery({
    queryKey: ['seo-representative-locations', type],
    queryFn: () => api.get('/api/reps/locations', { params: { limit: 12 } }).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
  const wards = locations.data?.wards || [];

  return (
    <section className="seo-panel">
      <div className="panel-title">
        <Megaphone size={19} />
        <h2>{type === 'mla' ? 'MLA zone mapping' : 'Corporator ward mapping'}</h2>
      </div>
      <div className="seo-rep-list">
        {locations.isLoading && Array.from({ length: 4 }).map((_, index) => <div className="loading-card mapping-row" key={index} />)}
        {!locations.isLoading && wards.slice(0, 10).map((ward) => {
          const rep = type === 'mla' ? ward.mlas?.[0] : ward.corporators?.[0];
          return (
            <div className="mapping-row" key={ward.id || ward.name}>
              <strong>{ward.name}</strong>
              <small>{formatWard(ward)}</small>
              <span>{rep?.name || `Representative data can be uploaded by admin`}</span>
            </div>
          );
        })}
        {!locations.isLoading && !wards.length && (
          <p className="lede">Representative rows appear after the admin imports ward, corporator, and MLA data.</p>
        )}
      </div>
    </section>
  );
}

function PublicSeoPage({ routePath, routeLanguage }) {
  const currentLanguage = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const activeLanguage = routeLanguage || currentLanguage;
  const page = getSeoPageByPath(routePath) || getSeoPageByPath('/');
  const normalizedPath = cleanPath(page.path);
  const category = getCategoryByPath(normalizedPath);
  const ward = normalizedPath.startsWith('/mumbai/wards/')
    ? getWardBySlug(normalizedPath.split('/').pop())
    : null;
  const copy = getLocalizedSeoCopy(activeLanguage);
  const languageLabel = SEO_LANGUAGES.find((item) => item.code === activeLanguage)?.label || 'English';
  const pageTitle = activeLanguage === 'en' ? page.title : `${page.title} - ${languageLabel}`;
  const pageDescription = activeLanguage === 'en'
    ? page.description
    : `${page.description} CivicsPulse supports ${languageLabel} for citizen reporting and public issue tracking.`;
  const canonicalPath = routeLanguage ? getLocalizedPath(normalizedPath, routeLanguage) : normalizedPath;
  const faqs = getSeoFaqs(page, ward, category);
  const breadcrumbs = [
    { name: BRAND_NAME, path: '/' },
    { name: normalizedPath === '/' ? 'Mumbai civic reporting' : page.title, path: normalizedPath },
  ];

  useEffect(() => {
    if (routeLanguage) setLanguage(routeLanguage);
  }, [routeLanguage, setLanguage]);

  const quickLinks = [
    ['Report potholes', '/report-pothole-mumbai'],
    ['Garbage complaints', '/report-garbage-mumbai'],
    ['Water leakage', '/report-water-leakage-mumbai'],
    ['Streetlight issues', '/report-streetlight-mumbai'],
    ['Corporator list', '/corporator-list-mumbai'],
    ['MLA list', '/mla-list-mumbai'],
  ];

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={canonicalPath}
        alternatesPath={normalizedPath}
        keywords={page.keywords || []}
        schema={[
          buildBreadcrumbSchema(breadcrumbs),
          buildFaqSchema(faqs),
        ]}
      />
      <AppShell>
        <section className="seo-page">
          <div className="seo-hero">
            <div>
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{ward ? `${ward.name} civic issue tracker` : page.title}</h1>
              <p className="lede">{ward ? ward.description : pageDescription}</p>
              <div className="hero-actions">
                <Link className="button primary large" to="/raise">
                  <Siren size={18} />
                  {copy.primaryCta}
                </Link>
                <Link className="button secondary large" to="/public-issues">
                  <Eye size={18} />
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>
            <img src="/civic-hero.png" alt="Citizens reporting civic issues in Mumbai" />
          </div>

          <div className="seo-grid">
            <section className="seo-panel">
              <div className="panel-title">
                <ShieldCheck size={19} />
                <h2>{copy.trustTitle}</h2>
              </div>
              <div className="seo-benefit-list">
                {copy.trustItems.map((item) => (
                  <span key={item}><CheckCircle2 size={17} /> {item}</span>
                ))}
              </div>
            </section>

            <section className="seo-panel">
              <div className="panel-title">
                <Search size={19} />
                <h2>{copy.searchIntent}</h2>
              </div>
              <div className="seo-chip-list">
                {(page.keywords || []).map((keyword) => <span key={keyword}>{keyword}</span>)}
                {ward && <span>{ward.name} ward {ward.wardNumber}</span>}
                {category && <span>{category.category} public tracker</span>}
              </div>
            </section>
          </div>

          {category && (
            <section className="seo-panel">
              <div className="panel-title">
                <ListFilter size={19} />
                <h2>How to create a stronger {category.category.toLowerCase()} report</h2>
              </div>
              <div className="seo-step-grid">
                {[
                  ['Choose the right category', `Select ${category.category} so the report is routed correctly.`],
                  ['Add exact location', 'Use GPS, ward search, road name, and nearest landmark.'],
                  ['Attach safe evidence', 'Upload a wide photo and a close-up when it is safe to do so.'],
                  ['Track publicly', 'Use the CivicsPulse public ID to follow status and timeline updates.'],
                ].map(([title, body]) => (
                  <article key={title}>
                    <strong>{title}</strong>
                    <span>{body}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {ward && (
            <section className="seo-panel">
              <div className="panel-title">
                <MapPin size={19} />
                <h2>{ward.name} ward details</h2>
              </div>
              <div className="seo-step-grid">
                <article><strong>Ward</strong><span>{ward.wardNumber}</span></article>
                <article><strong>Zone</strong><span>{ward.zone}</span></article>
                <article><strong>City</strong><span>Mumbai, Maharashtra</span></article>
                <article><strong>Report types</strong><span>Pothole, garbage, water, streetlight, safety, tree</span></article>
              </div>
            </section>
          )}

          {normalizedPath === '/corporator-list-mumbai' && <RepresentativeSeoPanel type="corporator" />}
          {normalizedPath === '/mla-list-mumbai' && <RepresentativeSeoPanel type="mla" />}
          {['/public-issues', '/', '/mumbai'].includes(normalizedPath) || category || ward ? (
            <PublicIssuePreview category={category} ward={ward} />
          ) : null}

          <section className="seo-panel">
            <div className="panel-title">
              <Lightbulb size={19} />
              <h2>{copy.faqTitle}</h2>
            </div>
            <div className="seo-faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="seo-panel">
            <div className="panel-title">
              <Map size={19} />
              <h2>Explore more CivicsPulse pages</h2>
            </div>
            <div className="seo-link-grid">
              {quickLinks.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
              {WARD_SEO_PAGES.slice(0, 6).map((item) => (
                <Link key={item.slug} to={`/mumbai/wards/${item.slug}`}>{item.name}</Link>
              ))}
            </div>
          </section>
        </section>
      </AppShell>
    </>
  );
}

function WardSeoRoute() {
  const { wardSlug } = useParams();
  return <PublicSeoPage routePath={`/mumbai/wards/${wardSlug}`} />;
}

function LocalizedPublicRoute() {
  const { langCode, '*': splat } = useParams();
  const normalizedLanguage = normalizeLanguage(langCode);
  if (normalizedLanguage !== langCode) return <Navigate to="/" replace />;
  const routePath = cleanPath(`/${splat || ''}`);
  const page = getSeoPageByPath(routePath);
  if (!page) return <Navigate to="/" replace />;
  return <PublicSeoPage routePath={routePath} routeLanguage={normalizedLanguage} />;
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
        {issue.public_id && <span className="pill tracking">{issue.public_id}</span>}
        <span className="pill category">{categoryLabel(language, issue.category)}</span>
        <span className="pill status">{status}</span>
        {issue.reopen_count > 0 && <span className="pill reopened">Reopened {issue.reopen_count}x</span>}
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

function AuthPanel({ compact = false, redirectTo = '/raise', initialMode = 'register' }) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { t, language } = useT();
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [mode, setMode] = useState(initialMode);
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
        {mode !== 'forgot' && (
          <div className="auth-social-start">
            {GOOGLE_CLIENT_ID ? (
              <div className="google-button-wrap prominent" ref={googleButtonRef} aria-label={t('continueWithGoogle')} />
            ) : (
              <button type="button" className="button secondary google-fallback" disabled>
                <Globe2 size={17} />
                {t('googleNeedsSetup')}
              </button>
            )}
            {googleAuth.isPending && (
              <p className="inline-status"><Loader2 size={14} className="spin" /> {t('googleSigningIn')}</p>
            )}
            <div className="auth-divider"><span>or continue with email</span></div>
          </div>
        )}
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
        ) : null}
      </form>
    </section>
  );
}

function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useT();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const redirectTo = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  return (
    <>
      <SEOHead
        title="Sign in to CivicsPulse"
        description="Sign in to CivicsPulse to raise Mumbai civic issues, select your ward, and track public report timelines."
        canonicalPath="/login"
        noindex
      />
      <AppShell compactAuth>
        <section className="consumer-auth-page">
        <motion.div
          className="consumer-auth-story"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div className="consumer-auth-head" variants={fadeUp}>
            <p className="eyebrow">{t('authEyebrow')}</p>
            <h1>Your neighbourhood deserves a voice.</h1>
            <p className="lede">
              Sign in to report issues, track public timelines, learn what evidence helps, and stay aware of ward-level civic updates.
            </p>
          </motion.div>

          <motion.div className="consumer-auth-feature-grid" variants={fadeUp}>
            <AuthAwarenessCarousel />
            <CivicLoginVisual />
          </motion.div>

          <motion.div className="consumer-auth-utility-grid" variants={fadeUp}>
            <PublicIssueTracker compact />
          </motion.div>
        </motion.div>

        <aside id="join" className="consumer-auth-aside">
          <div className="auth-welcome-card">
            <img src="/icon.png" alt="" />
            <div>
              <p className="eyebrow">Get started</p>
              <h2>Join CivicsPulse</h2>
              <span>Choose language, sign in with Google or email, and map your ward during signup.</span>
            </div>
          </div>
          <AuthPanel initialMode="login" redirectTo={redirectTo} />
        </aside>
        </section>
      </AppShell>
    </>
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
    <>
      <SEOHead
        title="Reset CivicsPulse password"
        description="Reset your CivicsPulse account password securely."
        canonicalPath="/reset-password"
        noindex
      />
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
    </>
  );
}

function readReportDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('citizen-report-draft') || 'null');
    return draft && Date.now() - draft.savedAt < 30 * 86400000 ? draft : null;
  } catch { return null; }
}

function RaiseIssuePage() {
  const { isAuthenticated, user } = useAuthStore();
  const { t, language } = useT();
  const raiseSeo = getSeoPageByPath('/raise');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const draftBlocked = useRef(false);
  const [draft, setDraft] = useState(readReportDraft);
  const [draftSaved, setDraftSaved] = useState(false);
  const [form, setForm] = useState(draft?.form || {
    title: '',
    description: '',
    category: 'POTHOLE',
    location_label: '',
    is_anonymous: false,
  });
  const [location, setLocation] = useState(draft?.location || null);
  const [locating, setLocating] = useState(false);
  const [media, setMedia] = useState([]);
  const [wardSearch, setWardSearch] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(draft?.wardId || user?.home_ward_id || '');
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

  useEffect(() => {
    if (!form.title && !form.description && !location) return;
    draftBlocked.current = false;
    setDraftSaved(false);
    const persistDraft = (showSaved = true) => {
      if (draftBlocked.current) return;
      try {
        localStorage.setItem('citizen-report-draft', JSON.stringify({ form, location, wardId: selectedWardId, savedAt: Date.now() }));
        if (showSaved) setDraftSaved(true);
      } catch { if (showSaved) setDraftSaved(false); }
    };
    const timer = setTimeout(persistDraft, 500);
    return () => { clearTimeout(timer); persistDraft(false); };
  }, [form, location, selectedWardId]);

  const similar = useQuery({
    queryKey: ['report-suggestions', language, form.category, selectedWardId],
    enabled: Boolean(selectedWardId && form.title.trim().length >= 8),
    queryFn: () => api.get('/api/feed/home', { params: { ward_id: selectedWardId, category: form.category, limit: 3 } }).then(r => r.data),
    staleTime: 60000,
  });

  const submitIssue = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('location_label', form.location_label.trim() || selectedWard?.name || location?.location_label || 'Mumbai');
      fd.append('is_anonymous', String(form.is_anonymous));
      if (location) {
        fd.append('lat', String(location.lat));
        fd.append('lng', String(location.lng));
      }
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
      draftBlocked.current = true;
      localStorage.removeItem('citizen-report-draft');
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
    <>
      <SEOHead
        title={raiseSeo.title}
        description={raiseSeo.description}
        canonicalPath="/raise"
        alternatesPath="/raise"
        keywords={raiseSeo.keywords}
        schema={[
          buildBreadcrumbSchema([
            { name: BRAND_NAME, path: '/' },
            { name: 'Raise civic issue', path: '/raise' },
          ]),
        ]}
      />
      <AppShell>
      <section className="raise-layout">
        <div className="raise-main">
          <Link to="/" className="back-link"><ArrowLeft size={16} /> {t('backToFeed')}</Link>
          <div className="section-heading">
            <p className="eyebrow">{t('newReport')}</p>
            <h1>{t('raiseWeb')}</h1>
          </div>
          {(draft || draftSaved) && <div className="citizen-draft-bar"><span><CheckCircle2 size={14} /> Draft saved on this device. Photos need to be reattached after leaving.</span><button type="button" className="text-button" onClick={() => { draftBlocked.current = true; localStorage.removeItem('citizen-report-draft'); setForm({ title: '', description: '', category: 'POTHOLE', location_label: '', is_anonymous: false }); setLocation(null); setSelectedWardId(''); setDraft(null); setDraftSaved(false); }}>Clear</button></div>}

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
                navigate('/login?next=%2Fraise');
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

            <details className="citizen-pin-picker"><summary><MapPin size={16} />{location ? 'Location pinned. Adjust on map' : 'Pin the exact location on the map (optional)'}</summary><Suspense fallback={<div className="citizen-map-loading"><Loader2 className="spin" /></div>}><IssueMap selected={location} onPick={point => setLocation(point)} height={300} /></Suspense></details>

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

            {Boolean(similar.data?.issues?.length) && <section className="citizen-similar"><h2>Already reported in this ward?</h2><p>These reports share your category and ward. You can support and follow one instead.</p>{similar.data.issues.map(issue => <Link key={issue.id} to={`/issues/${issue.id}`}><span><strong>{issue.title}</strong><small>{statusLabel(language, issue.status)}</small></span><ArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} /></Link>)}</section>}

            <button className="button primary submit-button" type="submit" disabled={submitIssue.isPending}>
              {submitIssue.isPending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              {isAuthenticated ? t('submitIssue') : 'Sign in to submit'}
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
            <AuthPanel compact redirectTo="/raise" />
          )}
        </aside>
      </section>
      </AppShell>
    </>
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
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [reopenNote, setReopenNote] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['issue', id, language],
    queryFn: () => api.get(`/api/issues/${id}`).then((r) => r.data),
  });

  const issue = data?.issue;
  const timeline = [...(issue?.issue_history || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const canReopen = isAuthenticated
    && ['RESOLVED', 'CLOSED'].includes(issue?.status)
    && (issue?.user_id === user?.id || ['ADMIN', 'MODERATOR', 'CORPORATOR', 'MLA', 'MP'].includes(user?.role));

  const duplicates = useQuery({
    queryKey: ['issue-duplicates', id],
    queryFn: () => api.get(`/api/issues/${id}/duplicates`).then((r) => r.data),
    enabled: !!issue,
  });

  const reopenIssue = useMutation({
    mutationFn: () => api.post(`/api/issues/${id}/reopen`, { note: reopenNote }),
    onSuccess: () => {
      setReopenNote('');
      toast.success('Issue reopened');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Could not reopen issue'),
  });

  const reportIssue = useMutation({
    mutationFn: () => api.post(`/api/issues/${id}/report`, {
      reason: 'CITIZEN_REVIEW',
      details: 'Reported from issue detail screen',
    }),
    onSuccess: () => {
      toast.success('Report sent to admin review');
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Could not report issue'),
  });

  const confirmResolution = useMutation({
    mutationFn: () => api.post(`/api/community/issues/${id}/confirm-resolution`),
    onSuccess: () => { toast.success('Thank you for confirming the repair'); refetch(); queryClient.invalidateQueries({ queryKey: ['issues'] }); },
    onError: error => toast.error(error.response?.data?.error || 'Could not confirm resolution'),
  });

  const issuePath = `/issues/${id}`;
  const issueTitle = issue?.title ? `${issue.title} | CivicsPulse issue tracker` : 'CivicsPulse public issue tracker';
  const issueDescription = issue?.description
    ? `${issue.description.slice(0, 150)}${issue.description.length > 150 ? '...' : ''}`
    : 'Track this public CivicsPulse report, status timeline, ward mapping, and representative routing.';
  const issueSchema = issue ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: issue.title,
    description: issue.description || issueTitle,
    datePublished: issue.created_at,
    dateModified: issue.updated_at || issue.created_at,
    articleSection: categoryLabel(language, issue.category),
    inLanguage: SEO_LANGUAGES.find((item) => item.code === language)?.locale || 'en-IN',
    url: absoluteUrl(issuePath),
    author: {
      '@type': 'Organization',
      name: issue.is_anonymous ? BRAND_NAME : (issue.users?.name || BRAND_NAME),
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      logo: absoluteUrl('/icon.png'),
    },
    spatialCoverage: {
      '@type': 'Place',
      name: issue.wards?.name || issue.location_label || issue.city || 'Mumbai',
    },
  } : null;

  return (
    <>
      <SEOHead
        title={issueTitle}
        description={issueDescription}
        canonicalPath={issuePath}
        keywords={[
          issue?.wards?.name,
          issue?.location_label,
          issue?.category ? `${categoryLabel(language, issue.category)} Mumbai` : null,
          issue?.public_id,
        ].filter(Boolean)}
        type="article"
        noindex={!isLoading && !issue}
        schema={[
          buildBreadcrumbSchema([
            { name: BRAND_NAME, path: '/' },
            { name: 'Public issues', path: '/public-issues' },
            { name: issue?.public_id || 'Issue detail', path: issuePath },
          ]),
          issueSchema,
        ]}
      />
      <AppShell>
      <section className="detail-page">
        <button className="back-link" type="button" onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/')}>
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
                {issue.public_id && <span className="pill tracking">{issue.public_id}</span>}
                <span className="pill category">{categoryLabel(language, issue.category)}</span>
                <span className="pill status">{statusLabel(language, issue.status)}</span>
                {issue.moderation_status === 'UNDER_REVIEW' && <span className="pill review">Under review</span>}
              </div>
              <h1>{issue.title}</h1>
              <p>{issue.description || t('noDescription')}</p>
              <div className="detail-grid">
                <span><MapPin size={17} /> {issue.wards?.name || issue.location_label || issue.city || 'Mumbai'}</span>
                <span><ThumbsUp size={17} /> {issue.upvote_count || 0} {t('upvotes')}</span>
                <span><Clock3 size={17} /> {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                {issue.reopen_count > 0 && <span><RotateCcw size={17} /> Reopened {issue.reopen_count} time{issue.reopen_count === 1 ? '' : 's'}</span>}
              </div>
              <div className="issue-action-strip">
                <IssueActions issue={issue} onRefresh={refetch} />
                {canReopen && (
                  <div className="reopen-box">
                    <input
                      value={reopenNote}
                      onChange={(event) => setReopenNote(event.target.value)}
                      placeholder="Why should this be reopened?"
                    />
                    <button className="button primary" type="button" onClick={() => reopenIssue.mutate()} disabled={reopenIssue.isPending}>
                      {reopenIssue.isPending ? <Loader2 size={17} className="spin" /> : <RotateCcw size={17} />}
                      Reopen
                    </button>
                  </div>
                )}
                {isAuthenticated && user?.id !== issue.user_id && (
                  <button className="button secondary" type="button" onClick={() => reportIssue.mutate()} disabled={reportIssue.isPending}>
                    {reportIssue.isPending ? <Loader2 size={17} className="spin" /> : <Flag size={17} />}
                    Report
                  </button>
                )}
              </div>
              {issue.status === 'RESOLVED' && <section className="citizen-resolution"><h2>{issue.resolution_confirmed_at ? 'Confirmed fixed by the citizen' : 'Has this problem been fixed?'}</h2>{issue.resolved_proof_url && <div className="citizen-resolution-photos">{issue.issue_media?.find(media => media.media_type === 'IMAGE') && <figure><img src={issue.issue_media.find(media => media.media_type === 'IMAGE').cdn_url} alt="Original issue" /><figcaption>Before</figcaption></figure>}<figure><img src={issue.resolved_proof_url} alt="Resolution evidence uploaded by representative" /><figcaption>After · representative evidence</figcaption></figure></div>}{!issue.resolution_confirmed_at && user?.id === issue.user_id && <button type="button" className="button primary" disabled={confirmResolution.isPending} onClick={() => confirmResolution.mutate()}><CheckCircle2 size={16} />Confirm this is fixed</button>}{issue.resolution_confirmed_at && <p className="citizen-confirmed"><ShieldCheck size={16} />The report owner confirmed this repair.</p>}</section>}
            </article>

            {(duplicates.data?.duplicates || []).length > 0 && (
              <section className="detail-card">
                <h2>Similar nearby reports</h2>
                <div className="duplicate-list">
                  {duplicates.data.duplicates.map((duplicate) => (
                    <Link className="duplicate-row" key={duplicate.id} to={`/issues/${duplicate.id}`}>
                      <strong>{duplicate.public_id || 'Similar issue'} · {duplicate.title}</strong>
                      <span>{duplicate.wards?.name || duplicate.location_label || duplicate.city || 'Mapped area'} · {duplicate.status}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

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
    </>
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
      <>
        <SEOHead
          title="CivicsPulse citizen profile"
          description="Sign in to manage your CivicsPulse profile, language preference, and home ward."
          canonicalPath="/profile"
          noindex
        />
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
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="CivicsPulse profile settings"
        description="Manage your CivicsPulse profile, preferred language, profile photo, phone number, and home ward."
        canonicalPath="/profile"
        noindex
      />
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
    </>
  );
}

function RepresentativeDeskPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { t, language } = useT();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionProof, setResolutionProof] = useState({});
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
    mutationFn: ({ issueId, status }) => {
      if (status === 'RESOLVED' && resolutionProof[issueId]) {
        const body = new FormData();
        body.append('status', status); body.append('note', statusNote); body.append('proof', resolutionProof[issueId]);
        return api.patch(`/api/issues/${issueId}/status`, body);
      }
      return api.patch(`/api/issues/${issueId}/status`, { status, note: statusNote });
    },
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
      <>
        <SEOHead
          title="CivicsPulse representative desk"
          description="Representative access for corporators and MLAs to manage mapped CivicsPulse reports."
          canonicalPath="/rep"
          noindex
        />
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
      </>
    );
  }

  if (!isRep) {
    return (
      <>
        <SEOHead
          title="CivicsPulse representative desk"
          description="Representative access for mapped corporator and MLA accounts."
          canonicalPath="/rep"
          noindex
        />
        <AppShell>
          <section className="detail-page">
          <div className="notice">
            <AlertTriangle size={18} />
            <span>Your account is a citizen account. Admin must link you as a Corporator or MLA before this desk opens.</span>
          </div>
          </section>
        </AppShell>
      </>
    );
  }

  const issues = issuesQuery.data?.issues || [];
  const stats = repSummary.data?.stats || issuesQuery.data?.stats || {};
  const identity = repSummary.data?.identity || issuesQuery.data?.identity;
  const requests = requestsQuery.data?.requests || [];

  return (
    <>
      <SEOHead
        title="CivicsPulse representative desk"
        description="Manage mapped ward reports, status updates, timeline notes, and report card requests."
        canonicalPath="/rep"
        noindex
      />
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
                    <label className="rep-proof-upload">Repair photo (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setResolutionProof(state => ({ ...state, [issue.id]: event.target.files?.[0] }))} /></label>
                    <Link className="text-button" to={`/issues/${issue.id}`}><Eye size={16} /> View</Link>
                    <button className="button secondary" type="button" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ issueId: issue.id, status: 'IN_PROGRESS' })}>
                      In progress
                    </button>
                    <button className="button primary" type="button" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ issueId: issue.id, status: 'RESOLVED' })}>
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
    </>
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
  const [adminTab, setAdminTab] = useState('imports');
  const [awarenessForm, setAwarenessForm] = useState({
    title: '',
    summary: '',
    category: 'AWARENESS',
    city: 'Mumbai',
    ward_label: 'All wards',
    action_label: 'Raise issue',
    action_url: '',
    priority: 25,
  });
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

  const moderationQueue = useQuery({
    queryKey: ['admin-moderation-issues'],
    queryFn: () => api.get('/api/admin/moderation/issues', { params: { status: 'ALL' } }).then((r) => r.data),
    enabled: isAdmin,
  });

  const awarenessItems = useQuery({
    queryKey: ['admin-awareness-items'],
    queryFn: () => api.get('/api/awareness', { params: { include_inactive: true, limit: 40 } }).then((r) => r.data),
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

  const reviewModeration = useMutation({
    mutationFn: ({ id, moderation_status }) => api.put(`/api/admin/moderation/issues/${id}`, {
      moderation_status,
      moderation_reason: moderation_status === 'VISIBLE' ? 'Reviewed and restored by admin' : 'Reviewed by admin',
    }),
    onSuccess: () => {
      toast.success('Moderation updated');
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Moderation update failed'),
  });

  const createAwareness = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/awareness', awarenessForm);
      return data;
    },
    onSuccess: () => {
      toast.success('Awareness item added');
      setAwarenessForm((state) => ({ ...state, title: '', summary: '', action_url: '' }));
      queryClient.invalidateQueries({ queryKey: ['admin-awareness-items'] });
      queryClient.invalidateQueries({ queryKey: ['login-awareness-items'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Awareness item failed'),
  });

  const toggleAwareness = useMutation({
    mutationFn: (item) => api.put(`/api/awareness/${item.id}`, { is_active: !item.is_active }),
    onSuccess: () => {
      toast.success('Awareness item updated');
      queryClient.invalidateQueries({ queryKey: ['admin-awareness-items'] });
      queryClient.invalidateQueries({ queryKey: ['login-awareness-items'] });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Awareness update failed'),
  });

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportText(await file.text());
  };

  if (!isAuthenticated) {
    return (
      <>
        <SEOHead
          title="CivicsPulse admin access"
          description="Admin access for CivicsPulse representative imports, ward mapping, report approvals, moderation, and awareness updates."
          canonicalPath="/admin"
          noindex
        />
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
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <SEOHead
          title="CivicsPulse admin access"
          description="Admin-only CivicsPulse data and moderation tools."
          canonicalPath="/admin"
          noindex
        />
        <AppShell>
          <section className="detail-page">
          <div className="notice">
            <AlertTriangle size={18} />
            <span>Only ADMIN users can upload representative data.</span>
          </div>
          </section>
        </AppShell>
      </>
    );
  }

  const wards = locations.data?.wards || [];
  const latestImports = imports.data?.imports || [];
  const representativeOptions = linkForm.role === 'MLA' ? (mlas.data?.mlas || []) : (corporators.data?.corporators || []);
  const pendingReports = reportRequests.data?.requests || [];
  const moderationIssues = moderationQueue.data?.issues || [];
  const awarenessRows = awarenessItems.data?.items || [];
  const awarenessSource = awarenessItems.data?.source || 'database';

  return (
    <>
      <SEOHead
        title="CivicsPulse admin data control"
        description="Upload ward, corporator, MLA, moderation, report-card, and awareness data for CivicsPulse."
        canonicalPath="/admin"
        noindex
      />
      <AppShell>
      <section className="admin-layout">
        <div className="section-heading">
          <p className="eyebrow">Backend data control</p>
          <h1>{t('adminTitle')}</h1>
          <p className="lede">{t('adminCopy')}</p>
        </div>

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          {[
            ['imports', 'Imports', Upload],
            ['mapping', 'Mapping', Database],
            ['representatives', 'Reps', ShieldCheck],
            ['reports', 'Reports', FileText],
            ['moderation', 'Moderation', Flag],
            ['awareness', 'Awareness', Newspaper],
          ].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              className={adminTab === value ? 'active' : ''}
              onClick={() => setAdminTab(value)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {adminTab === 'imports' && (
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
        )}

        {adminTab === 'mapping' && (
          <section className="admin-panel">
            <div className="panel-title">
              <Database size={19} />
              <h2>{t('currentMapping')}</h2>
            </div>
            <div className="mapping-stats">
              <span><strong>{wards.length}</strong><small>wards loaded</small></span>
              <span><strong>{new Set(wards.map((ward) => ward.city)).size}</strong><small>cities</small></span>
              <span><strong>{new Set(wards.map((ward) => ward.state_code)).size}</strong><small>states</small></span>
            </div>
            <div className="mapping-list expanded">
              {wards.map((ward) => (
                <div key={ward.id} className="mapping-row">
                  <strong>{ward.name}</strong>
                  <small>{[ward.ward_number, ward.city, ward.state_name].filter(Boolean).join(' · ')}</small>
                  <span>{ward.corporators?.[0]?.name || 'No corporator mapped'}</span>
                </div>
              ))}
              {!wards.length && <p className="lede">No ward data yet. Import representative rows first.</p>}
            </div>
          </section>
        )}

        {adminTab === 'representatives' && (
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
        )}

        {adminTab === 'reports' && (
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
        )}

        {adminTab === 'moderation' && (
        <section className="admin-panel">
          <div className="panel-title">
            <Flag size={19} />
            <h2>Moderation queue</h2>
          </div>
          <div className="import-history">
            {moderationQueue.isLoading && <div className="loading-card moderation-row" />}
            {!moderationQueue.isLoading && moderationIssues.map((item) => (
              <div key={item.id} className="mapping-row moderation-row">
                <strong>{item.public_id || 'Issue'} · {item.title}</strong>
                <small>{item.moderation_status} · {item.wards?.name || item.city || 'Mapped area'} · {item.reports?.length || 0} report(s)</small>
                {item.reports?.[0] && <span>{item.reports[0].reason}: {item.reports[0].details || 'No details'}</span>}
                <span className="review-actions">
                  <button className="button primary" type="button" onClick={() => reviewModeration.mutate({ id: item.id, moderation_status: 'VISIBLE' })}>
                    Restore
                  </button>
                  <button className="button secondary" type="button" onClick={() => reviewModeration.mutate({ id: item.id, moderation_status: 'HIDDEN' })}>
                    Hide
                  </button>
                  <button className="button secondary danger-button" type="button" onClick={() => reviewModeration.mutate({ id: item.id, moderation_status: 'REJECTED' })}>
                    Reject
                  </button>
                </span>
              </div>
            ))}
            {!moderationQueue.isLoading && !moderationIssues.length && <p className="lede">No moderation items currently need review.</p>}
          </div>
        </section>
        )}

        {adminTab === 'awareness' && (
        <section className="admin-panel">
          <div className="panel-title">
            <Newspaper size={19} />
            <h2>Login awareness news</h2>
          </div>
          <form
            className="admin-mini-form awareness-form"
            onSubmit={(event) => {
              event.preventDefault();
              createAwareness.mutate();
            }}
          >
            <label>
              Headline
              <input
                required
                value={awarenessForm.title}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, title: event.target.value }))}
                placeholder="Water cut alert for H-West"
              />
            </label>
            <label>
              Category
              <select
                value={awarenessForm.category}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, category: event.target.value }))}
              >
                <option value="AWARENESS">Awareness</option>
                <option value="ALERT">Alert</option>
                <option value="GUIDE">Guide</option>
                <option value="SAFETY">Safety</option>
                <option value="EVENT">Event</option>
              </select>
            </label>
            <label>
              City
              <input
                value={awarenessForm.city}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, city: event.target.value }))}
                placeholder="Mumbai"
              />
            </label>
            <label>
              Ward / audience
              <input
                value={awarenessForm.ward_label}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, ward_label: event.target.value }))}
                placeholder="All wards"
              />
            </label>
            <label className="wide-field">
              Summary
              <textarea
                required
                rows={4}
                value={awarenessForm.summary}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, summary: event.target.value }))}
                placeholder="Explain what citizens should know and what detail helps the report."
              />
            </label>
            <label>
              Action label
              <input
                value={awarenessForm.action_label}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, action_label: event.target.value }))}
                placeholder="Raise issue"
              />
            </label>
            <label>
              Priority
              <input
                type="number"
                value={awarenessForm.priority}
                onChange={(event) => setAwarenessForm((state) => ({ ...state, priority: Number(event.target.value) }))}
              />
            </label>
            <button className="button primary" type="submit" disabled={createAwareness.isPending}>
              {createAwareness.isPending ? <Loader2 size={17} className="spin" /> : <Newspaper size={17} />}
              Add awareness item
            </button>
          </form>

          <div className="import-history awareness-list">
            {awarenessItems.isLoading && <div className="loading-card mapping-row" />}
            {!awarenessItems.isLoading && awarenessRows.map((item) => (
              <div key={item.id} className="mapping-row awareness-row">
                <strong>{item.title}</strong>
                <small>{item.category} · {item.city || 'All cities'} · {item.ward_label || 'All wards'} · priority {item.priority || 0}</small>
                <span>{item.summary}</span>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => toggleAwareness.mutate(item)}
                  disabled={awarenessSource === 'fallback' || String(item.id || '').startsWith('fallback-')}
                >
                  {item.is_active ? 'Pause' : 'Resume'}
                </button>
              </div>
            ))}
            {awarenessSource === 'fallback' && (
              <p className="lede">Default messages are visible because the awareness table has not been created yet.</p>
            )}
            {!awarenessItems.isLoading && !awarenessRows.length && <p className="lede">No awareness items yet. The login page will use safe default messages.</p>}
          </div>
        </section>
        )}

        {adminTab === 'imports' && (
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
        )}
      </section>
      </AppShell>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/nearby" element={<CitizenPage mode="nearby" />} />
      <Route path="/updates" element={<CitizenPage mode="updates" />} />
      <Route path="/my-reports" element={<CitizenPage mode="mine" />} />
      {STATIC_SEO_ROUTES.filter((path) => !path.startsWith('/mumbai/wards/')).map((path) => (
        <Route key={path} path={path} element={<PublicSeoPage routePath={path} />} />
      ))}
      <Route path="/mumbai/wards/:wardSlug" element={<WardSeoRoute />} />
      <Route path="/raise" element={<RaiseIssuePage />} />
      <Route path="/headlines" element={<HeadlinesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProfileSettingsPage />} />
      <Route path="/rep" element={<RepresentativeDeskPage />} />
      <Route path="/admin" element={<AdminImportPage />} />
      <Route path="/issues/:id" element={<IssueDetailPage />} />
      <Route path="/:langCode/*" element={<LocalizedPublicRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
