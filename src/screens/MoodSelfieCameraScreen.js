import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import FaceDetection from '@react-native-ml-kit/face-detection';
import config from '../config/config';
import useAuth from '../hooks/useAuth';
import { createMoodEntry } from '../services/moodService';

const { width, height } = Dimensions.get('window');
const FACE_CIRCLE_SIZE = Math.min(width, height) * 0.65; // 65% of smallest dimension

/**
 * Mood Selfie Camera Screen
 *
 * Advanced selfie capture with real-time face detection and analysis:
 * - Expression analysis (happy, sad, neutral, etc.)
 * - Energy level detection (eyes open, alertness)
 * - Social context (number of faces detected)
 * - Environmental analysis (brightness)
 *
 * This data is linked to mood entries to provide objective measurements.
 */
export default function MoodSelfieCameraScreen({ onClose, onCapture, initialMood = null }) {
  // Get params from router or props
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoggedIn, userId, userToken } = useAuth();

  // Use params from router if available, otherwise use props
  const moodScore = params?.moodScore ? parseInt(params.moodScore) : (initialMood || null);
  const note = params?.note || '';
  const eventId = params?.eventId || null;

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [holdStillCountdown, setHoldStillCountdown] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [environment, setEnvironment] = useState(null); // bright, neutral, dim
  const [showAnalysis, setShowAnalysis] = useState(false); // Show after capture

  // Mock BPM for now - will be replaced with actual health data
  const [bpm, setBpm] = useState(null);

  const cameraRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const holdStillTimerRef = useRef(null);

  useEffect(() => {
    // Request camera permission on mount
    if (!permission?.granted) {
      requestPermission();
    }

    // Mock BPM generator (replace with actual health API later)
    setBpm(Math.floor(Math.random() * (100 - 60 + 1)) + 60);

    return () => {
      // Cleanup timers
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (holdStillTimerRef.current) {
        clearTimeout(holdStillTimerRef.current);
      }
    };
  }, []);

  const handleCameraReady = () => {
    setIsCameraReady(true);
    console.log('[MoodSelfieCamera] Camera is ready');

    // DISABLED: Real-time face detection to avoid shutter sounds
    // User will capture manually by pressing the button
    // startRealtimeFaceDetection();
  };

  /**
   * Start continuous face detection while camera is active
   * Detects faces every 2 seconds to guide the user
   */
  const startRealtimeFaceDetection = () => {
    analysisIntervalRef.current = setInterval(async () => {
      if (!cameraRef.current || isProcessing || isAnalyzing) return;

      try {
        setIsAnalyzing(true);

        // Take a temporary photo for analysis (medium quality for better detection)
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false,
          skipProcessing: false,
        });

        console.log('[MoodSelfieCamera] 📸 Photo taken:', photo.uri);
        console.log('[MoodSelfieCamera] 📸 Photo dimensions:', photo.width, 'x', photo.height);

        // FIX: ML Kit on iOS has issues with front camera orientation
        // We need to rotate/flip the image for ML Kit to detect faces
        console.log('[MoodSelfieCamera] 🔄 Fixing image orientation for ML Kit...');
        const fixedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            { rotate: 0 }, // Ensure correct orientation
            { flip: ImageManipulator.FlipType.Horizontal }, // Mirror for front camera
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        console.log('[MoodSelfieCamera] 📸 Fixed photo URI:', fixedPhoto.uri);
        console.log('[MoodSelfieCamera] 📸 Fixed dimensions:', fixedPhoto.width, 'x', fixedPhoto.height);

        // Try MINIMAL options first to see if ML Kit can detect at all
        console.log('[MoodSelfieCamera] 🔍 Starting ML Kit face detection with MINIMAL options...');
        const faces = await FaceDetection.detect(fixedPhoto.uri, {
          performanceMode: 'fast',
          classificationMode: 'all',
        });

        console.log('[MoodSelfieCamera] ✅ ML Kit detection complete');
        console.log('[MoodSelfieCamera] 👤 Detected faces:', faces.length);

        if (faces.length > 0) {
          console.log('[MoodSelfieCamera] 👤 First face object keys:', Object.keys(faces[0]));
          console.log('[MoodSelfieCamera] 👤 First face full data:', JSON.stringify(faces[0], null, 2));

          setFaceDetected(true);

          // Analyze first face
          const face = faces[0];
          const analysis = analyzeFace(face, faces.length);

          console.log('[MoodSelfieCamera] Face analysis:', analysis);
          setAnalysisData(analysis);
        } else {
          setFaceDetected(false);
          setAnalysisData(null);
        }

        setIsAnalyzing(false);
      } catch (error) {
        console.error('[MoodSelfieCamera] ❌ Error in realtime detection:', error);
        console.error('[MoodSelfieCamera] ❌ Error message:', error.message);
        console.error('[MoodSelfieCamera] ❌ Error stack:', error.stack);
        setIsAnalyzing(false);
        setFaceDetected(false);
        setAnalysisData(null);
      }
    }, 2000); // Check every 2 seconds
  };

  /**
   * Analyze environment brightness from EXIF data
   * Returns: 'pleasant', 'neutral', 'dim', or 'dark'
   */
  const analyzeEnvironment = () => {
    // Simple heuristic based on time of day
    const hour = new Date().getHours();

    if (hour >= 10 && hour < 16) {
      return 'pleasant';  // ☀️ Daytime: bright, pleasant
    } else if (hour >= 16 && hour < 19) {
      return 'neutral';   // 🌤️ Evening: neutral
    } else if (hour >= 19 && hour < 22) {
      return 'dim';       // 🌙 Night: dim
    } else {
      return 'dark';      // 🌑 Late night: dark
    }

    // TODO: In future, analyze actual image brightness from pixels or EXIF
  };

  /**
   * Analyze facial features to extract mood-relevant data
   */
  const analyzeFace = (face, totalFaces) => {
    // Log the raw face data to see what ML Kit is returning
    console.log('[MoodSelfieCamera] Raw face data:', {
      smilingProbability: face.smilingProbability,
      leftEyeOpenProbability: face.leftEyeOpenProbability,
      rightEyeOpenProbability: face.rightEyeOpenProbability,
      bounds: face.bounds,
    });

    // Expression analysis - Extract all available data
    const smilingProbability = face.smilingProbability !== undefined ? face.smilingProbability : 0;
    const leftEyeOpenProbability = face.leftEyeOpenProbability !== undefined ? face.leftEyeOpenProbability : 1;
    const rightEyeOpenProbability = face.rightEyeOpenProbability !== undefined ? face.rightEyeOpenProbability : 1;
    const eyesOpenAvg = (leftEyeOpenProbability + rightEyeOpenProbability) / 2;

    // Head angles (for context - head down might indicate sadness)
    const headEulerAngleX = face.headEulerAngleX || 0; // Up/down tilt
    const headEulerAngleY = face.headEulerAngleY || 0; // Left/right rotation
    const headEulerAngleZ = face.headEulerAngleZ || 0; // Side tilt

    // IMPROVED ALGORITHM: Use multiple signals for accuracy
    let expression = 'neutral';
    let expressionConfidence = 0.5;

    // 1. POSITIVE EMOTIONS (smile-based)
    if (smilingProbability > 0.7) {
      expression = 'very_happy';        // 😄 Muy alegre
      expressionConfidence = smilingProbability;
    } else if (smilingProbability > 0.45) {
      expression = 'happy';             // 😊 Alegre
      expressionConfidence = smilingProbability;
    } else if (smilingProbability > 0.25) {
      expression = 'content';           // 🙂 Contento
      expressionConfidence = smilingProbability;
    } else if (smilingProbability > 0.15) {
      expression = 'slight_smile';      // 😌 Ligera sonrisa
      expressionConfidence = smilingProbability;
    }

    // 2. NEUTRAL RANGE (15-25% smile = truly neutral)
    else if (smilingProbability >= 0.12 && smilingProbability <= 0.15) {
      expression = 'neutral';           // 😶 Neutral (rango estrecho)
      expressionConfidence = 0.6;
    }

    // 3. NEGATIVE/NEUTRAL EMOTIONS (low smile with context)
    else if (smilingProbability < 0.12) {
      // Use eyes and head angle for better classification
      const isHeadDown = headEulerAngleX < -8; // Head tilted down (sad posture)
      const isVeryTired = eyesOpenAvg < 0.4;
      const isTired = eyesOpenAvg < 0.65;

      if (isVeryTired) {
        expression = 'very_tired';      // 😴 Muy cansado (ojos cerrados)
        expressionConfidence = 1 - eyesOpenAvg;
      } else if (isTired) {
        expression = 'tired';           // 😪 Cansado
        expressionConfidence = 1 - eyesOpenAvg;
      } else if (isHeadDown && smilingProbability < 0.05) {
        expression = 'sad';             // 😢 Triste (cabeza baja + no sonrisa)
        expressionConfidence = 0.8;
      } else {
        // Serio/Neutral: sin sonrisa pero alerta, ojos abiertos
        expression = 'neutral';         // 😐 Neutral/Serio (sin sonrisa pero alerta)
        expressionConfidence = 0.75;
      }
    }

    // Fallback
    else {
      expression = 'neutral';
      expressionConfidence = 0.6;
    }

    // Energy level (based on eye openness)
    let energyLevel = 'medium';
    if (eyesOpenAvg > 0.7) {
      energyLevel = 'high';
    } else if (eyesOpenAvg < 0.3) {
      energyLevel = 'low';
    }

    // Social context
    let socialContext = 'alone';
    if (totalFaces === 2) {
      socialContext = 'with_one';
    } else if (totalFaces > 2) {
      socialContext = 'group';
    }

    const result = {
      expression,
      expressionConfidence,
      energyLevel,
      eyesOpenness: eyesOpenAvg,
      socialContext,
      totalFaces,
      rawData: {
        smilingProbability,
        leftEyeOpenProbability,
        rightEyeOpenProbability,
        headEulerAngleX,
        headEulerAngleY: face.headEulerAngleY || 0,
        headEulerAngleZ: face.headEulerAngleZ || 0,
      }
    };

    console.log('[MoodSelfieCamera] Analyzed result:', result);
    return result;
  };

  /**
   * Capture high-quality photo with full analysis
   */
  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      console.warn('[MoodSelfieCamera] Camera not ready');
      return;
    }

    if (!faceDetected) {
      console.warn('[MoodSelfieCamera] No face detected');
      // Still allow capture, but warn user
    }

    try {
      // Stop realtime detection
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }

      setIsProcessing(true);
      console.log('[MoodSelfieCamera] Starting capture with analysis...');

      // Show "hold still" message with countdown
      setHoldStillCountdown(3);
      await new Promise(resolve => {
        let count = 3;
        const timer = setInterval(() => {
          count--;
          setHoldStillCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
        holdStillTimerRef.current = timer;
      });

      // Capture high-quality photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: true,
      });

      console.log('[MoodSelfieCamera] Photo captured, analyzing...');

      // FIX: ML Kit on iOS has issues with front camera orientation
      // Flip image horizontally for ML Kit detection
      console.log('[MoodSelfieCamera] 🔄 Fixing image orientation for ML Kit...');
      const fixedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { rotate: 0 }, // Ensure correct orientation
          { flip: ImageManipulator.FlipType.Horizontal }, // Mirror for front camera
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Perform detailed face detection on high-quality image
      console.log('[MoodSelfieCamera] 🔍 Starting ML Kit face detection...');
      const faces = await FaceDetection.detect(fixedPhoto.uri, {
        performanceMode: 'accurate',
        landmarkMode: 'all',
        contourMode: 'all',
        classificationMode: 'all',
      });
      console.log('[MoodSelfieCamera] ✅ ML Kit detection complete. Faces found:', faces.length);

      let faceAnalysis = null;
      if (faces.length > 0) {
        faceAnalysis = analyzeFace(faces[0], faces.length);
        console.log('[MoodSelfieCamera] Final analysis:', faceAnalysis);
      }

      // Analyze environment
      const environmentAnalysis = analyzeEnvironment();
      console.log('[MoodSelfieCamera] Environment analysis:', environmentAnalysis);

      // Update state to show AI Analysis panel with final data
      console.log('[MoodSelfieCamera] 📊 Setting analysis data:', faceAnalysis);
      console.log('[MoodSelfieCamera] 🌍 Setting environment:', environmentAnalysis);
      setAnalysisData(faceAnalysis);
      setEnvironment(environmentAnalysis);
      setShowAnalysis(true);
      console.log('[MoodSelfieCamera] ✅ showAnalysis set to TRUE');

      // Wait 2 seconds to show the analysis before navigating
      console.log('[MoodSelfieCamera] ⏳ Waiting 2 seconds to show analysis...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[MoodSelfieCamera] ⏱ 2 seconds elapsed');

      // Compress image for upload
      console.log('[MoodSelfieCamera] Compressing image...');
      const compressedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      // Calculate environmental data
      const environmentalData = {
        brightness: environmentAnalysis,
        timestamp: new Date().toISOString(),
      };

      // Combine all analysis data
      const captureData = {
        photo: compressedPhoto,
        faceAnalysis,
        environmentalData,
        bpm,
        mood: initialMood,
      };

      console.log('[MoodSelfieCamera] Capture complete with analysis');

      setIsProcessing(false);
      setShowAnalysis(false); // Hide before navigation

      // Always navigate to confirmation screen with captured data
      await saveMoodWithAnalysis(faceAnalysis, environmentalData, compressedPhoto.uri);

      // Note: We don't close the camera here - confirmation screen will handle navigation
    } catch (error) {
      console.error('[MoodSelfieCamera] Error capturing with analysis:', error);
      setIsProcessing(false);
      setIsSaving(false);
      setHoldStillCountdown(null);

      Alert.alert('Error', 'Failed to capture selfie. Please try again.');

      // Restart realtime detection
      startRealtimeFaceDetection();
    }
  };

  /**
   * Map facial expression to mood score (1-10)
   */
  const mapExpressionToMoodScore = (expression) => {
    const expressionToMood = {
      'very_happy': 10,     // 😄 Muy alegre
      'happy': 9,           // 😊 Alegre
      'content': 7,         // 🙂 Contento
      'slight_smile': 6,    // 😌 Ligera sonrisa
      'neutral': 5,         // 😶 Neutral / Serio
      'tired': 3,           // 😪 Cansado
      'very_tired': 2,      // 😴 Muy cansado
      'sad': 1,             // 😢 Triste
    };
    return expressionToMood[expression] || 5;
  };

  /**
   * Save mood entry with face analysis data
   * Shows confirmation screen if in standalone mode (no moodScore passed)
   */
  const saveMoodWithAnalysis = async (faceAnalysis, environmentalData, photoUri) => {
    try {
      console.log('[MoodSelfieCamera] Processing captured selfie...');

      if (!isLoggedIn || !userId || !userToken) {
        Alert.alert('Not authenticated', 'Please log in to save your mood.');
        return;
      }

      // If no mood score was provided (standalone selfie mode), detect from face
      const detectedMoodScore = faceAnalysis ? mapExpressionToMoodScore(faceAnalysis.expression) : 5;

      // Navigate to confirmation screen with captured data
      router.push({
        pathname: '/mood-selfie-confirm',
        params: {
          photoUri: photoUri,
          detectedMoodScore: detectedMoodScore,
          expression: faceAnalysis?.expression || 'neutral',
          expressionConfidence: faceAnalysis?.expressionConfidence || 0,
          energyLevel: faceAnalysis?.energyLevel || 'medium',
          environment: environmentalData?.brightness || 'neutral',
          bpm: bpm || null,
          eventId: eventId || null,
          // Pass through mood data from MoodEntryScreen
          moodScore: moodScore || null,
          note: note || null,
          // Detailed ML Kit data for summary
          smilingProbability: faceAnalysis?.rawData?.smilingProbability || 0,
          leftEyeOpenProbability: faceAnalysis?.rawData?.leftEyeOpenProbability || 0,
          rightEyeOpenProbability: faceAnalysis?.rawData?.rightEyeOpenProbability || 0,
          headEulerAngleX: faceAnalysis?.rawData?.headEulerAngleX || 0,
          headEulerAngleY: faceAnalysis?.rawData?.headEulerAngleY || 0,
          headEulerAngleZ: faceAnalysis?.rawData?.headEulerAngleZ || 0,
          eyesOpenness: faceAnalysis?.eyesOpenness || 0,
          socialContext: faceAnalysis?.socialContext || 'alone',
          totalFaces: faceAnalysis?.totalFaces || 0,
        }
      });

    } catch (error) {
      console.error('[MoodSelfieCamera] Error processing selfie:', error);
      Alert.alert('Error', 'Failed to process your selfie. Please try again.');
      setIsSaving(false);
    }
  };

  /**
   * Handle close button
   */
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/');
    }
  };

  /**
   * Get mood emoji based on initial mood or detected expression
   */
  const getMoodEmoji = () => {
    const mood = moodScore || initialMood;
    if (mood) {
      if (mood <= 2) return '😢';
      if (mood <= 4) return '😕';
      if (mood <= 6) return '😐';
      if (mood <= 8) return '🙂';
      return '😊';
    }

    if (analysisData) {
      switch (analysisData.expression) {
        case 'happy': return '😊';
        case 'slight_smile': return '🙂';
        case 'tired': return '😴';
        default: return '😐';
      }
    }

    return '😐';
  };

  // Handle permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={config.COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera for mood selfies with facial analysis.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={handleCameraReady}
      />

      {/* Top Indicators */}
      <View style={styles.topIndicators}>
        {/* Mood Indicator */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorEmoji}>{getMoodEmoji()}</Text>
          <Text style={styles.indicatorLabel}>
            {moodScore ? `${moodScore}/10` : (initialMood ? `${initialMood}/10` : (analysisData?.expression || 'mood'))}
          </Text>
        </View>

        {/* Environment Indicator */}
        <View style={styles.indicator}>
          <Text style={styles.indicatorEmoji}>
            {environment === 'pleasant' ? '☀️' :
             environment === 'neutral' ? '🌤️' :
             environment === 'dim' ? '🌙' :
             environment === 'dark' ? '🌑' : '🌍'}
          </Text>
          <Text style={styles.indicatorLabel}>
            {environment || 'environment'}
          </Text>
        </View>
      </View>

      {/* Face Guide Circle */}
      <View style={styles.faceGuideContainer}>
        <View style={styles.faceGuideCircle}>
          {/* Horizontal line */}
          <View style={styles.faceGuideLine} />
        </View>
      </View>

      {/* AI Analysis Panel - Shown after capture */}
      {showAnalysis && analysisData && (
        <View style={styles.analysisPanel}>
          <Text style={styles.analysisPanelTitle}>🤖 AI Analysis</Text>
          <View style={styles.analysisRow}>
            <View style={styles.analysisBadge}>
              <Text style={styles.analysisBadgeEmoji}>
                {analysisData.expression === 'very_happy' ? '😄' :
                 analysisData.expression === 'happy' ? '😊' :
                 analysisData.expression === 'content' ? '🙂' :
                 analysisData.expression === 'slight_smile' ? '😌' :
                 analysisData.expression === 'neutral' ? '😐' :
                 analysisData.expression === 'tired' ? '😪' :
                 analysisData.expression === 'very_tired' ? '😴' :
                 analysisData.expression === 'sad' ? '😢' : '😐'}
              </Text>
              <Text style={styles.analysisBadgeLabel}>{analysisData.expression.replace('_', ' ')}</Text>
              <Text style={styles.analysisBadgeValue}>
                {(analysisData.expressionConfidence * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.analysisBadge}>
              <Text style={styles.analysisBadgeEmoji}>
                {analysisData.energyLevel === 'high' ? '⚡' :
                 analysisData.energyLevel === 'low' ? '🪫' : '🔋'}
              </Text>
              <Text style={styles.analysisBadgeLabel}>Energy</Text>
              <Text style={styles.analysisBadgeValue}>{analysisData.energyLevel}</Text>
            </View>
            <View style={styles.analysisBadge}>
              <Text style={styles.analysisBadgeEmoji}>
                {environment === 'pleasant' ? '☀️' :
                 environment === 'neutral' ? '🌤️' :
                 environment === 'dim' ? '🌙' :
                 environment === 'dark' ? '🌑' : '🌍'}
              </Text>
              <Text style={styles.analysisBadgeLabel}>Environment</Text>
              <Text style={styles.analysisBadgeValue}>{environment}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Status Message */}
      <View style={styles.statusContainer}>
        {isProcessing ? (
          <View style={styles.statusMessage}>
            <Text style={styles.statusIcon}>⏱</Text>
            <Text style={styles.statusText}>
              {holdStillCountdown !== null ? `Hold still... ${holdStillCountdown}` : 'Processing...'}
            </Text>
          </View>
        ) : !isCameraReady ? (
          <View style={styles.statusMessage}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.statusText}>Loading camera...</Text>
          </View>
        ) : (
          <View style={styles.statusMessage}>
            <Text style={styles.statusIcon}>📸</Text>
            <Text style={styles.statusText}>Ready! Tap to capture</Text>
          </View>
        )}
      </View>

      {/* Capture Button */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          disabled={isProcessing || isSaving}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            (!isCameraReady || isProcessing) && styles.captureButtonDisabled
          ]}
          onPress={handleCapture}
          disabled={!isCameraReady || isProcessing}
        >
          <View style={styles.captureButtonInner}>
            {isProcessing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonDot} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
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
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: config.COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
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
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  topIndicators: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  indicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  indicatorEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  indicatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  faceGuideContainer: {
    position: 'absolute',
    top: height * 0.2,
    left: (width - FACE_CIRCLE_SIZE) / 2,
    width: FACE_CIRCLE_SIZE,
    height: FACE_CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  faceGuideCircle: {
    width: FACE_CIRCLE_SIZE,
    height: FACE_CIRCLE_SIZE,
    borderRadius: FACE_CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideCircleDetected: {
    borderColor: 'rgba(124, 58, 237, 0.8)',
    borderWidth: 4,
  },
  faceGuideLine: {
    position: 'absolute',
    width: FACE_CIRCLE_SIZE * 0.6,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  analysisPanel: {
    position: 'absolute',
    top: height * 0.15,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    padding: 16,
    zIndex: 15,
  },
  analysisPanelTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  analysisBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  analysisBadgeEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  analysisBadgeLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  analysisBadgeValue: {
    color: '#A0AEC0',
    fontSize: 10,
    fontWeight: '500',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  statusIcon: {
    fontSize: 18,
  },
  statusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: config.COLORS.PRIMARY,
  },
  placeholder: {
    width: 50,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 12,
    borderRadius: 12,
    zIndex: 20,
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  debugTitle: {
    color: '#00FF00',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugScroll: {
    maxHeight: 250,
  },
  debugText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  debugSectionTitle: {
    color: '#00FF00',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  debugJsonText: {
    color: '#FFD700',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  debugWarning: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  debugSuccess: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 6,
  },
});
