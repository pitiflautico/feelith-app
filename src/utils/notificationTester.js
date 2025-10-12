import { scheduleLocalNotification } from '../services/pushService';

/**
 * Notification Testing Utilities
 *
 * Helper functions to test push notifications locally
 * Use these from the console or add test buttons in development
 */

/**
 * Test URL navigation notification
 * Sends a notification that will navigate the WebView to a specific URL
 *
 * @param {string} url - URL to navigate to (default: feelith.com/about)
 */
export const testUrlNotification = async (url = 'https://feelith.com/about') => {
  console.log('[NotificationTester] Scheduling URL notification...');

  await scheduleLocalNotification(
    'Navigate to URL',
    `Tap to open: ${url}`,
    {
      type: 'url',
      url: url,
    },
    2 // 2 seconds delay
  );

  console.log('[NotificationTester] URL notification scheduled for 2 seconds');
  console.log('[NotificationTester] When you tap it, the WebView should navigate to:', url);
};

/**
 * Test native action notification
 * Sends a notification that will trigger a native action
 *
 * @param {string} action - Action name (default: 'refresh')
 */
export const testNativeActionNotification = async (action = 'refresh') => {
  console.log('[NotificationTester] Scheduling native action notification...');

  await scheduleLocalNotification(
    'Native Action Test',
    `Tap to execute: ${action}`,
    {
      type: 'nativeAction',
      action: action,
      message: 'This is a test notification',
    },
    2 // 2 seconds delay
  );

  console.log('[NotificationTester] Native action notification scheduled for 2 seconds');
  console.log('[NotificationTester] When you tap it, it should execute action:', action);
};

/**
 * Test immediate foreground notification
 * Shows notification immediately while app is in foreground
 */
export const testForegroundNotification = async () => {
  console.log('[NotificationTester] Scheduling foreground notification...');

  await scheduleLocalNotification(
    'Foreground Test',
    'This notification appeared while the app was open',
    {
      type: 'url',
      url: 'https://feelith.com',
    },
    1 // 1 second delay
  );

  console.log('[NotificationTester] Stay in the app to see foreground behavior');
};

/**
 * Test background notification
 * Instructions for testing background notifications
 */
export const testBackgroundNotification = async () => {
  console.log('[NotificationTester] Scheduling background notification...');

  await scheduleLocalNotification(
    'Background Test',
    'This notification will test background behavior',
    {
      type: 'url',
      url: 'https://feelith.com/explore',
    },
    5 // 5 seconds delay
  );

  console.log('[NotificationTester] Notification scheduled for 5 seconds');
  console.log('[NotificationTester] CLOSE or BACKGROUND the app now!');
  console.log('[NotificationTester] Then tap the notification when it appears');
};

// Make functions available globally for easy console testing
if (__DEV__) {
  global.testUrlNotification = testUrlNotification;
  global.testNativeActionNotification = testNativeActionNotification;
  global.testForegroundNotification = testForegroundNotification;
  global.testBackgroundNotification = testBackgroundNotification;
}
