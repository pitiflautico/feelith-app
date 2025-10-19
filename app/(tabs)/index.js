import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import WebViewScreen from '../../src/screens/WebViewScreen';
import SelfieCameraScreen from '../../src/screens/SelfieCameraScreen';
// FloatingActionButton removed - now using tab bar center button
import useAuth from '../../src/hooks/useAuth';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import config from '../../src/config/config';
import { requestPermissions, registerForPushNotifications } from '../../src/services/pushService';
import { setWebViewNavigate, handleNotification, handleNotificationResponse } from '../../src/features/pushHandler';
import { registerPushToken, unregisterPushToken } from '../../src/services/pushTokenService';
import { share } from '../../src/services/sharingService';
import { getInitialURL, addDeepLinkListener, handleDeepLink } from '../../src/services/deepLinkService';
import tabEvents, { TAB_EVENTS } from '../../src/events/tabEvents';

/**
 * Main Home Screen
 *
 * Renders the WebView as the primary interface of the app.
 * Handles web-to-native communication and authentication.
 */
export default function HomeScreen() {
  const { isLoggedIn, userId, userToken, isLoading, login, logout } = useAuth();
  const { isOnboarding, setIsOnboarding } = useOnboarding();
  const route = useRoute();
  const notificationListener = useRef();
  const responseListener = useRef();
  const deepLinkListener = useRef();
  const [webViewNavigate, setWebViewNavigateState] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const pendingInitialUrl = useRef(null);
  const [webViewKey, setWebViewKey] = useState(0);

  // Debug: Log auth state changes
  useEffect(() => {
    console.log('[HomeScreen] 🔵 Auth state changed:', {
      isLoggedIn,
      userId,
      hasToken: !!userToken,
      isLoading
    });
  }, [isLoggedIn, userId, userToken, isLoading]);

  /**
   * Handle navigation params from tab bar
   * When forceReload is true, completely reload the WebView
   */
  useEffect(() => {
    const params = route.params || {};
    if (params.forceReload && params.initialUrl) {
      console.log('[HomeScreen] 🔄 Force reloading WebView with URL:', params.initialUrl);
      // Increment key to force WebView remount (complete reload)
      setWebViewKey((prev) => prev + 1);
    }
  }, [route.params]);

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

        // Check if app was opened by tapping a notification (when app was killed)
        const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastNotificationResponse) {
          console.log('[HomeScreen] App opened from notification (killed state)');
          console.log('[HomeScreen] Last notification response:', lastNotificationResponse);
          // Small delay to ensure app is ready
          setTimeout(() => {
            handleNotificationResponse(lastNotificationResponse);
          }, 500);
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
        if (initialUrl) {
          console.log('[HomeScreen] Initial URL detected:', initialUrl);
          pendingInitialUrl.current = initialUrl;

          // If WebView is already ready, handle immediately
          if (webViewReady && webViewRef.current && webViewRef.current.navigateToUrl) {
            const navigateFn = webViewRef.current.navigateToUrl;
            console.log('[HomeScreen] WebView ready, handling initial URL immediately');
            handleDeepLink(initialUrl, navigateFn);
            pendingInitialUrl.current = null;
          } else {
            console.log('[HomeScreen] WebView not ready yet, URL will be processed when ready');
          }
        }
      } catch (error) {
        console.error('[HomeScreen] Error handling initial URL:', error);
      }
    };

    // Handle URL when app is already open
    deepLinkListener.current = addDeepLinkListener((url) => {
      if (webViewRef.current && webViewRef.current.navigateToUrl) {
        const navigateFn = webViewRef.current.navigateToUrl;
        handleDeepLink(url, navigateFn);
      } else {
        console.warn('[HomeScreen] Deep link received but WebView is not ready:', url);
      }
    });

    // Check for initial URL immediately
    handleInitialURL();

    // Cleanup
    return () => {
      if (deepLinkListener.current && typeof deepLinkListener.current.remove === 'function') {
        deepLinkListener.current.remove();
      }
    };
  }, []);

  /**
   * Handle WebView ready state
   * Process any pending deep links when WebView becomes ready
   */
  useEffect(() => {
    if (webViewReady && pendingInitialUrl.current && webViewRef.current && webViewRef.current.navigateToUrl) {
      const navigateFn = webViewRef.current.navigateToUrl;
      console.log('[HomeScreen] WebView ready, processing pending URL:', pendingInitialUrl.current);
      handleDeepLink(pendingInitialUrl.current, navigateFn);
      pendingInitialUrl.current = null;
    }
  }, [webViewReady]);

  /**
   * Handle WebView ready callback
   */
  const handleWebViewReady = () => {
    console.log('[HomeScreen] WebView is ready');
    setWebViewReady(true);
  };

  /**
   * Keep event listener for calendar-events (used by See All link in dashboard)
   */
  useEffect(() => {
    const handleCalendarEventsPressed = () => {
      console.log('[HomeScreen] Calendar events pressed, navigating to calendar events URL');
      if (webViewRef.current?.navigateToUrl) {
        const calendarEventsUrl = isLoggedIn && userToken
          ? `${config.WEB_URL}/calendar-events?mobile=1`
          : `${config.WEB_URL}/calendar-events`;
        webViewRef.current.navigateToUrl(calendarEventsUrl);
      }
    };

    tabEvents.on(TAB_EVENTS.CALENDAR_EVENTS_PRESSED, handleCalendarEventsPressed);

    return () => {
      tabEvents.off(TAB_EVENTS.CALENDAR_EVENTS_PRESSED, handleCalendarEventsPressed);
    };
  }, [isLoggedIn, userToken]);

  /**
   * Handle WebView navigation function registration
   * This allows push notifications to navigate the WebView
   */
  const webViewRef = useRef(null);

  const handleWebViewNavigate = useCallback((navigateFn) => {
    // Get reload function from WebView ref
    const reloadFn = webViewRef.current?.reload;
    setWebViewNavigate(navigateFn, reloadFn);
    // Store navigate function for FAB
    setWebViewNavigateState(() => navigateFn);
  }, []); // Empty dependency array - function doesn't depend on anything

  /**
   * Handle messages from the web application
   * Processes authentication, sharing, and other native actions
   */
  const handleWebMessage = async (message) => {
    console.log('[HomeScreen] 🔵 Message received from WebView:', message);

    // Validate message structure
    if (!message || !message.action) {
      console.warn('[HomeScreen] ⚠️ Invalid message format:', message);
      return;
    }

    console.log('[HomeScreen] 🔵 Processing action:', message.action);

    // Handle different message types
    switch (message.action) {
      case 'loginSuccess':
        console.log('[HomeScreen] 🟢 Login success message received');
        console.log('[HomeScreen] 🔵 User ID:', message.userId);
        console.log('[HomeScreen] 🔵 Has token:', !!message.userToken);
        console.log('[HomeScreen] 🔵 Push endpoint:', message.pushTokenEndpoint);

        // Handle authentication from web
        if (message.userId && message.userToken) {
          const success = await login(
            message.userId,
            message.userToken,
            message.pushTokenEndpoint
          );

          console.log('[HomeScreen] 🔵 Login result:', success ? 'SUCCESS' : 'FAILED');

          if (success) {
            if (message.pushTokenEndpoint) {
              console.log('[HomeScreen] 🔵 Registering push token...');
              // Register push token with backend if endpoint provided
              await registerPushToken(
                message.userId,
                message.userToken,
                message.pushTokenEndpoint
              );
            }

            // Reload WebView to establish session with the new token
            console.log('[HomeScreen] 🔵 Reloading WebView to establish session...');
            if (webViewRef.current && webViewRef.current.navigateToUrl) {
              const sessionUrl = `${config.WEB_URL}/auth/session?token=${message.userToken}`;
              webViewRef.current.navigateToUrl(sessionUrl);
            }
          }
        } else {
          console.error('[HomeScreen] ❌ Missing userId or userToken');
        }
        break;

      case 'logout':
        console.log('[HomeScreen] 🔴 Logout message received');
        // Handle logout from web
        // Try to unregister push token before logout
        if (message.pushTokenEndpoint && userId && userToken) {
          console.log('[HomeScreen] 🔵 Unregistering push token...');
          await unregisterPushToken(userId, userToken, message.pushTokenEndpoint);
        }
        await logout();
        console.log('[HomeScreen] 🔴 Logout complete');
        break;

      case 'share':
        console.log('[HomeScreen] 🔵 Share message received');
        // Check if sharing feature is enabled
        if (!config.FEATURES.SHARING || !isLoggedIn) {
          console.warn('[HomeScreen] ⚠️ Sharing not enabled or not logged in');
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
        console.warn('[HomeScreen] ⚠️ Unknown action:', message.action);
        break;
    }
  };

  /**
   * Handle opening camera
   */
  const handleCameraOpen = () => {
    setCameraOpen(true);
  };

  /**
   * Handle closing camera
   */
  const handleCameraClose = () => {
    setCameraOpen(false);
  };

  /**
   * Handle photo capture from camera
   */
  const handlePhotoCapture = async (photos) => {
    try {
      console.log('[HomeScreen] Photos captured:', photos);

      // TODO: Send photos to backend
      // For now, just log them
      // In the future, we'll create an API endpoint to upload these

      // Close camera
      setCameraOpen(false);
    } catch (error) {
      console.error('[HomeScreen] Error handling photo capture:', error);
    }
  };

  /**
   * Handle URL change from WebView
   * Detects if user is on onboarding screen
   */
  const handleUrlChange = (url) => {
    const isOnboardingPage = url && url.includes('/onboarding');
    console.log('[HomeScreen] URL changed:', url, '- Is onboarding:', isOnboardingPage);
    setIsOnboarding(isOnboardingPage);
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

  // Determine the initial URL based on login state and route params
  const getInitialUrl = () => {
    const params = route.params || {};

    // If forceReload with initialUrl, use that URL with session params if logged in
    if (params.forceReload && params.initialUrl) {
      const targetUrl = `${config.WEB_URL}${params.initialUrl}`;
      if (isLoggedIn && userToken) {
        return `${targetUrl}${params.initialUrl.includes('?') ? '&' : '?'}mobile=1`;
      }
      return targetUrl;
    }

    // Default behavior
    if (isLoggedIn && userToken) {
      // If logged in, load session establishment URL
      return `${config.WEB_URL}/auth/session?token=${userToken}`;
    }
    // Not logged in, load normal home page
    return config.WEB_URL;
  };

  return (
    <View style={styles.container}>
      <WebViewScreen
        key={webViewKey}
        ref={webViewRef}
        url={getInitialUrl()}
        onMessage={handleWebMessage}
        onNavigate={handleWebViewNavigate}
        onReady={handleWebViewReady}
        onUrlChange={handleUrlChange}
      />

      {/* Camera Modal */}
      <Modal
        visible={cameraOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCameraClose}
      >
        <SelfieCameraScreen
          onClose={handleCameraClose}
          onCapture={handlePhotoCapture}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
