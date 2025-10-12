import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import config from '../config/config';
import { scheduleLocalNotification } from '../services/pushService';

/**
 * NotificationTestButton Component
 *
 * Debug component to test push notifications
 * Only visible in DEBUG mode
 */
const NotificationTestButton = () => {
  if (!config.DEBUG) {
    return null;
  }

  const testUrlNotification = async () => {
    const id = await scheduleLocalNotification(
      'Navigate to Calendar',
      'Tap to open your calendar',
      {
        type: 'url',
        url: 'https://feelith.com/calendar',
      },
      3
    );
    console.log('[NotificationTest] URL notification scheduled, ID:', id);
    Alert.alert('✅ Test Scheduled', 'Wait 3 seconds... then tap the notification to go to calendar!');
  };

  const testNativeAction = async () => {
    const id = await scheduleLocalNotification(
      'Native Action',
      'Tap to refresh',
      {
        type: 'nativeAction',
        action: 'refresh',
      },
      3
    );
    console.log('[NotificationTest] Native action notification scheduled, ID:', id);
    Alert.alert('✅ Test Scheduled', 'Wait 3 seconds... then tap the notification to refresh!');
  };

  const testBackground = async () => {
    const id = await scheduleLocalNotification(
      'Background Test',
      'Close the app now!',
      {
        type: 'url',
        url: 'https://feelith.com/calendar',
      },
      7
    );
    console.log('[NotificationTest] Background notification scheduled, ID:', id);
    Alert.alert('✅ Test Scheduled', 'You have 7 seconds to close the app! Then tap the notification to open calendar.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 PUSH NOTIFICATIONS TEST</Text>

      <TouchableOpacity style={styles.button} onPress={testUrlNotification}>
        <Text style={styles.buttonText}>Test URL Navigation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={testNativeAction}>
        <Text style={styles.buttonText}>Test Native Action</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonWarning]} onPress={testBackground}>
        <Text style={styles.buttonText}>Test Background (7s to close)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9500',
    padding: 16,
    gap: 10,
    zIndex: 9999,
  },
  title: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#007AFF',
  },
  buttonWarning: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NotificationTestButton;
