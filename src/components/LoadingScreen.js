import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import config from '../config/config';

/**
 * LoadingScreen Component
 *
 * Displays a loading indicator while the WebView is loading.
 * Can be used as a splash screen or overlay during loading states.
 *
 * @param {Object} props
 * @param {string} props.message - Optional loading message to display
 * @param {string} props.size - Size of the activity indicator ('small' | 'large')
 */
const LoadingScreen = ({ message, size = 'large' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={config.COLORS.PRIMARY} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: config.COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: config.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default LoadingScreen;
