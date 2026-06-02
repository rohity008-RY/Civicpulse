import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, TextInput, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import IssueCard from '../components/IssueCard';
import { useAuthStore } from '../store/authStore';
import { colors } from '../utils/theme';

function openIssue(navigation, id) {
  const root = navigation.getParent();
  if (root) root.navigate('IssueDetail', { id });
  else navigation.navigate('IssueDetail', { id });
}

export default function RepDashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const now = new Date();
  const [reportForm, setReportForm] = useState({ month: String(now.getMonth() + 1), year: String(now.getFullYear()) });
  const isRep = ['CORPORATOR', 'MLA', 'MP'].includes(user?.role);

  const summary = useQuery({
    queryKey: ['rep-summary-mobile'],
    queryFn: () => api.get('/api/rep/me').then((r) => r.data),
    enabled: isRep,
  });

  const issues = useQuery({
    queryKey: ['rep-issues-mobile'],
    queryFn: () => api.get('/api/rep/me/issues', { params: { limit: 100 } }).then((r) => r.data),
    enabled: isRep,
  });

  const requests = useQuery({
    queryKey: ['rep-report-requests-mobile'],
    queryFn: () => api.get('/api/rep/me/report-card-requests').then((r) => r.data),
    enabled: isRep,
  });

  const updateStatus = async (issueId, status) => {
    try {
      await api.patch(`/api/issues/${issueId}/status`, { status, note });
      setNote('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['rep-issues-mobile'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
      ]);
      Alert.alert('Updated', `Issue marked ${status.replace(/_/g, ' ')}`);
    } catch (err) {
      Alert.alert('Status update failed', err.response?.data?.error || 'Please try again.');
    }
  };

  const requestReport = async () => {
    try {
      await api.post('/api/rep/me/report-card-requests', {
        month: Number(reportForm.month),
        year: Number(reportForm.year),
      });
      await queryClient.invalidateQueries({ queryKey: ['rep-report-requests-mobile'] });
      Alert.alert('Requested', 'Admin will approve the PDF + CSV report card.');
    } catch (err) {
      Alert.alert('Request failed', err.response?.data?.error || 'Please try again.');
    }
  };

  if (!isRep) {
    return (
      <View style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🪪</Text>
          <Text style={styles.title}>Representative desk</Text>
          <Text style={styles.subtitle}>Admin must link your account as a Corporator or MLA before this opens.</Text>
        </View>
      </View>
    );
  }

  const stats = summary.data?.stats || issues.data?.stats || {};
  const list = issues.data?.issues || [];
  const requestList = requests.data?.requests || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Representative desk</Text>
        <Text style={styles.subtitle}>{summary.data?.identity?.display_name || user?.name}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statValue}>{stats.total_issues || 0}</Text><Text style={styles.statLabel}>Tagged</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{stats.in_progress_issues || 0}</Text><Text style={styles.statLabel}>Progress</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>{stats.resolved_issues || 0}</Text><Text style={styles.statLabel}>Resolved</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline note</Text>
        <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Optional note for status update" placeholderTextColor={colors.text3} />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={issues.isLoading} onRefresh={issues.refetch} tintColor={colors.accent} />}
        ListHeaderComponent={(
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Request report card</Text>
            <View style={styles.reportRow}>
              <TextInput style={[styles.input, styles.monthInput]} keyboardType="numeric" value={reportForm.month} onChangeText={(month) => setReportForm((state) => ({ ...state, month }))} />
              <TextInput style={[styles.input, styles.yearInput]} keyboardType="numeric" value={reportForm.year} onChangeText={(year) => setReportForm((state) => ({ ...state, year }))} />
              <TouchableOpacity style={styles.smallButton} onPress={requestReport}><Text style={styles.smallButtonText}>Request</Text></TouchableOpacity>
            </View>
            {requestList.slice(0, 3).map((request) => (
              <Text style={styles.requestLine} key={request.id}>{request.month}/{request.year} · {request.status}</Text>
            ))}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.issueWrap}>
            <IssueCard issue={item} onUpvote={issues.refetch} onPress={() => openIssue(navigation, item.id)} />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => updateStatus(item.id, 'IN_PROGRESS')}>
                <Text style={styles.secondaryText}>In progress</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => updateStatus(item.id, 'RESOLVED')}>
                <Text style={styles.primaryText}>Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={!issues.isLoading && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.subtitle}>No tagged posts found yet.</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 18, paddingTop: 56 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.text3, fontSize: 12, marginTop: 4, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.text3, fontSize: 10, marginTop: 2 },
  card: { marginHorizontal: 14, marginBottom: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 11, color: colors.text, fontSize: 13 },
  reportRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  monthInput: { width: 64 },
  yearInput: { width: 82 },
  smallButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 10, padding: 12, alignItems: 'center' },
  smallButtonText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  requestLine: { color: colors.text3, fontSize: 11, marginTop: 8 },
  list: { paddingBottom: 110 },
  issueWrap: { marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryText: { color: colors.text2, fontSize: 12, fontWeight: '900' },
  primaryButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, padding: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 36 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
});
