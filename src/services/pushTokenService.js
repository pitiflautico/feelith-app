import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import config from '../config/config';

/**
 * Push Token Registration Service
 *
 * Handles sending the device's push token to the backend server
 * so it can send push notifications to this specific device.
 */

/**
 * Register the device's push token with the backend
 *
 * @param {string} userId - User ID from authentication
 * @param {string} userToken - Authentication token for API calls
 * @param {string} pushTokenEndpoint - Backend endpoint URL for registration
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<boolean>} true if registration succeeded, false otherwise
 */
export const registerPushToken = async (
  userId,
  userToken,
  pushTokenEndpoint,
  maxRetries = config.PUSH_TOKEN_RETRY?.MAX_RETRIES || 3
) => {
  // Validate required parameters
  if (!userId || !userToken || !pushTokenEndpoint) {
    console.warn('[PushTokenService] Missing required parameters');
    if (config.DEBUG) {
      console.log('[PushTokenService] userId:', userId);
      console.log('[PushTokenService] userToken:', userToken ? 'present' : 'missing');
      console.log('[PushTokenService] endpoint:', pushTokenEndpoint);
    }
    return false;
  }

  if (config.DEBUG) {
    console.log('[PushTokenService] Starting push token registration...');
    console.log('[PushTokenService] Endpoint:', pushTokenEndpoint);
  }

  // Check if we have notification permissions
  const { status } = await Notifications.getPermissionsAsync();
  const hasPermission = status === 'granted';

  if (config.DEBUG) {
    console.log('[PushTokenService] Permission status:', status);
    console.log('[PushTokenService] Has permission:', hasPermission);
  }

  // Get platform
  const platform = Platform.OS; // 'ios' or 'android'

  // Prepare the payload
  let payload = {
    userId,
    platform,
  };

  if (hasPermission) {
    // Try to get the push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      if (config.DEBUG) {
        console.log('[PushTokenService] Push token obtained:', pushToken);
      }

      payload.pushToken = pushToken;
    } catch (error) {
      console.warn('[PushTokenService] Could not get push token:', error.message);
      // Continue with hasPermission: false
      payload.hasPermission = false;
    }
  } else {
    // No permission granted
    payload.hasPermission = false;

    if (config.DEBUG) {
      console.log('[PushTokenService] No permission, sending hasPermission: false');
    }
  }

  // Send to backend with retry logic
  return await sendWithRetry(pushTokenEndpoint, userToken, payload, maxRetries);
};

/**
 * Send push token to backend with exponential backoff retry
 *
 * @param {string} endpoint - Backend endpoint URL
 * @param {string} userToken - Authentication token
 * @param {object} payload - Data to send
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} attempt - Current attempt number (internal use)
 * @returns {Promise<boolean>} true if succeeded, false otherwise
 */
const sendWithRetry = async (endpoint, userToken, payload, maxRetries, attempt = 1) => {
  try {
    if (config.DEBUG) {
      console.log(`[PushTokenService] Attempt ${attempt}/${maxRetries}`);
      console.log('[PushTokenService] Payload:', JSON.stringify(payload, null, 2));
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (config.DEBUG) {
      console.log('[PushTokenService] Response status:', response.status);
    }

    // Success!
    if (response.status === 200) {
      if (config.DEBUG) {
        console.log('[PushTokenService] ✅ Push token registered successfully');
      }
      return true;
    }

    // Server error or invalid response
    const errorText = await response.text().catch(() => 'No response body');
    console.warn(`[PushTokenService] Server returned ${response.status}:`, errorText);

    // Retry on 5xx errors or network issues
    if (response.status >= 500 && attempt < maxRetries) {
      const initialDelay = config.PUSH_TOKEN_RETRY?.INITIAL_DELAY_MS || 1000;
      const maxDelay = config.PUSH_TOKEN_RETRY?.MAX_DELAY_MS || 10000;
      const delayMs = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay); // Exponential backoff
      console.log(`[PushTokenService] Retrying in ${delayMs}ms...`);

      await new Promise(resolve => setTimeout(resolve, delayMs));
      return await sendWithRetry(endpoint, userToken, payload, maxRetries, attempt + 1);
    }

    // Don't retry on 4xx errors (client errors)
    if (response.status >= 400 && response.status < 500) {
      console.error('[PushTokenService] ❌ Client error, not retrying');
      return false;
    }

    // Max retries reached
    console.error('[PushTokenService] ❌ Max retries reached, giving up');
    return false;

  } catch (error) {
    console.error(`[PushTokenService] Network error on attempt ${attempt}:`, error.message);

    // Retry on network errors
    if (attempt < maxRetries) {
      const initialDelay = config.PUSH_TOKEN_RETRY?.INITIAL_DELAY_MS || 1000;
      const maxDelay = config.PUSH_TOKEN_RETRY?.MAX_DELAY_MS || 10000;
      const delayMs = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`[PushTokenService] Retrying in ${delayMs}ms...`);

      await new Promise(resolve => setTimeout(resolve, delayMs));
      return await sendWithRetry(endpoint, userToken, payload, maxRetries, attempt + 1);
    }

    console.error('[PushTokenService] ❌ Max retries reached after network errors');
    return false;
  }
};

/**
 * Unregister push token from backend (on logout)
 *
 * @param {string} userId - User ID
 * @param {string} userToken - Authentication token
 * @param {string} pushTokenEndpoint - Backend endpoint (will use DELETE or send removal flag)
 * @returns {Promise<boolean>} true if succeeded
 */
export const unregisterPushToken = async (userId, userToken, pushTokenEndpoint) => {
  if (!userId || !userToken || !pushTokenEndpoint) {
    console.warn('[PushTokenService] Missing parameters for unregister');
    return false;
  }

  try {
    if (config.DEBUG) {
      console.log('[PushTokenService] Unregistering push token...');
    }

    const platform = Platform.OS;

    // Send removal request
    const response = await fetch(pushTokenEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        platform,
        remove: true, // Flag to indicate removal
      }),
    });

    if (response.status === 200) {
      if (config.DEBUG) {
        console.log('[PushTokenService] ✅ Push token unregistered');
      }
      return true;
    }

    console.warn('[PushTokenService] Failed to unregister:', response.status);
    return false;

  } catch (error) {
    console.error('[PushTokenService] Error unregistering:', error.message);
    return false;
  }
};
