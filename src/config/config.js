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
  WEB_URL: process.env.NODE_ENV !== 'production' ? 'http://192.168.86.222:8000' : 'https://feelith.com',

  /**
   * The API base URL for making API requests
   * This is typically the WEB_URL + '/api'
   * @example 'https://example.com/api'
   */
  API_URL: process.env.NODE_ENV !== 'production' ? 'http://192.168.86.222:8000/api' : 'https://feelith.com/api',

  // ===== App Information =====

  /**
   * The display name of the application
   * This is used in native screens and can be different from the app name in stores
   */
  APP_TITLE: 'Feelith',

  /**
   * App slug (lowercase, no spaces, used in URLs and paths)
   * @example 'myapp'
   */
  APP_SLUG: 'feelith',

  /**
   * App version (keep in sync with package.json)
   */
  APP_VERSION: '1.0.0',

  /**
   * iOS Bundle Identifier (reverse domain notation)
   * @example 'com.yourcompany.appname'
   */
  IOS_BUNDLE_ID: 'com.feelith.karma',

  /**
   * Android Package Name (reverse domain notation)
   * @example 'com.yourcompany.appname'
   */
  ANDROID_PACKAGE: 'com.feelith.karma',

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
    PUSH_TOKEN_ENDPOINT: 'push_token_endpoint',
  },

  // ===== Push Notifications =====

  /**
   * Expo Project ID for push notifications
   * Get this from: https://expo.dev > Your Project > Project settings
   * Required for push notifications to work in production
   * @example 'abc123-def456-ghi789'
   */
  EXPO_PROJECT_ID: 'a894459a-a5cb-4254-b8e3-0e4a7d99eb71',

  /**
   * Push notification retry configuration
   */
  PUSH_TOKEN_RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
  },

  // ===== Deep Linking & Sharing =====

  /**
   * URL scheme for deep linking
   * This allows opening the app with URLs like: yourscheme://path
   * @example 'myapp' allows myapp://calendar to open your app
   * Change this to match your app name (lowercase, no spaces)
   */
  DEEP_LINK_SCHEME: 'feelith',

  /**
   * Associated domains for Universal Links (iOS) and App Links (Android)
   * These domains must serve the required association files:
   * - iOS: /.well-known/apple-app-site-association
   * - Android: /.well-known/assetlinks.json
   *
   * When configured, URLs like https://yourdomain.com/path will open your app
   * See DEEP_LINKING.md for server-side configuration
   *
   * @example ['feelith.com', 'www.feelith.com']
   */
  ASSOCIATED_DOMAINS: [
    'feelith.com',
    'www.feelith.com',
  ],

  /**
   * Deep link URL prefixes
   * Used to extract paths from incoming deep links
   */
  DEEP_LINK_PREFIXES: [
    // Will be automatically populated based on DEEP_LINK_SCHEME and ASSOCIATED_DOMAINS
  ],

  // ===== UI Configuration =====

  /**
   * Theme colors (used in native screens like Error and Loading)
   */
  COLORS: {
    PRIMARY: '#9333EA',      // Purple-600 (Karma brand color)
    SECONDARY: '#7C3AED',    // Purple-700
    BACKGROUND: '#FFFFFF',
    ERROR: '#EF4444',        // Red-500
    SUCCESS: '#10B981',      // Green-500
    TEXT_PRIMARY: '#111827', // Gray-900
    TEXT_SECONDARY: '#6B7280', // Gray-500
  },

  /**
   * Layout dimensions
   */
  LAYOUT: {
    TAB_BAR_HEIGHT: 70,        // Height of the floating tab bar
    MODAL_BOTTOM_MARGIN: 70,   // Bottom margin for modals to sit above tab bar
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
  DEBUG: process.env.NODE_ENV !== 'production',

  /**
   * Show detailed error information in UI (only in dev mode)
   */
  SHOW_DEV_ERRORS: process.env.NODE_ENV !== 'production',
};

module.exports = config;
