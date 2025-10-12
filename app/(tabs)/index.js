import React from 'react';
import WebViewScreen from '../../src/screens/WebViewScreen';

/**
 * Main Home Screen
 *
 * Renders the WebView as the primary interface of the app.
 * All web-to-native communication will be handled here.
 */
export default function HomeScreen() {
  /**
   * Handle messages from the web application
   * This will be expanded later to handle authentication, sharing, etc.
   */
  const handleWebMessage = (message) => {
    console.log('[HomeScreen] Received message from web:', message);

    // Handle different message types
    switch (message.action) {
      case 'loginSuccess':
        console.log('User logged in:', message);
        // TODO: Handle authentication in Phase 3
        break;

      case 'logout':
        console.log('User logged out');
        // TODO: Handle logout in Phase 3
        break;

      case 'share':
        console.log('Share requested:', message);
        // TODO: Handle sharing in Phase 5
        break;

      default:
        console.log('Unknown action:', message.action);
    }
  };

  return <WebViewScreen onMessage={handleWebMessage} />;
}
