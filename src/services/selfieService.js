import config from '../config/config';
import { getUserToken } from './authService';

/**
 * Upload a selfie photo to the server
 * @param {string} photoUri - The URI of the photo from camera
 * @param {string} base64Data - The base64 encoded photo data
 * @param {number} moodEntryId - Optional mood entry ID to attach photo to
 */
export async function uploadSelfie(photoUri, base64Data, moodEntryId = null) {
  try {
    const token = await getUserToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('[SelfieService] Uploading selfie...');
    console.log('[SelfieService] Photo URI:', photoUri);
    console.log('[SelfieService] Has mood entry:', !!moodEntryId);

    // Prepare request body
    const body = {
      photo: `data:image/jpeg;base64,${base64Data}`,
    };

    if (moodEntryId) {
      body.mood_entry_id = moodEntryId;
    }

    const response = await fetch(`${config.WEB_URL}/api/selfies/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[SelfieService] Upload failed:', data);
      throw new Error(data.message || 'Failed to upload photo');
    }

    console.log('[SelfieService] ✅ Upload successful:', data);
    return data;

  } catch (error) {
    console.error('[SelfieService] ❌ Upload error:', error);
    throw error;
  }
}

/**
 * Get user's selfies from the server
 * @param {number} limit - Number of selfies to fetch
 */
export async function getSelfies(limit = 50) {
  try {
    const token = await getUserToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${config.WEB_URL}/api/selfies?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch selfies');
    }

    return data.selfies;

  } catch (error) {
    console.error('[SelfieService] Error fetching selfies:', error);
    throw error;
  }
}

/**
 * Delete a selfie
 * @param {number} id - Mood entry ID
 */
export async function deleteSelfie(id) {
  try {
    const token = await getUserToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${config.WEB_URL}/api/selfies/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete selfie');
    }

    return data;

  } catch (error) {
    console.error('[SelfieService] Error deleting selfie:', error);
    throw error;
  }
}
