import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { syncAndScheduleNotifications } from './eventNotificationService';
import config from '../config/config';

const BACKGROUND_FETCH_TASK = 'background-event-sync';

/**
 * Background Sync Service
 *
 * Handles background synchronization of calendar events
 * and scheduling of local notifications
 */

/**
 * Define the background task
 * This runs periodically even when app is closed
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundSync] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  try {
    console.log('[BackgroundSync] Task started');

    // Get user token from secure storage
    // Note: You may need to adjust this based on your auth implementation
    const userToken = await getUserToken();

    if (!userToken) {
      console.log('[BackgroundSync] No user token, skipping sync');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Sync and schedule notifications
    const result = await syncAndScheduleNotifications(userToken);

    if (result.success) {
      console.log(`[BackgroundSync] Success! Scheduled ${result.scheduled} notifications`);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.log('[BackgroundSync] Sync failed:', result.reason || result.error);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error('[BackgroundSync] Task execution error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Get user token from storage
 * This is a placeholder - adjust based on your auth implementation
 */
async function getUserToken() {
  try {
    // Try to get from AsyncStorage or SecureStore
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const tokenData = await AsyncStorage.getItem('authToken');

    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.token || parsed.access_token || tokenData;
    }

    return null;
  } catch (error) {
    console.error('[BackgroundSync] Error getting user token:', error);
    return null;
  }
}

/**
 * Register the background fetch task
 * Call this when user logs in or app starts
 */
export async function registerBackgroundSync() {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      console.log('[BackgroundSync] Task already registered');
      return true;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 6 * 60 * 60, // 6 hours in seconds
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start on device boot
    });

    console.log('[BackgroundSync] Task registered successfully');
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Failed to register task:', error);
    return false;
  }
}

/**
 * Unregister the background fetch task
 * Call this when user logs out
 */
export async function unregisterBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (!isRegistered) {
      console.log('[BackgroundSync] Task not registered, nothing to unregister');
      return true;
    }

    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('[BackgroundSync] Task unregistered');
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Failed to unregister task:', error);
    return false;
  }
}

/**
 * Check background fetch status
 */
export async function getBackgroundSyncStatus() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    const statusMap = {
      [BackgroundFetch.BackgroundFetchStatus.Restricted]: 'restricted',
      [BackgroundFetch.BackgroundFetchStatus.Denied]: 'denied',
      [BackgroundFetch.BackgroundFetchStatus.Available]: 'available',
    };

    return {
      isRegistered,
      status: statusMap[status] || 'unknown',
      statusCode: status,
    };
  } catch (error) {
    console.error('[BackgroundSync] Error getting status:', error);
    return {
      isRegistered: false,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Manually trigger sync (for testing or manual refresh)
 */
export async function triggerManualSync(userToken) {
  try {
    console.log('[BackgroundSync] Manual sync triggered');
    const result = await syncAndScheduleNotifications(userToken);
    console.log('[BackgroundSync] Manual sync result:', result);
    return result;
  } catch (error) {
    console.error('[BackgroundSync] Manual sync error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
