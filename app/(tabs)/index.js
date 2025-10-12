import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import WebViewScreen from '../../src/screens/WebViewScreen';
import useAuth from '../../src/hooks/useAuth';
import config from '../../src/config/config';

/**
 * Main Home Screen
 *
 * Renders the WebView as the primary interface of the app.
 * Handles web-to-native communication and authentication.
 */
export default function HomeScreen() {
  const { isLoggedIn, isLoading, login, logout } = useAuth();

  /**
   * Handle messages from the web application
   * Processes authentication, sharing, and other native actions
   */
  const handleWebMessage = async (message) => {
    console.log('[HomeScreen] Received message from web:', message);

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
          const success = await login(message.userId, message.userToken);
          if (success) {
            console.log('[HomeScreen] User logged in successfully:', message.userId);
          } else {
            console.error('[HomeScreen] Failed to save login data');
          }
        } else {
          console.warn('[HomeScreen] Login message missing userId or userToken');
        }
        break;

      case 'logout':
        // Handle logout from web
        const success = await logout();
        if (success) {
          console.log('[HomeScreen] User logged out successfully');
        } else {
          console.error('[HomeScreen] Failed to logout');
        }
        break;

      case 'share':
        // Check if user is authenticated before allowing share
        if (!isLoggedIn) {
          console.warn('[HomeScreen] Share blocked: user not authenticated');
          return;
        }
        console.log('[HomeScreen] Share requested:', message);
        // TODO: Handle sharing in Phase 5
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

  return <WebViewScreen onMessage={handleWebMessage} />;
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
