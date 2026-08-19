import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Image, ScrollView, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import IssueCard from '../components/IssueCard';
import { useT } from '../utils/i18n';
import { colors } from '../utils/theme';

const FILTERS = ['All','Trending','Escalated','My Issues','My Escalated','Resolved'];
const SORT_MAP = { All: 'newest', Trending: 'trending', Escalated: 'escalated', 'My Issues': 'newest', 'My Escalated': 'newest', Resolved: 'newest' };

export default function HomeScreen({ navigation }) {
  const { user } = useAuthStore();
  const { t, language } = useT();
  const [filter, setFilter]   = useState('All');
  const [search, setSearch]   = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [tracking, setTracking] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed', language, filter, user?.id, user?.home_ward_id],
    queryFn: () => api.get('/api/feed/home', { params: {
      sort: SORT_MAP[filter],
      status: filter === 'Resolved' ? 'RESOLVED' : undefined,
      scope: filter === 'My Issues' ? 'mine' : filter === 'My Escalated' ? 'my_escalated' : undefined,
      ward_id: user?.home_ward_id || undefined
    }}).then(r => r.data)
  });

  const openIssue = (id) => {
    const root = navigation.getParent();
    if (root) root.navigate('IssueDetail', { id });
    else navigation.navigate('IssueDetail', { id });
  };

  const openVoiceCreate = () => {
    const root = navigation.getParent();
    if (root) root.navigate('CreateIssue', { voiceMode: true });
    else navigation.navigate('Create', { voiceMode: true });
  };

  const rawIssues = data?.issues || [];
  const issues = rawIssues.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: rawIssues.length,
    escalated: rawIssues.filter((item) => item.escalated_at || String(item.status || '').startsWith('ESCALATED')).length,
    resolved: rawIssues.filter((item) => item.status === 'RESOLVED').length,
  }), [rawIssues]);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const homeWardName = user?.home_ward?.name || user?.home_ward?.ward_number || rawIssues[0]?.wards?.name || 'Set your ward';
  const filterLabel = (item) => {
    if (item === 'Trending') return `🔥 ${t('trending')}`;
    if (item === 'All') return t('all');
    if (item === 'Escalated') return t('escalated');
    if (item === 'Resolved') return t('resolved');
    if (item === 'My Escalated') return 'My Esc.';
    return item;
  };

  const trackIssue = async () => {
    const code = trackingCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Tracking ID', 'Enter a CivicsPulse issue ID.');
      return;
    }
    setTracking(true);
    try {
      const { data: response } = await api.get(`/api/issues/track/${encodeURIComponent(code)}`);
      setTrackingCode('');
      openIssue(response.issue.id);
    } catch (err) {
      Alert.alert('Issue not found', err.response?.data?.error || 'Check the tracking ID and try again.');
    } finally {
      setTracking(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.title}>{t('yourWardFeed')}</Text>
          <Text style={styles.wardLine}>📍 {homeWardName}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarTxt}>{user?.name?.charAt(0)}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{stats.escalated}</Text>
          <Text style={styles.statLabel}>Escalated</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={{ fontSize: 14, color: colors.text3 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchWard')}
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.micBtn}
          onPress={openVoiceCreate}
        >
          <Text style={{ fontSize: 13 }}>🎤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trackBox}>
        <Text style={styles.trackTitle}>Track by issue ID</Text>
        <View style={styles.trackRow}>
          <TextInput
            style={styles.trackInput}
            placeholder="CP-MH-MUMB-A1AC61EB"
            placeholderTextColor={colors.text3}
            value={trackingCode}
            onChangeText={setTrackingCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.trackButton} onPress={trackIssue} disabled={tracking}>
            <Text style={styles.trackButtonText}>{tracking ? '...' : 'Track'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroller}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.chipTxt, filter === f && styles.chipTxtActive]}
            >
              {filterLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Feed */}
      <FlatList
        data={issues}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <IssueCard
            issue={item}
            onUpvote={refetch}
            onPress={() => openIssue(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🏙️</Text>
            <Text style={{ color: colors.text3, textAlign: 'center' }}>
              {user?.home_ward_id ? t('noWardIssues') : t('noIssues')}
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('Create')}>
              <Text style={styles.emptyActionText}>Raise first issue</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, paddingTop: 56 },
  greeting:    { fontSize: 11, color: colors.text3 },
  title:       { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  wardLine:    { color: colors.text2, fontSize: 12, marginTop: 4 },
  avatar:      { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.fire, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  statsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 14 },
  statTile:    { flex: 1, minHeight: 68, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, padding: 11, justifyContent: 'center' },
  statValue:   { color: colors.text, fontSize: 19, fontWeight: '900' },
  statLabel:   { color: colors.text3, fontSize: 10, marginTop: 2, fontWeight: '700' },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 0, marginHorizontal: 18, marginBottom: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  micBtn:      { width: 28, height: 28, backgroundColor: colors.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  trackBox:    { marginHorizontal: 18, marginBottom: 14, padding: 12, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.09)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.22)' },
  trackTitle:  { color: colors.accent2, fontSize: 11, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase' },
  trackRow:    { flexDirection: 'row', gap: 8 },
  trackInput:  { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, color: colors.text, fontSize: 12, paddingHorizontal: 10, minHeight: 40 },
  trackButton: { width: 72, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  trackButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  filterScroller: { flexGrow: 0, flexShrink: 0, height: 42, maxHeight: 42, marginBottom: 14 },
  filterRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18 },
  chip:        { height: 34, minWidth: 64, maxWidth: 124, paddingHorizontal: 14, borderRadius: 100, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive:  { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt:     { fontSize: 12, fontWeight: '500', color: colors.text2, includeFontPadding: false },
  chipTxtActive:{ color: '#fff' },
  list:        { paddingHorizontal: 14, paddingBottom: 100 },
  emptyAction: { marginTop: 14, backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  emptyActionText: { color: '#fff', fontSize: 12, fontWeight: '900' },
});
