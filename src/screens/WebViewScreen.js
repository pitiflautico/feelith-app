import React, { useRef, useState, useEffect } from 'react';
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
 */
const WebViewScreen = ({ onMessage, url }) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [key, setKey] = useState(0); // Used to force re-render on retry

  const webUrl = url || config.WEB_URL;

  /**
   * Handles messages received from the web application via postMessage
   */
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

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
      />
    </SafeAreaView>
  );
};

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
