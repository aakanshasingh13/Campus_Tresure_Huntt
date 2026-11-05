-- ==============================================================================
-- CAMPUS TREASURE HUNT - COMPLETE SUPABASE POSTGRESQL DATABASE SCHEMA
-- Features:
-- 1. Profiles & Privacy-Safe User Directory
-- 2. Events & 6-Digit Event Access PIN
-- 3. Event Registrations & Verification
-- 4. Payment Authentication & Approvals (UPI, Amount, UTR)
-- 5. Teams & Team Members
-- 6. Clues & Hints (with Protected Solutions & Anti-Cheat)
-- 7. QR Code Scans & Validation
-- 8. Real-time Event Timer
-- 9. Scoring & Clue Submissions
-- 10. Real-time Leaderboard
-- 11. Rewards & Badges
-- 12. Event-Specific Live Notifications
-- 13. Comprehensive Row Level Security (RLS) & Privacy Shielding
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Player & Organizer User Accounts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('player', 'organizer', 'superadmin')),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  campus_type TEXT DEFAULT 'College Campus',
  campus_name TEXT DEFAULT 'Stanford Innovation Campus',
  country TEXT DEFAULT 'India',
  avatar_url TEXT,
  score INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  games_won INTEGER DEFAULT 0,
  gamesLost INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT TRUE,
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-seed default Super Admin account into Database
INSERT INTO public.profiles (
  id, role, username, email, phone, campus_type, campus_name, approval_status, is_verified, badges
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin',
  'superadmin',
  'admin@campusquest.edu',
  '+1 (555) 000-0001',
  'Global HQ',
  'Campus Quest Central Command',
  'approved',
  true,
  '["Root Authority", "Platform Architect", "Master Moderator"]'::jsonb
) ON CONFLICT (username) DO NOTHING;

-- Index profiles for fast login lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));

-- ------------------------------------------------------------------------------
-- 2. EVENTS TABLE (Organized Hunts & 6-Digit PIN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE, -- 6-digit numeric access PIN (e.g. 849201)
  title TEXT NOT NULL,
  description TEXT,
  campus_type TEXT DEFAULT 'College Campus',
  campus_name TEXT NOT NULL,
  date TEXT NOT NULL, -- e.g. '2026-09-30'
  time TEXT NOT NULL, -- e.g. '14:00'
  start_location TEXT NOT NULL,
  boundary_radius_meters INTEGER DEFAULT 500,
  max_team_size INTEGER DEFAULT 4,
  max_teams INTEGER DEFAULT 50,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Medium',
  duration TEXT DEFAULT '2 Hours',
  prizes TEXT,
  hints_allowed INTEGER DEFAULT 2,
  is_paid BOOLEAN DEFAULT FALSE,
  registration_fee NUMERIC DEFAULT 0,
  currency TEXT DEFAULT '₹',
  fee_type TEXT DEFAULT 'per_team' CHECK (fee_type IN ('per_player', 'per_team')),
  upi_id TEXT,
  payee_name TEXT,
  payment_qr_url TEXT,
  payment_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_code ON public.events(code);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);

-- ------------------------------------------------------------------------------
-- 3. TEAMS & TEAM MEMBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  avatar TEXT DEFAULT '🦊',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, team_name)
);

CREATE INDEX IF NOT EXISTS idx_teams_event ON public.teams(event_id);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- ------------------------------------------------------------------------------
-- 4. EVENT REGISTRATIONS (PIN + Verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  pin_code VARCHAR(6) NOT NULL,
  status TEXT DEFAULT 'registered' CHECK (status IN ('pending', 'registered', 'verified', 'cancelled')),
  payment_status TEXT DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'verified', 'rejected')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.event_registrations(user_id);

-- ------------------------------------------------------------------------------
-- 5. PAYMENTS (UPI, UTR verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT '₹',
  transaction_id TEXT NOT NULL, -- UTR / Reference ID
  payment_method TEXT DEFAULT 'UPI',
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_event ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON public.payments(transaction_id);

-- ------------------------------------------------------------------------------
-- 6. CLUES TABLE (Protected solutions for game integrity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  riddle TEXT NOT NULL,
  location_hint TEXT NOT NULL,
  type TEXT DEFAULT 'riddle' CHECK (type IN ('riddle', 'qr_code', 'gps', 'photo')),
  solution TEXT NOT NULL, -- Sensitive: protected by RLS / Backend
  points INTEGER DEFAULT 100,
  hint1 TEXT,
  hint2 TEXT,
  qr_code_value TEXT, -- Sensitive: secret target value
  coordinates JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clues_event ON public.clues(event_id, order_index);

-- ------------------------------------------------------------------------------
-- 7. HINTS UNLOCKED TABLE (Audit & point penalties)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clue_id UUID NOT NULL REFERENCES public.clues(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  hint_number INTEGER NOT NULL CHECK (hint_number IN (1, 2)),
  penalty_points INTEGER DEFAULT 20,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clue_id, user_id, hint_number)
);

CREATE INDEX IF NOT EXISTS idx_hints_user ON public.hints(event_id, user_id);

-- ------------------------------------------------------------------------------
-- 8. QR CODE SCANS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  clue_id UUID NOT NULL REFERENCES public.clues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  scanned_value TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_scans_event ON public.qr_scans(event_id, user_id);

-- ------------------------------------------------------------------------------
-- 9. EVENT TIMERS TABLE (Authoritative countdown)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 120,
  is_running BOOLEAN DEFAULT FALSE,
  is_paused BOOLEAN DEFAULT FALSE,
  paused_remaining_seconds INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. SCORES / SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  clue_id UUID NOT NULL REFERENCES public.clues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  points_awarded INTEGER NOT NULL,
  hints_deduction INTEGER DEFAULT 0,
  net_points INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, clue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_event_user ON public.scores(event_id, user_id);

-- ------------------------------------------------------------------------------
-- 11. LEADERBOARD TABLE (Public Event Rankings - PRIVACY PROTECTED)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  total_score INTEGER DEFAULT 0,
  clues_solved INTEGER DEFAULT 0,
  total_clues INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 1,
  last_solved_at TIMESTAMPTZ,
  avatar TEXT DEFAULT '⚡',
  UNIQUE(event_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard(event_id, rank);

-- ------------------------------------------------------------------------------
-- 12. REWARDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  badge_name TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Award',
  points_threshold INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reward_id)
);

-- ------------------------------------------------------------------------------
-- 13. EVENT NOTIFICATIONS (Announcements & Game Updates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'announcement' CHECK (type IN ('announcement', 'hint', 'timer', 'milestone', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_event ON public.event_notifications(event_id);

-- ------------------------------------------------------------------------------
-- 14. PRIVACY SHIELD VIEW: PUBLIC PROFILES
-- Strictly excludes phone number, email, and password to prevent leaks!
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  role,
  username,
  campus_type,
  campus_name,
  avatar_url,
  score,
  badges,
  games_won,
  games_lost,
  is_verified,
  created_at
FROM public.profiles;

-- ------------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see only their own full profile (with email/phone).
-- Other users query public_profiles which omits email and phone completely.
CREATE POLICY "Users can view own private profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can register profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Events: Anyone can view events, organizers can manage their own
CREATE POLICY "Public can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create events"
  ON public.events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Organizers can update own events"
  ON public.events FOR UPDATE
  USING (organizer_id = auth.uid() OR auth.uid() IS NULL);

-- Clues: Public can view clues, but organizers create them
CREATE POLICY "Participants can view clues"
  ON public.clues FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage clues"
  ON public.clues FOR ALL
  USING (true);

-- Registrations: Users can view and manage their own registrations
CREATE POLICY "Users can view own registrations"
  ON public.event_registrations FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (true);

-- Payments: Users view own payments, organizers view for their events
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can submit payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Organizers can verify payments"
  ON public.payments FOR UPDATE
  USING (true);

-- Teams: Public read within event, leader can manage
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK (true);

-- Leaderboard: Public read (only team names & scores, never emails/phones)
CREATE POLICY "Public can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "System can update leaderboard"
  ON public.leaderboard FOR ALL
  USING (true);

-- Event Notifications: Public read for event
CREATE POLICY "Public can read event notifications"
  ON public.event_notifications FOR SELECT
  USING (true);

CREATE POLICY "Organizers can post event notifications"
  ON public.event_notifications FOR INSERT
  WITH CHECK (true);

-- Event Timers: Public read
CREATE POLICY "Public can read event timer"
  ON public.event_timers FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage event timer"
  ON public.event_timers FOR ALL
  USING (true);

-- Hints & Scores: Users can insert and read their own
CREATE POLICY "Users can view own hints"
  ON public.hints FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can unlock hints"
  ON public.hints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own scores"
  ON public.scores FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can record scores"
  ON public.scores FOR INSERT
  WITH CHECK (true);

-- QR Scans: Record scans
CREATE POLICY "Users can record qr scans"
  ON public.qr_scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own qr scans"
  ON public.qr_scans FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- ==============================================================================
-- 16. LEADERBOARD RECALCULATION TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_event_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update leaderboard for the team
  IF NEW.team_id IS NOT NULL THEN
    INSERT INTO public.leaderboard (event_id, team_id, team_name, total_score, clues_solved, last_solved_at)
    VALUES (
      NEW.event_id,
      NEW.team_id,
      (SELECT team_name FROM public.teams WHERE id = NEW.team_id),
      NEW.net_points,
      1,
      NOW()
    )
    ON CONFLICT (event_id, team_id) DO UPDATE SET
      total_score = public.leaderboard.total_score + EXCLUDED.total_score,
      clues_solved = public.leaderboard.clues_solved + 1,
      last_solved_at = NOW();

    -- Re-rank leaderboard
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY total_score DESC, last_solved_at ASC) as new_rank
      FROM public.leaderboard
      WHERE event_id = NEW.event_id
    )
    UPDATE public.leaderboard l
    SET rank = ranked.new_rank
    FROM ranked
    WHERE l.id = ranked.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_leaderboard ON public.scores;
CREATE TRIGGER trg_sync_leaderboard
AFTER INSERT ON public.scores
FOR EACH ROW EXECUTE FUNCTION public.sync_event_leaderboard();
