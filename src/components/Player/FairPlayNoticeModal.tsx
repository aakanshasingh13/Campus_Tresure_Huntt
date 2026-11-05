import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  Lock,
  Eye,
  Radio,
} from 'lucide-react-native';
import { playErrorSound, playSuccessSound } from '../../utils/audioEffects';

interface FairPlayNoticeModalProps {
  visible: boolean;
  eventTitle: string;
  onAccept: () => void;
  onCancel: () => void;
}

export const FairPlayNoticeModal: React.FC<FairPlayNoticeModalProps> = ({
  visible,
  eventTitle,
  onAccept,
  onCancel,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!visible) return null;

  const handleConfirm = () => {
    if (!agreed) {
      playErrorSound();
      return;
    }
    playSuccessSound();
    onAccept();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Warning Strip */}
          <View style={styles.header}>
            <View style={styles.iconPulse}>
              <ShieldAlert size={24} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tagText}>ORGANIZER FAIR PLAY PROTOCOL</Text>
              <Text style={styles.headerTitle}>STRICT ANTI-CHEAT RULES</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Event Context Banner */}
          <View style={styles.eventBanner}>
            <Text style={styles.eventBannerText}>
              Applying strictly to:{' '}
              <Text style={styles.eventBannerHighlight}>{eventTitle}</Text>
            </Text>
          </View>

          {/* Rules List */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionNotice}>
              To maintain honesty, competition integrity, and strict fairness, all participants must agree to the following enforced gameplay rules:
            </Text>

            {/* Rule 1 */}
            <View style={styles.ruleItem}>
              <View style={styles.ruleNumBadge}>
                <Text style={styles.ruleNumText}>1</Text>
              </View>
              <View style={styles.ruleDetails}>
                <Text style={styles.ruleTitle}>No Back Button or Exiting</Text>
                <Text style={styles.ruleDesc}>
                  Once you start the hunt, you are <Text style={styles.boldRed}>not allowed to click back</Text> or navigate away from the game screen. Doing so will trigger an immediate penalty.
                </Text>
              </View>
            </View>

            {/* Rule 2 */}
            <View style={styles.ruleItem}>
              <View style={styles.ruleNumBadge}>
                <Text style={styles.ruleNumText}>2</Text>
              </View>
              <View style={styles.ruleDetails}>
                <Text style={styles.ruleTitle}>Stay on the Active Screen</Text>
                <Text style={styles.ruleDesc}>
                  You must remain on the active quest screen at all times. <Text style={styles.boldRed}>Switching browser tabs, minimizing the window, or switching apps</Text> is tracked in real-time and counts as a violation.
                </Text>
              </View>
            </View>

            {/* Rule 3 - The 2 Strikes Policy */}
            <View style={[styles.ruleItem, styles.strikeRuleHighlight]}>
              <View style={[styles.ruleNumBadge, { backgroundColor: '#ef4444' }]}>
                <Flame size={14} color="#ffffff" />
              </View>
              <View style={styles.ruleDetails}>
                <Text style={[styles.ruleTitle, { color: '#f87171' }]}>Strict 2-Strike Penalty & Elimination</Text>
                <View style={styles.strikeRow}>
                  <Text style={styles.strikePoint}>
                    • <Text style={styles.strikeBold}>Strike 1:</Text> First violation will issue a warning and deduct <Text style={styles.strikeDeduct}>-500 XP Points</Text> instantly from your score.
                  </Text>
                  <Text style={styles.strikePoint}>
                    • <Text style={styles.strikeBold}>Strike 2:</Text> Second violation results in <Text style={styles.strikeDeduct}>IMMEDIATE ELIMINATION & DISQUALIFICATION</Text>. You will be barred from finishing the event.
                  </Text>
                </View>
              </View>
            </View>

            {/* Agreement Toggle */}
            <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              style={[styles.checkboxRow, agreed && styles.checkboxRowActive]}
              activeOpacity={0.85}
            >
              <View style={[styles.customCheckbox, agreed && styles.customCheckboxActive]}>
                {agreed && <CheckCircle2 size={16} color="#0f172a" fill="#22c55e" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand the <Text style={{ color: '#fde047', fontWeight: '800' }}>2-strike rule</Text>, agree to stay on screen without clicking back, and accept the -500 XP deduction & elimination terms.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.acceptBtn, !agreed && styles.acceptBtnDisabled]}
              activeOpacity={0.85}
              disabled={!agreed}
            >
              <Text style={styles.acceptBtnText}>I AGREE & PROCEED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: '#070e20',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    gap: 12,
  },
  iconPulse: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBanner: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  eventBannerText: {
    fontSize: 11.5,
    color: '#94a3b8',
  },
  eventBannerHighlight: {
    color: '#fde047',
    fontWeight: '800',
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  scrollContent: {
    gap: 12,
  },
  sectionNotice: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 10,
  },
  strikeRuleHighlight: {
    backgroundColor: 'rgba(127, 29, 29, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  ruleNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  ruleDetails: {
    flex: 1,
    gap: 3,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  ruleDesc: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 16,
  },
  boldRed: {
    color: '#f87171',
    fontWeight: '800',
  },
  strikeRow: {
    gap: 4,
    marginTop: 4,
  },
  strikePoint: {
    fontSize: 11.5,
    color: '#fca5a5',
    lineHeight: 16,
  },
  strikeBold: {
    fontWeight: '900',
    color: '#ffffff',
  },
  strikeDeduct: {
    fontWeight: '900',
    color: '#ef4444',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  checkboxRowActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(6, 78, 59, 0.25)',
  },
  customCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  customCheckboxActive: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 11.5,
    color: '#e2e8f0',
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  acceptBtnDisabled: {
    backgroundColor: '#475569',
    opacity: 0.5,
    shadowOpacity: 0,
  },
  acceptBtnText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
});
