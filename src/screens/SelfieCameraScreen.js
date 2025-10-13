import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import config from '../config/config';
import { uploadSelfie } from '../services/selfieService';

/**
 * Selfie Camera Screen
 *
 * Captures selfies with two views:
 * 1. Normal camera view
 * 2. Heat map filtered view
 */
export default function SelfieCameraScreen({ onClose, onCapture }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Request camera permission on mount
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleCameraReady = () => {
    setIsCameraReady(true);
    console.log('[SelfieCameraScreen] Camera is ready');
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      console.warn('[SelfieCameraScreen] Camera ref is null');
      return;
    }

    if (!isCameraReady) {
      console.warn('[SelfieCameraScreen] Camera is not ready yet');
      Alert.alert('Please wait', 'Camera is still loading...');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[SelfieCameraScreen] Taking picture...');

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      console.log('[SelfieCameraScreen] Photo captured:', photo.uri);
      setCapturedPhoto(photo);
      setIsProcessing(false);

      // Process and send both versions (normal and heat map)
      await processAndSendPhoto(photo);
    } catch (error) {
      console.error('[SelfieCameraScreen] Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsProcessing(false);
    }
  };

  const processAndSendPhoto = async (photo) => {
    try {
      console.log('[SelfieCameraScreen] Compressing photo...');

      // Compress image to maximum (for analysis only)
      // Target: ~50-100KB per image
      const compressedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { resize: { width: 640 } }, // Resize to max width 640px
        ],
        {
          compress: 0.3, // 30% quality (good enough for facial analysis)
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      console.log('[SelfieCameraScreen] Photo compressed');
      console.log('[SelfieCameraScreen] Original size:', photo.uri.length, 'chars');
      console.log('[SelfieCameraScreen] Compressed size:', compressedPhoto.base64?.length || 0, 'chars');

      // Upload to server
      console.log('[SelfieCameraScreen] Uploading to server...');
      const result = await uploadSelfie(
        compressedPhoto.uri,
        compressedPhoto.base64,
        null // No mood entry ID for now
      );

      console.log('[SelfieCameraScreen] ✅ Upload successful:', result.url);
      Alert.alert('Success', 'Selfie uploaded successfully!');

      // Call onCapture callback if provided
      if (onCapture) {
        await onCapture({
          normalPhoto: compressedPhoto,
          serverResponse: result,
        });
      }

      // Close camera after successful upload
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('[SelfieCameraScreen] Error processing photo:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo. Please try again.');
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  // Handle permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take selfies for mood tracking.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Single Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={handleCameraReady}
      />

      {/* Overlay with status */}
      <View style={styles.statusOverlay}>
        <Text style={styles.statusText}>
          {!isCameraReady ? '⏳ Loading camera...' : '✓ Camera ready'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, (isProcessing || !isCameraReady) && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isProcessing || !isCameraReady}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: config.COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#ccc',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  statusOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#000',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: config.COLORS.PRIMARY,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: config.COLORS.PRIMARY,
  },
  placeholder: {
    width: 44,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
