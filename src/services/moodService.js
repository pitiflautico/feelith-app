import config from '../config/config';

/**
 * Mood Service
 *
 * Handles all mood-related API calls
 */

/**
 * Create a new mood entry
 * @param {number} userId - User ID
 * @param {string} userToken - Authentication token
 * @param {object} moodData - Mood entry data
 * @param {number} moodData.mood_score - Mood score (1-10)
 * @param {string} moodData.note - Text note (optional)
 * @param {string} moodData.audio_path - Audio file path (optional)
 * @returns {Promise<object>} - Created mood entry
 */
export const createMoodEntry = async (userId, userToken, moodData) => {
  try {
    console.log('[MoodService] Creating mood entry:', { userId, moodData });

    const response = await fetch(`${config.WEB_URL}/api/moods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        mood_score: moodData.mood_score,
        note: moodData.note || null,
        audio_path: moodData.audio_path || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MoodService] Failed to create mood entry:', data);
      throw new Error(data.message || 'Failed to create mood entry');
    }

    console.log('[MoodService] Mood entry created successfully:', data);
    return data;

  } catch (error) {
    console.error('[MoodService] Error creating mood entry:', error);
    throw error;
  }
};

/**
 * Upload audio file for mood entry
 * @param {number} userId - User ID
 * @param {string} userToken - Authentication token
 * @param {string} audioUri - Local audio file URI
 * @returns {Promise<string>} - Server audio path
 */
export const uploadMoodAudio = async (userId, userToken, audioUri) => {
  try {
    console.log('[MoodService] Uploading audio:', { userId, audioUri });

    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: `mood_audio_${Date.now()}.m4a`,
    });
    formData.append('user_id', userId.toString());

    const response = await fetch(`${config.WEB_URL}/api/moods/upload-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MoodService] Failed to upload audio:', data);
      throw new Error(data.message || 'Failed to upload audio');
    }

    console.log('[MoodService] Audio uploaded successfully:', data);
    return data.audio_path;

  } catch (error) {
    console.error('[MoodService] Error uploading audio:', error);
    throw error;
  }
};
