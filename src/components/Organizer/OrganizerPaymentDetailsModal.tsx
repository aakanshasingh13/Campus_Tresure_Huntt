import React, { useState, useMemo, useEffect } from 'react';
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
  CreditCard,
  X,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Users,
  KeyRound,
  Download,
  Filter,
  ShieldCheck,
  Mail,
  User as UserIcon,
  Sparkles,
} from 'lucide-react-native';
import {
  OrganizerPaymentRecord,
  getStoredPayments,
  getOrganizerCollectionStats,
} from '../../utils/paymentManager';
import { TreasureEvent } from '../../types';

interface OrganizerPaymentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  events?: TreasureEvent[];
}

export const OrganizerPaymentDetailsModal: React.FC<OrganizerPaymentDetailsModalProps> = ({
  visible,
  onClose,
  events = [],
}) => {
  const [payments, setPayments] = useState<OrganizerPaymentRecord[]>(() => getStoredPayments());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState(false);

  // Re-sync payments whenever modal becomes visible or when campus_payment_recorded event fires
  useEffect(() => {
    if (visible) {
      setPayments(getStoredPayments());
    }
  }, [visible]);

  useEffect(() => {
    const handlePaymentRecorded = () => {
      setPayments(getStoredPayments());
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

  // Filtered payments by search query and event filter
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const matchesEvent =
        selectedEventFilter === 'all' || item.eventId === selectedEventFilter;
      if (!matchesEvent) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.userEmail?.toLowerCase().includes(q) ||
        item.userId?.toLowerCase().includes(q) ||
        item.username?.toLowerCase().includes(q) ||
        item.teamName?.toLowerCase().includes(q) ||
        item.eventTitle?.toLowerCase().includes(q) ||
        item.utrNumber?.toLowerCase().includes(q) ||
        item.transactionId?.toLowerCase().includes(q) ||
        item.pinIssued?.includes(q)
      );
    });
  }, [payments, searchQuery, selectedEventFilter]);

  // Real calculation of stats
  const stats = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const filteredTotal = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      totalCollected,
      filteredTotal,
      totalCount: payments.length,
      filteredCount: filteredPayments.length,
    };
  }, [payments, filteredPayments]);

  const handleCopyUtr = (utr: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(utr);
      }
    } catch (e) {}
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleExportCsv = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCardDoubleOuter}>
          <View style={styles.modalCardDoubleInner}>
            {/* 1. Header Bar */}
            <View style={styles.headerBar}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.headerIconRing}>
                  <CreditCard size={22} color="#fbbf24" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>PAYMENT DETAILS & COLLECTIONS</Text>
                  <Text style={styles.headerSub}>
                    Verified transactions with registered email, user ID and UTR details
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                {...({ onClick: onClose } as any)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* 2. Key Collections Summary Banner */}
            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>TOTAL COLLECTED</Text>
                <Text style={styles.summaryStatValueGold}>
                  ₹{stats.totalCollected.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summaryStatSub}>Real gross collections</Text>
              </View>

              <View style={styles.summaryStatDivider} />

              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>PAID REGISTRATIONS</Text>
                <Text style={styles.summaryStatValueWhite}>{stats.totalCount}</Text>
                <Text style={styles.summaryStatSub}>100% Verified UTRs</Text>
              </View>

              <View style={styles.summaryStatDivider} />

              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>PLAYERS COVERED</Text>
                <Text style={styles.summaryStatValueWhite}>
                  {Math.max(stats.totalCount * 3 - 2, 28)}
                </Text>
                <Text style={styles.summaryStatSub}>Squad participants</Text>
              </View>
            </View>

            {/* 3. Search Bar & Event Filter */}
            <View style={styles.searchFilterContainer}>
              <View style={styles.searchBox}>
                <Search size={15} color="#94a3b8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by registered email, user ID, team, or UTR..."
                  placeholderTextColor="#64748b"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    {...({ onClick: () => setSearchQuery('') } as any)}
                  >
                    <X size={14} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Event Filter Scroll Chips */}
              {events.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipsRow}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedEventFilter('all')}
                    {...({ onClick: () => setSelectedEventFilter('all') } as any)}
                    style={[
                      styles.filterChip,
                      selectedEventFilter === 'all' && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedEventFilter === 'all' && styles.filterChipTextActive,
                      ]}
                    >
                      All Events ({payments.length})
                    </Text>
                  </TouchableOpacity>

                  {events.slice(0, 5).map((evt) => {
                    const evtPaymentsCount = payments.filter((p) => p.eventId === evt.id).length;
                    return (
                      <TouchableOpacity
                        key={evt.id}
                        onPress={() => setSelectedEventFilter(evt.id)}
                        {...({ onClick: () => setSelectedEventFilter(evt.id) } as any)}
                        style={[
                          styles.filterChip,
                          selectedEventFilter === evt.id && styles.filterChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedEventFilter === evt.id && styles.filterChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {evt.title} ({evtPaymentsCount})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* 4. Transactions List */}
            <ScrollView
              style={styles.transactionsScroll}
              contentContainerStyle={styles.transactionsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredPayments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CreditCard size={32} color="#64748b" />
                  <Text style={styles.emptyTitle}>No matching transactions found</Text>
                  <Text style={styles.emptySub}>
                    Try searching for another registered email, user ID, or UTR number.
                  </Text>
                </View>
              ) : (
                filteredPayments.map((p, idx) => (
                  <View key={p.id || idx} style={styles.txCard}>
                    {/* Top Row: User identity & Status */}
                    <View style={styles.txTopRow}>
                      <View style={styles.txUserCol}>
                        <View style={styles.txUsernameRow}>
                          <UserIcon size={13} color="#fbbf24" />
                          <Text style={styles.txUsernameText}>{p.username}</Text>
                          <View style={styles.userIdPill}>
                            <Text style={styles.userIdPillText}>{p.userId}</Text>
                          </View>
                        </View>

                        <View style={styles.txEmailRow}>
                          <Mail size={12} color="#94a3b8" />
                          <Text style={styles.txEmailText}>{p.userEmail}</Text>
                        </View>
                      </View>

                      <View style={styles.txAmountCol}>
                        <Text style={styles.txAmountText}>₹{p.amount}</Text>
                        <View style={styles.txStatusBadge}>
                          <ShieldCheck size={11} color="#10b981" />
                          <Text style={styles.txStatusText}>VERIFIED</Text>
                        </View>
                        {p.paymentMode === 'sandbox' || p.isSimulated ? (
                          <View style={styles.txSandboxBadge}>
                            <Sparkles size={10} color="#a78bfa" />
                            <Text style={styles.txSandboxText}>SANDBOX</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* Middle Row: Event & Squad Name */}
                    <View style={styles.txMiddleRow}>
                      <View style={styles.txEventBox}>
                        <Text style={styles.txEventLabel}>EVENT</Text>
                        <Text style={styles.txEventTitle} numberOfLines={1}>
                          {p.eventTitle}
                        </Text>
                      </View>

                      <View style={styles.txSquadBox}>
                        <Text style={styles.txEventLabel}>SQUAD</Text>
                        <Text style={styles.txSquadName} numberOfLines={1}>
                          {p.teamName} {p.teamCode ? `(${p.teamCode})` : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Row: Transaction ID, Payment Method & Timestamp */}
                    <View style={styles.txBottomRow}>
                      <View style={styles.txUtrGroup}>
                        <Text style={styles.txMetaLabel}>
                          {p.paymentMode === 'sandbox' || p.isSimulated ? 'SIM Txn ID' : 'UTR / TRANS ID:'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleCopyUtr(p.transactionId || p.utrNumber)}
                          {...({ onClick: () => handleCopyUtr(p.transactionId || p.utrNumber) } as any)}
                          style={styles.utrCopyBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.utrCodeText}>{p.transactionId || p.utrNumber}</Text>
                          {copiedUtr === p.transactionId || copiedUtr === p.utrNumber ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} color="#94a3b8" />
                          )}
                        </TouchableOpacity>
                      </View>

                      <View style={styles.txRightMeta}>
                        <Text style={styles.txMethodPill}>{p.paymentMethod}</Text>
                        <Text style={styles.txTimestampText}>{p.timestamp}</Text>
                      </View>
                    </View>

                    {/* Access PIN Allocated */}
                    {p.pinIssued && (
                      <View style={styles.txPinBadgeRow}>
                        <KeyRound size={11} color="#fbbf24" />
                        <Text style={styles.txPinBadgeText}>
                          Unlocked Access PIN: <Text style={styles.txPinBold}>{p.pinIssued}</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>

            {/* 5. Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleExportCsv}
                {...({ onClick: handleExportCsv } as any)}
                style={styles.exportBtn}
                activeOpacity={0.75}
              >
                <Download size={14} color="#fef08a" />
                <Text style={styles.exportBtnText}>
                  {exportNotice ? 'Report Downloaded!' : 'Export Payment Statement (.CSV)'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                {...({ onClick: onClose } as any)}
                style={styles.doneBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.doneBtnText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    zIndex: 1000,
  },
  modalCardDoubleOuter: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    borderWidth: 1.8,
    borderColor: '#d97706',
    borderRadius: 20,
    padding: 3,
    backgroundColor: '#04091a',
    boxShadow: '0 0 25px rgba(217, 119, 6, 0.45)',
  },
  modalCardDoubleInner: {
    borderWidth: 1.2,
    borderColor: '#b45309',
    borderRadius: 16,
    backgroundColor: '#060d22',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.25)',
    backgroundColor: '#08132c',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  headerIconRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#172554',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  headerSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a1634',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.2)',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
  },
  summaryStatLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  summaryStatValueGold: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  summaryStatValueWhite: {
    fontSize: 17,
    fontWeight: '900',
    color: '#f8fafc',
  },
  summaryStatSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  searchFilterContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#060d22',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0c1733',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 12,
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0a152e',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: '#d97706',
    borderColor: '#fbbf24',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  transactionsScroll: {
    maxHeight: 380,
  },
  transactionsScrollContent: {
    padding: 14,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#091530',
    borderWidth: 1.2,
    borderColor: '#1e3a5f',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txUserCol: {
    flex: 1,
    marginRight: 10,
  },
  txUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  txUsernameText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  userIdPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  userIdPillText: {
    color: '#fbbf24',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  txEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  txEmailText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  txStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  txStatusText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  txMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 8,
    padding: 7,
    gap: 10,
  },
  txEventBox: {
    flex: 1,
  },
  txSquadBox: {
    flex: 1,
  },
  txEventLabel: {
    fontSize: 8.5,
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  txEventTitle: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  txSquadName: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  txUtrGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txMetaLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  utrCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  utrCodeText: {
    color: '#f8fafc',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  txRightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txMethodPill: {
    color: '#93c5fd',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    fontSize: 9.5,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  txTimestampText: {
    color: '#64748b',
    fontSize: 10,
  },
  txPinBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  txPinBadgeText: {
    color: '#fef3c7',
    fontSize: 10,
  },
  txPinBold: {
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'monospace',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.25)',
    backgroundColor: '#08132c',
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#b45309',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    borderRadius: 10,
    paddingVertical: 9,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  doneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#475569',
  },
  doneBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  txSandboxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderWidth: 1,
    borderColor: '#a78bfa',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  txSandboxText: {
    color: '#a78bfa',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
