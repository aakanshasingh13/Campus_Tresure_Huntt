import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Trophy,
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Crown,
  Award,
  ShieldCheck,
  Send,
  Radio,
  XCircle,
  HelpCircle,
  Shield,
} from 'lucide-react-native';
import { TreasureEvent, UserProfile, LeaderboardEntry } from '../../types';
import { playCelebrationSound, playSuccessSound } from '../../utils/audioEffects';
import { getSecretMissionOutcome } from '../../data/secretMissionRiddles';

interface PostEventScreenProps {
  event: TreasureEvent;
  user: UserProfile;
  leaderboard: LeaderboardEntry[];
  finalScore?: number;
  onGoToHome: () => void;
  onGoToMyEvents: () => void;
}

export const PostEventScreen: React.FC<PostEventScreenProps> = ({
  event,
  user,
  leaderboard,
  finalScore,
  onGoToHome,
  onGoToMyEvents,
}) => {
  // Feedback Form State (Requirement #5)
  const [rating, setRating] = useState<number>(5);
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [issueDetails, setIssueDetails] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Top 3 Podium entries
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
  const topThree = sortedLeaderboard.slice(0, 3);

  const issueOptions = [
    'Clue riddle too vague',
    'QR code missing/damaged',
    'GPS boundary offset',
    'Venue gate locked',
    'App timer glitch',
  ];

  const handleSubmitFeedback = () => {
    setFeedbackSubmitted(true);
    playSuccessSound();
  };

  const playerName = user.username || 'Explorer';
  const secretOutcome = getSecretMissionOutcome(event.id);
  const secretBonus = secretOutcome?.numberMission?.isCorrect ? 250 : 0;
  const baseScore = finalScore || user.score || 850;
  const displayScore = baseScore + secretBonus;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top Banner */}
      <View style={styles.concludedBanner}>
        <View style={styles.trophyIconBox}>
          <Trophy size={28} color="#fbbf24" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.concludedSub}>HUNT CONCLUDED • POST-EVENT BRIEFING</Text>
          <Text style={styles.concludedTitle}>{event.title}</Text>
          <Text style={styles.concludedMeta}>
            {event.startLocation} • Organized by {event.organizerName || 'Campus Guild'}
          </Text>
        </View>
      </View>

      {/* Player Stats Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryPlayerName}>{playerName}</Text>
            <Text style={styles.summaryTeamName}>Team: Cyber Sleuths</Text>
          </View>
          <View style={styles.rankPill}>
            <Crown size={14} color="#0f172a" />
            <Text style={styles.rankPillText}>Rank #2 of {sortedLeaderboard.length}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{displayScore} XP</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              {event.clues ? event.clues.length : 8}/{event.clues ? event.clues.length : 8}
            </Text>
            <Text style={styles.statLabel}>Checkpoints</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>42m 15s</Text>
            <Text style={styles.statLabel}>Hunt Time</Text>
          </View>
        </View>
      </View>

      {/* CLASSIFIED SECRET MISSION DEBRIEFING */}
      {secretOutcome ? (
        <View style={styles.secretDebriefCard}>
          <View style={styles.secretDebriefHeader}>
            <View style={styles.secretDebriefBadgeRow}>
              <View style={styles.covertPulseDot} />
              <Text style={styles.covertSignalText}>CLASSIFIED OPERATION DEBRIEF</Text>
            </View>
            {secretOutcome.numberMission?.isCorrect ? (
              <View style={styles.missionSuccessBadge}>
                <CheckCircle2 size={13} color="#10b981" />
                <Text style={styles.missionSuccessBadgeText}>CODE CRACKED • +250 XP AWARDED</Text>
              </View>
            ) : (
              <View style={styles.missionFailedBadge}>
                <XCircle size={13} color="#f43f5e" />
                <Text style={styles.missionFailedBadgeText}>CODE MISMATCH • 0 XP AWARDED</Text>
              </View>
            )}
          </View>

          <Text style={styles.secretDebriefTitle}>OPERATION: CRIMSON COMPASS</Text>
          <Text style={styles.secretDebriefSubtitle}>
            Here are the decrypted results, your submitted answers, and verified correct solutions for the covert assignment:
          </Text>

          {/* Phase 1: Word Riddle Review */}
          <View style={styles.debriefRiddleBox}>
            <View style={styles.debriefPhaseTagRow}>
              <Text style={styles.debriefPhaseTag}>PHASE 1: THE WORD RIDDLE</Text>
              <Text style={styles.debriefStatusCleared}>✓ CLEARED</Text>
            </View>
            <Text style={styles.debriefRiddlePrompt}>"{secretOutcome.wordRiddle?.riddle}"</Text>
            <View style={styles.debriefAnswersRow}>
              <View style={styles.debriefAnswerItem}>
                <Text style={styles.debriefAnswerLabel}>Your Submitted Answer:</Text>
                <Text style={styles.debriefAnswerVal}>"{secretOutcome.wordRiddle?.submittedAnswer}"</Text>
              </View>
              <View style={[styles.debriefAnswerItem, styles.debriefAnswerItemCorrect]}>
                <Text style={styles.debriefAnswerLabelCorrect}>Verified Right Answer:</Text>
                <Text style={styles.debriefAnswerValCorrect}>"{secretOutcome.wordRiddle?.correctAnswer}"</Text>
              </View>
            </View>
          </View>

          {/* Phase 2: 5-Digit Code Review */}
          <View style={styles.debriefRiddleBox}>
            <View style={styles.debriefPhaseTagRow}>
              <Text style={styles.debriefPhaseTag}>PHASE 2: 5-DIGIT CODE DECRYPTION</Text>
              <Text
                style={
                  secretOutcome.numberMission?.isCorrect
                    ? styles.debriefStatusCleared
                    : styles.debriefStatusFailed
                }
              >
                {secretOutcome.numberMission?.isCorrect ? '✓ CORRECT CODE' : '✕ CODE MISMATCH'}
              </Text>
            </View>

            {/* Code comparison box */}
            <View style={styles.codeComparisonBox}>
              <View style={styles.codeCompCol}>
                <Text style={styles.codeCompLabel}>Your Submitted Code</Text>
                <Text
                  style={[
                    styles.codeCompDigits,
                    {
                      color: secretOutcome.numberMission?.isCorrect ? '#10b981' : '#f43f5e',
                    },
                  ]}
                >
                  {secretOutcome.numberMission?.submittedCode || '-----'}
                </Text>
              </View>
              <View style={styles.codeCompDivider} />
              <View style={styles.codeCompCol}>
                <Text style={styles.codeCompLabel}>Right 5-Digit Code</Text>
                <Text style={[styles.codeCompDigits, { color: '#fbbf24' }]}>
                  {secretOutcome.numberMission?.correctCode}
                </Text>
              </View>
            </View>

            {/* Riddles Breakdown */}
            <View style={styles.riddlesBreakdownCol}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownTitle}>
                  1. {secretOutcome.numberMission?.riddleATitle}
                </Text>
                <Text style={styles.breakdownRiddleText}>"{secretOutcome.numberMission?.riddleARiddle}"</Text>
                <Text style={styles.breakdownAnswerText}>
                  Right Answer:{' '}
                  <Text style={styles.breakdownAnswerHighlight}>
                    {secretOutcome.numberMission?.riddleAAnswer}
                  </Text>
                </Text>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownTitle}>
                  2. {secretOutcome.numberMission?.riddleBTitle}
                </Text>
                <Text style={styles.breakdownRiddleText}>"{secretOutcome.numberMission?.riddleBRiddle}"</Text>
                <Text style={styles.breakdownAnswerText}>
                  Right Answer:{' '}
                  <Text style={styles.breakdownAnswerHighlight}>
                    {secretOutcome.numberMission?.riddleBAnswer}
                  </Text>
                </Text>
              </View>

              <View style={styles.breakdownFormulaResult}>
                <Text style={styles.breakdownFormulaText}>
                  Combined: {secretOutcome.numberMission?.riddleAAnswer} + {secretOutcome.numberMission?.riddleBAnswer} = {secretOutcome.numberMission?.correctCode}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* 1. FINAL LEADERBOARD & PODIUM (Requirement #5) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Crown size={18} color="#fbbf24" />
          <Text style={styles.sectionTitle}>Final Event Leaderboard</Text>
        </View>

        {/* Podium Display for Top 3 */}
        <View style={styles.podiumContainer}>
          {/* 2nd Place */}
          {topThree[1] && (
            <View style={[styles.podiumColumn, styles.podiumSecond]}>
              <View style={[styles.podiumBadge, { backgroundColor: '#94a3b8' }]}>
                <Text style={styles.podiumRankNum}>2</Text>
              </View>
              <Text style={styles.podiumTeamName} numberOfLines={1}>
                {topThree[1].teamName}
              </Text>
              <Text style={styles.podiumScore}>{topThree[1].score} XP</Text>
              <View style={[styles.podiumStep, { height: 50, backgroundColor: 'rgba(148, 163, 184, 0.25)' }]}>
                <Text style={styles.podiumStepText}>Silver</Text>
              </View>
            </View>
          )}

          {/* 1st Place (Center, Tallest) */}
          {topThree[0] && (
            <View style={[styles.podiumColumn, styles.podiumFirst]}>
              <Crown size={20} color="#fbbf24" style={{ marginBottom: 2 }} />
              <View style={[styles.podiumBadge, { backgroundColor: '#fbbf24' }]}>
                <Text style={[styles.podiumRankNum, { color: '#0f172a' }]}>1</Text>
              </View>
              <Text style={[styles.podiumTeamName, { color: '#fbbf24', fontWeight: '800' }]} numberOfLines={1}>
                {topThree[0].teamName}
              </Text>
              <Text style={styles.podiumScore}>{topThree[0].score} XP</Text>
              <View style={[styles.podiumStep, { height: 75, backgroundColor: 'rgba(251, 191, 36, 0.25)' }]}>
                <Text style={[styles.podiumStepText, { color: '#fbbf24', fontWeight: '800' }]}>Champion</Text>
              </View>
            </View>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <View style={[styles.podiumColumn, styles.podiumThird]}>
              <View style={[styles.podiumBadge, { backgroundColor: '#d97706' }]}>
                <Text style={styles.podiumRankNum}>3</Text>
              </View>
              <Text style={styles.podiumTeamName} numberOfLines={1}>
                {topThree[2].teamName}
              </Text>
              <Text style={styles.podiumScore}>{topThree[2].score} XP</Text>
              <View style={[styles.podiumStep, { height: 38, backgroundColor: 'rgba(217, 119, 6, 0.25)' }]}>
                <Text style={styles.podiumStepText}>Bronze</Text>
              </View>
            </View>
          )}
        </View>

        {/* Full Leaderboard List */}
        <View style={styles.leaderboardList}>
          {sortedLeaderboard.map((entry, idx) => {
            const isCurrentTeam = idx === 1; // Highlight user's team at #2
            return (
              <View
                key={entry.id || idx}
                style={[
                  styles.leaderboardRow,
                  isCurrentTeam && styles.leaderboardRowCurrent,
                ]}
              >
                <View style={styles.rankBadge}>
                  <Text style={[styles.rankBadgeText, isCurrentTeam && { color: '#fbbf24' }]}>
                    #{idx + 1}
                  </Text>
                </View>

                <View style={styles.teamInfo}>
                  <Text style={[styles.teamNameText, isCurrentTeam && { color: '#38bdf8' }]} numberOfLines={1}>
                    {entry.teamName} {isCurrentTeam && '(You)'}
                  </Text>
                  <Text style={styles.teamSolvedText}>
                    {entry.cluesSolved}/{entry.totalClues} Clues Solved • {entry.lastSolvedTime}
                  </Text>
                </View>

                <Text style={[styles.teamScoreText, isCurrentTeam && { color: '#fbbf24' }]}>
                  {entry.score} XP
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. FEEDBACK & REVIEW FORM (Requirement #5: rating, written feedback, report issue) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MessageSquare size={18} color="#fbbf24" />
          <Text style={styles.sectionTitle}>Event Feedback & Review</Text>
        </View>

        {feedbackSubmitted ? (
          <View style={styles.feedbackSuccessCard}>
            <CheckCircle2 size={32} color="#10b981" />
            <Text style={styles.feedbackSuccessTitle}>Feedback Submitted!</Text>
            <Text style={styles.feedbackSuccessDesc}>
              Thank you for reviewing {event.title}. Your feedback has been shared with {event.organizerName || 'the event organizer'} to improve future hunts.
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* Star Rating */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Overall Event Experience:</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <TouchableOpacity
                    key={starVal}
                    onPress={() => setRating(starVal)}
                    style={styles.starBtn}
                    activeOpacity={0.7}
                  >
                    <Star
                      size={28}
                      color={starVal <= rating ? '#fbbf24' : '#475569'}
                      fill={starVal <= rating ? '#fbbf24' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingLabelText}>
                  {rating === 5 ? 'Exceptional ⭐️' : rating === 4 ? 'Great 👍' : rating === 3 ? 'Good 🙂' : 'Needs Work ⚠️'}
                </Text>
              </View>
            </View>

            {/* Written Feedback */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Written Comments & Highlights:</Text>
              <TextInput
                style={styles.feedbackTextInput}
                placeholder="What did your squad enjoy most? How was clue difficulty and pacing?..."
                placeholderTextColor="#64748b"
                value={writtenFeedback}
                onChangeText={setWrittenFeedback}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Report an Issue */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Report an Issue (Optional):</Text>
              <View style={styles.issuesChipsRow}>
                {issueOptions.map((issue) => {
                  const isSelected = selectedIssue === issue;
                  return (
                    <TouchableOpacity
                      key={issue}
                      onPress={() => setSelectedIssue(isSelected ? null : issue)}
                      style={[
                        styles.issueChip,
                        isSelected && styles.issueChipSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <AlertCircle size={12} color={isSelected ? '#f43f5e' : '#94a3b8'} />
                      <Text style={[styles.issueChipText, isSelected && styles.issueChipTextSelected]}>
                        {issue}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedIssue && (
                <TextInput
                  style={styles.issueDetailsInput}
                  placeholder={`Describe specifics regarding "${selectedIssue}"...`}
                  placeholderTextColor="#64748b"
                  value={issueDetails}
                  onChangeText={setIssueDetails}
                />
              )}
            </View>

            {/* Submit Feedback Button */}
            <TouchableOpacity
              onPress={handleSubmitFeedback}
              style={styles.submitFeedbackBtn}
              activeOpacity={0.8}
            >
              <Send size={15} color="#0f172a" />
              <Text style={styles.submitFeedbackBtnText}>Submit Review & Feedback</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Navigation Actions */}
      <View style={styles.navActionsRow}>
        <TouchableOpacity onPress={onGoToHome} style={styles.returnHomeBtn} activeOpacity={0.8}>
          <Text style={styles.returnHomeBtnText}>Return to Events Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoToMyEvents} style={styles.myEventsNavBtn} activeOpacity={0.8}>
          <Text style={styles.myEventsNavBtnText}>View My Events</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 14,
  },
  concludedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  trophyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  concludedSub: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  concludedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  concludedMeta: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2,
  },

  summaryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryPlayerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  summaryTeamName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },

  /* Sections */
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },

  /* Podium */
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },
  podiumFirst: {
    marginBottom: 0,
  },
  podiumSecond: {
    marginBottom: 0,
  },
  podiumThird: {
    marginBottom: 0,
  },
  podiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumRankNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  podiumTeamName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    maxWidth: 90,
  },
  podiumScore: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
  },
  podiumStep: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumStepText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  /* Leaderboard List */
  leaderboardList: {
    gap: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  leaderboardRowCurrent: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  rankBadge: {
    width: 28,
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#94a3b8',
  },
  teamInfo: {
    flex: 1,
  },
  teamNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  teamSolvedText: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  teamScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },

  /* Feedback Form */
  formContainer: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starBtn: {
    padding: 2,
  },
  ratingLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    marginLeft: 6,
  },
  feedbackTextInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    fontSize: 13,
    color: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  issuesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  issueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  issueChipSelected: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
  },
  issueChipText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  issueChipTextSelected: {
    color: '#f43f5e',
    fontWeight: '700',
  },
  issueDetailsInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#f8fafc',
    marginTop: 6,
  },
  submitFeedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 4,
  },
  submitFeedbackBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  feedbackSuccessCard: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  feedbackSuccessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
  },
  feedbackSuccessDesc: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Secret Mission Debriefing Card */
  secretDebriefCard: {
    backgroundColor: '#0a0f22',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    boxShadow: '0 0 24px rgba(225, 29, 72, 0.15)',
  },
  secretDebriefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  secretDebriefBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  covertPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  covertSignalText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f43f5e',
    letterSpacing: 1.5,
    fontFamily: 'monospace, sans-serif',
  },
  missionSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  missionSuccessBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.5,
    fontFamily: 'monospace, sans-serif',
  },
  missionFailedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  missionFailedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f43f5e',
    letterSpacing: 0.5,
    fontFamily: 'monospace, sans-serif',
  },
  secretDebriefTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1.5,
    fontFamily: 'Cinzel, Georgia, serif',
  },
  secretDebriefSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  debriefRiddleBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  debriefPhaseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debriefPhaseTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1,
    fontFamily: 'monospace, sans-serif',
  },
  debriefStatusCleared: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#10b981',
    fontFamily: 'monospace, sans-serif',
  },
  debriefStatusFailed: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#f43f5e',
    fontFamily: 'monospace, sans-serif',
  },
  debriefRiddlePrompt: {
    fontSize: 13,
    color: '#f8fafc',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  debriefAnswersRow: {
    gap: 8,
    marginTop: 2,
  },
  debriefAnswerItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 10,
  },
  debriefAnswerLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 2,
  },
  debriefAnswerVal: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '800',
  },
  debriefAnswerItemCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  debriefAnswerLabelCorrect: {
    fontSize: 10,
    color: '#6ee7b7',
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  debriefAnswerValCorrect: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '900',
  },
  codeComparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(5, 10, 24, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  codeCompCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  codeCompLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  codeCompDigits: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace, sans-serif',
    letterSpacing: 3,
  },
  codeCompDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  riddlesBreakdownCol: {
    gap: 10,
    marginTop: 4,
  },
  breakdownItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  breakdownTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#fbbf24',
  },
  breakdownRiddleText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  breakdownAnswerText: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  breakdownAnswerHighlight: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10b981',
    fontFamily: 'monospace, sans-serif',
  },
  breakdownFormulaResult: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  breakdownFormulaText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    fontFamily: 'monospace, sans-serif',
  },

  /* Navigation */
  navActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  returnHomeBtn: {
    flex: 1,
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnHomeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  myEventsNavBtn: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myEventsNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
});
