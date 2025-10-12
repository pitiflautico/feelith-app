import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import config from '../config/config';

/**
 * Push Notification Service
 *
 * Handles requesting permissions and registering for push notifications.
 * Gets the Expo push token that can be sent to the backend.
 */

/**
 * Configure how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push notification permissions from the user
 *
 * @returns {Promise<boolean>} true if permission granted, false otherwise
 */
export const requestPermissions = async () => {
  try {
    if (config.DEBUG) {
      console.log('[PushService] Requesting notification permissions...');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permission not yet granted, ask the user
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushService] Notification permission denied');
      return false;
    }

    if (config.DEBUG) {
      console.log('[PushService] Notification permission granted');
    }

    return true;
  } catch (error) {
    console.error('[PushService] Error requesting permissions:', error);
    return false;
  }
};

/**
 * Register for push notifications and get the Expo push token
 *
 * @returns {Promise<string|null>} The Expo push token or null if registration failed
 */
export const registerForPushNotifications = async () => {
  try {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.warn('[PushService] Push notifications only work on physical devices');
      return null;
    }

    // First request permissions
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn('[PushService] Cannot register without permission');
      return null;
    }

    // Get the Expo push token
    let token = null;
    try {
      const tokenParams = {};

      // Add projectId if configured
      if (config.EXPO_PROJECT_ID) {
        tokenParams.projectId = config.EXPO_PROJECT_ID;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync(tokenParams);
      token = tokenData.data;
    } catch (error) {
      // If projectId is needed, the error will indicate that
      console.warn('[PushService] Could not get Expo push token:', error.message);
      if (!config.EXPO_PROJECT_ID) {
        console.warn('[PushService] Set EXPO_PROJECT_ID in config for production use');
      }
      // Continue anyway - local notifications will still work
    }

    if (config.DEBUG) {
      console.log('[PushService] Expo push token:', token);
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: config.COLORS.PRIMARY,
      });
    }

    return token;
  } catch (error) {
    console.error('[PushService] Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Schedule a local notification (useful for testing)
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to include with notification
 * @param {number} seconds - Delay in seconds before showing notification (default: 3)
 */
export const scheduleLocalNotification = async (title, body, data = {}, seconds = 3) => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds === 0 ? null : { seconds },
    });

    if (config.DEBUG) {
      console.log(`[PushService] Local notification scheduled (ID: ${identifier}) for ${seconds}s`);
    }

    return identifier;
  } catch (error) {
    console.error('[PushService] Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (config.DEBUG) {
      console.log('[PushService] All notifications cancelled');
    }
  } catch (error) {
    console.error('[PushService] Error cancelling notifications:', error);
  }
};
