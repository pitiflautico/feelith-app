import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import WebViewScreen from '../../src/screens/WebViewScreen';
import useAuth from '../../src/hooks/useAuth';
import config from '../../src/config/config';

/**
 * Calendar/Mood History Screen
 *
 * Shows the mood history from the web app
 */
export default function CalendarScreen() {
  const { isLoggedIn, userToken } = useAuth();
  const webViewRef = useRef(null);

  const getCalendarUrl = () => {
    if (isLoggedIn && userToken) {
      return `${config.WEB_URL}/mood-history?mobile=1`;
    }
    return `${config.WEB_URL}/mood-history`;
  };

  return (
    <View style={styles.container}>
      <WebViewScreen
        ref={webViewRef}
        url={getCalendarUrl()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
