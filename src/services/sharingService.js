import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import config from '../config/config';

/**
 * Sharing Service
 *
 * Handles native sharing functionality using expo-sharing.
 * Allows sharing URLs, text, and content from the web application
 * to other apps on the device.
 */

/**
 * Check if sharing is available on this device
 *
 * @returns {Promise<boolean>} True if sharing is available
 */
export const isSharingAvailable = async () => {
  try {
    return await Sharing.isAvailableAsync();
  } catch (error) {
    console.error('[SharingService] Error checking sharing availability:', error);
    return false;
  }
};

/**
 * Share a URL with title and optional message
 *
 * @param {Object} params - Sharing parameters
 * @param {string} params.url - The URL to share (required)
 * @param {string} [params.title] - Title for the share dialog
 * @param {string} [params.message] - Additional message to include
 * @returns {Promise<boolean>} Success status
 */
export const shareUrl = async ({ url, title, message }) => {
  try {
    // Check if feature is enabled
    if (!config.FEATURES.SHARING) {
      console.warn('[SharingService] Sharing feature is disabled in config');
      return false;
    }

    // Validate URL
    if (!url || typeof url !== 'string') {
      console.error('[SharingService] Invalid URL provided:', url);
      return false;
    }

    // Check if sharing is available
    const available = await isSharingAvailable();
    if (!available) {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not available on this device'
      );
      return false;
    }

    if (config.DEBUG) {
      console.log('[SharingService] Sharing URL:', { url, title, message });
    }

    // On iOS/Android, we use the Share API for URLs
    // expo-sharing is better for files, but for URLs we can use React Native's Share
    const { Share } = require('react-native');

    const shareContent = {
      url: url,
    };

    if (title) {
      shareContent.title = title;
    }

    if (message) {
      shareContent.message = message;
    }

    const result = await Share.share(shareContent);

    if (config.DEBUG) {
      console.log('[SharingService] Share result:', result);
    }

    return result.action !== Share.dismissedAction;

  } catch (error) {
    console.error('[SharingService] Error sharing URL:', error);
    Alert.alert(
      'Sharing Error',
      'Failed to share content. Please try again.'
    );
    return false;
  }
};

/**
 * Share text content
 *
 * @param {Object} params - Sharing parameters
 * @param {string} params.text - The text to share (required)
 * @param {string} [params.title] - Title for the share dialog
 * @returns {Promise<boolean>} Success status
 */
export const shareText = async ({ text, title }) => {
  try {
    // Check if feature is enabled
    if (!config.FEATURES.SHARING) {
      console.warn('[SharingService] Sharing feature is disabled in config');
      return false;
    }

    // Validate text
    if (!text || typeof text !== 'string') {
      console.error('[SharingService] Invalid text provided:', text);
      return false;
    }

    if (config.DEBUG) {
      console.log('[SharingService] Sharing text:', { text, title });
    }

    const { Share } = require('react-native');

    const shareContent = {
      message: text,
    };

    if (title && Platform.OS === 'ios') {
      // Title is only supported on iOS
      shareContent.title = title;
    }

    const result = await Share.share(shareContent);

    if (config.DEBUG) {
      console.log('[SharingService] Share result:', result);
    }

    return result.action !== Share.dismissedAction;

  } catch (error) {
    console.error('[SharingService] Error sharing text:', error);
    Alert.alert(
      'Sharing Error',
      'Failed to share content. Please try again.'
    );
    return false;
  }
};

/**
 * Generic share handler that determines the best sharing method
 * based on the content provided
 *
 * @param {Object} params - Sharing parameters
 * @param {string} [params.url] - URL to share
 * @param {string} [params.text] - Text to share
 * @param {string} [params.title] - Title for the share dialog
 * @param {string} [params.message] - Additional message
 * @returns {Promise<boolean>} Success status
 */
export const share = async ({ url, text, title, message }) => {
  try {
    // If URL is provided, share as URL
    if (url) {
      return await shareUrl({ url, title, message });
    }

    // Otherwise share as text
    if (text) {
      return await shareText({ text, title });
    }

    console.error('[SharingService] No content provided to share');
    return false;

  } catch (error) {
    console.error('[SharingService] Error in generic share:', error);
    return false;
  }
};

export default {
  isSharingAvailable,
  shareUrl,
  shareText,
  share,
};
