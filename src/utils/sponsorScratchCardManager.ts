/**
 * Sponsor Scratch Card Manager
 * Allows Organizers to create and manage custom promotional scratch cards for sponsors,
 * which are synced in real-time and displayed to players in the Rewards tab.
 */

export interface SponsorScratchCard {
  id: string;
  sponsorName: string;
  sponsorCategory: string; // 'Food & Cafe' | 'Tech & Audio' | 'Student Deals' | 'Apparel & Merch' | 'Books & Stationery'
  rewardTitle: string; // e.g. "Free Large Latte + 250 XP"
  rewardDescription: string; // e.g. "Redeem at Central Campus Starbucks / Cafe counter"
  promoCode: string; // e.g. "CAMPUSLATTE"
  xpAmount: number; // e.g. 250
  type: 'gold' | 'silver' | 'bronze';
  expiryDate?: string;
  terms?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  totalClaims: number;
  scratchedByUsers: string[]; // List of user keys (emails / usernames) who have scratched
}

const STORAGE_KEY = 'campus_sponsor_scratch_cards_v2';
const EVENT_NAME = 'campus_sponsor_scratch_cards_updated';

// Default starter sponsor scratch cards created by official event organizers
export const DEFAULT_SPONSOR_CARDS: SponsorScratchCard[] = [
  {
    id: 'spon-1',
    sponsorName: 'Starbucks Campus Hub',
    sponsorCategory: 'Food & Cafe',
    rewardTitle: 'Free Large Caramel Latte + 250 XP',
    rewardDescription: 'Present this scratched voucher code at the student center cafe counter.',
    promoCode: 'CAMPUSLATTE',
    xpAmount: 250,
    type: 'gold',
    expiryDate: '2026-12-31',
    terms: 'Valid during event days at any official campus beverage outlet.',
    createdBy: 'Campus Quest Org Team',
    createdAt: new Date().toISOString(),
    isActive: true,
    totalClaims: 142,
    scratchedByUsers: [],
  },
  {
    id: 'spon-2',
    sponsorName: 'Red Bull Energy Zone',
    sponsorCategory: 'Food & Cafe',
    rewardTitle: 'Free 250ml Ice-Cold Can + 300 XP',
    rewardDescription: 'Instant energy replenishment station at the main campus quad pavilion.',
    promoCode: 'REDBULLXP300',
    xpAmount: 300,
    type: 'gold',
    expiryDate: '2026-12-31',
    terms: '1 can per registered hunt competitor while stocks last.',
    createdBy: 'Campus Quest Org Team',
    createdAt: new Date().toISOString(),
    isActive: true,
    totalClaims: 289,
    scratchedByUsers: [],
  },
  {
    id: 'spon-3',
    sponsorName: 'boAt Audio Official',
    sponsorCategory: 'Tech & Audio',
    rewardTitle: 'Flat ₹500 Off Gaming Headsets + 200 XP',
    rewardDescription: 'Exclusive discount code for tournament participants on boat-lifestyle.com.',
    promoCode: 'BOATHUNT500',
    xpAmount: 200,
    type: 'silver',
    expiryDate: '2026-12-31',
    terms: 'Minimum cart value ₹1,499. One-time use per student ID.',
    createdBy: 'Campus Quest Org Team',
    createdAt: new Date().toISOString(),
    isActive: true,
    totalClaims: 78,
    scratchedByUsers: [],
  },
  {
    id: 'spon-4',
    sponsorName: 'University Heritage Bookstore',
    sponsorCategory: 'Books & Stationery',
    rewardTitle: 'Free Campus Notebook & Pen + 150 XP',
    rewardDescription: 'Collect your hardbound quest notebook from the campus library bookstore.',
    promoCode: 'QUESTBOOK150',
    xpAmount: 150,
    type: 'bronze',
    expiryDate: '2026-12-31',
    terms: 'Show secret code upon checkout at the student bookstore counter.',
    createdBy: 'Campus Quest Org Team',
    createdAt: new Date().toISOString(),
    isActive: true,
    totalClaims: 56,
    scratchedByUsers: [],
  },
];

/**
 * Retrieve all sponsor scratch cards from storage
 */
export const getSponsorScratchCards = (): SponsorScratchCard[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Initialize with defaults if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SPONSOR_CARDS));
      return DEFAULT_SPONSOR_CARDS;
    }
  } catch (e) {
    console.error('Error fetching sponsor scratch cards:', e);
  }
  return DEFAULT_SPONSOR_CARDS;
};

/**
 * Save sponsor scratch cards to storage and notify all subscribers
 */
export const saveSponsorScratchCards = (cards: SponsorScratchCard[]): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: cards }));
    }
  } catch (e) {
    console.error('Error saving sponsor scratch cards:', e);
  }
};

/**
 * Add a new sponsor scratch card created by organizer
 */
export const addSponsorScratchCard = (
  newCard: Omit<SponsorScratchCard, 'id' | 'createdAt' | 'scratchedByUsers' | 'totalClaims'>
): SponsorScratchCard => {
  const current = getSponsorScratchCards();
  const created: SponsorScratchCard = {
    ...newCard,
    id: `spon-custom-${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalClaims: 0,
    scratchedByUsers: [],
    isActive: true,
  };

  const updated = [created, ...current];
  saveSponsorScratchCards(updated);
  return created;
};

/**
 * Toggle active/inactive status of a sponsor scratch card
 */
export const toggleSponsorScratchCardStatus = (id: string): SponsorScratchCard[] => {
  const current = getSponsorScratchCards();
  const updated = current.map((c) =>
    c.id === id ? { ...c, isActive: !c.isActive } : c
  );
  saveSponsorScratchCards(updated);
  return updated;
};

/**
 * Delete a sponsor scratch card
 */
export const deleteSponsorScratchCard = (id: string): SponsorScratchCard[] => {
  const current = getSponsorScratchCards();
  const updated = current.filter((c) => c.id !== id);
  saveSponsorScratchCards(updated);
  return updated;
};

/**
 * Check if a player has already scratched this sponsor card
 */
export const isCardScratchedByUser = (cardId: string, userKey: string): boolean => {
  if (!userKey) return false;
  const cards = getSponsorScratchCards();
  const found = cards.find((c) => c.id === cardId);
  if (!found) return false;
  return Array.isArray(found.scratchedByUsers) && found.scratchedByUsers.includes(userKey);
};

/**
 * Mark a sponsor card as scratched by a specific player
 */
export const markCardAsScratched = (cardId: string, userKey: string): void => {
  if (!userKey) return;
  const current = getSponsorScratchCards();
  const updated = current.map((c) => {
    if (c.id === cardId) {
      const users = Array.isArray(c.scratchedByUsers) ? [...c.scratchedByUsers] : [];
      if (!users.includes(userKey)) {
        users.push(userKey);
      }
      return {
        ...c,
        scratchedByUsers: users,
        totalClaims: (c.totalClaims || 0) + 1,
      };
    }
    return c;
  });
  saveSponsorScratchCards(updated);
};

/**
 * Reset a card for a user (useful for re-testing/demoing the scratch interaction)
 */
export const resetCardForUser = (cardId: string, userKey: string): void => {
  if (!userKey) return;
  const current = getSponsorScratchCards();
  const updated = current.map((c) => {
    if (c.id === cardId) {
      const users = (c.scratchedByUsers || []).filter((u) => u !== userKey);
      return {
        ...c,
        scratchedByUsers: users,
      };
    }
    return c;
  });
  saveSponsorScratchCards(updated);
};

/**
 * Subscribe to real-time sponsor scratch card updates
 */
export const subscribeSponsorScratchCards = (callback: (cards: SponsorScratchCard[]) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    } else {
      callback(getSponsorScratchCards());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getSponsorScratchCards());
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};
