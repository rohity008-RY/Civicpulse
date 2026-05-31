import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Share } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { colors, CAT_CONFIG, STATUS_CONFIG } from '../utils/theme';

export default function IssueCard({ issue, onUpvote, onPress }) {
  const { isAuthenticated } = useAuthStore();
  const [upvoted, setUpvoted] = useState(issue.user_has_upvoted);
  const [count, setCount] = useState(issue.upvote_count || 0);

  const cat    = CAT_CONFIG[issue.category]    || CAT_CONFIG.OTHER;
  const status = STATUS_CONFIG[issue.status]   || STATUS_CONFIG.OPEN;
  const esc    = !!issue.escalated_at;
  const thumb  = issue.issue_media?.[0]?.cdn_url;

  const handleUpvote = async () => {
    if (!isAuthenticated) return;
    const was = upvoted;
    setUpvoted(!was); setCount(c => was ? c - 1 : c + 1);
    try { await api.post(`/api/issues/${issue.id}/upvote`); onUpvote?.(); }
    catch { setUpvoted(was); setCount(c => was ? c + 1 : c - 1); }
  };

  const handleShare = () => {
    Share.share({ message: `${issue.title}\nhttps://civicpulse.in/issues/${issue.id}` });
    api.post(`/api/issues/${issue.id}/share`, { platform: 'NATIVE_SHARE' }).catch(() => {});
  };

  return (
    <TouchableOpacity style={[styles.card, esc && styles.cardEsc]} onPress={onPress} activeOpacity={0.85}>
      {/* Escalation band */}
      {esc && (
        <View style={[styles.escBand, issue.escalated_to_mp_at && styles.escBandRed]}>
          <Text style={[styles.escText, issue.escalated_to_mp_at && { color: colors.red2 }]}>
            {issue.escalated_to_mp_at
              ? `● Escalated to MP ${issue.mps?.name || ''}`
              : `● Escalated to MLA ${issue.mlas?.name || ''}`
            }
          </Text>
          <Text style={[styles.escTime, issue.escalated_to_mp_at && { color: colors.red2 }]}>
            {formatDistanceToNow(new Date(issue.escalated_at), { addSuffix: true })}
          </Text>
        </View>
      )}

      {/* Image */}
      {thumb && (
        <View style={styles.imgWrap}>
          <Image source={{ uri: thumb }} style={styles.img} />
          {issue.trending_rank <= 5 && issue.trending_rank > 0 && (
            <View style={styles.trendBadge}>
              <Text style={styles.trendBadgeTxt}>🔥 #{issue.trending_rank}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.body}>
        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.catTxt, { color: cat.color }]}>{cat.emoji} {issue.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusTxt, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{issue.title}</Text>

        {/* Rep */}
        {(issue.corporators || issue.mlas) && (
          <View style={styles.repTag}>
            <View style={styles.repAvatar}>
              <Text style={styles.repAvatarTxt}>
                {(issue.corporators?.name || issue.mlas?.name || 'R').charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.repName}>
                {esc ? (issue.mlas?.name || issue.mps?.name) : issue.corporators?.name || 'Unassigned'}
              </Text>
              <Text style={styles.repRole}>{esc ? 'MLA/MP — Escalated' : 'Corporator'}</Text>
            </View>
            <Text style={{ fontSize: 9, color: esc ? colors.fire2 : colors.text3 }}>
              {esc ? 'Not Resolved' : 'Active'}
            </Text>
          </View>
        )}

        {/* Engagement */}
        <View style={styles.engRow}>
          <TouchableOpacity style={styles.engBtn} onPress={handleUpvote}>
            <Text style={{ fontSize: 14 }}>{upvoted ? '👍' : '👍'}</Text>
            <Text style={[styles.engTxt, upvoted && { color: colors.accent2 }]}>{count.toLocaleString()}</Text>
          </TouchableOpacity>
          <View style={styles.engBtn}>
            <Text style={{ fontSize: 14 }}>💬</Text>
            <Text style={styles.engTxt}>{issue.comment_count || 0}</Text>
          </View>
          <TouchableOpacity style={styles.engBtn} onPress={handleShare}>
            <Text style={{ fontSize: 14 }}>↗️</Text>
            <Text style={styles.engTxt}>Share</Text>
          </TouchableOpacity>
          <Text style={[styles.engTxt, { marginLeft: 'auto', color: colors.text3 }]}>
            {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:      { backgroundColor: colors.surface2, borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 12, overflow: 'hidden' },
  cardEsc:   { borderColor: 'rgba(249,115,22,0.4)' },
  escBand:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, paddingHorizontal: 14, backgroundColor: 'rgba(249,115,22,0.15)' },
  escBandRed:{ backgroundColor: 'rgba(239,68,68,0.15)' },
  escText:   { fontSize: 11, fontWeight: '600', color: colors.fire2 },
  escTime:   { fontSize: 10, color: colors.fire2 },
  imgWrap:   { height: 130, position: 'relative' },
  img:       { width: '100%', height: '100%' },
  trendBadge:{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  trendBadgeTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },
  body:      { padding: 12 },
  metaRow:   { flexDirection: 'row', gap: 6, marginBottom: 6 },
  catBadge:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catTxt:    { fontSize: 10, fontWeight: '600' },
  statusBadge:{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt: { fontSize: 10, fontWeight: '600' },
  title:     { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18, marginBottom: 8 },
  repTag:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, marginBottom: 10 },
  repAvatar: { width: 22, height: 22, borderRadius: 6, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  repAvatarTxt: { fontSize: 9, fontWeight: '700', color: '#fff' },
  repName:   { fontSize: 10, fontWeight: '600', color: colors.text },
  repRole:   { fontSize: 9, color: colors.text3 },
  engRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  engBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  engTxt:    { fontSize: 12, color: colors.text2 },
});
