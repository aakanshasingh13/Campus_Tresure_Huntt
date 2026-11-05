import { TreasureEvent, UserProfile } from '../types';
import { addPlayerNotification } from './notificationHelper';
import { playCelebrationSound } from './audioEffects';

const STARTED_EVENTS_KEY = 'campus_started_event_ids';
const ORGANIZER_EVENTS_KEY = 'campus_organizer_events';
const ORGANIZER_NOTIFS_KEY = 'campus_organizer_notifs';

/**
 * Check if an event has been officially started by the organizer.
 * Players cannot enter or play the event until this returns true.
 */
export function isEventStartedByOrganizer(event?: TreasureEvent | null): boolean {
  if (!event || !event.id) return false;

  // 1. Direct property check on the event object
  if (event.organizerStarted === true) return true;

  // 2. Shared global persistence check in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STARTED_EVENTS_KEY);
      if (saved) {
        const startedIds: string[] = JSON.parse(saved);
        if (Array.isArray(startedIds) && startedIds.includes(event.id)) {
          return true;
        }
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Format scheduled date and time for display
 */
export function formatEventSchedule(event?: TreasureEvent | null): {
  dateStr: string;
  timeStr: string;
  fullSchedule: string;
  isPastSchedule: boolean;
} {
  if (!event) {
    return {
      dateStr: 'Scheduled Date',
      timeStr: 'Scheduled Time',
      fullSchedule: 'Scheduled Date & Time',
      isPastSchedule: false,
    };
  }

  const dateStr = event.date || '2026-10-31';
  const timeStr = event.time || '20:00';

  let isPastSchedule = false;
  try {
    const scheduledTime = new Date(`${dateStr}T${timeStr}:00`).getTime();
    if (!isNaN(scheduledTime) && Date.now() >= scheduledTime) {
      isPastSchedule = true;
    }
  } catch (e) {}

  return {
    dateStr,
    timeStr,
    fullSchedule: `${dateStr} at ${timeStr}`,
    isPastSchedule,
  };
}

/**
 * Officially start an event by the organizer.
 * Broadcasts the start, updates global state, and notifies both organizer and players.
 */
export function startEventByOrganizer(
  event: TreasureEvent,
  organizerUser?: UserProfile | null,
  onUpdateEventCallback?: (updated: TreasureEvent) => void
): TreasureEvent {
  // 1. Update shared persistent list of started events
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STARTED_EVENTS_KEY);
      const existing: string[] = saved ? JSON.parse(saved) : [];
      if (!existing.includes(event.id)) {
        existing.push(event.id);
        localStorage.setItem(STARTED_EVENTS_KEY, JSON.stringify(existing));
      }
    }
  } catch (e) {}

  // 2. Create updated event object
  const updatedEvent: TreasureEvent = {
    ...event,
    organizerStarted: true,
    status: 'active',
  };

  // 3. Persist to organizer events storage
  try {
    if (typeof localStorage !== 'undefined') {
      const savedEvts = localStorage.getItem(ORGANIZER_EVENTS_KEY);
      if (savedEvts) {
        const eventsList: TreasureEvent[] = JSON.parse(savedEvts);
        const updatedList = eventsList.map((e) => (e.id === event.id ? updatedEvent : e));
        localStorage.setItem(ORGANIZER_EVENTS_KEY, JSON.stringify(updatedList));
      }
    }
  } catch (e) {}

  // 4. Notify all players that the organizer has started the hunt
  const pinCode = event.code || '849201';
  addPlayerNotification({
    type: 'pin',
    title: `🚀 Hunt Started: ${event.title}!`,
    message: `The organizer has officially started "${event.title}"! Live quest is now in progress. Enter your 6-digit PIN (${pinCode}) to begin solving checkpoints with your team.`,
    eventPin: pinCode,
    eventDate: event.date,
    eventTime: event.time,
    eventVenue: event.startLocation || event.campusName,
    actionScreen: 'home',
  });

  // 5. Add confirmation notification for Organizer
  try {
    if (typeof localStorage !== 'undefined') {
      const orgNotifs = localStorage.getItem(ORGANIZER_NOTIFS_KEY);
      const list = orgNotifs ? JSON.parse(orgNotifs) : [];
      list.unshift({
        id: `org-notif-${Date.now()}`,
        title: `✓ Hunt Broadcasted: ${event.title}`,
        message: `You started "${event.title}". All registered players and squads have received the live starting signal and access PIN prompt!`,
        timestamp: 'Just now',
        read: false,
        eventId: event.id,
      });
      localStorage.setItem(ORGANIZER_NOTIFS_KEY, JSON.stringify(list));
    }
  } catch (e) {}

  // 6. Play audio confirmation
  playCelebrationSound();

  // 7. Invoke parent state callback if supplied
  if (onUpdateEventCallback) {
    onUpdateEventCallback(updatedEvent);
  }

  // 8. Dispatch global browser event for instant multi-component reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('campus_event_started', {
        detail: {
          eventId: event.id,
          eventTitle: event.title,
          updatedEvent,
        },
      })
    );
  }

  return updatedEvent;
}

/**
 * Get organizer-specific notifications
 */
export function getOrganizerNotifications(): Array<{
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  eventId?: string;
}> {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(ORGANIZER_NOTIFS_KEY);
      if (saved) return JSON.parse(saved);
    }
  } catch (e) {}
  return [];
}
