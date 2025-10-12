# Push Token Registration Protocol

## Overview

When a user logs in via the web interface, the server can optionally provide a callback endpoint to register the user's device for push notifications. This allows the backend to send targeted push notifications to specific users.

---

## Login Message Format

When the user successfully logs in, send this message from the web:

```javascript
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'loginSuccess',
  userId: 'uuid-del-usuario-en-servidor',      // Required: User's unique ID
  userToken: 'jwt-token-or-auth-token',        // Required: Authentication token
  pushTokenEndpoint: 'https://yourapi.com/api/push/register'  // Optional: Callback URL
}));
```

### Fields:

- **`userId`** (string, required): The user's unique identifier in your system
- **`userToken`** (string, required): Authentication token (JWT or similar) for API calls
- **`pushTokenEndpoint`** (string, optional): Backend endpoint URL where the app should register the push token
  - If omitted, the app will skip push token registration
  - If provided, the app will make a POST request to this URL

---

## Push Token Registration Request

If `pushTokenEndpoint` is provided, the app will automatically make this request:

### Request:

```http
POST {pushTokenEndpoint}
Authorization: Bearer {userToken}
Content-Type: application/json
```

### Request Body (with permissions):

```json
{
  "userId": "uuid-del-usuario",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "ios"
}
```

### Request Body (without permissions):

```json
{
  "userId": "uuid-del-usuario",
  "hasPermission": false,
  "platform": "android"
}
```

### Fields:

- **`userId`** (string): User's unique ID (same as login message)
- **`pushToken`** (string): Expo push token for sending notifications
  - Only present if user granted notification permissions
  - Format: `ExponentPushToken[...]`
- **`hasPermission`** (boolean): Only present when permissions were denied
  - Set to `false` when user declined notification permissions
- **`platform`** (string): Device platform, either `"ios"` or `"android"`

### Expected Response:

```http
200 OK
```

Any `200` status code indicates success. The app will retry on `5xx` errors (up to 3 attempts with exponential backoff).

---

## Logout / Unregister Request

When the user logs out, the app will attempt to unregister the push token:

### Request:

```http
POST {pushTokenEndpoint}
Authorization: Bearer {userToken}
Content-Type: application/json
```

### Request Body:

```json
{
  "userId": "uuid-del-usuario",
  "platform": "ios",
  "remove": true
}
```

### Fields:

- **`remove`** (boolean): Set to `true` to indicate this is an unregister request
- Server should delete/deactivate the push token for this user/platform

---

## Error Handling

The app implements automatic retry logic:

- **Network errors**: Retries up to 3 times with exponential backoff (1s, 2s, 4s)
- **5xx server errors**: Retries up to 3 times
- **4xx client errors**: No retry (logs error and gives up)
- **Timeout**: 30 seconds per attempt

---

## Sending Push Notifications from Backend

Once registered, use the Expo Push Notification service to send notifications:

### Example cURL:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxx]",
    "title": "New Message",
    "body": "You have a new notification!",
    "data": {
      "type": "url",
      "url": "https://feelith.com/dashboard"
    }
  }'
```

### Notification Data Types:

#### 1. URL Navigation:
```json
{
  "to": "ExponentPushToken[...]",
  "title": "Check this out!",
  "body": "Tap to see new content",
  "data": {
    "type": "url",
    "url": "https://feelith.com/calendar"
  }
}
```

When tapped, the app will navigate to the specified URL.

#### 2. Native Action:
```json
{
  "to": "ExponentPushToken[...]",
  "title": "App Update",
  "body": "Refresh to see changes",
  "data": {
    "type": "nativeAction",
    "action": "refresh"
  }
}
```

Triggers a native action (e.g., `refresh` reloads the WebView).

---

## Testing

### From Web Console (Test Login):

```javascript
window.ReactNativeWebView.postMessage(JSON.stringify({
  action: 'loginSuccess',
  userId: 'test-user-123',
  userToken: 'test-token-abc',
  pushTokenEndpoint: 'https://your-api.com/api/push/register'
}));
```

Check the app logs to see:
```
[HomeScreen] Push token endpoint provided, registering...
[PushTokenService] Starting push token registration...
[PushTokenService] ✅ Push token registered successfully
```

---

## Security Notes

1. **Always validate the `userToken`** in the Authorization header on your backend
2. **Associate push tokens with user accounts** to prevent unauthorized access
3. **Rate limit** the registration endpoint to prevent abuse
4. **Expire old tokens** periodically (recommend: remove tokens unused for 90+ days)
5. **Don't log sensitive data** like full tokens in production

---

## Example Backend Implementation (Node.js/Express):

```javascript
app.post('/api/push/register', authenticateUser, async (req, res) => {
  const { userId, pushToken, hasPermission, platform, remove } = req.body;

  // Verify userId matches authenticated user
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (remove) {
    // Handle unregister
    await db.pushTokens.delete({ userId, platform });
    return res.status(200).json({ success: true });
  }

  if (hasPermission === false) {
    // User declined permissions, log it
    await db.users.update(userId, {
      pushNotificationsEnabled: false,
      platform
    });
    return res.status(200).json({ success: true });
  }

  // Store the push token
  await db.pushTokens.upsert({
    userId,
    pushToken,
    platform,
    lastUpdated: new Date()
  });

  res.status(200).json({ success: true });
});
```

---

## Frequently Asked Questions

**Q: Is `pushTokenEndpoint` required?**
A: No, it's optional. If omitted, the app will skip push token registration.

**Q: What if the user denies notification permissions?**
A: The app will send `hasPermission: false` so you can track this in your database.

**Q: Can I use a different authentication method?**
A: Yes, modify `pushTokenService.js` to use a different header format (e.g., API key).

**Q: How do I test without setting up a backend?**
A: Use the test buttons in the app (DEBUG mode) to send local notifications and verify navigation works.

**Q: What happens if registration fails?**
A: The app logs a warning but continues normally. Push notifications simply won't work for that user until they log in again.

---

**Need help?** Check the app logs with `config.DEBUG = true` to see detailed registration flow.
