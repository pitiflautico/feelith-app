# Authentication Protocol

## Overview

This document explains how to implement authentication communication between your web application and the native mobile app. The web app runs inside a WebView and communicates with the native layer using `postMessage`.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Login Flow](#login-flow)
3. [Logout Flow](#logout-flow)
4. [Session Persistence](#session-persistence)
5. [Implementation Examples](#implementation-examples)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Login Implementation

```javascript
// After successful authentication in your web app
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'loginSuccess',
  userId: 'user-uuid-123',
  userToken: 'jwt-token-or-session-token'
}));
```

### Minimal Logout Implementation

```javascript
// When user logs out
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'logout'
}));
```

---

## Login Flow

### Complete Login Message Format

```javascript
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'loginSuccess',
  userId: 'user-uuid-123',              // Required
  userToken: 'jwt-token-or-session',    // Required
  pushTokenEndpoint: 'https://api.yourapp.com/push/register'  // Optional
}));
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ Yes | Must be `"loginSuccess"` |
| `userId` | string | ✅ Yes | Unique user identifier (UUID recommended) |
| `userToken` | string | ✅ Yes | Authentication token (JWT, session token, etc.) |
| `pushTokenEndpoint` | string | ⚠️ Optional | Backend URL to register push notifications |

### What Happens on the Native Side

1. **Receives the message** and validates the format
2. **Stores securely** using iOS Keychain / Android Keystore:
   - `userId` → Encrypted storage
   - `userToken` → Encrypted storage
   - `isLoggedIn: true` flag
3. **Registers push token** (if `pushTokenEndpoint` provided):
   - Requests notification permissions from user
   - Gets device push token
   - Sends POST request to your endpoint (see [PUSH_TOKEN_PROTOCOL.md](./PUSH_TOKEN_PROTOCOL.md))
4. **Updates UI** to reflect logged-in state

### Flow Diagram

```
┌─────────────┐                    ┌──────────────┐                  ┌─────────────┐
│  Web App    │                    │  Native App  │                  │   Backend   │
│  (WebView)  │                    │   (React)    │                  │   Server    │
└──────┬──────┘                    └──────┬───────┘                  └──────┬──────┘
       │                                  │                                  │
       │  User logs in with Google/Email │                                  │
       │─────────────────────────────────>                                  │
       │                                  │                                  │
       │  postMessage(loginSuccess)       │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │  Save to SecureStore             │
       │                                  │──────────┐                       │
       │                                  │          │                       │
       │                                  │<─────────┘                       │
       │                                  │                                  │
       │                                  │  POST /push/register             │
       │                                  │  (userId, pushToken, platform)   │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │                                  │  200 OK                          │
       │                                  │<─────────────────────────────────│
       │                                  │                                  │
       │  User is logged in ✅            │                                  │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

---

## Logout Flow

### Complete Logout Message Format

```javascript
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'logout',
  pushTokenEndpoint: 'https://api.yourapp.com/push/register'  // Optional
}));
```

### Fields Description

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ Yes | Must be `"logout"` |
| `pushTokenEndpoint` | string | ⚠️ Optional | Same endpoint as login (for unregistering push token) |

### What Happens on the Native Side

1. **Unregisters push token** (if `pushTokenEndpoint` provided):
   - Sends POST with `{ remove: true }` flag
2. **Clears SecureStore**:
   - Deletes `userId`
   - Deletes `userToken`
   - Sets `isLoggedIn: false`
3. **Updates UI** to logged-out state

---

## Session Persistence

### How It Works

- The native app uses **SecureStore** (iOS Keychain / Android Keystore) to store credentials
- When the app starts, it automatically checks for stored credentials
- If found and valid, the user remains logged in

### On App Startup

```
┌──────────────┐
│  App Starts  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ Check SecureStore        │
│ - userId exists?         │
│ - userToken exists?      │
└──────┬───────────────────┘
       │
       ├─── YES ──> User is logged in ✅
       │            (WebView loads with session)
       │
       └─── NO ──> User is logged out ❌
                   (WebView loads login page)
```

### Session Validation

**Option 1: Web-side validation (Recommended)**
- Native app stores `userId` and `userToken`
- Web app validates session on page load
- If invalid, web app shows login screen
- User logs in again → sends `loginSuccess` message

**Option 2: Native-side validation**
- Add endpoint validation in native app
- Ping your API on startup: `GET /api/auth/validate`
- If `401 Unauthorized`, clear SecureStore
- Show login screen

---

## Implementation Examples

### Example 1: React with Google OAuth

```jsx
import React, { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const handleGoogleSuccess = async (credentialResponse) => {
    // 1. Send token to your backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: credentialResponse.credential
      })
    });

    const { userId, sessionToken } = await response.json();

    // 2. Notify native app
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        action: 'loginSuccess',
        userId: userId,
        userToken: sessionToken,
        pushTokenEndpoint: 'https://api.yourapp.com/push/register'
      }));
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
}
```

### Example 2: Vanilla JavaScript Email/Password

```javascript
// After your login form submission
async function handleLogin(email, password) {
  try {
    // 1. Authenticate with your backend
    const response = await fetch('https://api.yourapp.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // 2. Notify native app if running in WebView
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'loginSuccess',
          userId: data.user.id,
          userToken: data.token,
          pushTokenEndpoint: 'https://api.yourapp.com/push/register'
        }));
      }

      // 3. Save to web storage (cookies/localStorage) for web version
      localStorage.setItem('authToken', data.token);

      // 4. Redirect to dashboard
      window.location.href = '/dashboard';
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

### Example 3: Vue.js with Pinia Store

```javascript
// stores/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  actions: {
    async login(email, password) {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const { userId, token } = await response.json();

      // Notify native app
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'loginSuccess',
          userId,
          userToken: token,
          pushTokenEndpoint: import.meta.env.VITE_PUSH_ENDPOINT
        }));
      }

      this.userId = userId;
      this.token = token;
    },

    logout() {
      // Notify native app
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'logout',
          pushTokenEndpoint: import.meta.env.VITE_PUSH_ENDPOINT
        }));
      }

      this.userId = null;
      this.token = null;
    }
  }
});
```

### Example 4: NextAuth.js Integration

```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Notify native app
      if (typeof window !== 'undefined' && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'loginSuccess',
          userId: user.id,
          userToken: account.id_token,
          pushTokenEndpoint: process.env.NEXT_PUBLIC_PUSH_ENDPOINT
        }));
      }
      return true;
    },
    async signOut() {
      // Notify native app
      if (typeof window !== 'undefined' && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'logout',
          pushTokenEndpoint: process.env.NEXT_PUBLIC_PUSH_ENDPOINT
        }));
      }
    }
  }
});
```

### Example 5: Auto-login on App Startup

```javascript
// Check if user is already logged in when page loads
window.addEventListener('load', async () => {
  // Only run in native app
  if (!window.ReactNativeWebView) return;

  // Check if you have a session
  const sessionToken = getCookie('sessionToken'); // or localStorage

  if (sessionToken) {
    try {
      // Validate session with backend
      const response = await fetch('/api/auth/validate', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });

      if (response.ok) {
        const { userId } = await response.json();

        // Re-register with native app (in case it was cleared)
        window.ReactNativeWebView.postMessage(JSON.stringify({
          action: 'loginSuccess',
          userId,
          userToken: sessionToken,
          pushTokenEndpoint: 'https://api.yourapp.com/push/register'
        }));
      }
    } catch (error) {
      console.error('Session validation failed:', error);
    }
  }
});
```

---

## Security Best Practices

### ✅ DO

1. **Use HTTPS only** for your web app
2. **Validate tokens** on every request in your backend
3. **Use short-lived tokens** (JWT with expiration)
4. **Implement token refresh** mechanism
5. **Sanitize user inputs** before sending to native
6. **Check for ReactNativeWebView** before posting messages:
   ```javascript
   if (window.ReactNativeWebView) {
     window.ReactNativeWebView.postMessage(/* ... */);
   }
   ```
7. **Log authentication events** for auditing
8. **Use UUIDs** for userId (not sequential integers)

### ❌ DON'T

1. **Don't send passwords** in postMessage (only send tokens)
2. **Don't log sensitive data** in production
3. **Don't trust client-side validation only**
4. **Don't expose API keys** in web code
5. **Don't use predictable user IDs**
6. **Don't skip token validation** on the backend
7. **Don't store sensitive data** in localStorage/sessionStorage without encryption

### Token Security

#### JWT Token Example (Recommended)

```javascript
// Your backend generates JWT
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  },
  process.env.JWT_SECRET
);

// Send to web → web sends to native
```

#### Token Validation Middleware

```javascript
// Express.js middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Use in routes
app.post('/api/push/register', authenticateToken, (req, res) => {
  // req.user.userId is now available and verified
});
```

---

## Troubleshooting

### Issue 1: Native app not receiving messages

**Symptoms:**
- postMessage called but nothing happens
- No logs in native app console

**Solutions:**
```javascript
// 1. Check if ReactNativeWebView exists
console.log('ReactNativeWebView exists:', !!window.ReactNativeWebView);

// 2. Ensure message is valid JSON
const message = {
  action: 'loginSuccess',
  userId: 'test-123',
  userToken: 'test-token'
};
console.log('Sending:', JSON.stringify(message));
window.ReactNativeWebView.postMessage(JSON.stringify(message));

// 3. Check for syntax errors
try {
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
  console.log('Message sent successfully');
} catch (error) {
  console.error('Failed to send message:', error);
}
```

### Issue 2: User not staying logged in

**Possible causes:**
1. Not sending `loginSuccess` message after authentication
2. Token expired or invalid
3. SecureStore cleared (app reinstalled)
4. Web session not persisting (cookies/localStorage)

**Debug steps:**
```javascript
// Enable debug mode in native app config
DEBUG: true  // in src/config/config.js

// Check native logs for:
// [AuthService] Auth data saved successfully
// [AuthContext] User logged in: {userId}

// Test persistence:
// 1. Login
// 2. Force quit app
// 3. Reopen
// 4. Check logs for:
// [AuthService] Auth data retrieved: {userId}
```

### Issue 3: Login works but push tokens not registering

**Possible causes:**
1. Missing `pushTokenEndpoint` in login message
2. Backend endpoint returns non-200 status
3. User denied notification permissions
4. EXPO_PROJECT_ID not configured

**Debug steps:**
```javascript
// Check logs for:
// [HomeScreen] Push token endpoint provided, registering...
// [PushTokenService] Starting push token registration...
// [PushTokenService] Push token obtained: ExponentPushToken[...]

// If you see:
// [PushTokenService] Permission status: denied
// → User needs to grant permissions in Settings

// If you see:
// [PushTokenService] ❌ Client error, not retrying
// → Check your backend endpoint is working
```

### Issue 4: Google OAuth blocked in WebView

**Symptom:**
"Access blocked" error when trying to use Google OAuth

**Solution:**
Update WebView configuration (already implemented in base app):
```javascript
// In WebViewScreen.js
userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
sharedCookiesEnabled={true}
thirdPartyCookiesEnabled={true}
```

---

## Testing

### Manual Testing Checklist

#### Web Console Testing
```javascript
// 1. Test in browser console (simulates web app)
window.ReactNativeWebView = {
  postMessage: (msg) => console.log('Mock message:', msg)
};

// 2. Test login
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'loginSuccess',
  userId: 'test-user-123',
  userToken: 'test-token-abc',
  pushTokenEndpoint: 'https://httpbin.org/post'  // Test endpoint
}));

// 3. Test logout
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'logout'
}));
```

#### Native App Testing
```javascript
// In WebView, open dev tools and check:
// 1. Message sent
console.log('[Web] Sending loginSuccess');

// 2. Check native logs
// [HomeScreen] 📨 MESSAGE RECEIVED!
// [HomeScreen] Message: { "action": "loginSuccess", ... }
// [AuthService] Auth data saved successfully

// 3. Verify SecureStore
// Close and reopen app
// [AuthService] Auth data retrieved: test-user-123
```

---

## Migration Guide

### Migrating from Existing Auth System

If you already have a web app with authentication:

1. **Detect WebView environment**
```javascript
const isNativeApp = !!window.ReactNativeWebView;
```

2. **Add postMessage after login**
```javascript
async function login(email, password) {
  const result = await yourExistingLoginFunction(email, password);

  // Add this block
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      action: 'loginSuccess',
      userId: result.userId,
      userToken: result.token,
      pushTokenEndpoint: 'https://your-api.com/push/register'
    }));
  }

  return result;
}
```

3. **Add postMessage to logout**
```javascript
function logout() {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      action: 'logout',
      pushTokenEndpoint: 'https://your-api.com/push/register'
    }));
  }

  yourExistingLogoutFunction();
}
```

4. **Test in native app**

---

## API Reference

### postMessage Format

```typescript
interface LoginMessage {
  action: 'loginSuccess';
  userId: string;
  userToken: string;
  pushTokenEndpoint?: string;
}

interface LogoutMessage {
  action: 'logout';
  pushTokenEndpoint?: string;
}
```

### Native App SecureStore Keys

```javascript
// Defined in src/config/config.js
AUTH_STORAGE_KEYS: {
  USER_ID: 'user_id',
  USER_TOKEN: 'user_token',
  IS_LOGGED_IN: 'is_logged_in',
}
```

---

## Examples Repository

Check the `examples/` folder (if available) for complete implementations:
- React + Firebase Auth
- Vue.js + Custom Auth
- Next.js + NextAuth
- Vanilla JS + JWT

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review native app logs with `DEBUG: true`
3. Test with simple postMessage in browser console
4. Verify backend endpoints are working

---

**Last Updated:** 2025
**Base App Version:** 1.0.0
