import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import tabEvents, { TAB_EVENTS } from '../src/events/tabEvents';

/**
 * Calendar Events Route
 *
 * This route redirects to the home tab and triggers
 * the calendar events navigation in the WebView
 */
export default function CalendarEventsRoute() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to calendar events via WebView
    tabEvents.emit(TAB_EVENTS.CALENDAR_EVENTS_PRESSED);

    // Redirect to home tab after a short delay
    setTimeout(() => {
      router.replace('/');
    }, 100);
  }, []);

  return null;
}
