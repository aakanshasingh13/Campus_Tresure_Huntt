import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import {
  X,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  HelpCircle,
  LogOut,
  Send,
  Star,
  CheckCircle2,
  Receipt,
  FileText,
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
import { UserProfile } from '../../types';
import { playClickSound, playSuccessSound } from '../../utils/audioEffects';

interface ProfileSettingsScreenProps {
  user: UserProfile;
  onOpenProfileModal: () => void;
  onOpenChangePasswordModal: () => void;
  onOpenAvatarPicker: () => void;
  onLogout: () => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onNavigateToTab?: (tab: 'home' | 'my-events' | 'leaderboard' | 'notifications' | 'rewards') => void;
  joinedHuntsCount?: number;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  user,
  onOpenProfileModal,
  onOpenChangePasswordModal,
  onOpenAvatarPicker,
  onLogout,
  onUpdateUser,
  onNavigateToTab,
  joinedHuntsCount = 2,
}) => {
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const playerName = user.username ? user.username.toUpperCase() : '[YOUR NAME]';
  const profileInitial = (user.username || 'A').charAt(0).toUpperCase();

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSuccess(true);
    playSuccessSound();
    setTimeout(() => {
      setShowHelpModal(false);
      setFeedbackSuccess(false);
      setFeedbackText('');
    }, 1800);
  };

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
            <LinearGradient id="profileSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#040817" />
              <Stop offset="25%" stopColor="#07122b" />
              <Stop offset="60%" stopColor="#0a1a38" />
              <Stop offset="85%" stopColor="#08142a" />
              <Stop offset="100%" stopColor="#03060f" />
            </LinearGradient>

            {/* Crescent Moon Halo */}
            <RadialGradient id="profileMoonHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
              <Stop offset="45%" stopColor="#fef9c3" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#0a1a38" stopOpacity={0} />
            </RadialGradient>

            {/* Street Lamp Amber Radial Flare */}
            <RadialGradient id="profileLampHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity={0.9} />
              <Stop offset="40%" stopColor="#f59e0b" stopOpacity={0.45} />
              <Stop offset="80%" stopColor="#d97706" stopOpacity={0.15} />
              <Stop offset="100%" stopColor="#040817" stopOpacity={0} />
            </RadialGradient>

            {/* Clock Face Warm Glow */}
            <RadialGradient id="profileClockHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
              <Stop offset="45%" stopColor="#fef08a" stopOpacity={0.8} />
              <Stop offset="85%" stopColor="#f59e0b" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#040817" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* 1. Midnight Sky */}
          <Rect width="420" height="900" fill="url(#profileSkyGrad)" />

          {/* 2. Top Corner Forest Green Curtains */}
          <Path d="M 0 0 L 130 0 C 130 50, 85 80, 0 80 Z" fill="#082b1d" />
          <Path d="M 0 0 L 110 0 C 110 42, 70 70, 0 70 Z" fill="#0f3c28" />
          <Path d="M 420 0 L 290 0 C 290 50, 335 80, 420 80 Z" fill="#082b1d" />
          <Path d="M 420 0 L 310 0 C 310 42, 350 70, 420 70 Z" fill="#0f3c28" />

          {/* 3. Celestial Crescent Moon in Top Right */}
          <G transform="translate(315, 80)">
            <Circle cx="24" cy="24" r="28" fill="url(#profileMoonHalo)" />
            <Path
              d="M 12 10 C 26 10 36 21 36 34 C 36 38 34 41 32 44 C 41 40 45 30 45 22 C 45 9 34 0 20 0 C 16 0 13 1 10 3 C 12 5 12 8 12 10 Z"
              fill="#fef08a"
            />
          </G>

          {/* 4. Twinkling Stars */}
          <G fill="#ffffff">
            <Circle cx="70" cy="220" r="1.4" opacity={0.85} />
            <Circle cx="120" cy="180" r="1.5" opacity={0.9} />
            <Circle cx="220" cy="90" r="1.2" opacity={0.8} />
            <Circle cx="270" cy="130" r="1.4" opacity={0.85} />
            <Circle cx="370" cy="240" r="1.3" opacity={0.8} />
            <Circle cx="140" cy="280" r="1.5" opacity={0.85} />
          </G>

          {/* 5. Collegiate Gothic Clocktower Silhouette at Bottom */}
          <G transform="translate(210, 680)">
            <Path d="M -40 220 L -40 90 L 0 45 L 40 90 L 40 220 Z" fill="#050c18" />
            <Polygon points="-120,220 -120,150 -75,115 -40,155 -40,220" fill="#071020" />
            <Polygon points="40,220 40,155 75,115 120,150 120,220" fill="#071020" />

            {/* Glowing Circular Clockface */}
            <Circle cx="0" cy="78" r="18" fill="url(#profileClockHalo)" />
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
            <Circle cx="10" cy="30" r="42" fill="url(#profileLampHalo)" />
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
        {/* Top Header: CAMPUS QUEST & Fairy Lights */}
        <View style={styles.headerBlock}>
          <Text style={styles.mainTitle}>CAMPUS QUEST</Text>

          {/* Garland String with Glowing Green Beads */}
          <View style={styles.garlandRow}>
            <Svg width={230} height={20} viewBox="0 0 230 20">
              <Path d="M 8 6 Q 115 22 222 6" stroke="#22543d" strokeWidth={1.5} fill="none" />
              {[22, 50, 80, 105, 115, 125, 150, 180, 208].map((cx, i) => (
                <G key={i}>
                  <Circle
                    cx={cx}
                    cy={6 + Math.sin((cx / 230) * Math.PI) * 12}
                    r={3.8}
                    fill="#38a169"
                    opacity={0.4}
                  />
                  <Circle
                    cx={cx}
                    cy={6 + Math.sin((cx / 230) * Math.PI) * 12}
                    r={2.4}
                    fill="#68d391"
                  />
                  <Circle
                    cx={cx}
                    cy={6 + Math.sin((cx / 230) * Math.PI) * 12}
                    r={1}
                    fill="#e6fffa"
                  />
                </G>
              ))}
            </Svg>
          </View>
        </View>

        {/* Center Glowing Avatar Box */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={onOpenAvatarPicker}
            {...({ onClick: onOpenAvatarPicker } as any)}
            style={styles.avatarGlowingRing}
            activeOpacity={0.85}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitialText}>{profileInitial}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Player Name */}
          <Text style={styles.playerNameText}>{playerName}</Text>

          {/* CAMPUS EXPLORER Pill Badge */}
          <View style={styles.roleBadgePill}>
            <Text style={styles.roleBadgeText}>CAMPUS EXPLORER</Text>
          </View>
        </View>

        {/* 3 Metrics / Stats Row */}
        <View style={styles.statsRow}>
          {/* XP Card */}
          <View style={styles.statCard}>
            <Text style={styles.statValueText}>{user.score || 450}</Text>
            <Text style={styles.statLabelText}>XP</Text>
          </View>

          {/* Level Card */}
          <View style={styles.statCard}>
            <Text style={styles.statValueText}>3</Text>
            <Text style={styles.statLabelText}>Level</Text>
          </View>

          {/* Hunts Card */}
          <View style={styles.statCard}>
            <Text style={styles.statValueText}>
              {joinedHuntsCount > 0 ? joinedHuntsCount : '[N]'}
            </Text>
            <Text style={styles.statLabelText}>Hunts</Text>
          </View>
        </View>

        {/* Double Gold-Border Menu Card */}
        <View style={styles.menuDoubleBorder}>
          <View style={styles.menuInnerBox}>
            {/* 1. Edit Profile */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                playClickSound();
                onOpenProfileModal();
              }}
              {...({ onClick: onOpenProfileModal } as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <ChevronRight size={18} color="#f59e0b" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* 2. Payment History */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                playClickSound();
                setShowPaymentHistoryModal(true);
              }}
              {...({ onClick: () => setShowPaymentHistoryModal(true) } as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Payment History</Text>
              <ChevronRight size={18} color="#f59e0b" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* 3. Notifications */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                playClickSound();
                if (onNavigateToTab) {
                  onNavigateToTab('notifications');
                }
              }}
              {...({
                onClick: () => {
                  if (onNavigateToTab) onNavigateToTab('notifications');
                },
              } as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Notifications</Text>
              <ChevronRight size={18} color="#f59e0b" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* 4. Help & Support */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                playClickSound();
                setShowHelpModal(true);
              }}
              {...({ onClick: () => setShowHelpModal(true) } as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Help & Support</Text>
              <ChevronRight size={18} color="#f59e0b" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* 5. Log Out */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={() => {
                playClickSound();
                setShowLogoutConfirmModal(true);
              }}
              {...({ onClick: () => setShowLogoutConfirmModal(true) } as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, styles.menuItemLogout]}>Log Out</Text>
              <ChevronRight size={18} color="#f87171" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ======================================================== */}
      {/* 1. PAYMENT HISTORY MODAL                                 */}
      {/* ======================================================== */}
      {showPaymentHistoryModal && (
        <Modal
          visible={showPaymentHistoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPaymentHistoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Receipt size={20} color="#f5be38" />
                  <Text style={styles.dialogTitle}>PAYMENT HISTORY</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPaymentHistoryModal(false)}
                  style={styles.dialogCloseBtn}
                >
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {/* Simulated Recent Verified Transactions */}
                <View style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <Text style={styles.txEventTitle}>THE GREAT BELLTOWER MYSTERY</Text>
                    <Text style={styles.txAmount}>₹199</Text>
                  </View>
                  <View style={styles.txMetaRow}>
                    <Text style={styles.txStatus}>✓ UPI PAID • VERIFIED</Text>
                    <Text style={styles.txPin}>PIN: 849201</Text>
                  </View>
                  <Text style={styles.txDate}>UTR: 928174829104 • Just now</Text>
                </View>

                <View style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <Text style={styles.txEventTitle}>METROPOLITAN HERITAGE RUN</Text>
                    <Text style={styles.txAmount}>₹199</Text>
                  </View>
                  <View style={styles.txMetaRow}>
                    <Text style={styles.txStatus}>✓ UPI PAID • VERIFIED</Text>
                    <Text style={styles.txPin}>PIN: 517824</Text>
                  </View>
                  <Text style={styles.txDate}>UTR: 492810482910 • 2 days ago</Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowPaymentHistoryModal(false)}
                style={styles.dialogPrimaryBtn}
              >
                <Text style={styles.dialogPrimaryBtnText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 2. HELP & SUPPORT MODAL                                  */}
      {/* ======================================================== */}
      {showHelpModal && (
        <Modal
          visible={showHelpModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowHelpModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <HelpCircle size={20} color="#38bdf8" />
                  <Text style={styles.dialogTitle}>HELP & SUPPORT</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowHelpModal(false)}
                  style={styles.dialogCloseBtn}
                >
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {feedbackSuccess ? (
                <View style={styles.feedbackSuccessBox}>
                  <CheckCircle2 size={32} color="#10b981" />
                  <Text style={styles.feedbackSuccessTitle}>Feedback Submitted!</Text>
                  <Text style={styles.feedbackSuccessSub}>
                    Thank you for helping us improve Campus Quest.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <Text style={styles.helpGuideText}>
                    Have an issue during a hunt or feedback on physical checkpoint QR codes?
                    Send a note directly to the hunt master team:
                  </Text>

                  {/* Rating Stars */}
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setFeedbackRating(s)}
                        {...({ onClick: () => setFeedbackRating(s) } as any)}
                      >
                        <Star
                          size={24}
                          color={s <= feedbackRating ? '#fbbf24' : '#475569'}
                          fill={s <= feedbackRating ? '#fbbf24' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.helpTextInput}
                    placeholder="Describe your issue or suggestions..."
                    placeholderTextColor="#64748b"
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity
                    onPress={handleSendFeedback}
                    {...({ onClick: handleSendFeedback } as any)}
                    style={styles.dialogPrimaryBtn}
                  >
                    <Send size={15} color="#0f172a" />
                    <Text style={styles.dialogPrimaryBtnText}>SUBMIT TO ORGANIZERS</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 3. LOGOUT CONFIRMATION MODAL                             */}
      {/* ======================================================== */}
      {showLogoutConfirmModal && (
        <Modal
          visible={showLogoutConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dialogCard}>
              <View style={styles.logoutIconBox}>
                <LogOut size={28} color="#f87171" />
              </View>

              <Text style={styles.logoutModalTitle}>Log Out of Player Account?</Text>
              <Text style={styles.logoutModalDesc}>
                You will be returned to the login screen. Your joined hunts, access PINs, and XP will
                remain safely preserved.
              </Text>

              <View style={styles.logoutActionRow}>
                <TouchableOpacity
                  onPress={() => setShowLogoutConfirmModal(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowLogoutConfirmModal(false);
                    onLogout();
                  }}
                  style={styles.confirmLogoutBtn}
                >
                  <Text style={styles.confirmLogoutBtnText}>LOG OUT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* Header Branding */
  headerBlock: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8d363',
    fontFamily: 'Cinzel, Georgia, "Times New Roman", serif',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(248, 211, 99, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  garlandRow: {
    marginTop: -2,
    alignItems: 'center',
  },

  /* Avatar Section */
  avatarSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarGlowingRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 22px rgba(245, 158, 11, 0.65), 0 0 38px rgba(251, 191, 36, 0.3)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  playerNameText: {
    color: '#f6c449',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, "Times New Roman", serif',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(246, 196, 73, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  roleBadgePill: {
    borderWidth: 1.5,
    borderColor: '#b87c2b',
    backgroundColor: 'rgba(88, 46, 17, 0.35)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
  },
  roleBadgeText: {
    color: '#ffdf88',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  /* 3 Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#07101e',
    borderWidth: 1.2,
    borderColor: '#1e2f4c',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueText: {
    color: '#f6c449',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, serif',
    marginBottom: 2,
  },
  statLabelText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Double Gold-Border Menu Card */
  menuDoubleBorder: {
    borderWidth: 1.5,
    borderColor: '#d4af37',
    borderRadius: 18,
    padding: 2.5,
    backgroundColor: '#050c18',
    boxShadow: '0 0 16px rgba(212, 175, 55, 0.22)',
    marginBottom: 10,
  },
  menuInnerBox: {
    borderWidth: 1.2,
    borderColor: '#a17a26',
    borderRadius: 15,
    backgroundColor: '#07101f',
    overflow: 'hidden',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuItemText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  menuItemLogout: {
    color: '#f87171',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },

  /* Sub Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#07101f',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1e2f4c',
    padding: 18,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
  },
  dialogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dialogTitle: {
    color: '#f6c449',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Cinzel, Georgia, serif',
    letterSpacing: 0.5,
  },
  dialogCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#b85d0d',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
  },
  dialogPrimaryBtnText: {
    color: '#fffbeb',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'Cinzel, Georgia, serif',
    letterSpacing: 0.8,
  },

  /* Transaction Items */
  txCard: {
    backgroundColor: '#050c18',
    borderWidth: 1,
    borderColor: '#1e2d48',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txEventTitle: {
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
  },
  txAmount: {
    color: '#f5be38',
    fontSize: 15,
    fontWeight: '900',
  },
  txMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txStatus: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  txPin: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
  },
  txDate: {
    color: '#64748b',
    fontSize: 10.5,
  },

  /* Help & Support */
  helpGuideText: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 4,
  },
  helpTextInput: {
    backgroundColor: '#050c18',
    borderWidth: 1,
    borderColor: '#1e2d48',
    borderRadius: 10,
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  feedbackSuccessBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  feedbackSuccessTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  feedbackSuccessSub: {
    color: '#94a3b8',
    fontSize: 12.5,
    textAlign: 'center',
  },

  /* Logout Confirmation */
  logoutIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoutModalTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  logoutModalDesc: {
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  logoutActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#050c18',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
  },
  confirmLogoutBtn: {
    flex: 1,
    backgroundColor: '#b91c1c',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmLogoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
