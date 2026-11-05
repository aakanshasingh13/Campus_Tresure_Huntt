export interface TeamMember {
  id: string;
  name: string;
  role: 'leader' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  joinedAt: string;
}

export interface EventTeam {
  code: string;
  name: string;
  eventId: string;
  eventTitle: string;
  leaderName: string;
  members: TeamMember[];
  maxMembers: number;
  fee: number;
  isPaid: boolean;
  pin: string;
  venue: string;
  date: string;
  time: string;
  duration: string;
}

const DEFAULT_TEAMS: EventTeam[] = [
  {
    code: 'T7K2QX',
    name: 'Shadow Knights',
    eventId: 'evt-101',
    eventTitle: 'The Great Belltower Mystery',
    leaderName: 'Alex Hunter',
    members: [
      { id: 'mem-lead', name: 'Alex Hunter', role: 'leader', status: 'accepted', joinedAt: '10 mins ago' },
      { id: 'mem-1', name: 'Member 1', role: 'member', status: 'accepted', joinedAt: '5 mins ago' },
    ],
    maxMembers: 4,
    fee: 199,
    isPaid: true,
    pin: '849201',
    venue: 'Central University Grounds (Central Quad Archway 4)',
    date: '2026-08-10',
    time: '14:00',
    duration: '2 Hours',
  },
];

const STORAGE_KEY = 'campus_event_teams';

export function getStoredTeams(): EventTeam[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {}
  return DEFAULT_TEAMS;
}

export function saveStoredTeams(teams: EventTeam[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
    }
  } catch (e) {}
}

export function findTeamByCode(code: string): EventTeam | undefined {
  const teams = getStoredTeams();
  return teams.find((t) => t.code.toUpperCase() === code.trim().toUpperCase());
}

export function createNewTeam(team: EventTeam): EventTeam {
  const teams = getStoredTeams();
  const existingIdx = teams.findIndex((t) => t.code === team.code);
  if (existingIdx !== -1) {
    teams[existingIdx] = team;
  } else {
    teams.unshift(team);
  }
  saveStoredTeams(teams);
  return team;
}

export function addMemberToTeam(
  code: string,
  playerName: string
): { team: EventTeam; member: TeamMember } | null {
  const teams = getStoredTeams();
  const teamIdx = teams.findIndex((t) => t.code.toUpperCase() === code.trim().toUpperCase());
  if (teamIdx === -1) return null;

  const team = teams[teamIdx];
  const currentMembersCount = team.members.filter((m) => m.role === 'member').length;
  const memberNumber = currentMembersCount + 1;
  const memberName = `Member ${memberNumber}`;

  const newMember: TeamMember = {
    id: `mem-${Date.now()}`,
    name: memberName,
    role: 'member',
    status: 'pending',
    joinedAt: 'Just now',
  };

  team.members.push(newMember);
  teams[teamIdx] = team;
  saveStoredTeams(teams);
  return { team, member: newMember };
}

export function updateMemberStatus(
  code: string,
  memberId: string,
  status: 'accepted' | 'declined'
): EventTeam | null {
  const teams = getStoredTeams();
  const teamIdx = teams.findIndex((t) => t.code.toUpperCase() === code.trim().toUpperCase());
  if (teamIdx === -1) return null;

  const team = teams[teamIdx];
  const member = team.members.find((m) => m.id === memberId);
  if (member) {
    member.status = status;
  }
  teams[teamIdx] = team;
  saveStoredTeams(teams);
  return team;
}
