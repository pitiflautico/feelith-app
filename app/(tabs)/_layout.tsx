import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import useAuth from '../../src/hooks/useAuth';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { isLoggedIn, user } = useAuth();
  const { isOnboarding } = useOnboarding();
  const insets = useSafeAreaInsets();

  const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    // Don't show tab bar if not logged in or during onboarding
    if (!isLoggedIn || isOnboarding) {
      return null;
    }

    return (
      <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || 20 }]}>
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Skip the "new" route in the tab bar (it's the center button)
            if (route.name === 'new') {
              return null;
            }

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Get icon based on route name
            let iconName = 'house.fill';
            if (route.name === 'calendar') iconName = 'calendar';
            if (route.name === 'settings') iconName = 'gearshape.fill';
            if (route.name === 'profile') iconName = 'person.fill';

            return (
              <TouchableOpacity
                key={route.name}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabButton}
              >
                {route.name === 'profile' && user?.profile_photo_path ? (
                  <Image
                    source={{ uri: user.profile_photo_path }}
                    style={[styles.profileImage, isFocused && styles.profileImageActive]}
                  />
                ) : (
                  <IconSymbol
                    name={iconName}
                    size={24}
                    color={isFocused ? '#FFFFFF' : '#9CA3AF'}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Center FAB Button */}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('new')}
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
        }}
      />
      {/* Hidden route for the center button - creates the modal */}
      <Tabs.Screen
        name="new"
        options={{
          title: 'New Mood',
          href: null, // This makes it not appear in the tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide explore from tab bar
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1F2937', // Dark gray/black
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
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
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileImageActive: {
    borderColor: '#FFFFFF',
  },
});
