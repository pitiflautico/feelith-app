import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, TextInput, ActivityIndicator, Switch } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import useAuth from '../hooks/useAuth';
import config from '../config/config';
import { registerPushToken } from '../services/pushTokenService';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

/**
 * SettingsScreen Component with Tabs
 *
 * Three tabs:
 * 1. General - User profile data
 * 2. Calendar - Google Calendar sync status
 * 3. Privacy - Permissions and logout
 */
const SettingsScreen = () => {
  const router = useRouter();
  const { isLoggedIn, userId, userToken, pushTokenEndpoint, logout: authLogout } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState('general');

  // User Profile Data
  const [userProfile, setUserProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Calendar Status
  const [calendarStatus, setCalendarStatus] = useState(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');

  // Permissions
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [cameraStatus, setCameraStatus] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  useEffect(() => {
    if (isLoggedIn && userToken) {
      console.log('[Settings] Loading data with token:', userToken ? 'Token present' : 'No token');
      console.log('[Settings] API URL:', config.API_URL);
      loadUserProfile();
      loadCalendarStatus();
      checkAllPermissions();
    } else if (isLoggedIn && !userToken) {
      console.log('[Settings] User is logged in but token is missing');
    }
  }, [isLoggedIn, userToken]);

  /**
   * Load user profile from API
   */
  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const url = `${config.API_URL}/profile`;
      console.log('[Settings] Fetching profile from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      console.log('[Settings] Profile response status:', response.status);
      const data = await response.json();
      console.log('[Settings] Profile data:', data);

      if (data.success) {
        setUserProfile(data.data);
        setName(data.data.name || '');
        setEmail(data.data.email || '');
        setAge(data.data.age?.toString() || '');
      } else {
        console.log('[Settings] Profile request failed:', data);
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('[Settings] Error loading profile:', error);
      console.error('[Settings] Error details:', {
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', `Failed to load profile: ${error.message}`);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  /**
   * Save user profile to API
   */
  const saveUserProfile = async () => {
    try {
      setIsSavingProfile(true);

      const response = await fetch(`${config.API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          age: age ? parseInt(age) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setUserProfile(data.data);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('[Settings] Error saving profile:', error);
      Alert.alert('Error', 'An error occurred while saving');
    } finally {
      setIsSavingProfile(false);
    }
  };

  /**
   * Load calendar sync status from API
   */
  const loadCalendarStatus = async () => {
    try {
      setIsLoadingCalendar(true);
      const response = await fetch(`${config.API_URL}/profile/calendar-status`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCalendarStatus(data.data);
        setQuietHoursStart(data.data.quiet_hours_start || '22:00');
        setQuietHoursEnd(data.data.quiet_hours_end || '08:00');
      }
    } catch (error) {
      console.error('[Settings] Error loading calendar status:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  /**
   * Toggle calendar sync
   */
  const toggleCalendarSync = async () => {
    try {
      const response = await fetch(`${config.API_URL}/profile/calendar/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCalendarStatus({
          ...calendarStatus,
          calendar_sync_enabled: data.data.calendar_sync_enabled,
        });
        Alert.alert('Success', data.message);
      }
    } catch (error) {
      console.error('[Settings] Error toggling calendar sync:', error);
      Alert.alert('Error', 'Failed to toggle calendar sync');
    }
  };

  /**
   * Sync calendar now
   */
  const syncCalendarNow = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch(`${config.API_URL}/profile/calendar/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setCalendarStatus({
          ...calendarStatus,
          last_sync_at: data.data.last_sync_at,
        });
        Alert.alert('Success', `${data.data.events_synced} events synced!`);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('[Settings] Error syncing calendar:', error);
      Alert.alert('Error', 'Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Disconnect calendar
   */
  const disconnectCalendar = async () => {
    Alert.alert(
      'Disconnect Calendar',
      'Are you sure? Your existing data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${config.API_URL}/profile/calendar/disconnect`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${userToken}`,
                  'Accept': 'application/json',
                },
              });

              const data = await response.json();

              if (data.success) {
                setCalendarStatus({
                  is_connected: false,
                  calendar_sync_enabled: false,
                  last_sync_at: null,
                  quiet_hours_start: '22:00',
                  quiet_hours_end: '08:00',
                });
                Alert.alert('Success', data.message);
              }
            } catch (error) {
              console.error('[Settings] Error disconnecting calendar:', error);
              Alert.alert('Error', 'Failed to disconnect calendar');
            }
          },
        },
      ]
    );
  };

  /**
   * Save quiet hours
   */
  const saveQuietHours = async () => {
    try {
      const response = await fetch(`${config.API_URL}/profile/calendar/quiet-hours`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Quiet hours updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update quiet hours');
      }
    } catch (error) {
      console.error('[Settings] Error saving quiet hours:', error);
      Alert.alert('Error', 'Failed to save quiet hours');
    }
  };

  /**
   * Check all permissions status
   */
  const checkAllPermissions = async () => {
    try {
      setIsLoadingPermissions(true);

      // Check notification permission
      const notifStatus = await Notifications.getPermissionsAsync();
      setNotificationStatus(notifStatus.status);

      // Check camera permission
      const camStatus = await Camera.getCameraPermissionsAsync();
      setCameraStatus(camStatus.status);

      // Check audio permission
      const audStatus = await Audio.getPermissionsAsync();
      setAudioStatus(audStatus.status);

    } catch (error) {
      console.error('[Settings] Error checking permissions:', error);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  /**
   * Request notification permission and register token
   */
  const handleRequestNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationStatus(status);

      if (status === 'granted') {
        // Register push token
        if (pushTokenEndpoint) {
          await registerPushToken(userId, userToken, pushTokenEndpoint);
          Alert.alert('Success', 'Notifications enabled and token registered');
        }
      } else {
        Alert.alert('Permission Denied', 'Go to Settings to enable notifications');
      }
    } catch (error) {
      console.error('[Settings] Error requesting notifications:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  /**
   * Request camera permission
   */
  const handleRequestCamera = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraStatus(status);

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Go to Settings to enable camera access');
      }
    } catch (error) {
      console.error('[Settings] Error requesting camera:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  /**
   * Request microphone permission
   */
  const handleRequestMicrophone = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioStatus(status);

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Go to Settings to enable microphone access');
      }
    } catch (error) {
      console.error('[Settings] Error requesting microphone:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authLogout();
          },
        },
      ]
    );
  };

  /**
   * Render permission status
   */
  const renderPermissionStatus = (status) => {
    if (status === 'granted') {
      return <Text style={styles.statusGranted}>Enabled</Text>;
    } else if (status === 'denied') {
      return <Text style={styles.statusDenied}>Denied</Text>;
    } else {
      return <Text style={styles.statusUndetermined}>Not configured</Text>;
    }
  };

  /**
   * Render General Tab
   */
  const renderGeneralTab = () => (
    <View style={styles.tabContent}>
      {isLoadingProfile ? (
        <ActivityIndicator size="large" color={config.COLORS.PRIMARY} />
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
            onPress={saveUserProfile}
            disabled={isSavingProfile}
          >
            <Text style={styles.saveButtonText}>
              {isSavingProfile ? 'Saving...' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  /**
   * Render Calendar Tab
   */
  const renderCalendarTab = () => (
    <View style={styles.tabContent}>
      {isLoadingCalendar ? (
        <ActivityIndicator size="large" color={config.COLORS.PRIMARY} />
      ) : (
        <>
          {/* Connection Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Google Calendar</Text>
              {calendarStatus?.is_connected ? (
                <Text style={styles.statusGranted}>Connected</Text>
              ) : (
                <Text style={styles.statusDenied}>Not connected</Text>
              )}
            </View>

            {calendarStatus?.last_sync_at && (
              <Text style={styles.statusHint}>
                Last sync: {new Date(calendarStatus.last_sync_at).toLocaleString()}
              </Text>
            )}

            {calendarStatus?.is_connected && (
              <TouchableOpacity
                style={[styles.actionButton, styles.disconnectButton]}
                onPress={disconnectCalendar}
              >
                <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
                <Text style={[styles.actionButtonText, styles.disconnectButtonText]}>
                  Disconnect Calendar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {!calendarStatus?.is_connected ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(`${config.WEB_URL}/auth/google/sync`)}
            >
              <IconSymbol name="link" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Connect Google Calendar</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Automatic Sync Toggle */}
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Automatic Sync</Text>
                  <Switch
                    value={calendarStatus?.calendar_sync_enabled || false}
                    onValueChange={toggleCalendarSync}
                    trackColor={{ false: '#E8E3DD', true: '#8B6F47' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.statusHint}>
                  Automatically sync events from your Google Calendar
                </Text>
              </View>

              {/* Sync Now Button */}
              <TouchableOpacity
                style={[styles.actionButton, isSyncing && styles.actionButtonDisabled]}
                onPress={syncCalendarNow}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <IconSymbol name="arrow.clockwise" size={20} color="#FFF" />
                )}
                <Text style={styles.actionButtonText}>
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Text>
              </TouchableOpacity>

              {/* View Calendar Events */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/calendar-events')}
              >
                <IconSymbol name="calendar" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>View Calendar Events</Text>
              </TouchableOpacity>

              {/* Calendar Settings Link */}
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => Linking.openURL(`${config.WEB_URL}/calendar-settings`)}
              >
                <IconSymbol name="gearshape.fill" size={20} color="#8B6F47" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                  Advanced Settings
                </Text>
              </TouchableOpacity>

              {/* Quiet Hours Section */}
              {calendarStatus?.calendar_sync_enabled && (
                <View style={styles.quietHoursCard}>
                  <Text style={styles.quietHoursTitle}>Quiet Hours</Text>
                  <Text style={styles.statusHint}>
                    No notifications will be sent during these hours
                  </Text>

                  <View style={styles.timePickerRow}>
                    <View style={styles.timePickerGroup}>
                      <Text style={styles.timePickerLabel}>Start</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={quietHoursStart}
                        onChangeText={setQuietHoursStart}
                        placeholder="22:00"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={styles.timePickerGroup}>
                      <Text style={styles.timePickerLabel}>End</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={quietHoursEnd}
                        onChangeText={setQuietHoursEnd}
                        placeholder="08:00"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveQuietHoursButton}
                    onPress={saveQuietHours}
                  >
                    <Text style={styles.saveQuietHoursButtonText}>Save Quiet Hours</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );

  /**
   * Render Privacy Tab
   */
  const renderPrivacyTab = () => (
    <View style={styles.tabContent}>
      {/* Session Status */}
      <View style={styles.sectionHeader}>
        <IconSymbol name="person.circle.fill" size={24} color={config.COLORS.PRIMARY} />
        <Text style={styles.sectionTitle}>Session</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          {isLoggedIn ? (
            <Text style={styles.statusGranted}>Logged in</Text>
          ) : (
            <Text style={styles.statusDenied}>Not logged in</Text>
          )}
        </View>

        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol name="arrow.right.square.fill" size={20} color="#FFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Permissions */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <IconSymbol name="lock.shield.fill" size={24} color={config.COLORS.PRIMARY} />
        <Text style={styles.sectionTitle}>Permissions</Text>
      </View>

      {/* Notifications */}
      <View style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <IconSymbol name="bell.fill" size={20} color={config.COLORS.TEXT_PRIMARY} />
            <Text style={styles.permissionLabel}>Notifications</Text>
          </View>
          {renderPermissionStatus(notificationStatus)}
        </View>

        {notificationStatus !== 'granted' && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestNotifications}
          >
            <Text style={styles.permissionButtonText}>Enable</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Camera */}
      <View style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <IconSymbol name="camera.fill" size={20} color={config.COLORS.TEXT_PRIMARY} />
            <Text style={styles.permissionLabel}>Camera</Text>
          </View>
          {renderPermissionStatus(cameraStatus)}
        </View>

        {cameraStatus !== 'granted' && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestCamera}
          >
            <Text style={styles.permissionButtonText}>Enable</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Microphone */}
      <View style={styles.permissionCard}>
        <View style={styles.permissionRow}>
          <View style={styles.permissionInfo}>
            <IconSymbol name="mic.fill" size={20} color={config.COLORS.TEXT_PRIMARY} />
            <Text style={styles.permissionLabel}>Microphone</Text>
          </View>
          {renderPermissionStatus(audioStatus)}
        </View>

        {audioStatus !== 'granted' && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestMicrophone}
          >
            <Text style={styles.permissionButtonText}>Enable</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* System Settings Link */}
      <TouchableOpacity
        style={styles.systemSettingsButton}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.systemSettingsText}>Open System Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your AI setting here</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && styles.tabActive]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
            General
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'calendar' && renderCalendarTab()}
        {activeTab === 'privacy' && renderPrivacyTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3F0',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3D2817',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#E8E3DD',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B7355',
  },
  tabTextActive: {
    color: '#3D2817',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tabContent: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D2817',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3D2817',
    borderWidth: 1,
    borderColor: '#E8E3DD',
  },
  saveButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D2817',
  },
  statusGranted: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  statusDenied: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  statusUndetermined: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  statusHint: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8B6F47',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#8B6F47',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginTop: 12,
  },
  disconnectButtonText: {
    color: '#EF4444',
  },
  quietHoursCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  quietHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2817',
    marginBottom: 4,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  timePickerGroup: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3D2817',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#F5F3F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D2817',
    borderWidth: 1,
    borderColor: '#E8E3DD',
  },
  saveQuietHoursButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveQuietHoursButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D2817',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3D2817',
  },
  permissionButton: {
    backgroundColor: '#8B6F47',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  systemSettingsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B6F47',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  systemSettingsText: {
    color: '#8B6F47',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
