import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Trophy,
  Crown,
  Sparkles,
  Users,
  Compass,
  Award,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { LeaderboardEntry, UserProfile, TreasureEvent } from '../../types';

interface LeaderboardScreenProps {
  user: UserProfile;
  leaderboard: LeaderboardEntry[];
  activeEvent?: TreasureEvent | null;
  onLaunchGame?: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  user,
  leaderboard,
  activeEvent,
  onLaunchGame,
}) => {
  const [rankingType, setRankingType] = useState<'hunt' | 'campus'>('hunt');

  const sortedList = [...leaderboard].sort((a, b) => b.score - a.score);
  const topThree = sortedList.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.trophyIconBox}>
          <Trophy size={24} color="#fbbf24" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Campus Quest Rankings</Text>
          <Text style={styles.headerSub}>
            Live leaderboard standings, top squad podiums & historical honors
          </Text>
        </View>
      </View>

      {/* Switch between Live Hunt and Campus League */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={() => setRankingType('hunt')}
          style={[styles.toggleBtn, rankingType === 'hunt' && styles.toggleBtnActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, rankingType === 'hunt' && styles.toggleTextActive]}>
            Active Hunt Standings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRankingType('campus')}
          style={[styles.toggleBtn, rankingType === 'campus' && styles.toggleBtnActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, rankingType === 'campus' && styles.toggleTextActive]}>
            Global Campus League
          </Text>
        </TouchableOpacity>
      </View>

      {/* Podium Display (Top 3) */}
      <View style={styles.podiumCard}>
        <Text style={styles.podiumTitle}>Top Ranked Squads</Text>

        <View style={styles.podiumRow}>
          {/* 2nd Place */}
          {topThree[1] && (
            <View style={[styles.podiumCol, styles.colSecond]}>
              <View style={[styles.rankCircle, { backgroundColor: '#94a3b8' }]}>
                <Text style={styles.rankNum}>2</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].teamName}</Text>
              <Text style={styles.podiumScore}>{topThree[1].score} XP</Text>
              <View style={[styles.podiumPillar, { height: 55, backgroundColor: 'rgba(148, 163, 184, 0.25)' }]}>
                <Text style={styles.pillarText}>Silver</Text>
              </View>
            </View>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <View style={[styles.podiumCol, styles.colFirst]}>
              <Crown size={22} color="#fbbf24" style={{ marginBottom: 2 }} />
              <View style={[styles.rankCircle, { backgroundColor: '#fbbf24' }]}>
                <Text style={[styles.rankNum, { color: '#0f172a' }]}>1</Text>
              </View>
              <Text style={[styles.podiumName, { color: '#fbbf24', fontWeight: '800' }]} numberOfLines={1}>
                {topThree[0].teamName}
              </Text>
              <Text style={styles.podiumScore}>{topThree[0].score} XP</Text>
              <View style={[styles.podiumPillar, { height: 80, backgroundColor: 'rgba(251, 191, 36, 0.25)' }]}>
                <Text style={[styles.pillarText, { color: '#fbbf24', fontWeight: '800' }]}>Champion</Text>
              </View>
            </View>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <View style={[styles.podiumCol, styles.colThird]}>
              <View style={[styles.rankCircle, { backgroundColor: '#d97706' }]}>
                <Text style={styles.rankNum}>3</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].teamName}</Text>
              <Text style={styles.podiumScore}>{topThree[2].score} XP</Text>
              <View style={[styles.podiumPillar, { height: 42, backgroundColor: 'rgba(217, 119, 6, 0.25)' }]}>
                <Text style={styles.pillarText}>Bronze</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Full Leaderboard Table */}
      <View style={styles.leaderboardSection}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeaderTitle}>All Registered Teams</Text>
          <Text style={styles.tableHeaderMeta}>{sortedList.length} squads competing</Text>
        </View>

        <View style={styles.rankingsList}>
          {sortedList.map((team, idx) => {
            const isUserTeam = idx === 1; // User is #2
            return (
              <View
                key={team.id || idx}
                style={[
                  styles.teamRowCard,
                  isUserTeam && styles.teamRowCardHighlight,
                ]}
              >
                <View style={styles.rankCol}>
                  <Text style={[styles.rankColText, isUserTeam && { color: '#fbbf24' }]}>
                    #{idx + 1}
                  </Text>
                </View>

                <View style={styles.teamCol}>
                  <Text style={[styles.teamName, isUserTeam && { color: '#38bdf8' }]} numberOfLines={1}>
                    {team.teamName} {isUserTeam && '(Your Squad)'}
                  </Text>
                  <Text style={styles.teamSub}>
                    {team.cluesSolved}/{team.totalClues} Clues • Solved in {team.lastSolvedTime}
                  </Text>
                </View>

                <View style={styles.scoreCol}>
                  <Text style={[styles.scoreText, isUserTeam && { color: '#fbbf24' }]}>
                    {team.score} XP
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
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
    paddingBottom: 90,
    gap: 14,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  trophyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fbbf24',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  toggleTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },

  podiumCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  podiumTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
  },
  colFirst: {
    marginBottom: 0,
  },
  colSecond: {
    marginBottom: 0,
  },
  colThird: {
    marginBottom: 0,
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  podiumName: {
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
  podiumPillar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  leaderboardSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tableHeaderMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  rankingsList: {
    gap: 8,
  },
  teamRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamRowCardHighlight: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  rankCol: {
    width: 28,
    alignItems: 'center',
  },
  rankColText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
  },
  teamCol: {
    flex: 1,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  teamSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
});
