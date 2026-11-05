import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import {
  Settings,
  HelpCircle,
  User,
  LogOut,
  Trophy,
  CheckCircle2,
  X,
  Crown,
  Compass,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  ChevronRight,
  Shield,
  ShieldCheck,
  Star,
  Mail,
  Phone,
  Check,
  CreditCard,
  QrCode,
  IndianRupee,
  Building2,
  Globe,
  Trash2,
  KeyRound,
  Edit2,
  Eye,
  Smartphone,
  Laptop,
  Activity,
  Database,
  Home,
  Ticket,
  Gift,
  Bell,
  Radio,
} from 'lucide-react-native';
import Svg, {
  Circle,
  Rect,
  Path,
  Line,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
  G,
} from 'react-native-svg';
import { TreasureEvent, UserProfile } from '../../types';
import { CreateEventModal } from './CreateEventModal';
import { ManageCluesModal } from './ManageCluesModal';
import { LiveProgressPanel } from './LiveProgressPanel';
import { SettingsModal } from '../SettingsModal';
import { AvatarPickerModal } from '../AvatarPickerModal';
import { OrganizerProfileModal } from './OrganizerProfileModal';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { EditEventModal } from './EditEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { EventRegistrationsModal } from './EventRegistrationsModal';
import { OrganizerPaymentDetailsModal } from './OrganizerPaymentDetailsModal';
import { SupabaseBackendModal } from '../SupabaseBackendModal';
import { PayoutQrSettingsModal } from './PayoutQrSettingsModal';
import { HelpSupportModal } from './HelpSupportModal';
import { SponsorScratchCardsManager } from './SponsorScratchCardsManager';
import { PIXAR_AVATARS, PixarAvatar } from '../../data/avatars';
import {
  isEventStartedByOrganizer,
  startEventByOrganizer,
  formatEventSchedule,
} from '../../utils/eventStatusHelper';
import { getOrganizerCollectionStats } from '../../utils/paymentManager';

// Authentic Medieval / Guild Chevron Action Button with left arrow notch
const QuickActionRibbonBtn: React.FC<{
  title: string;
  onPress: () => void;
}> = ({ title, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    {...({ onClick: onPress } as any)}
    style={styles.quickActionRibbon}
    activeOpacity={0.82}
  >
    <Svg
      width="100%"
      height="46"
      viewBox="0 0 330 46"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id="woodPlankGradAction" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#451a03" />
          <Stop offset="30%" stopColor="#78350f" />
          <Stop offset="50%" stopColor="#92400e" />
          <Stop offset="70%" stopColor="#78350f" />
          <Stop offset="100%" stopColor="#451a03" />
        </LinearGradient>
      </Defs>
      {/* Outer wooden plank body pointing left like a signpost */}
      <Path
        d="M 18 2 L 318 2 Q 328 2 328 10 L 328 36 Q 328 44 318 44 L 18 44 L 2 23 Z"
        fill="url(#woodPlankGradAction)"
        stroke="#92400e"
        strokeWidth="1.6"
      />
      {/* Inner dashed gold stitch */}
      <Path
        d="M 21 6 L 315 6 Q 322 6 322 13 L 322 33 Q 322 40 315 40 L 21 40 L 8 23 Z"
        fill="none"
        stroke="#fde047"
        strokeWidth="1.2"
        strokeDasharray="4,3"
        opacity="0.9"
      />
    </Svg>
    <Text style={styles.quickActionRibbonText}>{title}</Text>
  </TouchableOpacity>
);

// Dual-ended Ribbon Banner Button for Manage Clues / Leaderboard
const DualRibbonBtn: React.FC<{
  title: string;
  onPress: () => void;
}> = ({ title, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    {...({ onClick: onPress } as any)}
    style={styles.dualRibbonBtnContainer}
    activeOpacity={0.82}
  >
    <Svg
      width="100%"
      height="38"
      viewBox="0 0 155 38"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id="woodPlankGradDual" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#451a03" />
          <Stop offset="50%" stopColor="#78350f" />
          <Stop offset="100%" stopColor="#451a03" />
        </LinearGradient>
      </Defs>
      {/* Dual-chevron ribbon shape */}
      <Path
        d="M 14 2 L 141 2 L 153 19 L 141 36 L 14 36 L 2 19 Z"
        fill="url(#woodPlankGradDual)"
        stroke="#92400e"
        strokeWidth="1.5"
      />
      {/* Inner dashed line */}
      <Path
        d="M 16 5 L 138 5 L 147 19 L 138 33 L 16 33 L 7 19 Z"
        fill="none"
        stroke="#fde047"
        strokeWidth="1.1"
        strokeDasharray="4,3"
        opacity="0.85"
      />
    </Svg>
    <Text style={styles.dualRibbonBtnText}>{title}</Text>
  </TouchableOpacity>
);

interface OrganizerDashboardProps {
  user: UserProfile;
  events: TreasureEvent[];
  onAddEvent: (event: TreasureEvent) => void;
  onUpdateEvent: (event: TreasureEvent) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onDeleteAccount?: () => void;
  onLogout: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  user,
  events,
  onAddEvent,
  onUpdateEvent,
  onUpdateUser,
  onDeleteAccount,
  onLogout,
}) => {
  const [selectedEventForClues, setSelectedEventForClues] = useState<TreasureEvent | null>(
    events[0] || null
  );

  // Active Bottom Tab: 'home' | 'events' | 'rankings' | 'alerts' | 'rewards' | 'profile'
  const [activeBottomTab, setActiveBottomTab] = useState<
    'home' | 'events' | 'rankings' | 'alerts' | 'rewards' | 'profile'
  >('home');
  const [selectedEventForProgress, setSelectedEventForProgress] = useState<TreasureEvent | null>(
    events[0] || null
  );
  const [eventToEdit, setEventToEdit] = useState<TreasureEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventForDetails, setEventForDetails] = useState<TreasureEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [eventForRegistrations, setEventForRegistrations] = useState<TreasureEvent | null>(null);

  const handleOpenRegistrations = (evt?: TreasureEvent) => {
    const chosen = evt || selectedEventForClues || events[0] || null;
    setEventForRegistrations(chosen);
    setShowRegistrationsModal(true);
  };

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [paymentUpdateTrigger, setPaymentUpdateTrigger] = useState(0);

  useEffect(() => {
    const handlePaymentRecorded = () => {
      setPaymentUpdateTrigger((prev) => prev + 1);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('campus_payment_recorded', handlePaymentRecorded);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('campus_payment_recorded', handlePaymentRecorded);
      }
    };
  }, []);

  type ModalType = 'none' | 'create' | 'clues' | 'profile' | 'settings' | 'avatar' | 'changePassword' | 'supabase';
  const [activeModal, setActiveModal] = useState<ModalType>('none');

  const openSupabaseModal = () => {
    setActiveModal('supabase');
  };

  const openCreateModal = () => {
    setActiveModal('create');
  };

  const openCluesModal = (chosenEvent?: TreasureEvent) => {
    if (chosenEvent) {
      setSelectedEventForClues(chosenEvent);
      setActiveModal('clues');
    } else if (selectedEventForClues) {
      setActiveModal('clues');
    } else if (events.length > 0 && events[0]) {
      setSelectedEventForClues(events[0]);
      setActiveModal('clues');
    } else {
      setActiveModal('create');
    }
  };

  const handleOpenProgress = (evt?: TreasureEvent) => {
    if (evt) {
      setSelectedEventForProgress(evt);
    } else if (!selectedEventForProgress && events.length > 0) {
      setSelectedEventForProgress(events[0]);
    }
    setActiveBottomTab('progress');
  };

  const openProfileModal = () => {
    setActiveModal('profile');
  };

  const openSettingsModal = () => {
    setActiveModal('settings');
  };

  const closeModal = () => {
    setActiveModal('none');
  };

  const handleOpenEditEvent = (evt: TreasureEvent) => {
    setEventToEdit(evt);
    setShowEditModal(true);
  };

  const handleOpenDetails = (evt: TreasureEvent) => {
    setEventForDetails(evt);
    setShowDetailsModal(true);
  };

  const handleSaveEditedEvent = (updated: TreasureEvent) => {
    if (!updated) return;
    onUpdateEvent(updated);
    if (selectedEventForClues?.id === updated.id) {
      setSelectedEventForClues(updated);
    }
    setShowEditModal(false);
    setEventToEdit(null);
  };

  // Organizer live start broadcast state & handler
  const [broadcastStartedToast, setBroadcastStartedToast] = useState<string | null>(null);

  const handleStartEventNow = (evt: TreasureEvent) => {
    const started = startEventByOrganizer(evt, user, onUpdateEvent);
    onUpdateEvent(started);
    setBroadcastStartedToast(`🚀 "${evt.title}" is now LIVE! Registered squads have received the live starting signal.`);
    setTimeout(() => setBroadcastStartedToast(null), 4500);
  };

  // Editable fields synchronized with user
  const organizerName = user.username;
  const organizerEmail = user.email;
  const campusName = user.campusName || user.campusType || 'Main Campus';

  const handleCreateEvent = (newEvent: TreasureEvent) => {
    onAddEvent(newEvent);
    setSelectedEventForClues(newEvent);
    // Open clues modal for the newly created event
    setActiveModal('clues');
  };

  const handleUpdateClues = (updatedEvent: TreasureEvent) => {
    onUpdateEvent(updatedEvent);
    setSelectedEventForClues(updatedEvent);
  };

  const handleSelectAvatar = (avatar: PixarAvatar) => {
    if (onUpdateUser) {
      onUpdateUser({ avatarUrl: avatar.url });
    }
  };

  const profileInitial = (organizerName || user.username || 'A').charAt(0).toUpperCase();

  const currentAvatarObj = PIXAR_AVATARS.find((a) => a.url === user.avatarUrl) || null;

  // Real-time calculations for Organizer Profile Screen & Home Dashboard
  const totalClues = events.reduce((sum, e) => sum + (e.clues?.length || 0), 0) || 4;
  const collectionStats = useMemo(() => {
    return getOrganizerCollectionStats(events);
  }, [events, paymentUpdateTrigger]);
  const displayAmount = collectionStats.formattedAmount;

  return (
    <View style={styles.organizerRootScreen}>
      {/* ATMOSPHERIC GOTHIC CAMPUS NIGHT BACKDROP (EXACT MATCH TO REFERENCE) */}
      <View style={styles.organizerBackdropFixed} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 412 860" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="bgMidnightSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#040817" />
              <Stop offset="25%" stopColor="#06132d" />
              <Stop offset="55%" stopColor="#091b38" />
              <Stop offset="75%" stopColor="#051024" />
              <Stop offset="100%" stopColor="#020610" />
            </LinearGradient>
            <RadialGradient id="moonGlowAura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <Stop offset="35%" stopColor="#bae6fd" stopOpacity="0.45" />
              <Stop offset="70%" stopColor="#0284c7" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="lanternFlareGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <Stop offset="30%" stopColor="#f59e0b" stopOpacity="0.5" />
              <Stop offset="65%" stopColor="#b45309" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Deep Midnight Obsidian Sky */}
          <Rect width="412" height="860" fill="url(#bgMidnightSky)" />

          {/* Twinkling Celestial Stars */}
          <G fill="#ffffff">
            <Circle cx="40" cy="85" r="1.3" opacity="0.85" />
            <Circle cx="95" cy="55" r="1.6" opacity="0.9" />
            <Circle cx="150" cy="115" r="1.2" opacity="0.75" />
            <Circle cx="210" cy="180" r="1.4" opacity="0.8" />
            <Circle cx="260" cy="145" r="1.5" opacity="0.85" />
            <Circle cx="360" cy="170" r="1.2" opacity="0.7" />
            <Circle cx="75" cy="240" r="1.4" opacity="0.75" />
            <Circle cx="370" cy="270" r="1.3" opacity="0.8" />
            <Circle cx="120" cy="300" r="1.1" opacity="0.65" />
            <Circle cx="280" cy="320" r="1.3" opacity="0.7" />
            <Circle cx="50" cy="390" r="1.2" opacity="0.7" />
            <Circle cx="360" cy="410" r="1.4" opacity="0.75" />
          </G>

          {/* Glowing Golden Fireflies */}
          <G fill="#fde047">
            <Circle cx="125" cy="180" r="1.8" opacity="0.9" />
            <Circle cx="300" cy="210" r="1.6" opacity="0.85" />
            <Circle cx="60" cy="320" r="1.5" opacity="0.8" />
            <Circle cx="355" cy="345" r="1.7" opacity="0.85" />
            <Circle cx="170" cy="390" r="1.5" opacity="0.8" />
            <Circle cx="240" cy="420" r="1.8" opacity="0.9" />
            <Circle cx="90" cy="480" r="1.6" opacity="0.8" />
            <Circle cx="320" cy="500" r="1.5" opacity="0.75" />
          </G>

          {/* Top Organic Forest Canopy Silhouette framing header */}
          <Path
            d="M -20 -10 Q 60 40 140 15 Q 220 45 300 20 Q 370 45 440 10 L 440 125 Q 360 145 280 125 Q 180 145 100 128 Q 30 138 -20 122 Z"
            fill="#061e13"
          />
          <Path
            d="M -20 -10 Q 70 30 160 10 Q 250 35 340 12 L 440 8 L 440 108 Q 340 128 240 112 Q 140 128 -20 110 Z"
            fill="#0b2e1c"
            opacity="0.9"
          />

          {/* Left & Right Atmospheric Tree Foliage Silhouettes */}
          <Path
            d="M -10 90 Q 32 160 16 240 Q 36 320 14 400 Q 30 470 -10 540 Z"
            fill="#051b11"
            opacity="0.85"
          />
          <Path
            d="M 422 90 Q 380 160 396 240 Q 376 320 398 400 Q 382 470 422 540 Z"
            fill="#051b11"
            opacity="0.85"
          />

          {/* Street Lantern Flare on Lower-Left */}
          <Circle cx="38" cy="670" r="50" fill="url(#lanternFlareGlow)" />
          <Line x1="38" y1="640" x2="38" y2="820" stroke="#081426" strokeWidth="4" />
          <Polygon points="30,640 38,622 46,640" fill="#081426" />

          {/* Gothic Castle / Belltower Silhouette in Lower Half */}
          <Polygon points="165,580 206,510 247,580" fill="#040b18" />
          <Polygon points="196,520 206,470 216,520" fill="#020610" />
          <Rect x="178" y="580" width="56" height="150" fill="#040b18" />
          <Path
            d="M 50 670 L 50 630 L 75 630 L 75 615 L 95 615 L 95 630 L 135 630 L 135 590 L 160 565 L 185 590 L 227 590 L 252 565 L 277 590 L 277 630 L 317 630 L 317 615 L 337 615 L 337 630 L 362 630 L 362 670 Z"
            fill="#030814"
          />
          <Rect x="0" y="670" width="412" height="190" fill="#030712" />

          {/* Illuminated Castle Windows */}
          <Rect x="195" y="605" width="8" height="14" rx="2" fill="#fbbf24" opacity="0.95" />
          <Rect x="209" y="605" width="8" height="14" rx="2" fill="#fbbf24" opacity="0.95" />
          {/* Lower Left Illuminated Windows (▮ ▮) */}
          <Rect x="95" y="745" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
          <Rect x="118" y="745" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
          {/* Lower Right Illuminated Windows (▮ ▮) */}
          <Rect x="286" y="745" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
          <Rect x="309" y="745" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
          {/* Central Gate Archway */}
          <Path d="M 194 810 L 194 775 C 194 765 218 765 218 775 L 218 810 Z" fill="#fef08a" opacity="0.35" />
        </Svg>
      </View>

      {/* TOP BAR */}
      <View style={styles.topPhoneHeaderRow}>
            <TouchableOpacity
              onPress={() => setActiveBottomTab('profile')}
              {...({ onClick: () => setActiveBottomTab('profile') } as any)}
              style={styles.userInfoLeft}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatarCircle}>
                <Text style={styles.userAvatarInitial}>{profileInitial}</Text>
              </View>
              <View>
                <Text style={styles.userFullName}>
                  {organizerName || 'Campus Explorer'}
                </Text>
                <Text style={styles.userRoleSubtitle}>Event Organizer</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.topRightStatsRow}>
              <View style={styles.xpPillBadge}>
                <Text style={styles.xpPillBadgeText}>450 XP</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveBottomTab('alerts')}
                {...({ onClick: () => setActiveBottomTab('alerts') } as any)}
                style={styles.bellSquareBtn}
                activeOpacity={0.8}
              >
                <Bell size={16} color="#ffffff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MAIN STAGE CONTENT */}
          <ScrollView
            style={styles.phoneScrollContainer}
            contentContainerStyle={styles.centerStageScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
          {activeBottomTab === 'events' ? (
            /* ======================================================== */
            /* EVENTS CREATED (ONLY CREATED EVENTS & THEIR DETAILS)    */
            /* ======================================================== */
            <View style={styles.eventsHistorySection}>
              {/* Header */}
              <View style={styles.eventsHistoryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#fbbf24" />
                  <Text style={styles.eventsHistoryTitle}>EVENTS CREATED</Text>
                  <View style={styles.eventsCountBadge}>
                    <Text style={styles.eventsCountBadgeText}>{events.length}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={openCreateModal}
                  {...({ onClick: openCreateModal } as any)}
                  style={styles.createEventHistoryBtn}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#0f172a" strokeWidth={2.5} />
                  <Text style={styles.createEventHistoryBtnText}>Create Event</Text>
                </TouchableOpacity>
              </View>

              {/* Created Events List */}
              {events.length === 0 ? (
                <View style={styles.emptyHistoryCard}>
                  <Calendar size={32} color="#64748b" />
                  <Text style={styles.emptyHistoryTitle}>No events created yet</Text>
                  <Text style={styles.emptyHistorySubtitle}>
                    Create your first campus treasure hunt to see it here.
                  </Text>
                  <TouchableOpacity
                    onPress={openCreateModal}
                    {...({ onClick: openCreateModal } as any)}
                    style={styles.emptyCreateBtn}
                    activeOpacity={0.8}
                  >
                    <Plus size={14} color="#0f172a" strokeWidth={2.5} />
                    <Text style={styles.emptyCreateBtnText}>Create Event</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Toast Alert when Organizer Broadcasts Hunt Start */}
                  {broadcastStartedToast && (
                    <View style={styles.organizerBroadcastToast}>
                      <Radio size={16} color="#10b981" />
                      <Text style={styles.organizerBroadcastToastText}>{broadcastStartedToast}</Text>
                    </View>
                  )}

                  {/* Scheduled Event Notification Alert for Organizer */}
                  {events
                    .filter((e) => e && e.id && !isEventStartedByOrganizer(e))
                    .slice(0, 1)
                    .map((pendingEvt) => (
                      <View key={`pending-${pendingEvt.id}`} style={styles.organizerPendingScheduleBanner}>
                        <View style={styles.pendingScheduleLeft}>
                          <View style={styles.pendingScheduleIconRing}>
                            <Bell size={16} color="#fbbf24" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.pendingScheduleTitle}>
                              ⏰ Scheduled Hunt Ready: {pendingEvt.title}
                            </Text>
                            <Text style={styles.pendingScheduleSub}>
                              Scheduled for {pendingEvt.date} at {pendingEvt.time} • Registered players are in the waiting lobby.
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleStartEventNow(pendingEvt)}
                          style={styles.pendingScheduleBtn}
                          activeOpacity={0.75}
                        >
                          <Radio size={13} color="#0f172a" />
                          <Text style={styles.pendingScheduleBtnText}>Broadcast Start Now</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                  {events.map((evt, evtIdx) => {
                    if (!evt || !evt.id) return null;
                    const eventPin = evt.code || (evt as any).eventCode || '849201';
                    const eventDate = evt.date || 'TBD';
                    const eventTime = evt.time || (evt as any).startTime || '14:00';
                    const eventLocation = evt.startLocation || (evt as any).location || 'Campus Quad';
                    const eventDiff = evt.difficulty || 'Medium';

                    return (
                      <View
                        key={evt.id}
                        style={styles.historyEventCard}
                        {...({ className: `quest-interactive-card stagger-card-${(evtIdx % 4) + 1}` } as any)}
                      >
                      {/* Clickable Card Body to Open Details */}
                      <TouchableOpacity
                        onPress={() => handleOpenDetails(evt)}
                        {...({ onClick: () => handleOpenDetails(evt) } as any)}
                        activeOpacity={0.75}
                      >
                        {/* Top Row: Title & Join PIN */}
                        <View style={styles.historyCardTopRow}>
                          <Text style={styles.historyEventTitle} numberOfLines={1}>
                            {evt.title}
                          </Text>
                          <View style={styles.historyPinPill}>
                            <KeyRound size={11} color="#fbbf24" />
                            <Text style={styles.historyPinLabel}>PIN:</Text>
                            <Text style={styles.historyPinValue}>{eventPin}</Text>
                          </View>
                        </View>

                        {/* Event Description */}
                        <Text style={styles.historyEventDesc} numberOfLines={2}>
                          {evt.description || 'Campus quest exploration with riddles and checkpoints.'}
                        </Text>

                        {/* Event Details Chips */}
                        <View style={styles.historyMetaGrid}>
                          <View style={styles.historyMetaChip}>
                            <Calendar size={11} color="#cbd5e1" />
                            <Text style={styles.historyMetaText}>{eventDate}</Text>
                          </View>
                          <View style={styles.historyMetaChip}>
                            <Clock size={11} color="#cbd5e1" />
                            <Text style={styles.historyMetaText}>{eventTime}</Text>
                          </View>
                          <View style={styles.historyMetaChip}>
                            <MapPin size={11} color="#cbd5e1" />
                            <Text style={styles.historyMetaText}>{eventLocation}</Text>
                          </View>
                          <View style={styles.historyMetaChip}>
                            <Sparkles size={11} color="#fbbf24" />
                            <Text style={styles.historyMetaText}>{evt.clues ? evt.clues.length : 0} Clues</Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Status Badges & Action Buttons (Independent Row - No Nesting) */}
                      <View style={styles.historyActionsRow}>
                        <View style={styles.historyBadgesLine}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View
                              style={[
                                styles.historyStatusBadge,
                                isEventStartedByOrganizer(evt)
                                  ? { backgroundColor: 'rgba(245, 158, 11, 0.18)', borderColor: '#fbbf24' }
                                  : evt.status === 'upcoming'
                                  ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(251, 191, 36, 0.35)' }
                                  : { backgroundColor: 'rgba(15, 23, 42, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                              ]}
                            >
                              {isEventStartedByOrganizer(evt) && <View style={styles.amberPulseDot} />}
                              <Text
                                style={[
                                  styles.historyStatusBadgeText,
                                  isEventStartedByOrganizer(evt)
                                    ? { color: '#fde047' }
                                    : evt.status === 'upcoming'
                                    ? { color: '#f1f5f9' }
                                    : { color: '#94a3b8' },
                                ]}
                              >
                                {isEventStartedByOrganizer(evt) ? 'LIVE NOW' : 'NOT STARTED'}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.historyDiffBadge,
                                eventDiff.toLowerCase() === 'hard' || eventDiff.toLowerCase() === 'expert'
                                  ? { backgroundColor: 'rgba(180, 83, 9, 0.25)', borderColor: '#d97706' }
                                  : eventDiff.toLowerCase() === 'medium' || eventDiff.toLowerCase() === 'master'
                                  ? { backgroundColor: 'rgba(245, 158, 11, 0.18)', borderColor: '#f59e0b' }
                                  : { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.35)' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.historyDiffBadgeText,
                                  eventDiff.toLowerCase() === 'hard' || eventDiff.toLowerCase() === 'expert'
                                    ? { color: '#fcd34d' }
                                    : eventDiff.toLowerCase() === 'medium' || eventDiff.toLowerCase() === 'master'
                                    ? { color: '#fbbf24' }
                                    : { color: '#fde68a' },
                                ]}
                              >
                                {eventDiff.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Card Action Buttons with Horizontal Scroll Bar */}
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={true}
                          contentContainerStyle={styles.cardActionsScrollContent}
                          style={styles.cardActionsScrollView}
                          {...({ className: 'card-actions-scroll' } as any)}
                        >
                          {/* BROADCAST START BUTTON (Organizer action to launch hunt) */}
                          {!isEventStartedByOrganizer(evt) && (
                            <TouchableOpacity
                              onPress={() => handleStartEventNow(evt)}
                              style={styles.broadcastStartCardBtn}
                              activeOpacity={0.75}
                            >
                              <Radio size={12} color="#0f172a" />
                              <Text style={styles.broadcastStartCardBtnText}>Broadcast Start</Text>
                            </TouchableOpacity>
                          )}

                          {/* LIVE PROGRESS BUTTON (Only shown when event is going on) */}
                          {isEventStartedByOrganizer(evt) && (
                            <TouchableOpacity
                              onPress={() => handleOpenProgress(evt)}
                              {...({ onClick: () => handleOpenProgress(evt), className: 'btn-splash-primary' } as any)}
                              style={styles.liveProgressCardBtn}
                              activeOpacity={0.7}
                            >
                              <Activity size={12} color="#0f172a" />
                              <Text style={styles.liveProgressCardBtnText}>Live Progress</Text>
                            </TouchableOpacity>
                          )}

                          {/* VIEW DETAILS BUTTON */}
                          <TouchableOpacity
                            onPress={() => handleOpenDetails(evt)}
                            {...({ onClick: () => handleOpenDetails(evt), className: 'btn-splash-secondary' } as any)}
                            style={styles.viewDetailsBtn}
                            activeOpacity={0.7}
                          >
                            <Eye size={12} color="#fbbf24" />
                            <Text style={styles.viewDetailsBtnText}>Details</Text>
                          </TouchableOpacity>

                          {/* VIEW REGISTRATIONS BUTTON */}
                          <TouchableOpacity
                            onPress={() => handleOpenRegistrations(evt)}
                            style={styles.registrationsEventBtn}
                            activeOpacity={0.75}
                          >
                            <Users size={12} color="#fbbf24" />
                            <Text style={styles.registrationsEventBtnText}>Players</Text>
                          </TouchableOpacity>

                          {/* EDIT EVENT BUTTON */}
                          <TouchableOpacity
                            onPress={() => handleOpenEditEvent(evt)}
                            {...({ onClick: () => handleOpenEditEvent(evt), className: 'btn-splash-secondary' } as any)}
                            style={styles.editEventBtn}
                            activeOpacity={0.7}
                          >
                            <Edit2 size={12} color="#fde047" strokeWidth={2.2} />
                            <Text style={styles.editEventBtnText}>Edit</Text>
                          </TouchableOpacity>

                          {/* MANAGE CLUES BUTTON */}
                          <TouchableOpacity
                            onPress={() => openCluesModal(evt)}
                            {...({ onClick: () => openCluesModal(evt), className: 'btn-splash-secondary' } as any)}
                            style={styles.cluesEventBtn}
                            activeOpacity={0.7}
                          >
                            <Compass size={12} color="#f59e0b" />
                            <Text style={styles.cluesEventBtnText}>Clues</Text>
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
            </View>
          ) : activeBottomTab === 'rankings' ? (
            /* ======================================================== */
            /* REAL-TIME PROGRESS PANEL (WHO COMPLETED WHICH CLUES)     */
            /* ======================================================== */
            <View style={styles.progressHubSection}>
              <LiveProgressPanel
                events={events}
                selectedEventId={selectedEventForProgress?.id}
                onSelectEvent={(evt) => setSelectedEventForProgress(evt)}
              />
            </View>
          ) : activeBottomTab === 'alerts' ? (
            /* ======================================================== */
            /* ALERTS & NOTIFICATIONS SECTION                           */
            /* ======================================================== */
            <View style={styles.alertsHubSection}>
              <View style={styles.alertsHeader}>
                <Bell size={18} color="#fbbf24" />
                <Text style={styles.alertsTitleText}>ORGANIZER ALERTS</Text>
                <View style={styles.alertsBadgePill}>
                  <Text style={styles.alertsBadgePillText}>3 NEW</Text>
                </View>
              </View>

              <View style={styles.alertCardItem}>
                <View style={styles.alertCardDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertItemTitle}>Team Phoenix Joined</Text>
                  <Text style={styles.alertItemDesc}>4 players registered · UPI UTR Verified (₹199)</Text>
                  <Text style={styles.alertItemTime}>2 mins ago · PIN 849201</Text>
                </View>
              </View>

              <View style={styles.alertCardItem}>
                <View style={styles.alertCardDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertItemTitle}>Clue #1 QR Checkpoint Scanned</Text>
                  <Text style={styles.alertItemDesc}>Team Shadow Knights scanned Main Clock Tower QR</Text>
                  <Text style={styles.alertItemTime}>14 mins ago · Checkpoint 1</Text>
                </View>
              </View>

              <View style={styles.alertCardItem}>
                <View style={[styles.alertCardDot, { backgroundColor: '#10b981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertItemTitle}>Event Live Notice</Text>
                  <Text style={styles.alertItemDesc}>'The Great Belltower Mystery' is now active on campus</Text>
                  <Text style={styles.alertItemTime}>1 hour ago</Text>
                </View>
              </View>
            </View>
          ) : activeBottomTab === 'rewards' ? (
            /* ======================================================== */
            /* REWARDS & XP PERKS SECTION                               */
            /* ======================================================== */
            <View style={styles.rewardsHubSection}>
              <View style={styles.alertsHeader}>
                <Gift size={18} color="#fbbf24" />
                <Text style={styles.alertsTitleText}>ORGANIZER GUILD PERKS</Text>
              </View>

              <View style={styles.rewardPerkCard}>
                <Text style={styles.rewardPerkTitle}>Master Questmaker Perk</Text>
                <Text style={styles.rewardPerkDesc}>
                  You hold 450 XP! You've unlocked unlimited custom QR codes and real-time live map trails.
                </Text>
              </View>

              {/* SPONSOR SCRATCH CARDS CREATION & MANAGEMENT */}
              <SponsorScratchCardsManager organizerName={user.name || user.username} />
            </View>
          ) : activeBottomTab === 'profile' ? (
            /* ======================================================== */
            /* ORGANIZER PROFILE TAB (EXACT MATCH TO USER REFERENCE)    */
            /* ======================================================== */
            <View style={styles.profileScreenshotWrapper}>
              {/* TOP NIGHT SKY BANNER: CAMPUS QUEST + MOON + GREEN GARLAND */}
              <View style={styles.nightSkyBanner}>
                {/* Crescent Moon on upper right with luminous aura */}
                <View style={styles.crescentMoonWrap}>
                  <Svg width="44" height="44" viewBox="0 0 44 44">
                    <Defs>
                      <RadialGradient id="bannerMoonAuraProfile" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                        <Stop offset="40%" stopColor="#bae6fd" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Circle cx="22" cy="22" r="20" fill="url(#bannerMoonAuraProfile)" />
                    <Path
                      d="M 16 6 A 15 15 0 1 0 34 30 A 13.5 13.5 0 0 1 16 6 Z"
                      fill="#fef08a"
                      opacity="0.98"
                    />
                  </Svg>
                </View>

                {/* Twinkling stars in the night sky */}
                <Svg width="100%" height="72" viewBox="0 0 360 72" style={StyleSheet.absoluteFill}>
                  <Circle cx="35" cy="18" r="1.3" fill="#fbbf24" opacity="0.85" />
                  <Circle cx="110" cy="12" r="1.1" fill="#ffffff" opacity="0.9" />
                  <Circle cx="200" cy="16" r="1.3" fill="#fbbf24" opacity="0.8" />
                  <Circle cx="150" cy="48" r="1" fill="#ffffff" opacity="0.65" />
                  <Circle cx="290" cy="38" r="1.4" fill="#fbbf24" opacity="0.85" />
                  <Circle cx="65" cy="42" r="1.1" fill="#ffffff" opacity="0.75" />
                </Svg>

                {/* Glowing CAMPUS QUEST serif title */}
                <Text style={styles.brandingCampusQuestText}>CAMPUS QUEST</Text>

                {/* Green Beaded Garland with 7 glowing lights */}
                <View style={styles.garlandSvgWrap}>
                  <Svg width="220" height="18" viewBox="0 0 220 18">
                    <Path
                      d="M 10 5 Q 110 17 210 5"
                      stroke="#15803d"
                      strokeWidth="1.8"
                      fill="none"
                      opacity="0.9"
                    />
                    <Circle cx="20" cy="6.5" r="2.5" fill="#22c55e" />
                    <Circle cx="45" cy="9" r="3" fill="#16a34a" />
                    <Circle cx="75" cy="12" r="2.8" fill="#4ade80" />
                    <Circle cx="110" cy="13.5" r="3.5" fill="#22c55e" />
                    <Circle cx="145" cy="12" r="2.8" fill="#4ade80" />
                    <Circle cx="175" cy="9" r="3" fill="#16a34a" />
                    <Circle cx="200" cy="6.5" r="2.5" fill="#22c55e" />
                  </Svg>
                </View>
              </View>

              {/* CENTER HERO AVATAR WITH GOLD GLOWING RING */}
              <View style={styles.profileAvatarCenterWrap}>
                <TouchableOpacity
                  onPress={() => setActiveModal('profile')}
                  {...({ onClick: () => setActiveModal('profile') } as any)}
                  style={styles.profileAvatarOuterGlowRing}
                  activeOpacity={0.85}
                >
                  <View style={styles.profileAvatarInnerCircle}>
                    {user.avatarUrl && !user.avatarUrl.includes('placeholder') && !user.avatarUrl.endsWith('A') ? (
                      <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={styles.profileAvatarHeroLetter}>{profileInitial}</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* ORGANIZER'S ACTUAL NAME (MATCHES USER'S EXACT GOLD SERIF BRACKET FORMAT) */}
                <TouchableOpacity
                  onPress={() => setActiveModal('profile')}
                  {...({ onClick: () => setActiveModal('profile') } as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.profileOrganizerNameExact}>
                    [{organizerName?.toUpperCase() || 'YOUR NAME'}]
                  </Text>
                </TouchableOpacity>

                {/* EVENT ORGANIZER PILL */}
                <View style={styles.profileRolePillBadge}>
                  <Text style={styles.profileRolePillBadgeText}>EVENT ORGANIZER</Text>
                </View>
              </View>

              {/* 3 STATS CARDS ROW (EVENTS, CLUES, COLLECTED) */}
              <View style={styles.profileStatsRowExact}>
                {/* 1. Events */}
                <View style={styles.profileStatCardExact}>
                  <Text style={styles.profileStatNumberExact}>{events.length || 1}</Text>
                  <Text style={styles.profileStatLabelExact}>Events</Text>
                </View>

                {/* 2. Clues */}
                <View style={styles.profileStatCardExact}>
                  <Text style={styles.profileStatNumberExact}>{totalClues}</Text>
                  <Text style={styles.profileStatLabelExact}>Clues</Text>
                </View>

                {/* 3. Collected */}
                <TouchableOpacity
                  onPress={() => setShowPaymentDetailsModal(true)}
                  {...({ onClick: () => setShowPaymentDetailsModal(true) } as any)}
                  style={styles.profileStatCardExact}
                  activeOpacity={0.7}
                >
                  <Text style={styles.profileStatNumberExact}>{displayAmount}</Text>
                  <Text style={styles.profileStatLabelExact}>Collected</Text>
                </TouchableOpacity>
              </View>

              {/* MAIN MENU LIST CONTAINER (MATCHES EXACT REFERENCE BORDER & CHEVRONS) */}
              <View style={styles.profileMenuBoxOuter}>
                {/* 1. Edit Profile */}
                <TouchableOpacity
                  onPress={() => setActiveModal('profile')}
                  {...({ onClick: () => setActiveModal('profile') } as any)}
                  style={styles.profileMenuItemRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.profileMenuItemText}>Edit Profile</Text>
                  <Text style={styles.profileMenuItemChevron}>›</Text>
                </TouchableOpacity>

                {/* 2. Payment Details & Collections */}
                <TouchableOpacity
                  onPress={() => setShowPaymentDetailsModal(true)}
                  {...({ onClick: () => setShowPaymentDetailsModal(true) } as any)}
                  style={styles.profileMenuItemRow}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.profileMenuItemText}>Payment Details</Text>
                    <View style={styles.profilePaymentBadge}>
                      <Text style={styles.profilePaymentBadgeText}>{displayAmount}</Text>
                    </View>
                  </View>
                  <Text style={styles.profileMenuItemChevron}>›</Text>
                </TouchableOpacity>

                {/* 3. Payout & QR Settings */}
                <TouchableOpacity
                  onPress={() => setShowPayoutModal(true)}
                  {...({ onClick: () => setShowPayoutModal(true) } as any)}
                  style={styles.profileMenuItemRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.profileMenuItemText}>Payout & QR Settings</Text>
                  <Text style={styles.profileMenuItemChevron}>›</Text>
                </TouchableOpacity>

                {/* 3. Notifications */}
                <TouchableOpacity
                  onPress={() => setActiveBottomTab('alerts')}
                  {...({ onClick: () => setActiveBottomTab('alerts') } as any)}
                  style={styles.profileMenuItemRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.profileMenuItemText}>Notifications</Text>
                  <Text style={styles.profileMenuItemChevron}>›</Text>
                </TouchableOpacity>

                {/* 4. Help & Support */}
                <TouchableOpacity
                  onPress={() => setShowHelpModal(true)}
                  {...({ onClick: () => setShowHelpModal(true) } as any)}
                  style={styles.profileMenuItemRow}
                  activeOpacity={0.7}
                >
                  <Text style={styles.profileMenuItemText}>Help & Support</Text>
                  <Text style={styles.profileMenuItemChevron}>›</Text>
                </TouchableOpacity>

                {/* 5. Log Out */}
                <TouchableOpacity
                  onPress={() => setShowLogoutConfirm(true)}
                  {...({ onClick: () => setShowLogoutConfirm(true) } as any)}
                  style={[styles.profileMenuItemRow, { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.profileMenuItemLogoutText}>Log Out</Text>
                  <Text style={styles.profileMenuItemLogoutChevron}>›</Text>
                </TouchableOpacity>
              </View>

              {/* GOTHIC CASTLE SILHOUETTE WITH ILLUMINATED WINDOWS */}
              <View style={styles.gothicCastleWrap}>
                <Svg width="100%" height="95" viewBox="0 0 360 95" preserveAspectRatio="none">
                  <Path
                    d="M 0 95 L 0 45 L 45 45 L 45 32 L 68 8 L 92 32 L 92 45 L 135 45 L 135 18 L 180 0 L 225 18 L 225 45 L 268 45 L 268 32 L 292 8 L 315 32 L 315 45 L 360 45 L 360 95 Z"
                    fill="#050c18"
                  />
                  <Rect x="171" y="28" width="7" height="9" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="182" y="28" width="7" height="9" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="78" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="100" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="252" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="274" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                </Svg>
              </View>
            </View>
          ) : (
            /* ======================================================== */
            /* HOME TAB (EXACT MATCH TO REFERENCE SCREENSHOT)           */
            /* ======================================================== */
            <View style={styles.screenshotStageWrapper}>
              {/* TOP NIGHT SKY BANNER: CAMPUS QUEST + MOON + GREEN GARLAND */}
              <View style={styles.nightSkyBanner}>
                {/* Crescent Moon on upper right with luminous aura */}
                <View style={styles.crescentMoonWrap}>
                  <Svg width="44" height="44" viewBox="0 0 44 44">
                    <Defs>
                      <RadialGradient id="bannerMoonAura" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                        <Stop offset="40%" stopColor="#bae6fd" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Circle cx="22" cy="22" r="20" fill="url(#bannerMoonAura)" />
                    <Path
                      d="M 16 6 A 15 15 0 1 0 34 30 A 13.5 13.5 0 0 1 16 6 Z"
                      fill="#fef08a"
                      opacity="0.98"
                    />
                  </Svg>
                </View>

                {/* Twinkling stars in the night sky */}
                <Svg width="100%" height="72" viewBox="0 0 360 72" style={StyleSheet.absoluteFill}>
                  <Circle cx="35" cy="18" r="1.3" fill="#fbbf24" opacity="0.85" />
                  <Circle cx="110" cy="12" r="1.1" fill="#ffffff" opacity="0.9" />
                  <Circle cx="200" cy="16" r="1.3" fill="#fbbf24" opacity="0.8" />
                  <Circle cx="150" cy="48" r="1" fill="#ffffff" opacity="0.65" />
                  <Circle cx="290" cy="38" r="1.4" fill="#fbbf24" opacity="0.85" />
                  <Circle cx="65" cy="42" r="1.1" fill="#ffffff" opacity="0.75" />
                </Svg>

                {/* Glowing CAMPUS QUEST serif title */}
                <Text style={styles.brandingCampusQuestText}>CAMPUS QUEST</Text>

                {/* Green Beaded Garland with 7 glowing lights */}
                <View style={styles.garlandSvgWrap}>
                  <Svg width="220" height="18" viewBox="0 0 220 18">
                    <Path
                      d="M 10 5 Q 110 17 210 5"
                      stroke="#15803d"
                      strokeWidth="1.8"
                      fill="none"
                      opacity="0.9"
                    />
                    <Circle cx="20" cy="6.5" r="2.5" fill="#22c55e" />
                    <Circle cx="45" cy="9" r="3" fill="#16a34a" />
                    <Circle cx="75" cy="12" r="2.8" fill="#4ade80" />
                    <Circle cx="110" cy="13.5" r="3.5" fill="#22c55e" />
                    <Circle cx="145" cy="12" r="2.8" fill="#4ade80" />
                    <Circle cx="175" cy="9" r="3" fill="#16a34a" />
                    <Circle cx="200" cy="6.5" r="2.5" fill="#22c55e" />
                  </Svg>
                </View>
              </View>

              {/* DASHBOARD HEADER ROW: Organizer Hall / DASHBOARD + NEW HUNT */}
              <View style={styles.dashboardTitleRow}>
                <View>
                  <Text style={styles.organizerHallSubText}>Organizer Hall</Text>
                  <Text style={styles.dashboardMainTitleText}>DASHBOARD</Text>
                </View>

                <TouchableOpacity
                  onPress={openCreateModal}
                  {...({ onClick: openCreateModal } as any)}
                  style={styles.newHuntGoldBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.newHuntGoldBtnText}>+ NEW HUNT</Text>
                </TouchableOpacity>
              </View>

              {/* 2x2 METRIC STATS GRID */}
              <View style={styles.metricGrid2x2}>
                <View style={styles.metricRow}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Events</Text>
                    <Text style={styles.metricNumber}>{events.length || 1}</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Active clues</Text>
                    <Text style={styles.metricNumber}>
                      {events[0]?.clues?.length || 4}
                    </Text>
                  </View>
                </View>

                <View style={styles.metricRow}>
                  <TouchableOpacity
                    onPress={() => handleOpenRegistrations()}
                    {...({ onClick: () => handleOpenRegistrations() } as any)}
                    style={styles.metricCard}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.metricLabel}>Players joined</Text>
                    <Text style={styles.metricNumber}>{collectionStats.totalPlayersJoined}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowPaymentDetailsModal(true)}
                    {...({ onClick: () => setShowPaymentDetailsModal(true) } as any)}
                    style={styles.metricCard}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.metricLabel}>Collected</Text>
                    <Text style={styles.metricNumber}>{displayAmount}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ACTIVE HUNT EVENT CARD WITH AUTHENTIC DOUBLE GOLD BORDER */}
              <View style={styles.activeHuntCardDoubleOuter}>
                <View style={styles.activeHuntCardDoubleInner}>
                  <View style={styles.activeHuntTopRowExact}>
                    <View style={styles.liveHardBadgeExact}>
                      <Text style={styles.liveHardBadgeTextExact}>
                        LIVE · {events[0]?.difficulty?.toUpperCase() || 'HARD'}
                      </Text>
                    </View>

                    <Text style={styles.activeHuntPinExact}>
                      PIN {events[0]?.code || '849201'}
                    </Text>
                  </View>

                  <Text style={styles.activeHuntTitleExact}>
                    {events[0]?.title?.toUpperCase() || 'THE GREAT BELLTOWER MYSTERY'}
                  </Text>

                  <Text style={styles.activeHuntSubExact}>
                    {events[0]?.startLocation || 'Central University Grounds'} · {events[0]?.date || '2026-08-10'} · 700 XP
                  </Text>

                  {/* MANAGE CLUES & LEADERBOARD BUTTONS */}
                  <View style={styles.activeHuntButtonsRowExact}>
                    <DualRibbonBtn
                      title="MANAGE CLUES"
                      onPress={() => openCluesModal()}
                    />
                    <DualRibbonBtn
                      title="LEADERBOARD"
                      onPress={() => handleOpenProgress()}
                    />
                  </View>
                </View>
              </View>

              {/* QUICK ACTIONS CARD WITH AUTHENTIC DOUBLE GOLD BORDER */}
              <View style={styles.quickActionsCardDoubleOuter}>
                <View style={styles.quickActionsCardDoubleInner}>
                  <Text style={styles.quickActionsTitleExact}>QUICK ACTIONS</Text>

                  <QuickActionRibbonBtn
                    title="CREATE EVENT"
                    onPress={openCreateModal}
                  />

                  <QuickActionRibbonBtn
                    title="ADD CLUE / QR CHECKPOINT"
                    onPress={() => openCluesModal()}
                  />

                  <QuickActionRibbonBtn
                    title="VIEW REGISTRATIONS"
                    onPress={() => handleOpenRegistrations()}
                  />

                  <QuickActionRibbonBtn
                    title="VIEW PAYMENT DETAILS"
                    onPress={() => setShowPaymentDetailsModal(true)}
                  />
                </View>
              </View>

              {/* GOTHIC CASTLE SILHOUETTE WITH 4 LOWER ILLUMINATED WINDOWS */}
              <View style={styles.gothicCastleWrap}>
                <Svg width="100%" height="95" viewBox="0 0 360 95" preserveAspectRatio="none">
                  {/* Castle walls and turrets */}
                  <Path
                    d="M 0 95 L 0 45 L 45 45 L 45 32 L 68 8 L 92 32 L 92 45 L 135 45 L 135 18 L 180 0 L 225 18 L 225 45 L 268 45 L 268 32 L 292 8 L 315 32 L 315 45 L 360 45 L 360 95 Z"
                    fill="#050c18"
                  />
                  {/* Upper castle windows */}
                  <Rect x="171" y="28" width="7" height="9" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="182" y="28" width="7" height="9" rx="1" fill="#fbbf24" opacity="0.95" />

                  {/* Mid castle windows row 1 (left) */}
                  <Rect x="78" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="100" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />

                  {/* Mid castle windows row 2 (right) */}
                  <Rect x="252" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                  <Rect x="274" y="62" width="7.5" height="11" rx="1" fill="#fbbf24" opacity="0.95" />
                </Svg>
              </View>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAVIGATION BAR (MATCHES EXACT 6-TAB USER SCREENSHOT) */}
        <View style={styles.bottomNavExact}>
          {/* 1. HOME */}
          <TouchableOpacity
            onPress={() => setActiveBottomTab('home')}
            {...({ onClick: () => setActiveBottomTab('home') } as any)}
            style={styles.navItemExact}
            activeOpacity={0.7}
          >
            <Home
              size={18}
              color={activeBottomTab === 'home' ? '#fbbf24' : '#64748b'}
              strokeWidth={activeBottomTab === 'home' ? 2.5 : 1.8}
            />
            <Text style={[styles.navTextExact, activeBottomTab === 'home' && styles.navTextActiveExact]}>
              Home
            </Text>
          </TouchableOpacity>

          {/* 2. MY EVENTS */}
          <TouchableOpacity
            onPress={() => setActiveBottomTab('events')}
            {...({ onClick: () => setActiveBottomTab('events') } as any)}
            style={styles.navItemExact}
            activeOpacity={0.7}
          >
            <Ticket
              size={18}
              color={activeBottomTab === 'events' ? '#fbbf24' : '#64748b'}
              strokeWidth={activeBottomTab === 'events' ? 2.5 : 1.8}
            />
            <Text style={[styles.navTextExact, activeBottomTab === 'events' && styles.navTextActiveExact]}>
              My Events
            </Text>
          </TouchableOpacity>

          {/* 3. RANKINGS */}
          <TouchableOpacity
            onPress={() => setActiveBottomTab('rankings')}
            {...({ onClick: () => setActiveBottomTab('rankings') } as any)}
            style={styles.navItemExact}
            activeOpacity={0.7}
          >
            <Trophy
              size={18}
              color={activeBottomTab === 'rankings' ? '#fbbf24' : '#64748b'}
              strokeWidth={activeBottomTab === 'rankings' ? 2.5 : 1.8}
            />
            <Text style={[styles.navTextExact, activeBottomTab === 'rankings' && styles.navTextActiveExact]}>
              Rankings
            </Text>
          </TouchableOpacity>

          {/* 4. ALERTS (WITH RED NOTIFICATION BADGE 3) */}
          <TouchableOpacity
            onPress={() => setActiveBottomTab('alerts')}
            {...({ onClick: () => setActiveBottomTab('alerts') } as any)}
            style={styles.navItemExact}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Bell
                size={18}
                color={activeBottomTab === 'alerts' ? '#fbbf24' : '#64748b'}
                strokeWidth={activeBottomTab === 'alerts' ? 2.5 : 1.8}
              />
              <View style={styles.alertsBadgeDot}>
                <Text style={styles.alertsBadgeDotText}>3</Text>
              </View>
            </View>
            <Text style={[styles.navTextExact, activeBottomTab === 'alerts' && styles.navTextActiveExact]}>
              Alerts
            </Text>
          </TouchableOpacity>

          {/* 5. REWARDS */}
          <TouchableOpacity
            onPress={() => setActiveBottomTab('rewards')}
            {...({ onClick: () => setActiveBottomTab('rewards') } as any)}
            style={styles.navItemExact}
            activeOpacity={0.7}
          >
            <Gift
              size={18}
              color={activeBottomTab === 'rewards' ? '#fbbf24' : '#64748b'}
              strokeWidth={activeBottomTab === 'rewards' ? 2.5 : 1.8}
            />
            <Text style={[styles.navTextExact, activeBottomTab === 'rewards' && styles.navTextActiveExact]}>
              Rewards
            </Text>
          </TouchableOpacity>

          {/* 6. PROFILE */}
          <TouchableOpacity
            onPress={() => setActiveBottomTab('profile')}
            {...({ onClick: () => setActiveBottomTab('profile') } as any)}
            style={styles.navItemExact}
            activeOpacity={0.7}
          >
            <User
              size={18}
              color={activeBottomTab === 'profile' ? '#fbbf24' : '#64748b'}
              strokeWidth={activeBottomTab === 'profile' ? 2.5 : 1.8}
            />
            <Text style={[styles.navTextExact, activeBottomTab === 'profile' && styles.navTextActiveExact]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* ORGANIZER PROFILE MODAL */}
        <OrganizerProfileModal
          visible={activeModal === 'profile'}
          user={user}
          onUpdateUser={onUpdateUser}
          onLogout={onLogout}
          onClose={closeModal}
        />

        {/* Payout & QR Settings Modal */}
        <PayoutQrSettingsModal
          visible={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          organizerName={organizerName}
          initialUpiId={user.upiId || 'campus.quest@oksbi'}
          onSaveUpiId={(newUpi) => {
            if (onUpdateUser) {
              onUpdateUser({ upiId: newUpi });
            }
          }}
        />

        {/* Help & Support Modal */}
        <HelpSupportModal
          visible={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          organizerName={organizerName}
        />

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.logoutModalOverlay}>
            <View style={styles.logoutModalCard}>
              <Text style={styles.logoutModalTitle}>Confirm Log Out</Text>
              <Text style={styles.logoutModalMessage}>
                Are you sure you want to log out of {organizerName || 'your organizer account'}?
              </Text>
              <View style={styles.logoutModalButtonsRow}>
                <TouchableOpacity
                  onPress={() => setShowLogoutConfirm(false)}
                  style={styles.logoutCancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.logoutCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  style={styles.logoutConfirmBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.logoutConfirmBtnText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 3D Pixar Avatar Picker Modal */}
        <AvatarPickerModal
          visible={activeModal === 'avatar'}
          currentAvatarUrl={user.avatarUrl}
          onSelectAvatar={handleSelectAvatar}
          onClose={closeModal}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          visible={activeModal === 'changePassword'}
          userEmail={organizerEmail}
          onClose={closeModal}
        />

        {/* Supabase Backend & Database Modal */}
        <SupabaseBackendModal
          visible={activeModal === 'supabase'}
          onClose={closeModal}
        />

        {/* Unified Settings Modal */}
        <SettingsModal
          visible={activeModal === 'settings'}
          onClose={closeModal}
          user={user}
          onUpdateUser={onUpdateUser}
          onDeleteAccount={onDeleteAccount}
          onLogout={onLogout}
        />

        {/* Create Event Modal */}
        <CreateEventModal
          visible={activeModal === 'create'}
          onSave={handleCreateEvent}
          onClose={closeModal}
          organizerName={organizerName}
          organizerEmail={organizerEmail}
          campusType={user.campusType || 'College Campus'}
          campusName={user.campusName || 'Central University'}
        />

        {/* Manage Clues Modal */}
        {activeModal === 'clues' && (
          <ManageCluesModal
            visible={activeModal === 'clues'}
            event={selectedEventForClues || events[0] || null}
            allEvents={events}
            onSelectEvent={(chosenEvt) => setSelectedEventForClues(chosenEvt)}
            onUpdateEvent={handleUpdateClues}
            onClose={closeModal}
          />
        )}

        {/* Edit Event Modal */}
        {showEditModal && eventToEdit && (
          <EditEventModal
            visible={showEditModal}
            event={eventToEdit}
            onSave={handleSaveEditedEvent}
            onClose={() => {
              setShowEditModal(false);
              setEventToEdit(null);
            }}
          />
        )}

        {/* Event Details Modal */}
        {showDetailsModal && eventForDetails && (
          <EventDetailsModal
            visible={showDetailsModal}
            event={eventForDetails}
            onEdit={(evt) => {
              setShowDetailsModal(false);
              handleOpenEditEvent(evt);
            }}
            onManageClues={(evt) => {
              setShowDetailsModal(false);
              openCluesModal(evt);
            }}
            onClose={() => {
              setShowDetailsModal(false);
              setEventForDetails(null);
            }}
          />
        )}

        {/* Event Registrations Modal (Shows how many players are registered for particular event) */}
        {showRegistrationsModal && (
          <EventRegistrationsModal
            visible={showRegistrationsModal}
            event={eventForRegistrations || events[0] || null}
            allEvents={events}
            onSelectEvent={(chosenEvt) => setEventForRegistrations(chosenEvt)}
            onClose={() => setShowRegistrationsModal(false)}
          />
        )}

        {/* Organizer Payment Details Modal (Shows all verified payments with registered email & user ID) */}
        {showPaymentDetailsModal && (
          <OrganizerPaymentDetailsModal
            visible={showPaymentDetailsModal}
            events={events}
            onClose={() => setShowPaymentDetailsModal(false)}
          />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  organizerRootScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#040817',
    position: 'relative',
    overflow: 'hidden',
  },
  organizerBackdropFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  topPhoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(4, 8, 23, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 10,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  userAvatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
  },
  userFullName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
    fontFamily: "'Outfit', sans-serif",
  },
  userRoleSubtitle: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
    fontFamily: "'Outfit', sans-serif",
  },
  topRightStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpPillBadge: {
    backgroundColor: '#060d1a',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
  },
  xpPillBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
    fontFamily: "'Outfit', sans-serif",
  },
  bellSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#060d1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneScrollContainer: {
    flex: 1,
    zIndex: 5,
  },
  centerStageScroll: {
    flexGrow: 1,
  },
  screenshotStageWrapper: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 16,
    width: '100%',
  },
  /* ORGANIZER PROFILE EXACT STYLES (MATCHES REFERENCE IMAGE) */
  profileScreenshotWrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    width: '100%',
  },
  profileAvatarCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  profileAvatarOuterGlowRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.8,
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    marginBottom: 6,
  },
  profileAvatarInnerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarHeroLetter: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  profileOrganizerNameExact: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(251, 191, 36, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  profileRolePillBadge: {
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(3, 7, 18, 0.7)',
    marginTop: 6,
    alignSelf: 'center',
  },
  profileRolePillBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 1.4,
    fontFamily: "'Outfit', sans-serif",
  },
  profileStatsRowExact: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 16,
  },
  profileStatCardExact: {
    flex: 1,
    backgroundColor: 'rgba(4, 9, 24, 0.82)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d97706',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  profileStatNumberExact: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    marginBottom: 3,
  },
  profileStatLabelExact: {
    fontSize: 11.5,
    color: '#cbd5e1',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
  },
  profileMenuBoxOuter: {
    backgroundColor: 'rgba(4, 9, 24, 0.88)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#d97706',
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  profileMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileMenuItemText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: "'Outfit', sans-serif",
  },
  profilePaymentBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  profilePaymentBadgeText: {
    color: '#fbbf24',
    fontSize: 11.5,
    fontWeight: '900',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  profileMenuItemChevron: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Outfit', sans-serif",
  },
  profileMenuItemLogoutText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#f87171',
    fontFamily: "'Outfit', sans-serif",
  },
  profileMenuItemLogoutChevron: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f87171',
    fontFamily: "'Outfit', sans-serif",
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a1024',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f87171',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f87171',
    fontFamily: "'Cinzel', 'Georgia', serif",
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  logoutModalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoutCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutConfirmBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  nightSkyBanner: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
    marginBottom: 6,
  },
  crescentMoonWrap: {
    position: 'absolute',
    top: 4,
    right: 12,
    zIndex: 3,
  },
  brandingCampusQuestText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 2.2,
    textAlign: 'center',
    textShadowColor: 'rgba(251, 191, 36, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    zIndex: 2,
  },
  garlandSvgWrap: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dashboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  organizerHallSubText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: 1,
  },
  dashboardMainTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 1,
    textShadowColor: 'rgba(251, 191, 36, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  newHuntGoldBtn: {
    backgroundColor: '#b45309',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7.5,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  newHuntGoldBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
  metricGrid2x2: {
    gap: 8,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(4, 9, 22, 0.72)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: 2,
  },
  metricNumber: {
    fontSize: 27,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  activeHuntCardDoubleOuter: {
    backgroundColor: 'rgba(4, 9, 22, 0.8)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 3,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  activeHuntCardDoubleInner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    padding: 11,
  },
  activeHuntTopRowExact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  liveHardBadgeExact: {
    backgroundColor: 'rgba(2, 6, 15, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#d97706',
  },
  liveHardBadgeTextExact: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
    fontFamily: "'Outfit', sans-serif",
  },
  activeHuntPinExact: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
  activeHuntTitleExact: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  activeHuntSubExact: {
    fontSize: 9.5,
    color: '#cbd5e1',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: 10,
  },
  activeHuntButtonsRowExact: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionsCardDoubleOuter: {
    backgroundColor: 'rgba(4, 9, 22, 0.8)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 3,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  quickActionsCardDoubleInner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    padding: 11,
  },
  quickActionsTitleExact: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickActionRibbon: {
    height: 46,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    position: 'relative',
  },
  quickActionRibbonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fef08a',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
    marginLeft: 14,
  },
  dualRibbonBtnContainer: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dualRibbonBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
  },
  gothicCastleWrap: {
    height: 95,
    marginTop: 2,
    marginBottom: -4,
    overflow: 'hidden',
  },
  bottomNavExact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050a14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.35)',
    paddingVertical: 7,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  navItemExact: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
    paddingVertical: 2,
  },
  navTextExact: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  navTextActiveExact: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  alertsBadgeDot: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsBadgeDotText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#ffffff',
  },
  alertsHubSection: {
    padding: 14,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertsTitleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'serif',
    letterSpacing: 0.8,
  },
  alertsBadgePill: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  alertsBadgePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  alertCardItem: {
    backgroundColor: '#081021',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  alertCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    marginTop: 4,
  },
  alertItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
    marginBottom: 2,
  },
  alertItemDesc: {
    fontSize: 10.5,
    color: '#cbd5e1',
    marginBottom: 2,
  },
  alertItemTime: {
    fontSize: 9.5,
    color: '#64748b',
  },
  rewardsHubSection: {
    padding: 14,
  },
  rewardPerkCard: {
    backgroundColor: '#081021',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
  },
  rewardPerkTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 4,
  },
  rewardPerkDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 30,
    elevation: 10,
  },
  profileBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#fde047',
    overflow: 'hidden',
  },
  avatarImgSmall: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileSub: {
    fontSize: 10,
    color: '#fcd34d',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  eventsCenterStageScroll: {
    flexGrow: 1,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 76,
    gap: 16,
  },
  heroGreetingCard: {
    backgroundColor: 'rgba(11, 19, 41, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  heroGreetingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  campusTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  campusTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fbbf24',
  },
  heroGreetingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  heroGreetingSub: {
    fontSize: 11.5,
    color: '#cbd5e1',
    marginTop: 2,
    lineHeight: 16,
  },
  heroAddEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#b45309',
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  heroAddEventBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  quickActionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  quickActionDesc: {
    fontSize: 10.5,
    color: '#cbd5e1',
  },
  featuredEventCard: {
    backgroundColor: 'rgba(11, 19, 41, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  featuredEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  amberPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  featuredStatusText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  clueCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderWidth: 1,
    borderColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  clueCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fde047',
  },
  featuredEventTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  featuredEventDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  joinCodeBox: {
    marginTop: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  joinCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  joinCodeValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyCodeBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  eventsSectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventsSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  addEventMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addEventMiniBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a',
  },
  eventItemCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  eventItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eventItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  eventItemDesc: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  eventDiffBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  eventDiffBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  eventItemDetailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  eventDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  eventDetailText: {
    fontSize: 9.5,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  eventItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.3)',
  },
  eventCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCodeLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '700',
  },
  eventCodeValue: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#38bdf8',
  },
  manageEventCluesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageEventCluesBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  statsSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  statTileCard: {
    width: '23.5%',
    minWidth: 70,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  statTileIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statTileNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  statTileLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 50,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 2,
  },
  navText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  navTextActive: {
    color: '#fbbf24',
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderWidth: 2,
    borderColor: '#d97706',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#475569',
    zIndex: 10,
  },
  profileHeroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.3)',
  },
  bigAvatarWrapper: {
    position: 'relative',
  },
  modalAvatarImg: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fde047',
    backgroundColor: '#1e293b',
  },
  modalAvatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fde047',
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  changeAvatarBtnPill: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: [{ translateX: -34 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  changeAvatarBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0f172a',
  },
  profileTitleArea: {
    flex: 1,
    gap: 3,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalProfileName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fef08a',
  },
  editNameIconBtn: {
    padding: 3,
  },
  inlineNameEditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineNameInput: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#ffffff',
  },
  inlineSaveNameBtn: {
    backgroundColor: '#fbbf24',
    padding: 6,
    borderRadius: 6,
  },
  inlineCancelNameBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 6,
    borderRadius: 6,
  },
  roleTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fde047',
  },
  avatarPersonaCaption: {
    fontSize: 10.5,
    color: '#cbd5e1',
    marginTop: 2,
  },
  openAvatarPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  openAvatarPickerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#fef08a',
  },
  openAvatarPickerSub: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  feedbackBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6ee7b7',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 0.5,
  },
  orgLoginCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 10,
    marginBottom: 12,
  },
  orgLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  orgLoginIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgLoginLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.3,
  },
  orgLoginValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 1,
  },
  orgLoginDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
  },
  phoneActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removePhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  removePhoneText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fca5a5',
  },
  editPhoneBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editPhoneBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fde047',
  },
  inlinePhoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  inlinePhoneInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 11,
    color: '#ffffff',
  },
  inlineSaveBtn: {
    backgroundColor: '#fbbf24',
    padding: 5,
    borderRadius: 6,
  },
  inlineCancelBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    padding: 5,
    borderRadius: 6,
  },
  changePasswordCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  keyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#fef08a',
  },
  changePasswordSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  openSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },
  openSettingsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#fde047',
  },
  signOutModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    marginTop: 4,
  },
  signOutModalBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  /* EVENTS CREATED & HISTORY STYLES */
  eventsHistorySection: {
    marginBottom: 16,
  },
  eventsHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eventsHistoryTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  eventsHistorySubtitle: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  createEventHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createEventHistoryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterPillTextActive: {
    color: '#fbbf24',
  },
  emptyHistoryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  emptyHistorySubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#b45309',
    borderWidth: 1.5,
    borderColor: '#fde047',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  emptyCreateBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  historyEventCard: {
    backgroundColor: 'rgba(11, 19, 41, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.22)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyStatusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  historyDiffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyDiffBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyPinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyPinLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  historyPinValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1,
  },
  historyEventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  historyEventDesc: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 10,
  },
  historyMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  historyMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  historyMetaText: {
    fontSize: 10.5,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  historyExpandedBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  expandedDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  expandedLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fbbf24',
    width: 80,
  },
  expandedVal: {
    fontSize: 10.5,
    color: '#e2e8f0',
    flex: 1,
  },
  historyActionsRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  historyBadgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionsScrollView: {
    width: '100%',
    maxWidth: '100%',
  },
  cardActionsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 1,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  viewDetailsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
  },
  editEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    backgroundColor: '#b45309',
    borderWidth: 1,
    borderColor: '#fde047',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  editEventBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  cluesEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cluesEventBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fef08a',
  },
  toggleDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  toggleDetailsBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  viewEventsCreatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  eventsBannerSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  eventsCountBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  eventsCountBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0f172a',
  },
  navBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#fbbf24',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#0f172a',
  },
  liveNavPulseBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  liveProgressCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  liveProgressCardBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  progressHubSection: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  liveProgressSectionWrap: {
    marginHorizontal: 14,
    marginTop: 14,
  },
  liveProgressSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  liveProgressSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.8,
  },
  liveProgressExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveProgressExpandBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* Broadcast Toast & Scheduled Banner */
  organizerBroadcastToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 12,
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
  },
  organizerBroadcastToastText: {
    flex: 1,
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },
  organizerPendingScheduleBanner: {
    backgroundColor: '#0a142c',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 14,
    gap: 10,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
  },
  pendingScheduleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pendingScheduleIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingScheduleTitle: {
    color: '#fef08a',
    fontSize: 13,
    fontWeight: '900',
  },
  pendingScheduleSub: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  pendingScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 10,
    boxShadow: '0 3px 10px rgba(245, 158, 11, 0.4)',
  },
  pendingScheduleBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  broadcastStartCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 5,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
  },
  broadcastStartCardBtnText: {
    color: '#071626',
    fontSize: 11,
    fontWeight: '900',
  },
  registrationsEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  registrationsEventBtnText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
});

