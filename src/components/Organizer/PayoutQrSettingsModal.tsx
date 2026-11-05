import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  IndianRupee,
  Building,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { PaymentQrCode } from '../Player/PaymentQrCode';

interface PayoutQrSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  organizerName: string;
  initialUpiId?: string;
  onSaveUpiId?: (upiId: string) => void;
}

export const PayoutQrSettingsModal: React.FC<PayoutQrSettingsModalProps> = ({
  visible,
  onClose,
  organizerName,
  initialUpiId = 'campus.quest@oksbi',
  onSaveUpiId,
}) => {
  const [upiId, setUpiId] = useState(initialUpiId);
  const [payeeName, setPayeeName] = useState(organizerName || 'Campus Quest Organizer');
  const [accountType, setAccountType] = useState<'upi' | 'bank'>('upi');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [testAmount, setTestAmount] = useState('199');

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSave = () => {
    if (onSaveUpiId && upiId.trim()) {
      onSaveUpiId(upiId.trim());
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconWrap}>
                <QrCode size={20} color="#fbbf24" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Payout & QR Settings</Text>
                <Text style={styles.headerSub}>Manage registration fees and UPI collection</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Success toast */}
            {isSaved && (
              <View style={styles.toastSuccess}>
                <CheckCircle2 size={16} color="#10b981" />
                <Text style={styles.toastSuccessText}>Payout & QR settings saved successfully!</Text>
              </View>
            )}

            {/* Account Mode Switcher */}
            <View style={styles.modeTabsRow}>
              <TouchableOpacity
                onPress={() => setAccountType('upi')}
                style={[styles.modeTab, accountType === 'upi' && styles.modeTabActive]}
                activeOpacity={0.8}
              >
                <IndianRupee size={15} color={accountType === 'upi' ? '#fbbf24' : '#64748b'} />
                <Text style={[styles.modeTabText, accountType === 'upi' && styles.modeTabTextActive]}>
                  Instant UPI QR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAccountType('bank')}
                style={[styles.modeTab, accountType === 'bank' && styles.modeTabActive]}
                activeOpacity={0.8}
              >
                <Building size={15} color={accountType === 'bank' ? '#fbbf24' : '#64748b'} />
                <Text style={[styles.modeTabText, accountType === 'bank' && styles.modeTabTextActive]}>
                  Bank Account
                </Text>
              </TouchableOpacity>
            </View>

            {accountType === 'upi' ? (
              <>
                {/* UPI ID Form */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputCardLabel}>Organizer UPI Virtual Payment Address (VPA)</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholder="e.g. organizer@okhdfcbank"
                      placeholderTextColor="#64748b"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
                      {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#fbbf24" />}
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.inputHelper}>
                    Players will scan this QR to pay event registration tickets directly to your account.
                  </Text>
                </View>

                {/* Payee Display Name */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputCardLabel}>Payee Display Name on UPI Apps</Text>
                  <TextInput
                    style={styles.textInput}
                    value={payeeName}
                    onChangeText={setPayeeName}
                    placeholder="Campus Quest Organizer Committee"
                    placeholderTextColor="#64748b"
                  />
                </View>

                {/* Live QR Preview */}
                <View style={styles.qrPreviewCard}>
                  <View style={styles.qrHeaderRow}>
                    <Sparkles size={16} color="#fbbf24" />
                    <Text style={styles.qrHeaderTitle}>LIVE EVENT PAYMENT QR PREVIEW</Text>
                  </View>
                  <View style={styles.qrWrapper}>
                    <PaymentQrCode
                      upiId={upiId}
                      payeeName={payeeName}
                      amount={testAmount}
                      eventTitle="Campus Treasure Hunt"
                    />
                  </View>
                </View>
              </>
            ) : (
              /* Bank Settlement Info */
              <View style={styles.bankCard}>
                <View style={styles.bankNotice}>
                  <ShieldCheck size={20} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankNoticeTitle}>Direct Bank Wire Settlements</Text>
                    <Text style={styles.bankNoticeSub}>
                      All collected registration fees can be settled to your university club bank account weekly.
                    </Text>
                  </View>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputCardLabel}>Bank Account Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 50100492817291"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputCardLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. HDFC0001234"
                    placeholderTextColor="#64748b"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputCardLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Student Council / Event Club"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            )}

            {/* Settlement Summary Pill */}
            <View style={styles.settlementCard}>
              <View style={styles.settleRow}>
                <Text style={styles.settleLabel}>Platform Fee Rate</Text>
                <Text style={styles.settleValue}>0% (Free for Campus Clubs)</Text>
              </View>
              <View style={styles.settleRow}>
                <Text style={styles.settleLabel}>Instant Verification</Text>
                <Text style={[styles.settleValue, { color: '#10b981' }]}>Active via UTR Matching</Text>
              </View>
              <View style={styles.settleRow}>
                <Text style={styles.settleLabel}>Organizer Payout Status</Text>
                <Text style={[styles.settleValue, { color: '#fbbf24' }]}>Verified Merchant</Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
              <Check size={18} color="#0f172a" strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>Save Payout & QR Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#0a1024',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d97706',
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.3)',
    backgroundColor: 'rgba(4, 9, 22, 0.95)',
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  headerSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: "'Outfit', sans-serif",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    padding: 18,
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  toastSuccessText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#fbbf24',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  inputCard: {
    marginBottom: 14,
  },
  inputCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
    fontFamily: "'Outfit', sans-serif",
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
  },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHelper: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 15,
  },
  qrPreviewCard: {
    backgroundColor: 'rgba(4, 9, 22, 0.75)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  qrHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
    fontFamily: "'Outfit', sans-serif",
  },
  qrWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  bankCard: {
    marginBottom: 16,
  },
  bankNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bankNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  bankNoticeSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  settlementCard: {
    backgroundColor: 'rgba(4, 9, 22, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  settleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settleLabel: {
    fontSize: 11.5,
    color: '#94a3b8',
  },
  settleValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    marginBottom: 16,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
    fontFamily: "'Outfit', sans-serif",
  },
});
