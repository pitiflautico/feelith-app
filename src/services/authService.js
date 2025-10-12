import * as SecureStore from 'expo-secure-store';
import config from '../config/config';

/**
 * Authentication Service
 *
 * Handles secure storage and retrieval of authentication data using SecureStore.
 * All sensitive user data (tokens, user IDs) should be stored through this service.
 */

/**
 * Save authentication data to SecureStore
 *
 * @param {string} userId - The user's unique identifier
 * @param {string} userToken - The authentication token
 * @param {string} pushTokenEndpoint - Optional push token endpoint URL
 * @returns {Promise<boolean>} Success status
 */
export const saveAuthData = async (userId, userToken, pushTokenEndpoint = null) => {
  try {
    // Store user data in SecureStore
    await SecureStore.setItemAsync(config.AUTH_STORAGE_KEYS.USER_ID, userId);
    await SecureStore.setItemAsync(config.AUTH_STORAGE_KEYS.USER_TOKEN, userToken);
    await SecureStore.setItemAsync(config.AUTH_STORAGE_KEYS.IS_LOGGED_IN, 'true');

    // Store push token endpoint if provided
    if (pushTokenEndpoint) {
      await SecureStore.setItemAsync(config.AUTH_STORAGE_KEYS.PUSH_TOKEN_ENDPOINT, pushTokenEndpoint);
    }

    if (config.DEBUG) {
      console.log('[AuthService] Auth data saved successfully');
    }

    return true;
  } catch (error) {
    console.error('[AuthService] Failed to save auth data:', error);
    return false;
  }
};

/**
 * Retrieve authentication data from SecureStore
 *
 * @returns {Promise<Object|null>} Auth data object or null if not found
 */
export const getAuthData = async () => {
  try {
    const userId = await SecureStore.getItemAsync(config.AUTH_STORAGE_KEYS.USER_ID);
    const userToken = await SecureStore.getItemAsync(config.AUTH_STORAGE_KEYS.USER_TOKEN);
    const isLoggedIn = await SecureStore.getItemAsync(config.AUTH_STORAGE_KEYS.IS_LOGGED_IN);
    const pushTokenEndpoint = await SecureStore.getItemAsync(config.AUTH_STORAGE_KEYS.PUSH_TOKEN_ENDPOINT);

    // If any required field is missing, return null
    if (!userId || !userToken || isLoggedIn !== 'true') {
      return null;
    }

    if (config.DEBUG) {
      console.log('[AuthService] Auth data retrieved successfully');
    }

    return {
      userId,
      userToken,
      pushTokenEndpoint,
      isLoggedIn: true,
    };
  } catch (error) {
    console.error('[AuthService] Failed to retrieve auth data:', error);
    return null;
  }
};

/**
 * Clear all authentication data from SecureStore
 *
 * @returns {Promise<boolean>} Success status
 */
export const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync(config.AUTH_STORAGE_KEYS.USER_ID);
    await SecureStore.deleteItemAsync(config.AUTH_STORAGE_KEYS.USER_TOKEN);
    await SecureStore.deleteItemAsync(config.AUTH_STORAGE_KEYS.IS_LOGGED_IN);
    await SecureStore.deleteItemAsync(config.AUTH_STORAGE_KEYS.PUSH_TOKEN_ENDPOINT);

    if (config.DEBUG) {
      console.log('[AuthService] Auth data cleared successfully');
    }

    return true;
  } catch (error) {
    console.error('[AuthService] Failed to clear auth data:', error);
    return false;
  }
};

/**
 * Check if user is currently authenticated
 *
 * @returns {Promise<boolean>} Authentication status
 */
export const isAuthenticated = async () => {
  try {
    const authData = await getAuthData();
    return authData !== null && authData.isLoggedIn === true;
  } catch (error) {
    console.error('[AuthService] Failed to check authentication status:', error);
    return false;
  }
};

/**
 * Get the current user ID
 *
 * @returns {Promise<string|null>} User ID or null if not authenticated
 */
export const getUserId = async () => {
  try {
    const authData = await getAuthData();
    return authData?.userId || null;
  } catch (error) {
    console.error('[AuthService] Failed to get user ID:', error);
    return null;
  }
};

/**
 * Get the current user token
 *
 * @returns {Promise<string|null>} User token or null if not authenticated
 */
export const getUserToken = async () => {
  try {
    const authData = await getAuthData();
    return authData?.userToken || null;
  } catch (error) {
    console.error('[AuthService] Failed to get user token:', error);
    return null;
  }
};

export default {
  saveAuthData,
  getAuthData,
  clearAuthData,
  isAuthenticated,
  getUserId,
  getUserToken,
};
