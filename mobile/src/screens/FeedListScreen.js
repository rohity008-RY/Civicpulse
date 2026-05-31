import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import IssueCard from '../components/IssueCard';
import { colors } from '../utils/theme';

const CONFIG = {
  escalated: {
    title: 'Escalated Issues',
    subtitle: 'Reports that missed SLA or need higher attention',
    endpoint: '/api/feed/escalated',
    params: { sort: 'trending', limit: 30 },
    emptyIcon: '📢',
  },
  trending: {
    title: 'Trending Now',
    subtitle: 'High-signal reports gaining public support',
    endpoint: '/api/feed/trending',
    params: { limit: 30 },
    emptyIcon: '🔥',
  },
};

function openIssue(navigation, id) {
  const root = navigation.getParent();
  if (root) root.navigate('IssueDetail', { id });
  else navigation.navigate('IssueDetail', { id });
}

export default function FeedListScreen({ navigation, mode = 'trending' }) {
  const config = CONFIG[mode] || CONFIG.trending;
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed-list', mode],
    queryFn: () => api.get(config.endpoint, { params: config.params }).then((r) => r.data),
  });

  const issues = data?.issues || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      </View>

      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IssueCard issue={item} onUpvote={refetch} onPress={() => openIssue(navigation, item.id)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />}
        ListEmptyComponent={!isLoading && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>{config.emptyIcon}</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>New reports will appear here automatically.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 18, paddingTop: 56 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.text3, fontSize: 12, marginTop: 4 },
  list: { paddingHorizontal: 14, paddingBottom: 100 },
  empty: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyText: { color: colors.text3, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
