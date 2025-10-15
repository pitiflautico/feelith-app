import { Tabs, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import useAuth from '../../src/hooks/useAuth';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tabEvents, { TAB_EVENTS } from '../../src/events/tabEvents';

export default function TabLayout() {
  const { isLoggedIn } = useAuth();
  const { isOnboarding } = useOnboarding();
  const insets = useSafeAreaInsets();

  const CustomTabBar = ({ state, navigation }: any) => {
    // Don't show tab bar if not logged in or during onboarding
    if (!isLoggedIn || isOnboarding) {
      return null;
    }

    // Don't show tab bar on create-mood screen
    const currentRoute = state.routes[state.index];
    if (currentRoute.name === 'create-mood') {
      return null;
    }

    // Define tabs statically - WebView tabs reload, native tabs navigate
    const leftTabs = [
      { name: 'home', icon: 'house.fill', url: '/dashboard', isWebView: true },
      { name: 'calendar', icon: 'calendar', url: '/mood-history', isWebView: true },
    ];

    const rightTabs = [
      { name: 'stats', icon: 'chart.bar.fill', url: '/stats', isWebView: true },
      { name: 'settings', icon: 'gearshape.fill', isWebView: false },
    ];

    const renderTab = (tab: any) => {
      const handlePress = () => {
        if (tab.isWebView) {
          // For WebView tabs, reload the WebView with the specified URL
          navigation.navigate('index', { initialUrl: tab.url, forceReload: true });
        } else {
          // For native screens, navigate directly
          navigation.navigate(tab.name);
        }
      };

      return (
        <TouchableOpacity
          key={tab.name}
          accessibilityRole="button"
          accessibilityLabel={tab.name}
          onPress={handlePress}
          style={styles.tabButton}
        >
          <IconSymbol
            name={tab.icon}
            size={24}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      );
    };

    return (
      <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 20 }]}>
        <View style={styles.tabBar}>
          {/* Left tabs */}
          <View style={styles.tabGroup}>
            {leftTabs.map(renderTab)}
          </View>

          {/* Spacer for center button */}
          <View style={styles.centerSpacer} />

          {/* Right tabs */}
          <View style={styles.tabGroup}>
            {rightTabs.map(renderTab)}
          </View>
        </View>

        {/* Center FAB Button */}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('create-mood')}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main WebView screen - handles most navigation */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      {/* Native settings screen for app-specific settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      {/* Hidden route for the center button - creates the modal */}
      <Tabs.Screen
        name="new"
        options={{
          title: 'New Mood',
          href: null,
        }}
      />
      {/* Hidden route for native mood creation */}
      <Tabs.Screen
        name="create-mood"
        options={{
          title: 'Create Mood',
          href: null,
        }}
      />
      {/* Hidden route for explore */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#0F172A', // Background color for safe area
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1F2937', // Dark gray/black
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerSpacer: {
    width: 70, // Space for the center FAB button
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  fabButton: {
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#92400E', // Brown/amber
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
});
