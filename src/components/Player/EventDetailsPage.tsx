import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Zap,
  Users,
  KeyRound,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  HelpCircle,
  Compass,
  Bell,
  Lock,
  Unlock,
  Play,
  ChevronRight,
  Info,
  Flame,
  Send,
  Smartphone,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Target,
  Trophy,
  Phone,
  Shield,
  Check,
} from 'lucide-react-native';
import { TreasureEvent, Clue } from '../../types';
import {
  isEventStartedByOrganizer,
  formatEventSchedule,
} from '../../utils/eventStatusHelper';
import { FairPlayNoticeModal } from './FairPlayNoticeModal';

interface EventDetailsPageProps {
  event: TreasureEvent;
  isJoined: boolean;
  isEliminated?: boolean;
  onBack: () => void;
  onUnregisterEvent?: (eventId: string) => void;
  onLaunchGame: (event: TreasureEvent) => void;
  onRequestRegistration?: (event: TreasureEvent) => void;
  onGoToMyEvents: () => void;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = ({
  event,
  isJoined,
  isEliminated = false,
  onBack,
  onUnregisterEvent,
  onLaunchGame,
  onRequestRegistration,
  onGoToMyEvents,
}) => {
  // Fair Play Anti-Cheat Pre-Join Modal State
  const [showFairPlayModal, setShowFairPlayModal] = useState(false);
  type FairPlayAction = 'register' | 'launch' | { type: 'team'; mode: 'create' | 'join' };
  const [pendingFairPlayAction, setPendingFairPlayAction] = useState<FairPlayAction | null>(null);

  // Handle fair play agreement before any event registration or launch
  const handleInitiateRegister = () => {
    if (isEliminated) {
      alert(`Access Denied: You have been disqualified and eliminated from "${event.title}" due to anti-cheat fair play violations. You cannot participate in this event again.`);
      return;
    }
    setPendingFairPlayAction('register');
    setShowFairPlayModal(true);
  };

  const handleInitiateTeam = (mode: 'create' | 'join') => {
    if (isEliminated) {
      alert(`Access Denied: You have been disqualified and eliminated from "${event.title}" due to anti-cheat fair play violations. You cannot participate in this event again.`);
      return;
    }
    setPendingFairPlayAction({ type: 'team', mode });
    setShowFairPlayModal(true);
  };

  const handleInitiateLaunch = () => {
    if (isEliminated) {
      alert(`Access Denied: You have been disqualified and eliminated from "${event.title}" due to anti-cheat fair play violations. You cannot participate in this event again.`);
      return;
    }
    setPendingFairPlayAction('launch');
    setShowFairPlayModal(true);
  };

  const handleFairPlayAccepted = () => {
    setShowFairPlayModal(false);
    if (!pendingFairPlayAction) return;

    if (pendingFairPlayAction === 'register' || (typeof pendingFairPlayAction === 'object' && pendingFairPlayAction.type === 'team')) {
      setPendingFairPlayAction(null);
      if (onRequestRegistration) {
        onRequestRegistration(event);
      } else {
        alert('Registration is temporarily unavailable. Please refresh and try again.');
      }
      return;
    }

    if (pendingFairPlayAction === 'launch') {
      onLaunchGame(event);
    }
    setPendingFairPlayAction(null);
  };

  // Local joined state for instant feedback
  const [locallyJoined, setLocallyJoined] = useState(isJoined);

  // Day of event simulation state (allows testing both before-day and day-of-event)
  const [simulatedDayOfEvent, setSimulatedDayOfEvent] = useState<boolean | null>(null);
  const [simulatedReadyToStart, setSimulatedReadyToStart] = useState<boolean | null>(null);

  // Sync prop changes
  useEffect(() => {
    setLocallyJoined(isJoined);
  }, [isJoined]);

  // Determine if today is the day of the event
  const checkIsDayOfEvent = (): boolean => {
    if (simulatedDayOfEvent !== null) return simulatedDayOfEvent;
    if (event.status === 'active') return true;
    if (!event.date) return false;

    try {
      const today = new Date();
      const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (event.date === todayYMD) return true;

      const parsed = new Date(event.date);
      if (!isNaN(parsed.getTime())) {
        return (
          parsed.getFullYear() === today.getFullYear() &&
          parsed.getMonth() === today.getMonth() &&
          parsed.getDate() === today.getDate()
        );
      }
    } catch (e) {}
    return false;
  };

  const isToday = checkIsDayOfEvent();
  const isReadyToStart =
    simulatedReadyToStart !== null
      ? simulatedReadyToStart
      : isEventStartedByOrganizer(event);

  const eventCode = event.code || (event as any).eventCode || '849201';
  const effectiveFee = event.registrationFee && event.registrationFee > 0 ? event.registrationFee : 150;
  const currencySymbol = event.currency || '₹';

  // Check if event is strictly a Team Hunt / Team Only event
  const isTeamOnlyEvent = Boolean(
    (event.description &&
      (event.description.toLowerCase().includes('team only') ||
        event.description.toLowerCase().includes('no solo') ||
        event.description.toLowerCase().includes('team hunt'))) ||
      (Boolean(event.minTeamSize) && (event.minTeamSize as number) > 1) ||
      event.eventType === 'Team Hunt'
  );

  const isUserRegistered = locallyJoined || isJoined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Nav Row */}
      <View style={styles.topNavRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#f8fafc" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.topBadgesRow}>
          {isEliminated ? (
            <View style={styles.disqualifiedPill}>
              <ShieldAlert size={12} color="#ef4444" />
              <Text style={styles.disqualifiedPillText}>DISQUALIFIED</Text>
            </View>
          ) : isUserRegistered ? (
            <View style={styles.registeredPill}>
              <CheckCircle2 size={12} color="#10b981" />
              <Text style={styles.registeredPillText}>Registered</Text>
            </View>
          ) : null}

          {isReadyToStart ? (
            <View style={styles.livePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.livePillText}>Ready to Start</Text>
            </View>
          ) : (
            <View style={styles.upcomingPill}>
              <Clock size={11} color="#fbbf24" />
              <Text style={styles.upcomingPillText}>Upcoming</Text>
            </View>
          )}
        </View>
      </View>

      {/* DISQUALIFIED / ELIMINATED NOTICE BANNER */}
      {isEliminated && (
        <View style={styles.disqualifiedWarningBanner}>
          <View style={styles.disqualifiedWarningHeader}>
            <ShieldAlert size={20} color="#ef4444" />
            <Text style={styles.disqualifiedWarningTitle}>PLAYER DISQUALIFIED & ELIMINATED</Text>
          </View>
          <Text style={styles.disqualifiedWarningText}>
            You accumulated 2 strikes for violating anti-cheat rules (leaving the screen or clicking back). Per competition policy, you are permanently barred from participating in or restarting this event.
          </Text>
        </View>
      )}

      {/* 1. Hero Banner Card */}
      <View style={styles.heroCard}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{event.eventType || 'Campus Scavenger Hunt'}</Text>
          <View style={styles.difficultyBadge}>
            <Zap size={11} color="#fbbf24" />
            <Text style={styles.difficultyText}>{event.difficulty || 'Medium'}</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>{event.title}</Text>
        <Text style={styles.heroDescription}>{event.description}</Text>

        {/* TEAM ONLY NOTICE & CREATE TEAM ACTION (Shown after player reads description) */}
        {isTeamOnlyEvent && !isUserRegistered && (
          <View style={styles.teamHeroBanner}>
            <View style={styles.teamHeroBannerHeader}>
              <View style={styles.teamHuntPill}>
                <Users size={12} color="#fbbf24" />
                <Text style={styles.teamHuntPillText}>★★★ HARD • TEAM HUNT</Text>
              </View>
              <Text style={styles.teamHeroFeeText}>Team fee: {currencySymbol}{effectiveFee}</Text>
            </View>

            <Text style={styles.teamHeroNoticeText}>
              This event is strictly for squads of {event.minTeamSize || 2} to {event.maxTeamSize || 4} players (no solo allowed). Create your team as Team Leader or enter your Leader's 6-character code to join!
            </Text>

            <View style={styles.teamHeroButtonsRow}>
              <TouchableOpacity
                onPress={() => handleInitiateTeam('create')}
                style={styles.heroCreateTeamBtn}
                activeOpacity={0.85}
              >
                <Users size={14} color="#0f172a" />
                <Text style={styles.heroCreateTeamBtnText}>CREATE YOUR TEAM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleInitiateTeam('join')}
                style={styles.heroJoinTeamBtn}
                activeOpacity={0.85}
              >
                <KeyRound size={14} color="#f59e0b" />
                <Text style={styles.heroJoinTeamBtnText}>JOIN A TEAM</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Organizer Host Info */}
        <View style={styles.heroHostRow}>
          <Text style={styles.heroHostText}>
            Organized by{' '}
            <Text style={{ color: '#f8fafc', fontWeight: '800' }}>
              {event.organizerName || 'Campus Guild'}
            </Text>
            {event.organizerEmail ? ` (${event.organizerEmail})` : ''}
          </Text>
        </View>
      </View>

      {/* 2. Starting Point & Schedule Spotlight Card */}
      <View style={styles.startingPointCard}>
        <View style={styles.sectionHeaderBetween}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color="#fbbf24" />
            <Text style={styles.sectionTitle}>Starting Point & Assembly Venue</Text>
          </View>
          <View style={styles.reportingBadge}>
            <Clock size={11} color="#38bdf8" />
            <Text style={styles.reportingBadgeText}>Assemble 15m Early</Text>
          </View>
        </View>

        {/* Big Start Location Highlight Box */}
        <View style={styles.startLocationHighlightBox}>
          <View style={styles.startLocationIconCircle}>
            <Target size={22} color="#0f172a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.startLocationLabel}>Report & Check-In At</Text>
            <Text style={styles.startLocationName}>
              {event.startLocation || 'Central Campus Quad'}
            </Text>
            <Text style={styles.startLocationInstruction}>
              {event.campusName || event.campusType} • Gather at the check-in desk for team briefing and safety roll call.
            </Text>
          </View>
        </View>

        {/* Schedule Grid: Date, Time, Duration, Boundary */}
        <View style={styles.scheduleGrid}>
          <View style={styles.scheduleMetricBox}>
            <Calendar size={15} color="#38bdf8" />
            <View>
              <Text style={styles.metricLabel}>Event Date</Text>
              <Text style={styles.metricValue}>{event.date || 'TBD'}</Text>
            </View>
          </View>

          <View style={styles.scheduleMetricBox}>
            <Clock size={15} color="#38bdf8" />
            <View>
              <Text style={styles.metricLabel}>Start Time</Text>
              <Text style={styles.metricValue}>{event.time || '14:00'}</Text>
            </View>
          </View>

          <View style={styles.scheduleMetricBox}>
            <Clock size={15} color="#fbbf24" />
            <View>
              <Text style={styles.metricLabel}>Duration</Text>
              <Text style={styles.metricValue}>{event.duration || '2 Hours'}</Text>
            </View>
          </View>

          <View style={styles.scheduleMetricBox}>
            <Compass size={15} color="#fbbf24" />
            <View>
              <Text style={styles.metricLabel}>Play Boundary</Text>
              <Text style={styles.metricValue}>
                {event.boundaryRadiusMeters || 500}m Radius
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Comprehensive Event Specifications (Every Detail Created by Organizer) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Sparkles size={16} color="#fbbf24" />
          <Text style={styles.sectionTitle}>Event Specifications & Overview</Text>
        </View>

        <Text style={styles.specsSubText}>
          Details configured by the organizer for this treasure hunt:
        </Text>

        <View style={styles.specsGrid}>
          {/* Item: Campus Location */}
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Campus / Venue</Text>
            <Text style={styles.specValue}>
              {event.campusName || 'Main Grounds'} ({event.campusType || 'Campus'})
            </Text>
          </View>

          {/* Item: Category / Type */}
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Event Format</Text>
            <Text style={styles.specValue}>
              {event.eventType || 'Riddle & Cipher Trail'}
            </Text>
          </View>

          {/* Item: Difficulty Level */}
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Challenge Level</Text>
            <Text style={[styles.specValue, { color: '#fbbf24' }]}>
              {event.difficulty || 'Medium'} Tier
            </Text>
          </View>

          {/* Item: Maximum Team Size */}
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Team Size Limit</Text>
            <Text style={styles.specValue}>
              Up to {event.maxTeamSize || 4} Players / Team
            </Text>
          </View>

          {/* Item: Max Teams */}
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Team Capacity</Text>
            <Text style={styles.specValue}>
              {event.maxTeams || 25} Teams Maximum
            </Text>
          </View>

          {/* Item: Hints Allowed */}
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Hints Permitted</Text>
            <Text style={styles.specValue}>
              {event.hintsAllowed || 3} Hints per Squad
            </Text>
          </View>

          {/* Item: Grand Prizes */}
          <View style={[styles.specItem, { width: '100%' }]}>
            <Text style={styles.specLabel}>Grand Prizes & Rewards</Text>
            <View style={styles.prizesRow}>
              <Trophy size={14} color="#fbbf24" />
              <Text style={styles.prizesValue}>
                {event.prizes || '$250 Campus Voucher + Gold Champion Trophies'}
              </Text>
            </View>
          </View>

          {/* Item: Additional Guidelines & Emergency Contact */}
          <View style={[styles.specItem, { width: '100%' }]}>
            <Text style={styles.specLabel}>Organizer Guidelines & Emergency Line</Text>
            <Text style={styles.additionalInfoText}>
              {event.additionalInfo ||
                'Bring smartphone with camera and GPS active. Wear comfortable footwear. Emergency organizer line: 555-0199.'}
            </Text>
          </View>

          {/* Item: Required Gear Checklist */}
          <View style={[styles.specItem, { width: '100%' }]}>
            <Text style={styles.specLabel}>Recommended Items to Bring</Text>
            <View style={styles.requiredItemsWrap}>
              {[
                'Smartphone with Camera',
                'GPS / Location Active',
                'Comfortable Walking Shoes',
                'Student / Campus ID',
                'Water Bottle',
              ].map((item, idx) => (
                <View key={idx} style={styles.requiredItemPill}>
                  <Check size={11} color="#10b981" />
                  <Text style={styles.requiredItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Item: Registration Fee Breakdown */}
          <View style={[styles.specItem, { width: '100%' }]}>
            <Text style={styles.specLabel}>Registration Fee & Payment Setup</Text>
            <View style={styles.feeSpecCard}>
              <View style={styles.feeSpecRow}>
                <View>
                  <Text style={styles.feeSpecAmount}>
                    {currencySymbol}{effectiveFee}
                  </Text>
                  <Text style={styles.feeSpecType}>
                    {event.feeType === 'per_team' ? 'Per Team' : 'Per Individual Player'}
                  </Text>
                </View>
                <View style={styles.feeSpecRight}>
                  <Text style={styles.feeSpecPayee}>
                    Sandbox checkout
                  </Text>
                  <Text style={styles.feeSpecHost}>
                    Payment verified in-app
                  </Text>
                </View>
              </View>
              {event.paymentInstructions ? (
                <Text style={styles.feeSpecInstructions}>
                  {event.paymentInstructions}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* 4. Official Rules & Regulations (Provided for player review) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <BookOpen size={16} color="#fbbf24" />
          <Text style={styles.sectionTitle}>Rules & Regulations</Text>
        </View>

        <Text style={styles.rulesIntroText}>
          All participating players and teams must adhere to the following tournament guidelines:
        </Text>

        <View style={styles.rulesList}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>1.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Registration & Verification:</Text> Teams must complete the
              one-click in-app sandbox checkout. The simulated payment and official entry are confirmed
              immediately, with no admin approval step.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>2.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Starting Point Assembly:</Text> All team members must report
              to {event.startLocation || 'the designated assembly point'} at least 15 minutes before{' '}
              {event.time || '14:00'} on {event.date || 'the scheduled date'} for equipment check and roll call.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>3.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Sequential Clue Progression:</Text> In accordance with fair-play
              standards, clues are unlocked strictly one by one. You must solve each riddle or scan the
              checkpoint QR code correctly before the next clue reveals.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>4.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Campus Perimeter Boundaries:</Text> Teams must remain within the
              designated {event.boundaryRadiusMeters || 500}m radius of {event.startLocation || 'Central Campus'}.
              Restricted faculty corridors, laboratories, and construction sites are strictly out-of-bounds.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>5.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Hints Usage Limit:</Text> Each team is allocated a maximum of{' '}
              {event.hintsAllowed || 3} hints during the hunt. Using hints may apply time or score adjustments.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleBullet}>6.</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleHighlight}>Fair Play & Integrity:</Text> Tampering with QR plaques, sharing
              cipher answers with rival teams, or using motor vehicles will result in immediate disqualification.
              In case of emergency, contact the organizer immediately.
            </Text>
          </View>
        </View>
      </View>

      {/* 5. Registration & Payment Action Card */}
      {!isUserRegistered ? (
        isTeamOnlyEvent ? (
          <View style={styles.sectionCardHighlight}>
            <View style={styles.sectionHeader}>
              <Users size={18} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Squad Entry & Team Registration</Text>
            </View>

            <Text style={styles.registrationExplainText}>
              This event requires playing in a squad ({event.minTeamSize || 2} to {event.maxTeamSize || 4} players). Solo entry is disabled.
              You can start your team as Team Leader (fee covers the entire team) or join your friend's team with their 6-character code!
            </Text>

            {/* Fee & Method Summary */}
            <View style={styles.feeBreakdownBox}>
              <View>
                <Text style={styles.feeBreakdownLabel}>Total Team Fee</Text>
                <Text style={styles.feeBreakdownPrice}>
                  {currencySymbol}{effectiveFee}
                </Text>
              </View>
              <View style={styles.feeMethodBadge}>
                <Users size={13} color="#38bdf8" />
                <Text style={styles.feeMethodText}>Leader Pays • Teammates Join Free</Text>
              </View>
            </View>

            {/* Dual Team Action Buttons */}
            <View style={styles.teamActionButtonsRow}>
              <TouchableOpacity
                onPress={() => handleInitiateTeam('create')}
                style={styles.createTeamBtn}
                activeOpacity={0.85}
              >
                <Users size={16} color="#0f172a" />
                <Text style={styles.createTeamBtnText}>CREATE YOUR TEAM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleInitiateTeam('join')}
                style={styles.joinTeamBtn}
                activeOpacity={0.85}
              >
                <KeyRound size={15} color="#fbbf24" />
                <Text style={styles.joinTeamBtnText}>JOIN A TEAM</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sectionCardHighlight}>
            <View style={styles.sectionHeader}>
              <CreditCard size={18} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Event Registration & Payment</Text>
            </View>

            <Text style={styles.registrationExplainText}>
              To participate in this hunt, complete the simulated sandbox checkout. No real money is
              deducted, and your registration and event briefing are unlocked immediately.
            </Text>

            {/* Fee & Method Summary */}
            <View style={styles.feeBreakdownBox}>
              <View>
                <Text style={styles.feeBreakdownLabel}>Registration Fee</Text>
                <Text style={styles.feeBreakdownPrice}>
                  {currencySymbol}
                  {effectiveFee}
                </Text>
              </View>
              <View style={styles.feeMethodBadge}>
                <CreditCard size={13} color="#38bdf8" />
                <Text style={styles.feeMethodText}>Sandbox Checkout · No Real Money</Text>
              </View>
            </View>

            {/* Register Button -> Opens Fair Play Notice then one-click sandbox checkout */}
            {isEliminated ? (
              <View style={styles.disqualifiedActionBtn}>
                <ShieldAlert size={18} color="#ffffff" />
                <Text style={styles.disqualifiedActionBtnText}>Disqualified from this Event</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleInitiateRegister}
                style={styles.payAndRegisterBtn}
                activeOpacity={0.8}
              >
                <CreditCard size={18} color="#0f172a" />
                <Text style={styles.payAndRegisterBtnText}>
                  Register · Sandbox {currencySymbol}{effectiveFee}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )
      ) : (
        /* REGISTERED USER BANNER */
        <View style={styles.registeredStatusCard}>
          <View style={styles.registeredStatusRow}>
            <View style={styles.registeredSuccessBadge}>
              <CheckCircle2 size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.registeredStatusTitle}>Registered for this Event ✓</Text>
              <Text style={styles.registeredStatusSub}>
                Sandbox payment confirmed & registration complete. Your event access PIN is{' '}
                {eventCode}. You have access to the registered event briefing & alerts below.
              </Text>
            </View>
          </View>

          {/* Day of Event "Start Event" or Waiting Notice */}
          {isReadyToStart ? (
            <View style={styles.startEventBanner}>
              <View style={styles.startEventBannerHeader}>
                <Flame size={20} color="#fbbf24" />
                <Text style={styles.startEventBannerTitle}>HUNT IS READY TO START!</Text>
              </View>
              <Text style={styles.startEventBannerSub}>
                The organizer has started the hunt! Click below to enter the live game where clues are revealed one by
                one as you solve them correctly.
              </Text>
              {isEliminated ? (
                <View style={styles.disqualifiedActionBtn}>
                  <ShieldAlert size={18} color="#ffffff" />
                  <Text style={styles.disqualifiedActionBtnText}>Disqualified & Barred from Event</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleInitiateLaunch}
                  style={styles.startEventActionBtn}
                  activeOpacity={0.85}
                >
                  <Play size={18} color="#0f172a" fill="#0f172a" />
                  <Text style={styles.startEventActionBtnText}>Start Event</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.waitingForStartBox}>
              <Clock size={16} color="#fbbf24" />
              <View style={{ flex: 1 }}>
                <Text style={styles.waitingTitle}>Waiting for Organizer to Start</Text>
                <Text style={styles.waitingSub}>
                  Scheduled for {event.date || 'Scheduled Date'} at {event.time || '20:00'}. Players cannot play until the organizer officially starts the hunt from the Organizer Dashboard.
                </Text>
              </View>
            </View>
          )}

          {/* Option to unregister and re-test registration flow */}
          <TouchableOpacity
            onPress={() => {
              setLocallyJoined(false);
              if (onUnregisterEvent) onUnregisterEvent(event.id);
            }}
            style={styles.retestUnregisterBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.retestUnregisterBtnText}>
              Reset Registration & Re-test Registration Flow
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 6. Event Alerts & Notifications (Provided ONLY AFTER payment of event!) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderBetween}>
          <View style={styles.sectionHeader}>
            <Bell size={16} color="#fbbf24" />
            <Text style={styles.sectionTitle}>Event Alerts & Notifications</Text>
          </View>
          {isUserRegistered && (
            <View style={styles.activeAlertsBadge}>
              <Text style={styles.activeAlertsBadgeText}>Live Feed Active</Text>
            </View>
          )}
        </View>

        {isUserRegistered ? (
          <View style={styles.notificationsList}>
            <View style={styles.notificationItem}>
              <View style={[styles.notifDot, { backgroundColor: '#10b981' }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.notifHeaderRow}>
                  <Text style={styles.notifTitle}>Registration Confirmed</Text>
                  <Text style={styles.notifTime}>Active</Text>
                </View>
                <Text style={styles.notifDesc}>
                  Your sandbox payment was auto-confirmed and your registration is verified. Your
                  squad is officially on the roster for {event.title}! Event access PIN:{' '}
                  {eventCode}.
                </Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notifDot, { backgroundColor: '#38bdf8' }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.notifHeaderRow}>
                  <Text style={styles.notifTitle}>Starting Venue & Assembly</Text>
                  <Text style={styles.notifTime}>Venue Alert</Text>
                </View>
                <Text style={styles.notifDesc}>
                  Assemble at {event.startLocation || 'Central Campus Quad'} 15 minutes prior to{' '}
                  {event.time || '14:00'} for opening roll call and check-in badge collection.
                </Text>
              </View>
            </View>

            <View style={styles.notificationItem}>
              <View style={[styles.notifDot, { backgroundColor: '#fbbf24' }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.notifHeaderRow}>
                  <Text style={styles.notifTitle}>Clues & Hints Day-of-Event Protocol</Text>
                  <Text style={styles.notifTime}>Rule Directive</Text>
                </View>
                <Text style={styles.notifDesc}>
                  In accordance with fair-play rules, secret riddles and clues unlock strictly on the
                  day of the event ({event.date || 'Event Day'}). The "Start Event" button will activate when ready.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* LOCKED NOTICE PRIOR TO PAYMENT */
          <View style={styles.lockedSectionBox}>
            <View style={styles.lockedIconBadge}>
              <Lock size={22} color="#fbbf24" />
            </View>
            <Text style={styles.lockedSectionHeadline}>
              Alerts & Notifications Locked
            </Text>
            <Text style={styles.lockedSectionText}>
              Official event alerts, live organizer broadcasts, start-venue updates, and team notifications
              are provided only after the payment of the event. Complete registration above to unlock active alerts.
            </Text>
            <TouchableOpacity
              onPress={handleInitiateRegister}
              style={styles.unlockAlertsBtn}
              activeOpacity={0.8}
            >
              <CreditCard size={14} color="#0f172a" />
              <Text style={styles.unlockAlertsBtnText}>Register & Pay to Unlock Alerts</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 7. Clues & Checkpoints (Provided ONLY AFTER payment AND on the day of the event!) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderBetween}>
          <View style={styles.sectionHeader}>
            {isUserRegistered && isToday ? (
              <Unlock size={16} color="#10b981" />
            ) : (
              <Lock size={16} color="#fbbf24" />
            )}
            <Text style={styles.sectionTitle}>
              Clues & Checkpoints ({event.clues ? event.clues.length : 0})
            </Text>
          </View>

          {/* Tester Simulation Switch */}
          <TouchableOpacity
            onPress={() => setSimulatedDayOfEvent(isToday ? false : true)}
            style={styles.simulateDayPill}
            activeOpacity={0.7}
          >
            <Sparkles size={11} color="#fbbf24" />
            <Text style={styles.simulateDayText}>
              {isToday ? 'Simulating: Event Day' : 'Simulate: Event Day'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isUserRegistered ? (
          /* NOT REGISTERED / BEFORE PAYMENT: Clues strictly locked */
          <View style={styles.lockedCluesBox}>
            <View style={styles.lockIconCircle}>
              <Lock size={26} color="#64748b" />
            </View>
            <Text style={styles.lockedCluesTitle}>
              Checkpoints & Clues Locked — Payment Required
            </Text>
            <Text style={styles.lockedCluesSub}>
              Clues and hints will only be provided after the payment of the event, and will unlock on the
              day of the event ({event.date || 'Event Day'}). Complete the one-click sandbox checkout
              above to qualify.
            </Text>
          </View>
        ) : !isReadyToStart ? (
          /* REGISTERED, but WAITING FOR ORGANIZER TO START */
          <View style={styles.lockedCluesBox}>
            <View style={styles.lockIconCircle}>
              <Clock size={26} color="#fbbf24" />
            </View>
            <Text style={styles.lockedCluesTitle}>
              Clues Locked — Waiting for Organizer to Start
            </Text>
            <Text style={styles.lockedCluesSub}>
              Registration verified! This quest is scheduled for {event.date || 'Event Day'} at {event.time || '20:00'}. As required, clues and checkpoints are locked until the organizer officially broadcasts the live start.
            </Text>
            <View style={styles.cluePlaceholderList}>
              {(event.clues || [1, 2, 3]).map((_, idx) => (
                <View key={idx} style={styles.cluePlaceholderItem}>
                  <View style={styles.clueLockDot}>
                    <Lock size={11} color="#64748b" />
                  </View>
                  <Text style={styles.cluePlaceholderText}>
                    Checkpoint #{idx + 1} — Secret riddle & hints unlock when organizer starts event
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* DAY OF THE EVENT! Clues unlocked sequentially */
          <View style={styles.unlockedCluesBox}>
            <View style={styles.eventDayNotice}>
              <CheckCircle2 size={16} color="#10b981" />
              <Text style={styles.eventDayNoticeText}>
                Event Day Active: Clues will be solved one by one sequentially!
              </Text>
            </View>

            {isReadyToStart && (
              <TouchableOpacity
                onPress={handleInitiateLaunch}
                style={styles.startEventMiniBtn}
                activeOpacity={0.8}
              >
                <Play size={15} color="#0f172a" fill="#0f172a" />
                <Text style={styles.startEventMiniBtnText}>Click "Start Event" to Begin Hunt</Text>
              </TouchableOpacity>
            )}

            <View style={styles.cluesTimeline}>
              {(event.clues || []).map((clue, idx) => (
                <View key={clue.id || idx} style={styles.cluePreviewItem}>
                  <View style={styles.clueBadgeCircle}>
                    <Text style={styles.clueBadgeNum}>{idx + 1}</Text>
                  </View>
                  <View style={styles.cluePreviewContent}>
                    <View style={styles.cluePreviewHeader}>
                      <Text style={styles.cluePreviewTitle}>
                        {clue.title || `Checkpoint #${idx + 1}`}
                      </Text>
                      <Text style={styles.cluePointsText}>+{clue.points || 100} XP</Text>
                    </View>
                    <Text style={styles.clueLocationHintText}>
                      Stage #{idx + 1}: Solve in sequential order during the live hunt
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* STRICT FAIR PLAY & ANTI-CHEAT PRE-JOIN NOTICE MODAL */}
      <FairPlayNoticeModal
        visible={showFairPlayModal}
        eventTitle={event.title}
        onAccept={handleFairPlayAccepted}
        onCancel={() => {
          setShowFairPlayModal(false);
          setPendingFairPlayAction(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  registeredPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fde047',
    textTransform: 'uppercase',
  },
  upcomingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upcomingPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: 'rgba(11, 19, 41, 0.95)',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.22)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.4,
  },
  heroDescription: {
    fontSize: 13.5,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  heroHostRow: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroHostText: {
    fontSize: 11.5,
    color: '#94a3b8',
  },

  /* Starting Point Spotlight Card */
  startingPointCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    gap: 12,
  },
  reportingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  reportingBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38bdf8',
  },
  startLocationHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  startLocationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLocationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startLocationName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    marginVertical: 2,
  },
  startLocationInstruction: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 15,
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleMetricBox: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 1,
  },

  /* Specs Grid */
  specsSubText: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: -4,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specItem: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 3,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  prizesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  prizesValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  additionalInfoText: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 16,
    marginTop: 2,
  },
  requiredItemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  requiredItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  requiredItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  feeSpecCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    gap: 6,
    marginTop: 3,
  },
  feeSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeSpecAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fbbf24',
  },
  feeSpecType: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  feeSpecRight: {
    alignItems: 'flex-end',
  },
  feeSpecPayee: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38bdf8',
  },
  feeSpecHost: {
    fontSize: 10,
    color: '#94a3b8',
  },
  feeSpecInstructions: {
    fontSize: 10.5,
    color: '#cbd5e1',
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 4,
  },
  rulesIntroText: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: -4,
  },
  quickChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  /* Section Cards */
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  sectionCardHighlight: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  registrationExplainText: {
    fontSize: 12.5,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  feeBreakdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  feeBreakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  feeBreakdownPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
  },
  feeMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  feeMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  payAndRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  payAndRegisterBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.2,
  },

  /* Registered User Banner */
  registeredStatusCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    gap: 12,
  },
  registeredStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  registeredSuccessBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  registeredStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34d399',
  },
  registeredStatusSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginTop: 2,
  },

  /* Start Event Banner */
  startEventBanner: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    gap: 8,
    marginTop: 4,
  },
  startEventBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startEventBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 0.5,
  },
  startEventBannerSub: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  startEventActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  startEventActionBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  waitingForStartBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  waitingTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  waitingSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  simulationBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  simulationBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },

  /* Notifications list */
  notificationsList: {
    gap: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  notifTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  notifDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 15,
  },
  activeAlertsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeAlertsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  lockedSectionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
  },
  lockedIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 4,
  },
  lockedSectionHeadline: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  lockedSectionText: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
  unlockAlertsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  unlockAlertsBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* Clues section */
  simulateDayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  simulateDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },
  lockedCluesBox: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  lockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  lockedCluesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  lockedCluesSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
  cluePlaceholderList: {
    width: '100%',
    gap: 6,
    marginTop: 8,
  },
  cluePlaceholderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  clueLockDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cluePlaceholderText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  unlockedCluesBox: {
    gap: 10,
  },
  eventDayNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  eventDayNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34d399',
  },
  startEventMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    borderRadius: 8,
  },
  startEventMiniBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  cluesTimeline: {
    gap: 8,
  },
  cluePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  clueBadgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueBadgeNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  cluePreviewContent: {
    flex: 1,
  },
  cluePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cluePreviewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  cluePointsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
  },
  clueLocationHintText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },

  /* Rules */
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleBullet: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  ruleText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 17,
    flex: 1,
  },
  ruleHighlight: {
    fontWeight: '800',
    color: '#f8fafc',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  registerModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  closeModalBtn: {
    padding: 4,
  },
  closeModalBtnText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  modalTextInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 10,
    color: '#94a3b8',
  },
  confirmPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  confirmPaymentBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
  },

  /* Step 2 PIN Entry */
  pinSentNotificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  pinSentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSentTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  pinSentSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 1,
  },
  pinSentHint: {
    fontSize: 10.5,
    color: '#fbbf24',
    marginTop: 2,
    fontWeight: '700',
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pinTextInput: {
    flex: 1,
    letterSpacing: 4,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  autofillPinBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  autofillPinBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
  },
  pinErrorText: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '700',
    marginTop: 2,
  },
  pinActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  backToPaymentBtn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToPaymentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  verifyPinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38bdf8',
    paddingVertical: 11,
    borderRadius: 10,
  },
  verifyPinBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0f172a',
  },
  retestUnregisterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  retestUnregisterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fca5a5',
  },

  /* Team Only Hero Banner Styles */
  teamHeroBanner: {
    backgroundColor: '#0a1526',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    boxShadow: '0 4px 18px rgba(217, 119, 6, 0.15)',
  },
  teamHeroBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamHuntPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  teamHuntPillText: {
    color: '#fef08a',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  teamHeroFeeText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'serif',
  },
  teamHeroNoticeText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  teamHeroButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroCreateTeamBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingVertical: 10,
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(217, 119, 6, 0.4)',
  },
  heroCreateTeamBtnText: {
    color: '#08111e',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroJoinTeamBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0c1a30',
    borderWidth: 1.2,
    borderColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 8,
  },
  heroJoinTeamBtnText: {
    color: '#fde047',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Section 5 Team Action Buttons */
  teamActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  createTeamBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#d97706',
    paddingVertical: 12,
    borderRadius: 10,
    boxShadow: '0 2px 12px rgba(217, 119, 6, 0.35)',
  },
  createTeamBtnText: {
    color: '#08111e',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  joinTeamBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#0d1d36',
    borderWidth: 1.2,
    borderColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
  },
  joinTeamBtnText: {
    color: '#fef08a',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  disqualifiedWarningBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.35)',
  },
  disqualifiedWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  disqualifiedWarningTitle: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  disqualifiedWarningText: {
    color: '#fca5a5',
    fontSize: 12.5,
    lineHeight: 18,
  },
  disqualifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disqualifiedPillText: {
    color: '#f87171',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  disqualifiedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    opacity: 0.9,
  },
  disqualifiedActionBtnText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
