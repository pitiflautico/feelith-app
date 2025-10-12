import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import WebViewScreen from '../../src/screens/WebViewScreen';
import NotificationTestButton from '../../src/components/NotificationTestButton';
import useAuth from '../../src/hooks/useAuth';
import config from '../../src/config/config';
import { requestPermissions, registerForPushNotifications } from '../../src/services/pushService';
import { setWebViewNavigate, handleNotification, handleNotificationResponse } from '../../src/features/pushHandler';
import { registerPushToken, unregisterPushToken } from '../../src/services/pushTokenService';
import { share } from '../../src/services/sharingService';
import { getInitialURL, addDeepLinkListener, handleDeepLink } from '../../src/services/deepLinkService';

// Import notification testers in development mode
if (__DEV__) {
  require('../../src/utils/notificationTester');
}

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
          const pushToken = await registerForPushNotifications();
          if (pushToken && config.DEBUG) {
            console.log('[HomeScreen] Push token obtained:', pushToken);
            // TODO: Send pushToken to your backend here
          }
        }
      } catch (error) {
        console.error('[HomeScreen] Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    // Register notification listeners
    // This listener is called when notification is received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      if (config.DEBUG) {
        console.log('[HomeScreen] Notification received (foreground):', notification);
      }
      handleNotification(notification);
    });

    // This listener is called when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (config.DEBUG) {
        console.log('[HomeScreen] Notification tapped:', response);
      }
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
        if (config.DEBUG) {
          console.log('[HomeScreen] Cleanup error (non-critical):', error.message);
        }
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
    if (config.DEBUG) {
      console.log('[HomeScreen] WebView navigation and reload registered with push handler');
    }
  };

  /**
   * Handle messages from the web application
   * Processes authentication, sharing, and other native actions
   */
  const handleWebMessage = async (message) => {
    console.log('========================================');
    console.log('[HomeScreen] 📨 MESSAGE RECEIVED!');
    console.log('[HomeScreen] Message:', JSON.stringify(message, null, 2));
    console.log('========================================');

    // Validate message structure
    if (!message || !message.action) {
      console.warn('[HomeScreen] ⚠️ Invalid message format:', message);
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
          if (success) {
            console.log('[HomeScreen] User logged in successfully:', message.userId);

            // Register push token with backend if endpoint provided
            if (message.pushTokenEndpoint) {
              console.log('[HomeScreen] Push token endpoint provided, registering...');
              const tokenRegistered = await registerPushToken(
                message.userId,
                message.userToken,
                message.pushTokenEndpoint
              );

              if (tokenRegistered) {
                console.log('[HomeScreen] ✅ Push token registered with backend');
              } else {
                console.warn('[HomeScreen] ⚠️ Failed to register push token with backend');
              }
            } else {
              if (config.DEBUG) {
                console.log('[HomeScreen] No pushTokenEndpoint provided, skipping registration');
              }
            }
          } else {
            console.error('[HomeScreen] Failed to save login data');
          }
        } else {
          console.warn('[HomeScreen] Login message missing userId or userToken');
        }
        break;

      case 'logout':
        // Handle logout from web
        // Try to unregister push token before logout
        if (message.pushTokenEndpoint && userId && userToken) {
          if (config.DEBUG) {
            console.log('[HomeScreen] Unregistering push token before logout...');
          }
          await unregisterPushToken(userId, userToken, message.pushTokenEndpoint);
        }

        const success = await logout();
        if (success) {
          console.log('[HomeScreen] User logged out successfully');
        } else {
          console.error('[HomeScreen] Failed to logout');
        }
        break;

      case 'share':
        // Check if sharing feature is enabled
        if (!config.FEATURES.SHARING) {
          console.warn('[HomeScreen] Share blocked: feature disabled in config');
          return;
        }

        // Check if user is authenticated before allowing share
        if (!isLoggedIn) {
          console.warn('[HomeScreen] Share blocked: user not authenticated');
          return;
        }

        console.log('[HomeScreen] Share requested:', message);

        // Call sharing service with provided content
        const shareSuccess = await share({
          url: message.url,
          text: message.text,
          title: message.title,
          message: message.message,
        });

        if (shareSuccess) {
          console.log('[HomeScreen] ✅ Content shared successfully');
        } else {
          console.warn('[HomeScreen] ⚠️ Share cancelled or failed');
        }
        break;

      default:
        console.log('[HomeScreen] Unknown action:', message.action);
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
    <>
      <WebViewScreen
        ref={webViewRef}
        onMessage={handleWebMessage}
        onNavigate={handleWebViewNavigate}
      />
      <NotificationTestButton />
    </>
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
