import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Polygon,
  Line,
  G,
} from 'react-native-svg';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  CreditCard,
  QrCode,
  Check,
  X,
  Play,
  Copy,
  Clock,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  ArrowRight,
  Flame,
  Trophy,
  Compass,
  Smartphone,
  Bell,
  Award,
  Radio,
  ChevronRight,
  Info,
  FileText,
  ArrowLeft,
  Crown,
  Plus,
  Share2,
} from 'lucide-react-native';
import { TreasureEvent, UserProfile } from '../../types';
import { INITIAL_EVENTS } from '../../data/mockData';
import { apiFetch } from '../../lib/apiFetch';
import { CampusQuestPaymentModal } from './CampusQuestPaymentModal';
import { createNewTeam, findTeamByCode, addMemberToTeam } from '../../utils/teamManager';
import { addPlayerNotification } from '../../utils/notificationHelper';
import { playSuccessSound } from '../../utils/audioEffects';
import {
  isEventStartedByOrganizer,
  formatEventSchedule,
} from '../../utils/eventStatusHelper';
import { recordNewPayment } from '../../utils/paymentManager';
import {
  CampusQuestCheckoutResult,
  buildSandboxCheckoutPayload,
  createSandboxTransactionId,
  parseConfirmedSandboxCheckout,
} from '../../lib/paymentCheckout';

async function readJsonSafely(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getPaymentErrorMessage(status: number, payload: any): string {
  const serverMessage = typeof payload?.error === 'string' ? payload.error : '';
  const code = typeof payload?.code === 'string' ? payload.code : '';

  if (status === 401) {
    return 'Your session has expired. Please log out and sign in again.';
  }
  if (code === 'SANDBOX_DISABLED') {
    return 'Sandbox payments are disabled on this server. Please contact the organizer.';
  }
  if (code === 'INVALID_SANDBOX_TRANSACTION') {
    return 'The simulated transaction reference is invalid. Please reopen checkout and try again.';
  }
  if (code === 'USE_SANDBOX_CHECKOUT') {
    return 'Please complete this payment using the one-click sandbox checkout.';
  }
  if (code === 'EVENT_NOT_PAID') {
    return 'This event does not require a sandbox payment.';
  }
  if (code === 'TEAM_NAME_REQUIRED') {
    return 'Please enter a team squad name.';
  }
  if (code === 'ALREADY_REGISTERED') {
    return serverMessage || 'You are already registered for this event.';
  }
  if (status === 409) {
    return serverMessage || 'This checkout was already used. Please reopen checkout and try again.';
  }
  if (status === 403) {
    return serverMessage || 'You do not have permission to complete this payment.';
  }
  if (status === 404) {
    return 'This event could not be found. Please refresh and try again.';
  }
  if (status === 400 || status === 422) {
    return serverMessage || 'The event or payment details are invalid. Please check them and try again.';
  }
  if (status >= 500) {
    return 'The Campus Quest backend could not process the payment. Please try again.';
  }
  return serverMessage || 'Payment submission failed. Please try again.';
}

interface PlayerHomeDashboardProps {
  user: UserProfile;
  events: TreasureEvent[];
  joinedEventIds: string[];
  eliminatedEventIds?: string[];
  activeEvent?: TreasureEvent | null;
  registrationRequest?: TreasureEvent | null;
  onRegistrationRequestHandled?: () => void;
  onSelectEvent: (event: TreasureEvent) => void;
  onLaunchGame: (event: TreasureEvent) => void;
  onJoinEvent: (event: TreasureEvent, codeEntered: string) => boolean;
  onGoToMyEvents: () => void;
  onGoToRankings: () => void;
  onGoToRewards: () => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onUpdateEvent?: (event: TreasureEvent) => void;
}

export const PlayerHomeDashboard: React.FC<PlayerHomeDashboardProps> = ({
  user,
  events,
  joinedEventIds,
  eliminatedEventIds = [],
  registrationRequest,
  onRegistrationRequestHandled,
  onLaunchGame,
  onJoinEvent,
  onUpdateEvent,
}) => {
  // Merge initial dummy organizer events with any live organizer events so available events are always populated
  const displayEvents = useMemo(() => {
    const list: TreasureEvent[] = [];
    const seen = new Set<string>();

    // 1. Any organizer-created events
    if (Array.isArray(events)) {
      for (const e of events) {
        if (e && e.id && !seen.has(e.id)) {
          seen.add(e.id);
          list.push(e);
        }
      }
    }

    // 2. Predefined organizer dummy events
    for (const e of INITIAL_EVENTS) {
      if (e && e.id && !seen.has(e.id)) {
        seen.add(e.id);
        list.push(e);
      }
    }

    return list;
  }, [events]);

  // Selected Difficulty filter ('all', 'easy', 'medium', 'hard', 'master', 'expert')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const filterScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScrollLeft = () => {
    filterScrollRef.current?.scrollTo({ x: 0, animated: true });
  };

  const handleScrollRight = () => {
    filterScrollRef.current?.scrollTo({ x: 260, animated: true });
  };

  const handleTrackPress = (event: any) => {
    const clickX = event.nativeEvent?.locationX ?? 70;
    if (clickX < 130) {
      handleScrollLeft();
    } else {
      handleScrollRight();
    }
  };

  // Detailed Description Modal state (When, Where, Mode, What to carry, Prizes)
  const [viewingDetailsEvent, setViewingDetailsEvent] = useState<TreasureEvent | null>(null);

  // Registration & Payment Modal states
  const [registeringEvent, setRegisteringEvent] = useState<TreasureEvent | null>(null);
  const [teamName, setTeamName] = useState(`${user.username || 'Explorer'}'s Squad`);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentConfirmation, setPaymentConfirmation] = useState<CampusQuestCheckoutResult | null>(null);

  const [copiedPinToast, setCopiedPinToast] = useState(false);

  // Ready To Start - Enter PIN Modal
  const [pinEntryEvent, setPinEntryEvent] = useState<TreasureEvent | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinValidationError, setPinValidationError] = useState('');
  const [pinValidationSuccess, setPinValidationSuccess] = useState(false);

  // Track events that are paid and waiting for organizer to start
  const [waitingEventIds, setWaitingEventIds] = useState<string[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(`campus_waiting_${user.username || 'user'}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return [];
  });

  // Track events where organizer has started the hunt (Global shared storage)
  const [startedEventIds, setStartedEventIds] = useState<string[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('campus_started_event_ids');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return [];
  });

  // Modal state when player clicks "WAITING FOR ORGANIZER TO START"
  const [waitingModalEvent, setWaitingModalEvent] = useState<TreasureEvent | null>(null);

  // Reactive listener for organizer live start broadcasts across components and windows
  useEffect(() => {
    const handleEventStarted = (e: any) => {
      const eventId = e.detail?.eventId;
      if (eventId) {
        setStartedEventIds((prev) => Array.from(new Set([...prev, eventId])));
        setWaitingModalEvent((prev) => (prev?.id === eventId ? null : prev));
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('campus_event_started', handleEventStarted);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('campus_event_started', handleEventStarted);
      }
    };
  }, []);

  // Floating Notification Bar Toast for 6-digit PIN delivery
  const [floatingNotification, setFloatingNotification] = useState<{
    title: string;
    pin: string;
    eventTitle: string;
    paymentStatus?: 'pending' | 'verified' | 'rejected';
    orderId?: string;
    message?: string;
  } | null>(null);

  // Track paid event PINs in localStorage for persistence
  const [paidEventPins, setPaidEventPins] = useState<Record<string, string>>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(`campus_paid_pins_${user.username || 'user'}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  });

  // Filter events by difficulty
  const filteredEvents = useMemo(() => {
    if (selectedDifficulty === 'all') return displayEvents;
    return displayEvents.filter(
      (e) => (e.difficulty || 'Medium').toLowerCase() === selectedDifficulty.toLowerCase()
    );
  }, [displayEvents, selectedDifficulty]);

  // Helper to determine if an event is team only
  const isEventTeamOnly = (evt?: TreasureEvent | null): boolean => {
    if (!evt) return false;
    return Boolean(
      (evt.description &&
        (evt.description.toLowerCase().includes('team only') ||
          evt.description.toLowerCase().includes('no solo') ||
          evt.description.toLowerCase().includes('team hunt') ||
          evt.description.toLowerCase().includes('squad only'))) ||
        (Boolean(evt.minTeamSize) && (evt.minTeamSize as number) > 1) ||
        evt.eventType === 'Team Hunt'
    );
  };

  // Active tab within the Event Hub Modal ('briefing' | 'team' | 'payment')
  const [eventModalTab, setEventModalTab] = useState<'briefing' | 'team' | 'payment'>('briefing');
  const [teamModalSubMode, setTeamModalSubMode] = useState<'create' | 'join'>('create');
  const [customTeamName, setCustomTeamName] = useState(`${user.username || 'Explorer'}'s Squad`);
  const [createdTeamCode, setCreatedTeamCode] = useState('T7K2QX');
  const [teamCodeCopied, setTeamCodeCopied] = useState(false);
  const [teamCodeShared, setTeamCodeShared] = useState(false);
  const [joinCodeDigits, setJoinCodeDigits] = useState<string[]>(['T', '7', 'K', '2', 'Q', 'X']);
  const [foundTeamInHome, setFoundTeamInHome] = useState<any>(null);
  const [joinTeamSearchError, setJoinTeamSearchError] = useState('');
  const [joinTeamSuccessNotice, setJoinTeamSuccessNotice] = useState(false);

  const handleCopyTeamCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(createdTeamCode);
      setTeamCodeCopied(true);
      setTimeout(() => setTeamCodeCopied(false), 2200);
    }
  };

  const handleShareTeamCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `Join my squad "${customTeamName}" for ${viewingDetailsEvent?.title || 'Campus Quest'}! Enter Team Code: ${createdTeamCode} in Campus Quest.`
      );
    }
    setTeamCodeShared(true);
    setTimeout(() => setTeamCodeShared(false), 2500);
  };

  const handleJoinDigitChange = (val: string, index: number) => {
    const cleaned = val.toUpperCase().slice(-1);
    const updated = [...joinCodeDigits];
    updated[index] = cleaned;
    setJoinCodeDigits(updated);
    setJoinTeamSearchError('');
  };

  const handleFindTeamInHome = () => {
    const code = joinCodeDigits.join('');
    const team = findTeamByCode(code);
    if (team) {
      setFoundTeamInHome(team);
      setJoinTeamSearchError('');
      playSuccessSound();
    } else {
      setJoinTeamSearchError(`No team found with code "${code}". Try demo code "T7K2QX".`);
    }
  };

  const handleJoinTeamInHome = () => {
    if (!foundTeamInHome || !viewingDetailsEvent) return;
    playSuccessSound();

    const result = addMemberToTeam(foundTeamInHome.code, user.username || 'Explorer');
    if (!result) return;
    const { team, member } = result;

    // Send Leader Notification
    addPlayerNotification({
      type: 'team_join_request',
      title: `Squad Join Request: ${member.name}`,
      message: `${member.name} has requested to join your squad "${team.name}" for "${team.eventTitle}". As Team Leader, you can accept or decline their roster spot.`,
      actionScreen: 'home',
      teamCode: team.code,
      memberId: member.id,
      memberName: member.name,
      requiresLeaderAction: true,
      actionStatus: 'pending',
      fee: team.fee || viewingDetailsEvent.registrationFee || 199,
      eventVenue: team.venue || viewingDetailsEvent.startLocation || 'Campus Quad',
      eventDate: team.date || viewingDetailsEvent.date || '2026-10-31',
      eventTime: team.time || viewingDetailsEvent.time || '20:00',
      eventDuration: team.duration || viewingDetailsEvent.duration || '2.5 Hours',
      eventPin: team.pin || viewingDetailsEvent.code || '849201',
    });

    setJoinTeamSuccessNotice(true);
    setTimeout(() => {
      setViewingDetailsEvent(null);
    }, 1800);
  };

  // Called when leader clicks "PROCEED TO PAYMENT (₹199) →" on the Team tab
  const handleProceedFromTeamToPayment = () => {
    const targetEvt = viewingDetailsEvent;
    if (!targetEvt) return;

    const actualName = customTeamName.trim() || `${user.username || 'Explorer'}'s Squad`;
    setTeamName(actualName);

    // Create team record
    createNewTeam({
      code: createdTeamCode,
      name: actualName,
      eventId: targetEvt.id,
      eventTitle: targetEvt.title,
      leaderName: user.username || 'Team Leader',
      members: [
        {
          id: `mem-${Date.now()}`,
          name: user.username || 'You',
          role: 'leader',
          status: 'accepted',
          joinedAt: 'Just now',
        },
      ],
      maxMembers: targetEvt.maxTeamSize || 4,
      fee: targetEvt.registrationFee || 199,
      isPaid: false,
      pin: targetEvt.code || '849201',
      venue: targetEvt.startLocation || targetEvt.campusName || 'Campus Quad',
      date: targetEvt.date || '2026-10-31',
      time: targetEvt.time || '20:00',
      duration: targetEvt.duration || '2.5 Hours',
    });

    // Move to payment step
    setPaymentError('');
    setPaymentConfirmation(null);
    setEventModalTab('payment');
  };

  // Handle open registration & payment modal or details modal
  const handleOpenEventModal = (
    evt: TreasureEvent,
    tab?: 'briefing' | 'team' | 'payment'
  ) => {
    setViewingDetailsEvent(evt);
    const isTeam = isEventTeamOnly(evt);
    if (tab) {
      setEventModalTab(tab);
    } else {
      setEventModalTab('briefing');
    }
    setTeamName(`${user.username || 'Explorer'}'s Squad`);
    setCustomTeamName(`${user.username || 'Explorer'}'s Squad`);
    setCreatedTeamCode('T7K2QX');
    setPaymentError('');
    setPaymentConfirmation(null);
    setTeamModalSubMode('create');
    setFoundTeamInHome(null);
    setJoinTeamSearchError('');
    setJoinTeamSuccessNotice(false);
  };

  const handleOpenRegister = (evt: TreasureEvent) => {
    const isTeam = isEventTeamOnly(evt);
    handleOpenEventModal(evt, isTeam ? 'team' : 'payment');
  };

  useEffect(() => {
    if (!registrationRequest) return;
    handleOpenRegister(registrationRequest);
    onRegistrationRequestHandled?.();
  }, [registrationRequest]);

  // Submit one-click sandbox checkout; success is shown only after the backend
  // confirms both the simulated payment and the registration.
  const handleConfirmPayment = async (paymentData: {
    teamName: string;
    transactionId: string;
  }) => {
    const targetEvt = viewingDetailsEvent || registeringEvent;
    if (!targetEvt) return;

    const actualTeam = paymentData?.teamName?.trim() || teamName.trim();
    if (!actualTeam) {
      setPaymentError('Please enter a team squad name.');
      return;
    }

    const payTxnId = paymentData?.transactionId || createSandboxTransactionId();
    const checkoutPayload = buildSandboxCheckoutPayload(actualTeam, payTxnId);

    setIsProcessingPayment(true);
    setPaymentError('');
    setPaymentConfirmation(null);

    try {
      const checkoutRes = await apiFetch(`/api/events/${targetEvt.id}/sandbox-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      const checkoutData = await readJsonSafely(checkoutRes);

      if (!checkoutRes.ok) {
        setPaymentError(getPaymentErrorMessage(checkoutRes.status, checkoutData));
        return;
      }

      const confirmed = parseConfirmedSandboxCheckout(checkoutData, {
        title: targetEvt.title,
        currency: targetEvt.currency,
      });

      if (!confirmed) {
        setPaymentError(
          'The Campus Quest backend did not confirm both payment and registration. Please reopen checkout and try again.'
        );
        return;
      }

      const paymentRecord = checkoutData?.payment;

      recordNewPayment({
        id: paymentRecord?.id || `pay-${Date.now()}`,
        eventId: targetEvt.id,
        eventTitle: targetEvt.title,
        userId: user.id || user.email || user.username || 'usr_registered',
        userEmail: user.email || '',
        username: user.username || 'Explorer',
        teamName: actualTeam,
        teamCode: targetEvt.code ? `${targetEvt.code.slice(0, 3)}TEAM` : 'SQUAD',
        amount: confirmed.amount,
        currency: confirmed.currencySymbol,
        paymentMethod: 'Sandbox Simulation',
        utrNumber: '',
        paymentMode: 'sandbox',
        isSimulated: true,
        transactionId: confirmed.transactionId,
        status: 'verified',
        timestamp: paymentRecord?.createdAt || new Date().toISOString(),
        pinIssued: targetEvt.code || '',
        orderId: confirmed.orderId,
      });

      setPaymentConfirmation(confirmed);
      setFloatingNotification({
        title: 'Registration Confirmed',
        pin: '',
        eventTitle: targetEvt.title,
        paymentStatus: 'verified',
        orderId: confirmed.orderId,
        message: 'Sandbox payment successful. Your registration is confirmed.',
      });

      onJoinEvent(targetEvt, targetEvt.code || '');
      playSuccessSound();
    } catch (err: any) {
      const message = typeof err?.message === 'string' ? err.message : '';
      const networkFailure = err instanceof TypeError || /network|fetch|load failed|failed to fetch/i.test(message);
      setPaymentError(
        networkFailure
          ? 'Unable to reach the Campus Quest backend. Check your Wi-Fi connection and try again.'
          : 'Payment and registration could not be completed. Please try again.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Copy PIN helper
  const handleCopyPin = (code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code);
      }
    } catch (e) {}
    setCopiedPinToast(true);
    setTimeout(() => setCopiedPinToast(false), 2000);
  };

  // Open Enter PIN modal
  const handleOpenPinModal = (evt: TreasureEvent) => {
    setPinEntryEvent(evt);
    setEnteredPin('');
    setPinValidationError('');
    setPinValidationSuccess(false);
  };

  // Keypad press handlers
  const handleKeypadPress = (digit: string) => {
    const maxDigits = pinEntryEvent?.code?.length || 6;
    if (enteredPin.length < maxDigits) {
      setEnteredPin((prev) => prev + digit);
      setPinValidationError('');
    }
  };

  const handleKeypadBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinValidationError('');
  };

  const handleKeypadClear = () => {
    setEnteredPin('');
    setPinValidationError('');
  };

  // Verify PIN & Launch Live Game
  const handleVerifyPinAndStart = () => {
    if (!pinEntryEvent) return;

    const cleanPin = enteredPin.trim();
    const expectedPin = pinEntryEvent.code || '849201';

    if (!cleanPin) {
      setPinValidationError('Please enter the 6-digit PIN given upon payment.');
      return;
    }

    if (cleanPin !== expectedPin) {
      setPinValidationError(`Incorrect PIN. The 6-digit access PIN for this event is: ${expectedPin}`);
      return;
    }

    // Success! Launch active quest game
    setPinValidationSuccess(true);
    setPinValidationError('');

    setTimeout(() => {
      setPinEntryEvent(null);
      onLaunchGame(pinEntryEvent);
    }, 600);
  };

  // Helper for difficulty stars & text
  const getDifficultyMeta = (diff?: string) => {
    const d = (diff || 'Medium').toLowerCase();
    switch (d) {
      case 'easy':
        return { stars: '★', label: 'EASY', color: '#fef08a' };
      case 'hard':
        return { stars: '★★★', label: 'HARD', color: '#fef08a' };
      case 'master':
        return { stars: '★★★★', label: 'MASTER', color: '#fef08a' };
      case 'expert':
        return { stars: '★★★★★', label: 'EXPERT', color: '#fef08a' };
      case 'medium':
      default:
        return { stars: '★★', label: 'MEDIUM', color: '#fef08a' };
    }
  };

  const isViewingTeamOnly = viewingDetailsEvent ? isEventTeamOnly(viewingDetailsEvent) : false;

  return (
    <View style={styles.container}>
      {/* Floating Notification Bar: 6-Digit PIN Banner Alert */}
      {floatingNotification && (
        <View style={styles.floatingNotifBanner}>
          <View style={styles.floatingNotifLeft}>
            <View style={styles.notifIconCircle}>
              <Bell size={15} color="#0f172a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingNotifTitle}>
                {floatingNotification.title}
              </Text>
              {floatingNotification.pin ? (
                <Text style={styles.floatingNotifDesc} numberOfLines={1}>
                  {floatingNotification.eventTitle} · PIN: <Text style={styles.notifPinHighlight}>{floatingNotification.pin}</Text>
                </Text>
              ) : (
                <Text style={styles.floatingNotifDesc} numberOfLines={2}>
                  {floatingNotification.message || floatingNotification.eventTitle || 'Campus Quest update'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.floatingNotifActions}>
            {floatingNotification.pin ? (
              <TouchableOpacity
                onPress={() => handleCopyPin(floatingNotification.pin)}
                {...({ onClick: () => handleCopyPin(floatingNotification.pin) } as any)}
                style={styles.notifCopyBtn}
                activeOpacity={0.7}
              >
                <Copy size={12} color="#0f172a" />
                <Text style={styles.notifCopyText}>{copiedPinToast ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => setFloatingNotification(null)}
              {...({ onClick: () => setFloatingNotification(null) } as any)}
              style={styles.notifDismissBtn}
              activeOpacity={0.7}
            >
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              style={{ backgroundColor: 'transparent' }}
            >
        {/* ======================================================== */}
        {/* "CAMPUS QUEST" & "AVAILABLE QUESTS" HEADER               */}
        {/* ======================================================== */}
        <View style={styles.titleBannerContainer}>
          <Text style={[styles.mainTitleText, { fontFamily: 'Cinzel, serif' }]}>CAMPUS QUEST</Text>
          <View style={styles.beadedArcWrap}>
            <Svg width={230} height={20} viewBox="0 0 230 20">
              <Path d="M 8 6 Q 115 22 222 6" stroke="#16a34a" strokeWidth={1.8} fill="none" />
              {[22, 50, 80, 105, 115, 125, 150, 180, 208].map((cx, i) => (
                <G key={i}>
                  <Circle cx={cx} cy={6 + Math.sin((cx / 230) * Math.PI) * 12} r={3.8} fill="#22c55e" opacity="0.35" />
                  <Circle cx={cx} cy={6 + Math.sin((cx / 230) * Math.PI) * 12} r={2.4} fill="#4ade80" />
                  <Circle cx={cx} cy={6 + Math.sin((cx / 230) * Math.PI) * 12} r={1} fill="#f0fdf4" />
                </G>
              ))}
            </Svg>
          </View>
          {/* "AVAILABLE QUESTS" Button Badge */}
          <View style={[styles.availableQuestsBadge, { backgroundColor: 'rgba(10, 17, 44, 0.86)', borderWidth: 2, borderColor: '#d9a21b' }]}>
            <Text style={[styles.availableQuestsText, { fontFamily: 'Cinzel, serif', color: '#fbbf24' }]}>AVAILABLE QUESTS</Text>
          </View>
        </View>

        {/* ======================================================== */}
        {/* DIFFICULTY FILTER TABS (All, Easy, Medium, Hard, Master, Expert) */}
        {/* ======================================================== */}
        <View style={styles.filterTabsRow}>
          <ScrollView
            ref={filterScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
            onScroll={(e) => {
              const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
              const max = contentSize.width - layoutMeasurement.width;
              if (max > 0) {
                setScrollProgress(Math.max(0, Math.min(1, contentOffset.x / max)));
              }
            }}
            scrollEventThrottle={16}
          >
            {[
              { id: 'all', label: 'All' },
              { id: 'easy', label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
              { id: 'master', label: 'Master' },
              { id: 'expert', label: 'Expert' },
            ].map((tab, idx) => {
              const isActive = selectedDifficulty === tab.id;
              const handleFilterPress = () => {
                setSelectedDifficulty(tab.id);
                if (idx >= 4) {
                  filterScrollRef.current?.scrollTo({ x: 260, animated: true });
                } else if (idx <= 1) {
                  filterScrollRef.current?.scrollTo({ x: 0, animated: true });
                }
              };
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={handleFilterPress}
                  {...({ onClick: handleFilterPress } as any)}
                  activeOpacity={0.8}
                  style={[
                    styles.difficultyFilterPill,
                    isActive && [styles.difficultyFilterPillActive, { borderColor: '#fbbf24' }],
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyFilterText,
                      { fontFamily: 'Cinzel, serif' },
                      isActive && styles.difficultyFilterTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Horizontal Slide Bar with Navigation Arrows matching the reference design */}
          <View style={styles.slideBarContainer}>
            <TouchableOpacity
              onPress={handleScrollLeft}
              {...({ onClick: handleScrollLeft } as any)}
              style={styles.slideArrowBtn}
              activeOpacity={0.7}
              accessibilityLabel="Scroll Left"
            >
              <Text style={styles.slideArrowText}>◄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleTrackPress}
              {...({ onClick: handleTrackPress } as any)}
              style={styles.slideTrack}
            >
              <View
                style={[
                  styles.slideThumb,
                  {
                    left: `${Math.round(scrollProgress * 55)}%`,
                    width: '45%',
                  },
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleScrollRight}
              {...({ onClick: handleScrollRight } as any)}
              style={styles.slideArrowBtn}
              activeOpacity={0.7}
              accessibilityLabel="Scroll Right"
            >
              <Text style={styles.slideArrowText}>►</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* AVAILABLE QUEST CARDS LIST                               */}
        {/* ======================================================== */}
        <View style={styles.questsList}>
          {filteredEvents.map((event) => {
            const isRegistered = joinedEventIds.includes(event.id);
            const isStarted = startedEventIds.includes(event.id) || isEventStartedByOrganizer(event);
            const savedPin = paidEventPins[event.id] || event.code || '849201';
            const diffMeta = getDifficultyMeta(event.difficulty);
            const totalPoints =
              event.clues?.reduce((sum, c) => sum + (c.points || 100), 0) || 700;
            const cluesCount = event.clues?.length || 4;
            const feePrice = event.registrationFee || 199;

            return (
              <View key={event.id} style={[styles.questCard, { backgroundColor: 'rgba(10, 17, 44, 0.86)', borderWidth: 2, borderColor: '#d9a21b', borderRadius: 18 }]}>
                {/* Header Row: Difficulty stars on left, Status on right */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.difficultyStarsBadge}>
                    <Text style={styles.difficultyStarsText}>
                      {diffMeta.stars} {diffMeta.label}
                    </Text>
                  </View>

                  {isRegistered ? (
                    <View style={isStarted ? styles.readyStartedBadge : styles.registeredPaidBadge}>
                      {isStarted ? (
                        <>
                          <Flame size={11} color="#ffffff" />
                          <Text style={styles.registeredPaidText}>HUNT IS READY</Text>
                        </>
                      ) : (
                        <>
                          <Check size={11} color="#ffffff" strokeWidth={3} />
                          <Text style={styles.registeredPaidText}>REGISTERED & PAID</Text>
                        </>
                      )}
                    </View>
                  ) : (
                    <View style={styles.openNowBadge}>
                      <Text style={styles.openNowText}>OPEN NOW</Text>
                    </View>
                  )}
                </View>

                {/* Event Title (Golden serif font) - Tap to open details */}
                <TouchableOpacity
                  onPress={() => handleOpenEventModal(event, 'briefing')}
                  {...({ onClick: () => handleOpenEventModal(event, 'briefing') } as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cardTitle, { fontFamily: 'Cinzel, serif', color: '#fbbf24' }]}>{event.title.toUpperCase()}</Text>
                </TouchableOpacity>

                {/* Location & Date */}
                <Text style={styles.cardSubtitle}>
                  {event.campusName} · {event.date || '2026-09-30'}
                </Text>

                {/* Badges & Price Row */}
                <View style={styles.cardMetaRow}>
                  <View style={styles.cardPillsGroup}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{cluesCount} clues</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{totalPoints} XP</Text>
                    </View>
                  </View>

                  <Text style={styles.cardPriceText}>₹{feePrice}</Text>
                </View>

                {/* CTA Action Section */}
                {!isRegistered ? (
                  <TouchableOpacity
                    onPress={() => handleOpenEventModal(event, 'briefing')}
                    {...({ onClick: () => handleOpenEventModal(event, 'briefing') } as any)}
                    activeOpacity={0.75}
                    style={[styles.joinQuestBtn, { borderWidth: 2, borderColor: '#fbbf24', borderRadius: 14, backgroundColor: '#d2691a' }]}
                  >
                    <Text style={[styles.joinQuestBtnText, { fontFamily: 'Cinzel, serif' }]}>JOIN QUEST</Text>
                  </TouchableOpacity>
                ) : !isStarted ? (
                  <TouchableOpacity
                    onPress={() => setWaitingModalEvent(event)}
                    {...({ onClick: () => setWaitingModalEvent(event) } as any)}
                    activeOpacity={0.75}
                    style={[styles.waitingBtn, { backgroundColor: 'rgba(8, 14, 38, 0.85)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)' }]}
                  >
                    <Clock size={15} color="#fbbf24" />
                    <Text style={[styles.waitingBtnText, { fontFamily: 'Nunito, sans-serif' }]}>
                      WAITING FOR ORGANIZER TO START
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleOpenPinModal(event)}
                    {...({ onClick: () => handleOpenPinModal(event) } as any)}
                    activeOpacity={0.75}
                    style={[styles.startEventPinBtn, { backgroundColor: '#d2691a', borderWidth: 2, borderColor: '#fbbf24', borderRadius: 14 }]}
                  >
                    <Play size={16} color="#0f172a" fill="#0f172a" />
                    <Text style={[styles.startEventPinBtnText, { fontFamily: 'Cinzel, serif' }]}>
                      EVENT READY TO START • ENTER PIN
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ======================================================== */}
      {/* 0. PROPER EVENT DETAILS MODAL (WHEN, WHERE, MODE, CARRY) */}
      {/* ======================================================== */}
      {viewingDetailsEvent && eventModalTab !== 'payment' && (
        <Modal
          transparent
          animationType="fade"
          visible={Boolean(viewingDetailsEvent && eventModalTab !== 'payment')}
          onRequestClose={() => setViewingDetailsEvent(null)}
        >
          <View style={styles.modalOverlay}>
            {eventModalTab === 'team' ? (
              /* ======================================================== */
              /* DEDICATED AUTHENTIC TEAM MODAL (EXACT USER REFERENCE UI) */
              /* ======================================================== */
              <View style={styles.authenticTeamModalCard}>
                {/* Atmospheric Nocturnal Campus Background Art */}
                <View style={styles.teamModalBgArt} pointerEvents="none">
                  <Svg width="100%" height="100%" viewBox="0 0 380 720" preserveAspectRatio="xMidYMid slice">
                    <Defs>
                      <LinearGradient id="teamSkyGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#050b18" />
                        <Stop offset="0.5" stopColor="#091428" />
                        <Stop offset="1" stopColor="#040813" />
                      </LinearGradient>
                      <RadialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                        <Stop offset="40%" stopColor="#eab308" stopOpacity="0.5" />
                        <Stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                      </RadialGradient>
                      <RadialGradient id="clockGlow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#eab308" stopOpacity="0.8" />
                      </RadialGradient>
                    </Defs>

                    {/* Dark midnight sky */}
                    <Rect width="380" height="720" fill="url(#teamSkyGrad)" />

                    {/* Top foliage curved arches */}
                    <Path d="M 0 0 L 140 0 C 130 60 70 90 0 100 Z" fill="#0d281e" opacity="0.85" />
                    <Path d="M 240 0 C 260 50 320 80 380 90 L 380 0 Z" fill="#0d281e" opacity="0.85" />
                    <Path d="M 270 0 C 290 35 340 55 380 60 L 380 0 Z" fill="#143e2e" opacity="0.95" />

                    {/* Crescent Moon */}
                    <Path d="M 320 28 A 18 18 0 1 0 338 52 A 22 22 0 0 1 320 28 Z" fill="#fef08a" opacity="0.45" />

                    {/* Clocktower silhouette */}
                    <Path
                      d="M 120 720 L 120 540 L 160 540 L 160 480 L 190 440 L 220 480 L 220 540 L 260 540 L 260 720 Z"
                      fill="#071120"
                      opacity="0.95"
                    />
                    <Polygon points="190,430 165,480 215,480" fill="#050d1a" />

                    {/* Lit windows */}
                    <Rect x="183" y="505" width="14" height="20" rx="3" fill="#facc15" opacity="0.85" />
                    <Rect x="183" y="535" width="14" height="20" rx="3" fill="#facc15" opacity="0.85" />
                    <Rect x="183" y="565" width="14" height="20" rx="3" fill="#facc15" opacity="0.85" />

                    {/* Lit clock face */}
                    <Circle cx="190" cy="470" r="14" fill="url(#clockGlow)" />
                    <Circle cx="190" cy="470" r="12" fill="#fef08a" />
                    <Line x1="190" y1="470" x2="190" y2="462" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                    <Line x1="190" y1="470" x2="196" y2="470" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />

                    {/* Vintage Lit Street Lamp */}
                    <Line x1="75" y1="720" x2="75" y2="530" stroke="#334155" strokeWidth="3" />
                    <Rect x="67" y="515" width="16" height="22" rx="4" fill="#fef08a" opacity="0.95" />
                    <Polygon points="75,507 63,516 87,516" fill="#1e293b" />
                    <Circle cx="75" cy="526" r="28" fill="url(#lampGlow)" opacity="0.65" />
                  </Svg>
                </View>

                {/* Header matching reference */}
                <View style={styles.teamModalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamModalMainTitle}>
                      {teamModalSubMode === 'create' ? 'CREATE YOUR TEAM' : 'JOIN A TEAM'}
                    </Text>
                    <Text style={styles.teamModalSubtitle}>
                      {teamModalSubMode === 'create'
                        ? 'You are the Team Leader'
                        : 'Enter the team code from your leader'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setViewingDetailsEvent(null)}
                    {...({ onClick: () => setViewingDetailsEvent(null) } as any)}
                    style={styles.teamModalCloseBtn}
                  >
                    <X size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Sub-mode Toggle (Create vs Join) */}
                <View style={[styles.teamSubModeToggle, { marginHorizontal: 18, marginTop: 10, marginBottom: 12 }]}>
                  <TouchableOpacity
                    onPress={() => setTeamModalSubMode('create')}
                    {...({ onClick: () => setTeamModalSubMode('create') } as any)}
                    style={[styles.teamSubModeBtn, teamModalSubMode === 'create' && styles.teamSubModeBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Crown size={13} color={teamModalSubMode === 'create' ? '#0f172a' : '#fbbf24'} />
                    <Text style={[styles.teamSubModeText, teamModalSubMode === 'create' && styles.teamSubModeTextActive]}>
                      CREATE YOUR TEAM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setTeamModalSubMode('join')}
                    {...({ onClick: () => setTeamModalSubMode('join') } as any)}
                    style={[styles.teamSubModeBtn, teamModalSubMode === 'join' && styles.teamSubModeBtnActive]}
                    activeOpacity={0.7}
                  >
                    <Users size={13} color={teamModalSubMode === 'join' ? '#0f172a' : '#94a3b8'} />
                    <Text style={[styles.teamSubModeText, teamModalSubMode === 'join' && styles.teamSubModeTextActive]}>
                      JOIN A TEAM
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Main Scrollable Content */}
                <ScrollView
                  style={styles.teamModalScroll}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={false}
                >
                  {teamModalSubMode === 'create' ? (
                    <>
                      {/* CARD 1: Event Summary Frame */}
                      <View style={styles.teamCardFrame}>
                        <View style={styles.teamBadgeRow}>
                          <View style={styles.teamStarsBadge}>
                            <Text style={styles.teamStarsText}>
                              {getDifficultyMeta(viewingDetailsEvent.difficulty).stars} {getDifficultyMeta(viewingDetailsEvent.difficulty).label}
                            </Text>
                          </View>
                          <View style={styles.teamHuntTypePill}>
                            <Text style={styles.teamHuntTypePillText}>TEAM HUNT</Text>
                          </View>
                        </View>
                        <Text style={styles.teamEventTitle}>{viewingDetailsEvent.title.toUpperCase()}</Text>
                        <Text style={styles.teamEventMeta}>
                          {viewingDetailsEvent.campusName} · {viewingDetailsEvent.date || '2026-08-10'}
                        </Text>
                        <View style={styles.teamFeeRow}>
                          <Text style={styles.teamFeeLabel}>Team fee</Text>
                          <Text style={styles.teamFeeValue}>₹{viewingDetailsEvent.registrationFee || 199}</Text>
                        </View>
                      </View>

                      {/* CARD 2: TEAM NAME */}
                      <View style={styles.teamCardFrame}>
                        <Text style={styles.teamCardLabel}>TEAM NAME</Text>
                        <TextInput
                          style={styles.teamNameInput}
                          value={customTeamName}
                          onChangeText={setCustomTeamName}
                          placeholder="Choose a team name"
                          placeholderTextColor="#64748b"
                        />
                      </View>

                      {/* CARD 3: YOUR TEAM */}
                      <View style={styles.teamCardFrame}>
                        <View style={styles.teamCardHeaderRow}>
                          <Text style={styles.teamCardLabel}>YOUR TEAM</Text>
                          <Text style={styles.teamJoinedCount}>
                            1 / {viewingDetailsEvent.maxTeamSize || 4} joined
                          </Text>
                        </View>

                        {/* Leader row */}
                        <View style={styles.teamMemberRowActive}>
                          <View style={styles.teamMemberAvatar}>
                            <Text style={styles.teamMemberAvatarText}>
                              {(user.username || 'Y').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.teamMemberName}>
                            {user.username ? `${user.username} (You)` : 'You'}
                          </Text>
                          <View style={styles.teamLeaderBadge}>
                            <Crown size={12} color="#fbbf24" />
                            <Text style={styles.teamLeaderBadgeText}>TEAM LEADER</Text>
                          </View>
                        </View>

                        {/* Waiting slots with dashed borders */}
                        {Array.from({ length: Math.max(1, (viewingDetailsEvent.maxTeamSize || 4) - 1) }).map(
                          (_, idx) => (
                            <View key={idx} style={styles.teamMemberRowSlot}>
                              <View style={styles.teamSlotPlusCircle}>
                                <Plus size={14} color="#64748b" />
                              </View>
                              <Text style={styles.teamSlotText}>Waiting for a teammate...</Text>
                            </View>
                          )
                        )}
                      </View>

                      {/* CARD 4: TEAM CODE */}
                      <View style={styles.teamCardFrame}>
                        <Text style={styles.teamCardLabel}>TEAM CODE</Text>
                        <View style={styles.teamCodeDigitsRow}>
                          {createdTeamCode.split('').map((char, idx) => (
                            <View key={idx} style={styles.teamCodeDigitBox}>
                              <Text style={styles.teamCodeDigitText}>{char}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.teamCodeActionsRow}>
                          <TouchableOpacity
                            onPress={handleCopyTeamCode}
                            {...({ onClick: handleCopyTeamCode } as any)}
                            style={[styles.teamCodeActionBtn, teamCodeCopied && styles.teamCodeActionBtnSuccess]}
                            activeOpacity={0.7}
                          >
                            <Copy size={13} color={teamCodeCopied ? '#34d399' : '#fbbf24'} />
                            <Text style={[styles.teamCodeActionText, teamCodeCopied && { color: '#34d399' }]}>
                              {teamCodeCopied ? 'COPIED!' : 'COPY CODE'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={handleShareTeamCode}
                            {...({ onClick: handleShareTeamCode } as any)}
                            style={[styles.teamCodeActionBtn, teamCodeShared && styles.teamCodeActionBtnSuccess]}
                            activeOpacity={0.7}
                          >
                            <Share2 size={13} color={teamCodeShared ? '#34d399' : '#fbbf24'} />
                            <Text style={[styles.teamCodeActionText, teamCodeShared && { color: '#34d399' }]}>
                              {teamCodeShared ? 'INVITE COPIED!' : 'SHARE'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.teamCodeFooterNote}>
                          Teammates enter this code to join. Only one Team Leader per team.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* JOIN A TEAM: CARD 1 */}
                      <View style={styles.teamCardFrame}>
                        <Text style={styles.teamCardLabel}>TEAM CODE</Text>
                        <View style={styles.teamCodeDigitsRow}>
                          {joinCodeDigits.map((digit, idx) => (
                            <TextInput
                              key={idx}
                              style={styles.teamCodeInputBox}
                              value={digit}
                              onChangeText={(val) => handleJoinDigitChange(val, idx)}
                              maxLength={1}
                              autoCapitalize="characters"
                              placeholder="•"
                              placeholderTextColor="#64748b"
                            />
                          ))}
                        </View>

                        <TouchableOpacity
                          onPress={handleFindTeamInHome}
                          {...({ onClick: handleFindTeamInHome } as any)}
                          style={styles.teamFindBtn}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.teamFindBtnText}>FIND TEAM</Text>
                        </TouchableOpacity>

                        {joinTeamSearchError ? (
                          <Text style={styles.teamSearchErrorText}>{joinTeamSearchError}</Text>
                        ) : null}
                      </View>

                      {/* JOIN A TEAM: CARD 2 (FOUND TEAM) */}
                      {foundTeamInHome ? (
                        <View style={[styles.teamCardFrame, { borderColor: '#10b981' }]}>
                          <View style={styles.teamCardHeaderRow}>
                            <View style={styles.teamFoundBadge}>
                              <Text style={styles.teamFoundBadgeText}>TEAM FOUND</Text>
                            </View>
                            <Text style={styles.teamJoinedCount}>
                              {foundTeamInHome.members?.length || 1} / {foundTeamInHome.maxMembers || 4} joined
                            </Text>
                          </View>

                          <Text style={styles.teamFoundTitle}>[{foundTeamInHome.name}]</Text>

                          {/* Leader */}
                          <View style={styles.teamMemberRowActive}>
                            <View style={[styles.teamMemberAvatar, { backgroundColor: '#3b82f6' }]}>
                              <Text style={styles.teamMemberAvatarText}>
                                {(foundTeamInHome.leaderName || 'L').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.teamMemberName}>{foundTeamInHome.leaderName}</Text>
                            <View style={styles.teamLeaderBadge}>
                              <Crown size={12} color="#fbbf24" />
                              <Text style={styles.teamLeaderBadgeText}>TEAM LEADER</Text>
                            </View>
                          </View>

                          {/* Existing Members */}
                          {foundTeamInHome.members
                            ?.filter((m: any) => m.role !== 'leader')
                            .map((m: any, idx: number) => (
                              <View key={idx} style={styles.teamMemberRowActive}>
                                <View style={[styles.teamMemberAvatar, { backgroundColor: '#6366f1' }]}>
                                  <Text style={styles.teamMemberAvatarText}>
                                    {m.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <Text style={styles.teamMemberName}>{m.name}</Text>
                                <View style={styles.teamMemberBadge}>
                                  <Text style={styles.teamMemberBadgeText}>MEMBER</Text>
                                </View>
                              </View>
                            ))}

                          {/* You */}
                          <View style={styles.teamMemberRowActive}>
                            <View style={styles.teamMemberAvatar}>
                              <Text style={styles.teamMemberAvatarText}>
                                {(user.username || 'Y').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.teamMemberName}>
                              {`Member ${(foundTeamInHome.members?.filter((m: any) => m.role === 'member').length || 0) + 1} (You)`}
                            </Text>
                            <View style={styles.teamNewMemberBadge}>
                              <Text style={styles.teamNewMemberBadgeText}>MEMBER · NEW</Text>
                            </View>
                          </View>

                          <Text style={styles.teamFoundExplanation}>
                            Your request will be sent to the Team Leader to accept or decline. Once accepted, you will receive a notification to pay and unlock the venue, date, time & access PIN.
                          </Text>

                          {joinTeamSuccessNotice ? (
                            <View style={styles.teamJoinSuccessBox}>
                              <CheckCircle2 size={16} color="#34d399" />
                              <Text style={styles.teamJoinSuccessText}>
                                Request sent! Team Leader will accept or decline in their notifications.
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </>
                  )}
                </ScrollView>

                {/* Sticky Footer matching reference */}
                <View style={styles.teamModalFooter}>
                  <TouchableOpacity
                    onPress={() => setEventModalTab('briefing')}
                    {...({ onClick: () => setEventModalTab('briefing') } as any)}
                    style={styles.teamModalBackBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.teamModalBackBtnText}>‹ BACK</Text>
                  </TouchableOpacity>

                  {teamModalSubMode === 'create' ? (
                    <TouchableOpacity
                      onPress={handleProceedFromTeamToPayment}
                      {...({ onClick: handleProceedFromTeamToPayment } as any)}
                      style={styles.teamModalRegisterBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.teamModalRegisterBtnText}>
                        REGISTER & PAY ₹{viewingDetailsEvent.registrationFee || 199}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleJoinTeamInHome}
                      {...({ onClick: handleJoinTeamInHome } as any)}
                      disabled={!foundTeamInHome}
                      style={[styles.teamModalRegisterBtn, !foundTeamInHome && { opacity: 0.5 }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.teamModalRegisterBtnText}>
                        JOIN TEAM
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              /* ======================================================== */
              /* STANDARD BRIEFING & RULES MODAL                           */
              /* ======================================================== */
              <View style={styles.detailsModalCard}>
                {/* Details Modal Header */}
                <View style={styles.detailsModalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.difficultyStarsBadge}>
                      <Text style={styles.difficultyStarsText}>
                        {getDifficultyMeta(viewingDetailsEvent.difficulty).stars} {getDifficultyMeta(viewingDetailsEvent.difficulty).label}
                      </Text>
                    </View>
                    <Text style={styles.detailsModalTitle}>
                      {viewingDetailsEvent.title.toUpperCase()}
                    </Text>
                    <Text style={styles.detailsModalCampus}>
                      {viewingDetailsEvent.campusName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setViewingDetailsEvent(null)}
                    {...({ onClick: () => setViewingDetailsEvent(null) } as any)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Instant Sub-Header Navigation Tabs */}
                <View style={styles.modalTabsRow}>
                  <TouchableOpacity
                    onPress={() => setEventModalTab('briefing')}
                    {...({ onClick: () => setEventModalTab('briefing') } as any)}
                    style={[styles.modalTabBtn, eventModalTab === 'briefing' && styles.modalTabBtnActive]}
                    activeOpacity={0.7}
                  >
                    <FileText size={13} color={eventModalTab === 'briefing' ? '#fbbf24' : '#64748b'} />
                    <Text style={[styles.modalTabText, eventModalTab === 'briefing' && styles.modalTabTextActive]}>
                      1. Briefing & Rules
                    </Text>
                  </TouchableOpacity>

                  {isViewingTeamOnly ? (
                    <TouchableOpacity
                      onPress={() => setEventModalTab('team')}
                      {...({ onClick: () => setEventModalTab('team') } as any)}
                      style={[styles.modalTabBtn, eventModalTab === 'team' && styles.modalTabBtnActive]}
                      activeOpacity={0.7}
                    >
                      <Users size={13} color={eventModalTab === 'team' ? '#fbbf24' : '#64748b'} />
                      <Text style={[styles.modalTabText, eventModalTab === 'team' && styles.modalTabTextActive]}>
                        2. Create Team
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setEventModalTab('payment')}
                      {...({ onClick: () => setEventModalTab('payment') } as any)}
                      style={[styles.modalTabBtn, eventModalTab === 'payment' && styles.modalTabBtnActive]}
                      activeOpacity={0.7}
                    >
                      <CreditCard size={13} color={eventModalTab === 'payment' ? '#fbbf24' : '#64748b'} />
                      <Text style={[styles.modalTabText, eventModalTab === 'payment' && styles.modalTabTextActive]}>
                        2. Register & Pay
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* TAB 1: QUEST DETAILS & BRIEFING */}
                <ScrollView
                  style={styles.detailsModalBody}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* 1. Event Description Lore */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>📖 QUEST BRIEFING</Text>
                    <Text style={styles.descriptionText}>
                      {viewingDetailsEvent.description}
                    </Text>
                  </View>

                  {/* 2. WHEN IS THE EVENT */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>📅 WHEN IS THE EVENT?</Text>
                    <View style={styles.infoCardGrid}>
                      <View style={styles.infoCardItem}>
                        <Calendar size={16} color="#fbbf24" />
                        <View>
                          <Text style={styles.infoItemLabel}>Date</Text>
                          <Text style={styles.infoItemVal}>{viewingDetailsEvent.date || '2026-09-30'}</Text>
                        </View>
                      </View>

                      <View style={styles.infoCardItem}>
                        <Clock size={16} color="#fbbf24" />
                        <View>
                          <Text style={styles.infoItemLabel}>Time & Duration</Text>
                          <Text style={styles.infoItemVal}>{viewingDetailsEvent.time || '14:00'} · {viewingDetailsEvent.duration || '2 Hours'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 3. WHERE IS THE EVENT */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>📍 WHERE IS THE EVENT?</Text>
                    <View style={styles.infoBoxHighlighted}>
                      <View style={styles.infoBoxRow}>
                        <MapPin size={18} color="#34d399" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoBoxTitle}>Meeting Point & Landmark</Text>
                          <Text style={styles.infoBoxDesc}>
                            {viewingDetailsEvent.meetingPoint || viewingDetailsEvent.startLocation || 'Central Quad Clocktower Plaza (Archway 4)'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoBoxDivider} />

                      <View style={styles.infoBoxRow}>
                        <Compass size={18} color="#60a5fa" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoBoxTitle}>Campus Hunt Boundary</Text>
                          <Text style={styles.infoBoxDesc}>
                            Within {viewingDetailsEvent.boundaryRadiusMeters || 500} meters of campus perimeter
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 4. MODE OF HUNT */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>⚡ MODE OF HUNT</Text>
                    <View style={styles.modeCard}>
                      <View style={styles.modeCardHeader}>
                        <Flame size={16} color="#f59e0b" />
                        <Text style={styles.modeTitle}>
                          {viewingDetailsEvent.mode || 'Physical On-Campus Exploration (Walking Quest & Live Clues)'}
                        </Text>
                      </View>
                      <Text style={styles.modeDesc}>
                        Explorers search physical grounds for secret landmark codes, solve historic riddles, and scan encrypted QR tags.
                      </Text>
                      <View style={styles.modeTagsRow}>
                        <View style={styles.modeTag}>
                          <Text style={styles.modeTagText}>{viewingDetailsEvent.clues?.length || 4} Interactive Clues</Text>
                        </View>
                        <View style={styles.modeTag}>
                          <Text style={styles.modeTagText}>QR & GPS Enabled</Text>
                        </View>
                        <View style={styles.modeTag}>
                          <Text style={styles.modeTagText}>{viewingDetailsEvent.hintsAllowed || 3} Hints Allowed</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 5. WHAT TO CARRY */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>🎒 WHAT TO CARRY</Text>
                    <View style={styles.carryListContainer}>
                      {(viewingDetailsEvent.whatToCarry || [
                        'Fully Charged Smartphone (with camera & internet enabled)',
                        'Valid Student ID or Government Photo ID',
                        'Comfortable Walking Shoes or Sneakers',
                        'Water Bottle & Light Snack',
                        'Notebook & Pen for cipher solving',
                      ]).map((item, idx) => (
                        <View key={idx} style={styles.carryListItem}>
                          <View style={styles.carryCheckCircle}>
                            <Check size={11} color="#10b981" strokeWidth={3} />
                          </View>
                          <Text style={styles.carryItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 6. PRIZES & REWARDS */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>🏆 REWARDS & BOUNTY</Text>
                    <View style={styles.prizesCard}>
                      <Trophy size={20} color="#fbbf24" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prizesTitle}>Winner Trophy & Cash Bounty</Text>
                        <Text style={styles.prizesDesc}>
                          {viewingDetailsEvent.prizes || '₹10,000 Cash Prize + Gold Trophies + 700 XP'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 7. SQUAD GUIDELINES */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionHeading}>👥 SQUAD GUIDELINES</Text>
                    <Text style={styles.squadRulesText}>
                      • Squads can consist of 1 to {viewingDetailsEvent.maxTeamSize || 4} explorers.{'\n'}
                      • All clues must be solved in sequential order.{'\n'}
                      • Maintain fair play; emergency organizer assistance available.
                    </Text>
                  </View>
                </ScrollView>

                {/* Sticky Action Footer in Details Modal */}
                <View style={styles.detailsFooter}>
                  <View style={styles.detailsFooterPrice}>
                    <Text style={styles.detailsFooterLabel}>Registration Fee</Text>
                    <Text style={styles.detailsFooterAmount}>₹{viewingDetailsEvent.registrationFee || 199}</Text>
                  </View>

                  {!joinedEventIds.includes(viewingDetailsEvent.id) ? (
                    <TouchableOpacity
                      onPress={() => setEventModalTab(isViewingTeamOnly ? 'team' : 'payment')}
                      {...({ onClick: () => setEventModalTab(isViewingTeamOnly ? 'team' : 'payment') } as any)}
                      style={styles.detailsProceedBtn}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.detailsProceedBtnText}>
                        {isViewingTeamOnly
                          ? 'PROCEED TO CREATE TEAM →'
                          : `PROCEED TO REGISTER & PAY ₹${viewingDetailsEvent.registrationFee || 199} →`}
                      </Text>
                    </TouchableOpacity>
                  ) : (!startedEventIds.includes(viewingDetailsEvent.id) && !isEventStartedByOrganizer(viewingDetailsEvent)) ? (
                    <TouchableOpacity
                      onPress={() => setWaitingModalEvent(viewingDetailsEvent)}
                      {...({ onClick: () => setWaitingModalEvent(viewingDetailsEvent) } as any)}
                      style={styles.detailsWaitingBtn}
                      activeOpacity={0.75}
                    >
                      <Clock size={15} color="#fbbf24" />
                      <Text style={styles.detailsWaitingBtnText}>
                        WAITING FOR ORGANIZER TO START
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        const evt = viewingDetailsEvent;
                        setViewingDetailsEvent(null);
                        handleOpenPinModal(evt);
                      }}
                      {...({
                        onClick: () => {
                          const evt = viewingDetailsEvent;
                          setViewingDetailsEvent(null);
                          handleOpenPinModal(evt);
                        },
                      } as any)}
                      style={styles.detailsStartBtn}
                      activeOpacity={0.75}
                    >
                      <Play size={16} color="#0f172a" fill="#0f172a" />
                      <Text style={styles.detailsStartBtnText}>
                        EVENT READY TO START • ENTER PIN
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 1. AUTHENTIC CAMPUS QUEST PAYMENT SCREEN (EXACT REFERENCE)*/}
      {/* ======================================================== */}
      <CampusQuestPaymentModal
        visible={Boolean((viewingDetailsEvent && eventModalTab === 'payment') || registeringEvent)}
        event={viewingDetailsEvent || registeringEvent}
        user={user}
        initialTeamName={customTeamName}
        onClose={() => {
          const hadPaymentResult = Boolean(paymentConfirmation);
          setPaymentConfirmation(null);
          setPaymentError('');
          if (hadPaymentResult) {
            setViewingDetailsEvent(null);
            setRegisteringEvent(null);
            return;
          }
          if (viewingDetailsEvent) {
            setEventModalTab(isViewingTeamOnly ? 'team' : 'briefing');
          } else {
            setRegisteringEvent(null);
          }
        }}
        onPay={handleConfirmPayment}
        isProcessing={isProcessingPayment}
        error={paymentError}
        paymentResult={paymentConfirmation}
      />

      {/* ======================================================== */}
      {/* 2. EVENT READY TO START - ENTER PIN MODAL                */}
      {/* ======================================================== */}
      {pinEntryEvent && (
        <Modal
          transparent
          animationType="fade"
          visible={Boolean(pinEntryEvent)}
          onRequestClose={() => setPinEntryEvent(null)}
        >
          <View style={styles.pinThemedOuterOverlay}>
            <View style={styles.pinThemedPhoneFrame}>
              <View style={styles.pinThemedScreenContainer}>
            {/* Themed Background SVG: Starry Night Castle & Stone Gate */}
            <View style={StyleSheet.absoluteFill}>
              <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 780">
                <Defs>
                  <LinearGradient id="nightSkyGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#040915" />
                    <Stop offset="30%" stopColor="#0a1428" />
                    <Stop offset="65%" stopColor="#0d1b32" />
                    <Stop offset="100%" stopColor="#060c18" />
                  </LinearGradient>
                  <RadialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <Stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                  </RadialGradient>
                  <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.7" />
                    <Stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                  </RadialGradient>
                </Defs>

                {/* Sky Base */}
                <Rect x="0" y="0" width="400" height="780" fill="url(#nightSkyGrad)" />

                {/* Moon Glow & Crescent Moon */}
                <Circle cx="300" cy="115" r="28" fill="url(#moonGlow)" />
                <Path
                  d="M 292 102 A 15 15 0 1 0 310 126 A 17 17 0 1 1 292 102 Z"
                  fill="#fef08a"
                  opacity="0.95"
                />

                {/* Stars in Sky */}
                <Circle cx="45" cy="40" r="1.5" fill="#fef08a" opacity="0.8" />
                <Circle cx="120" cy="65" r="1.2" fill="#ffffff" opacity="0.7" />
                <Circle cx="240" cy="35" r="1.5" fill="#fef08a" opacity="0.9" />
                <Circle cx="340" cy="55" r="1.2" fill="#ffffff" opacity="0.6" />
                <Circle cx="75" cy="90" r="1.0" fill="#ffffff" opacity="0.5" />
                <Circle cx="190" cy="80" r="1.4" fill="#fef08a" opacity="0.7" />
                <Circle cx="280" cy="70" r="1.2" fill="#ffffff" opacity="0.8" />

                {/* Distant Castle Silhouettes with Glowing Windows */}
                <Path
                  d="M 230 150 L 230 110 L 245 95 L 260 110 L 260 150 L 320 150 L 320 120 L 335 105 L 350 120 L 350 150 Z"
                  fill="#060c18"
                />
                {/* Castle Yellow Windows */}
                <Rect x="238" y="118" width="8" height="12" rx="2" fill="#fbbf24" opacity="0.9" />
                <Rect x="270" y="132" width="6" height="9" rx="1.5" fill="#fbbf24" opacity="0.8" />
                <Rect x="284" y="132" width="6" height="9" rx="1.5" fill="#fbbf24" opacity="0.8" />
                <Rect x="328" y="126" width="8" height="12" rx="2" fill="#fbbf24" opacity="0.9" />

                {/* Distant Trees behind Gate */}
                <Path
                  d="M 0 160 Q 60 140 120 160 Q 200 135 280 160 Q 340 140 400 160 L 400 200 L 0 200 Z"
                  fill="#030712"
                />

                {/* Left Stone Tower Pillar */}
                <Rect x="0" y="150" width="68" height="630" fill="#1e293b" />
                <Rect x="0" y="150" width="76" height="16" fill="#334155" />
                {/* Left Pillar Stone Mortar Grooves */}
                <Path
                  d="M 0 200 L 68 200 M 0 250 L 68 250 M 34 200 L 34 250 M 0 300 L 68 300 M 0 350 L 68 350 M 34 300 L 34 350 M 0 400 L 68 400 M 0 450 L 68 450 M 34 400 L 34 450 M 0 500 L 68 500 M 0 550 L 68 550 M 34 500 L 34 550 M 0 600 L 68 600 M 0 650 L 68 650 M 34 600 L 34 650 M 0 700 L 68 700 M 0 750 L 68 750"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />

                {/* Right Stone Tower Pillar */}
                <Rect x="332" y="150" width="68" height="630" fill="#1e293b" />
                <Rect x="324" y="150" width="76" height="16" fill="#334155" />
                {/* Right Pillar Stone Mortar Grooves */}
                <Path
                  d="M 332 200 L 400 200 M 332 250 L 400 250 M 366 200 L 366 250 M 332 300 L 400 300 M 332 350 L 400 350 M 366 300 L 366 350 M 332 400 L 400 400 M 332 450 L 400 450 M 366 400 L 366 450 M 332 500 L 400 500 M 332 550 L 400 550 M 366 500 L 366 550 M 332 600 L 400 600 M 332 650 L 400 650 M 366 600 L 366 650 M 332 700 L 400 700 M 332 750 L 400 750"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />

                {/* Left Antique Street Lantern with Golden Glow */}
                <Circle cx="34" cy="115" r="28" fill="url(#lanternGlow)" />
                {/* Lantern Cap and Body */}
                <Path d="M 22 95 L 46 95 L 34 85 Z" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
                <Path d="M 22 95 L 18 135 L 50 135 L 46 95 Z" fill="rgba(15,23,42,0.9)" stroke="#d97706" strokeWidth="1.5" />
                {/* Glowing Lantern Diamond Inside */}
                <Path d="M 34 100 L 43 115 L 34 130 L 25 115 Z" fill="#fef08a" />
                <Circle cx="34" cy="115" r="4" fill="#ffffff" />
                {/* Lantern Base Mount */}
                <Rect x="30" y="135" width="8" height="15" fill="#0f172a" />

                {/* Right Antique Street Lantern with Golden Glow */}
                <Circle cx="366" cy="115" r="28" fill="url(#lanternGlow)" />
                {/* Lantern Cap and Body */}
                <Path d="M 354 95 L 378 95 L 366 85 Z" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
                <Path d="M 354 95 L 350 135 L 382 135 L 378 95 Z" fill="rgba(15,23,42,0.9)" stroke="#d97706" strokeWidth="1.5" />
                {/* Glowing Lantern Diamond Inside */}
                <Path d="M 366 100 L 375 115 L 366 130 L 357 115 Z" fill="#fef08a" />
                <Circle cx="366" cy="115" r="4" fill="#ffffff" />
                {/* Lantern Base Mount */}
                <Rect x="362" y="135" width="8" height="15" fill="#0f172a" />

                {/* Wooden Gate Archway Top Span */}
                <Path
                  d="M 68 180 Q 200 130 332 180 L 332 205 Q 200 160 68 205 Z"
                  fill="#1c1108"
                  stroke="#92400e"
                  strokeWidth="2.5"
                />
              </Svg>
            </View>

            {/* Top Navigation Bar: Back Arrow button */}
            <View style={styles.pinScreenTopNav}>
              <TouchableOpacity
                onPress={() => setPinEntryEvent(null)}
                {...({ onClick: () => setPinEntryEvent(null) } as any)}
                style={styles.pinScreenBackBtn}
                activeOpacity={0.7}
              >
                <ArrowLeft size={22} color="#fbbf24" strokeWidth={2.8} />
              </TouchableOpacity>
            </View>

            {/* Centered Content Column */}
            <ScrollView
              contentContainerStyle={styles.pinScreenScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Brand Logo: CAMPUS QUEST with wrapped green beaded vine */}
              <View style={styles.pinLogoWrap}>
                <Text style={styles.pinLogoCampusText}>CAMPUS</Text>
                <Text style={styles.pinLogoQuestText}>QUEST</Text>

                {/* Curved green vine garland under logo */}
                <View style={styles.pinLogoVineWrap}>
                  <Svg width="190" height="18" viewBox="0 0 190 18">
                    <Path
                      d="M 6 12 Q 95 2 184 12"
                      stroke="#22c55e"
                      strokeWidth="2"
                      fill="none"
                    />
                    <Circle cx="16" cy="10" r="2.8" fill="#4ade80" />
                    <Circle cx="55" cy="6.5" r="2.8" fill="#4ade80" />
                    <Circle cx="95" cy="5" r="3.5" fill="#86efac" />
                    <Circle cx="135" cy="6.5" r="2.8" fill="#4ade80" />
                    <Circle cx="174" cy="10" r="2.8" fill="#4ade80" />
                  </Svg>
                </View>
              </View>

              {/* The Wooden / Bronze Gate Plaque: ✦ ENTER PIN ✦ */}
              <View style={styles.gatePlaqueContainer}>
                <View style={styles.gatePlaqueBox}>
                  <Text style={styles.gatePlaqueTitle}>✦  ENTER PIN  ✦</Text>
                </View>
                <Text style={styles.gatePlaqueSubtitle}>
                  Unlock new quests{'\n'}and adventures
                </Text>
              </View>

              {/* Quick Assigned PIN reminder helper pill */}
              <TouchableOpacity
                onPress={() => setEnteredPin(pinEntryEvent.code || '849201')}
                {...({ onClick: () => setEnteredPin(pinEntryEvent.code || '849201') } as any)}
                style={styles.assignedPinPill}
                activeOpacity={0.7}
              >
                <KeyRound size={13} color="#fbbf24" />
                <Text style={styles.assignedPinPillText}>
                  Your Event PIN: <Text style={styles.assignedPinCodeText}>{pinEntryEvent.code || '849201'}</Text> (Tap to Auto-fill)
                </Text>
              </TouchableOpacity>

              {/* Error / Success Feedback */}
              {pinValidationError ? (
                <View style={styles.pinErrorBanner}>
                  <AlertCircle size={14} color="#f87171" />
                  <Text style={styles.pinErrorBannerText}>{pinValidationError}</Text>
                </View>
              ) : null}

              {pinValidationSuccess ? (
                <View style={styles.pinSuccessBanner}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <Text style={styles.pinSuccessBannerText}>PIN Verified! Starting Quest...</Text>
                </View>
              ) : null}

              {/* Square PIN Display Boxes matching reference image */}
              <View style={styles.pinBoxesContainer}>
                {Array.from({ length: pinEntryEvent.code?.length || 6 }).map((_, idx) => {
                  const digit = enteredPin[idx];
                  const isCurrent = idx === enteredPin.length;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.pinBoxSquare,
                        digit ? styles.pinBoxSquareFilled : null,
                        isCurrent ? styles.pinBoxSquareActive : null,
                      ]}
                    >
                      <Text style={styles.pinBoxDigitText}>
                        {digit || ''}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Circular Dial Pad Keypad (1 to 9, Clear, 0, Backspace) */}
              <View style={styles.keypadGrid}>
                {/* Row 1: 1, 2, 3 */}
                <View style={styles.keypadRow}>
                  {['1', '2', '3'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleKeypadPress(num)}
                      {...({ onClick: () => handleKeypadPress(num) } as any)}
                      style={styles.keypadCircleBtn}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.keypadDigitText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 2: 4, 5, 6 */}
                <View style={styles.keypadRow}>
                  {['4', '5', '6'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleKeypadPress(num)}
                      {...({ onClick: () => handleKeypadPress(num) } as any)}
                      style={styles.keypadCircleBtn}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.keypadDigitText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 3: 7, 8, 9 */}
                <View style={styles.keypadRow}>
                  {['7', '8', '9'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleKeypadPress(num)}
                      {...({ onClick: () => handleKeypadPress(num) } as any)}
                      style={styles.keypadCircleBtn}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.keypadDigitText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Row 4: Clear [⌧], 0, Backspace [⌫] */}
                <View style={styles.keypadRow}>
                  {/* Clear All Button */}
                  <TouchableOpacity
                    onPress={handleKeypadClear}
                    {...({ onClick: handleKeypadClear } as any)}
                    style={styles.keypadCircleBtn}
                    activeOpacity={0.65}
                    accessibilityLabel="Clear All Digits"
                  >
                    <X size={22} color="#fbbf24" strokeWidth={2.8} />
                  </TouchableOpacity>

                  {/* Digit 0 */}
                  <TouchableOpacity
                    onPress={() => handleKeypadPress('0')}
                    {...({ onClick: () => handleKeypadPress('0') } as any)}
                    style={styles.keypadCircleBtn}
                    activeOpacity={0.65}
                  >
                    <Text style={styles.keypadDigitText}>0</Text>
                  </TouchableOpacity>

                  {/* Backspace Button */}
                  <TouchableOpacity
                    onPress={handleKeypadBackspace}
                    {...({ onClick: handleKeypadBackspace } as any)}
                    style={styles.keypadCircleBtn}
                    activeOpacity={0.65}
                    accessibilityLabel="Backspace"
                  >
                    <ArrowLeft size={22} color="#fbbf24" strokeWidth={2.8} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Giant Golden/Bronze Pill CONFIRM Button */}
              <TouchableOpacity
                onPress={handleVerifyPinAndStart}
                {...({ onClick: handleVerifyPinAndStart } as any)}
                style={[
                  styles.confirmPillBtn,
                  enteredPin.length >= (pinEntryEvent.code?.length || 6)
                    ? styles.confirmPillBtnReady
                    : null,
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmPillBtnText}>CONFIRM</Text>
              </TouchableOpacity>

              <View style={{ height: 28 }} />
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
      )}

      {/* ======================================================== */}
      {/* WAITING FOR ORGANIZER BROADCAST MODAL                    */}
      {/* ======================================================== */}
      {waitingModalEvent && (
        <Modal
          transparent
          animationType="fade"
          visible={Boolean(waitingModalEvent)}
          onRequestClose={() => setWaitingModalEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.waitingOrganizerModalCard}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setWaitingModalEvent(null)}
                {...({ onClick: () => setWaitingModalEvent(null) } as any)}
                style={styles.waitingModalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>

              {/* Pulsing Clock Icon */}
              <View style={styles.waitingModalIconRing}>
                <Clock size={28} color="#f59e0b" />
              </View>

              <Text style={styles.waitingModalTitle}>WAITING FOR ORGANIZER</Text>
              <Text style={styles.waitingModalEventTitle} numberOfLines={2}>
                {waitingModalEvent.title}
              </Text>

              <Text style={styles.waitingModalDesc}>
                This quest is scheduled for a specific date and time. It can only be started by the official event organizer. Once the organizer broadcasts the live start, you will be able to enter your 6-digit PIN and play!
              </Text>

              {/* Scheduled Date, Time, Venue Box */}
              <View style={styles.waitingScheduleCard}>
                <View style={styles.waitingScheduleRow}>
                  <Calendar size={14} color="#f59e0b" />
                  <Text style={styles.waitingScheduleLabel}>Scheduled Date:</Text>
                  <Text style={styles.waitingScheduleVal}>{waitingModalEvent.date || '2026-10-31'}</Text>
                </View>
                <View style={styles.waitingScheduleRow}>
                  <Clock size={14} color="#f59e0b" />
                  <Text style={styles.waitingScheduleLabel}>Scheduled Time:</Text>
                  <Text style={styles.waitingScheduleVal}>{waitingModalEvent.time || '20:00'}</Text>
                </View>
                <View style={styles.waitingScheduleRow}>
                  <MapPin size={14} color="#f59e0b" />
                  <Text style={styles.waitingScheduleLabel}>Starting Venue:</Text>
                  <Text style={styles.waitingScheduleVal} numberOfLines={1}>
                    {waitingModalEvent.startLocation || waitingModalEvent.campusName}
                  </Text>
                </View>
              </View>

              {/* Standby Signal Banner */}
              <View style={styles.waitingStandbyPill}>
                <View style={styles.amberPulseDot} />
                <Text style={styles.waitingStandbyText}>
                  Organizer Standby: Waiting for live broadcast signal...
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setWaitingModalEvent(null)}
                {...({ onClick: () => setWaitingModalEvent(null) } as any)}
                style={styles.waitingModalDismissBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.waitingModalDismissText}>Back to Lobby</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  /* Title Banner Area */
  titleBannerContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 14,
    position: 'relative',
  },
  moonWrapper: {
    position: 'absolute',
    right: 28,
    top: 4,
    zIndex: 5,
  },
  mainTitleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 1.5,
    fontFamily: 'serif',
    textAlign: 'center',
    textShadowColor: 'rgba(245, 158, 11, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  beadedArcWrap: {
    marginTop: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableQuestsBadge: {
    marginTop: 8,
    backgroundColor: '#26190b',
    borderWidth: 1.8,
    borderColor: '#d97706',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 7,
    boxShadow: '0 0 14px rgba(217, 119, 6, 0.45)',
  },
  availableQuestsText: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: 'serif',
  },

  /* Difficulty Filter Tabs */
  filterTabsRow: {
    marginBottom: 14,
  },
  filterScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  difficultyFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#0c1527',
    borderWidth: 1.5,
    borderColor: '#b45309',
  },
  difficultyFilterPillActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#fbbf24',
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
  },
  difficultyFilterText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '800',
  },
  difficultyFilterTextActive: {
    color: '#0f172a',
    fontWeight: '900',
  },

  /* Horizontal Slide Bar matching the reference UI */
  slideBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  slideArrowBtn: {
    width: 20,
    height: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  slideArrowText: {
    color: '#cbd5e1',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
  },
  slideTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  slideThumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#94a3b8',
    borderRadius: 3,
    boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)',
  },

  /* Quests List */
  questsList: {
    paddingHorizontal: 14,
    gap: 16,
  },
  questCard: {
    backgroundColor: '#0c1527',
    borderWidth: 2,
    borderColor: '#d97706',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 0 12px rgba(217, 119, 6, 0.12)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyStarsBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1.2,
    borderColor: '#d97706',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  difficultyStarsText: {
    color: '#fef08a',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  openNowBadge: {
    borderWidth: 1.2,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  openNowText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  registeredPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  registeredPaidText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  cardTitle: {
    color: '#fef08a',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'serif',
    letterSpacing: 0.8,
    lineHeight: 22,
  },
  cardSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  metaPill: {
    backgroundColor: '#070d1a',
    borderWidth: 1.2,
    borderColor: '#b45309',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '700',
  },
  cardPriceText: {
    color: '#f59e0b',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  joinQuestBtn: {
    marginTop: 4,
    backgroundColor: '#f59e0b',
    borderWidth: 1.5,
    borderColor: '#fde047',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(245, 158, 11, 0.4)',
  },
  joinQuestBtnText: {
    color: '#1e1b4b',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: 'serif',
  },
  startEventPinBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 11,
    boxShadow: '0 0 14px rgba(251, 191, 36, 0.6)',
  },
  startEventPinBtnText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  waitingContainer: {
    marginTop: 4,
    gap: 6,
  },
  waitingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  waitingBtnText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  simOrganizerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.2,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  simOrganizerText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  amberPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  waitingOrganizerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#070f20',
    borderRadius: 18,
    borderWidth: 1.8,
    borderColor: '#c68a16',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
  },
  waitingModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  waitingModalIconRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  waitingModalTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 16.5,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  waitingModalEventTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  waitingModalDesc: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  waitingScheduleCard: {
    width: '100%',
    backgroundColor: '#0a142c',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  waitingScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitingScheduleLabel: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '600',
    width: 105,
  },
  waitingScheduleVal: {
    flex: 1,
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '800',
  },
  waitingStandbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  waitingStandbyText: {
    fontSize: 11,
    color: '#fde047',
    fontWeight: '700',
  },
  waitingModalBroadcastBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
    marginBottom: 8,
  },
  waitingModalBroadcastBtnText: {
    color: '#071626',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  waitingModalDismissBtn: {
    paddingVertical: 6,
  },
  waitingModalDismissText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 412,
    maxHeight: '94%',
    backgroundColor: '#0a1224',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#d97706',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1e293b',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  modalHeaderTitle: {
    color: '#fef08a',
    fontSize: 14.5,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  modalHeaderSub: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 14,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalErrorText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  modalSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalSuccessText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#fef08a',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#050b1a',
    borderWidth: 1.5,
    borderColor: '#b45309',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  paymentBox: {
    backgroundColor: 'rgba(12, 21, 39, 0.85)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  paymentBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  paymentBoxTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
  },
  upiInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  upiLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  upiValue: {
    color: '#f8fafc',
    fontSize: 11.5,
    fontWeight: '700',
  },
  upiAmountText: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '900',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  qrInnerBox: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrHint: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },
  utrLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autofillBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  autofillText: {
    color: '#fde047',
    fontSize: 9.5,
    fontWeight: '800',
  },
  modalPayBtn: {
    backgroundColor: '#f59e0b',
    borderWidth: 1.5,
    borderColor: '#fde047',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.5)',
  },
  modalPayBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /* PIN Success Card */
  pinSuccessCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a1224',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#10b981',
    padding: 18,
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
  },
  pinSuccessIconBox: {
    marginBottom: 8,
  },
  pinSuccessTitle: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  pinSuccessDesc: {
    color: '#cbd5e1',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  giantPinBox: {
    backgroundColor: '#050b1a',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 10,
    boxShadow: '0 0 16px rgba(245, 158, 11, 0.5)',
  },
  giantPinText: {
    color: '#fef08a',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    fontFamily: 'serif',
  },
  copyPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  copyPinText: {
    color: '#fde047',
    fontSize: 11,
    fontWeight: '800',
  },
  pinInstructionNote: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
  },
  gotItBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  gotItBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /* Enter PIN Modal */
  pinEntryCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a1224',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#f59e0b',
    overflow: 'hidden',
  },
  readyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  readyTagText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pinEntryBody: {
    padding: 16,
  },
  pinEntryPrompt: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 10,
  },
  pinReminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  pinReminderText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '600',
  },
  pinBoldText: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  pastePinBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  pastePinText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '900',
  },
  pinBigInput: {
    backgroundColor: '#050b1a',
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#fef08a',
    fontFamily: 'serif',
  },
  launchQuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    borderWidth: 1.5,
    borderColor: '#fde047',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.5)',
  },
  launchQuestBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /* Notification Bar Floating Banner */
  floatingNotifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c1b33',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
  },
  floatingNotifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingNotifTitle: {
    color: '#fde047',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  floatingNotifDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  notifPinHighlight: {
    color: '#38bdf8',
    fontWeight: '900',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  floatingNotifActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  notifCopyBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  notifCopyText: {
    color: '#0f172a',
    fontSize: 10.5,
    fontWeight: '900',
  },
  notifDismissBtn: {
    padding: 6,
  },

  /* Card Status & Waiting States */
  readyStartedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  /* Event Details Modal */
  detailsModalCard: {
    width: '100%',
    maxWidth: 412,
    maxHeight: '94%',
    backgroundColor: '#0a1224',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#060d1d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
  },
  modalTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#070f20',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'transparent',
  },
  modalTabBtnActive: {
    backgroundColor: '#0a1224',
    borderColor: '#f59e0b',
  },
  modalTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalTabTextActive: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  detailsModalTitle: {
    color: '#fef08a',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: 'serif',
    marginTop: 4,
  },
  detailsModalCampus: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsModalBody: {
    padding: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
  },
  infoCardGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCardItem: {
    flex: 1,
    backgroundColor: '#050b1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  infoItemLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoItemVal: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
  },
  infoBoxHighlighted: {
    backgroundColor: '#050b1a',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  infoBoxRow: {
    paddingVertical: 2,
  },
  infoBoxTitle: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoBoxDesc: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBoxDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  modeCard: {
    backgroundColor: '#050b1a',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modeTitle: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
  },
  modeDesc: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  modeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeTagText: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '700',
  },
  carryListContainer: {
    gap: 6,
  },
  carryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#050b1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  carryCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carryItemText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  prizesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
  },
  prizesTitle: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '900',
  },
  prizesDesc: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  squadRulesText: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 17,
  },
  detailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#060d1d',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailsFooterPrice: {
    flexDirection: 'column',
  },
  detailsFooterLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsFooterAmount: {
    color: '#fde047',
    fontSize: 22,
    fontWeight: '900',
  },
  detailsProceedBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
  },
  detailsProceedBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  detailsWaitingBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailsWaitingBtnText: {
    color: '#93c5fd',
    fontSize: 10.5,
    fontWeight: '900',
  },
  simBroadcastBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  simBroadcastText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  detailsStartBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
  },
  detailsStartBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  /* ======================================================== */
  /* CASTLE GATE THEMED ENTER PIN SCREEN STYLES (REFERENCE MOCK) */
  /* ======================================================== */
  pinThemedOuterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
    height: '100%',
  },
  pinThemedPhoneFrame: {
    width: '100%',
    maxWidth: 412,
    height: 860,
    maxHeight: '96vh' as any,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#050b1a',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.8,
    shadowRadius: 36,
  },
  pinThemedScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050b1a',
    position: 'relative',
  },
  pinScreenTopNav: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 60,
  },
  pinScreenBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 20, 38, 0.88)',
    borderWidth: 1.8,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
  },
  pinScreenScrollContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 36,
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  pinLogoWrap: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  pinLogoCampusText: {
    color: '#fbbf24',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2.5,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pinLogoQuestText: {
    color: '#fef08a',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 3.5,
    fontFamily: 'serif',
    textShadowColor: 'rgba(245, 158, 11, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 14,
    marginTop: -8,
  },
  pinLogoVineWrap: {
    marginTop: -4,
  },
  gatePlaqueContainer: {
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  gatePlaqueBox: {
    backgroundColor: '#190e06',
    borderWidth: 2,
    borderColor: '#d97706',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 36,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8), inset 0 1px 3px rgba(251, 191, 36, 0.4)',
  },
  gatePlaqueTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.5,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  gatePlaqueSubtitle: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  assignedPinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1.2,
    borderColor: '#f59e0b',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 6,
  },
  assignedPinPillText: {
    color: '#fef08a',
    fontSize: 11.5,
    fontWeight: '600',
  },
  assignedPinCodeText: {
    color: '#38bdf8',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  pinErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 4,
  },
  pinErrorBannerText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '700',
  },
  pinSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 4,
  },
  pinSuccessBannerText: {
    color: '#6ee7b7',
    fontSize: 11.5,
    fontWeight: '800',
  },
  pinBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  pinBoxSquare: {
    width: 44,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d97706',
    backgroundColor: 'rgba(10, 20, 38, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
  },
  pinBoxSquareFilled: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(15, 27, 50, 0.95)',
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.45)',
  },
  pinBoxSquareActive: {
    borderColor: '#fef08a',
    boxShadow: '0 0 14px rgba(254, 240, 138, 0.75)',
  },
  pinBoxDigitText: {
    color: '#fef08a',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 280,
    gap: 14,
    marginVertical: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keypadCircleBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(14, 25, 46, 0.88)',
    borderWidth: 1.8,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(251, 191, 36, 0.3)',
  },
  keypadDigitText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  confirmPillBtn: {
    width: '100%',
    maxWidth: 290,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#78350f',
    borderWidth: 2,
    borderColor: '#92400e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    opacity: 0.75,
  },
  confirmPillBtnReady: {
    backgroundColor: '#d97706',
    borderColor: '#fef08a',
    opacity: 1,
    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.65)',
  },
  confirmPillBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Team Modal Sub-Header Mode Toggle
  teamSubModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  teamSubModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 7,
  },
  teamSubModeBtnActive: {
    backgroundColor: '#fbbf24',
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.35)',
  },
  teamSubModeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  teamSubModeTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },

  teamHeaderSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 14,
    textAlign: 'center',
  },

  // Event Badge Card in Team screen
  teamEventBadgeCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 14,
    marginBottom: 14,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
  },
  teamBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamStarsBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  teamStarsText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  teamHuntTypePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  teamHuntTypePillText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamEventTitle: {
    color: '#fef08a',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'serif',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  teamEventMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },
  teamFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.2)',
    paddingTop: 8,
  },
  teamFeeLabel: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  teamFeeValue: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'serif',
  },

  // Team Section Cards (Name, Roster, Code)
  teamSectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 14,
    marginBottom: 14,
  },
  teamSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamSectionLabel: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'serif',
    marginBottom: 8,
  },
  teamJoinedCount: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  teamNameInput: {
    backgroundColor: '#0a101f',
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Member Rows
  teamMemberRowActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    gap: 10,
  },
  teamMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamMemberAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  teamMemberName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  teamLeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  teamLeaderBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamMemberBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  teamMemberBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  teamNewMemberBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34d399',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  teamNewMemberBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },

  // Empty Slots
  teamMemberRowSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  teamSlotPlusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamSlotText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Code digits
  teamCodeDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  teamCodeDigitBox: {
    width: 44,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0a101f',
    borderWidth: 1.8,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(251, 191, 36, 0.2)',
  },
  teamCodeDigitText: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  teamCodeInputBox: {
    width: 44,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#0a101f',
    borderWidth: 1.8,
    borderColor: '#fbbf24',
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  teamCodeActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  teamCodeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(180, 83, 9, 0.25)',
    borderWidth: 1.2,
    borderColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 10,
  },
  teamCodeBtnSuccess: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  teamCodeBtnText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamCodeFooterNote: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
  },

  // Team Find & Join
  teamFindBtn: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    boxShadow: '0 2px 10px rgba(217, 119, 6, 0.4)',
  },
  teamFindBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  teamSearchErrorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  teamFoundCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 14,
    marginBottom: 14,
  },
  teamFoundBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  teamFoundBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamFoundTitle: {
    color: '#fef08a',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'serif',
    marginBottom: 10,
  },
  teamFoundExplanation: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  teamJoinSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  teamJoinSuccessText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  // Team Modal Footer Buttons
  detailsTeamFooterActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailsBackBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1.2,
    borderColor: '#64748b',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBackBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsProceedTeamBtn: {
    flex: 1,
    backgroundColor: '#d97706',
    borderWidth: 1.2,
    borderColor: '#fef08a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.45)',
  },

  // Dedicated Authentic Team Modal (Exact match to user reference)
  authenticTeamModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '94%',
    backgroundColor: '#070e1c',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#d97706',
    boxShadow: '0 8px 36px rgba(0, 0, 0, 0.9), 0 0 20px rgba(217, 119, 6, 0.35)',
    overflow: 'hidden',
    position: 'relative',
  },
  teamModalBgArt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  teamModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
    zIndex: 1,
  },
  teamModalMainTitle: {
    color: '#fef08a',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'serif',
    letterSpacing: 1.2,
  },
  teamModalSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  teamModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d97706',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamModalScroll: {
    paddingHorizontal: 18,
    zIndex: 1,
  },
  teamCardFrame: {
    backgroundColor: 'rgba(9, 18, 36, 0.88)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 14,
    marginBottom: 12,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
  },
  teamCardLabel: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'serif',
    letterSpacing: 1,
    marginBottom: 8,
  },
  teamCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamCodeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(120, 53, 15, 0.65)',
    borderWidth: 1.2,
    borderColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 10,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
  },
  teamCodeActionBtnSuccess: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  teamCodeActionText: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'serif',
  },
  teamModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.3)',
    backgroundColor: 'rgba(6, 13, 27, 0.96)',
    zIndex: 1,
  },
  teamModalBackBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1.5,
    borderColor: '#64748b',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamModalBackBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamModalRegisterBtn: {
    flex: 1,
    backgroundColor: '#c2410c',
    borderWidth: 1.5,
    borderColor: '#fef08a',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(194, 65, 12, 0.55)',
  },
  teamModalRegisterBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'serif',
  },
});
