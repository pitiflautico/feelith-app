import * as Notifications from 'expo-notifications';
import config from '../config/config';

/**
 * Event Notification Service
 *
 * Handles local notifications for calendar events
 * Notifies users when events end to prompt mood logging
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[EventNotifications] Permission not granted');
      return false;
    }

    console.log('[EventNotifications] Permission granted');
    return true;
  } catch (error) {
    console.error('[EventNotifications] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Fetch upcoming events from API
 */
export async function fetchUpcomingEvents(userToken) {
  try {
    const response = await fetch(`${config.API_URL}/profile/calendar/upcoming-events`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('[EventNotifications] Fetched upcoming events:', data.data.events.length);
      return data.data.events || [];
    }

    return [];
  } catch (error) {
    console.error('[EventNotifications] Error fetching events:', error);
    return [];
  }
}

/**
 * Schedule notification for an event
 */
export async function scheduleEventNotification(event) {
  try {
    const endTime = new Date(event.end_time);
    const now = new Date();

    // Don't schedule if event already ended
    if (endTime <= now) {
      console.log(`[EventNotifications] Event "${event.title}" already ended, skipping`);
      return null;
    }

    // Cancel any existing notification for this event
    await cancelEventNotification(event.id);

    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'How did it go?',
        body: `Rate your experience: ${event.title}`,
        data: {
          type: 'event_mood',
          eventId: event.id,
          eventTitle: event.title,
        },
        sound: true,
      },
      trigger: {
        date: endTime,
      },
      identifier: `event-${event.id}`,
    });

    console.log(`[EventNotifications] Scheduled notification for "${event.title}" at ${endTime.toISOString()}`);
    return notificationId;
  } catch (error) {
    console.error(`[EventNotifications] Error scheduling notification for event ${event.id}:`, error);
    return null;
  }
}

/**
 * Cancel notification for an event
 */
export async function cancelEventNotification(eventId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(`event-${eventId}`);
    console.log(`[EventNotifications] Cancelled notification for event ${eventId}`);
  } catch (error) {
    console.error(`[EventNotifications] Error cancelling notification:`, error);
  }
}

/**
 * Cancel all event notifications
 */
export async function cancelAllEventNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const eventNotifications = scheduled.filter(n => n.identifier?.startsWith('event-'));

    for (const notification of eventNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`[EventNotifications] Cancelled ${eventNotifications.length} event notifications`);
  } catch (error) {
    console.error('[EventNotifications] Error cancelling all notifications:', error);
  }
}

/**
 * Sync and schedule notifications for upcoming events
 * Main function called by background fetch
 */
export async function syncAndScheduleNotifications(userToken) {
  try {
    console.log('[EventNotifications] Starting sync...');

    // Check permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[EventNotifications] No permission, skipping sync');
      return {
        success: false,
        reason: 'no_permission',
      };
    }

    // Fetch upcoming events
    const events = await fetchUpcomingEvents(userToken);

    if (events.length === 0) {
      console.log('[EventNotifications] No upcoming events to schedule');
      return {
        success: true,
        scheduled: 0,
      };
    }

    // Schedule notifications for each event
    let scheduled = 0;
    for (const event of events) {
      if (!event.reminder_sent && !event.has_mood) {
        const notificationId = await scheduleEventNotification(event);
        if (notificationId) {
          scheduled++;
        }
      }
    }

    console.log(`[EventNotifications] Sync complete. Scheduled ${scheduled} notifications`);
    return {
      success: true,
      scheduled,
      total: events.length,
    };
  } catch (error) {
    console.error('[EventNotifications] Error during sync:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all scheduled event notifications (for debugging)
 */
export async function getScheduledEventNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.filter(n => n.identifier?.startsWith('event-'));
  } catch (error) {
    console.error('[EventNotifications] Error getting scheduled notifications:', error);
    return [];
  }
}
