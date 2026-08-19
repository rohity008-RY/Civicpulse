import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { categoryLabel, statusLabel, useT } from '../utils/i18n';
import { colors, CAT_CONFIG, STATUS_CONFIG } from '../utils/theme';

function safeBack(navigation) {
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.navigate('Main', { screen: 'Home' });
}

const STATUS_STEPS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED_TO_MLA', 'RESOLVED'];

function RepBlock({ title, rep }) {
  if (!rep) return null;
  return (
    <View style={styles.repBlock}>
      <View style={styles.repAvatar}>
        {rep.photo_url ? <Image source={{ uri: rep.photo_url }} style={styles.repPhoto} /> : <Text style={styles.repInitial}>{rep.name?.charAt(0) || 'R'}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.repRole}>{title}</Text>
        <Text style={styles.repName}>{rep.name}</Text>
        {!!rep.party && <Text style={styles.repMeta}>{rep.party}</Text>}
        {!!rep.constituency && <Text style={styles.repMeta}>{rep.constituency}</Text>}
      </View>
    </View>
  );
}

export default function IssueDetailScreen({ navigation, route }) {
  const { id } = route.params || {};
  const { t, language } = useT();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [reopenNote, setReopenNote] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['issue-detail', id, language],
    enabled: !!id,
    queryFn: () => api.get(`/api/issues/${id}`).then((r) => r.data),
  });

  const issue = data?.issue;
  const cat = CAT_CONFIG[issue?.category] || CAT_CONFIG.OTHER;
  const status = STATUS_CONFIG[issue?.status] || STATUS_CONFIG.OPEN;
  const media = issue?.issue_media || [];
  const timelineStatus = issue?.status === 'ESCALATED_TO_MP' ? 'ESCALATED_TO_MLA' : issue?.status;
  const currentStep = Math.max(0, STATUS_STEPS.indexOf(timelineStatus));
  const canReopen = isAuthenticated
    && ['RESOLVED', 'CLOSED'].includes(issue?.status)
    && (issue?.user_id === user?.id || ['ADMIN', 'MODERATOR', 'CORPORATOR', 'MLA', 'MP'].includes(user?.role));

  const duplicates = useQuery({
    queryKey: ['issue-duplicates', id],
    enabled: !!issue,
    queryFn: () => api.get(`/api/issues/${id}/duplicates`).then((r) => r.data),
  });

  const reopenIssue = useMutation({
    mutationFn: () => api.post(`/api/issues/${id}/reopen`, { note: reopenNote }),
    onSuccess: async () => {
      setReopenNote('');
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['feed-list'] }),
      ]);
      Alert.alert('Issue reopened', 'This report is back in the active queue.');
    },
    onError: (err) => Alert.alert('Reopen failed', err.response?.data?.error || 'Could not reopen this issue.'),
  });

  const reportIssue = useMutation({
    mutationFn: () => api.post(`/api/issues/${id}/report`, {
      reason: 'CITIZEN_REVIEW',
      details: 'Reported from Android issue detail',
    }),
    onSuccess: async () => {
      await refetch();
      Alert.alert('Reported', 'Admin will review this issue.');
    },
    onError: (err) => Alert.alert('Report failed', err.response?.data?.error || 'Could not report this issue.'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(navigation)} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('issueDetail')}</Text>
        <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
          <Text style={styles.refreshText}>{t('refresh')}</Text>
        </TouchableOpacity>
      </View>

      {id && isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent2} />
          <Text style={styles.muted}>{t('loadingIssue')}</Text>
        </View>
      )}

      {(!id || (!isLoading && !issue)) && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 36 }}>📍</Text>
          <Text style={styles.emptyTitle}>{t('issueNotFound')}</Text>
          <Text style={styles.muted}>
            {isError ? (error?.response?.data?.error || 'Could not load this report.') : 'This report may have been removed or closed.'}
          </Text>
        </View>
      )}

      {!!issue && (
        <>
          {!!media.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
              {media.map((item) => (
                <Image key={item.id || item.cdn_url} source={{ uri: item.cdn_url || item.s3_url }} style={styles.media} />
              ))}
            </ScrollView>
          )}

          <View style={styles.card}>
            <View style={styles.metaRow}>
              {!!issue.public_id && (
                <View style={styles.trackingBadge}>
                  <Text style={styles.trackingText}>{issue.public_id}</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: cat.bg }]}>
                <Text style={[styles.badgeText, { color: cat.color }]}>{cat.emoji} {categoryLabel(language, issue.category)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{statusLabel(language, issue.status) || status.label}</Text>
              </View>
              {issue.moderation_status === 'UNDER_REVIEW' && (
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewText}>Review</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{issue.title}</Text>
            <Text style={styles.description}>{issue.description || t('noDescription')}</Text>

            <View style={styles.facts}>
              {!!issue.public_id && <Text style={styles.fact}>🧾 Tracking ID {issue.public_id}</Text>}
              <Text style={styles.fact}>📍 {issue.wards?.name || issue.location_label || issue.city || 'Location pending'}</Text>
              <Text style={styles.fact}>🏙️ {[issue.city, issue.state_name].filter(Boolean).join(', ') || 'City mapping pending'}</Text>
              <Text style={styles.fact}>👍 {issue.upvote_count || 0} upvotes · 💬 {issue.comment_count || 0} comments</Text>
              <Text style={styles.fact}>⏱️ {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</Text>
              {issue.reopen_count > 0 && <Text style={styles.fact}>↻ Reopened {issue.reopen_count} time{issue.reopen_count === 1 ? '' : 's'}</Text>}
            </View>

            <View style={styles.progressWrap}>
              {STATUS_STEPS.map((step, index) => {
                const active = index === currentStep;
                const done = index < currentStep || issue.status === 'RESOLVED';
                return (
                  <View key={step} style={styles.progressStep}>
                    <View style={[styles.progressDot, done && styles.progressDone, active && styles.progressActive]}>
                      <Text style={styles.progressDotText}>{done ? '✓' : index + 1}</Text>
                    </View>
                    <Text numberOfLines={2} style={[styles.progressLabel, active && { color: colors.accent2 }]}>
                      {statusLabel(language, step)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {(canReopen || (isAuthenticated && user?.id !== issue.user_id)) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Issue actions</Text>
              {canReopen && (
                <>
                  <TextInput
                    value={reopenNote}
                    onChangeText={setReopenNote}
                    placeholder="Why should this be reopened?"
                    placeholderTextColor={colors.text3}
                    style={styles.actionInput}
                  />
                  <TouchableOpacity style={styles.primaryAction} onPress={() => reopenIssue.mutate()} disabled={reopenIssue.isPending}>
                    <Text style={styles.primaryActionText}>{reopenIssue.isPending ? 'Reopening...' : '↻ Reopen issue'}</Text>
                  </TouchableOpacity>
                </>
              )}
              {isAuthenticated && user?.id !== issue.user_id && (
                <TouchableOpacity style={styles.secondaryAction} onPress={() => reportIssue.mutate()} disabled={reportIssue.isPending}>
                  <Text style={styles.secondaryActionText}>{reportIssue.isPending ? 'Reporting...' : '⚑ Report for admin review'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!!duplicates.data?.duplicates?.length && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Similar nearby reports</Text>
              {duplicates.data.duplicates.map((item) => (
                <TouchableOpacity key={item.id} style={styles.duplicateRow} onPress={() => navigation.push('IssueDetail', { id: item.id })}>
                  <Text style={styles.duplicateTitle}>{item.public_id || 'Similar'} · {item.title}</Text>
                  <Text style={styles.muted}>{item.wards?.name || item.location_label || item.city || 'Mapped area'} · {item.status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('mappedReps')}</Text>
            <RepBlock title={t('corporator')} rep={issue.corporators} />
            <RepBlock title="MLA" rep={issue.mlas} />
            <RepBlock title="MP" rep={issue.mps} />
            {!issue.corporators && !issue.mlas && (
              <Text style={styles.muted}>No representative is mapped yet. Admin can import state-city-ward data from the web portal.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('timeline')}</Text>
            {(issue.issue_history || []).map((event) => (
              <View key={`${event.action}-${event.created_at}`} style={styles.timelineItem}>
                <Text style={styles.timelineTitle}>{event.action}</Text>
                <Text style={styles.muted}>{event.actor_role || 'System'} · {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</Text>
                {!!event.note && <Text style={styles.description}>{event.note}</Text>}
              </View>
            ))}
            {!issue.issue_history?.length && <Text style={styles.muted}>{t('noTimeline')}</Text>}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 56 },
  backButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 20 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.12)' },
  refreshText: { color: colors.accent2, fontSize: 12, fontWeight: '700' },
  loading: { alignItems: 'center', gap: 10, padding: 40 },
  empty: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 10 },
  muted: { color: colors.text3, fontSize: 12, lineHeight: 18 },
  mediaRow: { paddingHorizontal: 14, marginBottom: 12 },
  media: { width: 260, height: 170, borderRadius: 16, marginRight: 10, backgroundColor: colors.surface2 },
  card: { marginHorizontal: 14, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  trackingBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(59,130,246,0.15)' },
  trackingText: { fontSize: 11, fontWeight: '900', color: colors.accent2 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  reviewBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(239,68,68,0.15)' },
  reviewText: { fontSize: 11, fontWeight: '900', color: colors.red2 },
  title: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900', marginBottom: 8 },
  description: { color: colors.text2, fontSize: 13, lineHeight: 20 },
  facts: { gap: 7, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  fact: { color: colors.text2, fontSize: 12 },
  progressWrap: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  progressStep: { flex: 1, alignItems: 'center', gap: 5 },
  progressDot: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  progressDone: { backgroundColor: colors.green, borderColor: colors.green },
  progressActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  progressDotText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  progressLabel: { color: colors.text3, fontSize: 8, fontWeight: '800', textAlign: 'center', lineHeight: 11 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  actionInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text, padding: 12, fontSize: 13, marginBottom: 10 },
  primaryAction: { backgroundColor: colors.accent, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 8 },
  primaryActionText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  secondaryAction: { backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryActionText: { color: colors.yellow2, fontWeight: '900', fontSize: 13 },
  duplicateRow: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  duplicateTitle: { color: colors.text, fontSize: 12, fontWeight: '900', marginBottom: 3 },
  repBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  repAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  repPhoto: { width: '100%', height: '100%' },
  repInitial: { color: '#fff', fontWeight: '900' },
  repRole: { color: colors.text3, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  repName: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 2 },
  repMeta: { color: colors.text2, fontSize: 11, marginTop: 2 },
  timelineItem: { borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 10, marginBottom: 10 },
  timelineTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
});
