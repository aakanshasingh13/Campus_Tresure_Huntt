import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Bell,
  KeyRound,
  Unlock,
  Trophy,
  Gift,
  Flame,
  Clock,
  ChevronRight,
  CheckCheck,
  Check,
  X,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
  Line,
} from 'react-native-svg';
import { playClickSound, playSuccessSound } from '../../utils/audioEffects';
import { updateMemberStatus } from '../../utils/teamManager';
import { addPlayerNotification } from '../../utils/notificationHelper';

export interface PlayerNotification {
  id: string;
  type:
    | 'pin'
    | 'clue'
    | 'rank'
    | 'reward'
    | 'schedule'
    | 'secret_mission'
    | 'team_join_request'
    | 'team_accepted'
    | 'team_payment_required';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionScreen?: 'home' | 'my-events' | 'game' | 'rewards' | 'leaderboard';
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
}

const INITIAL_NOTIFICATIONS: PlayerNotification[] = [
  {
    id: 'notif-team-req-demo',
    type: 'team_join_request',
    title: 'Squad Join Request: Member 1',
    message: 'Member 1 has requested to join your squad "Shadow Knights" for "The Great Belltower Mystery". As Team Leader, you can accept or decline their roster spot.',
    timestamp: 'Just now',
    read: false,
    actionScreen: 'home',
    teamCode: 'T7K2QX',
    memberId: 'mem-demo-1',
    memberName: 'Member 1',
    requiresLeaderAction: true,
    actionStatus: 'pending',
    fee: 199,
    eventVenue: 'Central University Grounds (Central Quad Archway 4)',
    eventDate: '2026-08-10',
    eventTime: '14:00',
    eventDuration: '2 Hours',
    eventPin: '849201',
  },
  {
    id: 'notif-team-pay-demo',
    type: 'team_payment_required',
    title: 'Team Admission Approved! Please Pay 🎉',
    message: 'Your Team Leader approved you as Member 2 in squad "Shadow Knights"! Please complete your entry payment of ₹199 to confirm your spot.',
    timestamp: '2m ago',
    read: false,
    actionScreen: 'home',
    teamCode: 'T7K2QX',
    memberId: 'mem-demo-2',
    memberName: 'Member 2',
    requiresMemberPayment: true,
    paymentStatus: 'pending',
    fee: 199,
    eventVenue: 'Central University Grounds (Central Quad Archway 4)',
    eventDate: '2026-08-10',
    eventTime: '14:00',
    eventDuration: '2 Hours',
    eventPin: '849201',
  },
  {
    id: 'notif-pin-1',
    type: 'pin',
    title: '6-Digit PIN: 849201',
    message: 'Your payment for “The Great Belltower Mystery” is confirmed! Access PIN: 849201. Enter this code once the organizer starts the hunt.',
    timestamp: '10m ago',
    read: false,
    actionScreen: 'home',
  },
  {
    id: 'notif-pin-2',
    type: 'pin',
    title: '6-Digit PIN: 517824',
    message: 'Your payment for “Metropolitan Heritage Run” is confirmed! Access PIN: 517824. Enter this code once the organizer starts the hunt.',
    timestamp: '1h ago',
    read: false,
    actionScreen: 'home',
  },
  {
    id: 'notif-clue-1',
    type: 'clue',
    title: 'Clue unlocked',
    message: 'You scanned QR 1 for “The Great Belltower Mystery”. Clue 2 is now open.',
    timestamp: '2h ago',
    read: true,
    actionScreen: 'game',
  },
  {
    id: 'notif-rank-1',
    type: 'rank',
    title: 'Rank update',
    message: 'You moved to #3 on the leaderboard.',
    timestamp: 'Yesterday',
    read: true,
    actionScreen: 'leaderboard',
  },
];

interface NotificationsScreenProps {
  onNavigateToScreen: (screen: 'home' | 'my-events' | 'game' | 'rewards' | 'leaderboard') => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigateToScreen,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<PlayerNotification[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('campus_player_notifs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_NOTIFICATIONS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Listen for real-time notification dispatches across the app
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setNotifications(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('campus_player_notifs');
          if (saved) {
            setNotifications(JSON.parse(saved));
          }
        } catch (err) {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campus_notifications_updated', handleUpdate);
      return () => {
        window.removeEventListener('campus_notifications_updated', handleUpdate);
      };
    }
  }, []);

  const saveNotifications = (newList: PlayerNotification[]) => {
    setNotifications(newList);
    if (onUnreadCountChange) {
      onUnreadCountChange(newList.filter((n) => !n.read).length);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('campus_player_notifs', JSON.stringify(newList));
      }
    } catch (e) {}
  };

  const handleMarkAllAsRead = () => {
    playSuccessSound();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleNotificationPress = (notif: PlayerNotification) => {
    if (!notif || !notif.id) return;
    playClickSound();

    // Mark as read
    const updated = notifications.map((n) => (n && n.id === notif.id ? { ...n, read: true } : n));
    saveNotifications(updated);

    if (notif.actionScreen) {
      onNavigateToScreen(notif.actionScreen);
    }
  };

  // Team Leader Accepts Candidate into Squad
  const handleAcceptMember = (e: any, item: PlayerNotification) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!item.teamCode || !item.memberId) return;

    playSuccessSound();
    updateMemberStatus(item.teamCode, item.memberId, 'accepted');

    const updated = notifications.map((n) =>
      n.id === item.id
        ? {
            ...n,
            actionStatus: 'accepted' as const,
            read: true,
            message: `✓ You ACCEPTED ${item.memberName || 'Member'} into "${item.teamCode}". Entry payment request (₹${item.fee || 199}) has been dispatched to their notification tab!`,
          }
        : n
    );
    saveNotifications(updated);

    // Member gets notification to pay entry fee before official briefing is unlocked
    addPlayerNotification({
      type: 'team_payment_required',
      title: `Team Admission Approved! Please Pay 🎉`,
      message: `Your Team Leader approved you as ${item.memberName || 'Member'} in squad "${item.teamCode}"! Please complete your registration payment of ₹${item.fee || 199} to confirm your spot.`,
      actionScreen: 'home',
      teamCode: item.teamCode,
      memberId: item.memberId,
      memberName: item.memberName,
      requiresMemberPayment: true,
      paymentStatus: 'pending',
      fee: item.fee || 199,
      eventVenue: item.eventVenue || 'Central University Grounds (Central Quad Archway 4)',
      eventDate: item.eventDate || '2026-08-10',
      eventTime: item.eventTime || '14:00',
      eventDuration: item.eventDuration || '2 Hours',
      eventPin: item.eventPin || '849201',
    });
  };

  // Teammate Pays for spot after Leader acceptance
  const handleMemberPay = (e: any, item: PlayerNotification) => {
    if (e && e.stopPropagation) e.stopPropagation();
    playSuccessSound();

    const updated = notifications.map((n) =>
      n.id === item.id
        ? {
            ...n,
            paymentStatus: 'paid' as const,
            read: true,
            message: `✓ Payment of ₹${item.fee || 199} confirmed! You are officially registered in squad "${item.teamCode}". See official event briefing below:`,
          }
        : n
    );
    saveNotifications(updated);

    // Member receives the confirmed briefing notification with Venue, Date, Time, Duration & PIN
    addPlayerNotification({
      type: 'pin',
      title: `Official Event Briefing: ${item.teamCode} 🎯`,
      message: `Spot confirmed! Payment of ₹${item.fee || 199} received for ${item.memberName || 'Member'}. Your registration is active. Review your event details below:`,
      actionScreen: 'my-events',
      eventVenue: item.eventVenue || 'Central University Grounds (Central Quad Archway 4)',
      eventDate: item.eventDate || '2026-08-10',
      eventTime: item.eventTime || '14:00',
      eventDuration: item.eventDuration || '2 Hours',
      eventPin: item.eventPin || '849201',
    });
  };

  // Team Leader Declines Candidate
  const handleDeclineMember = (e: any, item: PlayerNotification) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!item.teamCode || !item.memberId) return;

    playClickSound();
    updateMemberStatus(item.teamCode, item.memberId, 'declined');

    const updated = notifications.map((n) =>
      n.id === item.id
        ? {
            ...n,
            actionStatus: 'declined' as const,
            read: true,
            message: `✕ You DECLINED the join request from ${item.memberName || 'Member'}.`,
          }
        : n
    );
    saveNotifications(updated);

    // Notify candidate
    addPlayerNotification({
      type: 'schedule',
      title: `Team Request Notice`,
      message: `Your request to join the squad was declined by the team leader. You can enter another team code or create your own squad!`,
      actionScreen: 'home',
    });
  };

  const getNotifIcon = (item: PlayerNotification) => {
    const isTeamJoin = item.type === 'team_join_request' || item.requiresLeaderAction;
    const isTeamAccepted = item.type === 'team_accepted';
    const isPin = item.type === 'pin' || item.title.includes('PIN');
    const isClue = item.type === 'clue' || item.title.toLowerCase().includes('clue');
    const isRank = item.type === 'rank' || item.title.toLowerCase().includes('rank');
    const isReward = item.type === 'reward';
    const isSecret = item.type === 'secret_mission';

    if (isTeamJoin) {
      return (
        <View style={[styles.iconBox, styles.iconBoxTeamReq]}>
          <Users size={20} color="#f5be38" />
        </View>
      );
    }

    if (isTeamAccepted) {
      return (
        <View style={[styles.iconBox, styles.iconBoxAccepted]}>
          <ShieldCheck size={20} color="#10b981" />
        </View>
      );
    }

    if (isPin) {
      return (
        <View style={[styles.iconBox, styles.iconBoxPin]}>
          <KeyRound size={20} color="#f59e0b" />
        </View>
      );
    }

    if (isClue) {
      return (
        <View style={[styles.iconBox, styles.iconBoxClue]}>
          <Unlock size={20} color="#34d399" />
        </View>
      );
    }

    if (isRank) {
      return (
        <View style={[styles.iconBox, styles.iconBoxRank]}>
          <Trophy size={19} color="#60a5fa" />
        </View>
      );
    }

    if (isReward) {
      return (
        <View style={[styles.iconBox, styles.iconBoxReward]}>
          <Gift size={20} color="#fbbf24" />
        </View>
      );
    }

    if (isSecret) {
      return (
        <View style={[styles.iconBox, styles.iconBoxSecret]}>
          <Flame size={20} color="#f43f5e" />
        </View>
      );
    }

    return (
      <View style={[styles.iconBox, styles.iconBoxSchedule]}>
        <Clock size={20} color="#94a3b8" />
      </View>
    );
  };

  const filteredNotifs =
    activeFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <View style={styles.screenContainer}>
      {/* ======================================================== */}
      {/* NOCTURNAL GOTHIC CAMPUS QUEST VECTOR BACKGROUND          */}
      {/* Same background as Campus Quest & Payment Screen         */}
      {/* ======================================================== */}
      <View style={styles.backgroundWrapper} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 420 900" preserveAspectRatio="none">
          <Defs>
            {/* Deep Midnight Obsidian Sky Gradient */}
            <LinearGradient id="notifSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#040817" />
              <Stop offset="25%" stopColor="#07122b" />
              <Stop offset="60%" stopColor="#0a1a38" />
              <Stop offset="85%" stopColor="#08142a" />
              <Stop offset="100%" stopColor="#03060f" />
            </LinearGradient>

            {/* Crescent Moon Halo */}
            <RadialGradient id="notifMoonHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
              <Stop offset="45%" stopColor="#fef9c3" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#0a1a38" stopOpacity={0} />
            </RadialGradient>

            {/* Vintage Street Lamp Amber Radial Flare */}
            <RadialGradient id="notifLampHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity={0.9} />
              <Stop offset="40%" stopColor="#f59e0b" stopOpacity={0.45} />
              <Stop offset="80%" stopColor="#d97706" stopOpacity={0.15} />
              <Stop offset="100%" stopColor="#040817" stopOpacity={0} />
            </RadialGradient>

            {/* Clock Face Warm Glow */}
            <RadialGradient id="notifClockHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
              <Stop offset="45%" stopColor="#fef08a" stopOpacity={0.8} />
              <Stop offset="85%" stopColor="#f59e0b" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#040817" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* 1. Midnight Sky */}
          <Rect width="420" height="900" fill="url(#notifSkyGrad)" />

          {/* 2. Top Corner Forest Green Curtains */}
          <Path d="M 0 0 L 130 0 C 130 50, 85 80, 0 80 Z" fill="#082b1d" />
          <Path d="M 0 0 L 110 0 C 110 42, 70 70, 0 70 Z" fill="#0f3c28" />
          <Path d="M 420 0 L 290 0 C 290 50, 335 80, 420 80 Z" fill="#082b1d" />
          <Path d="M 420 0 L 310 0 C 310 42, 350 70, 420 70 Z" fill="#0f3c28" />

          {/* 3. Celestial Crescent Moon in Top Right */}
          <G transform="translate(320, 45)">
            <Circle cx="24" cy="24" r="28" fill="url(#notifMoonHalo)" />
            <Path
              d="M 12 10 C 26 10 36 21 36 34 C 36 38 34 41 32 44 C 41 40 45 30 45 22 C 45 9 34 0 20 0 C 16 0 13 1 10 3 C 12 5 12 8 12 10 Z"
              fill="#fef08a"
            />
          </G>

          {/* 4. Twinkling Stars */}
          <G fill="#ffffff">
            <Circle cx="90" cy="110" r="1.4" opacity={0.85} />
            <Circle cx="160" cy="95" r="1.6" opacity={0.9} />
            <Circle cx="230" cy="130" r="1.2" opacity={0.8} />
            <Circle cx="280" cy="90" r="1.5" opacity={0.9} />
            <Circle cx="50" cy="180" r="1.3" opacity={0.75} />
            <Circle cx="370" cy="190" r="1.5" opacity={0.85} />
          </G>

          {/* 5. Collegiate Gothic Clocktower Silhouette at Bottom */}
          <G transform="translate(210, 680)">
            <Path d="M -40 220 L -40 90 L 0 45 L 40 90 L 40 220 Z" fill="#050c18" />
            <Polygon points="-120,220 -120,150 -75,115 -40,155 -40,220" fill="#071020" />
            <Polygon points="40,220 40,155 75,115 120,150 120,220" fill="#071020" />

            {/* Glowing Circular Clockface */}
            <Circle cx="0" cy="78" r="18" fill="url(#notifClockHalo)" />
            <Circle cx="0" cy="78" r="14" fill="#ffd54f" stroke="#ca8a04" strokeWidth={1.2} />
            <Circle cx="0" cy="78" r="2.8" fill="#78350f" />

            {/* Lit Tower Windows Below Clock */}
            <Rect x="-6" y="105" width="12" height="20" rx="2" fill="#ffd54f" stroke="#ca8a04" strokeWidth={0.8} />
            <Rect x="-6" y="136" width="12" height="20" rx="2" fill="#ffd54f" stroke="#ca8a04" strokeWidth={0.8} />

            {/* Wing Lit Windows */}
            <Rect x="-90" y="170" width="8" height="15" rx="1.5" fill="#ffd54f" opacity={0.9} />
            <Rect x="-65" y="170" width="8" height="15" rx="1.5" fill="#ffd54f" opacity={0.9} />
            <Rect x="65" y="170" width="8" height="15" rx="1.5" fill="#ffd54f" opacity={0.9} />
            <Rect x="90" y="170" width="8" height="15" rx="1.5" fill="#ffd54f" opacity={0.9} />
          </G>

          {/* 6. Glowing Vintage Street Lamp on Bottom-Left */}
          <G transform="translate(36, 700)">
            <Circle cx="10" cy="30" r="42" fill="url(#notifLampHalo)" />
            <Rect x="2" y="18" width="16" height="25" rx="5" fill="#fef08a" stroke="#ca8a04" strokeWidth={1.2} />
            <Rect x="5" y="21" width="10" height="19" rx="3" fill="#ffffff" opacity={0.75} />
            <Path d="M 0 18 C 0 12 20 12 20 18 Z" fill="#070f1e" />
            <Rect x="8" y="43" width="4" height="150" fill="#070f1e" />
          </G>
        </Svg>
      </View>

      {/* ======================================================== */}
      {/* SCROLLABLE FOREGROUND CONTENT                            */}
      {/* ======================================================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Double Gold-Border Header Card */}
        <View style={styles.headerDoubleBorder}>
          <View style={styles.headerInner}>
            <View style={styles.bellIconCircle}>
              <Bell size={22} color="#f5be38" strokeWidth={2.4} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>HUNT ALERTS & UPDATES</Text>
              <Text style={styles.headerSub}>
                Real-time clues, secret directives, rank changes and rewards
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Filter Tabs & Actions Row */}
        <View style={styles.filterRow}>
          <View style={styles.filterPillsGroup}>
            {/* All Alerts Pill */}
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              {...({ onClick: () => setActiveFilter('all') } as any)}
              style={[
                styles.filterPill,
                activeFilter === 'all' ? styles.filterPillActive : styles.filterPillInactive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'all' ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
                All Alerts ({notifications.length})
              </Text>
            </TouchableOpacity>

            {/* Unread Pill */}
            <TouchableOpacity
              onPress={() => setActiveFilter('unread')}
              {...({ onClick: () => setActiveFilter('unread') } as any)}
              style={[
                styles.filterPill,
                activeFilter === 'unread' ? styles.filterPillActive : styles.filterPillInactive,
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.unreadDot} />
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'unread' ? styles.filterPillTextActive : styles.filterPillTextInactive,
                ]}
              >
                Unread ({unreadCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              {...({ onClick: handleMarkAllAsRead } as any)}
              style={styles.markAllReadBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Notifications List */}
        {filteredNotifs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Bell size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>No unread alerts</Text>
            <Text style={styles.emptyDesc}>
              You are completely up to date on all clue updates and rewards.
            </Text>
          </View>
        ) : (
          <View style={styles.notifList}>
            {filteredNotifs.map((item) => {
              const isUnread = !item.read;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleNotificationPress(item)}
                  {...({ onClick: () => handleNotificationPress(item) } as any)}
                  style={[
                    styles.notifCard,
                    isUnread ? styles.notifCardUnread : styles.notifCardRead,
                  ]}
                  activeOpacity={0.85}
                >
                  {/* Left Column: Icon Box */}
                  <View style={styles.iconCol}>{getNotifIcon(item)}</View>

                  {/* Right Column: Title, Timestamp, Description, Leader Actions & Event Briefing */}
                  <View style={styles.contentCol}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardTimestamp}>{item.timestamp}</Text>
                    </View>

                    <Text style={styles.cardMessage}>{item.message}</Text>

                    {/* LEADER ACTION: ACCEPT OR DECLINE MEMBER REQUEST */}
                    {item.requiresLeaderAction && (
                      <View style={styles.leaderActionContainer}>
                        {item.actionStatus === 'accepted' ? (
                          <View style={styles.statusPillAccepted}>
                            <Check size={13} color="#10b981" />
                            <Text style={styles.statusPillTextAccepted}>
                              ✓ Member Accepted • Payment Request Dispatched
                            </Text>
                          </View>
                        ) : item.actionStatus === 'declined' ? (
                          <View style={styles.statusPillDeclined}>
                            <X size={13} color="#f87171" />
                            <Text style={styles.statusPillTextDeclined}>
                              ✕ Join Request Declined
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.leaderButtonsRow}>
                            <TouchableOpacity
                              onPress={(e) => handleAcceptMember(e, item)}
                              {...({ onClick: (e: any) => handleAcceptMember(e, item) } as any)}
                              style={styles.btnLeaderAccept}
                              activeOpacity={0.85}
                            >
                              <Check size={14} color="#052e16" strokeWidth={2.8} />
                              <Text style={styles.btnLeaderAcceptText}>ACCEPT MEMBER</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={(e) => handleDeclineMember(e, item)}
                              {...({ onClick: (e: any) => handleDeclineMember(e, item) } as any)}
                              style={styles.btnLeaderDecline}
                              activeOpacity={0.85}
                            >
                              <X size={14} color="#fca5a5" strokeWidth={2.4} />
                              <Text style={styles.btnLeaderDeclineText}>DECLINE</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {/* MEMBER PAYMENT ACTION: IF LEADER ACCEPTED, LET PLAYER PAY */}
                    {item.requiresMemberPayment && (
                      <View style={styles.leaderActionContainer}>
                        {item.paymentStatus === 'paid' ? (
                          <View style={styles.statusPillAccepted}>
                            <Check size={13} color="#10b981" />
                            <Text style={styles.statusPillTextAccepted}>
                              ✓ Payment of ₹{item.fee || 199} Confirmed • Spot Activated
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.paymentPromptBox}>
                            <View style={styles.paymentPromptHeader}>
                              <CreditCard size={13} color="#fbbf24" />
                              <Text style={styles.paymentPromptTitle}>
                                TEAM ENTRY FEE: ₹{item.fee || 199}
                              </Text>
                            </View>
                            <Text style={styles.paymentPromptDesc}>
                              The team leader has accepted you! Complete payment to receive your official event briefing (venue, date, time & access PIN).
                            </Text>
                            <TouchableOpacity
                              onPress={(e) => handleMemberPay(e, item)}
                              {...({ onClick: (e: any) => handleMemberPay(e, item) } as any)}
                              style={styles.btnMemberPay}
                              activeOpacity={0.85}
                            >
                              <CreditCard size={15} color="#0f172a" strokeWidth={2.4} />
                              <Text style={styles.btnMemberPayText}>
                                PAY ₹{item.fee || 199} & CONFIRM SPOT
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {/* EVENT BRIEFING WITH VENUE, TIME, DATE, DURATION & PIN (REVEALED ONCE PAID) */}
                    {item.eventVenue && (!item.requiresMemberPayment || item.paymentStatus === 'paid') && (
                      <View style={styles.eventBriefingBox}>
                        <View style={styles.briefingHeaderRow}>
                          <MapPin size={13} color="#f5be38" />
                          <Text style={styles.briefingHeaderTitle}>EVENT BRIEFING</Text>
                        </View>
                        
                        <View style={styles.briefingRow}>
                          <Text style={styles.briefingLabel}>Venue:</Text>
                          <Text style={styles.briefingValue}>{item.eventVenue}</Text>
                        </View>

                        <View style={styles.briefingGrid}>
                          <View style={styles.briefingGridItem}>
                            <Calendar size={11} color="#38bdf8" />
                            <Text style={styles.briefingGridText}>{item.eventDate || '2026-08-10'}</Text>
                          </View>
                          <View style={styles.briefingGridItem}>
                            <Clock size={11} color="#38bdf8" />
                            <Text style={styles.briefingGridText}>{item.eventTime || '14:00'}</Text>
                          </View>
                          <View style={styles.briefingGridItem}>
                            <Clock size={11} color="#fbbf24" />
                            <Text style={styles.briefingGridText}>{item.eventDuration || '2 Hours'}</Text>
                          </View>
                        </View>

                        {item.eventPin && (
                          <View style={styles.briefingPinRow}>
                            <Text style={styles.briefingPinLabel}>Access PIN:</Text>
                            <View style={styles.briefingPinBadge}>
                              <Text style={styles.briefingPinText}>{item.eventPin}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {!item.requiresLeaderAction && (
                      <View style={styles.actionPromptRow}>
                        <Text style={styles.actionPromptText}>Tap to view →</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backgroundWrapper: {
    display: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* Double Gold-Border Header Card */
  headerDoubleBorder: {
    borderWidth: 1.5,
    borderColor: '#d4af37',
    borderRadius: 18,
    padding: 2.5,
    backgroundColor: '#050c18',
    marginBottom: 16,
    boxShadow: '0 0 14px rgba(212, 175, 55, 0.25)',
  },
  headerInner: {
    borderWidth: 1.2,
    borderColor: '#a17a26',
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#07101f',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#081426',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 10px rgba(245, 190, 56, 0.25)',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#f6c449',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, "Times New Roman", serif',
    letterSpacing: 1,
    marginBottom: 3,
  },
  headerSub: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },

  /* Filter Tabs Row */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  filterPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#f59e0b',
  },
  filterPillInactive: {
    backgroundColor: '#0c1626',
    borderWidth: 1,
    borderColor: '#1e2f4c',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#0f172a',
  },
  filterPillTextInactive: {
    color: '#e2e8f0',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f43f5e',
    marginRight: 6,
  },
  markAllReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markAllReadText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'none',
  },

  /* Notifications List */
  notifList: {
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#091322',
  },
  notifCardUnread: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#1e2e4a',
    backgroundColor: '#0b172a',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },
  notifCardRead: {
    borderWidth: 1,
    borderColor: '#18263e',
    backgroundColor: '#081120',
  },
  iconCol: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#070f1c',
  },
  iconBoxPin: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  iconBoxClue: {
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  iconBoxRank: {
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  iconBoxReward: {
    borderWidth: 1.5,
    borderColor: '#fbbf24',
  },
  iconBoxSecret: {
    borderWidth: 1.5,
    borderColor: '#f43f5e',
  },
  iconBoxSchedule: {
    borderWidth: 1.5,
    borderColor: '#64748b',
  },
  iconBoxTeamReq: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    backgroundColor: '#1c1304',
  },
  iconBoxAccepted: {
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#041c11',
  },

  contentCol: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  cardTimestamp: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '500',
  },
  cardMessage: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: '400',
  },
  actionPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  actionPromptText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Leader Action Container */
  leaderActionContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  leaderButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnLeaderAccept: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
  },
  btnLeaderAcceptText: {
    color: '#041e10',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  btnLeaderDecline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3f131a',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnLeaderDeclineText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  statusPillTextAccepted: {
    color: '#34d399',
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusPillDeclined: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  statusPillTextDeclined: {
    color: '#f87171',
    fontSize: 11.5,
    fontWeight: '700',
  },
  paymentPromptBox: {
    backgroundColor: '#0c1a35',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
  },
  paymentPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  paymentPromptTitle: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  paymentPromptDesc: {
    color: '#cbd5e1',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  btnMemberPay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
  },
  btnMemberPayText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Event Briefing Card */
  eventBriefingBox: {
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: '#050c18',
    borderWidth: 1,
    borderColor: '#24344d',
    borderRadius: 10,
    padding: 10,
  },
  briefingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  briefingHeaderTitle: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  briefingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  briefingLabel: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  briefingValue: {
    color: '#f1f5f9',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  briefingGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  briefingGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  briefingGridText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  briefingPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1a273b',
  },
  briefingPinLabel: {
    color: '#fbbf24',
    fontSize: 11.5,
    fontWeight: '700',
  },
  briefingPinBadge: {
    backgroundColor: '#271c08',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  briefingPinText: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#091322',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 20,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
