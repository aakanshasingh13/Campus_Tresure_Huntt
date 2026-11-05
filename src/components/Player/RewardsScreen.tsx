import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Gift,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Zap,
  Lock,
  Store,
  Tag,
} from 'lucide-react-native';
import { UserProfile } from '../../types';
import { playCelebrationSound } from '../../utils/audioEffects';
import { InteractiveScratchSurface } from './InteractiveScratchSurface';
import {
  getSponsorScratchCards,
  subscribeSponsorScratchCards,
  markCardAsScratched,
  isCardScratchedByUser,
  resetCardForUser,
  SponsorScratchCard,
} from '../../utils/sponsorScratchCardManager';

interface RewardsScreenProps {
  user: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
}

interface ScratchCardItem {
  id: string;
  title: string;
  sub: string;
  rewardText: string;
  xpAmount: number;
  badgeName?: string;
  isSponsored?: boolean;
  sponsorTag?: string;
  isScratched: boolean;
  type: 'silver' | 'bronze' | 'gold';
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'scratch' | 'badges' | 'history'>('scratch');
  const userKey = user.email || user.username || 'current_player';

  // Sponsor cards created by organizer
  const [sponsorCards, setSponsorCards] = useState<SponsorScratchCard[]>([]);

  useEffect(() => {
    setSponsorCards(getSponsorScratchCards().filter((c) => c.isActive));
    const unsubscribe = subscribeSponsorScratchCards((all) => {
      setSponsorCards(all.filter((c) => c.isActive));
    });
    return unsubscribe;
  }, []);

  const handleScratchSponsorCard = (cardId: string, xpAmount: number) => {
    playCelebrationSound();
    markCardAsScratched(cardId, userKey);
    const newScore = (user.score || 550) + xpAmount;
    if (onUpdateUser) {
      onUpdateUser({ score: newScore });
    }
  };

  const handleResetSponsorCard = (cardId: string) => {
    resetCardForUser(cardId, userKey);
  };

  // Interactive Scratch Cards state matching reference screenshot exactly
  const [scratchCards, setScratchCards] = useState<ScratchCardItem[]>([
    {
      id: 'sc-1',
      title: 'Daily Campus Vault Scratcher',
      sub: 'Tap & hold to scratch off and reveal your mystery XP drop',
      rewardText: '+150 Mystery Bonus XP',
      xpAmount: 150,
      isScratched: false,
      type: 'silver',
    },
    {
      id: 'sc-2',
      title: 'Secret Agent Directive Reward',
      sub: 'Awarded for discovering covert frequencies mid-game',
      rewardText: '+250 XP & Gold Cipher Seal',
      xpAmount: 250,
      badgeName: 'Secret Agent',
      isScratched: false,
      type: 'bronze',
    },
    {
      id: 'sc-3',
      title: 'Sponsor Scratch Card',
      sub: 'Win a perk from our campus partner',
      rewardText: 'Free Campus Café Voucher + 100 XP',
      xpAmount: 100,
      isSponsored: true,
      sponsorTag: 'SPONSORED · [Sponsor]',
      isScratched: false,
      type: 'gold',
    },
  ]);

  // Scratch card reveal logic
  const handleScratchCard = (cardId: string) => {
    setScratchCards((prev) =>
      prev.map((card) => {
        if (card.id === cardId && !card.isScratched) {
          playCelebrationSound();
          const newScore = (user.score || 550) + card.xpAmount;
          const currentBadges = user.badges ? [...user.badges] : [];
          if (card.badgeName && !currentBadges.includes(card.badgeName)) {
            currentBadges.push(card.badgeName);
          }
          if (onUpdateUser) {
            onUpdateUser({
              score: newScore,
              badges: currentBadges,
            });
          }
          return { ...card, isScratched: true };
        }
        return card;
      })
    );
  };

  // Allow resetting a card for testing / re-scratching
  const resetCard = (cardId: string) => {
    setScratchCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, isScratched: false } : card))
    );
  };

  const allBadges = [
    { name: 'First Find', desc: 'Solved first campus riddle', unlocked: true, icon: '🌟' },
    { name: 'Speedster', desc: 'Solved a clue in under 60 seconds', unlocked: true, icon: '⚡' },
    { name: 'Detective', desc: 'Found 10 hidden location checkpoints', unlocked: false, icon: '🔍' },
    { name: 'Secret Agent', desc: 'Completed classified mid-hunt directive', unlocked: (user.badges || []).includes('Secret Agent'), icon: '🕵️‍♂️' },
    { name: 'Pathfinder', desc: 'Traversed 5km around university grounds', unlocked: false, icon: '🧭' },
    { name: 'Campus Legend', desc: 'Rank #1 in any official campus hunt', unlocked: false, icon: '👑' },
  ];

  const bonusHistory = [
    { id: 'h1', title: 'Secret Mission Cipher Clearance', xp: '+250 XP', time: 'Today, 14:22', icon: 'zap' },
    { id: 'h2', title: 'Main Clock Tower First Discovery', xp: '+100 XP', time: 'Today, 14:05', icon: 'sparkle' },
    { id: 'h3', title: 'Daily Campus Scratcher Reveal', xp: '+150 XP', time: 'Yesterday', icon: 'gift' },
    { id: 'h4', title: 'Welcome Explorer Bonus', xp: '+50 XP', time: 'Joined Guild', icon: 'sparkle' },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gothic Night Atmosphere (Crescent Moon, Stars & Glowing Castle Windows) */}
      <View style={styles.backgroundCanvas} pointerEvents="none">
        {/* Crescent Moon */}
        <View style={styles.crescentMoon} />
        {/* Atmospheric Star Specks */}
        <View style={[styles.bgStar, { top: 28, left: 60, opacity: 0.5 }]} />
        <View style={[styles.bgStar, { top: 70, left: 180, opacity: 0.7, width: 2, height: 2 }]} />
        <View style={[styles.bgStar, { top: 40, right: 120, opacity: 0.6 }]} />
        <View style={[styles.bgStar, { top: 120, right: 40, opacity: 0.4 }]} />
        <View style={[styles.bgStar, { top: 160, left: 90, opacity: 0.55 }]} />
        <View style={[styles.bgStar, { top: 220, right: 80, opacity: 0.6 }]} />
        <View style={[styles.bgStar, { top: 380, left: 40, opacity: 0.5 }]} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: REWARDS & VAULT (Double Gold Border) */}
        <View style={styles.goldDoubleCardOuter}>
          <View style={styles.goldDoubleCardInner}>
            <View style={styles.giftIconRing}>
              <Gift size={24} color="#f59e0b" strokeWidth={1.75} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitleCinzel}>REWARDS & VAULT</Text>
              <Text style={styles.headerSubtitleText}>
                Scratch cards, badges and your bonus XP history
              </Text>
            </View>
          </View>
        </View>

        {/* CARD 2: CURRENT REWARD BALANCE (Double Gold Border) */}
        <View style={styles.goldDoubleCardOuter}>
          <View style={[styles.goldDoubleCardInner, styles.balanceCardRow]}>
            <View>
              <Text style={styles.balanceLabel}>CURRENT REWARD BALANCE</Text>
              <Text style={styles.balanceValueCinzel}>{(user.score ?? 550)} XP</Text>
            </View>
            <View style={styles.goldTierBox}>
              <Text style={styles.goldTierLine1}>Gold Tier</Text>
              <Text style={styles.goldTierLine2}>Explorer</Text>
            </View>
          </View>
        </View>

        {/* 3-TAB SELECTOR (Scratch Cards / Badges (2) / Bonus History) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('scratch')}
            style={[styles.tabBtn, activeTab === 'scratch' ? styles.tabBtnActive : styles.tabBtnInactive]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'scratch' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
              ]}
            >
              Scratch Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('badges')}
            style={[styles.tabBtn, activeTab === 'badges' ? styles.tabBtnActive : styles.tabBtnInactive]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'badges' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
              ]}
            >
              Badges (2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tabBtn, activeTab === 'history' ? styles.tabBtnActive : styles.tabBtnInactive]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'history' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
              ]}
            >
              Bonus History
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* TAB 1: SCRATCH CARDS (Pixel-perfect matching screenshot)  */}
        {/* ======================================================== */}
        {activeTab === 'scratch' && (
          <View style={styles.scratchListSection}>
            {/* SPONSOR SCRATCH CARDS CREATED BY ORGANIZER */}
            {sponsorCards.length > 0 && (
              <View style={styles.sponsorSectionBlock}>
                <View style={styles.sponsorSectionHeader}>
                  <Store size={15} color="#fbbf24" />
                  <Text style={styles.sponsorSectionTitle}>OFFICIAL SPONSOR SCRATCH CARDS</Text>
                  <View style={styles.partnerBadge}>
                    <Text style={styles.partnerBadgeText}>PARTNERS</Text>
                  </View>
                </View>
                <Text style={styles.sponsorSectionSub}>
                  Promotions and exclusive discount vouchers offered by official event partners. Scratch to reveal promo codes & bonus XP!
                </Text>

                {sponsorCards.map((sc) => {
                  const isScratched = isCardScratchedByUser(sc.id, userKey);
                  const cardData = {
                    id: sc.id,
                    title: `${sc.sponsorName} Scratcher`,
                    sub: sc.rewardDescription || 'Scratch to reveal exclusive voucher & XP drop',
                    rewardText: sc.rewardTitle,
                    xpAmount: sc.xpAmount,
                    isSponsored: true,
                    sponsorName: sc.sponsorName,
                    sponsorTag: `SPONSORED BY · ${sc.sponsorName.toUpperCase()}`,
                    promoCode: sc.promoCode,
                    isScratched,
                    type: sc.type || 'gold',
                  };

                  return (
                    <View key={sc.id} style={styles.scratchItemBlock}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardHeaderCinzel}>✦ {sc.sponsorName.toUpperCase()}</Text>
                        <View style={styles.sponsorPill}>
                          <Text style={styles.sponsorPillText}>
                            SPONSORED · {sc.sponsorCategory.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.cardSubText}>{cardData.sub}</Text>

                      <InteractiveScratchSurface
                        card={cardData}
                        onScratchComplete={() => handleScratchSponsorCard(sc.id, sc.xpAmount)}
                        onReset={() => handleResetSponsorCard(sc.id)}
                      />
                    </View>
                  );
                })}
              </View>
            )}

            {/* GENERAL CAMPUS SCRATCHERS */}
            <View style={{ marginTop: sponsorCards.length > 0 ? 8 : 0 }}>
              <View style={styles.sponsorSectionHeader}>
                <Sparkles size={14} color="#38bdf8" />
                <Text style={[styles.sponsorSectionTitle, { color: '#38bdf8' }]}>
                  CAMPUS VAULT MILESTONE SCRATCHERS
                </Text>
              </View>
            </View>

            {scratchCards.map((card) => (
              <View key={card.id} style={styles.scratchItemBlock}>
                {/* Title Row with ✦ and optional Sponsor tag */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderCinzel}>✦ {card.title.toUpperCase()}</Text>
                  {card.isSponsored && (
                    <View style={styles.sponsorPill}>
                      <Text style={styles.sponsorPillText}>
                        {card.sponsorTag || 'SPONSORED · [Sponsor]'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Subtitle */}
                <Text style={styles.cardSubText}>{card.sub}</Text>

                {/* The Interactive Scratch Surface (real dragging/rubbing, no single-click open) */}
                <InteractiveScratchSurface
                  card={card}
                  onScratchComplete={handleScratchCard}
                  onReset={resetCard}
                />
              </View>
            ))}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BADGES (2) SHOWCASE                               */}
        {/* ======================================================== */}
        {activeTab === 'badges' && (
          <View style={styles.badgesGrid}>
            {allBadges.map((badge) => (
              <View
                key={badge.name}
                style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}
              >
                <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
                {badge.unlocked ? (
                  <View style={styles.unlockedTag}>
                    <CheckCircle2 size={11} color="#10b981" />
                    <Text style={styles.unlockedTagText}>Unlocked</Text>
                  </View>
                ) : (
                  <View style={styles.lockedTag}>
                    <Lock size={11} color="#64748b" />
                    <Text style={styles.lockedTagText}>Locked</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: BONUS HISTORY                                     */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <View style={styles.historyList}>
            {bonusHistory.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyIconCircle}>
                  <Zap size={14} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyTime}>{item.time}</Text>
                </View>
                <Text style={styles.historyXp}>{item.xp}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 95,
    gap: 16,
  },

  /* Atmospheric Background Backdrop */
  backgroundCanvas: {
    display: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  crescentMoon: {
    position: 'absolute',
    top: 25,
    right: 25,
    width: 44,
    height: 44,
    borderRadius: 22,
    boxShadow: '-6px 6px 0 2px rgba(255, 255, 255, 0.12)',
    opacity: 0.8,
  },
  bgStar: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ffffff',
  },

  /* Double Gold Border Outer & Inner Containers */
  goldDoubleCardOuter: {
    borderWidth: 1.5,
    borderColor: '#c68a16',
    borderRadius: 18,
    padding: 3,
    backgroundColor: 'transparent',
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
  },
  goldDoubleCardInner: {
    borderWidth: 1.5,
    borderColor: '#c68a16',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#070f22',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  /* Header Card Elements */
  giftIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#d97706',
    backgroundColor: '#0a142c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitleCinzel: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 16,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.8,
  },
  headerSubtitleText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
    lineHeight: 16,
  },

  /* Balance Card Elements */
  balanceCardRow: {
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  balanceValueCinzel: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 27,
    fontWeight: '900',
    color: '#f59e0b',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  goldTierBox: {
    borderWidth: 1.5,
    borderColor: '#c68a16',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#09132a',
    justifyContent: 'center',
  },
  goldTierLine1: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
    lineHeight: 16,
  },
  goldTierLine2: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
    lineHeight: 16,
  },

  /* 3-Tab Selector Row */
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#f59e0b',
  },
  tabBtnInactive: {
    backgroundColor: '#09132a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabBtnTextActive: {
    color: '#0a0f1d',
  },
  tabBtnTextInactive: {
    color: '#ffffff',
  },

  /* Scratch List */
  scratchListSection: {
    gap: 16,
  },
  sponsorSectionBlock: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    gap: 12,
  },
  sponsorSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sponsorSectionTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sponsorSectionSub: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  partnerBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  partnerBadgeText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  scratchItemBlock: {
    gap: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderCinzel: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.6,
  },
  cardSubText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 4,
  },
  sponsorPill: {
    borderWidth: 1.2,
    borderColor: '#10b981',
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  sponsorPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.3,
  },

  /* The Scratch Foil Card */
  scratchFoilCard: {
    height: 128,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#c68a16',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
  },
  scratchFoilCardRevealed: {
    borderColor: '#10b981',
  },
  foilBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 16,
  },

  /* Metallic Gradients */
  foilSilver: {
    backgroundImage:
      'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 22%, #ffffff 48%, #cbd5e1 75%, #94a3b8 100%)',
    backgroundColor: '#cbd5e1',
  } as any,
  foilBronze: {
    backgroundImage:
      'linear-gradient(135deg, #b45309 0%, #d97706 25%, #f59e0b 50%, #b45309 78%, #78350f 100%)',
    backgroundColor: '#b45309',
  } as any,
  foilGold: {
    backgroundImage:
      'linear-gradient(135deg, #d97706 0%, #f59e0b 26%, #fef08a 52%, #f59e0b 78%, #b45309 100%)',
    backgroundColor: '#d97706',
  } as any,

  /* Sparkling star specks on foil */
  foilStarField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  foilStar: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  foilDot: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#ffffff',
    opacity: 0.5,
  },

  /* Centered ✦ SCRATCH HERE ✦ Text */
  scratchPromptCinzel: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  scratchPromptSilver: {
    color: '#334155',
  },
  scratchPromptBronze: {
    color: '#3a1a03',
  },
  scratchPromptGold: {
    color: '#3a1a03',
  },

  /* Revealed State */
  revealedStateContainer: {
    flex: 1,
    backgroundColor: '#071626',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 4,
  },
  revealedHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealedHeaderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  revealedPrizeText: {
    fontFamily: 'Cinzel, Georgia, serif',
    fontSize: 18,
    fontWeight: '900',
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 2,
  },
  revealedSubDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  resetScratchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  resetScratchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },

  /* Badges Grid */
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#070f22',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 6,
  },
  badgeCardLocked: {
    opacity: 0.55,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 15,
  },
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  unlockedTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10b981',
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  lockedTagText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '600',
  },

  /* History List */
  historyList: {
    gap: 8,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#070f22',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  historyTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  historyXp: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
});
