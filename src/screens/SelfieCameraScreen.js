import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import config from '../config/config';

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
      // For now, we'll send the same photo twice
      // In the future, we can implement actual heat map processing
      if (onCapture) {
        await onCapture({
          normalPhoto: photo,
          heatMapPhoto: photo, // TODO: Apply heat map filter
        });
      }

      // Close camera after successful capture
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('[SelfieCameraScreen] Error processing photo:', error);
      Alert.alert('Error', 'Failed to process photo. Please try again.');
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
      {/* Camera Views */}
      <View style={styles.cameraContainer}>
        {/* Normal Camera View */}
        <View style={styles.cameraView}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            onCameraReady={handleCameraReady}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.viewLabel}>Normal View</Text>
            {!isCameraReady && (
              <Text style={styles.loadingText}>Loading camera...</Text>
            )}
          </View>
        </View>

        {/* Heat Map Camera View */}
        <View style={styles.cameraView}>
          <CameraView
            style={styles.camera}
            facing="front"
          />
          <View style={[styles.cameraOverlay, styles.heatMapOverlay]}>
            <Text style={styles.viewLabel}>Heat Map View</Text>
            <Text style={styles.comingSoonText}>Filter Coming Soon</Text>
          </View>
        </View>
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
  cameraContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  cameraView: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    padding: 16,
  },
  heatMapOverlay: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Temporary red tint
  },
  viewLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
