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
 * @param {string} moodData.calendar_event_id - Calendar event ID (optional)
 * @param {string} moodData.entry_type - Entry type: 'manual' or 'selfie' (optional)
 * @param {string} moodData.face_expression - Face expression (optional, for selfie entries)
 * @param {number} moodData.face_expression_confidence - Expression confidence (optional, 0-1)
 * @param {string} moodData.face_energy_level - Energy level (optional, 'low', 'medium', 'high')
 * @param {number} moodData.face_eyes_openness - Eyes openness (optional, 0-1)
 * @param {string} moodData.face_social_context - Social context (optional, 'alone', 'with_one', 'group')
 * @param {number} moodData.face_total_faces - Total faces detected (optional)
 * @param {number} moodData.bpm - Heart rate (optional)
 * @param {string} moodData.environment_brightness - Environment brightness (optional, 'pleasant', 'neutral', 'dim', 'dark')
 * @param {object} moodData.face_analysis_raw - Raw analysis data (optional)
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

    // Add optional fields if they exist
    if (moodData.note) {
      requestBody.note = moodData.note;
    }

    if (moodData.calendar_event_id) {
      requestBody.calendar_event_id = moodData.calendar_event_id;
    }

    if (moodData.entry_type) {
      requestBody.entry_type = moodData.entry_type;
    }

    // Add face analysis fields if provided
    if (moodData.face_expression) {
      requestBody.face_expression = moodData.face_expression;
    }
    if (moodData.face_expression_confidence !== undefined) {
      requestBody.face_expression_confidence = moodData.face_expression_confidence;
    }
    if (moodData.face_energy_level) {
      requestBody.face_energy_level = moodData.face_energy_level;
    }
    if (moodData.face_eyes_openness !== undefined) {
      requestBody.face_eyes_openness = moodData.face_eyes_openness;
    }
    if (moodData.face_social_context) {
      requestBody.face_social_context = moodData.face_social_context;
    }
    if (moodData.face_total_faces !== undefined) {
      requestBody.face_total_faces = moodData.face_total_faces;
    }
    if (moodData.bpm !== undefined) {
      requestBody.bpm = moodData.bpm;
    }
    if (moodData.environment_brightness) {
      requestBody.environment_brightness = moodData.environment_brightness;
    }
    if (moodData.face_analysis_raw) {
      requestBody.face_analysis_raw = moodData.face_analysis_raw;
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

