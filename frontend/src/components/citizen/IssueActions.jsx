import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Share2, ThumbsUp, Loader2, Link2, MessageCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../utils/i18n';
import { citizenText } from './copy';

export function useFollowing() {
  const { user, isAuthenticated } = useAuthStore();
  const { language } = useT();
  return useQuery({ queryKey: ['citizen-following', user?.id, language], enabled: isAuthenticated,
    queryFn: () => api.get('/api/community/following').then(r => r.data) });
}

export default function IssueActions({ issue, onRefresh, compact = false }) {
  const { isAuthenticated } = useAuthStore();
  const { language } = useT();
  const c = citizenText(language);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const following = useFollowing();
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);
  useEffect(() => {
    if (!shareOpen) return;
    const close = event => { if (event.key === 'Escape' || !shareRef.current?.contains(event.target)) setShareOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [shareOpen]);
  const followed = following.data?.issue_ids?.includes(issue.id) || false;
  const refresh = () => { onRefresh?.(); queryClient.invalidateQueries({ queryKey: ['issues'] }); queryClient.invalidateQueries({ queryKey: ['citizen-following'] }); queryClient.invalidateQueries({ queryKey: ['citizen-activity'] }); };
  const follow = useMutation({
    mutationFn: () => followed ? api.delete(`/api/community/issues/${issue.id}/follow`) : api.post(`/api/community/issues/${issue.id}/follow`),
    onSuccess: refresh,
    onError: error => toast.error(error.response?.data?.error || c.tryAgain),
  });
  const support = useMutation({
    mutationFn: () => api.post(`/api/issues/${issue.id}/upvote`),
    onSuccess: refresh,
    onError: error => toast.error(error.response?.data?.error || c.tryAgain),
  });
  const authenticated = action => {
    if (!isAuthenticated) { navigate(`/login?next=${encodeURIComponent(`/issues/${issue.id}`)}`); return; }
    action();
  };
  const share = async () => {
    const url = `https://civicspulse.in/issues/${issue.id}`;
    try {
      if (navigator.share) await navigator.share({ title: issue.title, text: `${issue.title} · ${issue.public_id || 'CivicsPulse'}`, url });
      else setShareOpen(value => !value);
    } catch (error) { if (error.name !== 'AbortError') toast.error(c.tryAgain); }
  };
  return (
    <div className={`citizen-issue-actions ${compact ? 'compact' : ''}`}>
      <button type="button" aria-pressed={Boolean(issue.user_has_upvoted)} disabled={support.isPending} onClick={() => authenticated(() => support.mutate())} title={c.affectsMe}>
        <ThumbsUp size={16} /><span>{issue.upvote_count || 0}</span>{!compact && <span>{c.affectsMe}</span>}
      </button>
      <button type="button" className={followed ? 'is-following' : ''} aria-pressed={followed} disabled={follow.isPending || (isAuthenticated && following.isLoading)} onClick={() => authenticated(() => follow.mutate())}>
        {follow.isPending ? <Loader2 size={16} className="spin" /> : followed ? <BellRing size={16} /> : <Bell size={16} />}<span>{followed ? c.following : c.follow}</span>
      </button>
      <div className="citizen-share-control" ref={shareRef}><button type="button" onClick={share} title={c.share} aria-label={c.share} aria-expanded={shareOpen}><Share2 size={16} /></button>{shareOpen && <div className="citizen-share-menu"><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(`https://civicspulse.in/issues/${issue.id}`); toast.success(c.linkCopied); setShareOpen(false); } catch { toast.error(c.tryAgain); } }}><Link2 size={15} />{c.copyLink}</button><a href={`https://wa.me/?text=${encodeURIComponent(`${issue.title}\nhttps://civicspulse.in/issues/${issue.id}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)}><MessageCircle size={15} />WhatsApp</a></div>}</div>
    </div>
  );
}
