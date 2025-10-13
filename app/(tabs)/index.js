import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import WebViewScreen from '../../src/screens/WebViewScreen';
import useAuth from '../../src/hooks/useAuth';
import config from '../../src/config/config';
import { requestPermissions, registerForPushNotifications } from '../../src/services/pushService';
import { setWebViewNavigate, handleNotification, handleNotificationResponse } from '../../src/features/pushHandler';
import { registerPushToken, unregisterPushToken } from '../../src/services/pushTokenService';
import { share } from '../../src/services/sharingService';
import { getInitialURL, addDeepLinkListener, handleDeepLink } from '../../src/services/deepLinkService';

/**
 * Main Home Screen
 *
 * Renders the WebView as the primary interface of the app.
 * Handles web-to-native communication and authentication.
 */
export default function HomeScreen() {
  const { isLoggedIn, userId, userToken, isLoading, login, logout } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();
  const deepLinkListener = useRef();

  /**
   * Initialize push notifications
   */
  useEffect(() => {
    // Only initialize if feature is enabled
    if (!config.FEATURES.PUSH_NOTIFICATIONS) {
      return;
    }

    // Request permissions and register for push notifications
    const initPushNotifications = async () => {
      try {
        const hasPermission = await requestPermissions();
        if (hasPermission) {
          await registerForPushNotifications();
        }
      } catch (error) {
        console.error('[HomeScreen] Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    // Register notification listeners
    // This listener is called when notification is received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      handleNotification(notification);
    });

    // This listener is called when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    // Cleanup listeners on unmount
    return () => {
      try {
        if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
          notificationListener.current.remove();
        }
        if (responseListener.current && typeof responseListener.current.remove === 'function') {
          responseListener.current.remove();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  /**
   * Initialize deep linking
   */
  useEffect(() => {
    // Only initialize if feature is enabled
    if (!config.FEATURES.DEEP_LINKING) {
      return;
    }

    // Handle initial URL (when app is opened from a link)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await getInitialURL();
        if (initialUrl && webViewRef.current) {
          const navigateFn = webViewRef.current.navigateToUrl;
          if (navigateFn) {
            handleDeepLink(initialUrl, navigateFn);
          }
        }
      } catch (error) {
        console.error('[HomeScreen] Error handling initial URL:', error);
      }
    };

    // Handle URL when app is already open
    deepLinkListener.current = addDeepLinkListener((url) => {
      if (webViewRef.current) {
        const navigateFn = webViewRef.current.navigateToUrl;
        if (navigateFn) {
          handleDeepLink(url, navigateFn);
        }
      }
    });

    // Check for initial URL after a short delay to ensure webView is ready
    const timeout = setTimeout(() => {
      handleInitialURL();
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      if (deepLinkListener.current && typeof deepLinkListener.current.remove === 'function') {
        deepLinkListener.current.remove();
      }
    };
  }, []);

  /**
   * Handle WebView navigation function registration
   * This allows push notifications to navigate the WebView
   */
  const webViewRef = useRef(null);

  const handleWebViewNavigate = (navigateFn) => {
    // Get reload function from WebView ref
    const reloadFn = webViewRef.current?.reload;
    setWebViewNavigate(navigateFn, reloadFn);
  };

  /**
   * Handle messages from the web application
   * Processes authentication, sharing, and other native actions
   */
  const handleWebMessage = async (message) => {
    // Validate message structure
    if (!message || !message.action) {
      console.warn('[HomeScreen] Invalid message format:', message);
      return;
    }

    // Handle different message types
    switch (message.action) {
      case 'loginSuccess':
        // Handle authentication from web
        if (message.userId && message.userToken) {
          const success = await login(
            message.userId,
            message.userToken,
            message.pushTokenEndpoint
          );

          if (success && message.pushTokenEndpoint) {
            // Register push token with backend if endpoint provided
            await registerPushToken(
              message.userId,
              message.userToken,
              message.pushTokenEndpoint
            );
          }
        }
        break;

      case 'logout':
        // Handle logout from web
        // Try to unregister push token before logout
        if (message.pushTokenEndpoint && userId && userToken) {
          await unregisterPushToken(userId, userToken, message.pushTokenEndpoint);
        }
        await logout();
        break;

      case 'share':
        // Check if sharing feature is enabled
        if (!config.FEATURES.SHARING || !isLoggedIn) {
          return;
        }

        // Call sharing service with provided content
        await share({
          url: message.url,
          text: message.text,
          title: message.title,
          message: message.message,
        });
        break;

      default:
        // Unknown action
        break;
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={config.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <WebViewScreen
      ref={webViewRef}
      onMessage={handleWebMessage}
      onNavigate={handleWebViewNavigate}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: config.COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: config.COLORS.TEXT_SECONDARY,
  },
});
