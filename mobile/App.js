import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from './src/store/authStore';
import { colors } from './src/utils/theme';

import LoginScreen      from './src/screens/LoginScreen';
import HomeScreen       from './src/screens/HomeScreen';
import CreateIssueScreen from './src/screens/CreateIssueScreen';
import FeedListScreen from './src/screens/FeedListScreen';
import IssueDetailScreen from './src/screens/IssueDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const qc    = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });

const TAB_ICON = { Home: '🏠', Escalated: '📢', Create: '➕', Trending: '🔥', Profile: '👤' };

function EscalatedScreen(props) {
  return <FeedListScreen {...props} mode="escalated" />;
}

function TrendingScreen(props) {
  return <FeedListScreen {...props} mode="trending" />;
}

function TabIcon({ name, focused }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 20 : 18 }}>{TAB_ICON[name]}</Text>
      {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 2 }} />}
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: () => null,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 65,
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen} />
      <Tab.Screen name="Escalated"  component={EscalatedScreen} />
      <Tab.Screen name="Create"     component={CreateIssueScreen} />
      <Tab.Screen name="Trending"   component={TrendingScreen} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer theme={{ colors: { background: colors.bg } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main"         component={TabNavigator} />
            <Stack.Screen name="IssueDetail"  component={IssueDetailScreen} />
            <Stack.Screen name="CreateIssue"  component={CreateIssueScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, []);

  return (
    <QueryClientProvider client={qc}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
