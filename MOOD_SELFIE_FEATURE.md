# Mood Selfie Feature Documentation

## Overview

The Mood Selfie feature allows users to capture their mood through facial expression analysis using ML Kit Face Detection. The system analyzes facial expressions, energy levels, and environmental conditions to automatically suggest a mood score.

## Technology Stack

- **React Native 0.81.4**
- **Expo SDK 54**
- **@react-native-ml-kit/face-detection v2.0.1** - Google ML Kit for facial analysis
- **expo-image-manipulator** - Image processing and horizontal flip for iOS
- **Expo Router** - Navigation

## Architecture

### Flow

1. User taps camera icon in Mood Entry screen header
2. `MoodSelfieCameraScreen` opens with front camera
3. Real-time face detection analyzes expressions
4. User captures photo
5. `MoodSelfieConfirmScreen` shows results and allows adjustments
6. Data is sent to backend API with `entry_type: 'selfie'`

### Key Files

#### Mobile App (karma-mobile)

- `/src/screens/MoodSelfieCameraScreen.js` - Camera + ML Kit face detection
- `/src/screens/MoodSelfieConfirmScreen.js` - Review and confirm analysis results
- `/src/screens/MoodEntryScreen.js` - Main mood entry (opens camera)
- `/src/services/moodService.js` - API communication
- `/app/(tabs)/new.js` - Direct navigation to mood entry

#### Backend (karma)

- `/app/Http/Controllers/Api/MoodApiController.php` - API endpoints
- `/app/Models/MoodEntry.php` - Mood entry model
- `/resources/views/components/mood-card.blade.php` - Mood history card rendering
- `/app/Livewire/MoodHistory.php` - Mood history component

## Face Analysis Algorithm

### Expression Detection (8 categories)

The system classifies facial expressions into 8 distinct categories:

```javascript
const expressions = {
  'very_happy': 10,     // 😄 Very happy
  'happy': 9,           // 😊 Happy
  'content': 7,         // 🙂 Content
  'slight_smile': 6,    // 😌 Slight smile
  'neutral': 5,         // 😐 Neutral/Serious
  'tired': 3,           // 😪 Tired
  'very_tired': 2,      // 😴 Very tired
  'sad': 1,             // 😢 Sad
};
```

### Algorithm Details

The expression classification uses ML Kit's face detection with the following logic:

1. **Smile Detection** (`smilingProbability`)
2. **Eyes Openness** (`leftEyeOpenProbability`, `rightEyeOpenProbability`)
3. **Head Angles** (`headEulerAngleX`, `headEulerAngleY`)

**Classification Logic:**

- **Very Happy**: `smilingProbability >= 0.75` + eyes open
- **Happy**: `0.40 <= smilingProbability < 0.75`
- **Content**: `0.25 <= smilingProbability < 0.40`
- **Slight Smile**: `0.12 <= smilingProbability < 0.25`
- **Neutral/Serious**: `smilingProbability < 0.12` + eyes open + head not down
- **Tired**: Low eye openness `(< 0.65)` + slight alertness
- **Very Tired**: Very low eye openness `(< 0.4)`
- **Sad**: Head tilted down + no smile

### Energy Level Detection

Based on eye openness average:

- **High (⚡)**: `eyesOpenness >= 0.75`
- **Medium (🔋)**: `0.4 < eyesOpenness < 0.75`
- **Low (🪫)**: `eyesOpenness <= 0.4`

### Environment Brightness

Calculated from camera frame average brightness:

- **Pleasant (☀️)**: Average luminance >= 0.60
- **Neutral (🌤️)**: 0.35 <= luminance < 0.60
- **Dim (🌙)**: 0.15 <= luminance < 0.35
- **Dark (🌑)**: luminance < 0.15

### iOS Camera Fix

iOS front camera requires horizontal flip to correct face detection coordinates:

```javascript
import * as ImageManipulator from 'expo-image-manipulator';

const flippedImage = await ImageManipulator.manipulateAsync(
  photo.uri,
  [{ flip: ImageManipulator.FlipType.Horizontal }],
  { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
);
```

## Data Structure

### Mood Entry Payload (Mobile → Backend)

```json
{
  "user_id": "uuid",
  "mood_score": 7,
  "note": "Feeling good after morning workout",
  "calendar_event_id": "uuid-or-null",
  "entry_type": "selfie",  // or "manual"

  // Face Analysis Data
  "face_expression": "happy",
  "face_expression_confidence": 0.85,
  "face_energy_level": "high",
  "face_eyes_openness": 0.92,
  "face_social_context": "alone",
  "face_total_faces": 1,

  // Environment Data
  "environment_brightness": "pleasant",

  // Optional: Heart rate
  "bpm": 72,

  // Raw ML Kit data (for debugging)
  "face_analysis_raw": {}
}
```

### Database Schema

Table: `mood_entries`

```sql
-- Entry metadata
entry_type VARCHAR(20) NULL                    -- 'manual' | 'selfie'

-- Selfie paths (future feature)
selfie_photo_path VARCHAR NULL
selfie_heatmap_path VARCHAR NULL
selfie_taken_at TIMESTAMP NULL

-- Face analysis
face_expression VARCHAR(50) NULL               -- Expression category
face_expression_confidence DECIMAL(5,4) NULL   -- 0.0 - 1.0
face_energy_level VARCHAR(20) NULL             -- 'low' | 'medium' | 'high'
face_eyes_openness DECIMAL(5,4) NULL           -- 0.0 - 1.0
face_social_context VARCHAR(20) NULL           -- 'alone' | 'with_one' | 'group'
face_total_faces INTEGER NULL                  -- Number of faces detected

-- Physiological data
bpm INTEGER NULL                               -- Heart rate (30-220)

-- Environment
environment_brightness VARCHAR(20) NULL        -- 'pleasant' | 'neutral' | 'dim' | 'dark'

-- Raw data
face_analysis_raw JSON NULL                    -- Complete ML Kit output
```

## API Endpoints

### POST /api/moods

Creates a new mood entry.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "mood_score": 1-10,
  "note": "string (max 500 chars)",
  "calendar_event_id": "uuid (optional)",
  "entry_type": "manual | selfie (optional)",
  "face_expression": "string (optional)",
  "face_expression_confidence": "0.0-1.0 (optional)",
  "face_energy_level": "string (optional)",
  "face_eyes_openness": "0.0-1.0 (optional)",
  "face_social_context": "string (optional)",
  "face_total_faces": "integer (optional)",
  "bpm": "30-220 (optional)",
  "environment_brightness": "string (optional)",
  "face_analysis_raw": "object (optional)"
}
```

**Response (201)**:
```json
{
  "message": "Mood entry created successfully",
  "mood": { /* MoodEntry object */ }
}
```

### GET /api/moods

Retrieves user's mood entries with pagination.

**Response (200)**:
```json
{
  "moods": {
    "data": [ /* Array of MoodEntry objects */ ],
    "current_page": 1,
    "per_page": 20,
    ...
  }
}
```

## Frontend Display

### Mood History Card

Selfie entries display additional metadata:

```blade
<h4>{{ $mood->mood_name }}</h4>
@if($mood->entry_type === 'selfie')
    <span>📸</span>  <!-- Selfie indicator -->

    <!-- Metadata badges -->
    @if($mood->face_energy_level)
        <span>⚡ High energy</span>  <!-- or 🔋 Medium / 🪫 Low -->
    @endif

    @if($mood->environment_brightness)
        <span>☀️ Pleasant</span>  <!-- or 🌤️ Neutral / 🌙 Dim / 🌑 Dark -->
    @endif
@endif
```

## Testing

### Manual Testing Checklist

- [ ] Camera opens correctly
- [ ] Face detection works in real-time
- [ ] Expression changes reflect in UI
- [ ] Energy level updates based on eye openness
- [ ] Environment brightness calculates correctly
- [ ] iOS horizontal flip works
- [ ] Photo capture succeeds
- [ ] Confirmation screen shows correct data
- [ ] Mood score can be adjusted
- [ ] Note can be added
- [ ] Save creates entry in database
- [ ] Mood history shows selfie indicator (📸)
- [ ] Mood history displays energy + environment for selfies
- [ ] Manual entries don't show selfie metadata

### Known Issues

1. **iOS Camera Flip**: Front camera on iOS requires horizontal flip transformation to correctly map face detection coordinates. Implemented in `MoodSelfieCameraScreen.js` using `expo-image-manipulator`.

2. **Expression Classification**: "Serious" expression is now mapped to "neutral" (both use 😐 emoji) as they represent similar neutral emotional states.

## Future Enhancements

1. **Selfie Photo Storage**: Upload and store actual selfie photos (currently only metadata is saved)
2. **Heart Rate Detection**: Integrate heart rate monitoring from camera feed
3. **Mood Heatmap**: Generate heatmaps showing mood distribution over time
4. **Social Context**: Enhanced social context detection (alone, with_one, group)
5. **Historical Analysis**: Trend analysis of expressions over time

## Troubleshooting

### Face Not Detected

- Ensure good lighting
- Face camera directly
- Keep face centered
- Remove sunglasses/masks

### Incorrect Expression

- Expressions update in real-time - wait for stable reading
- User can manually adjust mood score in confirmation screen

### iOS Build Issues

Ensure Info.plist includes:

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to capture mood selfies.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to save your mood selfies.</string>
```

## Performance Considerations

- Face detection runs at ~10fps on most devices
- Image processing (flip) adds ~100-200ms on iOS
- Environment brightness calculation is optimized to run once per capture
- ML Kit caching improves subsequent detections

## Privacy & Security

- **No Photo Upload**: Currently only metadata is sent to server
- **Local Processing**: All ML analysis happens on-device
- **User Consent**: Camera permissions required
- **Data Minimization**: Only necessary metadata stored

---

**Last Updated**: October 19, 2025
**Version**: 1.0
**Contributors**: Development Team
