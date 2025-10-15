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
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SvgXml } from 'react-native-svg';
import useAuth from '../hooks/useAuth';
import config from '../config/config';
import { createMoodEntry, uploadMoodAudio } from '../services/moodService';

// Mood SVG icons as XML strings
const MOOD_ICONS = {
  depressed: `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_dd_25312_69365)">
<path d="M12 40C12 17.9086 29.9086 0 52 0C74.0914 0 92 17.9086 92 40C92 62.0914 74.0914 80 52 80C29.9086 80 12 62.0914 12 40Z" fill="#C084FC"/>
<path d="M34.3052 29.4024C35.7401 28.574 37.5748 29.0656 38.4033 30.5005C38.6666 30.9566 39.0453 31.3353 39.5013 31.5986C39.9574 31.8619 40.4747 32.0005 41.0013 32.0005C41.528 32.0005 42.0453 31.8619 42.5013 31.5986C42.9574 31.3353 43.3361 30.9566 43.5994 30.5005C44.4278 29.0656 46.2626 28.574 47.6975 29.4024C49.1324 30.2309 49.624 32.0656 48.7956 33.5005C48.0057 34.8687 46.8695 36.0048 45.5013 36.7947C44.1332 37.5846 42.5812 38.0005 41.0013 38.0005C39.4215 38.0005 37.8695 37.5846 36.5013 36.7947C35.1332 36.0048 33.997 34.8687 33.2071 33.5005C32.3787 32.0656 32.8703 30.2309 34.3052 29.4024Z" fill="#6B21A8"/>
<path d="M56.3052 29.4024C57.7401 28.574 59.5748 29.0656 60.4033 30.5005C60.6666 30.9566 61.0453 31.3353 61.5013 31.5986C61.9574 31.8619 62.4747 32.0005 63.0013 32.0005C63.528 32.0005 64.0453 31.8619 64.5013 31.5986C64.9574 31.3353 65.3361 30.9566 65.5994 30.5005C66.4278 29.0656 68.2626 28.574 69.6975 29.4024C71.1324 30.2309 71.624 32.0656 70.7956 33.5005C70.0057 34.8687 68.8695 36.0048 67.5013 36.7947C66.1332 37.5846 64.5812 38.0005 63.0013 38.0005C61.4215 38.0005 59.8695 37.5846 58.5013 36.7947C57.1332 36.0048 55.997 34.8687 55.2071 33.5005C54.3787 32.0656 54.8703 30.2309 56.3052 29.4024Z" fill="#6B21A8"/>
<path d="M52.0016 42.0005C49.3751 42.0005 46.7744 42.5178 44.3479 43.5229C41.9214 44.528 39.7166 46.0012 37.8594 47.8584C36.7154 49.0024 36.3732 50.7228 36.9923 52.2175C37.6115 53.7122 39.07 54.6868 40.6879 54.6868L63.3153 54.6868C64.9331 54.6868 66.3917 53.7122 67.0108 52.2175C67.6299 50.7228 67.2877 49.0024 66.1437 47.8584C64.2865 46.0012 62.0818 44.528 59.6552 43.5229C57.2287 42.5178 54.628 42.0005 52.0016 42.0005Z" fill="#6B21A8"/>
</g>
<defs>
<filter id="filter0_dd_25312_69365" x="0" y="0" width="104" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_25312_69365"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.03 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_25312_69365"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="4" operator="erode" in="SourceAlpha" result="effect2_dropShadow_25312_69365"/>
<feOffset dy="12"/>
<feGaussianBlur stdDeviation="8"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_25312_69365" result="effect2_dropShadow_25312_69365"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_25312_69365" result="shape"/>
</filter>
</defs>
</svg>`,
  sad: `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_dd_25312_69463)">
<path d="M12 40C12 17.9086 29.9086 0 52 0C74.0914 0 92 17.9086 92 40C92 62.0914 74.0914 80 52 80C29.9086 80 12 62.0914 12 40Z" fill="#FB923C"/>
<path d="M46 33C46 30.2386 43.7614 28 41 28C38.2386 28 36 30.2386 36 33C36 35.7614 38.2386 38 41 38C43.7614 38 46 35.7614 46 33Z" fill="#9A3412"/>
<path d="M44.3463 43.5224C46.7728 42.5173 49.3736 42 52 42C54.6264 42 57.2272 42.5173 59.6537 43.5224C62.0802 44.5275 64.285 46.0007 66.1421 47.8579C67.7042 49.42 67.7042 51.9526 66.1421 53.5147C64.58 55.0768 62.0474 55.0768 60.4853 53.5147C59.371 52.4004 58.0481 51.5165 56.5922 50.9134C55.1363 50.3104 53.5759 50 52 50C50.4241 50 48.8637 50.3104 47.4078 50.9135C45.9519 51.5165 44.629 52.4004 43.5147 53.5147C41.9526 55.0768 39.42 55.0768 37.8579 53.5147C36.2958 51.9526 36.2958 49.42 37.8579 47.8579C39.715 46.0007 41.9198 44.5275 44.3463 43.5224Z" fill="#9A3412"/>
<path d="M63 28C65.7614 28 68 30.2386 68 33C68 35.7614 65.7614 38 63 38C60.2386 38 58 35.7614 58 33C58 30.2386 60.2386 28 63 28Z" fill="#9A3412"/>
</g>
<defs>
<filter id="filter0_dd_25312_69463" x="0" y="0" width="104" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_25312_69463"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.03 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_25312_69463"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="4" operator="erode" in="SourceAlpha" result="effect2_dropShadow_25312_69463"/>
<feOffset dy="12"/>
<feGaussianBlur stdDeviation="8"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_25312_69463" result="effect2_dropShadow_25312_69463"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_25312_69463" result="shape"/>
</filter>
</defs>
</svg>`,
  neutral: `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_dd_25312_69467)">
<path d="M12 40C12 17.9086 29.9086 0 52 0C74.0914 0 92 17.9086 92 40C92 62.0914 74.0914 80 52 80C29.9086 80 12 62.0914 12 40Z" fill="#B1865E"/>
<path d="M46 33C46 30.2386 43.7614 28 41 28C38.2386 28 36 30.2386 36 33C36 35.7614 38.2386 38 41 38C43.7614 38 46 35.7614 46 33Z" fill="#533630"/>
<path d="M68 33C68 30.2386 65.7614 28 63 28C60.2386 28 58 30.2386 58 33C58 35.7614 60.2386 38 63 38C65.7614 38 68 35.7614 68 33Z" fill="#533630"/>
<path d="M52 56C49.3736 56 46.7728 55.4827 44.3463 54.4776C41.9198 53.4725 39.715 51.9993 37.8579 50.1421C36.2958 48.58 36.2958 46.0474 37.8579 44.4853C39.42 42.9232 41.9526 42.9232 43.5147 44.4853C44.629 45.5996 45.9519 46.4835 47.4078 47.0866C48.8637 47.6896 50.4241 48 52 48C53.5759 48 55.1363 47.6896 56.5922 47.0866C58.0481 46.4835 59.371 45.5996 60.4853 44.4853C62.0474 42.9232 64.58 42.9232 66.1421 44.4853C67.7042 46.0474 67.7042 48.58 66.1421 50.1421C64.285 51.9993 62.0802 53.4725 59.6537 54.4776C57.2272 55.4827 54.6264 56 52 56Z" fill="#533630"/>
</g>
<defs>
<filter id="filter0_dd_25312_69467" x="0" y="0" width="104" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_25312_69467"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.03 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_25312_69467"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="4" operator="erode" in="SourceAlpha" result="effect2_dropShadow_25312_69467"/>
<feOffset dy="12"/>
<feGaussianBlur stdDeviation="8"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_25312_69467" result="effect2_dropShadow_25312_69467"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_25312_69467" result="shape"/>
</filter>
</defs>
</svg>`,
  happy: `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_dd_25312_69471)">
<path d="M12 40C12 17.9086 29.9086 0 52 0C74.0914 0 92 17.9086 92 40C92 62.0914 74.0914 80 52 80C29.9086 80 12 62.0914 12 40Z" fill="#FBBF24"/>
<path d="M46 33C46 30.2386 43.7614 28 41 28C38.2386 28 36 30.2386 36 33C36 35.7614 38.2386 38 41 38C43.7614 38 46 35.7614 46 33Z" fill="#92400E"/>
<path d="M68 33C68 30.2386 65.7614 28 63 28C60.2386 28 58 30.2386 58 33C58 35.7614 60.2386 38 63 38C65.7614 38 68 35.7614 68 33Z" fill="#92400E"/>
<path d="M52 56C49.3736 56 46.7728 55.4827 44.3463 54.4776C41.9198 53.4725 39.715 51.9993 37.8579 50.1421C36.2958 48.58 36.2958 46.0474 37.8579 44.4853C39.42 42.9232 41.9526 42.9232 43.5147 44.4853C44.629 45.5996 45.9519 46.4835 47.4078 47.0866C48.8637 47.6896 50.4241 48 52 48C53.5759 48 55.1363 47.6896 56.5922 47.0866C58.0481 46.4835 59.371 45.5996 60.4853 44.4853C62.0474 42.9232 64.58 42.9232 66.1421 44.4853C67.7042 46.0474 67.7042 48.58 66.1421 50.1421C64.285 51.9993 62.0802 53.4725 59.6537 54.4776C57.2272 55.4827 54.6264 56 52 56Z" fill="#92400E"/>
</g>
<defs>
<filter id="filter0_dd_25312_69471" x="0" y="0" width="104" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_25312_69471"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.03 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_25312_69471"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="4" operator="erode" in="SourceAlpha" result="effect2_dropShadow_25312_69471"/>
<feOffset dy="12"/>
<feGaussianBlur stdDeviation="8"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_25312_69471" result="effect2_dropShadow_25312_69471"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_25312_69471" result="shape"/>
</filter>
</defs>
</svg>`,
  great: `<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_dd_25312_69569)">
<path d="M12 40C12 17.9086 29.9086 0 52 0C74.0914 0 92 17.9086 92 40C92 62.0914 74.0914 80 52 80C29.9086 80 12 62.0914 12 40Z" fill="#9BB167"/>
<path d="M34.3052 37.5981C35.7401 38.4265 37.5748 37.9349 38.4033 36.5C38.6666 36.0439 39.0453 35.6652 39.5013 35.4019C39.9574 35.1386 40.4747 35 41.0013 35C41.528 35 42.0453 35.1386 42.5013 35.4019C42.9574 35.6652 43.3361 36.0439 43.5994 36.5C44.4278 37.9349 46.2626 38.4265 47.6975 37.5981C49.1324 36.7696 49.624 34.9349 48.7956 33.5C48.0057 32.1318 46.8695 30.9957 45.5013 30.2058C44.1332 29.4159 42.5812 29 41.0013 29C39.4215 29 37.8695 29.4159 36.5013 30.2058C35.1332 30.9957 33.997 32.1318 33.2071 33.5C32.3787 34.9349 32.8703 36.7696 34.3052 37.5981Z" fill="#3F4B29"/>
<path d="M56.3052 37.5981C57.7401 38.4265 59.5748 37.9349 60.4033 36.5C60.6666 36.0439 61.0453 35.6652 61.5013 35.4019C61.9574 35.1386 62.4747 35 63.0013 35C63.528 35 64.0453 35.1386 64.5013 35.4019C64.9574 35.6652 65.3361 36.0439 65.5994 36.5C66.4278 37.9349 68.2626 38.4265 69.6975 37.5981C71.1324 36.7696 71.624 34.9349 70.7956 33.5C70.0057 32.1318 68.8695 30.9957 67.5013 30.2058C66.1332 29.4159 64.5812 29 63.0013 29C61.4215 29 59.8695 29.4159 58.5013 30.2058C57.1332 30.9957 55.997 32.1318 55.2071 33.5C54.3787 34.9349 54.8703 36.7696 56.3052 37.5981Z" fill="#3F4B29"/>
<path d="M52.0016 56C49.3751 56 46.7744 55.4827 44.3479 54.4776C41.9214 53.4725 39.7166 51.9993 37.8594 50.1421C36.7154 48.9981 36.3732 47.2777 36.9923 45.783C37.6115 44.2883 39.07 43.3137 40.6879 43.3137L63.3153 43.3137C64.9331 43.3137 66.3917 44.2883 67.0108 45.783C67.6299 47.2777 67.2877 48.9981 66.1437 50.1421C64.2865 51.9993 62.0818 53.4725 59.6552 54.4776C57.2287 55.4827 54.628 56 52.0016 56Z" fill="#3F4B29"/>
</g>
<defs>
<filter id="filter0_dd_25312_69569" x="0" y="0" width="104" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_dropShadow_25312_69569"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="3"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.03 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_25312_69569"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="4" operator="erode" in="SourceAlpha" result="effect2_dropShadow_25312_69569"/>
<feOffset dy="12"/>
<feGaussianBlur stdDeviation="8"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.160784 0 0 0 0 0.145098 0 0 0 0 0.141176 0 0 0 0.08 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_25312_69569" result="effect2_dropShadow_25312_69569"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_25312_69569" result="shape"/>
</filter>
</defs>
</svg>`,
};

const MOODS = [
  { id: 1, score: 1, name: 'depressed', icon: 'depressed', color: '#C084FC' },
  { id: 2, score: 3, name: 'sad', icon: 'sad', color: '#FB923C' },
  { id: 3, score: 5, name: 'neutral', icon: 'neutral', color: '#B1865E' },
  { id: 4, score: 7, name: 'happy', icon: 'happy', color: '#FBBF24' },
  { id: 5, score: 9, name: 'great', icon: 'great', color: '#9BB167' },
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
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
          <TouchableOpacity style={styles.menuButton}>
            <IconSymbol name="ellipsis" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>How's Your Mood?</Text>

        {/* Selected Mood Display */}
        <View style={styles.moodDisplay}>
          {selectedMood ? (
            <SvgXml
              xml={MOOD_ICONS[selectedMood.icon]}
              width={120}
              height={120}
            />
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

        {/* Mood Selector - White rounded container */}
        <View style={styles.moodSelectorContainer}>
          <View style={styles.moodSelector}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={styles.moodButton}
                onPress={() => handleMoodSelect(mood)}
                activeOpacity={0.7}
              >
                <View style={[selectedMood?.id !== mood.id && styles.moodIconGrayscale]}>
                  <SvgXml
                    xml={MOOD_ICONS[mood.icon]}
                    width={56}
                    height={56}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
});
