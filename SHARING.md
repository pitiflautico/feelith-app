# Sharing Integration Guide

This document explains how to implement native sharing functionality in your web application that works with this React Native base app.

## Overview

The app includes native sharing capabilities that allow users to share content from your web application to other apps on their device (WhatsApp, Email, social media, etc.).

## How It Works

1. Your web application sends a sharing request via `postMessage`
2. The React Native app receives the message
3. The native Share API is triggered
4. The user selects where to share the content

## Configuration

### Enable/Disable Sharing

In `src/config/config.js`:

```javascript
FEATURES: {
  SHARING: true, // Set to false to disable sharing
}
```

## Web Application Integration

### PostMessage Protocol

Your web application should send a message with the following structure:

```javascript
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'share',
  url: 'https://example.com/page',           // Optional: URL to share
  text: 'Check out this content!',            // Optional: Text to share
  title: 'Amazing Content',                   // Optional: Title (iOS only)
  message: 'I found this interesting...'      // Optional: Additional message
}));
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | **Yes** | Must be `'share'` |
| `url` | string | No | URL to share (preferred for links) |
| `text` | string | No | Text content to share |
| `title` | string | No | Title for the share dialog (iOS only) |
| `message` | string | No | Additional message to include with URL |

**Note:** You must provide either `url` or `text` (or both). The app will prioritize `url` if both are provided.

## Implementation Examples

### Example 1: Share a URL

```javascript
function shareArticle(articleUrl, articleTitle) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      action: 'share',
      url: articleUrl,
      title: articleTitle,
      message: 'Check out this article!'
    }));
  } else {
    // Fallback for web browsers
    if (navigator.share) {
      navigator.share({
        url: articleUrl,
        title: articleTitle,
        text: 'Check out this article!'
      });
    }
  }
}

// Usage
shareArticle('https://example.com/article/123', 'Amazing Article');
```

### Example 2: Share Text Only

```javascript
function shareQuote(quote, author) {
  const textToShare = `"${quote}" - ${author}`;

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      action: 'share',
      text: textToShare,
      title: 'Inspiring Quote'
    }));
  } else {
    // Fallback for web
    if (navigator.share) {
      navigator.share({
        text: textToShare,
        title: 'Inspiring Quote'
      });
    }
  }
}

// Usage
shareQuote('To be or not to be', 'Shakespeare');
```

### Example 3: React Component

```jsx
import React from 'react';

function ShareButton({ url, title, description }) {
  const handleShare = () => {
    // Check if running in React Native WebView
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        action: 'share',
        url: url,
        title: title,
        message: description
      }));
    } else {
      // Web fallback
      if (navigator.share) {
        navigator.share({
          url: url,
          title: title,
          text: description
        }).catch((error) => {
          console.log('Error sharing:', error);
        });
      } else {
        // Final fallback - copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    }
  };

  return (
    <button onClick={handleShare} className="share-button">
      <svg>...</svg> Share
    </button>
  );
}

export default ShareButton;
```

### Example 4: Vue Component

```vue
<template>
  <button @click="handleShare" class="share-button">
    Share
  </button>
</template>

<script>
export default {
  props: {
    url: String,
    title: String,
    message: String
  },
  methods: {
    handleShare() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'share',
          url: this.url,
          title: this.title,
          message: this.message
        }));
      } else {
        // Web fallback
        if (navigator.share) {
          navigator.share({
            url: this.url,
            title: this.title,
            text: this.message
          });
        }
      }
    }
  }
}
</script>
```

## Authentication Requirement

**Important:** Sharing is only available for authenticated users. If a user tries to share without being logged in, the request will be blocked.

The app checks the authentication status before allowing sharing operations.

## Platform Differences

### iOS
- Supports `title` parameter
- Shows native share sheet with app icons
- Includes AirDrop, Messages, Mail, etc.

### Android
- Ignores `title` parameter (uses `message` instead)
- Shows native share intent selector
- Includes installed apps that support sharing

## Testing Sharing

To test sharing functionality:

1. **Enable debug mode** in `src/config/config.js`:
   ```javascript
   DEBUG: true
   ```

2. **Log in** to your web application

3. **Trigger a share** from your web app

4. **Check console logs** for debugging:
   ```
   [HomeScreen] Share requested: { url: '...', title: '...' }
   [SharingService] Sharing URL: { url: '...', title: '...' }
   [HomeScreen] ✅ Content shared successfully
   ```

5. **Native share dialog** should appear on the device

## Troubleshooting

### Sharing Not Working

**Problem:** Share button does nothing

**Solutions:**
1. Check if `FEATURES.SHARING` is `true` in config
2. Verify user is logged in
3. Check browser console for errors
4. Ensure `window.ReactNativeWebView` exists

### Share Dialog Not Appearing

**Problem:** No share sheet shown

**Solutions:**
1. Check device logs in Expo
2. Verify sharing is available on the device
3. Ensure URL/text parameters are valid strings

### Share Cancelled

**Note:** If the user cancels the share dialog, this is normal behavior. The app logs:
```
[HomeScreen] ⚠️ Share cancelled or failed
```

## Best Practices

1. **Always provide fallbacks** for web browsers
2. **Keep messages concise** - long text may be truncated
3. **Test on both platforms** - iOS and Android behave differently
4. **Handle errors gracefully** - sharing might not always be available
5. **Don't spam share dialogs** - wait for user interaction

## Security Notes

- Sharing requires authentication to prevent abuse
- The app validates all parameters before sharing
- Invalid URLs or text will be rejected
- Feature can be disabled globally in config

## Advanced: Sharing Files

Currently, this implementation supports URL and text sharing. For file sharing (images, PDFs, etc.), you would need to:

1. Generate the file on the backend
2. Send a URL to the file via `postMessage`
3. The app will share the URL (not download the file)

For true file sharing, additional implementation is required using `expo-sharing` with local file URIs.

---

## Summary

**Minimum working example:**

```javascript
// In your web app
function share() {
  window.ReactNativeWebView.postMessage(JSON.stringify({
    action: 'share',
    url: window.location.href,
    title: document.title
  }));
}
```

That's it! The React Native app handles the rest.
