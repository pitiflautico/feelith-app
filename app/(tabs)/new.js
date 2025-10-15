import React, { useRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import WebViewScreen from '../../src/screens/WebViewScreen';
import useAuth from '../../src/hooks/useAuth';
import config from '../../src/config/config';
import { IconSymbol } from '@/components/ui/icon-symbol';

/**
 * New Mood Entry Screen
 *
 * Modal that opens when user taps the + button
 * Shows the mood entry form from the web app
 */
export default function NewMoodScreen() {
  const { isLoggedIn, userToken } = useAuth();
  const webViewRef = useRef(null);
  const router = useRouter();

  const getMoodEntryUrl = () => {
    if (isLoggedIn && userToken) {
      // This would open the mood entry modal/form in the web app
      return `${config.WEB_URL}/dashboard?mobile=1&openMoodEntry=1`;
    }
    return `${config.WEB_URL}`;
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Mood Entry</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.webViewContainer}>
          <WebViewScreen
            ref={webViewRef}
            url={getMoodEntryUrl()}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 5,
  },
  webViewContainer: {
    flex: 1,
  },
});
