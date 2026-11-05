import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import {
  Printer,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Compass,
  MapPin,
  FileText,
  QrCode,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Calendar,
  Check,
  Plus,
  Building2,
  GraduationCap,
  ArrowLeft,
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
import QRCode from 'qrcode';
import { Clue, ClueType, TreasureEvent } from '../../types';
import { ClueQrPrintModal } from './ClueQrPrintModal';
import { getClueBackupCode } from '../../utils/qrCheckpointHelper';
import { generateCollegeCampusClues, generateOfficeCampusClues } from '../../utils/clueGenerator';
import { COLLEGE_CAMPUS_DEFAULT_CLUES, CollegeClueDefinition } from '../../data/collegeClues';
import { OFFICE_CAMPUS_DEFAULT_CLUES, OfficeClueDefinition } from '../../data/officeClues';

interface ManageCluesModalProps {
  visible?: boolean;
  event: TreasureEvent;
  allEvents?: TreasureEvent[];
  onSelectEvent?: (selected: TreasureEvent) => void;
  onUpdateEvent: (updatedEvent: TreasureEvent) => void;
  onClose: () => void;
}

type TabMode = 'my-clues' | 'office-defaults' | 'college-defaults';

export const ManageCluesModal: React.FC<ManageCluesModalProps> = ({
  visible = true,
  event,
  allEvents = [],
  onSelectEvent,
  onUpdateEvent,
  onClose,
}) => {
  if (!visible) return null;

  // Filter valid events
  const availableEvents: TreasureEvent[] =
    allEvents && allEvents.length > 0
      ? allEvents.filter((e): e is TreasureEvent => Boolean(e && e.id))
      : event && event.id
      ? [event]
      : [];

  const [activeEventId, setActiveEventId] = useState<string>(
    event?.id || (availableEvents.length > 0 && availableEvents[0]?.id ? availableEvents[0].id : '')
  );

  useEffect(() => {
    if (event?.id) {
      setActiveEventId(event.id);
    } else if (availableEvents.length > 0 && availableEvents[0]?.id) {
      setActiveEventId(availableEvents[0].id);
    }
  }, [event?.id, availableEvents.length]);

  const currentEvent =
    availableEvents.find((e) => e && e.id === activeEventId) ||
    event ||
    availableEvents[0] ||
    null;

  const [clues, setClues] = useState<Clue[]>(currentEvent?.clues || []);
  const [activeTabMode, setActiveTabMode] = useState<TabMode>('my-clues');
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [editingClueId, setEditingClueId] = useState<string | null>(null);
  const [expandedClueId, setExpandedClueId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState<'office' | 'college' | null>(null);

  // QR Printout Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTargetClue, setPrintTargetClue] = useState<Clue | null>(null);

  const handleOpenPrintModal = (clue?: Clue | null) => {
    setPrintTargetClue(clue || null);
    setShowPrintModal(true);
  };

  useEffect(() => {
    if (currentEvent?.clues) {
      setClues(currentEvent.clues);
    } else {
      setClues([]);
    }
  }, [activeEventId, currentEvent]);

  // Form Fields for Add / Edit Screen
  const [title, setTitle] = useState('The Alchemist Lab');
  const [riddle, setRiddle] = useState('Where copper coils and test tubes shine.');
  const [locationHint, setLocationHint] = useState('Stanford Innovation Campus');
  const [placementNote, setPlacementNote] = useState('Tape the printout at the lab entrance');
  const [type, setType] = useState<ClueType>('qr_code');
  const [solution, setSolution] = useState('ANSWER');
  const [points, setPoints] = useState(200);
  const [backupKey, setBackupKey] = useState('CP03-KEY');
  const [hint1, setHint1] = useState('');
  const [hint2, setHint2] = useState('');
  const [liveQrDataUrl, setLiveQrDataUrl] = useState<string>('');

  // Generate real QR code for live preview on the Edit screen
  useEffect(() => {
    let isCancelled = false;
    async function genQr() {
      const payload = `CQ_CHECKPOINT:${currentEvent?.id || 'evt-101'}:${editingClueId || 'clue-3'}:${solution.trim().toUpperCase() || 'ANSWER'}`;
      try {
        const url = await QRCode.toDataURL(payload, {
          width: 240,
          margin: 1,
          color: { dark: '#020617', light: '#ffffff' },
        });
        if (!isCancelled) {
          setLiveQrDataUrl(url);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (showEditScreen) {
      genQr();
    }
    return () => {
      isCancelled = true;
    };
  }, [showEditScreen, solution, editingClueId, currentEvent?.id]);

  const resetForm = () => {
    setTitle('');
    setRiddle('');
    setLocationHint(currentEvent?.startLocation || currentEvent?.campusName || 'Campus Quad');
    setPlacementNote('');
    setType('qr_code');
    setSolution('ANSWER');
    setPoints(100);
    setBackupKey(`CP0${clues.length + 1}-KEY`);
    setHint1('');
    setHint2('');
    setEditingClueId(null);
    setShowTemplatePicker(null);
    setShowEditScreen(false);
  };

  const handleSwitchEvent = (targetEvent: TreasureEvent) => {
    setActiveEventId(targetEvent.id);
    setClues(targetEvent.clues || []);
    resetForm();
    setIsDropdownOpen(false);
    if (onSelectEvent) {
      onSelectEvent(targetEvent);
    }
  };

  const handleStartEdit = (clue: Clue, index: number) => {
    setEditingClueId(clue.id);
    setTitle(clue.title);
    setRiddle(clue.riddle);
    setLocationHint(clue.locationHint || currentEvent?.campusName || 'Stanford Innovation Campus');
    setPlacementNote(clue.placementNote || 'Tape the printout at the designated checkpoint location');
    setType(clue.type || 'qr_code');
    setSolution(clue.solution || 'ANSWER');
    setPoints(clue.points || 200);
    setBackupKey(clue.backupKey || getClueBackupCode(clue, index) || `CP0${index + 1}-KEY`);
    setHint1(clue.hint1 || '');
    setHint2(clue.hint2 || '');
    setShowTemplatePicker(null);
    setShowEditScreen(true);
  };

  const handleStartAddNewCustom = () => {
    setEditingClueId(null);
    setTitle(`Checkpoint #${clues.length + 1}`);
    setRiddle('Write the puzzle or poetic riddle leading to this location...');
    setLocationHint(currentEvent?.startLocation || currentEvent?.campusName || 'Stanford Innovation Campus');
    setPlacementNote('Place or tape printout securely at the checkpoint');
    setType('qr_code');
    setSolution('KEY');
    setPoints(150);
    setBackupKey(`CP0${clues.length + 1}-KEY`);
    setHint1('');
    setHint2('');
    setShowTemplatePicker(null);
    setShowAddChoiceModal(false);
    setShowEditScreen(true);
  };

  const handleSaveClue = () => {
    if (!currentEvent || !title.trim() || !riddle.trim()) return;

    if (editingClueId) {
      const updatedClues = clues.map((c) =>
        c.id === editingClueId
          ? {
              ...c,
              title: title.trim(),
              riddle: riddle.trim(),
              locationHint: locationHint.trim() || 'Campus area',
              placementNote: placementNote.trim(),
              type,
              solution: solution.trim().toUpperCase() || 'ANSWER',
              points: Number(points) || 100,
              backupKey: backupKey.trim() || c.backupKey || 'CP-KEY',
              hint1: hint1.trim(),
              hint2: hint2.trim(),
            }
          : c
      );
      setClues(updatedClues);
      onUpdateEvent({ ...currentEvent, clues: updatedClues });
    } else {
      const newClue: Clue = {
        id: `clue-${Date.now()}`,
        eventId: currentEvent.id,
        title: title.trim(),
        riddle: riddle.trim(),
        locationHint: locationHint.trim() || 'Campus area',
        placementNote: placementNote.trim(),
        type,
        solution: solution.trim().toUpperCase() || 'ANSWER',
        points: Number(points) || 100,
        order: clues.length + 1,
        backupKey: backupKey.trim() || `CP0${clues.length + 1}-KEY`,
        hint1: hint1.trim(),
        hint2: hint2.trim(),
        qrCodeValue: `CQ_CHECKPOINT:${currentEvent.id}:clue-${clues.length + 1}:${solution.trim().toUpperCase() || 'ANSWER'}`,
        coordinates: { lat: 37.4275, lng: -122.1697 },
      };

      const updatedClues = [...clues, newClue];
      setClues(updatedClues);
      onUpdateEvent({ ...currentEvent, clues: updatedClues });
    }

    resetForm();
  };

  const handleDeleteClue = (id: string) => {
    if (!currentEvent) return;
    const updatedClues = clues
      .filter((c) => c.id !== id)
      .map((c, i) => ({ ...c, order: i + 1 }));
    setClues(updatedClues);
    onUpdateEvent({ ...currentEvent, clues: updatedClues });
    if (editingClueId === id) {
      resetForm();
    }
  };

  const handleMoveClue = (index: number, direction: 'up' | 'down') => {
    if (
      !currentEvent ||
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === clues.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...clues];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));
    setClues(reordered);
    onUpdateEvent({ ...currentEvent, clues: reordered });
  };

  const toggleExpand = (id: string) => {
    setExpandedClueId((prev) => (prev === id ? null : id));
  };

  // Add individual default clue to quest
  const handleAddSingleDefaultClue = (
    def: OfficeClueDefinition | CollegeClueDefinition,
    category: 'office' | 'college'
  ) => {
    if (!currentEvent) return;
    const newOrder = clues.length + 1;
    const timestamp = Date.now();
    const campusName = currentEvent.campusName || (category === 'office' ? 'Corporate Office HQ' : 'Central Campus');
    const newClue: Clue = {
      id: `clue-${category}-${def.no}-${timestamp}`,
      eventId: currentEvent.id,
      title: def.title,
      riddle: def.riddle,
      locationHint: `${def.answerPlace} (${campusName})`,
      placementNote: def.placeInstruction,
      type: 'qr_code',
      solution: def.answerKey,
      answerKey: def.answerKey,
      points: def.points,
      order: newOrder,
      hint1: def.hint1 || '',
      hint2: def.hint2 || '',
      backupKey: `CP0${newOrder}-KEY`,
      qrCodeValue: `CQ_CHECKPOINT:${currentEvent.id}:clue-${newOrder}:${def.answerKey}`,
      coordinates: { lat: 37.4275, lng: -122.1697 },
    };

    const updatedClues = [...clues, newClue];
    setClues(updatedClues);
    onUpdateEvent({ ...currentEvent, clues: updatedClues });
  };

  // Customize a default clue before adding
  const handleCustomizeDefaultClue = (
    def: OfficeClueDefinition | CollegeClueDefinition,
    category: 'office' | 'college'
  ) => {
    setEditingClueId(null);
    setTitle(def.title);
    setRiddle(def.riddle);
    setLocationHint(
      `${def.answerPlace} (${currentEvent?.campusName || (category === 'office' ? 'Office HQ' : 'Main Campus')})`
    );
    setPlacementNote(def.placeInstruction);
    setType('qr_code');
    setSolution(def.answerKey);
    setPoints(def.points);
    setBackupKey(`CP0${clues.length + 1}-KEY`);
    setHint1(def.hint1 || '');
    setHint2(def.hint2 || '');
    setShowTemplatePicker(null);
    setShowAddChoiceModal(false);
    setShowEditScreen(true);
  };

  // Load full preset (Office or College)
  const handleLoadCollegeDefaults = (count: number) => {
    if (!currentEvent) return;
    const safeCount = Math.max(1, Math.min(10, count || 10));
    const defaultClues = generateCollegeCampusClues(
      currentEvent.id || 'evt-manage',
      safeCount,
      currentEvent.campusName || 'Main Campus'
    );
    setClues(defaultClues);
    onUpdateEvent({ ...currentEvent, clues: defaultClues });
    setActiveTabMode('my-clues');
  };

  const handleLoadOfficeDefaults = (count: number) => {
    if (!currentEvent) return;
    const safeCount = Math.max(1, Math.min(10, count || 10));
    const defaultClues = generateOfficeCampusClues(
      currentEvent.id || 'evt-manage',
      safeCount,
      currentEvent.campusName || 'Corporate Office HQ'
    );
    setClues(defaultClues);
    onUpdateEvent({ ...currentEvent, campusType: 'Office Campus', clues: defaultClues });
    setActiveTabMode('my-clues');
  };

  const isClueAlreadyAdded = (answerKey: string, titleStr: string) => {
    return clues.findIndex(
      (c) =>
        c.solution?.toUpperCase() === answerKey.toUpperCase() ||
        c.title?.toUpperCase() === titleStr.toUpperCase()
    );
  };

  const eventPIN = currentEvent?.code || (currentEvent as any)?.eventCode || '849201';
  const eventDate = currentEvent?.date || '2026-09-30';
  const eventStartLocation =
    currentEvent?.startLocation || currentEvent?.campusName || 'Central Quad Courtyard';
  const eventXP = (currentEvent as any)?.xp || `${clues.reduce((sum, c) => sum + (c.points || 100), 0)} XP`;

  const editingClueIndex = clues.findIndex((c) => c.id === editingClueId);
  const currentEditingClue: Clue = {
    id: editingClueId || (editingClueIndex !== -1 ? clues[editingClueIndex]?.id : 'clue-3'),
    eventId: currentEvent?.id || '',
    title: title || (editingClueIndex !== -1 ? clues[editingClueIndex]?.title : 'The Alchemist Lab'),
    riddle: riddle || (editingClueIndex !== -1 ? clues[editingClueIndex]?.riddle : 'Where copper coils and test tubes shine.'),
    locationHint: locationHint || currentEvent?.campusName || 'Stanford Innovation Campus',
    type,
    solution: solution || 'ANSWER',
    points: typeof points === 'number' ? points : parseInt(points as any, 10) || 200,
    order: editingClueIndex !== -1 ? editingClueIndex + 1 : clues.length + 1,
    backupKey: backupKey || (editingClueIndex !== -1 ? clues[editingClueIndex]?.backupKey : 'CP03-KEY') || `CP0${editingClueIndex !== -1 ? editingClueIndex + 1 : clues.length + 1}-KEY`,
    placementNote: placementNote || (editingClueIndex !== -1 ? clues[editingClueIndex]?.placementNote : 'Tape the printout at the lab entrance') || 'Tape the printout at the lab entrance',
    qrCodeValue: `CQ_CHECKPOINT:${currentEvent?.id}:clue-${editingClueIndex !== -1 ? editingClueIndex + 1 : clues.length + 1}:${solution || 'ANSWER'}`,
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          {/* PHONE DIALOG FRAME CONTAINER */}
          <View style={styles.phoneDialogCard}>
            {/* ATMOSPHERIC CAMPUS NIGHT BACKDROP */}
            <View style={styles.backdropFixed} pointerEvents="none">
              <Svg width="100%" height="100%" viewBox="0 0 412 860" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="bgNightModal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#040817" />
                    <Stop offset="25%" stopColor="#06132d" />
                    <Stop offset="55%" stopColor="#091b38" />
                    <Stop offset="75%" stopColor="#051024" />
                    <Stop offset="100%" stopColor="#020610" />
                  </LinearGradient>
                  <RadialGradient id="moonGlowModal" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <Stop offset="35%" stopColor="#bae6fd" stopOpacity="0.45" />
                    <Stop offset="70%" stopColor="#0284c7" stopOpacity="0.12" />
                    <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
                  </RadialGradient>
                  <RadialGradient id="lanternFlareModal" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                    <Stop offset="30%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <Stop offset="65%" stopColor="#b45309" stopOpacity="0.18" />
                    <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
                  </RadialGradient>
                </Defs>

                {/* Obsidian Night Sky */}
                <Rect width="412" height="860" fill="url(#bgNightModal)" />

                {/* Twinkling Stars */}
                <G fill="#ffffff">
                  <SvgCircle cx="35" cy="85" r="1.3" opacity="0.85" />
                  <SvgCircle cx="95" cy="55" r="1.6" opacity="0.9" />
                  <SvgCircle cx="150" cy="115" r="1.2" opacity="0.75" />
                  <SvgCircle cx="230" cy="140" r="1.4" opacity="0.8" />
                  <SvgCircle cx="320" cy="90" r="1.5" opacity="0.85" />
                  <SvgCircle cx="370" cy="170" r="1.2" opacity="0.7" />
                  <SvgCircle cx="75" cy="240" r="1.4" opacity="0.75" />
                  <SvgCircle cx="360" cy="270" r="1.3" opacity="0.8" />
                  <SvgCircle cx="120" cy="300" r="1.1" opacity="0.65" />
                  <SvgCircle cx="280" cy="320" r="1.3" opacity="0.7" />
                  <SvgCircle cx="50" cy="490" r="1.2" opacity="0.7" />
                  <SvgCircle cx="360" cy="510" r="1.4" opacity="0.75" />
                </G>

                {/* Glowing Moon with Radiant Aura at Upper Right */}
                <SvgCircle cx="340" cy="95" r="38" fill="url(#moonGlowModal)" />
                <Path
                  d="M 330 70 A 24 24 0 1 0 358 114 A 21 21 0 0 1 330 70 Z"
                  fill="#fef08a"
                  opacity="0.95"
                />

                {/* Top Forest Canopy Silhouettes */}
                <Path
                  d="M -20 -10 Q 60 40 140 15 Q 220 45 300 20 Q 370 45 440 10 L 440 120 Q 360 140 280 120 Q 180 140 100 125 Q 30 135 -20 118 Z"
                  fill="#061e13"
                />
                <Path
                  d="M -20 -10 Q 70 30 160 10 Q 250 35 340 12 L 440 8 L 440 100 Q 340 120 240 105 Q 140 120 -20 105 Z"
                  fill="#0b2e1c"
                  opacity="0.85"
                />

                {/* Street Lantern on Left */}
                <SvgCircle cx="45" cy="690" r="42" fill="url(#lanternFlareModal)" />
                <Rect x="43" y="680" width="4" height="130" fill="#030712" />
                <Rect x="37" y="670" width="16" height="24" rx="3" fill="#facc15" stroke="#78350f" strokeWidth="2" />
                <Polygon points="33,670 45,655 57,670" fill="#0f172a" />
                <SvgCircle cx="45" cy="682" r="6" fill="#fef08a" />

                {/* Gothic Castle Silhouette with Illuminated Windows at bottom */}
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

            {/* MAIN CONTENT WRAPPER */}
            <View style={styles.modalCardWrapper}>
              {showEditScreen ? (
                /* ======================================================== */
                /* EDIT / CREATE CLUE SCREEN                                */
                /* ======================================================== */
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  {/* Top Header */}
                  <View style={styles.topHeaderBar}>
                    <TouchableOpacity
                      onPress={resetForm}
                      style={styles.circleCloseBtn}
                      activeOpacity={0.75}
                    >
                      <ArrowLeft size={18} color="#ffffff" strokeWidth={2.2} />
                    </TouchableOpacity>

                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={styles.mainTitleText} numberOfLines={1}>
                        {editingClueId
                          ? `EDIT CLUE #${editingClueIndex !== -1 ? editingClueIndex + 1 : 1}`
                          : `CREATE CLUE #${clues.length + 1}`}
                      </Text>
                      <Text style={styles.mainSubtitleText} numberOfLines={1}>
                        {currentEvent?.title || 'The Great Belltower Mystery'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={resetForm}
                      style={styles.circleCloseBtn}
                      activeOpacity={0.75}
                    >
                      <X size={18} color="#ffffff" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>

                  {/* Scrollable Form Content */}
                  <ScrollView
                    style={styles.scrollStage}
                    contentContainerStyle={styles.scrollStageContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* OPTIONAL TEMPLATE SELECTOR: CHOOSE A DEFAULT CLUE */}
                    <View style={styles.templatePickerCard}>
                      <View style={styles.templatePickerHeader}>
                        <Sparkles size={14} color="#fbbf24" />
                        <Text style={styles.templatePickerTitle}>
                          CHOOSE FROM DEFAULT CLUES (OR TYPE YOUR OWN)
                        </Text>
                      </View>
                      <Text style={styles.templatePickerSub}>
                        Tap below to prefill from ready-made Office or College clues, then edit any text!
                      </Text>

                      <View style={styles.templateButtonsRow}>
                        <TouchableOpacity
                          onPress={() =>
                            setShowTemplatePicker(showTemplatePicker === 'office' ? null : 'office')
                          }
                          style={[
                            styles.templateOptionBtn,
                            showTemplatePicker === 'office' && styles.templateOptionBtnActiveOffice,
                          ]}
                          activeOpacity={0.8}
                        >
                          <Building2 size={13} color="#38bdf8" />
                          <Text style={styles.templateOptionBtnText}>
                            🏢 Office Defaults (10) ▾
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            setShowTemplatePicker(showTemplatePicker === 'college' ? null : 'college')
                          }
                          style={[
                            styles.templateOptionBtn,
                            showTemplatePicker === 'college' && styles.templateOptionBtnActiveCollege,
                          ]}
                          activeOpacity={0.8}
                        >
                          <GraduationCap size={13} color="#fde047" />
                          <Text style={styles.templateOptionBtnText}>
                            🎓 College Defaults (10) ▾
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Dropdown list of clues for selected category */}
                      {showTemplatePicker && (
                        <View style={styles.templateDropdownList}>
                          <Text style={styles.templateDropdownHeader}>
                            Select a clue to load its riddle & solution:
                          </Text>
                          {(showTemplatePicker === 'office'
                            ? OFFICE_CAMPUS_DEFAULT_CLUES
                            : COLLEGE_CAMPUS_DEFAULT_CLUES
                          ).map((def) => (
                            <TouchableOpacity
                              key={`tmpl-${def.no}`}
                              onPress={() => {
                                setTitle(def.title);
                                setRiddle(def.riddle);
                                setLocationHint(
                                  `${def.answerPlace} (${currentEvent?.campusName || (showTemplatePicker === 'office' ? 'Office Floor HQ' : 'Central Campus')})`
                                );
                                setPlacementNote(def.placeInstruction);
                                setSolution(def.answerKey);
                                setPoints(def.points);
                                setHint1(def.hint1 || '');
                                setHint2(def.hint2 || '');
                                setShowTemplatePicker(null);
                              }}
                              style={styles.templateDropdownItem}
                              activeOpacity={0.7}
                            >
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.templateDropdownItemTitle}>
                                  #{def.no} {def.title} · {def.answerKey}
                                </Text>
                                <Text style={styles.templateDropdownItemSub} numberOfLines={1}>
                                  "{def.riddle}"
                                </Text>
                              </View>
                              <View style={styles.templateDropdownItemPoints}>
                                <Text style={styles.templateDropdownItemPointsText}>
                                  {def.points} pts
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* TOP CHECKPOINT QR CARD */}
                    <View style={styles.editQrCard}>
                      <View style={styles.editQrWhiteBox}>
                        {liveQrDataUrl ? (
                          <Image source={{ uri: liveQrDataUrl }} style={styles.editQrImage} />
                        ) : (
                          <QrCode size={56} color="#0f172a" />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.editQrHeading}>CHECKPOINT QR</Text>
                        <Text style={styles.editQrSub}>
                          Auto-generated for answer: <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{solution || 'ANSWER'}</Text>
                        </Text>

                        <TouchableOpacity
                          onPress={() => handleOpenPrintModal(currentEditingClue)}
                          style={styles.printThisQrBtn}
                          activeOpacity={0.8}
                        >
                          <Printer size={13} color="#ffffff" strokeWidth={2.2} />
                          <Text style={styles.printThisQrBtnText}>PRINT THIS QR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* EDIT FORM FIELDS */}
                    <View style={styles.editFormCard}>
                      {/* Clue Title */}
                      <View style={styles.editFieldBlock}>
                        <Text style={styles.editFieldLabel}>CLUE TITLE</Text>
                        <TextInput
                          value={title}
                          onChangeText={setTitle}
                          placeholder="e.g. THE KEY KEEPER"
                          placeholderTextColor="#64748b"
                          style={styles.editTextInput}
                        />
                      </View>

                      {/* Type Pills */}
                      <View style={styles.editTypePillsRow}>
                        <TouchableOpacity
                          onPress={() => setType('qr_code')}
                          style={[
                            styles.editTypePill,
                            type === 'qr_code' && styles.editTypePillActive,
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.editTypePillText,
                              type === 'qr_code' && styles.editTypePillTextActive,
                            ]}
                          >
                            QR Code Checkpoint
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setType('gps')}
                          style={[
                            styles.editTypePill,
                            type === 'gps' && styles.editTypePillActive,
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.editTypePillText,
                              type === 'gps' && styles.editTypePillTextActive,
                            ]}
                          >
                            GPS Checkpoint
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Riddle */}
                      <View style={styles.editFieldBlock}>
                        <Text style={styles.editFieldLabel}>RIDDLE PLAYERS READ</Text>
                        <TextInput
                          value={riddle}
                          onChangeText={setRiddle}
                          placeholder="Write the riddle or poem..."
                          placeholderTextColor="#64748b"
                          multiline
                          numberOfLines={3}
                          style={[styles.editTextInput, styles.editTextArea]}
                        />
                      </View>

                      {/* Checkpoint Location */}
                      <View style={styles.editFieldBlock}>
                        <Text style={styles.editFieldLabel}>CHECKPOINT LOCATION (HINT)</Text>
                        <TextInput
                          value={locationHint}
                          onChangeText={setLocationHint}
                          placeholder="e.g. Workstation Bay A / Central Library"
                          placeholderTextColor="#64748b"
                          style={styles.editTextInput}
                        />
                      </View>

                      {/* Placement Note */}
                      <View style={styles.editFieldBlock}>
                        <Text style={styles.editFieldLabel}>PLACEMENT NOTE (ORGANIZER ONLY)</Text>
                        <TextInput
                          value={placementNote}
                          onChangeText={setPlacementNote}
                          placeholder="e.g. Tape printout under keyboard or door entrance"
                          placeholderTextColor="#64748b"
                          style={styles.editTextInput}
                        />
                      </View>

                      {/* Answer Key & Points */}
                      <View style={styles.editTwoColRow}>
                        <View style={{ flex: 1.4 }}>
                          <Text style={styles.editFieldLabel}>ANSWER KEY</Text>
                          <TextInput
                            value={solution}
                            onChangeText={setSolution}
                            placeholder="ANSWER"
                            placeholderTextColor="#64748b"
                            autoCapitalize="characters"
                            style={[styles.editTextInput, styles.editTextInputAnswerKey]}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.editFieldLabel}>POINTS</Text>
                          <TextInput
                            value={String(points)}
                            onChangeText={(val) =>
                              setPoints(Number(val.replace(/[^0-9]/g, '')) || 100)
                            }
                            placeholder="100"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            style={styles.editTextInput}
                          />
                        </View>
                      </View>

                      {/* Manual Backup Key */}
                      <View style={styles.editFieldBlock}>
                        <Text style={styles.editFieldLabel}>MANUAL BACKUP KEY</Text>
                        <TextInput
                          value={backupKey}
                          onChangeText={setBackupKey}
                          placeholder="CP01-KEY"
                          placeholderTextColor="#64748b"
                          autoCapitalize="characters"
                          style={styles.editTextInput}
                        />
                      </View>
                    </View>
                  </ScrollView>

                  {/* BOTTOM BUTTONS ROW: CANCEL & SAVE CLUE */}
                  <View style={styles.bottomButtonsRow}>
                    <TouchableOpacity
                      onPress={resetForm}
                      style={styles.addClueLargeBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addClueLargeBtnText}>CANCEL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveClue}
                      style={styles.doneCloseLargeBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.doneCloseLargeBtnText}>SAVE CLUE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ======================================================== */
                /* MAIN CLUES MANAGEMENT SCREEN                             */
                /* ======================================================== */
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  {/* TOP HEADER BAR */}
                  <View style={styles.topHeaderBar}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mainTitleText}>CLUES & CHECKPOINTS</Text>
                      <Text style={styles.mainSubtitleText}>
                        Manage default presets or craft custom riddles
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.circleCloseBtn}
                      activeOpacity={0.75}
                    >
                      <X size={18} color="#ffffff" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </View>

                  {/* SCROLLABLE CONTENT */}
                  <ScrollView
                    style={styles.scrollStage}
                    contentContainerStyle={styles.scrollStageContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* 1. UNIFIED SLEEK EVENT HERO CARD (NO DUPLICATION) */}
                    <View style={styles.eventHeroCard}>
                      <TouchableOpacity
                        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={styles.eventTitleRow}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={styles.eventHeroPillRow}>
                            <View style={styles.managingPinPill}>
                              <Text style={styles.managingPinPillText}>PIN {eventPIN}</Text>
                            </View>
                            <Text style={styles.eventHeroSubLabel}>MANAGING QUEST</Text>
                          </View>
                          <Text style={styles.eventHeroTitleText} numberOfLines={1}>
                            {currentEvent?.title?.toUpperCase() || 'THE GREAT BELLTOWER MYSTERY'}
                          </Text>
                        </View>
                        <View style={styles.eventSwitchChevronPill}>
                          <Text style={styles.eventSwitchChevronPillText}>
                            {availableEvents.length > 1
                              ? `${availableEvents.length} EVENTS ▾`
                              : 'ACTIVE'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Dropdown list if opened */}
                      {isDropdownOpen && (
                        <View style={styles.dropdownContainerBox}>
                          {availableEvents.map((ev) => {
                            const isSelected = ev.id === currentEvent?.id;
                            return (
                              <TouchableOpacity
                                key={ev.id}
                                onPress={() => handleSwitchEvent(ev)}
                                style={[
                                  styles.dropdownItemRow,
                                  isSelected && styles.dropdownItemRowActive,
                                ]}
                                activeOpacity={0.8}
                              >
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      styles.dropdownItemTitle,
                                      isSelected && styles.dropdownItemTitleActive,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {ev.title}
                                  </Text>
                                  <Text style={styles.dropdownItemMeta}>
                                    PIN: {ev.code || '849201'} · {ev.clues?.length || 0} clues
                                  </Text>
                                </View>
                                {isSelected && <Check size={16} color="#fbbf24" />}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* Metadata Chips: Date, Start Point, Clues & XP */}
                      <View style={styles.eventHeroMetaRow}>
                        <View style={styles.eventMetaPill}>
                          <Calendar size={11} color="#fbbf24" />
                          <Text style={styles.eventMetaPillText}>{eventDate}</Text>
                        </View>
                        <View style={[styles.eventMetaPill, { flex: 1 }]}>
                          <MapPin size={11} color="#38bdf8" />
                          <Text style={styles.eventMetaPillText} numberOfLines={1}>
                            {eventStartLocation}
                          </Text>
                        </View>
                        <View style={styles.eventMetaPill}>
                          <Sparkles size={11} color="#4ade80" />
                          <Text style={styles.eventMetaPillText}>
                            {clues.length} Clues · {eventXP}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 2. THREE-WAY MODE TABS: QUEST CLUES | OFFICE DEFAULTS | COLLEGE DEFAULTS */}
                    <View style={styles.tabsNavRow}>
                      <TouchableOpacity
                        onPress={() => setActiveTabMode('my-clues')}
                        style={[
                          styles.tabNavBtn,
                          activeTabMode === 'my-clues' && styles.tabNavBtnActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.tabNavBtnText,
                            activeTabMode === 'my-clues' && styles.tabNavBtnTextActive,
                          ]}
                        >
                          🎯 Quest Clues ({clues.length})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setActiveTabMode('office-defaults')}
                        style={[
                          styles.tabNavBtn,
                          activeTabMode === 'office-defaults' && styles.tabNavBtnActiveOffice,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.tabNavBtnText,
                            activeTabMode === 'office-defaults' && styles.tabNavBtnTextActiveOffice,
                          ]}
                        >
                          🏢 Office (10)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setActiveTabMode('college-defaults')}
                        style={[
                          styles.tabNavBtn,
                          activeTabMode === 'college-defaults' && styles.tabNavBtnActiveCollege,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.tabNavBtnText,
                            activeTabMode === 'college-defaults' && styles.tabNavBtnTextActiveCollege,
                          ]}
                        >
                          🎓 College (10)
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* ======================================================== */}
                    {/* TAB 1: ACTIVE QUEST CLUES                                */}
                    {/* ======================================================== */}
                    {activeTabMode === 'my-clues' && (
                      <View>
                        {/* Clues Header Action Bar */}
                        <View style={styles.cluesHeaderRow}>
                          <Text style={styles.cluesHeadingText}>
                            CLUES ({clues.length})
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity
                              onPress={() => setShowAddChoiceModal(true)}
                              style={styles.addClueHeaderBtn}
                              activeOpacity={0.8}
                            >
                              <Plus size={13} color="#ffffff" strokeWidth={2.5} />
                              <Text style={styles.addClueHeaderBtnText}>ADD CLUE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleOpenPrintModal(null)}
                              style={styles.printAllQrsBtn}
                              activeOpacity={0.8}
                            >
                              <Printer size={13} color="#ffffff" strokeWidth={2.2} />
                              <Text style={styles.printAllQrsBtnText}>PRINT ALL</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Clues List or Empty State */}
                        {clues.length === 0 ? (
                          <View style={styles.emptyCluesBox}>
                            <Compass size={36} color="#fbbf24" strokeWidth={1.5} />
                            <Text style={styles.emptyCluesTitle}>No clues in this quest yet</Text>
                            <Text style={styles.emptyCluesSub}>
                              Choose from default Office/College clues or craft your own from scratch!
                            </Text>

                            <View style={styles.emptyActionsContainer}>
                              <View style={styles.emptyPresetsRow}>
                                <TouchableOpacity
                                  onPress={() => setActiveTabMode('office-defaults')}
                                  style={styles.emptyPresetBtn}
                                  activeOpacity={0.8}
                                >
                                  <Building2 size={13} color="#38bdf8" />
                                  <Text style={[styles.emptyPresetBtnText, { color: '#38bdf8' }]}>
                                    🏢 Office Clues
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={() => setActiveTabMode('college-defaults')}
                                  style={[styles.emptyPresetBtn, { borderColor: '#fbbf24' }]}
                                  activeOpacity={0.8}
                                >
                                  <GraduationCap size={13} color="#fde047" />
                                  <Text style={[styles.emptyPresetBtnText, { color: '#fbbf24' }]}>
                                    🎓 College Clues
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <TouchableOpacity
                                onPress={handleStartAddNewCustom}
                                style={styles.emptyCustomBtn}
                                activeOpacity={0.8}
                              >
                                <Plus size={14} color="#4ade80" strokeWidth={2.4} />
                                <Text style={styles.emptyCustomBtnText}>
                                  + Create Your Own Clue
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          clues.map((clue, idx) => {
                            const isExpanded = expandedClueId === clue.id;
                            return (
                              <View key={clue.id || idx} style={styles.parchmentClueCard}>
                                {/* Top Row: # Badge + Title + Action Buttons */}
                                <View style={styles.parchmentTopRow}>
                                  <View style={styles.parchmentBadgeBox}>
                                    <Text style={styles.parchmentBadgeText}>#{idx + 1}</Text>
                                  </View>

                                  <Text style={styles.parchmentTitleText} numberOfLines={1}>
                                    {clue.title.toUpperCase()}
                                  </Text>

                                  <View style={styles.parchmentActionsGroup}>
                                    {/* 1. Edit */}
                                    <TouchableOpacity
                                      onPress={() => handleStartEdit(clue, idx)}
                                      style={styles.parchmentActionBtn}
                                      activeOpacity={0.7}
                                    >
                                      <Edit2 size={13} color="#451a03" />
                                    </TouchableOpacity>

                                    {/* 2. Print */}
                                    <TouchableOpacity
                                      onPress={() => handleOpenPrintModal(clue)}
                                      style={styles.parchmentActionBtn}
                                      activeOpacity={0.7}
                                    >
                                      <Printer size={13} color="#451a03" />
                                    </TouchableOpacity>

                                    {/* 3. Delete */}
                                    <TouchableOpacity
                                      onPress={() => handleDeleteClue(clue.id)}
                                      style={[styles.parchmentActionBtn, styles.parchmentActionBtnDelete]}
                                      activeOpacity={0.7}
                                    >
                                      <Trash2 size={13} color="#dc2626" />
                                    </TouchableOpacity>

                                    {/* 4. Move Up */}
                                    <TouchableOpacity
                                      onPress={() => handleMoveClue(idx, 'up')}
                                      disabled={idx === 0}
                                      style={[
                                        styles.parchmentActionBtn,
                                        idx === 0 && { opacity: 0.3 },
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <ChevronUp size={14} color="#451a03" />
                                    </TouchableOpacity>

                                    {/* 5. Move Down */}
                                    <TouchableOpacity
                                      onPress={() => handleMoveClue(idx, 'down')}
                                      disabled={idx === clues.length - 1}
                                      style={[
                                        styles.parchmentActionBtn,
                                        idx === clues.length - 1 && { opacity: 0.3 },
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <ChevronDown size={14} color="#451a03" />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                {/* Riddle Quote */}
                                <Text style={styles.parchmentRiddleText}>
                                  "{clue.riddle}"
                                </Text>

                                {/* Bottom Row: Points, Key, QR Sheet, Expand Chevron */}
                                <View style={styles.parchmentBottomRow}>
                                  <View style={styles.parchmentPill}>
                                    <Text style={styles.parchmentPillText}>{clue.points || 100} pts</Text>
                                  </View>

                                  <View style={styles.parchmentPill}>
                                    <Text style={styles.parchmentPillText}>
                                      Key: {clue.solution || 'ANSWER'}
                                    </Text>
                                  </View>

                                  <TouchableOpacity
                                    onPress={() => handleOpenPrintModal(clue)}
                                    style={[styles.parchmentPill, styles.parchmentPillQr]}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={styles.parchmentPillText}>QR Sheet</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => toggleExpand(clue.id)}
                                    style={styles.parchmentExpandBtn}
                                    activeOpacity={0.7}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp size={14} color="#451a03" />
                                    ) : (
                                      <ChevronDown size={14} color="#451a03" />
                                    )}
                                  </TouchableOpacity>
                                </View>

                                {/* Expanded Details Drawer */}
                                {isExpanded && (
                                  <View style={styles.parchmentExpandedDetails}>
                                    <View style={styles.expandedDetailRow}>
                                      <MapPin size={13} color="#78350f" />
                                      <Text style={styles.expandedDetailText}>
                                        Location: {clue.locationHint || 'Not specified'}
                                      </Text>
                                    </View>
                                    {clue.placementNote ? (
                                      <View style={styles.expandedDetailRow}>
                                        <FileText size={13} color="#78350f" />
                                        <Text style={styles.expandedDetailText}>
                                          Placement: {clue.placementNote}
                                        </Text>
                                      </View>
                                    ) : null}
                                    {clue.backupKey ? (
                                      <View style={styles.expandedDetailRow}>
                                        <KeyRound size={13} color="#78350f" />
                                        <Text style={styles.expandedDetailText}>
                                          Manual Backup Key: {clue.backupKey}
                                        </Text>
                                      </View>
                                    ) : null}
                                    {clue.hint1 ? (
                                      <View style={styles.expandedDetailRow}>
                                        <Sparkles size={13} color="#78350f" />
                                        <Text style={styles.expandedDetailText}>
                                          Hint 1: {clue.hint1}
                                        </Text>
                                      </View>
                                    ) : null}
                                    {clue.hint2 ? (
                                      <View style={styles.expandedDetailRow}>
                                        <Sparkles size={13} color="#78350f" />
                                        <Text style={styles.expandedDetailText}>
                                          Hint 2: {clue.hint2}
                                        </Text>
                                      </View>
                                    ) : null}
                                    <View style={styles.expandedDetailRow}>
                                      <QrCode size={13} color="#78350f" />
                                      <Text style={styles.expandedDetailText} numberOfLines={1}>
                                        QR Payload: {clue.qrCodeValue || 'Default'}
                                      </Text>
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 2: OFFICE DEFAULT CLUES CATALOG                      */}
                    {/* ======================================================== */}
                    {activeTabMode === 'office-defaults' && (
                      <View>
                        {/* Catalog Header Card */}
                        <View style={styles.catalogHeroCard}>
                          <View style={styles.catalogHeroTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Building2 size={16} color="#38bdf8" />
                              <Text style={[styles.catalogHeroTitle, { color: '#38bdf8' }]}>
                                OFFICE CAMPUS DEFAULTS
                              </Text>
                            </View>
                            <View style={styles.catalogCountBadge}>
                              <Text style={[styles.catalogCountBadgeText, { color: '#38bdf8' }]}>
                                10 CLUES
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.catalogHeroSub}>
                            Curated riddles for office environments (keyboard, printer, router, break room, pantry, water cooler, cabinets & meeting rooms).
                          </Text>

                          {/* Quick Batch Loaders */}
                          <View style={styles.catalogBatchRow}>
                            <TouchableOpacity
                              onPress={() => handleLoadOfficeDefaults(10)}
                              style={styles.batchBtnPrimary}
                              activeOpacity={0.8}
                            >
                              <Sparkles size={12} color="#ffffff" />
                              <Text style={styles.batchBtnPrimaryText}>⚡ LOAD ALL 10 CLUES</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleLoadOfficeDefaults(5)}
                              style={styles.batchBtnSecondary}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.batchBtnSecondaryText}>LOAD FIRST 5</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Clue Definitions List (1 to 10) */}
                        {OFFICE_CAMPUS_DEFAULT_CLUES.map((def) => {
                          const existingIdx = isClueAlreadyAdded(def.answerKey, def.title);
                          const isAdded = existingIdx !== -1;

                          return (
                            <View key={`off-clue-${def.no}`} style={styles.defaultClueItemCard}>
                              <View style={styles.defaultClueTopRow}>
                                <View style={styles.defaultClueBadge}>
                                  <Text style={styles.defaultClueBadgeText}>#{def.no}</Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.defaultClueTitleText}>{def.title}</Text>
                                  <Text style={styles.defaultClueAnswerText}>
                                    Target: <Text style={{ color: '#38bdf8' }}>{def.answer}</Text> ({def.answerKey})
                                  </Text>
                                </View>

                                <View style={styles.defaultCluePointsPill}>
                                  <Text style={styles.defaultCluePointsText}>{def.points} pts</Text>
                                </View>
                              </View>

                              {/* Riddle Preview */}
                              <Text style={styles.defaultClueRiddleText}>
                                "{def.riddle}"
                              </Text>

                              {/* Location Hint */}
                              <View style={styles.defaultClueMetaRow}>
                                <MapPin size={11} color="#94a3b8" />
                                <Text style={styles.defaultClueMetaText} numberOfLines={1}>
                                  {def.answerPlace}
                                </Text>
                              </View>

                              {/* Action Buttons: Add or Customize */}
                              <View style={styles.defaultClueActionsRow}>
                                {isAdded ? (
                                  <View style={styles.clueAddedBadge}>
                                    <CheckCircle2 size={13} color="#22c55e" />
                                    <Text style={styles.clueAddedBadgeText}>
                                      ADDED (STAGE #{existingIdx + 1})
                                    </Text>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => handleAddSingleDefaultClue(def, 'office')}
                                    style={styles.addSingleClueBtn}
                                    activeOpacity={0.8}
                                  >
                                    <Plus size={13} color="#ffffff" strokeWidth={2.4} />
                                    <Text style={styles.addSingleClueBtnText}>ADD TO QUEST</Text>
                                  </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                  onPress={() => handleCustomizeDefaultClue(def, 'office')}
                                  style={styles.customizeClueBtn}
                                  activeOpacity={0.8}
                                >
                                  <Edit2 size={12} color="#fbbf24" />
                                  <Text style={styles.customizeClueBtnText}>CUSTOMIZE & ADD</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* ======================================================== */}
                    {/* TAB 3: COLLEGE DEFAULT CLUES CATALOG                     */}
                    {/* ======================================================== */}
                    {activeTabMode === 'college-defaults' && (
                      <View>
                        {/* Catalog Header Card */}
                        <View style={styles.catalogHeroCard}>
                          <View style={styles.catalogHeroTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <GraduationCap size={16} color="#fbbf24" />
                              <Text style={[styles.catalogHeroTitle, { color: '#fbbf24' }]}>
                                COLLEGE CAMPUS DEFAULTS
                              </Text>
                            </View>
                            <View style={[styles.catalogCountBadge, { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
                              <Text style={[styles.catalogCountBadgeText, { color: '#fbbf24' }]}>
                                10 CLUES
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.catalogHeroSub}>
                            Curated riddles for university campuses (library, dustbin, canteen, clock tower, mirrors, stairs, books, water cooler & blackboards).
                          </Text>

                          {/* Quick Batch Loaders */}
                          <View style={styles.catalogBatchRow}>
                            <TouchableOpacity
                              onPress={() => handleLoadCollegeDefaults(10)}
                              style={[styles.batchBtnPrimary, { backgroundColor: '#b45309', borderColor: '#fbbf24' }]}
                              activeOpacity={0.8}
                            >
                              <Sparkles size={12} color="#ffffff" />
                              <Text style={styles.batchBtnPrimaryText}>⚡ LOAD ALL 10 CLUES</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleLoadCollegeDefaults(5)}
                              style={styles.batchBtnSecondary}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.batchBtnSecondaryText}>LOAD FIRST 5</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Clue Definitions List (1 to 10) */}
                        {COLLEGE_CAMPUS_DEFAULT_CLUES.map((def) => {
                          const existingIdx = isClueAlreadyAdded(def.answerKey, def.title);
                          const isAdded = existingIdx !== -1;

                          return (
                            <View key={`col-clue-${def.no}`} style={styles.defaultClueItemCard}>
                              <View style={styles.defaultClueTopRow}>
                                <View style={[styles.defaultClueBadge, { backgroundColor: '#78350f' }]}>
                                  <Text style={styles.defaultClueBadgeText}>#{def.no}</Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                  <Text style={styles.defaultClueTitleText}>{def.title}</Text>
                                  <Text style={styles.defaultClueAnswerText}>
                                    Target: <Text style={{ color: '#fbbf24' }}>{def.answer}</Text> ({def.answerKey})
                                  </Text>
                                </View>

                                <View style={styles.defaultCluePointsPill}>
                                  <Text style={styles.defaultCluePointsText}>{def.points} pts</Text>
                                </View>
                              </View>

                              {/* Riddle Preview */}
                              <Text style={styles.defaultClueRiddleText}>
                                "{def.riddle}"
                              </Text>

                              {/* Location Hint */}
                              <View style={styles.defaultClueMetaRow}>
                                <MapPin size={11} color="#94a3b8" />
                                <Text style={styles.defaultClueMetaText} numberOfLines={1}>
                                  {def.answerPlace}
                                </Text>
                              </View>

                              {/* Action Buttons: Add or Customize */}
                              <View style={styles.defaultClueActionsRow}>
                                {isAdded ? (
                                  <View style={styles.clueAddedBadge}>
                                    <CheckCircle2 size={13} color="#22c55e" />
                                    <Text style={styles.clueAddedBadgeText}>
                                      ADDED (STAGE #{existingIdx + 1})
                                    </Text>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => handleAddSingleDefaultClue(def, 'college')}
                                    style={[styles.addSingleClueBtn, { backgroundColor: '#b45309', borderColor: '#fbbf24' }]}
                                    activeOpacity={0.8}
                                  >
                                    <Plus size={13} color="#ffffff" strokeWidth={2.4} />
                                    <Text style={styles.addSingleClueBtnText}>ADD TO QUEST</Text>
                                  </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                  onPress={() => handleCustomizeDefaultClue(def, 'college')}
                                  style={styles.customizeClueBtn}
                                  activeOpacity={0.8}
                                >
                                  <Edit2 size={12} color="#fbbf24" />
                                  <Text style={styles.customizeClueBtnText}>CUSTOMIZE & ADD</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </ScrollView>

                  {/* BOTTOM ACTION BUTTONS ROW */}
                  <View style={styles.bottomButtonsRow}>
                    {activeTabMode === 'my-clues' ? (
                      <>
                        <TouchableOpacity
                          onPress={() => setShowAddChoiceModal(true)}
                          style={styles.addClueLargeBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.addClueLargeBtnText}>+ ADD CLUE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={onClose}
                          style={styles.doneCloseLargeBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.doneCloseLargeBtnText}>DONE & CLOSE</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={handleStartAddNewCustom}
                          style={styles.addClueLargeBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.addClueLargeBtnText}>+ CUSTOM CLUE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setActiveTabMode('my-clues')}
                          style={styles.doneCloseLargeBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.doneCloseLargeBtnText}>
                            VIEW QUEST ({clues.length})
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* MODAL: CHOOSE DEFAULT CLUE OR CREATE OWN */}
        {showAddChoiceModal && (
          <Modal transparent animationType="fade" visible={showAddChoiceModal} onRequestClose={() => setShowAddChoiceModal(false)}>
            <View style={styles.choiceModalOverlay}>
              <View style={styles.choiceModalCard}>
                <View style={styles.choiceModalHeader}>
                  <Text style={styles.choiceModalTitle}>HOW DO YOU WANT TO ADD A CLUE?</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddChoiceModal(false)}
                    style={styles.circleCloseBtnSmall}
                  >
                    <X size={15} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.choiceModalSub}>
                  Select from ready-made office or college sets, or create your own custom riddle.
                </Text>

                {/* Option 1: Office Defaults */}
                <TouchableOpacity
                  onPress={() => {
                    setShowAddChoiceModal(false);
                    setActiveTabMode('office-defaults');
                  }}
                  style={styles.choiceOptionCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.choiceOptionIconBox, { borderColor: '#38bdf8' }]}>
                    <Building2 size={20} color="#38bdf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.choiceOptionTitle, { color: '#38bdf8' }]}>
                      🏢 Choose from Office Clues (1–10)
                    </Text>
                    <Text style={styles.choiceOptionDesc}>
                      Keyboards, printers, routers, pantries, meeting rooms & more
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: College Defaults */}
                <TouchableOpacity
                  onPress={() => {
                    setShowAddChoiceModal(false);
                    setActiveTabMode('college-defaults');
                  }}
                  style={styles.choiceOptionCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.choiceOptionIconBox, { borderColor: '#fbbf24' }]}>
                    <GraduationCap size={20} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.choiceOptionTitle, { color: '#fbbf24' }]}>
                      🎓 Choose from College Clues (1–10)
                    </Text>
                    <Text style={styles.choiceOptionDesc}>
                      Libraries, dustbins, canteens, clocks, mirrors & laboratories
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Option 3: Create Custom Clue */}
                <TouchableOpacity
                  onPress={handleStartAddNewCustom}
                  style={[styles.choiceOptionCard, { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.choiceOptionIconBox, { borderColor: '#22c55e' }]}>
                    <Plus size={20} color="#22c55e" strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.choiceOptionTitle, { color: '#4ade80' }]}>
                      ✏️ Create Your Own Custom Clue
                    </Text>
                    <Text style={styles.choiceOptionDesc}>
                      Write your own riddle, location checkpoint, points & secret answer key
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </Modal>

      {/* CLUE QR PRINT MODAL */}
      <ClueQrPrintModal
        visible={showPrintModal}
        event={currentEvent}
        selectedClue={printTargetClue}
        onClose={() => setShowPrintModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 18, 0.88)',
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
    paddingTop: 8,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  mainTitleText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 1.1,
    textShadowColor: 'rgba(251, 191, 36, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  mainSubtitleText: {
    fontSize: 11,
    color: '#86efac',
    marginTop: 2,
    fontFamily: "'Outfit', sans-serif",
  },
  circleCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(5, 20, 15, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCloseBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollStage: {
    flex: 1,
    paddingHorizontal: 14,
  },
  scrollStageContent: {
    paddingBottom: 20,
  },

  /* ======================================================== */
  /* UNIFIED SLEEK EVENT HERO CARD                            */
  /* ======================================================== */
  eventHeroCard: {
    backgroundColor: 'rgba(6, 14, 28, 0.92)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d97706',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventHeroPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  managingPinPill: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  managingPinPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  eventHeroSubLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  eventHeroTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.5,
  },
  eventSwitchChevronPill: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  eventSwitchChevronPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  eventHeroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  eventMetaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  dropdownContainerBox: {
    backgroundColor: '#0a1024',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#d97706',
    marginVertical: 6,
    overflow: 'hidden',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownItemRowActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  dropdownItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  dropdownItemTitleActive: {
    color: '#fbbf24',
  },
  dropdownItemMeta: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },

  /* ======================================================== */
  /* MODE TABS NAVIGATION ROW                                 */
  /* ======================================================== */
  tabsNavRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    borderRadius: 13,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
  },
  tabNavBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabNavBtnActive: {
    backgroundColor: '#b45309',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  tabNavBtnActiveOffice: {
    backgroundColor: '#0284c7',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  tabNavBtnActiveCollege: {
    backgroundColor: '#78350f',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  tabNavBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: "'Outfit', sans-serif",
  },
  tabNavBtnTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  tabNavBtnTextActiveOffice: {
    color: '#ffffff',
    fontWeight: '900',
  },
  tabNavBtnTextActiveCollege: {
    color: '#ffffff',
    fontWeight: '900',
  },

  /* ======================================================== */
  /* CLUES SECTION HEADER & ACTIONS                           */
  /* ======================================================== */
  cluesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  cluesHeadingText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
  addClueHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#047857',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#34d399',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
  },
  addClueHeaderBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  printAllQrsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#b45309',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  printAllQrsBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  /* ======================================================== */
  /* EMPTY CLUES STATE                                        */
  /* ======================================================== */
  emptyCluesBox: {
    backgroundColor: 'rgba(5, 12, 26, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
  },
  emptyCluesTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    marginTop: 8,
    textAlign: 'center',
  },
  emptyCluesSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
    paddingHorizontal: 6,
  },
  emptyActionsContainer: {
    width: '100%',
    gap: 8,
  },
  emptyPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  emptyPresetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1.2,
    borderColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  emptyPresetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: "'Outfit', sans-serif",
  },
  emptyCustomBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1.2,
    borderColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyCustomBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#4ade80',
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: 0.3,
  },

  /* ======================================================== */
  /* PARCHMENT CLUE CARDS (WARM PARCHMENT GOLD CARDS)         */
  /* ======================================================== */
  parchmentClueCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  parchmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  parchmentBadgeBox: {
    backgroundColor: '#451a03',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 7,
  },
  parchmentBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#fde047',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  parchmentTitleText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '900',
    color: '#271406',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.4,
    marginRight: 6,
  },
  parchmentActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  parchmentActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#78350f',
    backgroundColor: 'rgba(69, 26, 3, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parchmentActionBtnDelete: {
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  parchmentRiddleText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#451a03',
    lineHeight: 16,
    marginBottom: 8,
    fontFamily: "'Georgia', serif",
  },
  parchmentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  parchmentPill: {
    borderWidth: 1,
    borderColor: '#78350f',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(69, 26, 3, 0.06)',
  },
  parchmentPillQr: {
    backgroundColor: 'rgba(69, 26, 3, 0.12)',
  },
  parchmentPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#451a03',
  },
  parchmentExpandBtn: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#78350f',
    backgroundColor: 'rgba(69, 26, 3, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parchmentExpandedDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(69, 26, 3, 0.18)',
    gap: 4,
  },
  expandedDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedDetailText: {
    fontSize: 10.5,
    color: '#5c2b09',
    flex: 1,
  },

  /* ======================================================== */
  /* DEFAULT CATALOG STYLES (OFFICE & COLLEGE)                */
  /* ======================================================== */
  catalogHeroCard: {
    backgroundColor: 'rgba(5, 14, 30, 0.94)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    padding: 12,
    marginBottom: 10,
  },
  catalogHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catalogHeroTitle: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
  catalogCountBadge: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  catalogCountBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  catalogHeroSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    lineHeight: 14,
    marginBottom: 10,
  },
  catalogBatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  batchBtnPrimary: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#38bdf8',
    paddingVertical: 8,
  },
  batchBtnPrimaryText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  batchBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 8,
  },
  batchBtnSecondaryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#cbd5e1',
  },

  /* DEFAULT CLUE INDIVIDUAL CARD */
  defaultClueItemCard: {
    backgroundColor: 'rgba(8, 18, 38, 0.92)',
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    padding: 12,
    marginBottom: 9,
  },
  defaultClueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  defaultClueBadge: {
    backgroundColor: '#0284c7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    marginRight: 8,
  },
  defaultClueBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
  },
  defaultClueTitleText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.4,
  },
  defaultClueAnswerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  defaultCluePointsPill: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  defaultCluePointsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },
  defaultClueRiddleText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 6,
  },
  defaultClueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  defaultClueMetaText: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1,
  },
  defaultClueActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  addSingleClueBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 6,
  },
  addSingleClueBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  clueAddedBadge: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingVertical: 6,
  },
  clueAddedBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#4ade80',
    letterSpacing: 0.4,
  },
  customizeClueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingVertical: 6,
  },
  customizeClueBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },

  /* ======================================================== */
  /* EDIT / CREATE SCREEN STYLES                              */
  /* ======================================================== */
  templatePickerCard: {
    backgroundColor: 'rgba(8, 16, 36, 0.94)',
    borderRadius: 14,
    borderWidth: 1.3,
    borderColor: '#fbbf24',
    padding: 12,
    marginBottom: 12,
  },
  templatePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  templatePickerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
  },
  templatePickerSub: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
    marginBottom: 8,
  },
  templateButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  templateOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 7,
  },
  templateOptionBtnActiveOffice: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38bdf8',
  },
  templateOptionBtnActiveCollege: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderColor: '#fbbf24',
  },
  templateOptionBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  templateDropdownList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 180,
  },
  templateDropdownHeader: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  templateDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  templateDropdownItemTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  templateDropdownItemSub: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 1,
  },
  templateDropdownItemPoints: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  templateDropdownItemPointsText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
  },
  editQrCard: {
    backgroundColor: 'rgba(4, 9, 24, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d97706',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editQrWhiteBox: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editQrImage: {
    width: 68,
    height: 68,
    resizeMode: 'contain',
  },
  editQrHeading: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
  },
  editQrSub: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 2,
    marginBottom: 6,
    lineHeight: 13,
  },
  printThisQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#78350f',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    paddingHorizontal: 11,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  printThisQrBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  editFormCard: {
    backgroundColor: 'rgba(4, 15, 25, 0.88)',
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#d97706',
    padding: 13,
    marginBottom: 14,
  },
  editFieldBlock: {
    marginBottom: 10,
  },
  editFieldLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  editTextInput: {
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
  },
  editTextInputAnswerKey: {
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  editTextArea: {
    height: 64,
    textAlignVertical: 'top',
  },
  editTypePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  editTypePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  editTypePillActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  editTypePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  editTypePillTextActive: {
    color: '#0f172a',
    fontWeight: '900',
  },
  editTwoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  /* ======================================================== */
  /* BOTTOM ACTIONS ROW                                       */
  /* ======================================================== */
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: 'rgba(4, 8, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  addClueLargeBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addClueLargeBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },
  doneCloseLargeBtn: {
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
  doneCloseLargeBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.8,
  },

  /* ======================================================== */
  /* MODAL: CHOOSE DEFAULT OR CUSTOM ACTION MODAL             */
  /* ======================================================== */
  choiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  choiceModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#071026',
    borderRadius: 20,
    borderWidth: 1.8,
    borderColor: '#fbbf24',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
  },
  choiceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  choiceModalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.6,
  },
  choiceModalSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 15,
  },
  choiceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    marginBottom: 9,
  },
  choiceOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOptionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    fontFamily: "'Cinzel', 'Georgia', serif",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  choiceOptionDesc: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 13,
  },
});
