import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '../../src/hooks/useAuth';
import { IconSymbol } from '@/components/ui/icon-symbol';
import config from '../../src/config/config';

/**
 * New Entry Selector Screen
 *
 * Modal that opens when user taps the + button
 * Shows options to create a new mood or take a selfie
 */
export default function NewEntrySelector() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const handleClose = () => {
    console.log('[NewEntrySelector] Closing selector, navigating to home');
    // Navigate back to the previous tab (index/home)
    router.replace('/(tabs)/');
  };

  const handleMoodEntry = () => {
    console.log('[NewEntrySelector] Mood entry selected, navigating to native create-mood screen');
    // Navigate to native mood creation screen
    router.push('/(tabs)/create-mood');
  };

  const handleSelfieEntry = () => {
    // TODO: Open selfie camera
    // For now, just close the modal
    console.log('[NewEntrySelector] Selfie option selected');
    handleClose();
  };

  if (!isLoggedIn) {
    handleClose();
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Backdrop - doesn't cover tab bar area */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Bottom spacer with app background color */}
      <View style={styles.bottomSpacer} />

      {/* Modal Content */}
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Mood Entry Option */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleMoodEntry}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, styles.moodIconBg]}>
              <IconSymbol name="face.smiling" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>New Mood</Text>
              <Text style={styles.optionDescription}>Track how you're feeling</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Selfie Option */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={handleSelfieEntry}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, styles.selfieIconBg]}>
              <IconSymbol name="camera.fill" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>New Selfie</Text>
              <Text style={styles.optionDescription}>Capture your moment</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: config.LAYOUT.MODAL_BOTTOM_MARGIN,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSpacer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: config.LAYOUT.MODAL_BOTTOM_MARGIN,
    backgroundColor: config.COLORS.BACKGROUND,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    // Leave space for the floating tab bar
    marginBottom: config.LAYOUT.MODAL_BOTTOM_MARGIN,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  moodIconBg: {
    backgroundColor: '#92400E', // Amber/brown color
  },
  selfieIconBg: {
    backgroundColor: '#7C3AED', // Purple color
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
