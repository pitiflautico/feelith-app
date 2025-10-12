# Deep Linking Integration Guide

This document explains how to configure and use deep linking in your React Native base app. Deep linking allows users to open your app from URLs in messages, emails, websites, and other apps.

## Overview

This app supports three types of deep linking:

1. **Custom URL Schemes** (`yourapp://path`) - Works immediately, no server setup
2. **Universal Links (iOS)** (`https://yourdomain.com/path`) - Requires server setup
3. **App Links (Android)** (`https://yourdomain.com/path`) - Requires server setup

## Configuration

### Step 1: Update Config

In `src/config/config.js`, configure your app's deep linking settings:

```javascript
// Enable/disable feature
FEATURES: {
  DEEP_LINKING: true,
}

// Custom URL scheme (e.g., "myapp" allows myapp://calendar)
DEEP_LINK_SCHEME: 'yourapp',

// Domains for Universal Links / App Links
ASSOCIATED_DOMAINS: [
  'yourdomain.com',
  'www.yourdomain.com',
],

// Bundle identifiers
IOS_BUNDLE_ID: 'com.yourcompany.yourapp',
ANDROID_PACKAGE: 'com.yourcompany.yourapp',
```

### Step 2: Rebuild App

After changing the config, rebuild your app:

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

The `app.config.js` will automatically apply these settings.

## Custom URL Schemes

Custom URL schemes work immediately without server configuration.

### Format

```
yourscheme://path/to/page?param=value
```

### Examples

If your `DEEP_LINK_SCHEME` is `myapp`:

```
myapp://                    → Opens app at home
myapp://calendar            → Opens app at /calendar
myapp://profile/123         → Opens app at /profile/123
myapp://settings?tab=push   → Opens app at /settings?tab=push
```

### How to Test

**From Terminal (iOS Simulator):**
```bash
xcrun simctl openurl booted "myapp://calendar"
```

**From Terminal (Android Emulator):**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "myapp://calendar"
```

**From Safari (iOS Device):**
1. Open Safari
2. Type in address bar: `myapp://calendar`
3. Press Go
4. App should open

**From Another App:**
```html
<a href="myapp://calendar">Open Calendar</a>
```

## Universal Links (iOS) & App Links (Android)

Universal Links allow your app to open from `https://` URLs instead of custom schemes.

### Benefits

- More professional (uses your actual domain)
- Falls back to website if app not installed
- No browser prompt asking "Open in app?"
- Better for SEO and sharing

### Requirements

1. **HTTPS domain** you control
2. **Server access** to serve association files
3. **App configuration** (handled by app.config.js)
4. **Domain verification**

---

## Server-Side Setup

### iOS: Apple App Site Association

Create and serve this file at:
```
https://yourdomain.com/.well-known/apple-app-site-association
```

**File content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourcompany.yourapp",
        "paths": ["*"]
      }
    ]
  }
}
```

**Important:**
- Replace `TEAMID` with your Apple Team ID (find it in Apple Developer account)
- Replace `com.yourcompany.yourapp` with your `IOS_BUNDLE_ID`
- Must be served with `Content-Type: application/json`
- Must use HTTPS
- No file extension (not `.json`)

**Find your Team ID:**
1. Go to https://developer.apple.com/account
2. Click "Membership" in sidebar
3. Copy the Team ID

**Restrict paths (optional):**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourcompany.yourapp",
        "paths": [
          "/calendar/*",
          "/profile/*",
          "/events/*"
        ]
      }
    ]
  }
}
```

### Android: Asset Links

Create and serve this file at:
```
https://yourdomain.com/.well-known/assetlinks.json
```

**File content:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.yourapp",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**Important:**
- Replace `com.yourcompany.yourapp` with your `ANDROID_PACKAGE`
- Must be served with `Content-Type: application/json`
- Must use HTTPS

**Get your SHA256 fingerprint:**

For **debug builds** (testing):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For **production builds**:
```bash
keytool -list -v -keystore your-release-key.keystore
```

Copy the SHA256 fingerprint and add it to the JSON file.

**For Google Play builds:**
You'll need BOTH your signing key fingerprint AND Google Play's signing key fingerprint. Find the Google Play one in:
- Google Play Console → Your App → Setup → App Integrity → App signing

---

## Server Configuration Examples

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Apple App Site Association
    location /.well-known/apple-app-site-association {
        default_type application/json;
        alias /path/to/apple-app-site-association;
    }

    # Android Asset Links
    location /.well-known/assetlinks.json {
        default_type application/json;
        alias /path/to/assetlinks.json;
    }

    # ... rest of your config
}
```

### Apache

```apache
<VirtualHost *:443>
    ServerName yourdomain.com

    # Apple App Site Association
    <Location /.well-known/apple-app-site-association>
        ForceType application/json
    </Location>

    # Android Asset Links
    <Location /.well-known/assetlinks.json>
        ForceType application/json
    </Location>

    # ... rest of your config
</VirtualHost>
```

### Node.js/Express

```javascript
const express = require('express');
const app = express();

// Apple App Site Association
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.type('application/json');
  res.sendFile('/path/to/apple-app-site-association');
});

// Android Asset Links
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.type('application/json');
  res.sendFile('/path/to/assetlinks.json');
});
```

### Django

```python
from django.http import JsonResponse, HttpResponse
from django.views import View
import json

class AppleAppSiteAssociation(View):
    def get(self, request):
        data = {
            "applinks": {
                "apps": [],
                "details": [{
                    "appID": "TEAMID.com.yourcompany.yourapp",
                    "paths": ["*"]
                }]
            }
        }
        return JsonResponse(data)

class AssetLinks(View):
    def get(self, request):
        data = [{
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "android_app",
                "package_name": "com.yourcompany.yourapp",
                "sha256_cert_fingerprints": [
                    "YOUR_SHA256_FINGERPRINT"
                ]
            }
        }]
        return JsonResponse(data, safe=False)

# urls.py
urlpatterns = [
    path('.well-known/apple-app-site-association',
         AppleAppSiteAssociation.as_view()),
    path('.well-known/assetlinks.json',
         AssetLinks.as_view()),
]
```

---

## Testing Universal Links / App Links

### Verify Server Setup

**iOS (Apple's Validator):**
```
https://search.developer.apple.com/appsearch-validation-tool/
```
Enter your domain and check if the file is valid.

**Android:**
```bash
# Test if file is accessible
curl https://yourdomain.com/.well-known/assetlinks.json

# Validate with Google
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yourdomain.com&relation=delegate_permission/common.handle_all_urls
```

### Test on Device

**iOS:**
1. Build and install app on device
2. Open Notes app
3. Type: `https://yourdomain.com/calendar`
4. Tap the link
5. App should open (no browser prompt)

**Important iOS Notes:**
- Universal Links don't work in Safari address bar
- They work from other apps (Messages, Notes, Mail, etc.)
- First time might show "Open in App" banner
- Long-press link to see "Open in [Your App]"

**Android:**
1. Build and install app on device
2. Open any app (Messages, Chrome, etc.)
3. Tap link: `https://yourdomain.com/calendar`
4. Should show "Open with [Your App]" option
5. Select "Always" to remember choice

### Debugging

**iOS:**
Enable logging on device:
1. Settings → Developer → Associated Domains Development
2. Install app
3. Check Console.app for "swcd" process logs

**Android:**
Check logs:
```bash
adb logcat | grep -i "intent"
```

---

## How Deep Links Work in This App

When a deep link is opened:

1. **App receives URL** → `deepLinkService.js` parses it
2. **Extract path** → `/calendar` from `myapp://calendar` or `https://yourdomain.com/calendar`
3. **Convert to web URL** → `http://127.0.0.1:8000/calendar` (using `config.WEB_URL`)
4. **Navigate WebView** → WebView loads the new URL

### Path Mapping

The app automatically maps deep link paths to web URLs:

| Deep Link | Web URL (if WEB_URL = 'https://mysite.com') |
|-----------|----------------------------------------------|
| `myapp://` | `https://mysite.com/` |
| `myapp://calendar` | `https://mysite.com/calendar` |
| `myapp://profile/123` | `https://mysite.com/profile/123` |
| `https://yourdomain.com/calendar` | `https://mysite.com/calendar` |

**Important:** Deep links navigate to your configured `WEB_URL`, not to the domain in the deep link itself.

---

## Troubleshooting

### iOS: Universal Links Not Working

**Problem:** Links open in Safari instead of app

**Solutions:**
1. Verify apple-app-site-association is accessible and valid
2. Check Team ID and Bundle ID are correct
3. Try on a real device (simulator behavior differs)
4. Uninstall and reinstall app
5. Clear Safari cache
6. Wait 15 minutes after installing (iOS caches association files)
7. Don't type in Safari address bar - tap links from other apps

### Android: App Links Not Working

**Problem:** Shows "Open with" dialog or opens browser

**Solutions:**
1. Verify assetlinks.json is accessible and valid
2. Check SHA256 fingerprint matches your build
3. For Google Play: add both signing keys
4. Clear default app associations in Settings
5. Uninstall and reinstall app
6. Check `adb logcat` for errors

### Deep Link Opens Wrong Page

**Check:**
1. Path mapping in `deepLinkService.js`
2. `WEB_URL` is correct in config
3. Console logs show correct URL conversion

### Deep Link Doesn't Open App

**Check:**
1. `FEATURES.DEEP_LINKING` is `true`
2. App is installed
3. URL scheme matches `DEEP_LINK_SCHEME`
4. For Universal Links: server files are correctly configured

---

## Best Practices

1. **Use Universal Links in production** - More professional than custom schemes
2. **Keep paths simple** - `/calendar` not `/app/v1/calendar`
3. **Test on real devices** - Simulators/emulators behave differently
4. **Monitor analytics** - Track which deep links are used
5. **Handle unknown paths gracefully** - Default to home page
6. **Update association files** when changing Bundle ID or Team ID
7. **Document your deep links** - Create a list of supported URLs

---

## Summary Checklist

### Basic Setup (Custom URL Scheme)
- [x] Update `DEEP_LINK_SCHEME` in config
- [x] Rebuild app
- [x] Test with custom URLs

### Advanced Setup (Universal Links / App Links)
- [ ] Update `ASSOCIATED_DOMAINS` in config
- [ ] Get Apple Team ID (iOS)
- [ ] Get SHA256 fingerprint (Android)
- [ ] Create `apple-app-site-association` file
- [ ] Create `assetlinks.json` file
- [ ] Upload files to server at `/.well-known/`
- [ ] Verify files are accessible via HTTPS
- [ ] Validate with Apple's tool (iOS)
- [ ] Validate with Google's API (Android)
- [ ] Rebuild app with production credentials
- [ ] Test on real devices

---

## Need Help?

- iOS Universal Links: https://developer.apple.com/ios/universal-links/
- Android App Links: https://developer.android.com/training/app-links
- Expo Linking: https://docs.expo.dev/guides/linking/
