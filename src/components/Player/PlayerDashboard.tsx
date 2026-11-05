import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import {
  Home,
  Ticket,
  Trophy,
  Bell,
  Gift,
  User,
  Settings,
  LogOut,
  Award,
  Sparkles,
  X,
} from 'lucide-react-native';
import { TreasureEvent, UserProfile, LeaderboardEntry } from '../../types';
import { EventAnnouncement } from '../../utils/announcementManager';
import { INITIAL_EVENTS, INITIAL_LEADERBOARD } from '../../data/mockData';
import { CampusBackground } from '../CampusBackground';
import { SettingsModal } from '../SettingsModal';
import { AvatarPickerModal } from '../AvatarPickerModal';
import { OrganizerProfileModal } from '../Organizer/OrganizerProfileModal';
import { ChangePasswordModal } from '../ChangePasswordModal';
import { PIXAR_AVATARS, PixarAvatar } from '../../data/avatars';

// Player Screens
import { PlayerHomeDashboard } from './PlayerHomeDashboard';
import { HomeEventsScreen } from './HomeEventsScreen';
import { EventDetailsPage } from './EventDetailsPage';
import { MyEventsScreen } from './MyEventsScreen';
import { GameDashboardScreen } from './GameDashboardScreen';
import { PostEventScreen } from './PostEventScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { RewardsScreen } from './RewardsScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { ProfileSettingsScreen } from './ProfileSettingsScreen';
import { PlayerFixedBackground } from './PlayerFixedBackground';
import { FairPlayNoticeModal } from './FairPlayNoticeModal';

// 6 Core Bottom Navigation Tabs as specified by USER_REQUEST
export type PlayerNavTab =
  | 'home'
  | 'my-events'
  | 'leaderboard'
  | 'notifications'
  | 'rewards'
  | 'profile';

interface PlayerDashboardProps {
  user: UserProfile;
  events?: TreasureEvent[];
  activeEvent?: TreasureEvent;
  leaderboard?: LeaderboardEntry[];
  onAddEvent?: (event: TreasureEvent) => void;
  onUpdateEvent?: (event: TreasureEvent) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onDeleteAccount?: () => void;
  onLogout: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({
  user,
  events = [],
  activeEvent,
  leaderboard = INITIAL_LEADERBOARD,
  onAddEvent,
  onUpdateEvent,
  onUpdateUser,
  onDeleteAccount,
  onLogout,
}) => {
  // Active Bottom Bar Tab
  const [activeTab, setActiveTab] = useState<PlayerNavTab>('home');

  // Sub-screen states (Game Mode, Event Details, Post-Event)
  const [inGameMode, setInGameMode] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [viewingPostEvent, setViewingPostEvent] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<TreasureEvent | null>(null);

  // Selected event for details or gameplay
  const [selectedEvent, setSelectedEvent] = useState<TreasureEvent | null>(
    events.find((e) => e && e.status === 'active') || events[0] || null
  );

  // Unread notifications counter (for bell icon badge)
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('campus_player_notifs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter((n: any) => !n.read).length;
          }
        }
      }
    } catch (e) {}
    return 2;
  });

  // Final score for post-event review
  const [finalScore, setFinalScore] = useState<number>(user.score || 850);

  // Player Joined Events persistent list — defaults to completely empty []
  // so the player is never registered to any event by default.
  const joinedStorageKey = `campus_player_registered_clean_${user.email || user.username}`;
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        // Clean legacy pre-registered keys from previous tests so user starts clean
        localStorage.removeItem(`campus_player_joined_${user.email || user.username}`);
        localStorage.removeItem('campus_player_joined_alex.hunter@campus.edu');
        localStorage.removeItem('campus_player_joined_ExplorerArjun');
        localStorage.removeItem('campus_player_joined_undefined');
        localStorage.removeItem('campus_player_joined_null');

        const saved = localStorage.getItem(joinedStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  // Player Disqualified / Eliminated Events persistent list
  const eliminatedStorageKey = `campus_player_eliminated_${user.email || user.username}`;
  const [eliminatedEventIds, setEliminatedEventIds] = useState<string[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(eliminatedStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  // Sync eliminated events to localStorage
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(eliminatedStorageKey, JSON.stringify(eliminatedEventIds));
      }
    } catch (e) {}
  }, [eliminatedEventIds, eliminatedStorageKey]);

  const handlePlayerEliminated = (eventId: string) => {
    setEliminatedEventIds((prev) => {
      if (prev.includes(eventId)) return prev;
      return [...prev, eventId];
    });
  };

  // Keep selected event synced if events list updates
  useEffect(() => {
    if (!selectedEvent && events.length > 0 && events[0]) {
      setSelectedEvent(events[0]);
    }
  }, [events, selectedEvent]);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Live Organizer Announcement Pop-Up for Players
  const [activeAnnouncement, setActiveAnnouncement] = useState<EventAnnouncement | null>(null);

  useEffect(() => {
    const handleAnnouncement = (e: any) => {
      const ann: EventAnnouncement = e.detail;
      if (!ann) return;
      // Show pop-up if player is viewing, playing, or registered for this event
      const isRelevant =
        !ann.eventId ||
        (selectedEvent && selectedEvent.id === ann.eventId) ||
        (joinedEventIds && joinedEventIds.includes(ann.eventId)) ||
        inGameMode;

      if (isRelevant) {
        setActiveAnnouncement(ann);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campus_organizer_announcement', handleAnnouncement);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('campus_organizer_announcement', handleAnnouncement);
      }
    };
  }, [selectedEvent, joinedEventIds, inGameMode]);

  const playerName = user.username || 'Explorer';
  const profileInitial = playerName.charAt(0).toUpperCase();
  const currentAvatarObj = PIXAR_AVATARS.find((a) => a.url === user.avatarUrl) || null;

  const handleSelectAvatar = (avatar: PixarAvatar) => {
    if (onUpdateUser) {
      onUpdateUser({ avatarUrl: avatar.url });
    }
  };

  // Join Event action handler — ONLY called after the backend confirms registration
  const handleJoinEvent = (eventToJoin: TreasureEvent): boolean => {
    if (!eventToJoin || !eventToJoin.id) return false;
    if (!joinedEventIds.includes(eventToJoin.id)) {
      setJoinedEventIds((prev) => [...prev, eventToJoin.id]);
    }
    return true;
  };

  // Unregister / reset event handler (allows player to re-test registration flow)
  const handleUnregisterEvent = (evtId: string) => {
    if (!evtId) return;
    setJoinedEventIds((prev) => prev.filter((id) => id !== evtId));
  };

  // Quick join from event card — opens Event Details so the player can complete one-click checkout
  const handleRequestRegistration = (evt: TreasureEvent) => {
    if (!evt || !evt.id) return;
    if (eliminatedEventIds.includes(evt.id)) {
      alert(`Access Denied: You have been disqualified and eliminated from "${evt.title}" due to anti-cheat fair play violations. You cannot participate in this event again.`);
      return;
    }
    setSelectedEvent(evt);
    setViewingDetails(false);
    setInGameMode(false);
    setViewingPostEvent(false);
    setActiveTab('home');
    setRegistrationRequest(evt);
  };

  const handleQuickJoinEvent = (evt: TreasureEvent) => {
    if (!evt || !evt.id) return;
    handleRequestRegistration(evt);
  };

  // Open Event Details
  const handleOpenEventDetails = (evt: TreasureEvent) => {
    if (!evt) return;
    setSelectedEvent(evt);
    setViewingDetails(true);
    setInGameMode(false);
    setViewingPostEvent(false);
  };

  // State for strict fair play pre-start confirmation modal
  const [fairPlayEvent, setFairPlayEvent] = useState<TreasureEvent | null>(null);

  // Launch Live Game — only launches if already registered and NOT eliminated
  const handleLaunchGame = (evt: TreasureEvent) => {
    if (!evt || !evt.id) return;

    // Strict Anti-Cheat Rule: Eliminated players are barred from playing this event again
    if (eliminatedEventIds.includes(evt.id)) {
      alert(`Access Denied: You have been disqualified and eliminated from "${evt.title}" due to anti-cheat fair play violations. You are permanently barred from participating in this event.`);
      return;
    }

    if (!joinedEventIds.includes(evt.id)) {
      handleRequestRegistration(evt);
      return;
    }
    // Strict Fair Play: Always confirm anti-cheat rules before entering live game
    setFairPlayEvent(evt);
  };

  const handleFairPlayAcceptedAndLaunch = () => {
    if (!fairPlayEvent) return;
    const evt = fairPlayEvent;
    setFairPlayEvent(null);
    setSelectedEvent(evt);
    setInGameMode(true);
    setViewingDetails(false);
    setViewingPostEvent(false);
  };

  // Complete Hunt
  const handleCompleteHunt = (earnedScore: number) => {
    setFinalScore(earnedScore);
    setInGameMode(false);
    setViewingPostEvent(true);
  };

  // Switch Bottom Tab
  const handleTabPress = (tab: PlayerNavTab) => {
    setActiveTab(tab);
    setInGameMode(false);
    setViewingDetails(false);
    setViewingPostEvent(false);
  };

  // Seed sample organizer event helper for empty state
  const handleSeedSampleOrganizerEvent = () => {
    if (onAddEvent && INITIAL_EVENTS.length > 0) {
      const sample = {
        ...INITIAL_EVENTS[0],
        id: `evt-org-${Date.now()}`,
        status: 'active' as const,
      };
      onAddEvent(sample);
      setSelectedEvent(sample);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.mainContainer}>
        {/* FIXED NOCTURNAL CAMPUS QUEST BACKGROUND (DOES NOT MOVE ON SCROLL) */}
        <PlayerFixedBackground />

        {/* ======================================================== */}
        {/* TOP COMPACT HEADER                                       */}
        {/* ======================================================== */}
        {!inGameMode && activeTab !== 'profile' && (
          <View style={[styles.topHeader, { backgroundColor: 'rgba(8, 13, 34, 0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(251, 191, 36, 0.3)' }]}>
            <TouchableOpacity
              onPress={() => handleTabPress('profile')}
              {...({ onClick: () => handleTabPress('profile') } as any)}
              style={styles.profileBadgeBtn}
              activeOpacity={0.7}
            >
              <View style={styles.avatarBox}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImgSmall} />
                ) : (
                  <Text style={styles.avatarText}>{profileInitial || 'A'}</Text>
                )}
              </View>

              <View>
                <Text style={styles.profileName}>Campus Explorer</Text>
                <Text style={styles.profileSub}>Level 3</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.topRightControls}>
              {/* Quick XP Balance Pill */}
              <TouchableOpacity
                onPress={() => handleTabPress('rewards')}
                {...({ onClick: () => handleTabPress('rewards') } as any)}
                style={styles.scoreTopPill}
                activeOpacity={0.7}
              >
                <Text style={styles.scoreTopPillText}>{(user.score ?? 550)} XP</Text>
              </TouchableOpacity>

              {/* Notification Quick Bell */}
              <TouchableOpacity
                onPress={() => handleTabPress('notifications')}
                {...({ onClick: () => handleTabPress('notifications') } as any)}
                style={styles.headerIconBtn}
                activeOpacity={0.7}
              >
                <Bell size={17} color="#fbbf24" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* ACTIVE SCREEN STAGE                                      */}
        {/* ======================================================== */}
        <View style={styles.contentStage}>
          {/* Sub-view: Active Live Game Dashboard */}
          {inGameMode && selectedEvent ? (
            <GameDashboardScreen
              event={selectedEvent}
              user={user}
              onBackToEvents={() => setInGameMode(false)}
              onCompleteHunt={handleCompleteHunt}
              onUpdateUser={onUpdateUser}
              onEliminate={handlePlayerEliminated}
            />
          ) : viewingDetails && selectedEvent ? (
            /* Sub-view: Event Details Screen */
            <EventDetailsPage
              event={selectedEvent}
              isJoined={Boolean(selectedEvent?.id && joinedEventIds.includes(selectedEvent.id))}
              isEliminated={Boolean(selectedEvent?.id && eliminatedEventIds.includes(selectedEvent.id))}
              onBack={() => setViewingDetails(false)}
              onUnregisterEvent={handleUnregisterEvent}
              onLaunchGame={handleLaunchGame}
              onRequestRegistration={handleRequestRegistration}
              onGoToMyEvents={() => {
                setViewingDetails(false);
                setActiveTab('my-events');
              }}
            />
          ) : viewingPostEvent && selectedEvent ? (
            /* Sub-view: Post-Event Screen */
            <PostEventScreen
              event={selectedEvent}
              user={user}
              leaderboard={leaderboard}
              finalScore={finalScore}
              onGoToHome={() => {
                setViewingPostEvent(false);
                setActiveTab('home');
              }}
              onGoToMyEvents={() => {
                setViewingPostEvent(false);
                setActiveTab('my-events');
              }}
            />
          ) : (
            /* 6 Primary Bottom Bar Tab Screens */
            <>
              {/* 1. Home — Events / Home Screen */}
              {/* 1. Home — Campus Quest Cathedral Arch Dashboard */}
              {activeTab === 'home' && (
                <PlayerHomeDashboard
                  user={user}
                  events={events}
                  joinedEventIds={joinedEventIds}
                  eliminatedEventIds={eliminatedEventIds}
                  activeEvent={selectedEvent}
                  registrationRequest={registrationRequest}
                  onRegistrationRequestHandled={() => setRegistrationRequest(null)}
                  onSelectEvent={handleOpenEventDetails}
                  onLaunchGame={handleLaunchGame}
                  onJoinEvent={(evt, code) => handleJoinEvent(evt)}
                  onGoToMyEvents={() => setActiveTab('my-events')}
                  onGoToRankings={() => setActiveTab('leaderboard')}
                  onGoToRewards={() => setActiveTab('rewards')}
                  onUpdateUser={onUpdateUser}
                  onUpdateEvent={onUpdateEvent}
                />
              )}

              {/* 2. My Events — Joined events list */}
              {activeTab === 'my-events' && (
                <MyEventsScreen
                  user={user}
                  events={events}
                  joinedEventIds={joinedEventIds}
                  eliminatedEventIds={eliminatedEventIds}
                  onOpenGame={handleLaunchGame}
                  onOpenPostEvent={(evt) => {
                    setSelectedEvent(evt);
                    setViewingPostEvent(true);
                  }}
                  onOpenEventDetails={handleOpenEventDetails}
                  onBrowseEvents={() => setActiveTab('home')}
                />
              )}

              {/* 3. Leaderboard — Rankings screen & podium */}
              {activeTab === 'leaderboard' && (
                <LeaderboardScreen
                  user={user}
                  leaderboard={leaderboard}
                  activeEvent={selectedEvent}
                  onLaunchGame={() => {
                    if (selectedEvent) handleLaunchGame(selectedEvent);
                  }}
                />
              )}

              {/* 4. Notifications — Alerts list with unread red dot/badge */}
              {activeTab === 'notifications' && (
                <NotificationsScreen
                  onNavigateToScreen={(target) => {
                    setActiveTab(target);
                    if (target === 'game' && selectedEvent) {
                      setInGameMode(true);
                    }
                  }}
                  onUnreadCountChange={setUnreadCount}
                />
              )}

              {/* 5. Rewards — Scratch cards, badges & bonus history */}
              {activeTab === 'rewards' && (
                <RewardsScreen
                  user={user}
                  onUpdateUser={onUpdateUser}
                />
              )}

              {/* 6. Profile/Settings — Profile edit, password change, logout, feedback */}
              {activeTab === 'profile' && (
                <ProfileSettingsScreen
                  user={user}
                  onOpenProfileModal={() => setShowProfileModal(true)}
                  onOpenChangePasswordModal={() => setShowChangePasswordModal(true)}
                  onOpenAvatarPicker={() => setShowAvatarPicker(true)}
                  onLogout={onLogout}
                  onUpdateUser={onUpdateUser}
                  onNavigateToTab={(tab) => handleTabPress(tab as any)}
                  joinedHuntsCount={joinedEventIds.length}
                />
              )}
            </>
          )}
        </View>

        {/* ======================================================== */}
        {/* BOTTOM NAVIGATION BAR (6 Modules)                        */}
        {/* 1. Home (house)                                          */}
        {/* 2. My Events (ticket)                                    */}
        {/* 3. Leaderboard (trophy)                                  */}
        {/* 4. Notifications (bell with red dot/badge)               */}
        {/* 5. Rewards (gift)                                        */}
        {/* 6. Profile/Settings (person)                             */}
        {/* ======================================================== */}
        {/* BOTTOM NAVIGATION BAR (6 Modules)                        */}
        {/* 1. Home (house)                                          */}
        {/* 2. My Events (ticket)                                    */}
        {/* 3. Leaderboard (trophy)                                  */}
        {/* 4. Notifications (bell with red dot/badge)               */}
        {/* 5. Rewards (gift)                                        */}
        {/* 6. Profile/Settings (person)                             */}
        {/* ======================================================== */}
        <View style={[styles.bottomNavContainer, { backgroundColor: '#0a0f26', borderTopWidth: 1.5, borderTopColor: 'rgba(251, 191, 36, 0.5)' }]}>
          {/* Home */}
          <TouchableOpacity
            onPress={() => handleTabPress('home')}
            {...({ onClick: () => handleTabPress('home') } as any)}
            style={[styles.bottomNavTab, activeTab === 'home' && !inGameMode && !viewingDetails && !viewingPostEvent && styles.bottomNavTabActive]}
            activeOpacity={0.7}
          >
            <Home
              size={18}
              color={activeTab === 'home' && !inGameMode && !viewingDetails && !viewingPostEvent ? '#fbbf24' : '#c9b98a'}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                { fontFamily: 'Cinzel, serif', fontSize: 9 },
                activeTab === 'home' && !inGameMode && !viewingDetails && !viewingPostEvent && styles.bottomNavLabelActive,
              ]}
              numberOfLines={1}
            >
              Home
            </Text>
          </TouchableOpacity>

          {/* My Events */}
          <TouchableOpacity
            onPress={() => handleTabPress('my-events')}
            {...({ onClick: () => handleTabPress('my-events') } as any)}
            style={[styles.bottomNavTab, activeTab === 'my-events' && styles.bottomNavTabActive]}
            activeOpacity={0.7}
          >
            <Ticket
              size={18}
              color={activeTab === 'my-events' ? '#fbbf24' : '#c9b98a'}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                { fontFamily: 'Cinzel, serif', fontSize: 9 },
                activeTab === 'my-events' && styles.bottomNavLabelActive,
              ]}
              numberOfLines={1}
            >
              My Events
            </Text>
          </TouchableOpacity>

          {/* Leaderboard */}
          <TouchableOpacity
            onPress={() => handleTabPress('leaderboard')}
            {...({ onClick: () => handleTabPress('leaderboard') } as any)}
            style={[styles.bottomNavTab, activeTab === 'leaderboard' && styles.bottomNavTabActive]}
            activeOpacity={0.7}
          >
            <Trophy
              size={18}
              color={activeTab === 'leaderboard' ? '#fbbf24' : '#c9b98a'}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                { fontFamily: 'Cinzel, serif', fontSize: 9 },
                activeTab === 'leaderboard' && styles.bottomNavLabelActive,
              ]}
              numberOfLines={1}
            >
              Rankings
            </Text>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            onPress={() => handleTabPress('notifications')}
            {...({ onClick: () => handleTabPress('notifications') } as any)}
            style={[styles.bottomNavTab, activeTab === 'notifications' && styles.bottomNavTabActive]}
            activeOpacity={0.7}
          >
            <View style={styles.navIconBox}>
              <Bell
                size={18}
                color={activeTab === 'notifications' ? '#fbbf24' : '#c9b98a'}
              />
              {unreadCount > 0 && (
                <View style={styles.notifBadgePill}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                { fontFamily: 'Cinzel, serif', fontSize: 9 },
                activeTab === 'notifications' && styles.bottomNavLabelActive,
              ]}
              numberOfLines={1}
            >
              Alerts
            </Text>
          </TouchableOpacity>

          {/* Rewards */}
          <TouchableOpacity
            onPress={() => handleTabPress('rewards')}
            {...({ onClick: () => handleTabPress('rewards') } as any)}
            style={[styles.bottomNavTab, activeTab === 'rewards' && styles.bottomNavTabActive]}
            activeOpacity={0.7}
          >
            <Gift
              size={18}
              color={activeTab === 'rewards' ? '#fbbf24' : '#c9b98a'}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                { fontFamily: 'Cinzel, serif', fontSize: 9 },
                activeTab === 'rewards' && styles.bottomNavLabelActive,
              ]}
              numberOfLines={1}
            >
              Rewards
            </Text>
          </TouchableOpacity>

          {/* Profile/Settings */}
          <TouchableOpacity
            onPress={() => handleTabPress('profile')}
            {...({ onClick: () => handleTabPress('profile') } as any)}
            style={[styles.bottomNavTab, activeTab === 'profile' && styles.bottomNavTabActive]}
            activeOpacity={0.7}
          >
            <User
              size={18}
              color={activeTab === 'profile' ? '#fbbf24' : '#c9b98a'}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                { fontFamily: 'Cinzel, serif', fontSize: 9 },
                activeTab === 'profile' && styles.bottomNavLabelActive,
              ]}
              numberOfLines={1}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* REUSABLE MODALS                                          */}
        {/* ======================================================== */}
        {showProfileModal && (
          <OrganizerProfileModal
            visible={showProfileModal}
            user={user}
            onClose={() => setShowProfileModal(false)}
            onOpenAvatarPicker={() => setShowAvatarPicker(true)}
            onOpenChangePassword={() => setShowChangePasswordModal(true)}
            onUpdateUser={onUpdateUser}
          />
        )}

        {showSettingsModal && (
          <SettingsModal
            visible={showSettingsModal}
            user={user}
            onClose={() => setShowSettingsModal(false)}
            onUpdateUser={onUpdateUser}
            onDeleteAccount={onDeleteAccount}
          />
        )}

        {showAvatarPicker && (
          <AvatarPickerModal
            visible={showAvatarPicker}
            currentAvatarUrl={user.avatarUrl}
            onSelectAvatar={handleSelectAvatar}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}

        {showChangePasswordModal && (
          <ChangePasswordModal
            visible={showChangePasswordModal}
            user={user}
            onClose={() => setShowChangePasswordModal(false)}
          />
        )}

        {/* ======================================================== */}
        {/* LIVE ORGANIZER ANNOUNCEMENT POP-UP MODAL                */}
        {/* ======================================================== */}
        {activeAnnouncement && (
          <Modal
            visible={Boolean(activeAnnouncement)}
            transparent
            animationType="fade"
            onRequestClose={() => setActiveAnnouncement(null)}
          >
            <View style={styles.announcementOverlay}>
              <View style={styles.announcementCard}>
                {/* Header */}
                <View style={styles.announcementTopRow}>
                  <View style={styles.announcementHeaderLeft}>
                    <View style={styles.announcementIconPulse}>
                      <Bell size={18} color="#0f172a" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.announcementTag}>ORGANIZER BROADCAST</Text>
                      <Text style={styles.announcementEventName} numberOfLines={1}>
                        {activeAnnouncement.eventTitle}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveAnnouncement(null)}
                    style={styles.announcementCloseBtn}
                  >
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Body Box */}
                <View style={styles.announcementBodyBox}>
                  <Text style={styles.announcementTitleText}>
                    {activeAnnouncement.title}
                  </Text>
                  <Text style={styles.announcementMessageText}>
                    {activeAnnouncement.message}
                  </Text>
                </View>

                {/* Meta details */}
                <View style={styles.announcementMetaRow}>
                  <Text style={styles.announcementMetaText}>
                    Broadcast at {activeAnnouncement.timestamp} by {activeAnnouncement.organizerName || 'Event Host'}
                  </Text>
                </View>

                {/* Got It Button */}
                <TouchableOpacity
                  onPress={() => setActiveAnnouncement(null)}
                  style={styles.announcementGotItBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.announcementGotItBtnText}>GOT IT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* STRICT FAIR PLAY & ANTI-CHEAT PRE-JOIN NOTICE MODAL */}
        {fairPlayEvent && (
          <FairPlayNoticeModal
            visible={!!fairPlayEvent}
            eventTitle={fairPlayEvent.title}
            onAccept={handleFairPlayAcceptedAndLaunch}
            onCancel={() => setFairPlayEvent(null)}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: '#040817',
    height: '100%',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#040817',
    position: 'relative',
    overflow: 'hidden',
  },
  /* Top Bar */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(4, 8, 23, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 20,
  },
  profileBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0 0 10px rgba(37, 99, 235, 0.4)',
  },
  avatarImgSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.2,
    fontFamily: 'Cinzel, serif',
  },
  profileSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#c9b98a',
    marginTop: 1,
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 14, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  scoreTopPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
    fontFamily: 'Cinzel, serif',
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(8, 14, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#f43f5e',
  },

  /* Stage Container */
  contentStage: {
    flex: 1,
    zIndex: 10,
    backgroundColor: 'transparent',
  },

  /* Bottom Navigation Bar */
  bottomNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(4, 8, 23, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 30,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: 8,
    gap: 2,
  },
  bottomNavTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  navIconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgePill: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#e11d48',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  bottomNavLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#c9b98a',
    fontFamily: 'Cinzel, serif',
  },
  bottomNavLabelActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },

  /* Live Announcement Pop-up Modal */
  announcementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  announcementCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0c152c',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 18,
    gap: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
  },
  announcementTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  announcementHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  announcementIconPulse: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  announcementTag: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  announcementEventName: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  announcementCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementBodyBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 14,
    gap: 6,
  },
  announcementTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fef08a',
    letterSpacing: 0.2,
  },
  announcementMessageText: {
    fontSize: 13,
    color: '#f1f5f9',
    lineHeight: 18,
  },
  announcementMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  announcementMetaText: {
    fontSize: 10.5,
    color: '#64748b',
    fontStyle: 'italic',
  },
  announcementGotItBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  announcementGotItBtnText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 13,
    fontWeight: '900',
    color: '#070f22',
    letterSpacing: 1,
  },
});
