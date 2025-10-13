import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from './ErrorScreen';
import config from '../config/config';

/**
 * WebViewScreen Component
 *
 * Main screen that loads the web application in a WebView.
 * Handles loading states, errors, and web-to-native communication via postMessage.
 *
 * @param {Object} props
 * @param {Function} props.onMessage - Callback for handling messages from the web app
 * @param {string} props.url - Optional custom URL (defaults to config.WEB_URL)
 * @param {Function} props.onNavigate - Optional callback to expose navigate function to parent
 */
const WebViewScreen = forwardRef(({ onMessage, url, onNavigate }, ref) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [key, setKey] = useState(0); // Used to force re-render on retry
  const [currentUrl, setCurrentUrl] = useState(url || config.WEB_URL);

  const webUrl = currentUrl;

  /**
   * Handles messages received from the web application via postMessage
   */
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      // Handle console logs from WebView
      if (message.type === '__CONSOLE_LOG__') {
        const logMessage = `[WebView JS] ${message.message}`;
        if (message.level === 'ERROR') {
          console.error(logMessage);
        } else if (message.level === 'WARN') {
          console.warn(logMessage);
        } else {
          console.log(logMessage);
        }
        return;
      }

      if (config.DEBUG) {
        console.log('[WebView] Message received:', message);
      }

      // Pass message to parent component if callback provided
      if (onMessage) {
        onMessage(message);
      }
    } catch (error) {
      console.error('[WebView] Failed to parse message:', error);
      if (config.DEBUG) {
        console.error('Raw message data:', event.nativeEvent.data);
      }
    }
  };

  /**
   * Called when WebView starts loading
   */
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    if (config.DEBUG) {
      console.log('[WebView] Loading started:', webUrl);
    }
  };

  /**
   * Called when WebView finishes loading successfully
   */
  const handleLoadEnd = () => {
    setIsLoading(false);
    if (config.DEBUG) {
      console.log('[WebView] Loading completed');
    }
  };

  /**
   * Called when WebView encounters an error
   */
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    setIsLoading(false);
    setHasError(true);
    setErrorDetails(nativeEvent.description || 'Unknown error');

    console.error('[WebView] Error occurred:', nativeEvent);
  };

  /**
   * Called when WebView encounters an HTTP error
   */
  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    const statusCode = nativeEvent.statusCode;

    // Only treat 400+ errors as failures
    if (statusCode >= 400) {
      setIsLoading(false);
      setHasError(true);
      setErrorDetails(`HTTP ${statusCode}: ${nativeEvent.description || 'Failed to load'}`);

      console.error('[WebView] HTTP Error:', nativeEvent);
    }
  };

  /**
   * Retry loading the WebView by forcing a re-render
   */
  const handleRetry = () => {
    if (config.DEBUG) {
      console.log('[WebView] Retrying...');
    }
    setHasError(false);
    setErrorDetails(null);
    setIsLoading(true);
    // Force WebView to reload by changing key
    setKey((prevKey) => prevKey + 1);
  };

  /**
   * Navigate to a new URL or path
   * Can be called from parent component or push notifications
   * Accepts both full URLs and relative paths (e.g., '/mood/new')
   */
  const navigateToUrl = (urlOrPath) => {
    if (config.DEBUG) {
      console.log('[WebView] Navigating to:', urlOrPath);
    }

    // Build full URL if it's a relative path
    let fullUrl = urlOrPath;
    if (urlOrPath.startsWith('/')) {
      // It's a relative path, prepend the base URL
      fullUrl = config.WEB_URL + urlOrPath;
      if (config.DEBUG) {
        console.log('[WebView] Converting relative path to full URL:', fullUrl);
      }
    }

    // If it's the same URL, just reload instead of changing URL
    if (fullUrl === currentUrl) {
      if (config.DEBUG) {
        console.log('[WebView] Same URL, reloading instead...');
      }
      reloadWebView();
    } else {
      // Use JavaScript injection to navigate to the new URL
      // This is more reliable than changing the source prop
      if (webViewRef.current) {
        setCurrentUrl(fullUrl);
        setIsLoading(true);
        setHasError(false);

        // Wait a tick to ensure state is updated
        setTimeout(() => {
          const js = `window.location.href = '${fullUrl}'; true;`;
          webViewRef.current.injectJavaScript(js);

          if (config.DEBUG) {
            console.log('[WebView] Navigated via JavaScript injection');
          }
        }, 100);
      } else {
        console.error('[WebView] Cannot navigate, webViewRef is null');
      }
    }
  };

  /**
   * Reload the current WebView
   */
  const reloadWebView = () => {
    if (config.DEBUG) {
      console.log('[WebView] Reloading...');
    }
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // Expose navigate and reload functions to parent via ref
  useImperativeHandle(ref, () => ({
    navigateToUrl,
    reload: reloadWebView,
  }));

  // Call onNavigate callback when component mounts to give parent access to navigate
  useEffect(() => {
    if (onNavigate) {
      onNavigate(navigateToUrl);
    }
  }, [onNavigate]);

  // Show error screen if there's an error
  if (hasError) {
    return (
      <ErrorScreen
        errorMessage={config.ERROR_MESSAGES.FAILED_TO_LOAD}
        errorDetails={errorDetails}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Show loading screen while WebView is loading */}
      {isLoading && (
        <LoadingScreen message="Loading..." />
      )}

      {/* WebView */}
      <WebView
        key={key}
        ref={webViewRef}
        source={{ uri: webUrl }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        // Inject JavaScript to ensure bridge is available and capture logs
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            // Ensure window.ReactNativeWebView is available
            if (window.ReactNativeWebView) {
              console.log('[WebView] ReactNativeWebView injected successfully');
              // Set a flag to indicate we're in the native app
              window.__RUNNING_IN_NATIVE_APP__ = true;

              // Intercept console.log to send logs to React Native
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;

              console.log = function(...args) {
                originalLog.apply(console, args);
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: '__CONSOLE_LOG__',
                    level: 'LOG',
                    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                  }));
                } catch (e) {}
              };

              console.error = function(...args) {
                originalError.apply(console, args);
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: '__CONSOLE_LOG__',
                    level: 'ERROR',
                    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                  }));
                } catch (e) {}
              };

              console.warn = function(...args) {
                originalWarn.apply(console, args);
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: '__CONSOLE_LOG__',
                    level: 'WARN',
                    message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                  }));
                } catch (e) {}
              };

              console.log('[WebView] Console interception enabled');
            } else {
              console.warn('[WebView] ReactNativeWebView not available');
            }
          })();
          true; // Required for iOS
        `}
        // Security settings
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        // Prevent file access for security
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        // iOS specific
        allowsLinkPreview={false}
        // Android specific
        mixedContentMode="compatibility"
        // Custom User-Agent to avoid Google OAuth blocking
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        // Allow third-party cookies for OAuth
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: config.COLORS.BACKGROUND,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;
