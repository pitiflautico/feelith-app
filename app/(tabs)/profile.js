import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import WebViewScreen from '../../src/screens/WebViewScreen';
import useAuth from '../../src/hooks/useAuth';
import config from '../../src/config/config';

/**
 * Profile Screen
 *
 * Shows the user profile/settings from the web app
 */
export default function ProfileScreen() {
  const { isLoggedIn, userToken, userId } = useAuth();
  const webViewRef = useRef(null);

  const getProfileUrl = () => {
    if (isLoggedIn && userToken) {
      return `${config.WEB_URL}/settings?mobile=1`;
    }
    return `${config.WEB_URL}`;
  };

  return (
    <View style={styles.container}>
      <WebViewScreen
        ref={webViewRef}
        url={getProfileUrl()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
