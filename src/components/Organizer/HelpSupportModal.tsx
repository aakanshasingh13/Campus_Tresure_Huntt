import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  X,
  HelpCircle,
  BookOpen,
  MapPin,
  QrCode,
  ShieldAlert,
  Send,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Phone,
  Sparkles,
} from 'lucide-react-native';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
  organizerName: string;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  visible,
  onClose,
  organizerName,
}) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'guidelines' | 'contact'>('faq');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const handleSendTicket = () => {
    if (ticketSubject.trim() && ticketMessage.trim()) {
      setTicketSent(true);
      setTimeout(() => {
        setTicketSent(false);
        setTicketSubject('');
        setTicketMessage('');
      }, 3000);
    }
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
                <HelpCircle size={20} color="#fbbf24" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <Text style={styles.headerSub}>Organizer Handbook & Campus Master Help</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('faq')}
              style={[styles.tabBtn, activeTab === 'faq' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'faq' && styles.tabBtnTextActive]}>
                FAQ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('guidelines')}
              style={[styles.tabBtn, activeTab === 'guidelines' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'guidelines' && styles.tabBtnTextActive]}>
                Clue Rules
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('contact')}
              style={[styles.tabBtn, activeTab === 'contact' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'contact' && styles.tabBtnTextActive]}>
                Contact
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {activeTab === 'faq' && (
              <View style={styles.faqList}>
                <View style={styles.faqCard}>
                  <Text style={styles.faqQ}>How do players unlock checkpoints?</Text>
                  <Text style={styles.faqA}>
                    Players solve your clue riddle, locate the physical checkpoint on campus, and scan the unique QR code generated for that clue using their in-app scanner.
                  </Text>
                </View>

                <View style={styles.faqCard}>
                  <Text style={styles.faqQ}>What is the Event PIN for?</Text>
                  <Text style={styles.faqA}>
                    The 6-digit Event PIN acts as the participant ticket. Only players who enter the verified PIN (or complete the UPI registration fee) can view the clues.
                  </Text>
                </View>

                <View style={styles.faqCard}>
                  <Text style={styles.faqQ}>How do I print Clue QR codes?</Text>
                  <Text style={styles.faqA}>
                    Go to Manage Clues, click 'Print Checkpoint QRs', and print the high-resolution vector posters with weather-resistant stickers for campus placement.
                  </Text>
                </View>

                <View style={styles.faqCard}>
                  <Text style={styles.faqQ}>Can I track live player progress?</Text>
                  <Text style={styles.faqA}>
                    Yes! Switch to the Rankings tab to see real-time player leaderboards, scan timestamps, and hint usage counters.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'guidelines' && (
              <View style={styles.guideList}>
                <View style={styles.guideItem}>
                  <MapPin size={18} color="#fbbf24" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideTitle}>Public Access Checkpoints</Text>
                    <Text style={styles.guideDesc}>
                      Ensure all checkpoints are located in publicly accessible areas (libraries, quads, campus cafeterias, sports centers) with no restricted access zones.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideItem}>
                  <QrCode size={18} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideTitle}>Durable Checkpoint Placement</Text>
                    <Text style={styles.guideDesc}>
                      Laminate or place QR codes under clear tape at eye level. Test the QR scanner from 1-2 meters in both sunlight and evening lighting.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideItem}>
                  <ShieldAlert size={18} color="#f59e0b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guideTitle}>Campus Safety Protocols</Text>
                    <Text style={styles.guideDesc}>
                      Never place clues on construction sites, laboratory hazards, or heights requiring climbing. Maintain participant safety at all times.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'contact' && (
              <View style={styles.contactForm}>
                {ticketSent ? (
                  <View style={styles.ticketSuccess}>
                    <CheckCircle2 size={28} color="#10b981" />
                    <Text style={styles.ticketSuccessTitle}>Message Dispatched!</Text>
                    <Text style={styles.ticketSuccessSub}>
                      Campus Quest Admin Council will respond to {organizerName} within 2 hours.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.inputLabel}>Subject / In-Game Issue</Text>
                    <TextInput
                      style={styles.textInput}
                      value={ticketSubject}
                      onChangeText={setTicketSubject}
                      placeholder="e.g. Clue QR placement approval or UPI settlement"
                      placeholderTextColor="#64748b"
                    />

                    <Text style={styles.inputLabel}>Message Details</Text>
                    <TextInput
                      style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                      value={ticketMessage}
                      onChangeText={setTicketMessage}
                      placeholder="Describe your question, campus event date, or assistance needed..."
                      placeholderTextColor="#64748b"
                      multiline
                    />

                    <TouchableOpacity onPress={handleSendTicket} style={styles.sendBtn} activeOpacity={0.8}>
                      <Send size={16} color="#0f172a" />
                      <Text style={styles.sendBtnText}>Submit Support Ticket</Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.supportChannels}>
                  <View style={styles.channelRow}>
                    <Phone size={14} color="#fbbf24" />
                    <Text style={styles.channelText}>Emergency Organizer Hotline: +91 98765 43210</Text>
                  </View>
                  <View style={styles.channelRow}>
                    <MessageSquare size={14} color="#22c55e" />
                    <Text style={styles.channelText}>Campus Quest Organizers WhatsApp Group</Text>
                  </View>
                </View>
              </View>
            )}
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
    maxHeight: '88%',
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    backgroundColor: 'rgba(4, 9, 22, 0.6)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#fbbf24',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabBtnTextActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  scrollArea: {
    padding: 16,
  },
  faqList: {
    gap: 10,
    paddingBottom: 12,
  },
  faqCard: {
    backgroundColor: 'rgba(4, 9, 22, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    padding: 12,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 4,
    fontFamily: "'Outfit', sans-serif",
  },
  faqA: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  guideList: {
    gap: 12,
    paddingBottom: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(4, 9, 22, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  guideDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  contactForm: {
    paddingBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
    marginTop: 6,
    fontFamily: "'Outfit', sans-serif",
  },
  textInput: {
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    color: '#ffffff',
    marginBottom: 10,
    fontFamily: "'Outfit', sans-serif",
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', sans-serif",
  },
  ticketSuccess: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  ticketSuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  ticketSuccessSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  supportChannels: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelText: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
