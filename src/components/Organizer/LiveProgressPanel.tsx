import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import {
  Radio,
  ChevronDown,
  X,
  Send,
  Bell,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react-native';
import { TreasureEvent } from '../../types';
import {
  TeamLiveProgress,
  getEventTeamsProgress,
  saveEventTeamsProgress,
} from '../../utils/huntProgressTracker';
import { playSuccessSound } from '../../utils/audioEffects';
import { broadcastAnnouncement, EventAnnouncement } from '../../utils/announcementManager';

interface LiveProgressPanelProps {
  events: TreasureEvent[];
  selectedEventId?: string;
  onSelectEvent?: (event: TreasureEvent) => void;
  onClose?: () => void;
  isModal?: boolean;
}

interface SoloLeaderboardEntry {
  id: string;
  name: string;
  initial: string;
  avatarColor: string;
  avatarBg: string;
  score: number;
  solvedCount: number;
  isFinished: boolean;
}

export const LiveProgressPanel: React.FC<LiveProgressPanelProps> = ({
  events = [],
  selectedEventId,
  onSelectEvent,
  onClose,
  isModal = false,
}) => {
  // Available events
  const validEvents = useMemo(
    () => events.filter((e) => Boolean(e && e.id)),
    [events]
  );

  // Active event selection
  const [currentEventId, setCurrentEventId] = useState<string>(() => {
    if (selectedEventId && validEvents.some((e) => e.id === selectedEventId)) {
      return selectedEventId;
    }
    return validEvents[0]?.id || '';
  });

  useEffect(() => {
    if (selectedEventId && validEvents.some((e) => e.id === selectedEventId)) {
      setCurrentEventId(selectedEventId);
    } else if (!currentEventId && validEvents.length > 0) {
      setCurrentEventId(validEvents[0].id);
    }
  }, [selectedEventId, validEvents, currentEventId]);

  const activeEvent = useMemo(
    () => validEvents.find((e) => e.id === currentEventId) || validEvents[0] || null,
    [validEvents, currentEventId]
  );

  // Detect if event is team hunt or solo
  const isTeamEvent = useMemo(() => {
    if (!activeEvent) return false;
    return (
      activeEvent.eventType === 'Team Hunt' ||
      activeEvent.eventType?.toLowerCase().trim() === 'team hunt' ||
      activeEvent.mode === 'team' ||
      activeEvent.title?.toLowerCase().includes('team only') ||
      activeEvent.title?.toLowerCase().includes('team hunt')
    );
  }, [activeEvent]);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Announcement Modal State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'urgent'>('normal');
  const [announcementSentToast, setAnnouncementSentToast] = useState(false);

  // Progress teams state
  const [teams, setTeams] = useState<TeamLiveProgress[]>([]);

  const refreshData = useCallback(() => {
    if (!activeEvent) return;
    const progress = getEventTeamsProgress(activeEvent);
    setTeams(progress);
  }, [activeEvent]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Total clues for current event
  const totalCluesCount = useMemo(() => {
    if (activeEvent?.clues && activeEvent.clues.length > 0) {
      return activeEvent.clues.length;
    }
    return isTeamEvent ? 3 : 4;
  }, [activeEvent, isTeamEvent]);

  // Solo participants list (matching reference screenshot for Solo events)
  const soloLeaderboard: SoloLeaderboardEntry[] = useMemo(() => {
    if (isTeamEvent) return [];

    const avatars = [
      { color: '#f59e0b', bg: '#451a03' }, // Crimson / maroon
      { color: '#fbbf24', bg: '#3b2406' }, // Amber / brown
      { color: '#eab308', bg: '#2f2004' }, // Gold / dark
      { color: '#38bdf8', bg: '#082f49' }, // Cyan / dark
      { color: '#34d399', bg: '#064e3b' }, // Emerald / dark
      { color: '#a855f7', bg: '#3b0764' }, // Purple / dark
    ];

    const baseSolo = [
      { id: 'solo-1', name: 'Alex Rivera', score: 520, solvedCount: totalCluesCount, isFinished: true },
      { id: 'solo-2', name: 'Priya Sharma', score: 410, solvedCount: Math.max(1, totalCluesCount - 1), isFinished: false },
      { id: 'solo-3', name: 'Marcus Vance', score: 380, solvedCount: Math.max(1, totalCluesCount - 1), isFinished: false },
      { id: 'solo-4', name: 'Rohan Verma', score: 320, solvedCount: Math.max(1, totalCluesCount - 2), isFinished: false },
      { id: 'solo-5', name: 'Emily Davis', score: 260, solvedCount: 1, isFinished: false },
      { id: 'solo-6', name: 'Samantha Rao', score: 190, solvedCount: 1, isFinished: false },
    ];

    return baseSolo.map((item, idx) => {
      const palette = avatars[idx % avatars.length];
      const initial = item.name.charAt(0).toUpperCase();
      return {
        ...item,
        initial,
        avatarColor: palette.color,
        avatarBg: palette.bg,
      };
    });
  }, [isTeamEvent, totalCluesCount]);

  // Team standings list (matching reference screenshot for Teams)
  const teamStandings = useMemo(() => {
    if (!isTeamEvent) return [];

    const defaultTeams = [
      { id: 'tm-1', name: 'Cipher Squad', score: 450, solvedCount: totalCluesCount, isFinished: true },
      { id: 'tm-2', name: 'Quantum Questers', score: 420, solvedCount: totalCluesCount, isFinished: true },
      { id: 'tm-3', name: 'Belltower Bandits', score: 300, solvedCount: Math.max(1, totalCluesCount - 1), isFinished: false },
      { id: 'tm-4', name: 'Shadow Seekers', score: 240, solvedCount: Math.max(1, totalCluesCount - 2), isFinished: false },
      { id: 'tm-5', name: 'Pixel Pioneers', score: 180, solvedCount: 1, isFinished: false },
    ];

    if (teams.length > 0) {
      return teams.map((t) => ({
        id: t.teamId,
        name: t.teamName,
        score: t.score || 0,
        solvedCount: Math.min(totalCluesCount, t.solvedClues.length),
        isFinished: t.solvedClues.length >= totalCluesCount || t.status === 'completed',
      }));
    }

    return defaultTeams;
  }, [isTeamEvent, teams, totalCluesCount]);

  // Top metric numbers
  const totalParticipantsCount = isTeamEvent ? teamStandings.length : soloLeaderboard.length;
  const totalCluesUnlocked = useMemo(() => {
    if (isTeamEvent) {
      return teamStandings.reduce((sum, t) => sum + t.solvedCount, 0);
    }
    return soloLeaderboard.reduce((sum, p) => sum + p.solvedCount, 0);
  }, [isTeamEvent, teamStandings, soloLeaderboard]);

  const topScore = useMemo(() => {
    if (isTeamEvent) {
      return teamStandings[0]?.score || 450;
    }
    return soloLeaderboard[0]?.score || 520;
  }, [isTeamEvent, teamStandings, soloLeaderboard]);

  // Broadcast announcement action
  const handleSendAnnouncement = () => {
    if (!announcementMsg.trim() || !activeEvent) return;

    broadcastAnnouncement({
      eventId: activeEvent.id,
      eventTitle: activeEvent.title,
      title: announcementTitle.trim() || 'Organizer Announcement',
      message: announcementMsg.trim(),
      priority: announcementPriority,
      organizerName: activeEvent.organizerName || 'Event Master',
    });

    playSuccessSound();
    setAnnouncementSentToast(true);
    setAnnouncementTitle('');
    setAnnouncementMsg('');
    setShowAnnouncementModal(false);
    setTimeout(() => setAnnouncementSentToast(false), 3000);
  };

  if (!activeEvent) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Events Available</Text>
      </View>
    );
  }

  const difficultyText = activeEvent.difficulty || (isTeamEvent ? 'Hard' : 'Medium');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 1. TOP HEADER: QUEST LEDGER */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={styles.questLedgerTitle}>QUEST LEDGER</Text>
          <Text style={styles.questLedgerSubtitle}>
            {isTeamEvent ? 'Organizer view' : 'Solo events'}
          </Text>
        </View>

        {/* Live indicator badge */}
        <View style={styles.liveIndicatorBadge}>
          <View style={styles.liveGreenDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* 2. EVENT SELECTOR BUTTON (DASHED BORDER PILL) */}
      <View style={styles.dropdownWrap}>
        <TouchableOpacity
          onPress={() => setIsDropdownOpen((prev) => !prev)}
          style={styles.dropdownBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownBtnText} numberOfLines={1}>
            {activeEvent.title}
          </Text>
          <ChevronDown size={18} color="#f59e0b" />
        </TouchableOpacity>

        {/* Dropdown Options */}
        {isDropdownOpen && validEvents.length > 1 && (
          <View style={styles.dropdownList}>
            {validEvents.map((evt) => {
              const isSelected = evt.id === activeEvent.id;
              return (
                <TouchableOpacity
                  key={evt.id}
                  onPress={() => {
                    setCurrentEventId(evt.id);
                    if (onSelectEvent) onSelectEvent(evt);
                    setIsDropdownOpen(false);
                  }}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                >
                  <Text style={[styles.dropdownItemTitle, isSelected && styles.dropdownItemTitleActive]}>
                    {evt.title}
                  </Text>
                  <Text style={styles.dropdownItemSub}>
                    {evt.eventType || 'Quest'} · {evt.difficulty || 'Normal'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. EVENT MAIN TITLE BANNER */}
      <View style={styles.titleSection}>
        <Text style={styles.mainEventTitle}>{activeEvent.title.toUpperCase()}</Text>
        <Text style={styles.mainEventSubtitle}>
          {totalCluesCount} clues · {difficultyText} {!isTeamEvent ? '· Solo' : ''}
        </Text>
      </View>

      {/* 4. 3-COLUMN STATS BAR */}
      <View style={styles.statsStrip}>
        {/* Col 1: Players / Teams */}
        <View style={styles.statCol}>
          <Text style={styles.statBigNumber}>{totalParticipantsCount}</Text>
          <Text style={styles.statLabel}>{isTeamEvent ? 'Teams' : 'Players'}</Text>
        </View>

        {/* Col 2: Clues unlocked */}
        <View style={styles.statCol}>
          <Text style={styles.statBigNumber}>{totalCluesUnlocked}</Text>
          <Text style={styles.statLabel}>Clues unlocked</Text>
        </View>

        {/* Col 3: Top score */}
        <View style={[styles.statCol, { borderRightWidth: 0 }]}>
          <Text style={styles.statBigNumber}>{topScore}</Text>
          <Text style={styles.statLabel}>Top score</Text>
        </View>
      </View>

      {/* 5. POST AN ANNOUNCEMENT BUTTON */}
      <TouchableOpacity
        onPress={() => setShowAnnouncementModal(true)}
        style={styles.announcementBtn}
        activeOpacity={0.85}
      >
        <Text style={styles.announcementBtnText}>POST AN ANNOUNCEMENT</Text>
      </TouchableOpacity>

      {/* Toast feedback when announcement is broadcast */}
      {announcementSentToast && (
        <View style={styles.toastBanner}>
          <Check size={14} color="#10b981" />
          <Text style={styles.toastBannerText}>Announcement broadcast live to all players!</Text>
        </View>
      )}

      {/* 6. LEADERBOARD (FOR SOLO) / STANDINGS (FOR TEAMS) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>
          {isTeamEvent ? 'STANDINGS' : 'LEADERBOARD'}
        </Text>
      </View>

      <View style={styles.rowsContainer}>
        {!isTeamEvent ? (
          /* ======================================================== */
          /* SOLO LEADERBOARD LIST (MATCHING REFERENCE IMAGE 1)        */
          /* ======================================================== */
          soloLeaderboard.map((player, index) => (
            <View key={player.id || index} style={styles.leaderRow}>
              {/* Rank Number */}
              <Text style={[styles.rankText, index === 0 ? styles.rankGold : styles.rankSilver]}>
                {index + 1}
              </Text>

              {/* Avatar Circle with initial and dotted ring border */}
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: player.avatarBg,
                    borderColor: player.avatarColor,
                  },
                ]}
              >
                <Text style={styles.avatarInitialText}>{player.initial}</Text>
              </View>

              {/* Center Details: Name + Segmented Clue Progress + Status */}
              <View style={styles.centerDetailsCol}>
                <Text style={styles.rowNameText}>{player.name}</Text>

                {/* Segmented Clue Progress Bar */}
                <View style={styles.segmentedProgressBar}>
                  {Array.from({ length: totalCluesCount }).map((_, cIdx) => (
                    <View
                      key={cIdx}
                      style={[
                        styles.segmentPill,
                        cIdx < player.solvedCount ? styles.segmentFilled : styles.segmentEmpty,
                      ]}
                    />
                  ))}
                </View>

                {/* Subtext (Finished or "X of Y clues unlocked") */}
                <Text
                  style={[
                    styles.statusSubtext,
                    player.isFinished ? styles.statusFinishedText : styles.statusUnfinishedText,
                  ]}
                >
                  {player.isFinished
                    ? 'Finished'
                    : `${player.solvedCount} of ${totalCluesCount} clues unlocked`}
                </Text>
              </View>

              {/* Right Score */}
              <View style={styles.scoreCol}>
                <Text style={styles.scoreNumberText}>{player.score}</Text>
                <Text style={styles.scoreXpLabel}>XP</Text>
              </View>
            </View>
          ))
        ) : (
          /* ======================================================== */
          /* TEAM STANDINGS LIST (MATCHING REFERENCE IMAGE 2)          */
          /* ======================================================== */
          teamStandings.map((team, index) => (
            <View key={team.id || index} style={styles.leaderRow}>
              {/* Rank Number */}
              <Text style={[styles.rankText, index === 0 ? styles.rankGold : styles.rankSilver]}>
                {index + 1}
              </Text>

              {/* NO avatar circle for teams - team name directly! */}
              <View style={styles.centerDetailsCol}>
                <Text style={styles.rowNameText}>{team.name}</Text>

                {/* Segmented Clue Progress Bar */}
                <View style={styles.segmentedProgressBar}>
                  {Array.from({ length: totalCluesCount }).map((_, cIdx) => (
                    <View
                      key={cIdx}
                      style={[
                        styles.segmentPill,
                        cIdx < team.solvedCount ? styles.segmentFilled : styles.segmentEmpty,
                      ]}
                    />
                  ))}
                </View>

                {/* Subtext ("X of Y clues unlocked") */}
                <Text
                  style={[
                    styles.statusSubtext,
                    team.isFinished ? styles.statusFinishedText : styles.statusUnfinishedText,
                  ]}
                >
                  {team.isFinished
                    ? `${totalCluesCount} of ${totalCluesCount} clues unlocked`
                    : `${team.solvedCount} of ${totalCluesCount} clues unlocked`}
                </Text>
              </View>

              {/* Right Score */}
              <View style={styles.scoreCol}>
                <Text style={styles.scoreNumberText}>{team.score}</Text>
                <Text style={styles.scoreXpLabel}>XP</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ======================================================== */}
      {/* ANNOUNCEMENT BROADCAST MODAL                             */}
      {/* ======================================================== */}
      <Modal
        visible={showAnnouncementModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnnouncementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Bell size={20} color="#f59e0b" />
                <Text style={styles.modalHeaderTitle}>POST AN ANNOUNCEMENT</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAnnouncementModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalEventNotice}>
              Broadcasting live to all players in: <Text style={{ color: '#fef08a', fontWeight: '800' }}>{activeEvent.title}</Text>
            </Text>

            <View style={styles.modalBody}>
              <Text style={styles.modalInputLabel}>Announcement Title / Headline</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. Hint 2 Released! Or 10 Minutes Remaining!"
                placeholderTextColor="#64748b"
                value={announcementTitle}
                onChangeText={setAnnouncementTitle}
              />

              <Text style={[styles.modalInputLabel, { marginTop: 12 }]}>Broadcast Message</Text>
              <TextInput
                style={[styles.modalTextInput, styles.modalTextArea]}
                placeholder="Write your announcement to all active players..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                value={announcementMsg}
                onChangeText={setAnnouncementMsg}
              />

              <View style={styles.prioritySelectorRow}>
                <TouchableOpacity
                  onPress={() => setAnnouncementPriority('normal')}
                  style={[
                    styles.priorityPill,
                    announcementPriority === 'normal' && styles.priorityPillActive,
                  ]}
                >
                  <Text style={[styles.priorityText, announcementPriority === 'normal' && styles.priorityTextActive]}>
                    Standard Notification
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAnnouncementPriority('urgent')}
                  style={[
                    styles.priorityPill,
                    announcementPriority === 'urgent' && styles.priorityPillUrgent,
                  ]}
                >
                  <AlertTriangle size={12} color={announcementPriority === 'urgent' ? '#ef4444' : '#94a3b8'} />
                  <Text style={[styles.priorityText, announcementPriority === 'urgent' && styles.priorityTextUrgent]}>
                    Urgent Pop-up
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSendAnnouncement}
                style={[
                  styles.modalSendBtn,
                  !announcementMsg.trim() && { opacity: 0.5 },
                ]}
                disabled={!announcementMsg.trim()}
              >
                <Send size={15} color="#0f172a" />
                <Text style={styles.modalSendBtnText}>BROADCAST TO PLAYERS NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070e20',
  },
  modalContainer: {
    borderRadius: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },

  /* 1. Header */
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  questLedgerTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 20,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 1.2,
  },
  questLedgerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },

  /* 2. Dropdown Selector */
  dropdownWrap: {
    position: 'relative',
    marginBottom: 20,
    zIndex: 50,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#fef08a',
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#0c152c',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  dropdownItemTitleActive: {
    color: '#fde047',
    fontWeight: '900',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },

  /* 3. Event Title Section */
  titleSection: {
    marginBottom: 18,
  },
  mainEventTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
    lineHeight: 28,
  },
  mainEventSubtitle: {
    fontSize: 12.5,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },

  /* 4. 3-Column Stats Bar */
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    marginBottom: 18,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBigNumber: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 24,
    fontWeight: '900',
    color: '#fde047',
  },
  statLabel: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '500',
  },

  /* 5. Post Announcement Button */
  announcementBtn: {
    backgroundColor: '#b45309',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
  },
  announcementBtnText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  toastBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#34d399',
  },

  /* 6. Leaderboard / Standings Section */
  sectionHeaderRow: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 14,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 1.2,
  },
  rowsContainer: {
    gap: 12,
  },

  /* Leaderboard Row (Solo and Team) */
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  rankText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 18,
    fontWeight: '900',
    width: 24,
    textAlign: 'center',
  },
  rankGold: {
    color: '#f59e0b',
  },
  rankSilver: {
    color: '#38bdf8',
  },

  /* Avatar Circle (Solo only) */
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fef08a',
  },

  /* Center Details */
  centerDetailsCol: {
    flex: 1,
    gap: 5,
  },
  rowNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  /* Segmented Clue Progress Bar */
  segmentedProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: '100%',
    maxWidth: 160,
  },
  segmentPill: {
    flex: 1,
    height: 5.5,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: '#f59e0b',
  },
  segmentEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  /* Subtext */
  statusSubtext: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusFinishedText: {
    color: '#fde047',
  },
  statusUnfinishedText: {
    color: '#94a3b8',
  },

  /* Right Score */
  scoreCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 50,
  },
  scoreNumberText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 18,
    fontWeight: '900',
    color: '#fde047',
  },
  scoreXpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },

  /* Announcement Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0c152c',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 16,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  modalEventNotice: {
    fontSize: 11.5,
    color: '#94a3b8',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 8,
    borderRadius: 8,
  },
  modalBody: {
    gap: 6,
  },
  modalInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  modalTextInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#ffffff',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  priorityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 7,
  },
  priorityPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  priorityPillUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  priorityTextActive: {
    color: '#fde047',
  },
  priorityTextUrgent: {
    color: '#ef4444',
  },
  modalSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  modalSendBtnText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
});
