import * as Linking from 'expo-linking';
import config from '../config/config';

/**
 * Deep Link Service
 *
 * Handles deep linking functionality for opening the app from URLs.
 * Supports both custom URL schemes (yourapp://) and Universal Links (https://yourdomain.com).
 */

/**
 * Parse a deep link URL and extract the path and query parameters
 *
 * @param {string} url - The deep link URL
 * @returns {Object|null} Parsed URL object with path and queryParams, or null if invalid
 */
export const parseDeepLink = (url) => {
  try {
    if (!url) {
      return null;
    }

    if (config.DEBUG) {
      console.log('[DeepLinkService] Parsing URL:', url);
    }

    // Parse the URL using Expo Linking
    const parsed = Linking.parse(url);

    if (config.DEBUG) {
      console.log('[DeepLinkService] Parsed URL:', JSON.stringify(parsed, null, 2));
    }

    return {
      scheme: parsed.scheme,
      hostname: parsed.hostname,
      path: parsed.path || '',
      queryParams: parsed.queryParams || {},
      url: url,
    };

  } catch (error) {
    console.error('[DeepLinkService] Error parsing deep link:', error);
    return null;
  }
};

/**
 * Get the initial deep link URL that opened the app (if any)
 *
 * @returns {Promise<string|null>} The initial URL or null
 */
export const getInitialURL = async () => {
  try {
    const url = await Linking.getInitialURL();

    if (config.DEBUG && url) {
      console.log('[DeepLinkService] App opened with URL:', url);
    }

    return url;
  } catch (error) {
    console.error('[DeepLinkService] Error getting initial URL:', error);
    return null;
  }
};

/**
 * Convert a deep link path to a web URL path
 * This allows mapping app deep links to web routes
 *
 * @param {string} path - The deep link path (e.g., 'calendar', 'profile/123')
 * @returns {string} The full web URL
 */
export const deepLinkToWebUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Ensure WEB_URL doesn't end with slash
  const baseUrl = config.WEB_URL.endsWith('/')
    ? config.WEB_URL.slice(0, -1)
    : config.WEB_URL;

  // Construct full web URL
  // Only add slash if there's a path
  const webUrl = cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;

  if (config.DEBUG) {
    console.log('[DeepLinkService] Converted deep link to web URL:', {
      deepLinkPath: path,
      webUrl: webUrl,
    });
  }

  return webUrl;
};

/**
 * Add a listener for deep link events
 * This is called when the app is already open and receives a new deep link
 *
 * @param {Function} handler - Callback function that receives the URL
 * @returns {Object} Subscription object with remove() method
 */
export const addDeepLinkListener = (handler) => {
  try {
    if (config.DEBUG) {
      console.log('[DeepLinkService] Adding deep link listener');
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (config.DEBUG) {
        console.log('[DeepLinkService] Deep link received:', url);
      }
      handler(url);
    });

    return subscription;

  } catch (error) {
    console.error('[DeepLinkService] Error adding deep link listener:', error);
    return null;
  }
};

/**
 * Open a URL (external link)
 *
 * @param {string} url - The URL to open
 * @returns {Promise<boolean>} Success status
 */
export const openURL = async (url) => {
  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      console.warn('[DeepLinkService] Cannot open URL:', url);
      return false;
    }

    await Linking.openURL(url);

    if (config.DEBUG) {
      console.log('[DeepLinkService] Opened URL:', url);
    }

    return true;

  } catch (error) {
    console.error('[DeepLinkService] Error opening URL:', error);
    return false;
  }
};

/**
 * Handle a deep link URL by navigating to the appropriate route
 *
 * @param {string} url - The deep link URL
 * @param {Function} navigateCallback - Function to call with the web URL to navigate to
 * @returns {boolean} Success status
 */
export const handleDeepLink = (url, navigateCallback) => {
  try {
    // Check if feature is enabled
    if (!config.FEATURES.DEEP_LINKING) {
      console.warn('[DeepLinkService] Deep linking feature is disabled in config');
      return false;
    }

    const parsed = parseDeepLink(url);

    if (!parsed) {
      console.warn('[DeepLinkService] Failed to parse deep link');
      return false;
    }

    // Convert deep link path to web URL
    const webUrl = deepLinkToWebUrl(parsed.path);

    if (config.DEBUG) {
      console.log('[DeepLinkService] Handling deep link:', {
        originalUrl: url,
        path: parsed.path,
        targetWebUrl: webUrl,
      });
    }

    // Call the navigation callback
    if (typeof navigateCallback === 'function') {
      navigateCallback(webUrl);
      return true;
    } else {
      console.error('[DeepLinkService] Navigate callback is not a function');
      return false;
    }

  } catch (error) {
    console.error('[DeepLinkService] Error handling deep link:', error);
    return false;
  }
};

export default {
  parseDeepLink,
  getInitialURL,
  deepLinkToWebUrl,
  addDeepLinkListener,
  openURL,
  handleDeepLink,
};
