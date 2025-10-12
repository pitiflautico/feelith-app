import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import config from '../config/config';

/**
 * ErrorScreen Component
 *
 * Displays a native error screen when the WebView fails to load.
 * Provides clear error messaging and a retry button for user recovery.
 *
 * @param {Object} props
 * @param {string} props.errorMessage - The error message to display
 * @param {Function} props.onRetry - Callback function when retry button is pressed
 * @param {string} props.errorDetails - Optional detailed error info (only shown in dev mode)
 */
const ErrorScreen = ({ errorMessage, onRetry, errorDetails }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>

        {/* Error Title */}
        <Text style={styles.title}>Oops!</Text>

        {/* Error Message */}
        <Text style={styles.message}>
          {errorMessage || config.ERROR_MESSAGES.FAILED_TO_LOAD}
        </Text>

        {/* Detailed Error (Dev Only) */}
        {config.SHOW_DEV_ERRORS && errorDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsLabel}>Error Details (Dev Only):</Text>
            <Text style={styles.detailsText}>{errorDetails}</Text>
          </View>
        )}

        {/* Retry Button */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        {/* Help Text */}
        <Text style={styles.helpText}>
          If the problem persists, please check your internet connection
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: config.COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconText: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: config.COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: config.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: config.COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  detailsText: {
    fontSize: 11,
    color: config.COLORS.ERROR,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: config.COLORS.PRIMARY,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: config.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ErrorScreen;
