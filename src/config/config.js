/**
 * Central Configuration File
 *
 * This file contains all configurable constants for the app.
 * When cloning this base app for a new project, modify these values
 * to customize the app behavior without touching core logic.
 */

const config = {
  // ===== WebView Configuration =====

  /**
   * The URL that will be loaded in the WebView as the main interface
   * Change this to your web application URL for each new app
   * @example 'https://example.com'
   */
  WEB_URL: 'https://feelith.com',

  // ===== App Information =====

  /**
   * The display name of the application
   * This is used in native screens and can be different from the app name in stores
   */
  APP_TITLE: 'Base App',

  /**
   * App version (keep in sync with package.json)
   */
  APP_VERSION: '1.0.0',

  // ===== Feature Flags =====

  /**
   * Master switch to enable/disable all native features
   * Set to false to run app in pure WebView mode (useful for testing)
   */
  ALLOW_NATIVE_FEATURES: true,

  /**
   * Enable/disable specific native features
   * These can be toggled individually even when ALLOW_NATIVE_FEATURES is true
   */
  FEATURES: {
    PUSH_NOTIFICATIONS: true,
    SHARING: true,
    DEEP_LINKING: true,
  },

  // ===== Authentication =====

  /**
   * SecureStore keys for authentication data
   */
  AUTH_STORAGE_KEYS: {
    USER_ID: 'user_id',
    USER_TOKEN: 'user_token',
    IS_LOGGED_IN: 'is_logged_in',
  },

  // ===== Push Notifications =====

  /**
   * Expo Project ID for push notifications
   * Get this from: https://expo.dev > Your Project > Project settings
   * Required for push notifications to work in production
   * @example 'abc123-def456-ghi789'
   */
  EXPO_PROJECT_ID: undefined, // TODO: Add your Expo project ID here

  /**
   * Push notification retry configuration
   */
  PUSH_TOKEN_RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
  },

  // ===== UI Configuration =====

  /**
   * Theme colors (used in native screens like Error and Loading)
   */
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    BACKGROUND: '#FFFFFF',
    ERROR: '#FF3B30',
    SUCCESS: '#34C759',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#8E8E93',
  },

  /**
   * Error messages
   */
  ERROR_MESSAGES: {
    NO_CONNECTION: 'No internet connection. Please check your network and try again.',
    FAILED_TO_LOAD: 'Failed to load the application. Please try again.',
    GENERIC_ERROR: 'Something went wrong. Please try again later.',
  },

  // ===== Development =====

  /**
   * Enable debug logging (set to false in production)
   */
  DEBUG: __DEV__,

  /**
   * Show detailed error information in UI (only in dev mode)
   */
  SHOW_DEV_ERRORS: __DEV__,
};

export default config;
