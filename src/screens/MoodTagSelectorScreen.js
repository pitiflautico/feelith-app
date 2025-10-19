import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SvgXml } from 'react-native-svg';
import useAuth from '../hooks/useAuth';
import config from '../config/config';

// Mood SVG icons (same as MoodEntryScreen)
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

// Helper function to get mood icon based on score
const getMoodIcon = (score) => {
  if (score <= 2) return 'depressed';
  if (score <= 4) return 'sad';
  if (score <= 6) return 'neutral';
  if (score <= 8) return 'happy';
  return 'great';
};

/**
 * MoodTagSelectorScreen Component
 *
 * Native screen for selecting tags to associate with a mood entry
 * Features:
 * - Display tags suggested for the selected mood
 * - Multi-select tags (optional)
 * - Skip or save with selected tags
 * - Follows exact design from wireframe
 */
export default function MoodTagSelectorScreen() {
  const { isLoggedIn, userId, userToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get mood data from params
  const moodScore = params?.moodScore ? parseInt(params.moodScore) : null;
  const moodName = params?.moodName || null;
  const note = params?.note || null;
  const eventId = params?.eventId || null;
  const eventTitle = params?.eventTitle || null;
  const selfiePhotoPath = params?.selfiePhotoPath || null;
  const selfieHeatmapPath = params?.selfieHeatmapPath || null;
  const selfieTakenAt = params?.selfieTakenAt || null;
  const faceExpression = params?.faceExpression || null;
  const faceExpressionConfidence = params?.faceExpressionConfidence || null;
  const faceEnergyLevel = params?.faceEnergyLevel || null;
  const faceEyesOpenness = params?.faceEyesOpenness || null;
  const faceSocialContext = params?.faceSocialContext || null;
  const faceTotalFaces = params?.faceTotalFaces || null;
  const bpm = params?.bpm || null;
  const environmentBrightness = params?.environmentBrightness || null;
  const faceAnalysisRaw = params?.faceAnalysisRaw || null;

  // State
  const [systemTags, setSystemTags] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [moodScore]);

  const fetchTags = async () => {
    try {
      setIsLoading(true);

      let url = `${config.API_URL}/tags`;
      if (moodScore) {
        url += `?mood_score=${moodScore}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data = await response.json();
      setSystemTags(data.system_tags || []);
      setCustomTags(data.custom_tags || []);

    } catch (error) {
      console.error('[TagSelector] Error fetching tags:', error);
      Alert.alert('Error', 'Failed to load tags. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId) => {
    setSelectedTagIds(prevSelected => {
      if (prevSelected.includes(tagId)) {
        // Remove tag
        return prevSelected.filter(id => id !== tagId);
      } else {
        // Add tag
        return [...prevSelected, tagId];
      }
    });
  };

  const handleSkip = () => {
    // Save mood without tags
    saveMood([]);
  };

  const handleSave = () => {
    // Save mood with selected tags
    saveMood(selectedTagIds);
  };

  const saveMood = async (tagIds) => {
    if (!isLoggedIn || !userId || !userToken) {
      Alert.alert('Not authenticated', 'Please log in to save your mood.');
      return;
    }

    if (!moodScore) {
      Alert.alert('Error', 'Missing mood score. Please go back and select a mood.');
      return;
    }

    try {
      setIsSaving(true);
      console.log('[TagSelector] Saving mood entry with tags...');

      // Prepare mood data
      const moodData = {
        mood_score: moodScore,
        note: note || null,
        calendar_event_id: eventId || null,
        tag_ids: tagIds.length > 0 ? tagIds : null,
        entry_type: selfiePhotoPath ? 'selfie' : 'manual',
        // Selfie data (if available)
        selfie_photo_path: selfiePhotoPath || null,
        selfie_heatmap_path: selfieHeatmapPath || null,
        selfie_taken_at: selfieTakenAt || null,
        // Face analysis data (if available)
        face_expression: faceExpression || null,
        face_expression_confidence: faceExpressionConfidence ? parseFloat(faceExpressionConfidence) : null,
        face_energy_level: faceEnergyLevel || null,
        face_eyes_openness: faceEyesOpenness ? parseFloat(faceEyesOpenness) : null,
        face_social_context: faceSocialContext || null,
        face_total_faces: faceTotalFaces ? parseInt(faceTotalFaces) : null,
        bpm: bpm ? parseInt(bpm) : null,
        environment_brightness: environmentBrightness || null,
        face_analysis_raw: faceAnalysisRaw ? JSON.parse(faceAnalysisRaw) : null,
      };

      // API call to save mood
      const response = await fetch(`${config.API_URL}/moods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(moodData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save mood');
      }

      console.log('[TagSelector] Mood entry saved successfully');

      // Navigate to mood history
      router.replace({
        pathname: '/(tabs)/',
        params: { initialUrl: '/mood-history', forceReload: true }
      });

    } catch (error) {
      console.error('[TagSelector] Error saving mood:', error);
      Alert.alert('Error', 'Failed to save your mood. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTag = (tag) => {
    const isSelected = selectedTagIds.includes(tag.id);

    return (
      <TouchableOpacity
        key={tag.id}
        style={[
          styles.tagButton,
          isSelected && styles.tagButtonSelected,
        ]}
        onPress={() => handleTagToggle(tag.id)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tagText,
          isSelected && styles.tagTextSelected,
        ]}>
          {tag.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading tags...</Text>
      </View>
    );
  }

  const allTags = [...systemTags, ...customTags];

  return (
    <View style={styles.container}>
      {/* Header with Back and Skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <IconSymbol name="chevron.left" size={28} color="#4B3621" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} disabled={isSaving} style={styles.headerButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Icon */}
        <View style={styles.moodIconContainer}>
          <SvgXml xml={MOOD_ICONS[getMoodIcon(moodScore)]} width={80} height={80} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Why do you think{'\n'}you feel this way?</Text>

        {/* Tags Grid */}
        <View style={styles.tagsGrid}>
          {allTags.map(tag => renderTag(tag))}
        </View>
      </ScrollView>

      {/* Bottom Continue Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Continue</Text>
              <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3EF', // Beige/cream background matching app
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F3EF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#F7F3EF',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B3621',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  moodIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B3621', // Dark brown matching design
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tagButton: {
    width: '47%', // 2 columns (50% each with gap)
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4B3621', // Same color as text
    borderRadius: 999, // Pill shape - fully rounded
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tagButtonSelected: {
    backgroundColor: 'transparent',
    borderColor: '#7C3AED', // Purple border when selected
    borderWidth: 2,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B3621',
    textAlign: 'center',
  },
  tagTextSelected: {
    color: '#7C3AED', // Purple text when selected
    fontWeight: '600',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#F7F3EF',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED', // Purple button matching app design
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
});
