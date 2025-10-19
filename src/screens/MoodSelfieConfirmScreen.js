import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import useAuth from '../hooks/useAuth';
import { createMoodEntry } from '../services/moodService';
import config from '../config/config';

/**
 * MoodSelfieConfirmScreen
 *
 * Confirmation screen after capturing a mood selfie
 * Shows:
 * - Captured selfie
 * - Detected mood score (from facial expression analysis)
 * - Analysis results (expression, energy, BPM)
 * - Mood score slider (user can adjust)
 * - Note input field
 * - Save button
 */
export default function MoodSelfieConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isLoggedIn, userId, userToken } = useAuth();

  // Get params from navigation
  const photoUri = params?.photoUri;
  const detectedMoodScore = parseInt(params?.detectedMoodScore) || 5;
  const expression = params?.expression || 'neutral';
  const expressionConfidence = parseFloat(params?.expressionConfidence) || 0;
  const energyLevel = params?.energyLevel || 'medium';
  const environment = params?.environment || 'neutral';
  const bpm = params?.bpm ? parseInt(params.bpm) : null;
  const eventId = params?.eventId || null;

  // Mood data from MoodEntryScreen (if user came from there)
  const entryMoodScore = params?.moodScore ? parseInt(params.moodScore) : null;
  const entryNote = params?.note || '';

  // ML Kit detailed data
  const smilingProbability = parseFloat(params?.smilingProbability) || 0;
  const leftEyeOpenProbability = parseFloat(params?.leftEyeOpenProbability) || 0;
  const rightEyeOpenProbability = parseFloat(params?.rightEyeOpenProbability) || 0;
  const headEulerAngleX = parseFloat(params?.headEulerAngleX) || 0;
  const headEulerAngleY = parseFloat(params?.headEulerAngleY) || 0;
  const eyesOpenness = parseFloat(params?.eyesOpenness) || 0;
  const socialContext = params?.socialContext || 'alone';
  const totalFaces = parseInt(params?.totalFaces) || 0;

  // State - prioritize user's manually selected mood over AI detection
  const [moodScore, setMoodScore] = useState(entryMoodScore || detectedMoodScore);
  const [note, setNote] = useState(entryNote);
  const [isSaving, setIsSaving] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  /**
   * Get mood emoji based on score
   */
  const getMoodEmoji = (score) => {
    if (score <= 2) return '😢';
    if (score <= 4) return '😕';
    if (score <= 6) return '😐';
    if (score <= 8) return '🙂';
    return '😊';
  };

  /**
   * Get mood name based on score
   */
  const getMoodName = (score) => {
    if (score <= 2) return 'Very Sad';
    if (score <= 4) return 'Sad';
    if (score <= 6) return 'Neutral';
    if (score <= 8) return 'Happy';
    return 'Very Happy';
  };

  /**
   * Get expression emoji
   */
  const getExpressionEmoji = (expr) => {
    const expressionEmojis = {
      'very_happy': '😄',
      'happy': '😊',
      'content': '🙂',
      'slight_smile': '😌',
      'neutral': '😐',      // 😐 Neutral/Serio
      'serious': '😐',      // 😐 Neutral/Serio (same as neutral)
      'tired': '😪',
      'very_tired': '😴',
      'sad': '😢',
    };
    return expressionEmojis[expr] || '😐';
  };

  /**
   * Get energy level emoji
   */
  const getEnergyEmoji = (level) => {
    const energyEmojis = {
      'high': '⚡',
      'medium': '🔋',
      'low': '🪫',
    };
    return energyEmojis[level] || '🔋';
  };

  /**
   * Get environment emoji
   */
  const getEnvironmentEmoji = (env) => {
    const environmentEmojis = {
      'pleasant': '☀️',
      'neutral': '🌤️',
      'dim': '🌙',
      'dark': '🌑',
    };
    return environmentEmojis[env] || '🌍';
  };

  /**
   * Navigate to tag selector with mood and selfie data
   */
  const handleSave = () => {
    if (!isLoggedIn || !userId || !userToken) {
      Alert.alert('Not authenticated', 'Please log in to save your mood.');
      return;
    }

    console.log('[MoodSelfieConfirm] Proceeding to tag selector...');

    // Navigate to tag selector with all mood and selfie data
    router.push({
      pathname: '/mood-tag-selector',
      params: {
        moodScore: moodScore,
        note: note.trim() || null,
        eventId: eventId || null,
        // Selfie data
        selfiePhotoPath: photoUri || null,
        selfieTakenAt: new Date().toISOString(),
        // Face analysis data
        faceExpression: expression,
        faceExpressionConfidence: expressionConfidence,
        faceEnergyLevel: energyLevel,
        faceEyesOpenness: eyesOpenness,
        faceSocialContext: socialContext,
        faceTotalFaces: totalFaces,
        bpm: bpm || null,
        environmentBrightness: environment,
        // Raw ML Kit data (as JSON string)
        faceAnalysisRaw: JSON.stringify({
          smilingProbability,
          leftEyeOpenProbability,
          rightEyeOpenProbability,
          headEulerAngleX,
          headEulerAngleY,
        }),
      }
    });
  };

  /**
   * Handle retake photo
   */
  const handleRetake = () => {
    // If we have mood data from entry screen, pass it back to camera
    if (entryMoodScore || entryNote) {
      router.replace({
        pathname: '/mood-selfie-camera',
        params: {
          moodScore: entryMoodScore || null,
          note: note || null,
          eventId: eventId || null,
        }
      });
    } else {
      router.back();
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.replace('/(tabs)/');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Your Mood</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Selfie Preview */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <IconSymbol name="camera.rotate" size={20} color="#FFF" />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>

        {/* Analysis Results */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>📊 AI Analysis Results</Text>

          <View style={styles.analysisGrid}>
            {/* Detected Expression */}
            <View style={styles.analysisCard}>
              <Text style={styles.analysisEmoji}>{getExpressionEmoji(expression)}</Text>
              <Text style={styles.analysisLabel}>Expression</Text>
              <Text style={styles.analysisValue}>{expression}</Text>
              <Text style={styles.analysisConfidence}>
                {(expressionConfidence * 100).toFixed(0)}% confident
              </Text>
            </View>

            {/* Energy Level */}
            <View style={styles.analysisCard}>
              <Text style={styles.analysisEmoji}>{getEnergyEmoji(energyLevel)}</Text>
              <Text style={styles.analysisLabel}>Energy</Text>
              <Text style={styles.analysisValue}>{energyLevel}</Text>
            </View>

            {/* Environment */}
            <View style={styles.analysisCard}>
              <Text style={styles.analysisEmoji}>{getEnvironmentEmoji(environment)}</Text>
              <Text style={styles.analysisLabel}>Environment</Text>
              <Text style={styles.analysisValue}>{environment}</Text>
            </View>
          </View>
        </View>

        {/* Detected Mood */}
        <View style={styles.detectedMoodSection}>
          <Text style={styles.sectionTitle}>AI Detected Mood</Text>
          <View style={styles.detectedMoodDisplay}>
            <Text style={styles.detectedMoodEmoji}>{getMoodEmoji(detectedMoodScore)}</Text>
            <Text style={styles.detectedMoodScore}>{detectedMoodScore}/10</Text>
            <Text style={styles.detectedMoodName}>{getMoodName(detectedMoodScore)}</Text>
          </View>
        </View>

        {/* Mood Adjustment */}
        <View style={styles.adjustmentSection}>
          <Text style={styles.sectionTitle}>Adjust Your Mood (Optional)</Text>
          <View style={styles.moodSliderContainer}>
            <View style={styles.moodSliderHeader}>
              <Text style={styles.currentMoodEmoji}>{getMoodEmoji(moodScore)}</Text>
              <Text style={styles.currentMoodScore}>{moodScore}/10</Text>
              <Text style={styles.currentMoodName}>{getMoodName(moodScore)}</Text>
            </View>

            {/* Simple mood selector buttons */}
            <View style={styles.moodButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.moodNumberButton,
                    moodScore === score && styles.moodNumberButtonActive
                  ]}
                  onPress={() => setMoodScore(score)}
                >
                  <Text style={[
                    styles.moodNumberText,
                    moodScore === score && styles.moodNumberTextActive
                  ]}>
                    {score}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Technical Details (Collapsible) */}
        <View style={styles.technicalSection}>
          <TouchableOpacity
            style={styles.technicalHeader}
            onPress={() => setShowTechnicalDetails(!showTechnicalDetails)}
          >
            <Text style={styles.sectionTitle}>🔬 Technical Details</Text>
            <Text style={styles.toggleIcon}>{showTechnicalDetails ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showTechnicalDetails && (
            <View style={styles.technicalDetailsContainer}>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Smile Probability:</Text>
                <Text style={styles.technicalValue}>{(smilingProbability * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Left Eye Open:</Text>
                <Text style={styles.technicalValue}>{(leftEyeOpenProbability * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Right Eye Open:</Text>
                <Text style={styles.technicalValue}>{(rightEyeOpenProbability * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Eyes Openness Avg:</Text>
                <Text style={styles.technicalValue}>{(eyesOpenness * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Head Tilt (X):</Text>
                <Text style={styles.technicalValue}>{headEulerAngleX.toFixed(1)}°</Text>
              </View>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Head Turn (Y):</Text>
                <Text style={styles.technicalValue}>{headEulerAngleY.toFixed(1)}°</Text>
              </View>
              <View style={styles.technicalRow}>
                <Text style={styles.technicalLabel}>Social Context:</Text>
                <Text style={styles.technicalValue}>{socialContext} ({totalFaces} faces)</Text>
              </View>
            </View>
          )}
        </View>

        {/* Note Input */}
        <View style={styles.noteSection}>
          <Text style={styles.sectionTitle}>Add a Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="How are you feeling? What's on your mind?"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={300}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{note.length}/300</Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <IconSymbol name="checkmark" size={24} color="#FFF" />
              <Text style={styles.saveButtonText}>Save Mood</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark background matching app theme
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6', // Light text for dark background
  },
  placeholder: {
    width: 40,
  },
  photoContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#1F2937',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(146, 64, 14, 0.9)', // Amber/brown matching app theme
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  retakeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F3F4F6', // Light text for dark background
    marginBottom: 16,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analysisCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#1F2937', // Dark card background
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analysisEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#9CA3AF', // Lighter gray for dark background
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6', // Light text
    textTransform: 'capitalize',
  },
  analysisConfidence: {
    fontSize: 11,
    color: '#6B7280', // Slightly darker gray
    marginTop: 4,
  },
  detectedMoodSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  detectedMoodDisplay: {
    backgroundColor: '#1F2937', // Dark background
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(146, 64, 14, 0.3)', // Amber border
  },
  detectedMoodEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  detectedMoodScore: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B', // Amber color matching theme
    marginBottom: 4,
  },
  detectedMoodName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FCD34D', // Lighter amber
  },
  adjustmentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  moodSliderContainer: {
    backgroundColor: '#1F2937', // Dark background
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moodSliderHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentMoodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  currentMoodScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B', // Amber color
    marginBottom: 4,
  },
  currentMoodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF', // Light gray
  },
  moodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  moodNumberButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151', // Darker button background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moodNumberButtonActive: {
    backgroundColor: '#92400E', // Amber/brown active state
    borderColor: '#F59E0B',
  },
  moodNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF', // Light gray text
  },
  moodNumberTextActive: {
    color: '#FFF',
  },
  technicalSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  technicalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  technicalDetailsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  technicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  technicalLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  technicalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    fontFamily: 'monospace',
  },
  noteSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  noteInput: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    fontSize: 14,
    color: '#F3F4F6',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 8,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
    backgroundColor: '#0F172A', // Match container background
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#92400E', // Amber/brown matching app theme
    borderRadius: 28,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
