export interface EventAnnouncement {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  message: string;
  timestamp: string;
  organizerName?: string;
  priority?: 'normal' | 'urgent';
}

const STORAGE_PREFIX = 'campus_event_announcements_';
const LATEST_KEY = 'campus_latest_announcement';

export function getEventAnnouncements(eventId: string): EventAnnouncement[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {}
  return [];
}

export function saveEventAnnouncements(eventId: string, announcements: EventAnnouncement[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, JSON.stringify(announcements));
    }
  } catch (e) {}
}

export function broadcastAnnouncement(
  data: Omit<EventAnnouncement, 'id' | 'timestamp'>
): EventAnnouncement {
  const newAnnouncement: EventAnnouncement = {
    ...data,
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const existing = getEventAnnouncements(data.eventId);
  const updated = [newAnnouncement, ...existing];
  saveEventAnnouncements(data.eventId, updated);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LATEST_KEY, JSON.stringify(newAnnouncement));
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('campus_organizer_announcement', {
        detail: newAnnouncement,
      })
    );
  }

  return newAnnouncement;
}

export function getLatestAnnouncement(): EventAnnouncement | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LATEST_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {}
  return null;
}
