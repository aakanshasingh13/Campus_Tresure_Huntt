export type Role = 'organizer' | 'player' | 'superadmin';

export type CampusType = 
  | 'College Campus'
  | 'Office Campus'
  | 'Other';

export type ClueType = 'riddle' | 'qr_code' | 'gps' | 'photo';

export interface Clue {
  id: string;
  eventId: string;
  title: string;
  riddle: string;
  locationHint: string;
  type: ClueType;
  solution: string;
  points: number;
  order: number;
  hint1?: string;
  hint2?: string;
  qrCodeValue?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placementNote?: string;
  backupKey?: string;
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Master' | 'Expert';

export interface TreasureEvent {
  id: string;
  title: string;
  campusType: CampusType;
  campusName: string;
  date: string;
  time: string;
  description: string;
  startLocation: string;
  boundaryRadiusMeters: number;
  maxTeamSize: number;
  minTeamSize?: number;
  status: 'upcoming' | 'active' | 'completed';
  clues: Clue[];
  organizerName: string;
  organizerEmail: string;
  code: string; // 6-digit numeric access code
  difficulty?: DifficultyLevel;
  eventType?: string;
  additionalInfo?: string;
  duration?: string;
  prizes?: string;
  maxTeams?: number;
  hintsAllowed?: number;
  // Payment & Registration Details
  isPaid?: boolean;
  registrationFee?: number;
  currency?: string; // '₹' | '$'
  feeType?: 'per_player' | 'per_team';
  upiId?: string;
  payeeName?: string;
  paymentQrUrl?: string;
  paymentInstructions?: string;
  mode?: string;
  whatToCarry?: string[];
  meetingPoint?: string;
  eligibility?: string;
  organizerStarted?: boolean;
}

export interface UserProfile {
  id?: string;
  username: string;
  email: string;
  phone: string;
  campusType: CampusType;
  campusName: string;
  country?: string;
  role: Role;
  isVerified: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  avatarUrl?: string;
  joinedDate: string;
  score: number;
  badges: string[];
  gamesWon?: number;
  gamesLost?: number;
  hintsUsed?: number;
  lastLogin?: string;
  loginMethod?: string;
  ipAddress?: string;
  deviceInfo?: string;
  sessionId?: string;
}

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  players: string[];
  score: number;
  cluesSolved: number;
  totalClues: number;
  lastSolvedTime: string;
  rank: number;
  avatar: string;
}

export interface ActiveHuntState {
  eventId: string;
  currentClueIndex: number;
  solvedClueIds: string[];
  unlockedHints: number[]; // e.g. [1] or [1, 2]
  score: number;
  startTime: string;
  teamName: string;
}
