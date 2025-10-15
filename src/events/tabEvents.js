/**
 * Tab Navigation Events
 *
 * Emits events when tab bar buttons are pressed
 * This allows screens to refresh even when already focused
 */
class TabEventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  off(eventName, callback) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
  }

  emit(eventName, data) {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(callback => callback(data));
  }
}

const tabEvents = new TabEventEmitter();

// Event names
export const TAB_EVENTS = {
  HOME_PRESSED: 'home_pressed',
  CALENDAR_PRESSED: 'calendar_pressed',
  CALENDAR_EVENTS_PRESSED: 'calendar_events_pressed',
  STATS_PRESSED: 'stats_pressed',
  SETTINGS_PRESSED: 'settings_pressed',
};

export default tabEvents;
