import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { colors, CAT_CONFIG, STATUS_CONFIG } from '../utils/theme';

function safeBack(navigation) {
  if (navigation.canGoBack()) navigation.goBack();
  else navigation.navigate('Main', { screen: 'Home' });
}

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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['issue-detail', id],
    enabled: !!id,
    queryFn: () => api.get(`/api/issues/${id}`).then((r) => r.data),
  });

  const issue = data?.issue;
  const cat = CAT_CONFIG[issue?.category] || CAT_CONFIG.OTHER;
  const status = STATUS_CONFIG[issue?.status] || STATUS_CONFIG.OPEN;
  const media = issue?.issue_media || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(navigation)} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Detail</Text>
        <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {id && isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent2} />
          <Text style={styles.muted}>Loading issue…</Text>
        </View>
      )}

      {(!id || (!isLoading && !issue)) && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 36 }}>📍</Text>
          <Text style={styles.emptyTitle}>Issue not found</Text>
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
              <View style={[styles.badge, { backgroundColor: cat.bg }]}>
                <Text style={[styles.badgeText, { color: cat.color }]}>{cat.emoji} {issue.category}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            <Text style={styles.title}>{issue.title}</Text>
            <Text style={styles.description}>{issue.description || 'No description added.'}</Text>

            <View style={styles.facts}>
              <Text style={styles.fact}>📍 {issue.wards?.name || issue.location_label || issue.city || 'Location pending'}</Text>
              <Text style={styles.fact}>🏙️ {[issue.city, issue.state_name].filter(Boolean).join(', ') || 'City mapping pending'}</Text>
              <Text style={styles.fact}>👍 {issue.upvote_count || 0} upvotes · 💬 {issue.comment_count || 0} comments</Text>
              <Text style={styles.fact}>⏱️ {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mapped representatives</Text>
            <RepBlock title="Corporator / Councillor" rep={issue.corporators} />
            <RepBlock title="MLA" rep={issue.mlas} />
            <RepBlock title="MP" rep={issue.mps} />
            {!issue.corporators && !issue.mlas && (
              <Text style={styles.muted}>No representative is mapped yet. Admin can import state-city-ward data from the web portal.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {(issue.issue_history || []).map((event) => (
              <View key={`${event.action}-${event.created_at}`} style={styles.timelineItem}>
                <Text style={styles.timelineTitle}>{event.action}</Text>
                <Text style={styles.muted}>{event.actor_role || 'System'} · {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</Text>
                {!!event.note && <Text style={styles.description}>{event.note}</Text>}
              </View>
            ))}
            {!issue.issue_history?.length && <Text style={styles.muted}>No timeline activity yet.</Text>}
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
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  title: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900', marginBottom: 8 },
  description: { color: colors.text2, fontSize: 13, lineHeight: 20 },
  facts: { gap: 7, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  fact: { color: colors.text2, fontSize: 12 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 12 },
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
