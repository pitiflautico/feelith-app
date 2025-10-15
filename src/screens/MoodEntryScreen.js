import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import useAuth from '../hooks/useAuth';
import config from '../config/config';
import { createMoodEntry, uploadMoodAudio } from '../services/moodService';
import { SvgXml } from 'react-native-svg';

// Mood icons as SVG strings (simplified versions)
const MOOD_ICONS = {
  depressed: `<svg width="64" height="64" viewBox="0 0 104 104" fill="none"><circle cx="52" cy="40" r="40" fill="#C084FC"/><path d="M34.3 29.4c1.4-.8 3.3-.3 4.1 1.1.3.5.6.8 1.1 1.1.5.3 1 .4 1.5.4s1-.1 1.5-.4c.5-.3.8-.6 1.1-1.1.8-1.4 2.7-1.9 4.1-1.1 1.4.8 1.9 2.7 1.1 4.1-.8 1.4-1.9 2.5-3.3 3.3-1.4.8-2.9 1.2-4.5 1.2s-3.1-.4-4.5-1.2c-1.4-.8-2.5-1.9-3.3-3.3-.8-1.4-.3-3.3 1.1-4.1zM56.3 29.4c1.4-.8 3.3-.3 4.1 1.1.3.5.6.8 1.1 1.1.5.3 1 .4 1.5.4s1-.1 1.5-.4c.5-.3.8-.6 1.1-1.1.8-1.4 2.7-1.9 4.1-1.1 1.4.8 1.9 2.7 1.1 4.1-.8 1.4-1.9 2.5-3.3 3.3-1.4.8-2.9 1.2-4.5 1.2s-3.1-.4-4.5-1.2c-1.4-.8-2.5-1.9-3.3-3.3-.8-1.4-.3-3.3 1.1-4.1zM52 42c-2.6 0-5.2.5-7.7 1.5s-4.6 2.5-6.5 4.4c-1.1 1.1-1.5 2.9-.9 4.4.6 1.5 2.1 2.5 3.7 2.5h23.6c1.6 0 3.1-1 3.7-2.5.6-1.5.2-3.3-.9-4.4-1.9-1.9-4-3.4-6.5-4.4s-5.1-1.5-7.7-1.5z" fill="#6B21A8"/></svg>`,

  sad: `<svg width="64" height="64" viewBox="0 0 104 104" fill="none"><circle cx="52" cy="40" r="40" fill="#FB923C"/><circle cx="41" cy="32" r="4" fill="#7C2D12"/><circle cx="63" cy="32" r="4" fill="#7C2D12"/><path d="M52 42c-2.6 0-5.2.5-7.7 1.5s-4.6 2.5-6.5 4.4c-1.1 1.1-1.5 2.9-.9 4.4.6 1.5 2.1 2.5 3.7 2.5h23.6c1.6 0 3.1-1 3.7-2.5.6-1.5.2-3.3-.9-4.4-1.9-1.9-4-3.4-6.5-4.4s-5.1-1.5-7.7-1.5z" fill="#7C2D12"/></svg>`,

  neutral: `<svg width="64" height="64" viewBox="0 0 104 104" fill="none"><circle cx="52" cy="40" r="40" fill="#B1865E"/><circle cx="41" cy="32" r="4" fill="#78350F"/><circle cx="63" cy="32" r="4" fill="#78350F"/><rect x="38" y="48" width="28" height="4" rx="2" fill="#78350F"/></svg>`,

  happy: `<svg width="64" height="64" viewBox="0 0 104 104" fill="none"><circle cx="52" cy="40" r="40" fill="#FBBF24"/><circle cx="41" cy="30" r="4" fill="#78350F"/><circle cx="63" cy="30" r="4" fill="#78350F"/><path d="M37.9 42.9c-1.7-1-2.2-3.2-1.2-4.9 1-1.7 3.2-2.2 4.9-1.2 2.6 1.5 5.5 2.3 8.5 2.3s5.9-.8 8.5-2.3c1.7-1 3.9-.5 4.9 1.2 1 1.7.5 3.9-1.2 4.9-3.5 2-7.5 3.1-11.7 3.1s-8.2-1.1-11.7-3.1z" fill="#78350F"/></svg>`,

  great: `<svg width="64" height="64" viewBox="0 0 104 104" fill="none"><circle cx="52" cy="40" r="40" fill="#9BB167"/><circle cx="41" cy="28" r="5" fill="#365314"/><circle cx="63" cy="28" r="5" fill="#365314"/><path d="M35.9 40.9c-1.7-1-2.2-3.2-1.2-4.9 1-1.7 3.2-2.2 4.9-1.2 3.1 1.8 6.6 2.7 10.2 2.7s7.1-.9 10.2-2.7c1.7-1 3.9-.5 4.9 1.2 1 1.7.5 3.9-1.2 4.9-4.1 2.4-8.7 3.6-13.5 3.6s-9.4-1.2-13.5-3.6z" fill="#365314"/></svg>`,
};

const MOODS = [
  { id: 1, score: 1, name: 'Depressed', icon: 'depressed', color: '#C084FC' },
  { id: 2, score: 3, name: 'Sad', icon: 'sad', color: '#FB923C' },
  { id: 3, score: 5, name: 'Neutral', icon: 'neutral', color: '#B1865E' },
  { id: 4, score: 7, name: 'Happy', icon: 'happy', color: '#FBBF24' },
  { id: 5, score: 9, name: 'Great', icon: 'great', color: '#9BB167' },
];

/**
 * MoodEntryScreen Component
 *
 * Native screen for creating mood entries
 * Features:
 * - Mood selection (1-10 scale visualized as 5 moods)
 * - Text note input (300 characters)
 * - Audio recording
 * - Save to API
 */
export default function MoodEntryScreen() {
  const { isLoggedIn, userId, userToken } = useAuth();
  const router = useRouter();

  // State
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Request audio permissions on mount
  useEffect(() => {
    requestAudioPermissions();
  }, []);

  const requestAudioPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Audio recording permission is required to record voice notes.');
      }
    } catch (error) {
      console.error('[MoodEntry] Error requesting audio permissions:', error);
    }
  };

  const handleClose = () => {
    router.replace('/(tabs)/');
  };

  const handleMoodSelect = (mood) => {
    console.log('[MoodEntry] Mood selected:', mood);
    setSelectedMood(mood);
  };

  const handleStartRecording = async () => {
    try {
      console.log('[MoodEntry] Starting recording...');

      // Stop and unload if already recording
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('[MoodEntry] Recording started');

    } catch (error) {
      console.error('[MoodEntry] Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('[MoodEntry] Stopping recording...');

      if (!recording) {
        return;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setAudioUri(uri);
      setRecording(null);

      console.log('[MoodEntry] Recording stopped, URI:', uri);

      // Auto-add to note
      if (uri) {
        setNote(prev => prev + (prev ? '\n\n' : '') + '[Voice note recorded]');
      }

    } catch (error) {
      console.error('[MoodEntry] Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('Please select a mood', 'Choose how you\'re feeling before saving.');
      return;
    }

    if (!isLoggedIn || !userId || !userToken) {
      Alert.alert('Not authenticated', 'Please log in to save your mood.');
      return;
    }

    try {
      setIsSaving(true);
      console.log('[MoodEntry] Saving mood entry...');

      let audioPath = null;

      // Upload audio if recorded
      if (audioUri) {
        console.log('[MoodEntry] Uploading audio...');
        audioPath = await uploadMoodAudio(userId, userToken, audioUri);
      }

      // Create mood entry
      const moodData = {
        mood_score: selectedMood.score,
        note: note.trim() || null,
        audio_path: audioPath,
      };

      await createMoodEntry(userId, userToken, moodData);

      console.log('[MoodEntry] Mood entry saved successfully');
      Alert.alert('Success!', 'Your mood has been saved.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/'),
        },
      ]);

    } catch (error) {
      console.error('[MoodEntry] Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getMoodName = () => {
    if (!selectedMood) return 'your mood';
    return selectedMood.name.toLowerCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Mood</Text>
          <TouchableOpacity style={styles.menuButton}>
            <IconSymbol name="ellipsis" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>How's Your Mood?</Text>

        {/* Selected Mood Display */}
        <View style={styles.moodDisplay}>
          {selectedMood ? (
            <SvgXml xml={MOOD_ICONS[selectedMood.icon]} width={120} height={120} />
          ) : (
            <View style={styles.placeholderIcon}>
              <IconSymbol name="face.smiling" size={60} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Mood Text */}
        <Text style={styles.moodText}>I feel {getMoodName()}.</Text>

        {/* Note Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Describe your feelings</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your main text here..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={300}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{note.length}/300</Text>
          </View>
        </View>

        {/* Mood Selector */}
        <View style={styles.moodSelector}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[
                styles.moodButton,
                selectedMood?.id === mood.id && styles.moodButtonSelected,
              ]}
              onPress={() => handleMoodSelect(mood)}
              activeOpacity={0.7}
            >
              <SvgXml
                xml={MOOD_ICONS[mood.icon]}
                width={48}
                height={48}
                opacity={selectedMood?.id === mood.id ? 1 : 0.4}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving || !selectedMood}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save</Text>
              <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          activeOpacity={0.8}
        >
          <IconSymbol
            name={isRecording ? "stop.fill" : "mic.fill"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4B3621',
    textAlign: 'center',
    marginBottom: 32,
  },
  moodDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4B3621',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minHeight: 150,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  moodButton: {
    padding: 8,
  },
  moodButtonSelected: {
    transform: [{ scale: 1.1 }],
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#F7F3EF',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
  },
});
