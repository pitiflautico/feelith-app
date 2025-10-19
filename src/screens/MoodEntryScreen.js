import React, { useState, useEffect, memo } from 'react';
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
  KeyboardAvoidingView,
  Keyboard,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Voice from '@react-native-voice/voice';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SvgXml } from 'react-native-svg';
import useAuth from '../hooks/useAuth';
import config from '../config/config';
import { createMoodEntry } from '../services/moodService';

// Mood SVG icons as XML strings (simplified - filters removed for native compatibility)
const MOOD_ICONS = {
  depressed: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="40" cy="40" r="40" fill="#C084FC"/>
<path d="M22.3052 29.4024C23.7401 28.574 25.5748 29.0656 26.4033 30.5005C26.6666 30.9566 27.0453 31.3353 27.5013 31.5986C27.9574 31.8619 28.4747 32.0005 29.0013 32.0005C29.528 32.0005 30.0453 31.8619 30.5013 31.5986C30.9574 31.3353 31.3361 30.9566 31.5994 30.5005C32.4278 29.0656 34.2626 28.574 35.6975 29.4024C37.1324 30.2309 37.624 32.0656 36.7956 33.5005C36.0057 34.8687 34.8695 36.0048 33.5013 36.7947C32.1332 37.5846 30.5812 38.0005 29.0013 38.0005C27.4215 38.0005 25.8695 37.5846 24.5013 36.7947C23.1332 36.0048 21.997 34.8687 21.2071 33.5005C20.3787 32.0656 20.8703 30.2309 22.3052 29.4024Z" fill="#6B21A8"/>
<path d="M44.3052 29.4024C45.7401 28.574 47.5748 29.0656 48.4033 30.5005C48.6666 30.9566 49.0453 31.3353 49.5013 31.5986C49.9574 31.8619 50.4747 32.0005 51.0013 32.0005C51.528 32.0005 52.0453 31.8619 52.5013 31.5986C52.9574 31.3353 53.3361 30.9566 53.5994 30.5005C54.4278 29.0656 56.2626 28.574 57.6975 29.4024C59.1324 30.2309 59.624 32.0656 58.7956 33.5005C58.0057 34.8687 56.8695 36.0048 55.5013 36.7947C54.1332 37.5846 52.5812 38.0005 51.0013 38.0005C49.4215 38.0005 47.8695 37.5846 46.5013 36.7947C45.1332 36.0048 43.997 34.8687 43.2071 33.5005C42.3787 32.0656 42.8703 30.2309 44.3052 29.4024Z" fill="#6B21A8"/>
<path d="M40.0016 42.0005C37.3751 42.0005 34.7744 42.5178 32.3479 43.5229C29.9214 44.528 27.7166 46.0012 25.8594 47.8584C24.7154 49.0024 24.3732 50.7228 24.9923 52.2175C25.6115 53.7122 27.07 54.6868 28.6879 54.6868L51.3153 54.6868C52.9331 54.6868 54.3917 53.7122 55.0108 52.2175C55.6299 50.7228 55.2877 49.0024 54.1437 47.8584C52.2865 46.0012 50.0818 44.528 47.6552 43.5229C45.2287 42.5178 42.628 42.0005 40.0016 42.0005Z" fill="#6B21A8"/>
</svg>`,
  sad: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="40" cy="40" r="40" fill="#FB923C"/>
<circle cx="29" cy="33" r="5" fill="#9A3412"/>
<circle cx="51" cy="33" r="5" fill="#9A3412"/>
<path d="M32.3463 43.5224C34.7728 42.5173 37.3736 42 40 42C42.6264 42 45.2272 42.5173 47.6537 43.5224C50.0802 44.5275 52.285 46.0007 54.1421 47.8579C55.7042 49.42 55.7042 51.9526 54.1421 53.5147C52.58 55.0768 50.0474 55.0768 48.4853 53.5147C47.371 52.4004 46.0481 51.5165 44.5922 50.9134C43.1363 50.3104 41.5759 50 40 50C38.4241 50 36.8637 50.3104 35.4078 50.9135C33.9519 51.5165 32.629 52.4004 31.5147 53.5147C29.9526 55.0768 27.42 55.0768 25.8579 53.5147C24.2958 51.9526 24.2958 49.42 25.8579 47.8579C27.715 46.0007 29.9198 44.5275 32.3463 43.5224Z" fill="#9A3412"/>
</svg>`,
  neutral: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="40" cy="40" r="40" fill="#B1865E"/>
<circle cx="29" cy="33" r="5" fill="#533630"/>
<circle cx="51" cy="33" r="5" fill="#533630"/>
<path d="M40 56C37.3736 56 34.7728 55.4827 32.3463 54.4776C29.9198 53.4725 27.715 51.9993 25.8579 50.1421C24.2958 48.58 24.2958 46.0474 25.8579 44.4853C27.42 42.9232 29.9526 42.9232 31.5147 44.4853C32.629 45.5996 33.9519 46.4835 35.4078 47.0866C36.8637 47.6896 38.4241 48 40 48C41.5759 48 43.1363 47.6896 44.5922 47.0866C46.0481 46.4835 47.371 45.5996 48.4853 44.4853C50.0474 42.9232 52.58 42.9232 54.1421 44.4853C55.7042 46.0474 55.7042 48.58 54.1421 50.1421C52.285 51.9993 50.0802 53.4725 47.6537 54.4776C45.2272 55.4827 42.6264 56 40 56Z" fill="#533630"/>
</svg>`,
  happy: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="40" cy="40" r="40" fill="#FBBF24"/>
<circle cx="29" cy="33" r="5" fill="#92400E"/>
<circle cx="51" cy="33" r="5" fill="#92400E"/>
<path d="M40 56C37.3736 56 34.7728 55.4827 32.3463 54.4776C29.9198 53.4725 27.715 51.9993 25.8579 50.1421C24.2958 48.58 24.2958 46.0474 25.8579 44.4853C27.42 42.9232 29.9526 42.9232 31.5147 44.4853C32.629 45.5996 33.9519 46.4835 35.4078 47.0866C36.8637 47.6896 38.4241 48 40 48C41.5759 48 43.1363 47.6896 44.5922 47.0866C46.0481 46.4835 47.371 45.5996 48.4853 44.4853C50.0474 42.9232 52.58 42.9232 54.1421 44.4853C55.7042 46.0474 55.7042 48.58 54.1421 50.1421C52.285 51.9993 50.0802 53.4725 47.6537 54.4776C45.2272 55.4827 42.6264 56 40 56Z" fill="#92400E"/>
</svg>`,
  great: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="40" cy="40" r="40" fill="#9BB167"/>
<path d="M22.3052 37.5981C23.7401 38.4265 25.5748 37.9349 26.4033 36.5C26.6666 36.0439 27.0453 35.6652 27.5013 35.4019C27.9574 35.1386 28.4747 35 29.0013 35C29.528 35 30.0453 35.1386 30.5013 35.4019C30.9574 35.6652 31.3361 36.0439 31.5994 36.5C32.4278 37.9349 34.2626 38.4265 35.6975 37.5981C37.1324 36.7696 37.624 34.9349 36.7956 33.5C36.0057 32.1318 34.8695 30.9957 33.5013 30.2058C32.1332 29.4159 30.5812 29 29.0013 29C27.4215 29 25.8695 29.4159 24.5013 30.2058C23.1332 30.9957 21.997 32.1318 21.2071 33.5C20.3787 34.9349 20.8703 36.7696 22.3052 37.5981Z" fill="#3F4B29"/>
<path d="M44.3052 37.5981C45.7401 38.4265 47.5748 37.9349 48.4033 36.5C48.6666 36.0439 49.0453 35.6652 49.5013 35.4019C49.9574 35.1386 50.4747 35 51.0013 35C51.528 35 52.0453 35.1386 52.5013 35.4019C52.9574 35.6652 53.3361 36.0439 53.5994 36.5C54.4278 37.9349 56.2626 38.4265 57.6975 37.5981C59.1324 36.7696 59.624 34.9349 58.7956 33.5C58.0057 32.1318 56.8695 30.9957 55.5013 30.2058C54.1332 29.4159 52.5812 29 51.0013 29C49.4215 29 47.8695 29.4159 46.5013 30.2058C45.1332 30.9957 43.997 32.1318 43.2071 33.5C42.3787 34.9349 42.8703 36.7696 44.3052 37.5981Z" fill="#3F4B29"/>
<path d="M40.0016 56C37.3751 56 34.7744 55.4827 32.3479 54.4776C29.9214 53.4725 27.7166 51.9993 25.8594 50.1421C24.7154 48.9981 24.3732 47.2777 24.9923 45.783C25.6115 44.2883 27.07 43.3137 28.6879 43.3137L51.3153 43.3137C52.9331 43.3137 54.3917 44.2883 55.0108 45.783C55.6299 47.2777 55.2877 48.9981 54.1437 50.1421C52.2865 51.9993 50.0818 53.4725 47.6552 54.4776C45.2287 55.4827 42.628 56 40.0016 56Z" fill="#3F4B29"/>
</svg>`,
};

const MOODS = [
  { id: 1, score: 1, name: 'depressed', icon: 'depressed', color: '#C084FC' },
  { id: 2, score: 3, name: 'sad', icon: 'sad', color: '#FB923C' },
  { id: 3, score: 5, name: 'neutral', icon: 'neutral', color: '#B1865E' },
  { id: 4, score: 7, name: 'happy', icon: 'happy', color: '#FBBF24' },
  { id: 5, score: 9, name: 'great', icon: 'great', color: '#9BB167' },
];

// Memoized SVG Icon Component - only re-renders when icon or size changes
const MoodIcon = memo(({ icon, width, height }) => {
  return <SvgXml xml={MOOD_ICONS[icon]} width={width} height={height} />;
}, (prevProps, nextProps) => {
  // Only re-render if icon, width, or height changes
  return prevProps.icon === nextProps.icon &&
         prevProps.width === nextProps.width &&
         prevProps.height === nextProps.height;
});

// Memoized Mood Display Component - only re-renders when selectedMood changes
const MoodDisplay = memo(({ selectedMood }) => {
  return (
    <View style={styles.moodDisplay}>
      {selectedMood ? (
        <MoodIcon
          icon={selectedMood.icon}
          width={120}
          height={120}
        />
      ) : (
        <View style={styles.placeholderIcon}>
          <IconSymbol name="face.smiling" size={60} color="#9CA3AF" />
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selectedMood changes
  return prevProps.selectedMood?.id === nextProps.selectedMood?.id;
});

// Memoized Mood Button Component - only re-renders when selection changes
const MoodButton = memo(({ mood, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.moodButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[!isSelected && styles.moodIconGrayscale]}>
        <MoodIcon
          icon={mood.icon}
          width={56}
          height={56}
        />
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Only re-render if mood or selection state changes
  return prevProps.mood.id === nextProps.mood.id &&
         prevProps.isSelected === nextProps.isSelected;
});

// Memoized Mood Selector Component - only re-renders when selectedMood changes
const MoodSelector = memo(({ moods, selectedMood, onMoodSelect }) => {
  return (
    <View style={styles.moodSelectorContainer}>
      <View style={styles.moodSelector}>
        {moods.map((mood) => (
          <MoodButton
            key={mood.id}
            mood={mood}
            isSelected={selectedMood?.id === mood.id}
            onPress={() => onMoodSelect(mood)}
          />
        ))}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selectedMood changes
  return prevProps.selectedMood?.id === nextProps.selectedMood?.id;
});

/**
 * Toast Component
 * Simple toast notification that appears at the top of the screen
 */
const Toast = ({ message, visible, onHide }) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onHide();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={styles.toastIcon}>
          <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
        </View>
        <Text style={styles.toastText}>{message}</Text>
        <TouchableOpacity onPress={onHide} style={styles.toastCloseButton}>
          <IconSymbol name="xmark" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/**
 * MoodEntryScreen Component
 *
 * Native screen for creating mood entries
 * Features:
 * - Mood selection (1-10 scale visualized as 5 moods)
 * - Text note input (300 characters)
 * - Speech-to-text recording
 * - Save to API
 */
export default function MoodEntryScreen({ route }) {
  const { isLoggedIn, userId, userToken, isLoading } = useAuth();
  const router = useRouter();

  // Get event ID from route params (if coming from notification)
  // Works with both React Navigation and Expo Router
  const { useLocalSearchParams } = require('expo-router');
  const searchParams = useLocalSearchParams();
  const eventId = route?.params?.eventId || searchParams?.eventId;
  const eventTitle = route?.params?.eventTitle || searchParams?.eventTitle;

  // State
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Check authentication status on mount
  useEffect(() => {
    console.log('[MoodEntry] Auth state:', { isLoading, isLoggedIn, hasUserId: !!userId, hasToken: !!userToken });

    // If auth is loaded and user is not logged in, redirect to home
    if (!isLoading && !isLoggedIn) {
      console.log('[MoodEntry] User not authenticated, redirecting to home');
      Alert.alert('Not authenticated', 'Please log in to save your mood.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/') }
      ]);
    }
  }, [isLoading, isLoggedIn]);

  // Set up Voice speech recognition event handlers
  useEffect(() => {
    Voice.onSpeechStart = () => {
      console.log('[MoodEntry] Speech recognition started');
      setIsRecording(true);
    };

    Voice.onSpeechEnd = () => {
      console.log('[MoodEntry] Speech recognition ended');
      setIsRecording(false);
    };

    Voice.onSpeechResults = (event) => {
      console.log('[MoodEntry] Speech recognized:', event.value);
      if (event.value && event.value.length > 0) {
        const transcript = event.value[0];
        // Replace the note with the latest transcript instead of accumulating
        setNote(transcript);
      }
    };

    Voice.onSpeechError = (event) => {
      console.error('[MoodEntry] Speech recognition error:', event.error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to recognize speech. Please try again.');
    };

    // Cleanup on unmount
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleClose = () => {
    router.replace('/(tabs)/');
  };

  const handleMoodSelect = (mood) => {
    console.log('[MoodEntry] Mood selected:', mood);
    setSelectedMood(mood);
  };

  const handleStartRecording = async () => {
    try {
      console.log('[MoodEntry] Starting speech recognition...');
      setIsRecording(true);

      await Voice.start('es-ES');  // Spanish language

    } catch (error) {
      console.error('[MoodEntry] Failed to start speech recognition:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start speech recognition');
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('[MoodEntry] Stopping speech recognition...');
      await Voice.stop();
    } catch (error) {
      console.error('[MoodEntry] Failed to stop speech recognition:', error);
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (!selectedMood) {
      Alert.alert('Please select a mood', 'Choose how you\'re feeling before saving.');
      return;
    }

    if (!isLoggedIn || !userId || !userToken) {
      Alert.alert('Not authenticated', 'Please log in to save your mood.');
      return;
    }

    // Navigate to tag selector screen
    router.push({
      pathname: '/mood-tag-selector',
      params: {
        moodScore: selectedMood.score,
        moodName: selectedMood.name,
        note: note.trim() || null,
        eventId: eventId || null,
        eventTitle: eventTitle || null,
      }
    });
  };

  const getMoodName = () => {
    if (!selectedMood) return 'your mood';
    return selectedMood.name.toLowerCase();
  };

  // Show loading screen while auth is being checked
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show not authenticated screen if user is not logged in
  if (!isLoggedIn) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Please log in to continue</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Mood</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              // Navigate to selfie camera with current mood data
              router.push({
                pathname: '/mood-selfie-camera',
                params: {
                  moodScore: selectedMood?.score || null,
                  moodName: selectedMood?.name || null,
                  note: note || null,
                  eventId: eventId || null,
                  eventTitle: eventTitle || null,
                }
              });
            }}
          >
            <IconSymbol name="camera.fill" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Event Badge (if mood is for an event) */}
        {eventId && eventTitle && (
          <View style={styles.eventBadge}>
            <IconSymbol name="calendar" size={16} color="#7C3AED" />
            <Text style={styles.eventBadgeText} numberOfLines={1}>
              {eventTitle}
            </Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>How's Your Mood?</Text>

        {/* Selected Mood Display */}
        <MoodDisplay selectedMood={selectedMood} />

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
              enablesReturnKeyAutomatically={false}
              keyboardAppearance="light"
            />
            <Text style={styles.charCount}>{note.length}/300</Text>
          </View>
        </View>

        {/* Mood Selector - White rounded container */}
        <MoodSelector
          moods={MOODS}
          selectedMood={selectedMood}
          onMoodSelect={handleMoodSelect}
        />
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
    </KeyboardAvoidingView>
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
    paddingBottom: 140, // Extra padding for floating tab bar (120 + 20)
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
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
    gap: 8,
    maxWidth: '90%',
  },
  eventBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    flexShrink: 1,
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
  moodDisplayImage: {
    width: 256,
    height: 256,
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
  moodSelectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  moodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodButton: {
    // No additional padding needed
  },
  moodSelectorIcon: {
    width: 56,
    height: 56,
  },
  moodIconGrayscale: {
    opacity: 0.4,
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
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignSelf: 'center',
    maxWidth: 448, // max-w-md (28rem = 448px)
  },
  toast: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // rounded-2xl
    borderWidth: 2,
    borderColor: '#BBF7D0', // border-green-200
    paddingVertical: 16, // py-4
    paddingHorizontal: 20, // px-5
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  toastIcon: {
    flexShrink: 0,
  },
  toastText: {
    fontSize: 16, // text-base
    fontWeight: '500', // font-medium
    color: '#111827', // text-gray-900
    flex: 1,
  },
  toastCloseButton: {
    flexShrink: 0,
    padding: 4,
  },
});
