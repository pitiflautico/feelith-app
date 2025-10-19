import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * New Entry Screen (Deprecated)
 *
 * This screen is no longer used. The FAB button now navigates directly to create-mood.
 * This file is kept for backward compatibility in case there are any deep links.
 */
export default function NewEntrySelector() {
  // This screen should never be shown as the FAB button navigates directly to create-mood
  // If you see this, there's a navigation issue
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#6B7280',
  },
});
