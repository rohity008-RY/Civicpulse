import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Image, ScrollView } from 'react-native';
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

  const issues = (data?.issues || []).filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  const hr = new Date().getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.title}>{t('yourWardFeed')}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarTxt}>{user?.name?.charAt(0)}</Text>
          )}
        </TouchableOpacity>
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

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}>
            <Text style={[styles.chipTxt, filter === f && styles.chipTxtActive]}>
              {f === 'Trending' ? `🔥 ${t('trending')}` : f === 'All' ? t('all') : f === 'Escalated' ? t('escalated') : f === 'Resolved' ? t('resolved') : f}
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
  avatar:      { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.fire, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 0, marginHorizontal: 18, marginBottom: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  micBtn:      { width: 28, height: 28, backgroundColor: colors.accent, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filterRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 2, marginBottom: 14 },
  chip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  chipActive:  { backgroundColor: colors.accent, borderColor: colors.accent },
  chipTxt:     { fontSize: 12, fontWeight: '500', color: colors.text2 },
  chipTxtActive:{ color: '#fff' },
  list:        { paddingHorizontal: 14, paddingBottom: 100 },
});
