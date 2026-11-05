import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  CreditCard,
  Lock,
  Sparkles,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { TreasureEvent } from '../../types';
import {
  CampusQuestCheckoutResult,
  createSandboxTransactionId,
} from '../../lib/paymentCheckout';

interface CampusQuestPaymentModalProps {
  visible: boolean;
  event: TreasureEvent | null;
  user: {
    username?: string;
    email?: string;
    phone?: string;
  };
  initialTeamName?: string;
  onClose: () => void;
  onPay: (payload: { teamName: string; transactionId: string }) => void;
  isProcessing?: boolean;
  error?: string;
  paymentResult?: CampusQuestCheckoutResult | null;
}

export const CampusQuestPaymentModal: React.FC<CampusQuestPaymentModalProps> = ({
  visible,
  event,
  user,
  initialTeamName,
  onClose,
  onPay,
  isProcessing = false,
  error = '',
  paymentResult = null,
}) => {
  const [teamSquadName, setTeamSquadName] = useState(
    initialTeamName || `${user.username || 'Explorer'}'s Squad`
  );
  const [localError, setLocalError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sandboxTransactionId, setSandboxTransactionId] = useState<string>(() =>
    createSandboxTransactionId()
  );

  useEffect(() => {
    if (visible) {
      if (initialTeamName) {
        setTeamSquadName(initialTeamName);
      } else if (user.username) {
        setTeamSquadName(`${user.username}'s Squad`);
      }
      setLocalError('');
      setHasSubmitted(false);
      setSandboxTransactionId(createSandboxTransactionId());
    }
  }, [visible, user.username, initialTeamName]);

  useEffect(() => {
    if (error) {
      setHasSubmitted(false);
    }
  }, [error]);

  if (!visible || !event) return null;

  const registrationFee = event.registrationFee ?? 0;
  const currencySymbol = event.currency || '₹';
  const cluesCount = event.clues?.length || 4;
  const xpReward = event.clues?.reduce((sum, c) => sum + (c.points || 150), 0) || 700;
  const difficultyDisplay = event.difficulty
    ? event.difficulty.charAt(0).toUpperCase() + event.difficulty.slice(1)
    : 'Hard';
  const isBusy = isProcessing || hasSubmitted;
  const displayedError = error || localError;

  const handlePayNow = () => {
    if (isBusy || paymentResult) return;

    const cleanTeamName = teamSquadName.trim();
    if (!cleanTeamName) {
      setLocalError('Please enter a team squad name.');
      return;
    }

    setLocalError('');
    setHasSubmitted(true);
    onPay({
      teamName: cleanTeamName,
      transactionId: sandboxTransactionId,
    });
  };

  const handleClose = () => {
    if (isBusy && !paymentResult) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cardFrame}>
          <View style={styles.topCurtainsContainer} pointerEvents="none">
            <Svg width="100%" height={85} viewBox="0 0 380 85" preserveAspectRatio="none">
              <Path d="M 0 0 L 120 0 C 120 48, 80 75, 0 75 Z" fill="#082b1d" />
              <Path d="M 0 0 L 105 0 C 105 40, 70 65, 0 65 Z" fill="#0f3c28" />
              <Path d="M 0 0 L 85 0 C 85 30, 55 52, 0 52 Z" fill="#144e34" opacity={0.6} />
              <Path d="M 380 0 L 260 0 C 260 48, 300 75, 380 75 Z" fill="#082b1d" />
              <Path d="M 380 0 L 275 0 C 275 40, 310 65, 380 65 Z" fill="#0f3c28" />
              <Path d="M 380 0 L 295 0 C 295 30, 325 52, 380 52 Z" fill="#144e34" opacity={0.6} />
              <Circle cx="86" cy="115" r="1.3" fill="#ffffff" opacity={0.9} />
              <Circle cx="130" cy="95" r="1.5" fill="#fef08a" opacity={0.95} />
              <Circle cx="215" cy="120" r="1.2" fill="#ffffff" opacity={0.8} />
              <Circle cx="260" cy="85" r="1.6" fill="#fef08a" opacity={0.9} />
            </Svg>
          </View>

          <View style={styles.moonContainer} pointerEvents="none">
            <Svg width={46} height={46} viewBox="0 0 46 46">
              <Defs>
                <RadialGradient id="moonHaloGrad" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                  <Stop offset="45%" stopColor="#fef9c3" stopOpacity={0.4} />
                  <Stop offset="100%" stopColor="#fef9c3" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx="23" cy="23" r="21" fill="url(#moonHaloGrad)" />
              <Path
                d="M 12 10 C 26 10 36 21 36 34 C 36 38 34 41 32 44 C 41 40 45 30 45 22 C 45 9 34 0 20 0 C 16 0 13 1 10 3 C 12 5 12 8 12 10 Z"
                fill="#fef08a"
              />
              <Path
                d="M 14 11 C 26 12 34 22 34 33 C 34 36 33 39 31 41 C 38 37 42 29 42 22 C 42 11 33 2 21 2 C 18 2 15 3 13 4 C 14 6 14 9 14 11 Z"
                fill="#ffffff"
                opacity={0.85}
              />
            </Svg>
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, isBusy && !paymentResult && styles.closeBtnDisabled]}
            onPress={handleClose}
            {...({ onClick: handleClose } as any)}
            activeOpacity={0.7}
            disabled={isBusy && !paymentResult}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={18} color="#cbd5e1" />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text style={styles.brandText}>CAMPUS QUEST</Text>
              <Text style={styles.mainTitle}>
                {paymentResult ? 'Checkout Complete' : 'Complete Payment'}
              </Text>

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

              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>ONE-CLICK SANDBOX PAYMENT</Text>
              </View>
            </View>

            {paymentResult ? (
              <View style={styles.resultCard}>
                <View style={[styles.resultIconWrap, styles.resultIconVerified]}>
                  <CheckCircle2 size={38} color="#34d399" />
                </View>

                <Text style={styles.resultTitle}>Payment Successful</Text>
                <View style={styles.registrationConfirmedPill}>
                  <CheckCircle2 size={13} color="#34d399" />
                  <Text style={styles.registrationConfirmedText}>REGISTRATION CONFIRMED</Text>
                </View>
                <Text style={styles.resultSubtitle}>
                  Your sandbox payment was processed instantly and your event entry is secured.
                </Text>

                {paymentResult.message ? (
                  <Text style={styles.resultServerMessage}>{paymentResult.message}</Text>
                ) : null}

                <View style={styles.resultDetails}>
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Event</Text>
                    <Text style={styles.resultDetailValue} numberOfLines={2}>
                      {paymentResult.eventTitle}
                    </Text>
                  </View>
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Amount Paid</Text>
                    <Text style={styles.resultDetailValue}>
                      {paymentResult.currencySymbol}{paymentResult.amount}
                    </Text>
                  </View>
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Sandbox Reference</Text>
                    <Text style={styles.resultDetailValue}>{paymentResult.transactionId}</Text>
                  </View>
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Registration</Text>
                    <Text style={styles.resultDetailValue}>{paymentResult.registrationId}</Text>
                  </View>
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Status</Text>
                    <Text style={[styles.resultStatusPill, styles.resultStatusVerified]}>
                      VERIFIED • CONFIRMED
                    </Text>
                  </View>
                </View>

                <View style={styles.resultNotice}>
                  <ShieldCheck size={16} color="#34d399" />
                  <Text style={styles.resultNoticeText}>
                    Simulated sandbox payment only. No real money was transferred and no admin approval is required.
                  </Text>
                </View>
              </View>
            ) : isBusy ? (
              <View style={styles.processingCard}>
                <View style={styles.processingIconArea}>
                  <View style={styles.processingIconCircle}>
                    <ActivityIndicator size="large" color="#fbbf24" />
                  </View>
                </View>
                <Text style={styles.processingTitle}>Processing...</Text>
                <Text style={styles.processingSubtitle}>
                  Completing your sandbox payment and securing your event registration.
                </Text>

                <View style={styles.processingSteps}>
                  <View style={styles.processingStepRow}>
                    <View style={styles.processingStepDot} />
                    <Text style={styles.processingStepText}>Validating sandbox checkout</Text>
                  </View>
                  <View style={styles.processingStepRow}>
                    <View style={styles.processingStepDot} />
                    <Text style={styles.processingStepText}>Confirming payment instantly</Text>
                  </View>
                  <View style={styles.processingStepRow}>
                    <View style={styles.processingStepDot} />
                    <Text style={styles.processingStepText}>Creating event registration</Text>
                  </View>
                </View>

                <View style={styles.processingStatusRow}>
                  <ActivityIndicator size="small" color="#fbbf24" />
                  <Text style={styles.processingStatusText}>WAITING FOR BACKEND CONFIRMATION</Text>
                </View>
                <Text style={styles.processingNote}>
                  Success is shown only after the backend confirms both payment and registration.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sandboxStrip}>
                  <ShieldCheck size={14} color="#34d399" />
                  <Text style={styles.sandboxStripText}>
                    Campus Quest sandbox simulation · no real money, UPI app, bank, card, or wallet is used.
                  </Text>
                </View>

                <View style={styles.eventCardDoubleBorder}>
                  <View style={styles.eventCardInner}>
                    <View style={styles.eventDetailsCol}>
                      <Text style={styles.eventTitleText} numberOfLines={2}>
                        {event.title.toUpperCase()}
                      </Text>
                      <Text style={styles.eventMetaText}>
                        {difficultyDisplay} · {cluesCount} clues · {xpReward} XP
                      </Text>
                    </View>
                    <View style={styles.eventPriceCol}>
                      <Text style={styles.eventPriceText}>
                        {currencySymbol}{registrationFee}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.teamInputGroup}>
                  <Text style={styles.teamInputLabel}>TEAM / SQUAD NAME</Text>
                  <TextInput
                    style={styles.teamTextInput}
                    value={teamSquadName}
                    onChangeText={setTeamSquadName}
                    placeholder="Enter squad name"
                    placeholderTextColor="#64748b"
                    editable={!isBusy}
                  />
                </View>

                <View style={styles.instantPanel}>
                  <View style={styles.instantHeaderRow}>
                    <View style={styles.instantIconBadge}>
                      <Sparkles size={16} color="#fbbf24" />
                    </View>
                    <View style={styles.instantHeaderText}>
                      <Text style={styles.instantTitle}>INSTANT SANDBOX CHECKOUT</Text>
                      <Text style={styles.instantSubtitle}>Payment and registration complete together.</Text>
                    </View>
                  </View>

                  <View style={styles.instantRow}>
                    <CreditCard size={15} color="#34d399" />
                    <Text style={styles.instantRowText}>
                      The backend charges the exact event amount server-side.
                    </Text>
                  </View>
                  <View style={styles.instantRow}>
                    <Lock size={15} color="#34d399" />
                    <Text style={styles.instantRowText}>
                      No PIN entry, no UTR, and no admin verification step.
                    </Text>
                  </View>
                  <View style={styles.instantRow}>
                    <CheckCircle2 size={15} color="#34d399" />
                    <Text style={styles.instantRowText}>
                      Registration is confirmed only after backend success.
                    </Text>
                  </View>
                </View>

                <View style={styles.amountSummary}>
                  <Text style={styles.amountSummaryLabel}>TOTAL SANDBOX AMOUNT</Text>
                  <Text style={styles.amountSummaryValue}>
                    {currencySymbol}{registrationFee}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.bottomSection}>
            {!paymentResult && displayedError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#f87171" />
                <Text style={styles.errorText}>{displayedError}</Text>
              </View>
            ) : null}

            {paymentResult ? (
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={handleClose}
                {...({ onClick: handleClose } as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.payNowBtnText}>DONE</Text>
              </TouchableOpacity>
            ) : isBusy ? (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color="#fbbf24" />
                <Text style={styles.processingText}>PROCESSING PAYMENT AND REGISTRATION...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.payNowBtn, isBusy && styles.payNowBtnDisabled]}
                  onPress={handlePayNow}
                  {...({ onClick: handlePayNow } as any)}
                  disabled={isBusy}
                  activeOpacity={0.85}
                >
                  <Text style={styles.payNowBtnText}>
                    PAY {currencySymbol}{registrationFee}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClose}
                  {...({ onClick: handleClose } as any)}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={13} color="#94a3b8" />
                  <Text style={styles.cancelBtnText}>CANCEL AND GO BACK</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.secureCheckoutText}>SANDBOX CHECKOUT · CAMPUS QUEST</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardFrame: {
    width: '100%',
    maxWidth: 420,
    height: '96%',
    maxHeight: 740,
    backgroundColor: '#060d1b',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#1e2d48',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(184, 134, 11, 0.15)',
  },
  topCurtainsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 85,
    zIndex: 1,
  },
  moonContainer: {
    position: 'absolute',
    top: 36,
    right: 28,
    width: 46,
    height: 46,
    zIndex: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnDisabled: {
    opacity: 0.4,
  },
  scrollArea: {
    flex: 1,
    zIndex: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  brandText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
    fontFamily: 'Cinzel, Georgia, serif',
    marginBottom: 2,
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
    marginBottom: 8,
    alignItems: 'center',
  },
  paymentBadge: {
    backgroundColor: '#592e0f',
    borderWidth: 1.5,
    borderColor: '#b87c2b',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 20,
    marginTop: 2,
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.5)',
  },
  paymentBadgeText: {
    color: '#ffdf88',
    fontWeight: '800',
    fontSize: 12,
    fontFamily: 'Cinzel, Georgia, "Times New Roman", serif',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  sandboxStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(52, 211, 153, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.28)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  sandboxStripText: {
    color: '#a7f3d0',
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  eventCardDoubleBorder: {
    borderWidth: 1.5,
    borderColor: '#d4af37',
    borderRadius: 16,
    padding: 2.5,
    backgroundColor: '#050c18',
    marginBottom: 14,
    boxShadow: '0 0 12px rgba(212, 175, 55, 0.25)',
  },
  eventCardInner: {
    borderWidth: 1.2,
    borderColor: '#a17a26',
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#081324',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventDetailsCol: {
    flex: 1,
    paddingRight: 10,
  },
  eventTitleText: {
    color: '#f6c449',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Cinzel, Georgia, serif',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  eventMetaText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  eventPriceCol: {
    alignItems: 'flex-end',
  },
  eventPriceText: {
    color: '#f6c449',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, serif',
    letterSpacing: 0.5,
  },
  teamInputGroup: {
    marginBottom: 14,
  },
  teamInputLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  teamTextInput: {
    backgroundColor: '#091322',
    borderWidth: 1,
    borderColor: '#1e2d48',
    borderRadius: 10,
    color: '#f1f5f9',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instantPanel: {
    backgroundColor: '#081324',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    borderRadius: 16,
    padding: 14,
    marginTop: 2,
    marginBottom: 12,
    gap: 9,
    boxShadow: '0 0 18px rgba(212, 175, 55, 0.15)',
  },
  instantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 2,
  },
  instantIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instantHeaderText: {
    flex: 1,
  },
  instantTitle: {
    color: '#f8d363',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: 'Cinzel, Georgia, serif',
  },
  instantSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  instantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  instantRowText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  amountSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050c18',
    borderWidth: 1,
    borderColor: '#1e2d48',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  amountSummaryLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  amountSummaryValue: {
    color: '#f8d363',
    fontSize: 21,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  resultCard: {
    backgroundColor: '#081324',
    borderWidth: 1.5,
    borderColor: '#d4af37',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    boxShadow: '0 0 22px rgba(212, 175, 55, 0.18)',
  },
  resultIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIconVerified: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: '#34d399',
  },
  resultTitle: {
    color: '#f8d363',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  registrationConfirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  registrationConfirmedText: {
    color: '#34d399',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  resultSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  resultServerMessage: {
    color: '#a7f3d0',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  resultDetails: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e2d48',
    borderRadius: 12,
    backgroundColor: '#050c18',
    padding: 12,
    gap: 9,
    marginTop: 4,
  },
  resultDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultDetailLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  resultDetailValue: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  resultStatusPill: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'right',
  },
  resultStatusVerified: {
    color: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  resultNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.22)',
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },
  resultNoticeText: {
    color: '#cbd5e1',
    fontSize: 10.5,
    lineHeight: 15,
    flex: 1,
  },
  processingCard: {
    backgroundColor: '#081324',
    borderWidth: 1.5,
    borderColor: '#1e2d48',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  processingIconArea: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  processingIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    color: '#f8d363',
    fontSize: 23,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, serif',
    textAlign: 'center',
  },
  processingSubtitle: {
    color: '#cbd5e1',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  processingSteps: {
    width: '100%',
    backgroundColor: '#050c18',
    borderWidth: 1,
    borderColor: '#1e2d48',
    borderRadius: 12,
    padding: 12,
    gap: 9,
    marginTop: 18,
  },
  processingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingStepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
  },
  processingStepText: {
    color: '#cbd5e1',
    fontSize: 11,
    flex: 1,
  },
  processingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  processingStatusText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  processingNote: {
    color: '#94a3b8',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  bottomSection: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 6,
    backgroundColor: '#050b16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    flex: 1,
  },
  payNowBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#b85d0d',
    borderWidth: 2,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    marginTop: 10,
    boxShadow: '0 4px 18px rgba(245, 158, 11, 0.45)',
  },
  payNowBtnDisabled: {
    opacity: 0.65,
  },
  payNowBtnText: {
    color: '#fffbeb',
    fontSize: 17,
    fontWeight: '900',
    fontFamily: 'Cinzel, Georgia, serif',
    letterSpacing: 1,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    marginTop: 3,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  secureCheckoutText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'Cinzel, Georgia, serif',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '700',
    zIndex: 5,
  },
});
