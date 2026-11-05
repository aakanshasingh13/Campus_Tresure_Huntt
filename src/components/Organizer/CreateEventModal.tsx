import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
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
import Svg, {
  Rect,
  Path,
  Line,
  Circle,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  ArrowUp,
  CheckCircle2,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  FileText,
} from 'lucide-react-native';
import { DifficultyLevel, TreasureEvent } from '../../types';
import { generateCluesForDifficulty } from '../../utils/clueGenerator';
import { COLLEGE_CAMPUS_DEFAULT_CLUES, getCollegeDefaultClues } from '../../data/collegeClues';
import { OFFICE_CAMPUS_DEFAULT_CLUES, getOfficeDefaultClues } from '../../data/officeClues';

interface CreateEventModalProps {
  visible?: boolean;
  onSave: (event: TreasureEvent) => void;
  onClose: () => void;
  organizerName: string;
  organizerEmail: string;
  campusType?: string;
  campusName?: string;
}

interface ClueItemData {
  id: string;
  title: string;
  riddle: string;
  answerPlace: string;
  answerKey: string;
  placeInstruction: string;
  qrLabel: string;
  points: number;
}

// Global in-memory cache for generated QR code data URLs
const qrCodeDataUrlCache = new Map<string, string>();

// Authentic scannable QR Code Graphic Generator (Compatible with all smartphone cameras & jsQR scanner)
const QrCodeGraphic: React.FC<{
  value?: string;
  size?: number;
  label?: string;
  darkLabel?: boolean;
  onPress?: () => void;
}> = ({
  value = 'CQ_CHECKPOINT:evt-101:clue-1:CLOCK TOWER',
  size = 66,
  label,
  darkLabel = true,
  onPress,
}) => {
  const [dataUrl, setDataUrl] = useState<string>(() => {
    return qrCodeDataUrlCache.get(value) || '';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!value) return;
    if (qrCodeDataUrlCache.has(value)) {
      setDataUrl(qrCodeDataUrlCache.get(value)!);
      return;
    }
    let isCurrent = true;
    QRCode.toDataURL(value, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        qrCodeDataUrlCache.set(value, url);
        if (isCurrent) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR Data URL:', err);
      });

    return () => {
      isCurrent = false;
    };
  }, [value]);

  const handlePress = () => {
    if (value) {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(value);
        }
      } catch (e) {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        onPress={handlePress}
        {...({ onClick: handlePress } as any)}
        activeOpacity={0.8}
        title={value ? `Scannable Checkpoint QR: ${value} (Click to copy)` : 'Checkpoint QR Code'}
        style={{
          width: size,
          height: size,
          backgroundColor: '#ffffff',
          borderRadius: 6,
          padding: 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: copied ? '#10b981' : '#1e293b',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Scannable QR Code"
            width={size - 4}
            height={size - 4}
            style={{
              width: size - 4,
              height: size - 4,
              display: 'block',
              objectFit: 'contain',
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#64748b" />
          </View>
        )}
        {copied && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(16, 185, 129, 0.92)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={16} color="#ffffff" strokeWidth={3} />
          </View>
        )}
      </TouchableOpacity>
      {label && (
        <Text
          style={{
            fontSize: 9.5,
            fontWeight: '900',
            color: darkLabel ? '#261a0d' : '#fbbf24',
            marginTop: 3,
            letterSpacing: 0.5,
          }}
        >
          {copied ? 'COPIED ✓' : label}
        </Text>
      )}
    </View>
  );
};

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible = true,
  onSave,
  onClose,
  organizerName,
  organizerEmail,
  campusType = 'College Campus',
  campusName,
}) => {
  // 3-step navigation: 1 = DETAILS, 2 = CLUES, 3 = PAYMENT
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const isOffice = Boolean(campusType && campusType.toLowerCase().includes('office'));
  const isCollege = !isOffice;

  // STEP 1 DETAILS
  const [title, setTitle] = useState(
    isOffice ? 'The Corporate Cipher Challenge' : 'The Great Belltower Mystery'
  );
  const [location, setLocation] = useState(
    campusName || (isOffice ? 'Corporate Headquarters Plaza' : 'Central University Grounds')
  );
  const [eventDate, setEventDate] = useState('08/10/2026');
  const [eventTime, setEventTime] = useState('10:00 AM');
  const [eventCode, setEventCode] = useState('565603');
  const [isCopied, setIsCopied] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Hard');
  const [eventType, setEventType] = useState<'Solo Player' | 'Team Hunt'>('Team Hunt');
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);

  // STEP 2 CLUES (Matching Exact User Reference Screenshots)
  const [selectedCampusPreset, setSelectedCampusPreset] = useState<'college' | 'office'>(
    isOffice ? 'office' : 'college'
  );
  const [clueSource, setClueSource] = useState<'system' | 'custom'>('system');
  const [showClueKitPdfModal, setShowClueKitPdfModal] = useState(false);
  const [showAddEditClueModal, setShowAddEditClueModal] = useState(false);
  const [clueKitDownloaded, setClueKitDownloaded] = useState(false);
  const [expandedAllClues, setExpandedAllClues] = useState<boolean>(true);

  // Clue count selector: organizer sets the number of clues they want (1 to 10)
  const [clueCount, setClueCount] = useState<number>(8);

  // Default Clues sized to clueCount based on campus registration (Office vs College)
  const [cluesList, setCluesList] = useState<ClueItemData[]>(() => {
    return isOffice
      ? getOfficeDefaultClues(8, 'evt-565603')
      : getCollegeDefaultClues(8, 'evt-565603');
  });

  const handleSetClueCount = (count: number, presetOverride?: 'college' | 'office') => {
    const clamped = Math.max(1, Math.min(10, count));
    setClueCount(clamped);
    const preset = presetOverride || selectedCampusPreset;
    const clues =
      preset === 'office'
        ? getOfficeDefaultClues(clamped, eventCode ? `evt-${eventCode}` : 'evt-office')
        : getCollegeDefaultClues(clamped, eventCode ? `evt-${eventCode}` : 'evt-college');
    setCluesList(clues);
  };

  const handleSwitchPreset = (preset: 'college' | 'office') => {
    setSelectedCampusPreset(preset);
    handleSetClueCount(clueCount, preset);
  };

  const handleResetDefaults = () => {
    handleSetClueCount(clueCount, selectedCampusPreset);
  };

  // Editing / adding state
  const defaultInitialClue = isOffice ? OFFICE_CAMPUS_DEFAULT_CLUES[0] : COLLEGE_CAMPUS_DEFAULT_CLUES[0];
  const [editingClueIndex, setEditingClueIndex] = useState<number | null>(0);
  const [editTitle, setEditTitle] = useState(defaultInitialClue.title);
  const [editRiddle, setEditRiddle] = useState(defaultInitialClue.riddle);
  const [editAnswerPlace, setEditAnswerPlace] = useState(defaultInitialClue.answerPlace);
  const [editAnswerKey, setEditAnswerKey] = useState(defaultInitialClue.answerKey);

  const handleOpenAddClue = () => {
    // Default to editing Clue 1 or creating new
    setEditingClueIndex(0);
    const firstClue = cluesList[0];
    if (firstClue) {
      setEditTitle(firstClue.title);
      setEditRiddle(firstClue.riddle);
      setEditAnswerPlace(firstClue.answerPlace);
      setEditAnswerKey(firstClue.answerKey);
    }
    setShowAddEditClueModal(true);
  };

  const handleSelectClueToEdit = (idx: number | null) => {
    setEditingClueIndex(idx);
    if (idx !== null && cluesList[idx]) {
      const clue = cluesList[idx];
      setEditTitle(clue.title);
      setEditRiddle(clue.riddle);
      setEditAnswerPlace(clue.answerPlace);
      setEditAnswerKey(clue.answerKey);
    } else {
      const nextNum = cluesList.length + 1;
      setEditTitle(`CLUE ${nextNum}`);
      setEditRiddle(`[Clue ${nextNum} riddle]`);
      setEditAnswerPlace('[Answer place]');
      setEditAnswerKey('[KEY]');
    }
  };

  const handleOpenEditClue = (idx: number) => {
    handleSelectClueToEdit(idx);
    setShowAddEditClueModal(true);
  };

  const handleSaveClueModal = () => {
    if (!editTitle.trim()) return;
    if (editingClueIndex !== null && editingClueIndex < cluesList.length) {
      // Edit existing
      setCluesList((prev) =>
        prev.map((c, i) =>
          i === editingClueIndex
            ? {
                ...c,
                title: editTitle.trim().toUpperCase(),
                riddle: editRiddle.trim(),
                answerPlace: editAnswerPlace.trim(),
                answerKey: editAnswerKey.trim(),
              }
            : c
        )
      );
    } else {
      // Add new
      const nextNum = cluesList.length + 1;
      const newClue: ClueItemData = {
        id: String(Date.now()),
        title: editTitle.trim().toUpperCase(),
        riddle: editRiddle.trim() || `[Clue ${nextNum} riddle]`,
        answerPlace: editAnswerPlace.trim() || '[Answer place]',
        answerKey: editAnswerKey.trim() || '[KEY]',
        placeInstruction: `Place QR ${nextNum} here · ${nextNum === 4 ? 'ends the hunt' : `unlocks Clue ${nextNum + 1}`}`,
        qrLabel: `QR ${nextNum}`,
        points: 100 * nextNum,
      };
      setCluesList((prev) => [...prev, newClue]);
    }
    setShowAddEditClueModal(false);
  };

  // STEP 3 PAYMENT
  const [isPaid, setIsPaid] = useState(true);
  const [currency, setCurrency] = useState<'₹' | '$'>('₹');
  const [registrationFee, setRegistrationFee] = useState<number>(199);
  const [feeType, setFeeType] = useState<'per_player' | 'per_team'>('per_player');
  const [upiId, setUpiId] = useState('campushunt.organizer@oksbi');
  const [payeeName, setPayeeName] = useState(organizerName || 'Central University Grounds Guild');
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | null>(null);
  const [showQrTesterModal, setShowQrTesterModal] = useState(false);
  const [testScanSuccess, setTestScanSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const generateNewPin = () => {
    const newPin = String(Math.floor(100000 + Math.random() * 900000));
    setEventCode(newPin);
    setIsCopied(false);
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(eventCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    switch (diff) {
      case 'Easy':
        setRegistrationFee(49);
        break;
      case 'Medium':
        setRegistrationFee(99);
        break;
      case 'Hard':
        setRegistrationFee(199);
        break;
      case 'Master':
        setRegistrationFee(299);
        break;
      case 'Expert':
        setRegistrationFee(499);
        break;
    }
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setPaymentQrUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunTestScan = () => {
    setShowQrTesterModal(true);
    setTestScanSuccess(false);
    setTimeout(() => {
      setTestScanSuccess(true);
    }, 900);
  };

  const handleDownloadClueKit = () => {
    setClueKitDownloaded(true);
    if (typeof window !== 'undefined' && window.print) {
      // Allow browser to print or save as PDF
      window.print();
    }
    setTimeout(() => setClueKitDownloaded(false), 3000);
  };

  // Submit and create hunt event
  const handleCreateQuest = () => {
    const generatedEventId = `evt-${Date.now()}`;
    const cleanClues = cluesList.map((c, idx) => ({
      id: `clue-${idx + 1}`,
      eventId: generatedEventId,
      order: idx + 1,
      title: c.title,
      riddle: c.riddle,
      hint: `Search near ${c.answerPlace}`,
      locationHint: c.answerPlace,
      solution: c.answerKey,
      answerKey: c.answerKey,
      points: c.points,
      type: 'qr_code' as const,
      qrCodeValue: `CQ_CHECKPOINT:${generatedEventId}:clue-${idx + 1}:${c.answerKey || 'KEY'}`,
    }));

    const newEvent: TreasureEvent = {
      id: generatedEventId,
      title: title.trim() || 'The Great Belltower Mystery',
      campusType: (selectedCampusPreset === 'office' ? 'Office Campus' : (campusType as any) || 'College Campus'),
      campusName: location.trim() || campusName || (selectedCampusPreset === 'office' ? 'Corporate Headquarters' : 'Central University Grounds'),
      date: '2026-08-10',
      time: '10:00',
      description: `Embark on ${title.trim()} through ${location.trim()}. Solve ciphers, find hidden QR markers, and uncover campus mysteries!`,
      startLocation: location.trim() || 'Central University Grounds',
      boundaryRadiusMeters: 500,
      maxTeamSize: eventType === 'Team Hunt' ? maxTeamSize : 1,
      minTeamSize: eventType === 'Team Hunt' ? minTeamSize : 1,
      status: 'active',
      clues: cleanClues,
      organizerName: organizerName || 'Campus Guild',
      organizerEmail: organizerEmail || 'organizer@campus.edu',
      code: eventCode.padEnd(6, '0').slice(0, 6),
      difficulty,
      eventType,
      duration: '2 Hours',
      prizes: `₹${registrationFee * 50} Cash Prize + Gold Trophies + 700 XP`,
      maxTeams: 25,
      hintsAllowed: 3,
      isPaid,
      registrationFee: isPaid ? registrationFee : 0,
      currency,
      feeType,
      upiId: isPaid ? upiId : undefined,
      payeeName: isPaid ? payeeName : undefined,
      paymentQrUrl: paymentQrUrl || undefined,
      paymentInstructions:
        'Scan the UPI QR code with GPay, PhonePe, Paytm, or BHIM. Enter your 12-digit UTR transaction ID upon joining.',
      additionalInfo: `6-Digit PIN: ${eventCode}. Please arrive 10 minutes prior to quest start.`,
      mode: 'Physical On-Campus Exploration (Walking Quest & Live Clue Trail)',
      meetingPoint: `${location.trim()} - Main Central Pavilion`,
      whatToCarry: [
        'Smartphone with Camera & GPS enabled',
        'Valid Student ID',
        'Comfortable Walking Shoes',
        'Water Bottle',
      ],
    };

    onSave(newEvent);
    onClose();
  };

  const digits = eventCode.padEnd(6, '0').slice(0, 6).split('');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* Nocturnal Vector Background Behind Modal Content */}
          <View style={styles.modalBgArtwork} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 412 860" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="modalNightSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#040817" />
                  <Stop offset="25%" stopColor="#07122b" />
                  <Stop offset="60%" stopColor="#0a1a38" />
                  <Stop offset="85%" stopColor="#08142a" />
                  <Stop offset="100%" stopColor="#03060f" />
                </LinearGradient>
                <RadialGradient id="modalMoonHalo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
                  <Stop offset="45%" stopColor="#fef9c3" stopOpacity={0.35} />
                  <Stop offset="100%" stopColor="#0a1a38" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="modalLampHalo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#fef08a" stopOpacity={0.9} />
                  <Stop offset="40%" stopColor="#f59e0b" stopOpacity={0.45} />
                  <Stop offset="80%" stopColor="#d97706" stopOpacity={0.15} />
                  <Stop offset="100%" stopColor="#040817" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="modalClockHalo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                  <Stop offset="45%" stopColor="#fef08a" stopOpacity={0.8} />
                  <Stop offset="85%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <Stop offset="100%" stopColor="#040817" stopOpacity={0} />
                </RadialGradient>
              </Defs>

              {/* Deep Midnight Sky */}
              <Rect width="412" height="860" fill="url(#modalNightSkyGrad)" />

              {/* Top Corner Forest Green Curtains */}
              <Path d="M 0 0 L 125 0 C 125 50, 80 80, 0 80 Z" fill="#082b1d" />
              <Path d="M 0 0 L 105 0 C 105 42, 65 70, 0 70 Z" fill="#0f3c28" />
              <Path d="M 412 0 L 287 0 C 287 50, 332 80, 412 80 Z" fill="#082b1d" />
              <Path d="M 412 0 L 307 0 C 307 42, 347 70, 412 70 Z" fill="#0f3c28" />

              {/* Luminous Crescent Moon in Top Right */}
              <G transform="translate(315, 60)">
                <Circle cx="24" cy="24" r="28" fill="url(#modalMoonHalo)" />
                <Path
                  d="M 12 10 C 26 10 36 21 36 34 C 36 38 34 41 32 44 C 41 40 45 30 45 22 C 45 9 34 0 20 0 C 16 0 13 1 10 3 C 12 5 12 8 12 10 Z"
                  fill="#fef08a"
                />
              </G>

              {/* Stars */}
              <G fill="#ffffff">
                <Circle cx="70" cy="190" r="1.4" opacity={0.85} />
                <Circle cx="130" cy="140" r="1.5" opacity={0.9} />
                <Circle cx="220" cy="85" r="1.2" opacity={0.8} />
                <Circle cx="270" cy="120" r="1.4" opacity={0.85} />
                <Circle cx="370" cy="210" r="1.3" opacity={0.8} />
              </G>

              {/* Collegiate Gothic Clocktower at Bottom */}
              <G transform="translate(206, 660)">
                <Path d="M -40 200 L -40 85 L 0 40 L 40 85 L 40 200 Z" fill="#050c18" />
                <Polygon points="-115,200 -115,140 -70,105 -40,145 -40,200" fill="#071020" />
                <Polygon points="40,200 40,145 70,105 115,140 115,200" fill="#071020" />
                <Circle cx="0" cy="74" r="16" fill="url(#modalClockHalo)" />
                <Circle cx="0" cy="74" r="12" fill="#ffd54f" stroke="#ca8a04" strokeWidth={1} />
                <Circle cx="0" cy="74" r="2.5" fill="#78350f" />
                <Rect x="-5" y="98" width="10" height="18" rx="2" fill="#ffd54f" stroke="#ca8a04" strokeWidth={0.8} />
                <Rect x="-5" y="126" width="10" height="18" rx="2" fill="#ffd54f" stroke="#ca8a04" strokeWidth={0.8} />
              </G>

              {/* Vintage Street Lamp at Bottom Left */}
              <G transform="translate(32, 680)">
                <Circle cx="10" cy="30" r="40" fill="url(#modalLampHalo)" />
                <Rect x="2" y="18" width="16" height="24" rx="5" fill="#fef08a" stroke="#ca8a04" strokeWidth={1.2} />
                <Rect x="5" y="21" width="10" height="18" rx="3" fill="#ffffff" opacity={0.75} />
                <Path d="M 0 18 C 0 12 20 12 20 18 Z" fill="#070f1e" />
                <Rect x="8" y="42" width="4" height="130" fill="#070f1e" />
              </G>
            </Svg>
          </View>

          {/* Top Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>CREATE HUNT EVENT</Text>
              <Text style={styles.modalSubtitle}>
                {currentStep === 2
                  ? 'Each clue has its own QR, placed at its answer spot'
                  : 'Name, place, clues and payment for your quest'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              {...({ onClick: onClose } as any)}
              style={styles.closeCircleBtn}
              activeOpacity={0.8}
            >
              <X size={15} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* 3-Step Pill Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setCurrentStep(1)}
              {...({ onClick: () => setCurrentStep(1) } as any)}
              style={[styles.tabPill, currentStep === 1 && styles.tabPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, currentStep === 1 && styles.tabPillTextActive]}>
                1 · DETAILS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentStep(2)}
              {...({ onClick: () => setCurrentStep(2) } as any)}
              style={[styles.tabPill, currentStep === 2 && styles.tabPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, currentStep === 2 && styles.tabPillTextActive]}>
                2 · CLUES
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentStep(3)}
              {...({ onClick: () => setCurrentStep(3) } as any)}
              style={[styles.tabPill, currentStep === 3 && styles.tabPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, currentStep === 3 && styles.tabPillTextActive]}>
                3 · PAYMENT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hidden File Upload Input */}
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Scrollable Stage Content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ======================================================== */}
            {/* STEP 1: DETAILS                                          */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <>
                {/* CARD 1: EVENT DETAILS */}
                <View style={styles.goldCard}>
                  <Text style={styles.goldCardHeader}>EVENT DETAILS</Text>

                  <Text style={styles.inputFieldLabel}>EVENT NAME</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter quest event title"
                    placeholderTextColor="#64748b"
                    style={styles.textInputBox}
                  />

                  <Text style={styles.inputFieldLabel}>LOCATION</Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Campus or Venue location"
                    placeholderTextColor="#64748b"
                    style={styles.textInputBox}
                  />

                  <View style={styles.dateTimeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputFieldLabel}>DATE</Text>
                      <View style={styles.iconInputWrap}>
                        <TextInput
                          value={eventDate}
                          onChangeText={setEventDate}
                          placeholder="MM/DD/YYYY"
                          placeholderTextColor="#64748b"
                          style={styles.textInputWithIcon}
                        />
                        <CalendarIcon size={14} color="#94a3b8" />
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputFieldLabel}>TIME</Text>
                      <View style={styles.iconInputWrap}>
                        <TextInput
                          value={eventTime}
                          onChangeText={setEventTime}
                          placeholder="HH:MM AM/PM"
                          placeholderTextColor="#64748b"
                          style={styles.textInputWithIcon}
                        />
                        <Clock size={14} color="#94a3b8" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* CARD 2: EVENT TYPE (Solo Player vs Team Hunt) */}
                <View style={styles.goldCard}>
                  <Text style={styles.goldCardHeader}>EVENT TYPE</Text>

                  <View style={styles.eventTypeRow}>
                    <TouchableOpacity
                      onPress={() => setEventType('Solo Player')}
                      {...({ onClick: () => setEventType('Solo Player') } as any)}
                      style={[
                        styles.eventTypeBtn,
                        eventType === 'Solo Player' && styles.eventTypeBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.eventTypeBtnText,
                          eventType === 'Solo Player' && styles.eventTypeBtnTextActive,
                        ]}
                      >
                        Solo Player
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setEventType('Team Hunt')}
                      {...({ onClick: () => setEventType('Team Hunt') } as any)}
                      style={[
                        styles.eventTypeBtn,
                        eventType === 'Team Hunt' && styles.eventTypeBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.eventTypeBtnText,
                          eventType === 'Team Hunt' && styles.eventTypeBtnTextActive,
                        ]}
                      >
                        Team Hunt
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {eventType === 'Team Hunt' ? (
                    <>
                      <View style={styles.teamSizesRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputFieldLabel}>MIN TEAM SIZE</Text>
                          <TextInput
                            value={String(minTeamSize)}
                            onChangeText={(val) => {
                              const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                              setMinTeamSize(isNaN(num) ? 1 : num);
                            }}
                            keyboardType="number-pad"
                            style={styles.textInputBox}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputFieldLabel}>MAX TEAM SIZE</Text>
                          <TextInput
                            value={String(maxTeamSize)}
                            onChangeText={(val) => {
                              const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                              setMaxTeamSize(isNaN(num) ? 1 : num);
                            }}
                            keyboardType="number-pad"
                            style={styles.textInputBox}
                          />
                        </View>
                      </View>

                      <Text style={styles.eventTypeCaption}>
                        Each team has exactly one Team Leader, who registers the team and shares a team code.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.eventTypeCaption}>
                      Each player participates individually and competes on the leaderboard.
                    </Text>
                  )}
                </View>

                {/* CARD 3: 6-DIGIT ACCESS CODE */}
                <View style={styles.goldCard}>
                  <View style={styles.cardHeaderWithAction}>
                    <Text style={styles.goldCardHeader}>6-DIGIT ACCESS CODE</Text>
                    <TouchableOpacity
                      onPress={generateNewPin}
                      {...({ onClick: generateNewPin } as any)}
                      style={styles.autoPill}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.autoPillText}>AUTO</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 6 Digit Boxes */}
                  <View style={styles.digitsContainer}>
                    {digits.map((digit, idx) => (
                      <View key={idx} style={styles.digitBox}>
                        <Text style={styles.digitNumber}>{digit}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Bronze Buttons */}
                  <View style={styles.codeButtonsRow}>
                    <TouchableOpacity
                      onPress={generateNewPin}
                      {...({ onClick: generateNewPin } as any)}
                      style={styles.bronzeBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bronzeBtnText}>NEW PIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCopyCode}
                      {...({ onClick: handleCopyCode } as any)}
                      style={styles.bronzeBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bronzeBtnText}>
                        {isCopied ? 'COPIED!' : 'COPY CODE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARD 3: DIFFICULTY */}
                <View style={styles.goldCard}>
                  <Text style={styles.goldCardHeader}>DIFFICULTY</Text>

                  {/* Row 1 */}
                  <View style={styles.diffRow}>
                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Easy')}
                      {...({ onClick: () => handleSelectDifficulty('Easy') } as any)}
                      style={[styles.diffPill, difficulty === 'Easy' && styles.diffPillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.diffPillText, difficulty === 'Easy' && styles.diffPillTextActive]}>
                        ★ Easy ₹49
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Medium')}
                      {...({ onClick: () => handleSelectDifficulty('Medium') } as any)}
                      style={[styles.diffPill, difficulty === 'Medium' && styles.diffPillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.diffPillText, difficulty === 'Medium' && styles.diffPillTextActive]}>
                        ★★ Medium ₹99
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Hard')}
                      {...({ onClick: () => handleSelectDifficulty('Hard') } as any)}
                      style={[styles.diffPill, difficulty === 'Hard' && styles.diffPillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.diffPillText, difficulty === 'Hard' && styles.diffPillTextActive]}>
                        ★★★ Hard ₹199
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 2 */}
                  <View style={[styles.diffRow, { marginTop: 8 }]}>
                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Master')}
                      {...({ onClick: () => handleSelectDifficulty('Master') } as any)}
                      style={[styles.diffPill, difficulty === 'Master' && styles.diffPillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.diffPillText, difficulty === 'Master' && styles.diffPillTextActive]}>
                        ★★★★ Master ₹299
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Expert')}
                      {...({ onClick: () => handleSelectDifficulty('Expert') } as any)}
                      style={[styles.diffPill, difficulty === 'Expert' && styles.diffPillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.diffPillText, difficulty === 'Expert' && styles.diffPillTextActive]}>
                        ★★★★★ Expert ₹499
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* STEP 2: CLUES (MATCHES EXACT USER REFERENCE SCREENSHOT)  */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <>
                {/* 1. CLUE SOURCE CARD */}
                <View style={styles.goldCard}>
                  <View style={styles.cardHeaderWithAction}>
                    <Text style={styles.goldCardHeader}>CLUE SOURCE</Text>
                    <View style={styles.hardBadge}>
                      <Text style={styles.hardBadgeText}>{difficulty.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Switcher: Office Campus vs College Campus vs Custom */}
                  <View style={styles.clueSourceRow}>
                    <TouchableOpacity
                      onPress={() => handleSwitchPreset('office')}
                      style={[
                        styles.clueSourceBtn,
                        selectedCampusPreset === 'office' && clueSource === 'system' && styles.clueSourceBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.clueSourceBtnText,
                          selectedCampusPreset === 'office' && clueSource === 'system' && styles.clueSourceBtnTextActive,
                        ]}
                      >
                        🏢 Office Defaults ({OFFICE_CAMPUS_DEFAULT_CLUES.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSwitchPreset('college')}
                      style={[
                        styles.clueSourceBtn,
                        selectedCampusPreset === 'college' && clueSource === 'system' && styles.clueSourceBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.clueSourceBtnText,
                          selectedCampusPreset === 'college' && clueSource === 'system' && styles.clueSourceBtnTextActive,
                        ]}
                      >
                        🎓 College Defaults ({COLLEGE_CAMPUS_DEFAULT_CLUES.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.clueSourceCaption}>
                    {selectedCampusPreset === 'office'
                      ? 'Pre-loaded with official Office Campus default riddles (Keyboard, Printer, Monitor, Wi-Fi Router, Cabinet, Office Chair, Pantry / Break Room, Office Door, Paper Shredder, Refrigerator).'
                      : 'Pre-loaded with official College Campus default riddles (Library, Dustbin, Canteen, Clock, CCTV Camera, Mirror, Staircase, Textbook, Water Cooler, Blackboard).'}
                  </Text>
                </View>

                {/* 2. NUMBER OF CLUES / STAGES CARD (ORGANIZER SETS EXACT CLUE COUNT) */}
                <View style={styles.goldCard}>
                  <View style={styles.cardHeaderWithAction}>
                    <Text style={styles.goldCardHeader}>NUMBER OF CLUES / STAGES</Text>
                    <View style={styles.clueCountActiveBadge}>
                      <Text style={styles.clueCountActiveBadgeText}>
                        {cluesList.length} OF 10 SELECTED ({selectedCampusPreset === 'office' ? 'OFFICE' : 'COLLEGE'})
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.clueCountDescription}>
                    Set how many clues and stages you want for this hunt (1 to 10). Sourced from standard {selectedCampusPreset === 'office' ? 'Office Campus' : 'College Campus'} riddles.
                  </Text>

                  {/* Stepper + Display */}
                  <View style={styles.stepperContainerRow}>
                    <TouchableOpacity
                      onPress={() => handleSetClueCount(clueCount - 1)}
                      disabled={clueCount <= 1}
                      style={[styles.stepperBtn, clueCount <= 1 && styles.stepperBtnDisabled]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.stepperDisplayBox}>
                      <Text style={styles.stepperDisplayNumber}>{clueCount}</Text>
                      <Text style={styles.stepperDisplaySubtext}>
                        {clueCount === 1 ? 'CLUE / STAGE' : 'CLUES / STAGES'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleSetClueCount(clueCount + 1)}
                      disabled={clueCount >= 10}
                      style={[styles.stepperBtn, clueCount >= 10 && styles.stepperBtnDisabled]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.stepperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Preset Chips */}
                  <Text style={[styles.inputFieldLabel, { marginTop: 10 }]}>QUICK COUNT PRESETS</Text>
                  <View style={styles.quickCountPresetsRow}>
                    {[3, 5, 7, 8, 10].map((presetNum) => (
                      <TouchableOpacity
                        key={presetNum}
                        onPress={() => handleSetClueCount(presetNum)}
                        style={[
                          styles.quickCountChip,
                          clueCount === presetNum && styles.quickCountChipActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.quickCountChipText,
                            clueCount === presetNum && styles.quickCountChipTextActive,
                          ]}
                        >
                          {presetNum === 10 ? '★ 10 (All)' : `${presetNum} Clues`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Reset / Reload defaults button */}
                  <View style={styles.reloadDefaultsRow}>
                    <TouchableOpacity
                      onPress={handleResetDefaults}
                      style={styles.reloadDefaultsBtn}
                      activeOpacity={0.8}
                    >
                      <Sparkles size={12} color="#fbbf24" />
                      <Text style={styles.reloadDefaultsBtnText}>
                        Reload 10 {selectedCampusPreset === 'office' ? 'Office' : 'College'} Default Riddles
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. TRAIL SEQUENCE PILLS */}
                <View style={styles.trailSequenceRow}>
                  <View style={styles.trailPill}>
                    <Text style={styles.trailPillText}>CLUE 1</Text>
                  </View>
                  <Text style={styles.trailChevron}>›</Text>
                  <View style={styles.trailPill}>
                    <Text style={styles.trailPillText}>FIND CHECKPOINT</Text>
                  </View>
                  <Text style={styles.trailChevron}>›</Text>
                  <View style={styles.trailPill}>
                    <Text style={styles.trailPillText}>SCAN QR</Text>
                  </View>
                  <Text style={styles.trailChevron}>›</Text>
                  <View style={styles.trailPill}>
                    <Text style={styles.trailPillText}>NEXT STAGE ({cluesList.length})</Text>
                  </View>
                </View>

                {/* 4. ACTIVE CLUE CARDS */}
                <View style={styles.cluesListSectionHeader}>
                  <Text style={styles.cluesListSectionTitle}>
                    ACTIVE CLUES TRAIL ({cluesList.length} STAGES)
                  </Text>
                  {cluesList.length > 3 && (
                    <TouchableOpacity
                      onPress={() => setExpandedAllClues(!expandedAllClues)}
                      style={styles.expandToggleBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.expandToggleBtnText}>
                        {expandedAllClues ? 'Show Less ▲' : `Show All (${cluesList.length}) ▼`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {(expandedAllClues ? cluesList : cluesList.slice(0, 3)).map((clue, idx) => (
                  <TouchableOpacity
                    key={clue.id || idx}
                    onPress={() => handleOpenEditClue(idx)}
                    style={styles.clueParchmentCard}
                    activeOpacity={0.88}
                  >
                    <View style={styles.clueParchmentLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.clueParchmentTitle}>
                          #{idx + 1} {clue.title}
                        </Text>
                        <View style={styles.pointsBadgeMini}>
                          <Text style={styles.pointsBadgeMiniText}>+{clue.points} XP</Text>
                        </View>
                      </View>
                      <Text style={styles.clueParchmentRiddle}>
                        "{clue.riddle}"
                      </Text>
                      <Text style={styles.clueParchmentAnswerPlace}>
                        <Text style={{ fontWeight: '800' }}>Answer place: </Text>
                        {clue.answerPlace}
                      </Text>
                      {clue.answerKey && (
                        <Text style={styles.clueParchmentAnswerKey}>
                          <Text style={{ fontWeight: '800' }}>Secret code: </Text>
                          {clue.answerKey}
                        </Text>
                      )}
                    </View>

                    <View style={styles.clueParchmentRight}>
                      <QrCodeGraphic
                        value={`CQ_CHECKPOINT:${eventCode ? `evt-${eventCode}` : 'evt-college'}:clue-${idx + 1}:${clue.answerKey || 'KEY'}`}
                        size={64}
                        label={clue.qrLabel || `QR ${idx + 1}`}
                      />
                      <Text style={styles.clickToEditText}>Tap to edit</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* 5. WIDE BRONZE BUTTON: + ADD / EDIT CLUE */}
                <TouchableOpacity
                  onPress={handleOpenAddClue}
                  {...({ onClick: handleOpenAddClue } as any)}
                  style={styles.addEditClueWideBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addEditClueWideBtnText}>+ ADD / EDIT CLUES ({cluesList.length})</Text>
                </TouchableOpacity>

                {/* 5. CLUE KIT PDF CARD */}
                <View style={[styles.goldCard, { marginTop: 10 }]}>
                  <View style={styles.cardHeaderWithAction}>
                    <Text style={styles.goldCardHeader}>CLUE KIT PDF</Text>
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyBadgeText}>READY</Text>
                    </View>
                  </View>

                  <Text style={styles.clueKitDescText}>
                    All clues, QR codes and answer places in order, ready to print. QR codes hold a secret scan code, never the answer.
                  </Text>

                  {/* DOWNLOAD CLUE KIT (PDF) BUTTON */}
                  <TouchableOpacity
                    onPress={() => setShowClueKitPdfModal(true)}
                    {...({ onClick: () => setShowClueKitPdfModal(true) } as any)}
                    style={styles.downloadClueKitBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.downloadClueKitBtnText}>DOWNLOAD CLUE KIT (PDF)</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ======================================================== */}
            {/* STEP 3: PAYMENT (MATCHES EXACT USER REFERENCE SCREENSHOT)*/}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <>
                {/* 1. REGISTRATION FEE & PAYMENT CARD */}
                <View style={styles.goldCard}>
                  <Text style={styles.goldCardHeader}>REGISTRATION FEE & PAYMENT</Text>

                  {/* Free Entry vs Paid Event Toggle Pills */}
                  <View style={styles.paymentSwitchRow}>
                    <TouchableOpacity
                      onPress={() => setIsPaid(false)}
                      {...({ onClick: () => setIsPaid(false) } as any)}
                      style={[styles.paymentSwitchBtn, !isPaid && styles.paymentSwitchBtnActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.paymentSwitchBtnText, !isPaid && styles.paymentSwitchBtnTextActive]}>
                        Free Entry
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsPaid(true)}
                      {...({ onClick: () => setIsPaid(true) } as any)}
                      style={[styles.paymentSwitchBtn, isPaid && styles.paymentSwitchBtnActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.paymentSwitchBtnText, isPaid && styles.paymentSwitchBtnTextActive]}>
                        Paid Event (UPI / QR)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* FEE AMOUNT */}
                  <Text style={styles.inputFieldLabel}>FEE AMOUNT</Text>
                  <View style={styles.feeAmountRow}>
                    <TouchableOpacity
                      onPress={() => setCurrency('₹')}
                      style={[styles.currencyBox, currency === '₹' && styles.currencyBoxActive]}
                    >
                      <Text style={[styles.currencyBoxText, currency === '₹' && styles.currencyBoxTextActive]}>₹</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setCurrency('$')}
                      style={[styles.currencyBox, currency === '$' && styles.currencyBoxActive]}
                    >
                      <Text style={[styles.currencyBoxText, currency === '$' && styles.currencyBoxTextActive]}>$</Text>
                    </TouchableOpacity>

                    <TextInput
                      value={String(registrationFee)}
                      onChangeText={(val) => setRegistrationFee(Number(val.replace(/[^0-9]/g, '')) || 0)}
                      keyboardType="numeric"
                      style={styles.feeAmountInput}
                    />
                  </View>

                  {/* FEE TYPE */}
                  <Text style={styles.inputFieldLabel}>FEE TYPE</Text>
                  <View style={styles.feeTypeRow}>
                    <TouchableOpacity
                      onPress={() => setFeeType('per_player')}
                      {...({ onClick: () => setFeeType('per_player') } as any)}
                      style={[styles.feeTypePill, feeType === 'per_player' && styles.feeTypePillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.feeTypePillText, feeType === 'per_player' && styles.feeTypePillTextActive]}>
                        Per Player
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setFeeType('per_team')}
                      {...({ onClick: () => setFeeType('per_team') } as any)}
                      style={[styles.feeTypePill, feeType === 'per_team' && styles.feeTypePillActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.feeTypePillText, feeType === 'per_team' && styles.feeTypePillTextActive]}>
                        Per Team
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* HORIZONTAL PRESETS */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalPresetsScroll}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Easy')}
                      style={[styles.quickPresetPill, difficulty === 'Easy' && styles.quickPresetPillActive]}
                    >
                      <Text style={[styles.quickPresetText, difficulty === 'Easy' && styles.quickPresetTextActive]}>
                        Easy ₹49
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Medium')}
                      style={[styles.quickPresetPill, difficulty === 'Medium' && styles.quickPresetPillActive]}
                    >
                      <Text style={[styles.quickPresetText, difficulty === 'Medium' && styles.quickPresetTextActive]}>
                        Medium ₹99
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Hard')}
                      style={[styles.quickPresetPill, difficulty === 'Hard' && styles.quickPresetPillActive]}
                    >
                      <Text style={[styles.quickPresetText, difficulty === 'Hard' && styles.quickPresetTextActive]}>
                        Hard ₹199
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Master')}
                      style={[styles.quickPresetPill, difficulty === 'Master' && styles.quickPresetPillActive]}
                    >
                      <Text style={[styles.quickPresetText, difficulty === 'Master' && styles.quickPresetTextActive]}>
                        Master ₹299
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleSelectDifficulty('Expert')}
                      style={[styles.quickPresetPill, difficulty === 'Expert' && styles.quickPresetPillActive]}
                    >
                      <Text style={[styles.quickPresetText, difficulty === 'Expert' && styles.quickPresetTextActive]}>
                        Expert ₹499
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>

                  {/* Visual scroll bar slider indicator */}
                  <View style={styles.scrollTrackContainer}>
                    <View style={styles.scrollTrackThumb} />
                  </View>

                  {/* ORGANIZER UPI ID */}
                  <Text style={styles.inputFieldLabel}>ORGANIZER UPI ID</Text>
                  <TextInput
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="yourname@bank"
                    placeholderTextColor="#64748b"
                    style={styles.textInputBox}
                  />

                  {/* QUICK UPI HANDLES SCROLLER */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.upiHandlesScroll}
                  >
                    {['@oksbi', '@okhdfcbank', '@paytm', '@ybl', '@icici', '@apl'].map((handle) => (
                      <TouchableOpacity
                        key={handle}
                        onPress={() => {
                          const base = upiId.includes('@') ? upiId.split('@')[0] : upiId;
                          setUpiId(`${base || 'yourname'}${handle}`);
                        }}
                        style={styles.upiHandleChip}
                      >
                        <Text style={styles.upiHandleChipText}>{handle}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Visual scroll bar slider indicator */}
                  <View style={styles.scrollTrackContainer}>
                    <View style={[styles.scrollTrackThumb, { width: 55, left: 15 }]} />
                  </View>

                  {/* PAYEE / ACCOUNT NAME */}
                  <Text style={styles.inputFieldLabel}>PAYEE / ACCOUNT NAME</Text>
                  <TextInput
                    value={payeeName}
                    onChangeText={setPayeeName}
                    placeholder="Name shown to players"
                    placeholderTextColor="#64748b"
                    style={styles.textInputBox}
                  />
                </View>

                {/* 2. PAYMENT QR FOR PLAYERS CARD */}
                <View style={styles.goldCard}>
                  <View style={styles.cardHeaderWithAction}>
                    <Text style={styles.goldCardHeader}>PAYMENT QR FOR PLAYERS</Text>
                    <TouchableOpacity
                      onPress={handleRunTestScan}
                      {...({ onClick: handleRunTestScan } as any)}
                      style={styles.testScanPill}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.testScanPillText}>TEST / SCAN</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Upload Box with Yellow Dashed Border and Up Arrow */}
                  <TouchableOpacity
                    onPress={handleTriggerUpload}
                    {...({ onClick: handleTriggerUpload } as any)}
                    style={styles.qrUploadDashedArea}
                    activeOpacity={0.8}
                  >
                    {paymentQrUrl ? (
                      <View style={{ alignItems: 'center' }}>
                        <Image source={{ uri: paymentQrUrl }} style={styles.uploadedQrPreview} />
                        <Text style={styles.uploadMainTitle}>Payment QR Loaded ✓</Text>
                        <Text style={styles.uploadSubTitle}>Click to replace image</Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.uploadArrowCircle}>
                          <ArrowUp size={22} color="#fbbf24" strokeWidth={2.5} />
                        </View>
                        <Text style={styles.uploadMainTitle}>Upload your payment QR</Text>
                        <Text style={styles.uploadSubTitle}>PNG or JPG · players scan this to pay the fee</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* City Skyline Silhouette */}
            <View style={styles.skylineWrap}>
              <Svg width="100%" height={75} viewBox="0 0 360 75" preserveAspectRatio="none">
                <Rect x="15" y="24" width="38" height="51" fill="#080f20" />
                <Rect x="60" y="38" width="46" height="37" fill="#050a16" />
                <Rect x="115" y="16" width="40" height="59" fill="#080f20" />
                <Rect x="165" y="30" width="38" height="45" fill="#050a16" />
                <Rect x="210" y="12" width="48" height="63" fill="#080f20" />
                <Rect x="268" y="35" width="42" height="40" fill="#050a16" />
                <Rect x="318" y="20" width="35" height="55" fill="#080f20" />

                <Rect x="23" y="34" width="6" height="8" rx="1" fill="#fbbf24" opacity="0.9" />
                <Rect x="37" y="34" width="6" height="8" rx="1" fill="#fbbf24" opacity="0.9" />
                <Rect x="23" y="48" width="6" height="8" rx="1" fill="#fbbf24" opacity="0.9" />
                <Rect x="37" y="48" width="6" height="8" rx="1" fill="#fbbf24" opacity="0.9" />
              </Svg>
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions */}
          <View style={styles.footerRow}>
            {currentStep === 1 && (
              <>
                <TouchableOpacity
                  onPress={onClose}
                  {...({ onClick: onClose } as any)}
                  style={styles.discardBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.discardBtnText}>DISCARD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentStep(2)}
                  {...({ onClick: () => setCurrentStep(2) } as any)}
                  style={styles.nextBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextBtnText}>NEXT: CLUES ›</Text>
                </TouchableOpacity>
              </>
            )}

            {currentStep === 2 && (
              <>
                <TouchableOpacity
                  onPress={() => setCurrentStep(1)}
                  {...({ onClick: () => setCurrentStep(1) } as any)}
                  style={styles.discardBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.discardBtnText}>‹ BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCurrentStep(3)}
                  {...({ onClick: () => setCurrentStep(3) } as any)}
                  style={styles.nextBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextBtnText}>NEXT: PAYMENT ›</Text>
                </TouchableOpacity>
              </>
            )}

            {currentStep === 3 && (
              <>
                <TouchableOpacity
                  onPress={() => setCurrentStep(2)}
                  {...({ onClick: () => setCurrentStep(2) } as any)}
                  style={styles.discardBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.discardBtnText}>‹ BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateQuest}
                  {...({ onClick: handleCreateQuest } as any)}
                  style={styles.nextBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextBtnText}>CREATE & PUBLISH</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ======================================================== */}
      {/* CLUE KIT PDF MODAL (MATCHES RIGHT SCREENSHOT EXACTLY)    */}
      {/* ======================================================== */}
      {showClueKitPdfModal && (
        <Modal
          visible={showClueKitPdfModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClueKitPdfModal(false)}
        >
          <View style={styles.pdfModalBackdrop}>
            <View style={styles.pdfPhoneContainer}>
              {/* PDF Top Bar */}
              <View style={styles.pdfTopBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <FileText size={15} color="#94a3b8" />
                  <Text style={styles.pdfFileNameText} numberOfLines={1}>
                    clue-kit-great-belltower.pdf
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleDownloadClueKit}
                  style={styles.pdfDownloadBtn}
                  activeOpacity={0.8}
                >
                  <Download size={13} color="#fbbf24" />
                  <Text style={styles.pdfDownloadBtnText}>
                    {clueKitDownloaded ? 'SAVED ✓' : '↓ DOWNLOAD'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowClueKitPdfModal(false)}
                  style={styles.pdfCloseBtn}
                  activeOpacity={0.8}
                >
                  <X size={15} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Printable Parchment Sheet Document */}
              <ScrollView style={styles.pdfSheetScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.parchmentDocumentSheet}>
                  {/* Document Header */}
                  <View style={styles.docHeaderCenter}>
                    <Text style={styles.docCampusQuestTitle}>CAMPUS QUEST</Text>
                    <Text style={styles.docMysteryTitle}>{title.toUpperCase()}</Text>
                    <Text style={styles.docMetaText}>
                      {location} · 2026-08-10 · 10:00 · PIN {eventCode}
                    </Text>

                    {/* Red Warning Pill */}
                    <View style={styles.organizerWarningPill}>
                      <Text style={styles.organizerWarningText}>
                        ORGANIZER COPY · CONTAINS ANSWERS · DO NOT SHARE
                      </Text>
                    </View>
                  </View>

                  {/* 4 Printed Clue Items separated by dashed lines */}
                  {cluesList.map((clue, idx) => (
                    <View key={clue.id}>
                      <View style={styles.docClueRow}>
                        {/* Number */}
                        <Text style={styles.docClueBigNumber}>{idx + 1}</Text>

                        {/* Clue Details */}
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.docRiddleItalic}>
                            {clue.riddle.startsWith('[') ? clue.riddle : `"${clue.riddle}"`}
                          </Text>
                          <Text style={styles.docAnswerPlace}>
                            <Text style={{ fontWeight: '800' }}>Answer place: </Text>
                            {clue.answerPlace}
                          </Text>
                          <Text style={styles.docAnswerKey}>
                            <Text style={{ fontWeight: '800' }}>Answer key: </Text>
                            {clue.answerKey}
                          </Text>
                          <Text style={styles.docPlaceInstruction}>
                            {clue.placeInstruction}
                          </Text>
                        </View>

                        {/* Large Crisp Scannable QR Code */}
                        <View style={styles.docQrWrap}>
                          <QrCodeGraphic
                            value={`CQ_CHECKPOINT:evt-101:clue-${idx + 1}:${clue.answerKey || 'KEY'}`}
                            size={76}
                            label={`QR ${idx + 1}`}
                            darkLabel={true}
                          />
                        </View>
                      </View>

                      {idx < cluesList.length - 1 && (
                        <View style={styles.docDashedDivider} />
                      )}
                    </View>
                  ))}

                  {/* Document Footer Instruction */}
                  <Text style={styles.docFooterInstruction}>
                    Print, cut along the lines, place each QR at its answer place · Page 1 of 1
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT CLUE MODAL                                    */}
      {/* ======================================================== */}
      {showAddEditClueModal && (
        <Modal
          visible={showAddEditClueModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddEditClueModal(false)}
        >
          <View style={styles.addClueModalBackdrop}>
            <View style={styles.addClueModalCard}>
              <View style={styles.addClueHeader}>
                <Text style={styles.addClueTitle}>
                  {editingClueIndex !== null && editingClueIndex < cluesList.length
                    ? `Edit Clue #${editingClueIndex + 1}`
                    : '+ Add New Quest Clue'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddEditClueModal(false)}
                  style={{ padding: 4 }}
                  activeOpacity={0.8}
                >
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 14 }} showsVerticalScrollIndicator={false}>
                {/* Horizontal Clue Selector Tabs */}
                <Text style={[styles.inputFieldLabel, { marginBottom: 6 }]}>SELECT CLUE TO CONFIGURE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, marginBottom: 14 }}
                >
                  {cluesList.map((c, i) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => handleSelectClueToEdit(i)}
                      style={[
                        styles.clueTabPill,
                        editingClueIndex === i && styles.clueTabPillActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.clueTabPillText,
                          editingClueIndex === i && styles.clueTabPillTextActive,
                        ]}
                      >
                        #{i + 1} Clue
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    onPress={() => handleSelectClueToEdit(null)}
                    style={[
                      styles.clueTabPill,
                      editingClueIndex === null && styles.clueTabPillActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.clueTabPillText,
                        editingClueIndex === null && styles.clueTabPillTextActive,
                      ]}
                    >
                      + Add New
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                <Text style={styles.inputFieldLabel}>CLUE TITLE</Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. THE SHADOW OF TIME"
                  placeholderTextColor="#64748b"
                  style={styles.textInputBox}
                />

                <Text style={styles.inputFieldLabel}>RIDDLE TEXT</Text>
                <TextInput
                  value={editRiddle}
                  onChangeText={setEditRiddle}
                  multiline
                  numberOfLines={3}
                  placeholder="Cryptic poem or riddle players read"
                  placeholderTextColor="#64748b"
                  style={[styles.textInputBox, { height: 60, textAlignVertical: 'top' }]}
                />

                <Text style={styles.inputFieldLabel}>ANSWER PLACE (CHECKPOINT)</Text>
                <TextInput
                  value={editAnswerPlace}
                  onChangeText={setEditAnswerPlace}
                  placeholder="e.g. Under the main clock tower archway"
                  placeholderTextColor="#64748b"
                  style={styles.textInputBox}
                />

                <Text style={styles.inputFieldLabel}>ANSWER KEY / SECRET CODE</Text>
                <TextInput
                  value={editAnswerKey}
                  onChangeText={setEditAnswerKey}
                  placeholder="e.g. CLOCK TOWER"
                  placeholderTextColor="#64748b"
                  style={styles.textInputBox}
                />

                <TouchableOpacity
                  onPress={handleSaveClueModal}
                  style={styles.saveCluePillBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveCluePillBtnText}>SAVE CLUE CHANGES ✓</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* QR Code Scanner Tester Modal */}
      {showQrTesterModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowQrTesterModal(false)}>
          <View style={styles.testModalBackdrop}>
            <View style={styles.testModalCard}>
              <View style={styles.testModalHeader}>
                <Text style={styles.testModalTitle}>UPI QR Code Verification</Text>
                <TouchableOpacity onPress={() => setShowQrTesterModal(false)}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.testModalBody}>
                {testScanSuccess ? (
                  <View style={styles.testSuccessBox}>
                    <CheckCircle2 size={32} color="#10b981" />
                    <Text style={styles.testSuccessTitle}>Valid Payment QR Code</Text>
                    <Text style={styles.testSuccessSub}>UPI ID: {upiId}</Text>
                    <Text style={styles.testSuccessSub}>Payee: {payeeName}</Text>
                    <Text style={styles.testSuccessSub}>Amount: {currency}{registrationFee}</Text>
                  </View>
                ) : (
                  <View style={styles.testScanningBox}>
                    <Sparkles size={28} color="#fbbf24" />
                    <Text style={styles.testScanningText}>Simulating Camera QR Scan...</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setShowQrTesterModal(false)}
                style={styles.testModalDoneBtn}
              >
                <Text style={styles.testModalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    zIndex: 999,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 412,
    height: 860,
    maxHeight: '96vh' as any,
    backgroundColor: '#070d19',
    borderRadius: 28,
    borderWidth: 1.8,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
  },
  modalBgArtwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 6,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'serif',
    letterSpacing: 0.8,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeCircleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    zIndex: 2,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#0c1527',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#b45309',
    borderColor: '#fbbf24',
  },
  tabPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  tabPillTextActive: {
    color: '#ffffff',
  },
  modalScroll: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  goldCard: {
    backgroundColor: '#07101f',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d4af37',
    padding: 14,
    marginBottom: 12,
    boxShadow: 'inset 0 0 0 2px #07101f, inset 0 0 0 3px rgba(184, 134, 11, 0.45)',
  },
  goldCardHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'serif',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  eventTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  eventTypeBtn: {
    flex: 1,
    backgroundColor: '#050a14',
    borderWidth: 1.2,
    borderColor: '#1e2f4c',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTypeBtnActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  eventTypeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  eventTypeBtnTextActive: {
    color: '#0f172a',
    fontWeight: '900',
  },
  teamSizesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  eventTypeCaption: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginTop: 2,
  },
  hardBadge: {
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#050a14',
  },
  hardBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  clueSourceRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  clueSourceBtn: {
    flex: 1,
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueSourceBtnActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  clueSourceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  clueSourceBtnTextActive: {
    color: '#1e1b4b',
    fontWeight: '900',
  },
  clueSourceCaption: {
    fontSize: 10.5,
    color: '#94a3b8',
    lineHeight: 14,
    marginTop: 2,
  },
  trailSequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 8,
  },
  trailPill: {
    backgroundColor: '#0c1527',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trailPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  trailChevron: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '900',
  },
  clueParchmentCard: {
    backgroundColor: '#deb887',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c59b6d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clueParchmentLeft: {
    flex: 1,
    paddingRight: 8,
  },
  clueParchmentTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#261a0d',
    fontFamily: 'serif',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  clueParchmentRiddle: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#3d2914',
    lineHeight: 14,
    marginBottom: 4,
  },
  clueParchmentAnswerPlace: {
    fontSize: 10,
    color: '#261a0d',
  },
  clueParchmentRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEditClueWideBtn: {
    backgroundColor: '#682d07',
    borderWidth: 1.2,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  addEditClueWideBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  clueCountActiveBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clueCountActiveBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  clueCountDescription: {
    fontSize: 10.5,
    color: '#94a3b8',
    lineHeight: 14,
    marginBottom: 10,
  },
  stepperContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 6,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  stepperBtnDisabled: {
    opacity: 0.35,
    borderColor: '#475569',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    lineHeight: 24,
  },
  stepperDisplayBox: {
    backgroundColor: '#050a14',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 140,
  },
  stepperDisplayNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 0.5,
  },
  stepperDisplaySubtext: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  quickCountPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickCountChip: {
    backgroundColor: '#09101f',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    flexGrow: 1,
  },
  quickCountChipActive: {
    backgroundColor: '#78350f',
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  quickCountChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  quickCountChipTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  reloadDefaultsRow: {
    marginTop: 6,
    alignItems: 'center',
  },
  reloadDefaultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  reloadDefaultsBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  cluesListSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  cluesListSectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  expandToggleBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  expandToggleBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93c5fd',
  },
  pointsBadgeMini: {
    backgroundColor: '#78350f',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pointsBadgeMiniText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#fef08a',
  },
  clueParchmentAnswerKey: {
    fontSize: 9.5,
    color: '#451a03',
    marginTop: 2,
  },
  clickToEditText: {
    fontSize: 8,
    color: '#5c3a1e',
    fontWeight: '700',
    marginTop: 2,
  },
  readyBadge: {
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  readyBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.8,
  },
  clueKitDescText: {
    fontSize: 10.5,
    color: '#cbd5e1',
    lineHeight: 14,
    marginVertical: 8,
  },
  downloadClueKitBtn: {
    backgroundColor: '#b45309',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  downloadClueKitBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },

  // COMMON FORM STYLES
  inputFieldLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 4,
  },
  textInputBox: {
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  iconInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  autoPill: {
    backgroundColor: '#09101f',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  autoPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.8,
  },
  digitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  digitBox: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#050a14',
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'serif',
  },
  codeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  bronzeBtn: {
    flex: 1,
    backgroundColor: '#682d07',
    borderWidth: 1.2,
    borderColor: '#d97706',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bronzeBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  diffPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#070d19',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffPillActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  diffPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  diffPillTextActive: {
    color: '#1e1b4b',
    fontWeight: '900',
  },

  // PAYMENT SPECIFIC STYLES
  paymentSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  paymentSwitchBtn: {
    flex: 1,
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentSwitchBtnActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  paymentSwitchBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  paymentSwitchBtnTextActive: {
    color: '#1e1b4b',
    fontWeight: '900',
  },
  feeAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  currencyBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyBoxActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  currencyBoxText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#cbd5e1',
  },
  currencyBoxTextActive: {
    color: '#1e1b4b',
  },
  feeAmountInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  feeTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  feeTypePill: {
    flex: 1,
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeTypePillActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  feeTypePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  feeTypePillTextActive: {
    color: '#1e1b4b',
    fontWeight: '900',
  },
  horizontalPresetsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  quickPresetPill: {
    backgroundColor: '#070d19',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickPresetPillActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  quickPresetText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#fbbf24',
  },
  quickPresetTextActive: {
    color: '#1e1b4b',
    fontWeight: '900',
  },
  scrollTrackContainer: {
    height: 5,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollTrackThumb: {
    position: 'absolute',
    left: 40,
    top: 0,
    bottom: 0,
    width: 65,
    backgroundColor: '#94a3b8',
    borderRadius: 3,
  },
  upiHandlesScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  upiHandleChip: {
    backgroundColor: '#09101f',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upiHandleChipText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  testScanPill: {
    backgroundColor: '#060a14',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  testScanPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.6,
  },
  qrUploadDashedArea: {
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(5, 10, 20, 0.6)',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadMainTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  uploadSubTitle: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  uploadedQrPreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 8,
  },

  skylineWrap: {
    height: 75,
    marginTop: 6,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.25)',
    backgroundColor: '#070d19',
    zIndex: 2,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  discardBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#e2e8f0',
    letterSpacing: 0.8,
  },
  nextBtn: {
    flex: 1.6,
    backgroundColor: '#d97706',
    borderRadius: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  nextBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },

  // CLUE KIT PDF MODAL STYLES (MATCHES RIGHT SCREENSHOT)
  pdfModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 17, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    zIndex: 9999,
  },
  pdfPhoneContainer: {
    width: '100%',
    maxWidth: 412,
    height: 860,
    maxHeight: '96vh' as any,
    backgroundColor: '#070d19',
    borderRadius: 28,
    borderWidth: 1.8,
    borderColor: 'rgba(217, 119, 6, 0.45)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.8,
    shadowRadius: 36,
  },
  pdfTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0a1324',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  pdfFileNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b45309',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  pdfDownloadBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  pdfCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfSheetScroll: {
    flex: 1,
    backgroundColor: '#050a14',
    padding: 10,
  },
  parchmentDocumentSheet: {
    backgroundColor: '#faf6ed',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2d9c8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  docHeaderCenter: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 14,
  },
  docCampusQuestTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#854d0e',
    fontFamily: 'serif',
    letterSpacing: 1.2,
  },
  docMysteryTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1e293b',
    fontFamily: 'serif',
    marginTop: 2,
    textAlign: 'center',
  },
  docMetaText: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },
  organizerWarningPill: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginTop: 6,
    backgroundColor: '#fef2f2',
  },
  organizerWarningText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#b91c1c',
    letterSpacing: 0.4,
  },
  docClueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  docClueBigNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#78350f',
    fontFamily: 'serif',
    width: 22,
    textAlign: 'center',
  },
  docRiddleItalic: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#1e293b',
    lineHeight: 13,
    marginBottom: 2,
  },
  docAnswerPlace: {
    fontSize: 9.5,
    color: '#334155',
  },
  docAnswerKey: {
    fontSize: 9.5,
    color: '#1e293b',
    fontWeight: '700',
  },
  docPlaceInstruction: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 1,
  },
  docQrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  docDashedDivider: {
    height: 1,
    borderWidth: 0.8,
    borderColor: '#d6c7b2',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  docFooterInstruction: {
    fontSize: 8.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2d9c8',
  },

  // ADD / EDIT CLUE MODAL
  addClueModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    zIndex: 9999,
  },
  addClueModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0c1527',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    overflow: 'hidden',
  },
  addClueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#080f1d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  addClueTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
  },
  clueTabPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#070e1b',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  clueTabPillActive: {
    backgroundColor: '#b45309',
    borderColor: '#fbbf24',
  },
  clueTabPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  clueTabPillTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  saveCluePillBtn: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  saveCluePillBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },

  // QR SCAN TESTER
  testModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  testModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0c1527',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    padding: 16,
  },
  testModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testModalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
  },
  testModalBody: {
    marginVertical: 12,
    alignItems: 'center',
  },
  testScanningBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  testScanningText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  testSuccessBox: {
    alignItems: 'center',
    gap: 4,
  },
  testSuccessTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10b981',
    marginTop: 4,
  },
  testSuccessSub: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  testModalDoneBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  testModalDoneBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
});
