import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, Bell, Check, CheckCircle2, ChevronDown, Clock3, Home, List, Loader2, Map, MapPin, Megaphone, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { categoryLabel, statusLabel, useT } from '../../utils/i18n';
import { citizenText } from './copy';
import IssueActions, { useFollowing } from './IssueActions';
const IssueMap = lazy(() => import('./IssueMap'));

const categories = ['POTHOLE', 'GARBAGE', 'WATER', 'STREETLIGHT', 'SAFETY', 'TREE', 'OTHER'];
const EMPTY = [];

export function CitizenReportCard({ issue, onRefresh }) {
  const { language } = useT();
  const c = citizenText(language);
  const image = issue.issue_media?.find(item => item.media_type === 'IMAGE')?.cdn_url;
  const statusClass = issue.status === 'RESOLVED' ? 'fixed' : issue.status?.startsWith('ESCALATED') ? 'escalated' : issue.status === 'IN_PROGRESS' ? 'progress' : 'open';
  return (
    <article className={`citizen-report ${image ? 'has-photo' : ''}`}>
      <div className="citizen-report-heading"><span className={`citizen-status ${statusClass}`}><i />{statusLabel(language, issue.status)}</span><span className="citizen-category">{categoryLabel(language, issue.category)}</span></div>
      <div className="citizen-report-body">
        <div><Link to={`/issues/${issue.id}`} className="citizen-report-title"><h2>{issue.title}</h2></Link><p>{issue.description}</p><div className="citizen-report-location"><MapPin size={14} /><span>{issue.location_label || issue.wards?.name || issue.city || 'Mumbai'}</span></div></div>
        {image && <Link to={`/issues/${issue.id}`} className="citizen-report-photo"><img src={image} alt={issue.title} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /></Link>}
      </div>
      {issue.resolution_confirmed_at && <span className="citizen-confirmed"><ShieldCheck size={15} />Citizen confirmed fixed</span>}
      <div className="citizen-report-byline"><span>{issue.is_anonymous ? 'Neighbour' : issue.users?.name || 'Neighbour'}</span><span>·</span><time dateTime={issue.created_at}>{issue.created_at ? formatDistanceToNow(new Date(issue.created_at), { addSuffix: true }) : ''}</time><Link to={`/issues/${issue.id}`} title={c.viewReport} aria-label={`${c.viewReport}: ${issue.title}`}><ArrowRight size={17} /></Link></div>
      <IssueActions issue={issue} onRefresh={onRefresh} />
    </article>
  );
}

function WardPicker({ wards, wardId, onChange, loading, error }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { language } = useT();
  const c = citizenText(language);
  const selected = wards.find(ward => ward.id === wardId);
  const matches = wards.filter(ward => [ward.name, ward.ward_number, ward.city, ward.state_name].join(' ').toLowerCase().includes(search.toLowerCase())).slice(0, 30);
  useEffect(() => {
    if (!open) return;
    const escape = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open]);
  return (
    <div className="citizen-ward-picker">
      <button type="button" className="citizen-ward-trigger" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-haspopup="dialog"><MapPin size={17} /><span>{selected?.name || c.allWards}</span><ChevronDown size={15} /></button>
      {open && <div className="citizen-ward-menu" role="dialog" aria-label={c.chooseWard}>
        <div className="citizen-ward-menu-head"><strong>{c.chooseWard}</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close ward picker"><X size={17} /></button></div>
        <label className="citizen-search"><Search size={17} /><input autoFocus aria-label={c.chooseWard} placeholder={c.chooseWard} value={search} onChange={event => setSearch(event.target.value)} /></label>
        <button type="button" className="citizen-ward-option" onClick={() => { onChange(''); setOpen(false); }}><span>{c.allWards}</span>{!wardId && <Check size={15} />}</button>
        <div className="citizen-ward-results">{loading ? <p>{c.loading}</p> : error ? <p role="alert">Could not load wards. Try again shortly.</p> : matches.map(ward => <button type="button" className="citizen-ward-option" key={ward.id} onClick={() => { onChange(ward.id); setOpen(false); }}><span><strong>{ward.name}</strong><small>{[ward.ward_number, ward.city, ward.state_name].filter(Boolean).join(' · ')}</small></span>{wardId === ward.id && <Check size={16} />}</button>)}{!loading && !error && !matches.length && <p>No wards match this search.</p>}</div>
      </div>}
    </div>
  );
}

export default function CitizenHome({ DailyPuzzle, ReportTracker, mode = 'home' }) {
  const { user, isAuthenticated } = useAuthStore();
  const { language } = useT();
  const c = citizenText(language);
  const [wardId, setWardId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(mode === 'mine' ? 'mine' : 'all');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState(mode === 'nearby' ? 'map' : 'list');
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const following = useFollowing();
  useEffect(() => {
    const key = `citizen-ward:${user?.id || 'visitor'}`;
    setWardId(localStorage.getItem(key) || user?.home_ward_id || '');
  }, [user?.id, user?.home_ward_id]);
  useEffect(() => { setFilter(mode === 'mine' ? 'mine' : 'all'); setView(mode === 'nearby' ? 'map' : 'list'); }, [mode]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const change = () => setDesktop(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const changeWard = value => { setWardId(value); localStorage.setItem(`citizen-ward:${user?.id || 'visitor'}`, value); };
  const locations = useQuery({ queryKey: ['citizen-wards'], queryFn: () => api.get('/api/reps/locations', { params: { limit: 1000 } }).then(r => r.data), staleTime: 600000 });
  const wards = locations.data?.wards || EMPTY;
  const selectedWard = wards.find(ward => ward.id === wardId);
  const privateView = ['mine', 'my_escalated', 'following'].includes(filter);
  const feed = useQuery({
    queryKey: ['issues', 'citizen', user?.id, language, wardId, filter, category, sort],
    queryFn: () => api.get('/api/feed/home', { params: { ward_id: wardId || undefined, category: category || undefined, status: filter === 'resolved' ? 'RESOLVED' : undefined, scope: ['mine', 'my_escalated'].includes(filter) ? filter : undefined, sort, limit: 40 } }).then(r => r.data),
    enabled: filter !== 'following' && (!privateView || isAuthenticated),
  });
  const mapData = useQuery({ queryKey: ['citizen-map', language, wardId, category, filter], enabled: view === 'map' || desktop,
    queryFn: () => api.get('/api/feed/map', { params: { ward_id: wardId || undefined, category: category || undefined, status: filter === 'resolved' ? 'RESOLVED' : undefined, limit: 200 } }).then(r => r.data) });
  const digest = useQuery({ queryKey: ['citizen-digest', wardId], queryFn: () => api.get('/api/feed/digest', { params: { ward_id: wardId || undefined } }).then(r => r.data) });
  const awareness = useQuery({ queryKey: ['citizen-awareness', language, selectedWard?.city], queryFn: () => api.get('/api/awareness', { params: { city: selectedWard?.city || 'Mumbai' } }).then(r => r.data), staleTime: 300000 });
  const base = filter === 'following' ? following.data?.issues || EMPTY : feed.data?.issues || EMPTY;
  const issues = useMemo(() => base.filter(issue => (!search.trim() || [issue.public_id, issue.title, issue.description, issue.location_label, issue.wards?.name].join(' ').toLowerCase().includes(search.trim().toLowerCase())) && (filter !== 'following' || ((!category || issue.category === category) && (!wardId || issue.ward_id === wardId)))), [base, search, category, wardId, filter]);
  const rawPoints = mapData.data?.points || EMPTY;
  const points = rawPoints.filter(point => !search.trim() || [point.public_id, point.title, point.location_label, point.wards?.name].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
  const visiblePoints = privateView ? points.filter(point => issues.some(issue => issue.id === point.id)) : points;
  const busy = filter === 'following' ? following.isLoading : feed.isLoading;
  const failed = filter === 'following' ? following.isError : feed.isError;
  const news = awareness.data?.items || EMPTY;
  const totals = digest.data?.totals;

  return (
    <div className="citizen-home">
      <div className="citizen-page-heading"><div><p className="citizen-eyebrow"><span />CIVICSPULSE · MUMBAI</p><h1>{mode === 'nearby' ? c.nearby : mode === 'mine' ? c.myReports : c.title}</h1><p>{c.subtitle}</p></div><WardPicker wards={wards} wardId={wardId} onChange={changeWard} loading={locations.isLoading} error={locations.isError} /></div>
      <div className="citizen-overview"><span><Home size={17} />{selectedWard?.name || 'Mumbai'}<small>30 days</small></span><div><strong>{totals?.issues ?? '—'}</strong>{c.reports}</div><div><strong className="positive">{totals?.resolved ?? '—'}</strong>{c.fixed}</div><Link to="/raise"><Plus size={17} />{c.report}<ArrowRight size={16} /></Link></div>
      <div className="citizen-workspace">
        <section className="citizen-feed-column" aria-label="Neighbourhood reports">
          <div className="citizen-feed-tabs" role="tablist" aria-label="Report filters">{[['all', c.all], ['following', c.following], ['mine', c.myReports], ['resolved', c.resolved], ['my_escalated', 'My escalated']].map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{key === 'following' && <Bell size={15} />}{label}</button>)}</div>
          <div className="citizen-feed-controls"><label className="citizen-search"><Search size={18} /><input aria-label={c.search} placeholder={c.search} value={search} onChange={event => setSearch(event.target.value)} /></label><div className="citizen-view-switch"><button type="button" title={c.listView} aria-label={c.listView} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18} /></button><button type="button" title={c.mapView} aria-label={c.mapView} aria-pressed={view === 'map'} onClick={() => setView('map')}><Map size={18} /></button></div></div>
          <div className="citizen-filter-row"><label><SlidersHorizontal size={14} /><select aria-label={c.categories} value={category} onChange={event => setCategory(event.target.value)}><option value="">{c.categories}</option>{categories.map(value => <option key={value} value={value}>{categoryLabel(language, value)}</option>)}</select></label><label><ArrowDown size={14} /><select aria-label="Sort reports" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{c.latest}</option><option value="trending">{c.trending}</option><option value="upvotes">Most supported</option><option value="escalated">Escalated</option></select></label><span>{issues.length} {c.reports.toLowerCase()}</span></div>
          {privateView && !isAuthenticated ? <CitizenEmpty title={c.signinCopy} copy={c.followCopy}><Link to="/login" className="button primary">{c.signin}<ArrowRight size={16} /></Link></CitizenEmpty>
            : failed ? <CitizenEmpty title="Reports could not be loaded." copy="Your connection may have been interrupted."><button className="button secondary" type="button" onClick={() => filter === 'following' ? following.refetch() : feed.refetch()}>Try again</button></CitizenEmpty>
            : busy ? <div className="citizen-feed-loading" aria-label={c.loading} aria-busy="true">{[1, 2, 3].map(key => <div className="citizen-report-skeleton" key={key} />)}</div>
            : view === 'map' ? <div className="citizen-main-map"><Suspense fallback={<div className="citizen-map-loading"><Loader2 className="spin" /></div>}><IssueMap points={visiblePoints} height={540} /></Suspense><p className="citizen-map-note">{mapData.isError ? 'Map reports could not load. Switch to list or retry.' : `${visiblePoints.filter(p => p.lat !== null && p.lng !== null).length} reports with a precise location.`}{Boolean(mapData.data?.unmapped_count) && ' Reports without coordinates remain available in the list.'}</p></div>
            : issues.length ? <div className="citizen-report-list">{issues.map(issue => <CitizenReportCard key={issue.id} issue={issue} onRefresh={feed.refetch} />)}</div>
              : <CitizenEmpty title={filter === 'following' ? c.followEmpty : c.empty} copy={filter === 'following' ? c.followCopy : c.emptyCopy}><Link className="button primary" to="/raise"><Plus size={17} />{c.report}</Link></CitizenEmpty>}
          {DailyPuzzle && <div className="citizen-daily-section"><div className="citizen-section-label"><Sparkles size={16} /><span>{c.quiz}</span></div><DailyPuzzle /></div>}
        </section>
        <aside className="citizen-sidebar">
          {desktop && view !== 'map' && <section className="citizen-map-section"><div className="citizen-section-title"><h2>{c.map}</h2><button type="button" onClick={() => setView('map')} title="Expand neighbourhood map" aria-label="Expand neighbourhood map"><ArrowRight size={17} /></button></div><Suspense fallback={<div className="citizen-map-loading"><Loader2 className="spin" /></div>}><IssueMap points={visiblePoints} height={300} /></Suspense><div className="citizen-map-legend"><span><i className="open" />Open</span><span><i className="progress" />In progress</span><span><i className="fixed" />Resolved</span></div></section>}
          <section className="citizen-quick-report"><span className="citizen-quick-icon"><Plus size={22} /></span><h2>{c.quickReport}</h2><p>{c.quickCopy}</p><Link to="/raise">{c.report}<ArrowRight size={17} /></Link></section>
          <CitizenActivity />
          {ReportTracker && <ReportTracker />}
          <section className="citizen-local-news"><div className="citizen-section-title"><h2>{c.news}</h2><Megaphone size={18} /></div>{news.slice(0, 3).map(item => <article key={item.id}><span className="citizen-news-type">{awareness.data?.source === 'database' ? 'Community notice · CivicsPulse' : 'Reporting guide'}</span><h3>{item.title}</h3><p>{item.summary}</p>{item.starts_at && <small>{new Date(item.starts_at).toLocaleDateString()}</small>}<Link to="/raise">{c.report}<ArrowRight size={14} /></Link></article>)}{awareness.isLoading && <p>{c.loading}</p>}{!awareness.isLoading && !news.length && <p className="citizen-muted">Local announcements will appear here when published.</p>}</section>
          <section className="citizen-community-note"><ShieldCheck size={20} /><div><strong>{c.smallSteps}</strong><p>Support a useful report, follow its progress, and confirm when your issue is fixed.</p></div></section>
        </aside>
      </div>
    </div>
  );
}

function CitizenActivity() {
  const { user, isAuthenticated } = useAuthStore();
  const activity = useQuery({ queryKey: ['citizen-activity', user?.id], enabled: isAuthenticated, queryFn: () => api.get('/api/community/activity').then(r => r.data) });
  if (!isAuthenticated || activity.isError) return null;
  return <section className="citizen-activity"><div className="citizen-section-title"><h2>Make a little difference</h2><Sparkles size={17} /></div><p>Your next neighbourhood milestones</p>{[['reports', 'Raise your first report', 1], ['supported', 'Support three neighbours', 3], ['following', 'Follow three local reports', 3]].map(([key, label, target]) => <div className="citizen-milestone" key={key}><span className={activity.data?.[key] >= target ? 'complete' : ''}>{activity.data?.[key] >= target ? <Check size={13} /> : <span />}</span><div><strong>{label}</strong><progress max={target} value={Math.min(activity.data?.[key] || 0, target)} /></div><small>{activity.data ? Math.min(activity.data[key], target) : '—'}/{target}</small></div>)}</section>;
}

function CitizenEmpty({ title, copy, children }) {
  return <div className="citizen-empty"><span><MapPin size={28} /></span><h2>{title}</h2><p>{copy}</p>{children}</div>;
}

export function CitizenUpdates({ DailyPuzzle }) {
  const { user, isAuthenticated } = useAuthStore();
  const { language } = useT();
  const c = citizenText(language);
  const client = useQueryClient();
  const following = useFollowing();
  const updates = useQuery({ queryKey: ['notifications', user?.id], enabled: isAuthenticated, queryFn: () => api.get('/api/notifications', { params: { limit: 30 } }).then(r => r.data) });
  const preferences = useQuery({ queryKey: ['citizen-preferences', user?.id], enabled: isAuthenticated, queryFn: () => api.get('/api/community/preferences').then(r => r.data) });
  const markRead = useMutation({ mutationFn: () => api.post('/api/notifications/mark-read', { ids: [] }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const save = useMutation({ mutationFn: value => api.put('/api/community/preferences', { email_digest: value }), onSuccess: () => client.invalidateQueries({ queryKey: ['citizen-preferences'] }), onError: error => toast.error(error.response?.data?.error || c.tryAgain) });
  return <div className="citizen-home citizen-updates"><div className="citizen-page-heading"><div><p className="citizen-eyebrow"><span />CIVICSPULSE</p><h1>{c.updates}</h1><p>{c.followCopy}</p></div>{Boolean(updates.data?.unread_count) && <button className="button secondary" type="button" onClick={() => markRead.mutate()} disabled={markRead.isPending}><Check size={16} />Mark all read</button>}</div>{!isAuthenticated ? <CitizenEmpty title={c.signinCopy} copy={c.followCopy}><Link to="/login" className="button primary">{c.signin}</Link></CitizenEmpty> : <div className="citizen-updates-layout"><section><div className="citizen-section-title"><h2>Report activity</h2><Bell size={18} /></div>{updates.isLoading ? <p>{c.loading}</p> : updates.isError ? <p role="alert">Updates could not be loaded. <button type="button" onClick={() => updates.refetch()}>Try again</button></p> : updates.data?.notifications?.length ? updates.data.notifications.map(item => <Link className={`citizen-update-row ${item.is_read ? '' : 'unread'}`} key={item.id} to={item.data?.issue_id ? `/issues/${item.data.issue_id}` : item.data?.report_card_request_id ? '/rep' : '/'}><span className="citizen-update-icon">{item.type === 'ISSUE_RESOLVED' ? <CheckCircle2 size={20} /> : <Bell size={20} />}</span><div><strong>{item.title}</strong><p>{item.body}</p><small>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</small></div><ArrowRight size={17} /></Link>) : <CitizenEmpty title="You're all caught up." copy={c.followCopy}><Link className="button secondary" to="/">Browse reports</Link></CitizenEmpty>}<h2 className="citizen-followed-heading">{c.following} <small>{following.data?.issue_ids?.length || 0}</small></h2>{following.data?.issues?.map(issue => <CitizenReportCard key={issue.id} issue={issue} />)}</section><aside><section className="citizen-preference"><h2>Stay in the loop</h2><p>In-app updates are available for the reports you follow.</p><label className="citizen-switch"><span>Weekly email summary</span><input type="checkbox" role="switch" checked={Boolean(preferences.data?.email_digest)} disabled={preferences.isLoading || preferences.isError || save.isPending || (!preferences.data?.email_available && !preferences.data?.email_digest)} onChange={event => save.mutate(event.target.checked)} /></label>{preferences.data && !preferences.data.email_available && <small>Email summaries are not available yet. You can follow progress here.</small>}</section>{DailyPuzzle && <div className="citizen-daily-section"><DailyPuzzle /></div>}</aside></div>}</div>;
}
