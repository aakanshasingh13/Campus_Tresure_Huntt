import { Clue, TreasureEvent } from '../types';
import { isEventStartedByOrganizer } from './eventStatusHelper';

export interface PlayerClueSolve {
  clueId: string;
  clueTitle: string;
  clueOrder: number;
  solvedAt: string; // ISO string or time string
  pointsEarned: number;
  timeSpentMinutes: number;
  hintsUsed?: number;
}

export interface TeamLiveProgress {
  teamId: string;
  teamName: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  leaderUsername: string;
  playersCount: number;
  eventId: string;
  currentClueIndex: number; // 0-based index of clue currently attempting
  solvedClues: PlayerClueSolve[];
  score: number;
  startedAt: string;
  lastActiveAt: string;
  status: 'active' | 'completed' | 'paused';
  rank?: number;
}

export interface ClueActivityLog {
  id: string;
  teamId: string;
  teamName: string;
  avatarEmoji?: string;
  clueId: string;
  clueTitle: string;
  clueOrder: number;
  points: number;
  timestamp: string;
  type: 'solve' | 'hint' | 'finish' | 'start';
}

const STORAGE_PREFIX = 'campus_hunt_team_progress_';
const FEED_STORAGE_PREFIX = 'campus_hunt_activity_feed_';

// Seed default simulated teams if none exist yet for an event
export function getInitialTeamsForEvent(event: TreasureEvent): TeamLiveProgress[] {
  const clues = event.clues || [];
  const eventId = event.id;

  const defaultTemplates = [
    {
      teamId: `${eventId}-team-1`,
      teamName: 'Cipher Squad',
      avatarEmoji: '⚡',
      leaderUsername: 'Alex Rivera',
      playersCount: 4,
      solvedOffset: Math.min(clues.length, 3),
      status: clues.length <= 3 ? 'completed' : 'active',
      startedMinsAgo: 42,
    },
    {
      teamId: `${eventId}-team-2`,
      teamName: 'Quantum Questers',
      avatarEmoji: '🔮',
      leaderUsername: 'Priya Sharma',
      playersCount: 3,
      solvedOffset: Math.min(clues.length, 2),
      status: 'active',
      startedMinsAgo: 35,
    },
    {
      teamId: `${eventId}-team-3`,
      teamName: 'Belltower Bandits',
      avatarEmoji: '🦅',
      leaderUsername: 'Marcus Vance',
      playersCount: 4,
      solvedOffset: Math.min(clues.length, 1),
      status: 'active',
      startedMinsAgo: 28,
    },
    {
      teamId: `${eventId}-team-4`,
      teamName: 'Pixel Pioneers',
      avatarEmoji: '🎮',
      leaderUsername: 'Sara Jenkins',
      playersCount: 2,
      solvedOffset: Math.min(clues.length, 1),
      status: 'active',
      startedMinsAgo: 20,
    },
    {
      teamId: `${eventId}-team-5`,
      teamName: 'Enigma Explorers',
      avatarEmoji: '🧩',
      leaderUsername: 'Liam O\'Connor',
      playersCount: 3,
      solvedOffset: 0,
      status: 'active',
      startedMinsAgo: 10,
    },
  ];

  const isStarted = isEventStartedByOrganizer(event);
  const now = Date.now();

  return defaultTemplates.map((tmpl, idx) => {
    const solvedClues: PlayerClueSolve[] = [];
    let score = 0;

    // Only compute simulated solves if the event has officially started!
    if (isStarted) {
      for (let i = 0; i < tmpl.solvedOffset; i++) {
        const clue = clues[i];
        if (clue) {
          const solveTimeMinsAgo = tmpl.startedMinsAgo - (i + 1) * 8;
          const solveDate = new Date(now - Math.max(1, solveTimeMinsAgo) * 60000);
          const pts = clue.points || 100;
          score += pts;
          solvedClues.push({
            clueId: clue.id,
            clueTitle: clue.title,
            clueOrder: clue.order || i + 1,
            solvedAt: solveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pointsEarned: pts,
            timeSpentMinutes: 5 + (i * 2),
            hintsUsed: i === 1 ? 1 : 0,
          });
        }
      }
    }

    const isDone = isStarted && clues.length > 0 && solvedClues.length >= clues.length;

    return {
      teamId: tmpl.teamId,
      teamName: tmpl.teamName,
      avatarEmoji: tmpl.avatarEmoji,
      leaderUsername: tmpl.leaderUsername,
      playersCount: tmpl.playersCount,
      eventId,
      currentClueIndex: isStarted ? solvedClues.length : 0,
      solvedClues,
      score,
      startedAt: isStarted
        ? new Date(now - tmpl.startedMinsAgo * 60000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Pending Start',
      lastActiveAt: isStarted ? 'Just now' : 'Awaiting Start',
      status: isDone ? 'completed' : 'active',
      rank: idx + 1,
    } as TeamLiveProgress;
  });
}

// Get all teams progress for an event
export function getEventTeamsProgress(event: TreasureEvent): TeamLiveProgress[] {
  if (!event || !event.id) return [];

  const isStarted = isEventStartedByOrganizer(event);

  // If event is not started by organizer yet, return 0-score squads (no live score before start)
  if (!isStarted) {
    return getInitialTeamsForEvent(event);
  }

  const key = `${STORAGE_PREFIX}${event.id}`;
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortAndRankTeams(parsed);
        }
      }
    }
  } catch (e) {
    console.error('Failed to load event teams progress:', e);
  }

  // If no saved progress, generate and save initial seed
  const initial = getInitialTeamsForEvent(event);
  saveEventTeamsProgress(event.id, initial);
  return sortAndRankTeams(initial);
}

export function saveEventTeamsProgress(eventId: string, teams: TeamLiveProgress[]): void {
  if (!eventId || typeof localStorage === 'undefined') return;
  const key = `${STORAGE_PREFIX}${eventId}`;
  try {
    localStorage.setItem(key, JSON.stringify(teams));
    window.dispatchEvent(
      new CustomEvent('campus_hunt_progress_update', {
        detail: { eventId, timestamp: Date.now() },
      })
    );
  } catch (e) {
    console.error('Failed to save event teams progress:', e);
  }
}

// Record a solved clue for a specific team or player
export function recordTeamClueSolved(
  eventId: string,
  event: TreasureEvent,
  teamName: string,
  clue: Clue,
  pointsEarned: number,
  leaderUsername?: string
): void {
  if (!eventId || !clue) return;

  const teams = getEventTeamsProgress(event);
  let targetTeam = teams.find(
    (t) => t.teamName.toLowerCase() === teamName.toLowerCase() || t.leaderUsername === leaderUsername
  );

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!targetTeam) {
    // Create new team entry if player wasn't in list
    targetTeam = {
      teamId: `${eventId}-player-${Date.now()}`,
      teamName: teamName || leaderUsername || 'Explorer Squad',
      avatarEmoji: '⚡',
      leaderUsername: leaderUsername || teamName || 'Explorer',
      playersCount: 1,
      eventId,
      currentClueIndex: 0,
      solvedClues: [],
      score: 0,
      startedAt: nowStr,
      lastActiveAt: 'Just now',
      status: 'active',
    };
    teams.push(targetTeam);
  }

  // Avoid duplicate solve for the same clue
  const alreadySolved = targetTeam.solvedClues.some((sc) => sc.clueId === clue.id);
  if (!alreadySolved) {
    targetTeam.solvedClues.push({
      clueId: clue.id,
      clueTitle: clue.title,
      clueOrder: clue.order || targetTeam.solvedClues.length + 1,
      solvedAt: nowStr,
      pointsEarned,
      timeSpentMinutes: 6,
    });
    targetTeam.score += pointsEarned;
    targetTeam.currentClueIndex = targetTeam.solvedClues.length;
    targetTeam.lastActiveAt = 'Just now';

    const totalClues = event.clues ? event.clues.length : 3;
    if (targetTeam.solvedClues.length >= totalClues) {
      targetTeam.status = 'completed';
    }

    // Log to activity feed
    addActivityLog(eventId, {
      id: `act-${Date.now()}-${Math.random()}`,
      teamId: targetTeam.teamId,
      teamName: targetTeam.teamName,
      avatarEmoji: targetTeam.avatarEmoji || '🎯',
      clueId: clue.id,
      clueTitle: clue.title,
      clueOrder: clue.order || targetTeam.solvedClues.length,
      points: pointsEarned,
      timestamp: nowStr,
      type: targetTeam.status === 'completed' ? 'finish' : 'solve',
    });
  }

  const updatedRanked = sortAndRankTeams(teams);
  saveEventTeamsProgress(eventId, updatedRanked);
}

// Activity feed management
export function getActivityFeed(eventId: string): ClueActivityLog[] {
  if (!eventId || typeof localStorage === 'undefined') return [];
  const key = `${FEED_STORAGE_PREFIX}${eventId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  // Fallback initial feed
  const initialLogs: ClueActivityLog[] = [
    {
      id: 'feed-1',
      teamId: `${eventId}-team-1`,
      teamName: 'Cipher Squad',
      avatarEmoji: '⚡',
      clueId: 'c1',
      clueTitle: 'The Starting Meridian',
      clueOrder: 1,
      points: 100,
      timestamp: '14:08',
      type: 'solve',
    },
    {
      id: 'feed-2',
      teamId: `${eventId}-team-2`,
      teamName: 'Quantum Questers',
      avatarEmoji: '🔮',
      clueId: 'c1',
      clueTitle: 'The Starting Meridian',
      clueOrder: 1,
      points: 100,
      timestamp: '14:11',
      type: 'solve',
    },
    {
      id: 'feed-3',
      teamId: `${eventId}-team-1`,
      teamName: 'Cipher Squad',
      avatarEmoji: '⚡',
      clueId: 'c2',
      clueTitle: 'Whispers of Science',
      clueOrder: 2,
      points: 150,
      timestamp: '14:19',
      type: 'solve',
    },
    {
      id: 'feed-4',
      teamId: `${eventId}-team-3`,
      teamName: 'Belltower Bandits',
      avatarEmoji: '🦅',
      clueId: 'c1',
      clueTitle: 'The Starting Meridian',
      clueOrder: 1,
      points: 100,
      timestamp: '14:23',
      type: 'solve',
    },
  ];
  return initialLogs;
}

export function addActivityLog(eventId: string, log: ClueActivityLog): void {
  if (!eventId || typeof localStorage === 'undefined') return;
  const current = getActivityFeed(eventId);
  const updated = [log, ...current].slice(0, 50); // Keep last 50
  try {
    localStorage.setItem(`${FEED_STORAGE_PREFIX}${eventId}`, JSON.stringify(updated));
  } catch (e) {}
}

// Helper to sort teams by score & clues solved, and calculate ranks
function sortAndRankTeams(teams: TeamLiveProgress[]): TeamLiveProgress[] {
  const sorted = [...teams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.solvedClues.length - a.solvedClues.length;
  });

  return sorted.map((t, idx) => ({
    ...t,
    rank: idx + 1,
  }));
}
