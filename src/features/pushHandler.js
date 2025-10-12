import config from '../config/config';

/**
 * Push Notification Handler
 *
 * Central handler for processing push notifications.
 * Routes notifications based on their type (url, nativeAction, etc.)
 */

// Reference to WebView navigation and reload functions (set by HomeScreen)
let webViewNavigate = null;
let webViewReload = null;

/**
 * Set the WebView navigation function
 * This should be called from the component that owns the WebView
 *
 * @param {Function} navigateFn - Function that takes a URL and navigates the WebView
 * @param {Function} reloadFn - Function that reloads the WebView
 */
export const setWebViewNavigate = (navigateFn, reloadFn) => {
  webViewNavigate = navigateFn;
  webViewReload = reloadFn;
  if (config.DEBUG) {
    console.log('[PushHandler] WebView navigation and reload functions registered');
  }
};

/**
 * Registry of native actions that can be triggered by notifications
 * Each action is a function that receives the notification data
 */
const nativeActions = {
  // Example: refresh action
  refresh: (data) => {
    if (config.DEBUG) {
      console.log('[PushHandler] Executing refresh action');
    }
    // Reload the WebView if reload function is available
    if (webViewReload) {
      webViewReload();
    } else if (webViewNavigate) {
      // Fallback to navigation if reload not available
      webViewNavigate(config.WEB_URL);
    }
  },

  // Example: alert action
  alert: (data) => {
    if (config.DEBUG) {
      console.log('[PushHandler] Executing alert action:', data);
    }
    // Could show a native alert here
    // Alert.alert(data.title || 'Notification', data.message || 'You have a new notification');
  },

  // Add more native actions here as needed
};

/**
 * Register a custom native action
 *
 * @param {string} actionName - Name of the action
 * @param {Function} handler - Function to execute when action is triggered
 */
export const registerNativeAction = (actionName, handler) => {
  nativeActions[actionName] = handler;
  if (config.DEBUG) {
    console.log(`[PushHandler] Registered native action: ${actionName}`);
  }
};

/**
 * Handle URL navigation from notification
 *
 * @param {object} data - Notification data containing URL
 */
const handleUrlNavigation = (data) => {
  const url = data.url;

  if (!url) {
    console.warn('[PushHandler] URL navigation requested but no URL provided');
    return;
  }

  if (config.DEBUG) {
    console.log('[PushHandler] Navigating to URL:', url);
  }

  if (!webViewNavigate) {
    console.error('[PushHandler] WebView navigation function not set');
    return;
  }

  // Navigate the WebView to the URL
  webViewNavigate(url);
};

/**
 * Handle native action from notification
 *
 * @param {object} data - Notification data containing action name
 */
const handleNativeAction = (data) => {
  const actionName = data.action;

  if (!actionName) {
    console.warn('[PushHandler] Native action requested but no action name provided');
    return;
  }

  if (config.DEBUG) {
    console.log('[PushHandler] Executing native action:', actionName);
  }

  const actionHandler = nativeActions[actionName];

  if (!actionHandler) {
    console.warn(`[PushHandler] Unknown native action: ${actionName}`);
    return;
  }

  // Execute the action
  try {
    actionHandler(data);
  } catch (error) {
    console.error(`[PushHandler] Error executing action ${actionName}:`, error);
  }
};

/**
 * Main notification handler
 * Called when a notification is received (foreground) or tapped (background)
 *
 * @param {object} notification - The notification object from expo-notifications
 * @returns {boolean} true if handled successfully
 */
export const handleNotification = (notification) => {
  try {
    // Extract data from notification
    const data = notification.request?.content?.data || notification.data || {};

    if (config.DEBUG) {
      console.log('[PushHandler] Handling notification:', JSON.stringify(data, null, 2));
    }

    // Check if native features are enabled
    if (!config.ALLOW_NATIVE_FEATURES) {
      console.log('[PushHandler] Native features disabled, ignoring notification');
      return false;
    }

    // Route based on notification type
    const type = data.type;

    switch (type) {
      case 'url':
        handleUrlNavigation(data);
        break;

      case 'nativeAction':
        handleNativeAction(data);
        break;

      default:
        if (config.DEBUG) {
          console.log('[PushHandler] Unknown notification type:', type);
        }
        break;
    }

    return true;
  } catch (error) {
    console.error('[PushHandler] Error handling notification:', error);
    return false;
  }
};

/**
 * Handle notification response (when user taps on notification)
 *
 * @param {object} response - The notification response from expo-notifications
 */
export const handleNotificationResponse = (response) => {
  if (config.DEBUG) {
    console.log('[PushHandler] Notification tapped');
  }

  // Extract the notification from the response
  const notification = response.notification;
  handleNotification(notification);
};
