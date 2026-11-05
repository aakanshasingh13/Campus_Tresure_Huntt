import { PlayerNotification } from '../components/Player/NotificationsScreen';

const NOTIFS_STORAGE_KEY = 'campus_player_notifs';

export function getPlayerNotifications(): PlayerNotification[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(NOTIFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {}
  return [];
}

export function addPlayerNotification(notif: Omit<PlayerNotification, 'id' | 'timestamp' | 'read'> & {
  timestamp?: string;
  teamCode?: string;
  memberId?: string;
  memberName?: string;
  requiresLeaderAction?: boolean;
  actionStatus?: 'pending' | 'accepted' | 'declined';
  requiresMemberPayment?: boolean;
  paymentStatus?: 'pending' | 'paid';
  fee?: number;
  eventVenue?: string;
  eventDate?: string;
  eventTime?: string;
  eventDuration?: string;
  eventPin?: string;
}): PlayerNotification {
  const existing = getPlayerNotifications();
  const newNotif: any = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: notif.timestamp || 'Just now',
    read: false,
  };

  const updated = [newNotif, ...existing];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(updated));
      // Dispatch event for reactive UI update
      window.dispatchEvent(new CustomEvent('campus_notifications_updated', { detail: updated }));
    }
  } catch (e) {}

  return newNotif;
}
