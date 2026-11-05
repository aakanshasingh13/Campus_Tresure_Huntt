import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  X,
  Check,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Trophy,
  Users,
  Shield,
  KeyRound,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { DifficultyLevel, TreasureEvent } from '../../types';

interface EditEventModalProps {
  visible: boolean;
  event: TreasureEvent | null;
  onSave: (updatedEvent: TreasureEvent) => void;
  onClose: () => void;
}

const DIFFICULTIES: DifficultyLevel[] = ['Easy', 'Medium', 'Hard', 'Master', 'Expert'];
const STATUS_OPTIONS: Array<'upcoming' | 'active' | 'completed'> = ['upcoming', 'active', 'completed'];

export const EditEventModal: React.FC<EditEventModalProps> = ({
  visible,
  event,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date || '');
  const [time, setTime] = useState(event?.time || (event as any)?.startTime || '14:00');
  const [duration, setDuration] = useState(event?.duration || '2 Hours');
  const [startLocation, setStartLocation] = useState(
    event?.startLocation || (event as any)?.location || 'Central Quad'
  );
  const [campusName, setCampusName] = useState(event?.campusName || 'Main Campus');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(event?.difficulty || 'Medium');
  const [status, setStatus] = useState<'upcoming' | 'active' | 'completed'>(event?.status || 'upcoming');
  const [code, setCode] = useState(event?.code || (event as any)?.eventCode || '849201');
  const [prizes, setPrizes] = useState(event?.prizes || '');
  const [maxTeamSize, setMaxTeamSize] = useState(String(event?.maxTeamSize || 4));
  const [boundaryRadiusMeters, setBoundaryRadiusMeters] = useState(
    String(event?.boundaryRadiusMeters || 500)
  );
  const [additionalInfo, setAdditionalInfo] = useState(event?.additionalInfo || '');
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize when a new event is selected for editing
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setDate(event.date || '');
      setTime(event.time || (event as any).startTime || '14:00');
      setDuration(event.duration || '2 Hours');
      setStartLocation(event.startLocation || (event as any).location || 'Central Quad');
      setCampusName(event.campusName || 'Main Campus');
      setDifficulty(event.difficulty || 'Medium');
      setStatus(event.status || 'upcoming');
      setCode(event.code || (event as any).eventCode || '849201');
      setPrizes(event.prizes || '');
      setMaxTeamSize(String(event.maxTeamSize || 4));
      setBoundaryRadiusMeters(String(event.boundaryRadiusMeters || 500));
      setAdditionalInfo(event.additionalInfo || '');
      setErrorMsg('');
    }
  }, [event]);

  if (!visible || !event) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMsg('Event Title is required.');
      return;
    }
    if (!date.trim()) {
      setErrorMsg('Date is required (YYYY-MM-DD).');
      return;
    }

    const updated: TreasureEvent = {
      ...event,
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      time: time.trim(),
      duration: duration.trim(),
      startLocation: startLocation.trim(),
      campusName: campusName.trim(),
      difficulty,
      status,
      code: code.trim(),
      prizes: prizes.trim(),
      maxTeamSize: parseInt(maxTeamSize, 10) || 4,
      boundaryRadiusMeters: parseInt(boundaryRadiusMeters, 10) || 500,
      additionalInfo: additionalInfo.trim(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* MODAL HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Edit Event Details</Text>
              <Text style={styles.headerSubtitle}>
                Update event schedule, campus location, difficulty & details
              </Text>
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

          {/* SCROLLABLE FORM */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={15} color="#ef4444" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* EVENT TITLE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EVENT TITLE *</Text>
              <TextInput
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setErrorMsg('');
                }}
                placeholder="e.g. The Great Belltower Mystery"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            {/* EVENT STATUS SELECTION */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EVENT STATUS</Text>
              <View style={styles.rowChoices}>
                {STATUS_OPTIONS.map((st) => {
                  const isActive = status === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setStatus(st)}
                      {...({ onClick: () => setStatus(st) } as any)}
                      style={[
                        styles.choicePill,
                        isActive && styles.choicePillActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          isActive && styles.choicePillTextActive,
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DIFFICULTY LEVEL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>DIFFICULTY LEVEL</Text>
              <View style={styles.rowChoices}>
                {DIFFICULTIES.map((d) => {
                  const isActive = difficulty === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setDifficulty(d)}
                      {...({ onClick: () => setDifficulty(d) } as any)}
                      style={[
                        styles.choicePill,
                        isActive && styles.choicePillActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          isActive && styles.choicePillTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DATE & TIME ROW */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <Calendar size={12} color="#94a3b8" />
                  <Text style={styles.label}>DATE (YYYY-MM-DD) *</Text>
                </View>
                <TextInput
                  value={date}
                  onChangeText={(d) => {
                    setDate(d);
                    setErrorMsg('');
                  }}
                  placeholder="2026-09-24"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.label}>TIME / DURATION</Text>
                </View>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="14:00"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>
            </View>

            {/* LOCATION & CAMPUS ROW */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <MapPin size={12} color="#94a3b8" />
                  <Text style={styles.label}>START LOCATION</Text>
                </View>
                <TextInput
                  value={startLocation}
                  onChangeText={setStartLocation}
                  placeholder="e.g. Central Quad Pavilion"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <Shield size={12} color="#94a3b8" />
                  <Text style={styles.label}>CAMPUS NAME</Text>
                </View>
                <TextInput
                  value={campusName}
                  onChangeText={setCampusName}
                  placeholder="e.g. Central University"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>
            </View>

            {/* PIN CODE & DURATION */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <KeyRound size={12} color="#fbbf24" />
                  <Text style={styles.label}>6-DIGIT JOIN PIN</Text>
                </View>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="849201"
                  placeholderTextColor="#64748b"
                  maxLength={8}
                  style={[styles.input, { letterSpacing: 2, fontWeight: '800' }]}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.label}>DURATION</Text>
                </View>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="2 Hours"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>
            </View>

            {/* PRIZES / REWARDS */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithIcon}>
                <Trophy size={12} color="#fbbf24" />
                <Text style={styles.label}>PRIZES / REWARDS</Text>
              </View>
              <TextInput
                value={prizes}
                onChangeText={setPrizes}
                placeholder="e.g. ₹2,000 Campus Voucher + Gold Trophies"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            {/* DESCRIPTION */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWithIcon}>
                <FileText size={12} color="#94a3b8" />
                <Text style={styles.label}>EVENT STORY & DESCRIPTION</Text>
              </View>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the hunt lore, meeting instructions, and clues..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* TEAM SIZE & BOUNDARY RADIUS */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <Users size={12} color="#94a3b8" />
                  <Text style={styles.label}>MAX TEAM SIZE</Text>
                </View>
                <TextInput
                  value={maxTeamSize}
                  onChangeText={setMaxTeamSize}
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={styles.labelWithIcon}>
                  <MapPin size={12} color="#94a3b8" />
                  <Text style={styles.label}>BOUNDARY RADIUS (METERS)</Text>
                </View>
                <TextInput
                  value={boundaryRadiusMeters}
                  onChangeText={setBoundaryRadiusMeters}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>
            </View>

            {/* RULES & ADDITIONAL INFO */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>RULES & ADDITIONAL GEAR</Text>
              <TextInput
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="e.g. Wear sneakers, bring student ID, phone camera required..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={2}
                style={[styles.input, styles.textArea]}
              />
            </View>
          </ScrollView>

          {/* FOOTER ACTIONS */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              {...({ onClick: onClose } as any)}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              {...({ onClick: handleSave } as any)}
              style={styles.saveBtn}
              activeOpacity={0.8}
            >
              <Check size={16} color="#0f172a" strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>Save Event Changes</Text>
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
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorBannerText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 13,
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rowChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  choicePillActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#f59e0b',
  },
  choicePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  choicePillTextActive: {
    color: '#0f172a',
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
  },
});
