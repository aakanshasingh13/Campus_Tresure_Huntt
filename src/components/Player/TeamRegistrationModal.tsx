import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  X,
  Users,
  Crown,
  Plus,
  Copy,
  Share2,
  Check,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle as SvgCircle,
  Path,
  G,
  Polygon,
} from 'react-native-svg';
import { TreasureEvent, UserProfile } from '../../types';
import {
  EventTeam,
  findTeamByCode,
  createNewTeam,
  addMemberToTeam,
  getStoredTeams,
} from '../../utils/teamManager';
import { addPlayerNotification } from '../../utils/notificationHelper';
import { playClickSound, playSuccessSound } from '../../utils/audioEffects';

interface TeamRegistrationModalProps {
  visible: boolean;
  event: TreasureEvent;
  user: UserProfile;
  initialMode?: 'create' | 'join';
  onClose: () => void;
  onSuccessRegister: (event: TreasureEvent, codeEntered: string) => void;
}

export const TeamRegistrationModal: React.FC<TeamRegistrationModalProps> = ({
  visible,
  event,
  user,
  initialMode = 'create',
  onClose,
  onSuccessRegister,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>(initialMode);

  // CREATE TEAM STATE
  const [teamName, setTeamName] = useState('Shadow Knights');
  const [generatedCode, setGeneratedCode] = useState('T7K2QX');
  const [codeCopied, setCodeCopied] = useState(false);
  const [showShareNotice, setShowShareNotice] = useState(false);

  // JOIN TEAM STATE
  const [codeDigits, setCodeDigits] = useState<string[]>(['T', '7', 'K', '2', 'Q', 'X']);
  const [foundTeam, setFoundTeam] = useState<EventTeam | null>(() => findTeamByCode('T7K2QX') || null);
  const [searchError, setSearchError] = useState('');
  const [joinSuccessNotice, setJoinSuccessNotice] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, visible]);

  if (!visible) return null;

  // Handle digit change for 6-letter team code input
  const handleDigitChange = (val: string, index: number) => {
    const cleaned = val.toUpperCase().slice(-1);
    const updated = [...codeDigits];
    updated[index] = cleaned;
    setCodeDigits(updated);
    setSearchError('');
  };

  const currentEnteredCode = codeDigits.join('');

  const handleFindTeam = () => {
    playClickSound();
    const team = findTeamByCode(currentEnteredCode);
    if (team) {
      setFoundTeam(team);
      setSearchError('');
      playSuccessSound();
    } else {
      setSearchError(`No team found with code "${currentEnteredCode}". Try demo code "T7K2QX".`);
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2200);
    }
  };

  const handleShareCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `Join my team "${teamName}" for ${event.title}! Enter Team Code: ${generatedCode} in Campus Quest.`
      );
    }
    setShowShareNotice(true);
    setTimeout(() => setShowShareNotice(false), 2500);
  };

  // Team Leader Register & Pay
  const handleLeaderRegisterAndPay = () => {
    playSuccessSound();
    const newTeam: EventTeam = {
      code: generatedCode,
      name: teamName.trim() || 'Campus Quest Squad',
      eventId: event.id,
      eventTitle: event.title,
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
      maxMembers: 4,
      fee: event.registrationFee || 199,
      isPaid: true,
      pin: event.code || '849201',
      venue: event.startLocation || 'Central University Grounds (Central Quad Archway 4)',
      date: event.date || '2026-08-10',
      time: event.time || '14:00',
      duration: event.duration || '2 Hours',
    };

    createNewTeam(newTeam);

    // Leader receives confirmation notification
    addPlayerNotification({
      type: 'pin',
      title: `Team Created: ${newTeam.name} (Code: ${newTeam.code})`,
      message: `You are the Team Leader! Fee paid: ₹${newTeam.fee}. Access PIN: ${newTeam.pin}. Teammates can join with Code: ${newTeam.code}. Venue: ${newTeam.venue}, Date: ${newTeam.date}, Time: ${newTeam.time}.`,
      actionScreen: 'home',
      eventPin: newTeam.pin,
      eventVenue: newTeam.venue,
      eventDate: newTeam.date,
      eventTime: newTeam.time,
      eventDuration: newTeam.duration,
    });

    onSuccessRegister(event, event.code || '849201');
    onClose();
  };

  // Teammate Request to Join Team
  const handleJoinFoundTeam = () => {
    if (!foundTeam) return;
    playSuccessSound();

    const result = addMemberToTeam(foundTeam.code, user.username || 'Player');
    if (!result) return;

    const { team, member } = result;

    // Dispatch Leader Action Notification to Team Leader
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
      fee: team.fee || event.registrationFee || 199,
      eventVenue: team.venue || event.startLocation || 'Central University Grounds (Central Quad Archway 4)',
      eventDate: team.date || event.date || '2026-08-10',
      eventTime: team.time || event.time || '14:00',
      eventDuration: team.duration || event.duration || '2 Hours',
      eventPin: team.pin || event.code || '849201',
    });

    // Also dispatch notice to the joining candidate
    addPlayerNotification({
      type: 'schedule',
      title: `Join Request Sent: ${team.name}`,
      message: `You requested to join "${team.name}" as ${member.name}. Waiting for Team Leader approval... Once approved, you will be notified to pay and unlock the briefing.`,
      actionScreen: 'home',
    });

    setJoinSuccessNotice(true);
    setTimeout(() => {
      onSuccessRegister(event, event.code || '849201');
      onClose();
    }, 1800);
  };

  const currencySymbol = event.currency || '₹';
  const effectiveFee = event.registrationFee || 199;
  const eventDiff = event.difficulty || 'HARD';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* PHONE DIALOG FRAME CONTAINER (EXACT MATCH TO REFERENCE SCREENSHOT) */}
        <View style={styles.phoneDialogCard}>
          {/* ATMOSPHERIC CAMPUS NIGHT BACKDROP (INSIDE PHONE CARD) */}
          <View style={styles.backdropFixed} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 412 860" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="bgTeamModal" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#040817" />
                <Stop offset="25%" stopColor="#06132d" />
                <Stop offset="55%" stopColor="#091b38" />
                <Stop offset="75%" stopColor="#051024" />
                <Stop offset="100%" stopColor="#020610" />
              </LinearGradient>
              <RadialGradient id="moonGlowTeam" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <Stop offset="35%" stopColor="#bae6fd" stopOpacity="0.45" />
                <Stop offset="70%" stopColor="#0284c7" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="lanternFlareTeam" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                <Stop offset="30%" stopColor="#f59e0b" stopOpacity="0.5" />
                <Stop offset="65%" stopColor="#b45309" stopOpacity="0.18" />
                <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Obsidian Sky */}
            <Rect width="412" height="860" fill="url(#bgTeamModal)" />

            {/* Stars */}
            <G fill="#ffffff">
              <SvgCircle cx="35" cy="85" r="1.3" opacity="0.85" />
              <SvgCircle cx="95" cy="55" r="1.6" opacity="0.9" />
              <SvgCircle cx="150" cy="115" r="1.2" opacity="0.75" />
              <SvgCircle cx="230" cy="140" r="1.4" opacity="0.8" />
              <SvgCircle cx="320" cy="90" r="1.5" opacity="0.85" />
              <SvgCircle cx="370" cy="170" r="1.2" opacity="0.7" />
              <SvgCircle cx="75" cy="240" r="1.4" opacity="0.75" />
              <SvgCircle cx="360" cy="270" r="1.3" opacity="0.8" />
            </G>

            {/* Crescent Moon */}
            <SvgCircle cx="340" cy="95" r="38" fill="url(#moonGlowTeam)" />
            <Path
              d="M 330 70 A 24 24 0 1 0 358 114 A 21 21 0 0 1 330 70 Z"
              fill="#fef08a"
              opacity="0.95"
            />

            {/* Tree Canopy */}
            <Path
              d="M -20 -10 Q 60 40 140 15 Q 220 45 300 20 Q 370 45 440 10 L 440 120 Q 360 140 280 120 Q 180 140 100 125 Q 30 135 -20 118 Z"
              fill="#061e13"
            />

            {/* Street Lamp on Left */}
            <SvgCircle cx="45" cy="690" r="42" fill="url(#lanternFlareTeam)" />
            <Rect x="43" y="680" width="4" height="130" fill="#030712" />
            <Rect x="37" y="670" width="16" height="24" rx="3" fill="#facc15" stroke="#78350f" strokeWidth="2" />
            <Polygon points="33,670 45,655 57,670" fill="#0f172a" />
            <SvgCircle cx="45" cy="682" r="6" fill="#fef08a" />

            {/* Gothic Castle with Windows at Bottom */}
            <Path
              d="M 0 860 L 0 765 L 50 765 L 50 750 L 75 725 L 100 750 L 100 765 L 140 765 L 140 735 L 190 710 L 222 710 L 272 735 L 272 765 L 312 765 L 312 750 L 337 725 L 362 750 L 362 765 L 412 765 L 412 860 Z"
              fill="#030712"
            />
            <Rect x="195" y="740" width="9" height="12" rx="1.5" fill="#facc15" opacity="0.95" />
            <Rect x="208" y="740" width="9" height="12" rx="1.5" fill="#facc15" opacity="0.95" />
            <Rect x="105" y="805" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
            <Rect x="130" y="805" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
            <Rect x="265" y="805" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
            <Rect x="290" y="805" width="8" height="16" rx="1.5" fill="#facc15" opacity="0.95" />
          </Svg>
        </View>

        {/* MAIN MODAL WRAPPER */}
        <View style={styles.modalCardWrapper}>
          {mode === 'create' ? (
            /* ======================================================== */
            /* SCREEN A: CREATE YOUR TEAM (MATCHES LEFT SCREENSHOT)     */
            /* ======================================================== */
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              {/* Header */}
              <View style={styles.topHeaderBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mainTitleText}>CREATE YOUR TEAM</Text>
                  <Text style={styles.mainSubtitleText}>You are the Team Leader</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.circleCloseBtn} activeOpacity={0.75}>
                  <X size={18} color="#ffffff" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollStage} showsVerticalScrollIndicator={false}>
                {/* 1. EVENT SUMMARY CARD */}
                <View style={styles.eventSummaryCard}>
                  <View style={styles.eventSummaryTopRow}>
                    <View style={styles.diffPill}>
                      <Text style={styles.diffPillText}>★★★ {eventDiff.toUpperCase()}</Text>
                    </View>
                    <View style={styles.teamHuntPill}>
                      <Text style={styles.teamHuntPillText}>TEAM HUNT</Text>
                    </View>
                  </View>

                  <Text style={styles.eventSummaryTitle} numberOfLines={1}>
                    {event.title.toUpperCase()}
                  </Text>
                  <Text style={styles.eventSummarySub}>
                    {event.campusName || event.startLocation || 'Central University Grounds'} · {event.date || '2026-08-10'}
                  </Text>

                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Team fee</Text>
                    <Text style={styles.feeAmount}>{currencySymbol}{effectiveFee}</Text>
                  </View>
                </View>

                {/* 2. TEAM NAME INPUT CARD */}
                <View style={styles.teamNameCard}>
                  <Text style={styles.sectionCardLabel}>TEAM NAME</Text>
                  <TextInput
                    value={teamName}
                    onChangeText={setTeamName}
                    placeholder="Choose a team name"
                    placeholderTextColor="#64748b"
                    style={styles.teamNameInput}
                  />
                </View>

                {/* 3. YOUR TEAM ROSTER CARD */}
                <View style={styles.teamRosterCard}>
                  <View style={styles.rosterHeaderRow}>
                    <Text style={styles.sectionCardLabel}>YOUR TEAM</Text>
                    <Text style={styles.rosterCountText}>1 / 4 joined</Text>
                  </View>

                  {/* Leader Row */}
                  <View style={styles.memberRow}>
                    <View style={styles.memberAvatarCircle}>
                      <Text style={styles.memberAvatarText}>Y</Text>
                    </View>
                    <Text style={styles.memberNameText}>You</Text>
                    <Crown size={14} color="#fbbf24" style={{ marginLeft: 6 }} />
                    <View style={styles.leaderBadgePill}>
                      <Text style={styles.leaderBadgePillText}>TEAM LEADER</Text>
                    </View>
                  </View>

                  {/* Empty Teammate Slot 1 */}
                  <View style={styles.emptySlotRow}>
                    <View style={styles.emptySlotPlusCircle}>
                      <Plus size={14} color="#3b82f6" />
                    </View>
                    <Text style={styles.emptySlotText}>Waiting for a teammate...</Text>
                  </View>

                  {/* Empty Teammate Slot 2 */}
                  <View style={styles.emptySlotRow}>
                    <View style={styles.emptySlotPlusCircle}>
                      <Plus size={14} color="#3b82f6" />
                    </View>
                    <Text style={styles.emptySlotText}>Waiting for a teammate...</Text>
                  </View>
                </View>

                {/* 4. TEAM CODE DISPLAY CARD */}
                <View style={styles.teamCodeCard}>
                  <Text style={styles.sectionCardLabel}>TEAM CODE</Text>

                  {/* 6 Code Boxes */}
                  <View style={styles.codeBoxesRow}>
                    {generatedCode.split('').map((char, i) => (
                      <View key={i} style={styles.codeDigitBox}>
                        <Text style={styles.codeDigitText}>{char}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Copy & Share Buttons */}
                  <View style={styles.codeButtonsRow}>
                    <TouchableOpacity onPress={handleCopyCode} style={styles.codeActionBtn} activeOpacity={0.8}>
                      {codeCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#fbbf24" />}
                      <Text style={styles.codeActionBtnText}>
                        {codeCopied ? 'COPIED!' : 'COPY CODE'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShareCode} style={styles.codeActionBtn} activeOpacity={0.8}>
                      <Share2 size={14} color="#fbbf24" />
                      <Text style={styles.codeActionBtnText}>
                        {showShareNotice ? 'SHARED!' : 'SHARE'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.teamCodeNotice}>
                    Teammates enter this code to join. Only one Team Leader per team.
                  </Text>
                </View>

                {/* Mode Switcher Link */}
                <TouchableOpacity
                  onPress={() => setMode('join')}
                  style={styles.switchModeLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchModeLinkText}>
                    Already have a team code? <Text style={{ color: '#fbbf24', fontWeight: '800' }}>Join a Team →</Text>
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Bottom Buttons */}
              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
                  <Text style={styles.backBtnText}>‹ BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLeaderRegisterAndPay}
                  style={styles.registerPayBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.registerPayBtnText}>
                    REGISTER & PAY {currencySymbol}{effectiveFee}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ======================================================== */
            /* SCREEN B: JOIN A TEAM (MATCHES RIGHT SCREENSHOT)         */
            /* ======================================================== */
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              {/* Header */}
              <View style={styles.topHeaderBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mainTitleText}>JOIN A TEAM</Text>
                  <Text style={styles.mainSubtitleText}>Enter the team code from your leader</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.circleCloseBtn} activeOpacity={0.75}>
                  <X size={18} color="#ffffff" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollStage} showsVerticalScrollIndicator={false}>
                {/* 1. TEAM CODE INPUT CARD */}
                <View style={styles.teamCodeCard}>
                  <Text style={styles.sectionCardLabel}>TEAM CODE</Text>

                  {/* 6 Digit Input Boxes */}
                  <View style={styles.codeBoxesRow}>
                    {codeDigits.map((char, i) => (
                      <TextInput
                        key={i}
                        value={char}
                        onChangeText={(val) => handleDigitChange(val, i)}
                        style={styles.codeDigitInput}
                        maxLength={1}
                        autoCapitalize="characters"
                      />
                    ))}
                  </View>

                  {searchError ? (
                    <Text style={styles.searchErrorText}>{searchError}</Text>
                  ) : null}

                  <TouchableOpacity onPress={handleFindTeam} style={styles.findTeamBtn} activeOpacity={0.85}>
                    <Text style={styles.findTeamBtnText}>FIND TEAM</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. TEAM FOUND CARD (GLOWING GREEN BORDER) */}
                {foundTeam && (
                  <View style={styles.teamFoundCard}>
                    <View style={styles.teamFoundTopRow}>
                      <View style={styles.teamFoundPill}>
                        <Text style={styles.teamFoundPillText}>TEAM FOUND</Text>
                      </View>
                      <Text style={styles.teamFoundCountText}>
                        {Math.min(foundTeam.members.length + 1, 4)} / 4 joined
                      </Text>
                    </View>

                    <Text style={styles.teamFoundNameText}>
                      [{foundTeam.name.toUpperCase()}]
                    </Text>

                    {/* Member 1: Leader */}
                    <View style={styles.foundMemberRow}>
                      <View style={styles.foundMemberAvatar}>
                        <Text style={styles.foundMemberAvatarText}>L</Text>
                      </View>
                      <Text style={styles.foundMemberName}>[{foundTeam.leaderName}]</Text>
                      <Crown size={14} color="#fbbf24" style={{ marginLeft: 6 }} />
                      <View style={styles.leaderBadgePill}>
                        <Text style={styles.leaderBadgePillText}>TEAM LEADER</Text>
                      </View>
                    </View>

                    {/* Member 2: Member 1 */}
                    <View style={styles.foundMemberRow}>
                      <View style={styles.foundMemberAvatar}>
                        <Text style={styles.foundMemberAvatarText}>M</Text>
                      </View>
                      <Text style={styles.foundMemberName}>Member 1</Text>
                      <View style={styles.memberBadgePill}>
                        <Text style={styles.memberBadgePillText}>MEMBER</Text>
                      </View>
                    </View>

                    {/* Member 3: You (Member 2 · NEW) */}
                    <View style={styles.foundMemberRow}>
                      <View style={[styles.foundMemberAvatar, { backgroundColor: '#2563eb' }]}>
                        <Text style={styles.foundMemberAvatarText}>Y</Text>
                      </View>
                      <Text style={styles.foundMemberName}>You</Text>
                      <View style={styles.newMemberBadgePill}>
                        <Text style={styles.newMemberBadgePillText}>MEMBER · NEW</Text>
                      </View>
                    </View>
                  </View>
                )}

                <Text style={styles.freeJoinNoticeText}>
                  The leader has paid for the team, so you join free. You will join as a member, not a leader.
                </Text>

                {/* Success Notification Banner */}
                {joinSuccessNotice && (
                  <View style={styles.joinSuccessBanner}>
                    <Check size={18} color="#10b981" />
                    <Text style={styles.joinSuccessBannerText}>
                      Join request sent to Team Leader! Check Alerts for acceptance & schedule.
                    </Text>
                  </View>
                )}

                {/* Mode Switcher Link */}
                <TouchableOpacity
                  onPress={() => setMode('create')}
                  style={styles.switchModeLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchModeLinkText}>
                    Want to create your own squad? <Text style={{ color: '#fbbf24', fontWeight: '800' }}>Create Your Team →</Text>
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Bottom Buttons */}
              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
                  <Text style={styles.backBtnText}>‹ BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleJoinFoundTeam}
                  style={styles.registerPayBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.registerPayBtnText}>JOIN TEAM</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  </Modal>
);
};

const styles = StyleSheet.create({
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(2, 6, 18, 0.85)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 12,
},
phoneDialogCard: {
  width: '100%',
  maxWidth: 412,
  height: '96%',
  maxHeight: 860,
  backgroundColor: '#040817',
  borderRadius: 26,
  overflow: 'hidden',
  position: 'relative',
  borderWidth: 1.5,
  borderColor: 'rgba(217, 119, 6, 0.45)',
  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(217, 119, 6, 0.15)',
  display: 'flex',
  flexDirection: 'column',
},
backdropFixed: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
},
modalCardWrapper: {
  width: '100%',
  height: '100%',
  flex: 1,
  zIndex: 10,
  flexDirection: 'column',
  justifyContent: 'space-between',
  paddingTop: 10,
},
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  mainTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 1.2,
    textShadowColor: 'rgba(251, 191, 36, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  mainSubtitleText: {
    fontSize: 11.5,
    color: '#86efac',
    marginTop: 2,
    fontFamily: "'Outfit', sans-serif",
  },
  circleCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(5, 20, 15, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollStage: {
    flex: 1,
    paddingHorizontal: 14,
  },
  eventSummaryCard: {
    backgroundColor: 'rgba(4, 9, 24, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 13,
    marginBottom: 12,
  },
  eventSummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  diffPill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  diffPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  teamHuntPill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  teamHuntPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#22c55e',
    letterSpacing: 0.6,
  },
  eventSummaryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  eventSummarySub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 10,
    fontFamily: "'Outfit', sans-serif",
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  feeLabel: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontFamily: "'Outfit', sans-serif",
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  sectionCardLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  teamNameCard: {
    backgroundColor: 'rgba(4, 9, 24, 0.85)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 12,
    marginBottom: 12,
  },
  teamNameInput: {
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
  },
  teamRosterCard: {
    backgroundColor: 'rgba(4, 9, 24, 0.85)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  rosterCountText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  memberAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  memberNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  leaderBadgePill: {
    marginLeft: 'auto',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  leaderBadgePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
  },
  emptySlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptySlotPlusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emptySlotText: {
    fontSize: 11.5,
    color: '#64748b',
    fontStyle: 'italic',
  },
  teamCodeCard: {
    backgroundColor: 'rgba(4, 9, 24, 0.85)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 13,
    marginBottom: 12,
  },
  codeBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  codeDigitBox: {
    width: 44,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  codeDigitText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  codeDigitInput: {
    width: 44,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    textAlign: 'center',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  codeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#78350f',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    paddingVertical: 8,
  },
  codeActionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
  },
  teamCodeNotice: {
    fontSize: 10.5,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
  findTeamBtn: {
    backgroundColor: '#b45309',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  findTeamBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
  searchErrorText: {
    fontSize: 11,
    color: '#f87171',
    textAlign: 'center',
    marginTop: 4,
  },
  teamFoundCard: {
    backgroundColor: 'rgba(4, 15, 25, 0.88)',
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#22c55e',
    padding: 13,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  teamFoundTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamFoundPill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  teamFoundPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#22c55e',
  },
  teamFoundCountText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  teamFoundNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
  },
  foundMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  foundMemberAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  foundMemberAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  foundMemberName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  memberBadgePill: {
    marginLeft: 'auto',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  memberBadgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  newMemberBadgePill: {
    marginLeft: 'auto',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  newMemberBadgePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fbbf24',
  },
  freeJoinNoticeText: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  joinSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  joinSuccessBannerText: {
    fontSize: 11.5,
    color: '#10b981',
    fontWeight: '700',
    flex: 1,
  },
  switchModeLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  switchModeLinkText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: "'Outfit', sans-serif",
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: 'rgba(4, 8, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 100,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  registerPayBtn: {
    flex: 1,
    backgroundColor: '#b45309',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  registerPayBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
});
