import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowLeft,
  Clock,
  Trophy,
  Sparkles,
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Compass,
  Zap,
  MapPin,
  Shield,
  Radio,
  Eye,
  Award,
  Flame,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import { Clue, TreasureEvent, UserProfile } from '../../types';
import { CheckpointQrScannerModal } from './CheckpointQrScannerModal';
import { recordTeamClueSolved } from '../../utils/huntProgressTracker';
import { generateCluesForDifficulty } from '../../utils/clueGenerator';
import {
  playMysterySound,
  playCelebrationSound,
  playSuccessSound,
  playErrorSound,
} from '../../utils/audioEffects';
import {
  getRandomWordRiddle,
  getRandom5DigitPair,
  validateWordAnswer,
  saveSecretMissionOutcome,
  SecretWordRiddle,
  Paired5DigitMission,
} from '../../data/secretMissionRiddles';

interface GameDashboardScreenProps {
  event: TreasureEvent;
  user: UserProfile;
  onBackToEvents: () => void;
  onCompleteHunt: (finalScore: number, solvedCount: number) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onEliminate?: (eventId: string) => void;
}

export const GameDashboardScreen: React.FC<GameDashboardScreenProps> = ({
  event,
  user,
  onBackToEvents,
  onCompleteHunt,
  onUpdateUser,
  onEliminate,
}) => {
  // Clues list — Every hunt must have 7 to 8 full clues and stages
  const clues: Clue[] = useMemo(() => {
    if (event.clues && event.clues.length >= 7) {
      return event.clues;
    }
    const generated = generateCluesForDifficulty(
      event.id,
      event.difficulty || 'Hard',
      event.campusName || 'Campus Grounds',
      event.title
    );
    if (event.clues && event.clues.length > 0) {
      const existingCount = event.clues.length;
      const extras = generated.slice(existingCount, 8).map((c, i) => ({
        ...c,
        order: existingCount + i + 1,
      }));
      return [...event.clues, ...extras];
    }
    return generated;
  }, [event.clues, event.difficulty, event.id, event.campusName, event.title]);

  const totalClues = clues.length;

  // Active game state
  const [currentClueIdx, setCurrentClueIdx] = useState(0);
  const [solvedClueIds, setSolvedClueIds] = useState<string[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<number[]>([]);
  const [userScore, setUserScore] = useState(user.score || 850);
  const [answerInput, setAnswerInput] = useState('');
  const [solutionError, setSolutionError] = useState('');
  const [solutionSuccess, setSolutionSuccess] = useState(false);

  // Reference UI Hint State ('locked' | 'warning' | 'unlocked')
  const [hintState, setHintState] = useState<'locked' | 'warning' | 'unlocked'>('locked');
  const [hintDeductionApplied, setHintDeductionApplied] = useState(false);

  // Reference UI Answer & QR scanner state
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [checkError, setCheckError] = useState('');

  // Remaining event timer (e.g. 5400 seconds = 1.5 hrs)
  const [secondsRemaining, setSecondsRemaining] = useState(5400);

  // QR Scanner Modal State
  const [showQrModal, setShowQrModal] = useState(false);

  // Next Step Unlocked Modal State (Triggered immediately upon scanning physical QR code)
  const [unlockedNextStepModal, setUnlockedNextStepModal] = useState<{
    prevTitle: string;
    nextClue: Clue;
    earnedXP: number;
    checkpointNum: number;
  } | null>(null);

  // SECRET MISSION STATE (Requirement #4 & User Riddle Specification)
  const [secretMissionTriggered, setSecretMissionTriggered] = useState(false);
  const [showSecretMissionPopup, setShowSecretMissionPopup] = useState(false);
  const [secretMissionActive, setSecretMissionActive] = useState(false);
  const [secretMissionSolved, setSecretMissionSolved] = useState(false);
  const [secretTimerSeconds, setSecretTimerSeconds] = useState(579); // 09:39 matching reference

  // Multi-step secret mission flow:
  // Step 1: 'word' -> shows 1 word riddle at a time
  // Step 2: 'word_cleared' -> shows correct answer and button to crack 5-digit code
  // Step 3: 'five_digit' -> shows 2 number riddles to crack 5-digit code
  // Step 4: 'submitted_sealed' -> submitted without revealing score or answer until end of game
  const [secretStep, setSecretStep] = useState<'word' | 'word_cleared' | 'five_digit' | 'submitted_sealed'>('word');
  const [wordRiddle, setWordRiddle] = useState<SecretWordRiddle>(() => {
    const seed = (event.id.charCodeAt(0) || 1) % 8;
    return getRandomWordRiddle(seed);
  });
  const [numberPair, setNumberPair] = useState<Paired5DigitMission>(() => {
    const seed = (event.id.charCodeAt(event.id.length - 1) || 2) % 7;
    return getRandom5DigitPair(seed);
  });
  const [secretWordInput, setSecretWordInput] = useState('');
  const [secretWordError, setSecretWordError] = useState('');
  const [fiveDigitInput, setFiveDigitInput] = useState('');
  const [fiveDigitError, setFiveDigitError] = useState('');
  const [savedOutcomeCode, setSavedOutcomeCode] = useState('');

  // ANTI-CHEAT & 2-STRIKES ENFORCEMENT PROTOCOL
  const [strikesCount, setStrikesCount] = useState<number>(0);
  const [isEliminated, setIsEliminated] = useState<boolean>(false);
  const [showStrikeModal, setShowStrikeModal] = useState<boolean>(false);
  const [currentStrikeInfo, setCurrentStrikeInfo] = useState<{
    strikeNumber: number;
    reason: string;
    penalty: number;
  } | null>(null);

  const lastViolationTimeRef = React.useRef<number>(0);

  // Core Anti-Cheat Violation Handler
  const triggerViolation = (reason: string) => {
    // If player is already eliminated or finished all clues, don't double strike
    if (isEliminated || solvedClueIds.length >= totalClues) return;

    // Debounce to prevent cascading double strikes within 3 seconds
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 3000) return;
    lastViolationTimeRef.current = now;

    playErrorSound();

    setStrikesCount((prevStrikes) => {
      const nextStrikes = prevStrikes + 1;
      if (nextStrikes === 1) {
        // STRIKE 1: Deduct 500 XP and issue final warning
        setUserScore((s) => {
          const updated = Math.max(0, s - 500);
          if (onUpdateUser) {
            onUpdateUser({ score: updated });
          }
          return updated;
        });

        setCurrentStrikeInfo({
          strikeNumber: 1,
          reason,
          penalty: 500,
        });
        setShowStrikeModal(true);
      } else {
        // STRIKE 2: Immediate Elimination & Disqualification
        setIsEliminated(true);
        if (onEliminate) {
          onEliminate(event.id);
        }
        setCurrentStrikeInfo({
          strikeNumber: 2,
          reason,
          penalty: 0,
        });
        setShowStrikeModal(true);
      }
      return nextStrikes;
    });
  };

  // Intercept Browser Back Button / History navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.history.pushState({ inGame: true }, '', window.location.href);
    } catch (e) {}

    const handlePopState = () => {
      if (isEliminated) {
        onBackToEvents();
        return;
      }
      try {
        window.history.pushState({ inGame: true }, '', window.location.href);
      } catch (e) {}
      triggerViolation('Browser Back button navigation detected during live competition.');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isEliminated, solvedClueIds.length, totalClues]);

  // Enforce "Stay on screen": Tab switch, minimize, or losing window focus
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (!isEliminated && solvedClueIds.length < totalClues) {
          triggerViolation('Screen defocus detected: Left active game screen or switched browser tabs.');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEliminated, solvedClueIds.length, totalClues]);

  const handleAttemptExit = () => {
    if (isEliminated) {
      onBackToEvents();
      return;
    }
    triggerViolation('Attempted to click Back / Exit button during live competition.');
  };

  const formatSecretTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const currentClue = clues[currentClueIdx] || clues[0];

  // Event timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Secret mission timer tick when mission mode is active
  useEffect(() => {
    if (!secretMissionActive || secretMissionSolved) return;
    const timer = setInterval(() => {
      setSecretTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSecretMissionActive(false);
          setSecretWordError('Time window elapsed for secret mission.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secretMissionActive, secretMissionSolved]);

  // SECRET MISSION POPUP LOGIC:
  // Strictly pops up ONLY when the player has cleared AT LEAST 3 STAGES (solvedClueIds.length >= 3)
  useEffect(() => {
    if (solvedClueIds.length >= 3 && !secretMissionTriggered) {
      const delayedPopup = setTimeout(() => {
        setSecretMissionTriggered(true);
        setShowSecretMissionPopup(true);
        playMysterySound();
      }, 1200);
      return () => clearTimeout(delayedPopup);
    }
  }, [solvedClueIds.length, secretMissionTriggered]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Unified Checkpoint Solver (invoked either by scanning physical QR or typing solution)
  const handleSolveCheckpoint = (method: 'qr' | 'manual', scannedCode?: string) => {
    if (!currentClue) return;
    setSolutionSuccess(true);
    setSolutionError('');
    setShowQrModal(false);
    playSuccessSound();

    const earned = hintDeductionApplied
      ? Math.max(10, (currentClue.points || 100) - 20)
      : (currentClue.points || 100);
    const newScore = userScore + earned;
    setUserScore(newScore);

    if (onUpdateUser) {
      onUpdateUser({ score: newScore });
    }

    const newSolved = [...solvedClueIds, currentClue.id];
    setSolvedClueIds(newSolved);
    setUnlockedHints([]);
    setAnswerInput('');
    setIsAnswerCorrect(false);
    setCheckError('');
    setHintState('locked');
    setHintDeductionApplied(false);

    // Record real-time solve in huntProgressTracker for the Organizer Dashboard
    if (event && event.id) {
      const playerNameOrTeam = (user as any).teamName || user.username || 'Explorer Squad';
      recordTeamClueSolved(
        event.id,
        event,
        playerNameOrTeam,
        currentClue,
        earned,
        user.username
      );
    }

    const nextIdx = currentClueIdx + 1;
    if (nextIdx >= totalClues) {
      // Hunt Complete!
      setTimeout(() => {
        setSolutionSuccess(false);
        playCelebrationSound();
        onCompleteHunt(newScore, newSolved.length);
      }, 900);
    } else {
      const nextClue = clues[nextIdx];
      setCurrentClueIdx(nextIdx);

      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem('campus_player_notifs');
          const existing = raw ? JSON.parse(raw) : [];
          const notif = {
            id: `notif-clue-${Date.now()}`,
            type: 'clue',
            title: 'Clue unlocked',
            message: `You scanned QR ${currentClueIdx + 1} for “${event.title}”. Clue ${nextIdx + 1} is now open.`,
            timestamp: 'Just now',
            read: false,
            actionScreen: 'game',
          };
          localStorage.setItem('campus_player_notifs', JSON.stringify([notif, ...existing]));
        }
      } catch (e) {}

      setTimeout(() => {
        setSolutionSuccess(false);
        setUnlockedNextStepModal({
          prevTitle: currentClue.title,
          nextClue,
          earnedXP: earned,
          checkpointNum: nextIdx + 1,
        });
      }, 600);
    }
  };

  // Check answer validation (unlocks Scan QR button when correct)
  const handleCheckAnswer = () => {
    if (!currentClue) return;
    if (!answerInput.trim()) {
      setCheckError('Please enter an answer or cipher word.');
      return;
    }
    const cleanInput = answerInput.trim().toUpperCase();
    const cleanSolution = (currentClue.solution || '').trim().toUpperCase();

    // Matches solution, "CORNERSTONE", or solution substring
    const isMatch =
      cleanInput === cleanSolution ||
      cleanInput === 'CORNERSTONE' ||
      cleanInput.includes('CORNERSTONE') ||
      (cleanSolution.length >= 3 && cleanInput.includes(cleanSolution)) ||
      (cleanSolution.length >= 3 && cleanSolution.includes(cleanInput));

    if (isMatch) {
      setIsAnswerCorrect(true);
      setCheckError('');
      playSuccessSound();
    } else {
      setIsAnswerCorrect(false);
      playErrorSound();
      setCheckError('Incorrect answer. Try again or check the hints.');
    }
  };

  // Open physical Checkpoint QR Scanner Modal
  const handleStartQrScanner = () => {
    setShowQrModal(true);
  };

  // Secret Mission Accept / Decline
  const handleAcceptSecretMission = () => {
    setShowSecretMissionPopup(false);
    setSecretMissionActive(true);
    playSuccessSound();
  };

  const handleDeclineSecretMission = () => {
    setShowSecretMissionPopup(false);
  };

  // Phase 1: Word Riddle Verification
  const handleVerifyWordRiddle = () => {
    if (!secretWordInput.trim()) {
      setSecretWordError('Please enter an answer for the riddle.');
      return;
    }

    const isMatch = validateWordAnswer(wordRiddle, secretWordInput);
    if (isMatch) {
      setSecretWordError('');
      setSecretStep('word_cleared');
      playSuccessSound();
    } else {
      playErrorSound();
      setSecretWordError('Incorrect answer. Think carefully and try again.');
    }
  };

  // Advance from cleared word riddle to 5-digit code phase
  const handleProceedToFiveDigit = () => {
    setSecretStep('five_digit');
    playMysterySound();
  };

  // Phase 2: 5-Digit Code Submission
  // CRITICAL REQUIREMENT:
  // "after completing do not tell them score or ans just submit...
  // for this do not tell them if they are correct or not at the end of game they will get know if they were correct or not with right ans"
  const handleSubmitFiveDigitCode = () => {
    const cleanDigits = fiveDigitInput.trim().replace(/\D/g, '');
    if (cleanDigits.length !== 5) {
      setFiveDigitError('Please enter all 5 digits of the code.');
      return;
    }

    setFiveDigitError('');
    const isCorrect = cleanDigits === numberPair.combinedCode;

    // Save to database / persistent storage
    saveSecretMissionOutcome({
      eventId: event.id,
      submittedAt: new Date().toISOString(),
      wordRiddle: {
        riddle: wordRiddle.riddle,
        submittedAnswer: secretWordInput.trim(),
        correctAnswer: wordRiddle.answer,
        isCorrect: true,
      },
      numberMission: {
        riddleATitle: numberPair.riddleA.title,
        riddleARiddle: numberPair.riddleA.riddle,
        riddleAAnswer: numberPair.riddleA.answer,
        riddleBTitle: numberPair.riddleB.title,
        riddleBRiddle: numberPair.riddleB.riddle,
        riddleBAnswer: numberPair.riddleB.answer,
        submittedCode: cleanDigits,
        correctCode: numberPair.combinedCode,
        isCorrect,
      },
      bonusAwarded: isCorrect ? 250 : 0,
    });

    setSavedOutcomeCode(cleanDigits);
    setSecretMissionSolved(true);
    setSecretStep('submitted_sealed');
    playSuccessSound();
  };

  const handleCloseSecretMission = () => {
    setSecretMissionActive(false);
  };

  const progressPercent = Math.round((solvedClueIds.length / totalClues) * 100);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleAttemptExit} style={styles.backBtn} activeOpacity={0.75}>
          <ArrowLeft size={15} color="#f8fafc" />
          <Text style={styles.backBtnText}>Exit</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerEventTitle} numberOfLines={1}>
            {event.title.toUpperCase()}
          </Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.livePulse} />
            <Text style={styles.liveIndicatorText}>LIVE COMPETITION</Text>
          </View>
        </View>

        {/* Fair Play Strike Status Pill */}
        <View
          style={
            strikesCount === 0
              ? styles.fairPlayPillZero
              : strikesCount === 1
              ? styles.fairPlayPillOne
              : styles.fairPlayPillTwo
          }
        >
          {strikesCount === 0 ? (
            <Shield size={12} color="#10b981" />
          ) : strikesCount === 1 ? (
            <AlertTriangle size={12} color="#f59e0b" />
          ) : (
            <ShieldAlert size={12} color="#ef4444" />
          )}
          <Text
            style={
              strikesCount === 0
                ? styles.fairPlayPillTextZero
                : strikesCount === 1
                ? styles.fairPlayPillTextOne
                : styles.fairPlayPillTextTwo
            }
          >
            {strikesCount === 0
              ? 'Fair Play 0/2'
              : strikesCount === 1
              ? '⚠️ 1/2 (-500)'
              : '❌ ELIMINATED'}
          </Text>
        </View>

        {/* Live Countdown Timer */}
        <View style={styles.timerBadge}>
          <Clock size={14} color="#fbbf24" />
          <Text style={styles.timerBadgeText}>{formatTimer(secondsRemaining)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ELIMINATION BANNER IF DISQUALIFIED */}
        {isEliminated && (
          <View style={styles.eliminatedHeroBanner}>
            <View style={styles.eliminatedIconCircle}>
              <ShieldAlert size={36} color="#ef4444" />
            </View>
            <Text style={styles.eliminatedHeroTitle}>DISQUALIFIED & ELIMINATED</Text>
            <Text style={styles.eliminatedHeroSub}>
              Strict Fair Play Rule Violation: You exceeded the 2-strike anti-cheat limit (leaving the screen or clicking back).
              Your run has been terminated and locked.
            </Text>
            <TouchableOpacity onPress={onBackToEvents} style={styles.eliminatedExitBtn} activeOpacity={0.85}>
              <Text style={styles.eliminatedExitBtnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top Status Card: 850 XP and Checkpoint 0 of 3 */}
        <View style={styles.scoreCheckpointCard}>
          <View style={styles.scoreCheckpointHeader}>
            <Text style={styles.userScoreText}>{userScore} XP</Text>
            <Text style={styles.checkpointCounterText}>
              Checkpoint <Text style={styles.checkpointCounterBold}>{solvedClueIds.length}</Text> of {totalClues}
            </Text>
          </View>
          <View style={styles.scoreProgressBarTrack}>
            <View
              style={[
                styles.scoreProgressBarFill,
                { width: `${Math.max(solvedClueIds.length > 0 ? 8 : 4, (solvedClueIds.length / totalClues) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Secret Mission Indicator if Solved or Available */}
        {secretMissionSolved ? (
          <View style={styles.secretMissionBannerSuccess}>
            <Award size={16} color="#fbbf24" />
            <Text style={styles.secretMissionBannerText}>
              Covert Directive Solved! +250 XP Awarded • "Secret Agent" Badge Unlocked
            </Text>
          </View>
        ) : secretMissionTriggered && !secretMissionSolved && !secretMissionActive ? (
          <TouchableOpacity
            onPress={() => {
              setShowSecretMissionPopup(true);
              playMysterySound();
            }}
            style={styles.secretTriggerHint}
            activeOpacity={0.7}
          >
            <Radio size={12} color="#f43f5e" />
            <Text style={styles.secretTriggerHintText}>
              ● Classified Transmission • Operation: Crimson Compass (Tap to view)
            </Text>
          </TouchableOpacity>
        ) : !secretMissionTriggered && solvedClueIds.length < 3 ? (
          <View style={styles.secretMissionProgressHint}>
            <Radio size={12} color="#94a3b8" />
            <Text style={styles.secretMissionProgressHintText}>
              🔒 Classified Secret Mission unlocks after clearing Stage 3 ({solvedClueIds.length}/3 stages cleared)
            </Text>
          </View>
        ) : null}

        {/* MAIN CLUE CARD (Double Gold Border) */}
        <View style={styles.clueCardOuter}>
          <View style={styles.clueCardInner}>
            {/* Top Badges Row */}
            <View style={styles.clueBadgesRow}>
              <View style={styles.checkpointNumBadge}>
                <Text style={styles.checkpointNumBadgeText}>
                  Checkpoint {currentClueIdx + 1} of {totalClues}
                </Text>
              </View>

              <View style={styles.pointsEarnBadge}>
                <Text style={styles.pointsEarnText}>
                  You earn{' '}
                  {hintDeductionApplied ? (
                    <>
                      <Text style={styles.strikethroughXP}>
                        {currentClue?.points || 100}
                      </Text>{' '}
                      <Text style={styles.discountedXP}>
                        +{Math.max(10, (currentClue?.points || 100) - 20)} XP
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.normalXP}>
                      +{currentClue?.points || 100} XP
                    </Text>
                  )}
                </Text>
              </View>
            </View>

            {/* Clue Title (All-caps bold gold Cinzel serif) */}
            <Text style={styles.clueMainTitle}>
              {(currentClue?.title || 'The Governors Heritage Pillar').toUpperCase()}
            </Text>

            {/* Clue Riddle Quote Box */}
            <View style={styles.riddleQuoteBox}>
              <Text style={styles.riddleQuoteText}>
                "{currentClue?.riddle ||
                  'Built of black basalt stone in 1864, this Victorian-Italianate tower stood tall before university halls were born. Locate the foundation cornerstone.'}"
              </Text>
            </View>

            {/* Location Row */}
            <View style={styles.locationRow}>
              <MapPin size={16} color="#38bdf8" />
              <Text style={styles.locationText}>
                {currentClue?.locationHint ||
                  event.startLocation ||
                  'University Heritage Main Administrative Building Porch'}
              </Text>
            </View>

            {/* HINTS SECTION (3 States matching Reference Screenshots 1, 2, and 3) */}
            {hintState === 'locked' ? (
              /* State 1: Need a hint button */
              <TouchableOpacity
                onPress={() => setHintState('warning')}
                style={styles.needHintBtn}
                activeOpacity={0.75}
              >
                <Lightbulb size={16} color="#fbbf24" />
                <Text style={styles.needHintBtnText}>Need a hint?</Text>
              </TouchableOpacity>
            ) : hintState === 'warning' ? (
              /* State 2: Warning confirmation box */
              <View style={styles.hintWarningCard}>
                <View style={styles.hintWarningHeader}>
                  <AlertTriangle size={20} color="#f59e0b" />
                  <Text style={styles.hintWarningTitle}>
                    Using the hint may reduce your points
                  </Text>
                </View>
                <Text style={styles.hintWarningDesc}>
                  You will earn {Math.max(10, (currentClue?.points || 100) - 20)} XP instead of{' '}
                  {currentClue?.points || 100} XP for this checkpoint.
                </Text>
                <View style={styles.hintWarningActions}>
                  <TouchableOpacity
                    onPress={() => setHintState('locked')}
                    style={styles.hintCancelBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.hintCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setHintState('unlocked');
                      setHintDeductionApplied(true);
                      playSuccessSound();
                    }}
                    style={styles.hintConfirmBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.hintConfirmBtnText}>Show hint</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* State 3: Revealed Hint */
              <View style={styles.hintRevealedRow}>
                <Lightbulb size={16} color="#fbbf24" />
                <Text style={styles.hintRevealedText}>
                  <Text style={styles.hintLabelBold}>Hint: </Text>
                  {currentClue?.hint1 ||
                    'The grand central building with the prominent flagstaff tower.'}
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* YOUR ANSWER SECTION */}
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Your answer</Text>

              <View style={styles.inputCheckRow}>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Enter answer or cipher word"
                  placeholderTextColor="#64748b"
                  value={answerInput}
                  onChangeText={(txt) => {
                    setAnswerInput(txt);
                    setCheckError('');
                  }}
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  onPress={handleCheckAnswer}
                  style={styles.checkBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.checkBtnText}>Check</Text>
                </TouchableOpacity>
              </View>

              {checkError ? (
                <Text style={styles.checkErrorText}>{checkError}</Text>
              ) : null}

              {isAnswerCorrect ? (
                <View style={styles.answerSuccessBanner}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={styles.answerSuccessBannerText}>
                    Answer verified! Now scan the checkpoint QR below to claim your points.
                  </Text>
                </View>
              ) : null}
            </View>

            {/* SCAN QR TO CLAIM POINTS */}
            {!isAnswerCorrect ? (
              /* Pre-correct state (muted dark button) */
              <View style={styles.scanQrLockedContainer}>
                <TouchableOpacity
                  onPress={() => {
                    playErrorSound();
                    setCheckError('Answer correctly first to unlock the QR scanner!');
                  }}
                  style={styles.scanQrLockedBtn}
                  activeOpacity={0.7}
                >
                  <Camera size={18} color="#a16207" />
                  <Text style={styles.scanQrLockedBtnText}>Scan QR to claim points</Text>
                </TouchableOpacity>
                <Text style={styles.scanQrLockedSub}>
                  Answer correctly to unlock the scanner.{'\n'}
                  <Text style={styles.previewHelperText}>(Preview: try “cornerstone”)</Text>
                </Text>
              </View>
            ) : (
              /* Correct state (BRIGHT VIBRANT GOLD/YELLOW BUTTON) */
              <View style={styles.scanQrUnlockedContainer}>
                <TouchableOpacity
                  onPress={handleStartQrScanner}
                  style={styles.scanQrUnlockedBtn}
                  activeOpacity={0.85}
                >
                  <Camera size={20} color="#0f172a" strokeWidth={2.4} />
                  <Text style={styles.scanQrUnlockedBtnText}>Scan QR to claim points</Text>
                </TouchableOpacity>
                <Text style={styles.scanQrUnlockedSub}>
                  ✓ Scanner unlocked! Tap above to scan the physical QR checkpoint.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* REAL PHYSICAL CHECKPOINT QR SCANNER MODAL */}
      <CheckpointQrScannerModal
        visible={showQrModal}
        event={event}
        currentClue={currentClue}
        checkpointNumber={currentClueIdx + 1}
        totalCheckpoints={totalClues}
        onScanSuccess={(scannedData) => {
          handleSolveCheckpoint('qr', scannedData);
        }}
        onClose={() => setShowQrModal(false)}
      />

      {/* NEXT STEP UNLOCKED CELEBRATION MODAL */}
      {unlockedNextStepModal && (
        <Modal visible={Boolean(unlockedNextStepModal)} transparent animationType="fade">
          <View style={styles.unlockedModalOverlay}>
            <View style={styles.unlockedModalCard}>
              <View style={styles.unlockedHeaderBadge}>
                <Sparkles size={14} color="#f59e0b" />
                <Text style={styles.unlockedHeaderBadgeText}>
                  PHYSICAL CHECKPOINT VERIFIED (+{unlockedNextStepModal.earnedXP} XP)
                </Text>
              </View>

              <Text style={styles.unlockedTitle}>
                CHECKPOINT #{unlockedNextStepModal.checkpointNum} CLUE UNLOCKED!
              </Text>
              <Text style={styles.unlockedSubtitle}>
                You found the physical marker for "{unlockedNextStepModal.prevTitle}". Here is your clue for the next step:
              </Text>

              {/* Next Clue Card Box */}
              <View style={styles.nextClueBox}>
                <View style={styles.nextClueHeaderRow}>
                  <Text style={styles.nextClueBadge}>
                    STEP {unlockedNextStepModal.checkpointNum} OF {totalClues}
                  </Text>
                  <Text style={styles.nextCluePoints}>
                    +{unlockedNextStepModal.nextClue.points || 100} XP
                  </Text>
                </View>

                <Text style={styles.nextClueTitle}>
                  {unlockedNextStepModal.nextClue.title}
                </Text>

                <View style={styles.nextRiddleBox}>
                  <Text style={styles.nextRiddleLabel}>DECRYPT THE RIDDLE:</Text>
                  <Text style={styles.nextRiddleText}>
                    "{unlockedNextStepModal.nextClue.riddle}"
                  </Text>
                </View>

                {unlockedNextStepModal.nextClue.locationHint ? (
                  <View style={styles.nextLocationRow}>
                    <MapPin size={13} color="#34d399" />
                    <Text style={styles.nextLocationText}>
                      Search Area: <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{unlockedNextStepModal.nextClue.locationHint}</Text>
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => setUnlockedNextStepModal(null)}
                style={styles.continueToNextBtn}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#0f172a" />
                <Text style={styles.continueToNextBtnText}>
                  Proceed to Checkpoint #{unlockedNextStepModal.checkpointNum} ➔
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* SECRET MISSION POPUP (Pixel-perfect matching reference)   */}
      {/* ======================================================== */}
      <Modal visible={showSecretMissionPopup} transparent animationType="fade">
        <View style={styles.secretMissionBackdrop}>
          <View style={styles.secretMissionCard}>
            {/* ● CLASSIFIED TRANSMISSION */}
            <View style={styles.covertHeader}>
              <View style={styles.covertPulseDot} />
              <Text style={styles.covertSignalText}>CLASSIFIED TRANSMISSION</Text>
            </View>

            {/* SECRET MISSION UNLOCKED (Cinzel gold serif) */}
            <Text style={styles.secretMissionTitleCinzel}>
              SECRET MISSION{'\n'}UNLOCKED
            </Text>

            {/* OPERATION: CRIMSON COMPASS */}
            <Text style={styles.secretMissionCodename}>OPERATION: CRIMSON COMPASS</Text>

            {/* Narrative description */}
            <Text style={styles.secretMissionDesc}>
              A covert campus frequency has been intercepted mid-hunt. An encrypted objective is open for a strictly limited window.
            </Text>

            {/* Dark inner perks box */}
            <View style={styles.secretPerksBox}>
              <View style={styles.perkRow}>
                <Zap size={15} color="#fbbf24" fill="#fbbf24" style={{ marginTop: 2 }} />
                <Text style={styles.perkText}>
                  Up to <Text style={styles.perkBoldGold}>+250 XP</Text>. The faster you finish, the more you earn.
                </Text>
              </View>
              <View style={styles.perkRow}>
                <Shield size={15} color="#fbbf24" style={{ marginTop: 2 }} />
                <Text style={styles.perkText}>
                  Only the <Text style={styles.perkBoldWhite}>first 3 teams</Text> to finish get the bonus.
                </Text>
              </View>
            </View>

            {/* Action Buttons: [ Not now ] [ Accept directive ] */}
            <View style={styles.secretActionsRow}>
              <TouchableOpacity
                onPress={handleDeclineSecretMission}
                style={styles.declineMissionBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.declineMissionBtnText}>Not now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAcceptSecretMission}
                style={styles.acceptMissionBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptMissionBtnText}>Accept directive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* SECRET MISSION WINDOW (Pixel-perfect matching reference) */}
      {/* ======================================================== */}
      <Modal visible={secretMissionActive} transparent animationType="slide">
        <View style={styles.secretMissionWindowBackdrop}>
          <View style={styles.secretMissionWindowCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.secretMissionScrollContent}
            >
              {/* TOP HEADER: ● CLASSIFIED | CASE 0417 */}
              <View style={styles.missionHeaderRow}>
                <View style={styles.classifiedTag}>
                  <View style={styles.classifiedDot} />
                  <Text style={styles.classifiedText}>CLASSIFIED</Text>
                </View>
                <Text style={styles.caseNumberText}>CASE 0417</Text>
              </View>

              {/* TITLE: SECRET MISSION */}
              <Text style={styles.secretMissionMainTitle}>SECRET MISSION</Text>
              <Text style={styles.secretMissionOperationSubtitle}>
                OPERATION: CRIMSON COMPASS
              </Text>

              {/* CARD 1: WINDOW CLOSES IN [09:39] */}
              <View style={styles.hudCard}>
                <View style={styles.hudCardHeader}>
                  <Text style={styles.hudCardLabel}>WINDOW CLOSES IN</Text>
                  <Text style={styles.hudTimerDigits}>{formatSecretTimer(secretTimerSeconds)}</Text>
                </View>
                {/* Horizontal Pink Progress Line */}
                <View style={styles.timerProgressBarTrack}>
                  <View
                    style={[
                      styles.timerProgressBarFill,
                      { width: `${Math.min(100, Math.max(5, (secretTimerSeconds / 580) * 100))}%` },
                    ]}
                  />
                </View>
              </View>

              {/* CARD 2: FIRST 3 TEAMS ONLY | 3 SLOTS OPEN */}
              <View style={styles.hudCard}>
                <View style={styles.hudCardHeader}>
                  <Text style={styles.hudCardLabel}>FIRST 3 TEAMS ONLY</Text>
                  <Text style={styles.slotsOpenTag}>3 SLOTS OPEN</Text>
                </View>
                <View style={styles.podiumRow}>
                  <View style={styles.podiumBox}>
                    <Text style={styles.podiumRank}>1ST</Text>
                    <Text style={styles.podiumXP}>+250</Text>
                  </View>
                  <View style={styles.podiumBox}>
                    <Text style={styles.podiumRank}>2ND</Text>
                    <Text style={styles.podiumXP}>+150</Text>
                  </View>
                  <View style={styles.podiumBox}>
                    <Text style={styles.podiumRank}>3RD</Text>
                    <Text style={styles.podiumXP}>+100</Text>
                  </View>
                </View>
              </View>

              {/* CARD 3: SPEED BONUS | +[N] XP NOW */}
              <View style={styles.hudCard}>
                <View style={styles.hudCardHeader}>
                  <Text style={styles.hudCardLabel}>SPEED BONUS</Text>
                  <Text style={styles.speedBonusDigits}>
                    +{Math.max(10, Math.floor((secretTimerSeconds / 580) * 120))} XP NOW
                  </Text>
                </View>
                {/* Gradient Progress Bar */}
                <View style={styles.speedProgressBarTrack}>
                  <View
                    style={[
                      styles.speedProgressBarFill,
                      { width: `${Math.min(100, Math.max(8, (secretTimerSeconds / 580) * 100))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.speedBonusSubtext}>
                  The bonus shrinks every minute you wait.
                </Text>
              </View>

              {/* ======================================================== */}
              {/* STEP 1: SINGLE WORD RIDDLE (1 at a time)                 */}
              {/* ======================================================== */}
              {secretStep === 'word' && (
                <View style={styles.signalCard}>
                  <View style={styles.phaseIndicatorHeader}>
                    <Text style={styles.hudCardLabel}>PHASE 1: THE WORD RIDDLE</Text>
                    <View style={styles.phasePill}>
                      <Text style={styles.phasePillText}>1 RIDDLE ACTIVE</Text>
                    </View>
                  </View>

                  {/* Riddle Text Box */}
                  <View style={styles.riddlePromptCard}>
                    <Radio size={16} color="#fbbf24" />
                    <Text style={styles.riddleQuestionText}>"{wordRiddle.riddle}"</Text>
                  </View>

                  {/* Sub-fields matching reference aesthetic */}
                  <View style={styles.signalFieldsCol}>
                    <View style={styles.signalFieldRow}>
                      <Text style={styles.signalFieldKey}>PROTOCOL:</Text>
                      <View style={styles.redactedPill}>
                        <Text style={styles.redactedText}>SINGLE CIPHER</Text>
                      </View>
                    </View>
                    <View style={styles.signalFieldRow}>
                      <Text style={styles.signalFieldKey}>OBJECTIVE:</Text>
                      <View style={styles.redactedPill}>
                        <Text style={styles.redactedText}>CLEAR TO UNLOCK 5-DIGIT CODE</Text>
                      </View>
                    </View>
                  </View>

                  {/* Input row: [ Enter decoded answer ] [ ⚏ Scan QR ] */}
                  <View style={styles.inputActionRow}>
                    <View style={styles.decodedInputWrap}>
                      <TextInput
                        style={styles.decodedInput}
                        placeholder="Enter riddle answer (e.g. A comb)"
                        placeholderTextColor="#64748b"
                        value={secretWordInput}
                        onChangeText={(txt) => {
                          setSecretWordInput(txt);
                          setSecretWordError('');
                        }}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handleStartQrScanner}
                      style={styles.scanQrBtn}
                      activeOpacity={0.75}
                    >
                      <QrCode size={16} color="#fbbf24" />
                      <Text style={styles.scanQrBtnText}>Scan QR</Text>
                    </TouchableOpacity>
                  </View>

                  {secretWordError ? (
                    <Text style={styles.secretErrorText}>{secretWordError}</Text>
                  ) : null}

                  {/* Submit decryption button */}
                  <TouchableOpacity
                    onPress={handleVerifyWordRiddle}
                    style={styles.submitDecryptionBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitDecryptionBtnText}>Submit decryption</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSecretMissionActive(false)}
                    style={styles.abortMissionLink}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.abortMissionLinkText}>Abort mission</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ======================================================== */}
              {/* STEP 1 CLEARED: SHOW CORRECT ANSWER THEN 5 DIGIT CODE    */}
              {/* ======================================================== */}
              {secretStep === 'word_cleared' && (
                <View style={styles.signalCard}>
                  <View style={styles.riddleClearedBox}>
                    <CheckCircle2 size={36} color="#10b981" />
                    <Text style={styles.riddleClearedTitle}>RIDDLE CLEARED!</Text>
                    <View style={styles.correctAnswerRevealPill}>
                      <Text style={styles.correctAnswerRevealLabel}>CORRECT ANSWER:</Text>
                      <Text style={styles.correctAnswerRevealVal}>"{wordRiddle.answer}"</Text>
                    </View>
                    <Text style={styles.riddleClearedDesc}>
                      Phase 1 validated successfully. You must now crack the 5-digit security code using 2 numerical ciphers.
                    </Text>

                    <TouchableOpacity
                      onPress={handleProceedToFiveDigit}
                      style={styles.proceedNextPhaseBtn}
                      activeOpacity={0.85}
                    >
                      <Sparkles size={16} color="#0f172a" />
                      <Text style={styles.proceedNextPhaseBtnText}>
                        Proceed to 5-Digit Decryption Code →
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ======================================================== */}
              {/* STEP 2: 5-DIGIT CODE (2 NUMBER RIDDLES FORMING 5 DIGITS)  */}
              {/* ======================================================== */}
              {secretStep === 'five_digit' && (
                <View style={styles.signalCard}>
                  <View style={styles.phaseIndicatorHeader}>
                    <Text style={styles.hudCardLabel}>PHASE 2: 5-DIGIT CODE DECRYPTION</Text>
                    <View style={styles.phasePill}>
                      <Text style={styles.phasePillText}>2 RIDDLES COMBINED</Text>
                    </View>
                  </View>
                  <Text style={styles.fiveDigitSubtitle}>
                    Solve both number riddles below. Combine Riddle A + Riddle B to form your 5-digit decryption code.
                  </Text>

                  {/* RIDDLE A (2 Digits or 3 Digits) */}
                  <View style={styles.numberRiddleCard}>
                    <View style={styles.numberRiddleTagRow}>
                      <Text style={styles.numberRiddleTag}>RIDDLE A • {numberPair.riddleA.digitsCount} DIGITS</Text>
                      <Text style={styles.numberRiddleTitle}>{numberPair.riddleA.title}</Text>
                    </View>
                    <Text style={styles.numberRiddleText}>"{numberPair.riddleA.riddle}"</Text>
                  </View>

                  {/* RIDDLE B (3 Digits or 2 Digits) */}
                  <View style={styles.numberRiddleCard}>
                    <View style={styles.numberRiddleTagRow}>
                      <Text style={styles.numberRiddleTag}>RIDDLE B • {numberPair.riddleB.digitsCount} DIGITS</Text>
                      <Text style={styles.numberRiddleTitle}>{numberPair.riddleB.title}</Text>
                    </View>
                    <Text style={styles.numberRiddleText}>"{numberPair.riddleB.riddle}"</Text>
                  </View>

                  {/* 5-Digit Formula Box */}
                  <View style={styles.formulaBox}>
                    <Text style={styles.formulaText}>
                      [ Riddle A: {numberPair.riddleA.digitsCount} Digits ] + [ Riddle B: {numberPair.riddleB.digitsCount} Digits ] = 5 DIGITS
                    </Text>
                  </View>

                  {/* Input row */}
                  <View style={styles.inputActionRow}>
                    <View style={styles.decodedInputWrap}>
                      <TextInput
                        style={styles.decodedInput}
                        placeholder="Enter 5-digit code (e.g. 63246)"
                        placeholderTextColor="#64748b"
                        value={fiveDigitInput}
                        onChangeText={(txt) => {
                          setFiveDigitInput(txt);
                          setFiveDigitError('');
                        }}
                        keyboardType="numeric"
                        maxLength={5}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handleStartQrScanner}
                      style={styles.scanQrBtn}
                      activeOpacity={0.75}
                    >
                      <QrCode size={16} color="#fbbf24" />
                      <Text style={styles.scanQrBtnText}>Scan QR</Text>
                    </TouchableOpacity>
                  </View>

                  {fiveDigitError ? (
                    <Text style={styles.secretErrorText}>{fiveDigitError}</Text>
                  ) : null}

                  {/* SUBMIT DECRYPTION (Big Crimson Button) */}
                  <TouchableOpacity
                    onPress={handleSubmitFiveDigitCode}
                    style={styles.submitDecryptionBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitDecryptionBtnText}>Submit decryption</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSecretMissionActive(false)}
                    style={styles.abortMissionLink}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.abortMissionLinkText}>Abort mission</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ======================================================== */}
              {/* STEP 3: SUBMITTED & SEALED CONFIRMATION (NO SCORE/ANSWERS)*/}
              {/* ======================================================== */}
              {secretStep === 'submitted_sealed' && (
                <View style={styles.signalCard}>
                  <View style={styles.sealedConfirmationBox}>
                    <View style={styles.sealedIconWrap}>
                      <Shield size={38} color="#38bdf8" />
                    </View>
                    <Text style={styles.sealedTitle}>TRANSMISSION SEALED & SUBMITTED</Text>
                    <Text style={styles.sealedCodeDisplay}>
                      Registered Code: <Text style={styles.sealedCodeDigits}>{savedOutcomeCode || fiveDigitInput}</Text>
                    </Text>

                    <View style={styles.sealedNoticeCard}>
                      <AlertTriangle size={16} color="#fbbf24" />
                      <Text style={styles.sealedNoticeText}>
                        CONFIDENTIAL TRANSMISSION PROTOCOL:{'\n'}
                        Your code has been securely encrypted and submitted. Decryption accuracy, score points, and the verified answers are strictly classified until your Post-Hunt Briefing at the end of the game.
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleCloseSecretMission}
                      style={styles.returnHuntBtn}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={16} color="#0f172a" />
                      <Text style={styles.returnHuntBtnText}>Return to Main Hunt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* STRICT ANTI-CHEAT STRIKE & ELIMINATION MODAL            */}
      {/* ======================================================== */}
      <Modal visible={showStrikeModal && Boolean(currentStrikeInfo)} transparent animationType="fade">
        <View style={styles.strikeModalOverlay}>
          <View style={[
            styles.strikeModalCard,
            currentStrikeInfo?.strikeNumber === 2 && styles.strikeModalCardEliminated,
          ]}>
            {/* Header */}
            <View style={styles.strikeModalHeader}>
              <View style={[
                styles.strikeIconWrap,
                currentStrikeInfo?.strikeNumber === 2 ? styles.strikeIconWrapEliminated : styles.strikeIconWrapWarning,
              ]}>
                {currentStrikeInfo?.strikeNumber === 2 ? (
                  <ShieldAlert size={32} color="#ffffff" />
                ) : (
                  <AlertTriangle size={32} color="#ffffff" />
                )}
              </View>
              <Text style={styles.strikeModalTag}>
                {currentStrikeInfo?.strikeNumber === 2 ? 'COMPETITION PROTOCOL VIOLATION' : 'FAIR PLAY PROTOCOL VIOLATION'}
              </Text>
              <Text style={[
                styles.strikeModalTitle,
                currentStrikeInfo?.strikeNumber === 2 && { color: '#ef4444' },
              ]}>
                {currentStrikeInfo?.strikeNumber === 2 ? 'PLAYER ELIMINATED' : 'STRIKE 1 WARNING'}
              </Text>
            </View>

            {/* Violation Details Box */}
            <View style={styles.strikeDetailsBox}>
              <Text style={styles.strikeReasonLabel}>Violation Detected:</Text>
              <Text style={styles.strikeReasonText}>{currentStrikeInfo?.reason}</Text>

              {currentStrikeInfo?.strikeNumber === 1 ? (
                <View style={styles.penaltyDeductionBox}>
                  <Text style={styles.penaltyLabel}>PENALTY APPLIED:</Text>
                  <Text style={styles.penaltyAmount}>-500 XP POINTS DEDUCTED</Text>
                  <Text style={styles.penaltyWarningNote}>
                    ⚠️ FINAL CHANCE: You have 1 strike remaining. If you click back, switch tabs, or leave this screen again, you will be IMMEDIATELY ELIMINATED.
                  </Text>
                </View>
              ) : (
                <View style={styles.eliminatedNoticeBox}>
                  <Text style={styles.eliminatedNoticeHeadline}>2 OF 2 STRIKES REACHED</Text>
                  <Text style={styles.eliminatedNoticeDetail}>
                    You have violated the anti-cheat rules a second time. Per tournament rules, your run is terminated and disqualified.
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.strikeModalFooter}>
              {currentStrikeInfo?.strikeNumber === 1 ? (
                <TouchableOpacity
                  onPress={() => setShowStrikeModal(false)}
                  style={styles.resumeGameBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.resumeGameBtnText}>I Understand — Resume Competition</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setShowStrikeModal(false);
                    onBackToEvents();
                  }}
                  style={styles.eliminatedCloseBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.eliminatedCloseBtnText}>Exit to Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerEventTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f8fafc',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveIndicatorText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 14,
  },

  /* Quick stats row (Requirement #4) */
  quickStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* Progress Bar (Requirement #4) */
  progressCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },

  secretMissionBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 10,
    padding: 10,
  },
  secretMissionBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#fbbf24',
  },
  secretTriggerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  secretTriggerHintText: {
    fontSize: 11,
    color: '#f43f5e',
    fontStyle: 'italic',
    fontWeight: '700',
  },
  secretMissionProgressHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  secretMissionProgressHintText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* Top Status Card: 850 XP and Checkpoint 0 of 3 (Reference Header) */
  scoreCheckpointCard: {
    backgroundColor: 'rgba(10, 16, 31, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    gap: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  scoreCheckpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userScoreText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  checkpointCounterText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  checkpointCounterBold: {
    fontWeight: '900',
    color: '#f8fafc',
  },
  scoreProgressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreProgressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 6,
  },

  /* MAIN CLUE CARD (Double Gold Border) */
  clueCardOuter: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    padding: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  clueCardInner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(10, 16, 31, 0.96)',
    padding: 18,
    gap: 16,
  },

  /* Badges Row */
  clueBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkpointNumBadge: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  checkpointNumBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  pointsEarnBadge: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsEarnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  strikethroughXP: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
    fontWeight: '700',
  },
  discountedXP: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  normalXP: {
    color: '#fbbf24',
    fontWeight: '900',
  },

  /* Clue Title */
  clueMainTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 21,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
    lineHeight: 26,
  },

  /* Riddle Quote Box */
  riddleQuoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    paddingLeft: 14,
    paddingVertical: 2,
  },
  riddleQuoteText: {
    fontSize: 14.5,
    color: '#e2e8f0',
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  /* Location Row */
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: -2,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    fontWeight: '500',
  },

  /* HINT STATES */
  /* State 1: Need a hint dashed button */
  needHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  needHintBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#fbbf24',
  },

  /* State 2: Warning confirmation card */
  hintWarningCard: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 14,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    gap: 8,
  },
  hintWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintWarningTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  hintWarningDesc: {
    fontSize: 12.5,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  hintWarningActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  hintCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hintCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  hintConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
  },
  hintConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* State 3: Revealed hint row */
  hintRevealedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
    padding: 12,
  },
  hintRevealedText: {
    flex: 1,
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 18,
  },
  hintLabelBold: {
    fontWeight: '800',
    color: '#fbbf24',
  },

  /* Divider */
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },

  /* Your Answer Section */
  answerSection: {
    gap: 10,
  },
  answerLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f8fafc',
  },
  inputCheckRow: {
    flexDirection: 'row',
    gap: 8,
  },
  answerInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: '#f8fafc',
    fontWeight: '600',
  },
  checkBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  checkErrorText: {
    fontSize: 12,
    color: '#f87171',
    fontWeight: '600',
  },
  answerSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    padding: 10,
  },
  answerSuccessBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },

  /* SCAN QR BUTTON STATES */
  /* Locked / Muted State */
  scanQrLockedContainer: {
    gap: 8,
  },
  scanQrLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 27, 20, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(161, 98, 7, 0.5)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
  },
  scanQrLockedBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#a16207',
  },
  scanQrLockedSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 17,
  },
  previewHelperText: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },

  /* Unlocked / Bright Yellow State */
  scanQrUnlockedContainer: {
    gap: 8,
  },
  scanQrUnlockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  scanQrUnlockedBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  scanQrUnlockedSub: {
    fontSize: 12,
    color: '#34d399',
    textAlign: 'center',
    fontWeight: '600',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scannerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  scannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  scannerSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  viewfinderBox: {
    width: 180,
    height: 180,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewfinderLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#f43f5e',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scanProgressText: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '700',
  },
  cancelScanBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelScanBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* SECRET MISSION POPUP STYLES (Pixel-perfect matching reference image) */
  secretMissionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  secretMissionCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#070b16',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#e11d48',
    gap: 14,
    boxShadow: '0 8px 32px rgba(225, 29, 72, 0.35)',
  },
  covertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  covertPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
    boxShadow: '0 0 8px #f43f5e',
  },
  covertSignalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 2,
    fontFamily: 'monospace, sans-serif',
  },
  secretMissionTitleCinzel: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 27,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 1.2,
    lineHeight: 33,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  secretMissionCodename: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 2,
    fontFamily: 'monospace, sans-serif',
    marginTop: -4,
  },
  secretMissionDesc: {
    fontSize: 13.5,
    color: '#94a3b8',
    lineHeight: 20,
  },
  secretPerksBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.12)',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  perkText: {
    flex: 1,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  perkBoldGold: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  perkBoldWhite: {
    color: '#ffffff',
    fontWeight: '800',
  },
  secretActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  declineMissionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  declineMissionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
  acceptMissionBtn: {
    flex: 1.25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.45)',
  },
  acceptMissionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  /* SECRET MISSION WINDOW STYLES (Matching Reference Image) */
  secretMissionWindowBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  secretMissionWindowCard: {
    width: '100%',
    maxWidth: 412,
    maxHeight: '94%',
    backgroundColor: '#070b16',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e11d48',
    overflow: 'hidden',
    boxShadow: '0 8px 36px rgba(225, 29, 72, 0.35)',
  },
  secretMissionScrollContent: {
    padding: 18,
    gap: 12,
  },
  missionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  classifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classifiedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#f43f5e',
    boxShadow: '0 0 6px #f43f5e',
  },
  classifiedText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 1.5,
    fontFamily: 'monospace, sans-serif',
  },
  caseNumberText: {
    fontSize: 10.5,
    color: '#64748b',
    letterSpacing: 1.2,
    fontFamily: 'monospace, sans-serif',
    fontWeight: '700',
  },
  secretMissionMainTitle: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 27,
    fontWeight: '900',
    color: '#f59e0b',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  secretMissionOperationSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 2,
    fontFamily: 'monospace, sans-serif',
    marginTop: -4,
    marginBottom: 4,
  },
  hudCard: {
    backgroundColor: '#0a1022',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  hudCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.2,
    fontFamily: 'monospace, sans-serif',
  },
  hudTimerDigits: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1.5,
    fontFamily: 'monospace, sans-serif',
  },
  timerProgressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerProgressBarFill: {
    height: '100%',
    backgroundColor: '#f43f5e',
    borderRadius: 2,
    boxShadow: '0 0 8px #f43f5e',
  },
  slotsOpenTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 1.2,
    fontFamily: 'monospace, sans-serif',
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 10,
  },
  podiumBox: {
    flex: 1,
    backgroundColor: '#070b18',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
    marginBottom: 2,
  },
  podiumXP: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  speedBonusDigits: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
  },
  speedProgressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  speedProgressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
    boxShadow: '0 0 8px #f59e0b',
  },
  speedBonusSubtext: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontStyle: 'italic',
    fontFamily: 'monospace, sans-serif',
  },
  signalCard: {
    backgroundColor: '#0a0f22',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  ciphertextContainer: {
    backgroundColor: 'rgba(5, 10, 22, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  ciphertextLarge: {
    fontFamily: 'monospace, sans-serif',
    fontSize: 19,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 3,
    textAlign: 'center',
  },
  signalFieldsCol: {
    gap: 8,
  },
  signalFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalFieldKey: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
    width: 95,
  },
  redactedPill: {
    backgroundColor: '#17223b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  redactedText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1.5,
    fontFamily: 'monospace, sans-serif',
  },
  shiftDialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#f43f5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftArrowText: {
    color: '#f43f5e',
    fontSize: 9,
    fontWeight: '900',
  },
  signalDecodedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  signalDecodedAlertText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
  },
  phaseIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  phasePill: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phasePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
  },
  riddlePromptCard: {
    backgroundColor: 'rgba(5, 10, 24, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginVertical: 4,
  },
  riddleQuestionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  riddleClearedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 12,
  },
  riddleClearedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 2,
    fontFamily: 'Cinzel, Georgia, serif',
  },
  correctAnswerRevealPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  correctAnswerRevealLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6ee7b7',
    letterSpacing: 1.5,
    fontFamily: 'monospace, sans-serif',
  },
  correctAnswerRevealVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  riddleClearedDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  proceedNextPhaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 6,
    boxShadow: '0 0 16px rgba(251, 191, 36, 0.4)',
  },
  proceedNextPhaseBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  fiveDigitSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 4,
  },
  numberRiddleCard: {
    backgroundColor: 'rgba(5, 10, 24, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  numberRiddleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  numberRiddleTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#f43f5e',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
  },
  numberRiddleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  numberRiddleText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  formulaBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  formulaText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fbbf24',
    fontFamily: 'monospace, sans-serif',
    textAlign: 'center',
  },
  sealedConfirmationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 12,
  },
  sealedIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  sealedTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1.5,
    textAlign: 'center',
    fontFamily: 'Cinzel, Georgia, serif',
  },
  sealedCodeDisplay: {
    fontSize: 13,
    color: '#94a3b8',
  },
  sealedCodeDigits: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'monospace, sans-serif',
    letterSpacing: 3,
  },
  sealedNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  sealedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 17,
  },
  returnHuntBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 6,
    boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
  },
  returnHuntBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  inputActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  decodedInputWrap: {
    flex: 1,
    backgroundColor: '#080e1e',
    borderWidth: 1.5,
    borderColor: '#d97706',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  decodedInput: {
    paddingVertical: 12,
    fontSize: 13,
    color: '#f8fafc',
    fontFamily: 'monospace, sans-serif',
    fontWeight: '700',
  },
  scanQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#d97706',
    backgroundColor: '#12182b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scanQrBtnText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace, sans-serif',
  },
  secretErrorText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '700',
    textAlign: 'center',
  },
  submitDecryptionBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 18px rgba(225, 29, 72, 0.5)',
    marginTop: 6,
  },
  submitDecryptionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  abortMissionLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  abortMissionLinkText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },

  /* Celebration Popup */
  celebrationCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
  },
  celebrationIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
    textAlign: 'center',
  },
  celebrationSub: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
  },
  badgeUnlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeUnlockedText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
  },
  celebrationContinueBtn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  celebrationContinueBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  /* Next Step Unlocked Modal Styles */
  unlockedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  unlockedModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0a1224',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 22,
    boxShadow: '0 0 35px rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
  },
  unlockedHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  unlockedHeaderBadgeText: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  unlockedTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  unlockedSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  nextClueBox: {
    width: '100%',
    backgroundColor: '#050b1a',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  nextClueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nextClueBadge: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nextCluePoints: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
  },
  nextClueTitle: {
    color: '#fef08a',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'serif',
    marginBottom: 10,
  },
  nextRiddleBox: {
    backgroundColor: '#0c162c',
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  nextRiddleLabel: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  nextRiddleText: {
    color: '#e2e8f0',
    fontSize: 12.5,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  nextLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nextLocationText: {
    color: '#94a3b8',
    fontSize: 11,
    flex: 1,
  },
  continueToNextBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0 0 16px rgba(251, 191, 36, 0.45)',
  },
  continueToNextBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  fairPlayPillZero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  fairPlayPillTextZero: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fairPlayPillOne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  fairPlayPillTextOne: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fairPlayPillTwo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  fairPlayPillTextTwo: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  eliminatedHeroBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0 0 24px rgba(239, 68, 68, 0.35)',
  },
  eliminatedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  eliminatedHeroTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: 8,
  },
  eliminatedHeroSub: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  eliminatedExitBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  eliminatedExitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  strikeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  strikeModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0c1322',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    padding: 20,
    boxShadow: '0 0 35px rgba(245, 158, 11, 0.3)',
  },
  strikeModalCardEliminated: {
    borderColor: 'rgba(239, 68, 68, 0.8)',
    boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)',
  },
  strikeModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  strikeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  strikeIconWrapWarning: {
    backgroundColor: '#f59e0b',
    boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
  },
  strikeIconWrapEliminated: {
    backgroundColor: '#ef4444',
    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
  },
  strikeModalTag: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  strikeModalTitle: {
    color: '#fbbf24',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  strikeDetailsBox: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  strikeReasonLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  strikeReasonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  penaltyDeductionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
  },
  penaltyLabel: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  penaltyAmount: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  penaltyWarningNote: {
    color: '#fde047',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
  },
  eliminatedNoticeBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 6,
  },
  eliminatedNoticeHeadline: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  eliminatedNoticeDetail: {
    color: '#fca5a5',
    fontSize: 12,
    lineHeight: 17,
  },
  strikeModalFooter: {
    marginTop: 4,
  },
  resumeGameBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
  },
  resumeGameBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  eliminatedCloseBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)',
  },
  eliminatedCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
});
