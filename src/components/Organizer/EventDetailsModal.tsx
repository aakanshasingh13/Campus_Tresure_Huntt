import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Trophy,
  Users,
  KeyRound,
  Edit2,
  Compass,
  FileText,
  Shield,
  HelpCircle,
  Building2,
} from 'lucide-react-native';
import { TreasureEvent } from '../../types';

interface EventDetailsModalProps {
  visible: boolean;
  event: TreasureEvent | null;
  onEdit: (event: TreasureEvent) => void;
  onManageClues: (event: TreasureEvent) => void;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  visible,
  event,
  onEdit,
  onManageClues,
  onClose,
}) => {
  if (!visible || !event) return null;

  const eventPin = event.code || (event as any).eventCode || '849201';
  const eventDate = event.date || 'TBD';
  const eventTime = event.time || (event as any).startTime || '14:00';
  const eventEndTime = (event as any).endTime || '';
  const eventLocation = event.startLocation || (event as any).location || 'Campus Quad';
  const campusName = event.campusName || 'Main Campus';
  const eventDiff = event.difficulty || 'Medium';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.badgeRow}>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    event.status === 'active'
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }
                      : event.status === 'upcoming'
                      ? { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' }
                      : { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: '#94a3b8' },
                  ]}
                >
                  {event.status === 'active' && <View style={styles.greenPulseDot} />}
                  <Text
                    style={[
                      styles.statusBadgeText,
                      event.status === 'active'
                        ? { color: '#34d399' }
                        : event.status === 'upcoming'
                        ? { color: '#38bdf8' }
                        : { color: '#94a3b8' },
                    ]}
                  >
                    {event.status.toUpperCase()}
                  </Text>
                </View>

                {/* Difficulty */}
                <View
                  style={[
                    styles.diffBadge,
                    eventDiff.toLowerCase() === 'hard' || eventDiff.toLowerCase() === 'expert'
                      ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                      : eventDiff.toLowerCase() === 'medium' || eventDiff.toLowerCase() === 'master'
                      ? { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)' }
                      : { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.diffBadgeText,
                      eventDiff.toLowerCase() === 'hard' || eventDiff.toLowerCase() === 'expert'
                        ? { color: '#ef4444' }
                        : eventDiff.toLowerCase() === 'medium' || eventDiff.toLowerCase() === 'master'
                        ? { color: '#f59e0b' }
                        : { color: '#10b981' },
                    ]}
                  >
                    {eventDiff.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              {...({ onClick: onClose } as any)}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE CONTENT */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* JOIN PIN BANNER */}
            <View style={styles.pinBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} color="#38bdf8" />
                <View>
                  <Text style={styles.pinBannerLabel}>HUNTERS JOIN PIN</Text>
                  <Text style={styles.pinBannerSub}>Share with players to enter hunt</Text>
                </View>
              </View>
              <View style={styles.pinCodeBox}>
                <Text style={styles.pinCodeText}>{eventPin}</Text>
              </View>
            </View>

            {/* DESCRIPTION */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <FileText size={14} color="#fbbf24" />
                <Text style={styles.sectionTitle}>EVENT OVERVIEW</Text>
              </View>
              <Text style={styles.descriptionText}>
                {event.description || 'No description provided.'}
              </Text>
            </View>

            {/* EVENT SPECS GRID */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Calendar size={14} color="#fbbf24" />
                <Text style={styles.sectionTitle}>SCHEDULE & LOCATION</Text>
              </View>

              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Calendar size={13} color="#94a3b8" />
                  <View>
                    <Text style={styles.specLabel}>DATE</Text>
                    <Text style={styles.specValue}>{eventDate}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Clock size={13} color="#94a3b8" />
                  <View>
                    <Text style={styles.specLabel}>TIME & DURATION</Text>
                    <Text style={styles.specValue}>
                      {eventTime} {eventEndTime ? `- ${eventEndTime}` : ''} ({event.duration || '2 Hours'})
                    </Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Building2 size={13} color="#94a3b8" />
                  <View>
                    <Text style={styles.specLabel}>CAMPUS</Text>
                    <Text style={styles.specValue}>{campusName}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <MapPin size={13} color="#94a3b8" />
                  <View>
                    <Text style={styles.specLabel}>START LOCATION</Text>
                    <Text style={styles.specValue}>{eventLocation}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* GAMEPLAY RULES & PRIZES */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Shield size={14} color="#fbbf24" />
                <Text style={styles.sectionTitle}>RULES & PRIZES</Text>
              </View>

              <View style={styles.specsGrid}>
                <View style={styles.specItem}>
                  <Users size={13} color="#94a3b8" />
                  <View>
                    <Text style={styles.specLabel}>MAX TEAM SIZE</Text>
                    <Text style={styles.specValue}>{event.maxTeamSize || 4} Members</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <MapPin size={13} color="#94a3b8" />
                  <View>
                    <Text style={styles.specLabel}>RADIUS</Text>
                    <Text style={styles.specValue}>{event.boundaryRadiusMeters || 500} Meters</Text>
                  </View>
                </View>
              </View>

              {event.prizes ? (
                <View style={styles.prizeBox}>
                  <Trophy size={16} color="#fbbf24" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prizeLabel}>PRIZES & REWARDS</Text>
                    <Text style={styles.prizeValue}>{event.prizes}</Text>
                  </View>
                </View>
              ) : null}

              {event.additionalInfo ? (
                <View style={styles.rulesInfoBox}>
                  <Text style={styles.rulesInfoLabel}>ADDITIONAL RULES / GEAR:</Text>
                  <Text style={styles.rulesInfoValue}>{event.additionalInfo}</Text>
                </View>
              ) : null}
            </View>

            {/* CLUES LIST PREVIEW */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Compass size={14} color="#fbbf24" />
                <Text style={styles.sectionTitle}>
                  CLUES & RIDDLES ({event.clues ? event.clues.length : 0})
                </Text>
              </View>

              {event.clues && event.clues.length > 0 ? (
                <View style={styles.cluesList}>
                  {event.clues.map((c, index) => (
                    <View key={c.id || index} style={styles.clueCard}>
                      <View style={styles.clueNumberBadge}>
                        <Text style={styles.clueNumberText}>#{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <Text style={styles.clueTitleText}>{c.title || `Clue #${index + 1}`}</Text>
                          {c.points ? (
                            <View style={styles.cluePointsPill}>
                              <Text style={styles.cluePointsText}>+{c.points} XP</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.clueDescriptionText} numberOfLines={2}>
                          {c.description || (c as any).riddle || 'Solve riddle to advance'}
                        </Text>
                        {c.location ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <MapPin size={10} color="#94a3b8" />
                            <Text style={styles.clueLocText}>{c.location}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCluesBox}>
                  <HelpCircle size={20} color="#64748b" />
                  <Text style={styles.emptyCluesText}>No clues configured yet</Text>
                  <TouchableOpacity
                    onPress={() => onManageClues(event)}
                    {...({ onClick: () => onManageClues(event) } as any)}
                    style={styles.addCluesBtn}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={12} color="#0f172a" />
                    <Text style={styles.addCluesBtnText}>Add First Clue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => onManageClues(event)}
              {...({ onClick: () => onManageClues(event) } as any)}
              style={styles.manageCluesBtn}
              activeOpacity={0.8}
            >
              <Compass size={14} color="#fbbf24" />
              <Text style={styles.manageCluesBtnText}>Manage Clues</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onEdit(event)}
              {...({ onClick: () => onEdit(event) } as any)}
              style={styles.editEventBtn}
              activeOpacity={0.8}
            >
              <Edit2 size={14} color="#0f172a" strokeWidth={2.5} />
              <Text style={styles.editEventBtnText}>Edit Event</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 22,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  pinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pinBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  pinBannerSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  pinCodeBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pinCodeText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 2,
  },
  sectionBlock: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  descriptionText: {
    fontSize: 12.5,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '47%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  prizeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 10,
    padding: 10,
  },
  prizeLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  prizeValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#fef08a',
    marginTop: 1,
  },
  rulesInfoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  rulesInfoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  rulesInfoValue: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  cluesList: {
    gap: 8,
  },
  clueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
  },
  clueNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueNumberText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fbbf24',
  },
  clueTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  cluePointsPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cluePointsText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34d399',
  },
  clueDescriptionText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15,
  },
  clueLocText: {
    fontSize: 10,
    color: '#64748b',
  },
  emptyCluesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 10,
  },
  emptyCluesText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  addCluesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addCluesBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  manageCluesBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  manageCluesBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  editEventBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
  },
  editEventBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
});
