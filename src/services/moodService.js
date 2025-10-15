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
 * @param {string} moodData.note - Text note (optional, can include speech-to-text transcription)
 * @returns {Promise<object>} - Created mood entry
 */
export const createMoodEntry = async (userId, userToken, moodData) => {
  try {
    console.log('[MoodService] Creating mood entry:', { userId, moodData });

    // Build request body, only include fields that have values
    const requestBody = {
      user_id: userId,
      mood_score: moodData.mood_score,
    };

    // Only add note if it exists
    if (moodData.note) {
      requestBody.note = moodData.note;
    }

    const response = await fetch(`${config.WEB_URL}/api/moods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[MoodService] Failed to create mood entry:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      throw new Error(data.message || `Failed to create mood entry (${response.status})`);
    }

    console.log('[MoodService] Mood entry created successfully:', data);
    return data;

  } catch (error) {
    console.error('[MoodService] Error creating mood entry:', error);
    throw error;
  }
};

