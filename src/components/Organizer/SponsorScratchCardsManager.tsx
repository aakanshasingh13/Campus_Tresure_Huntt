import React, { useState, useEffect } from 'react';
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
  Gift,
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  Eye,
  Tag,
  Award,
  Layers,
  Copy,
  Check,
  X,
  AlertTriangle,
  Zap,
  Store,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native';
import {
  SponsorScratchCard,
  getSponsorScratchCards,
  addSponsorScratchCard,
  deleteSponsorScratchCard,
  toggleSponsorScratchCardStatus,
  subscribeSponsorScratchCards,
} from '../../utils/sponsorScratchCardManager';
import { playCelebrationSound, playSuccessSound } from '../../utils/audioEffects';

interface SponsorScratchCardsManagerProps {
  organizerName?: string;
}

export const SponsorScratchCardsManager: React.FC<SponsorScratchCardsManagerProps> = ({
  organizerName = 'Event Organizer',
}) => {
  const [cards, setCards] = useState<SponsorScratchCard[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Form State for creating a new sponsor card
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorCategory, setSponsorCategory] = useState<string>('Food & Cafe');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [xpAmount, setXpAmount] = useState<number>(250);
  const [foilType, setFoilType] = useState<'gold' | 'silver' | 'bronze'>('gold');
  const [formError, setFormError] = useState('');

  // Load cards on mount and subscribe to real-time changes
  useEffect(() => {
    setCards(getSponsorScratchCards());
    const unsubscribe = subscribeSponsorScratchCards((updated) => {
      setCards(updated);
    });
    return unsubscribe;
  }, []);

  // Quick generator for promo codes
  const generateRandomCode = () => {
    const brandPrefix = sponsorName
      ? sponsorName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
      : 'CAMPUS';
    const randNum = Math.floor(100 + Math.random() * 900);
    const code = `${brandPrefix}${randNum}`;
    setPromoCode(code);
  };

  const handleOpenCreateModal = () => {
    setSponsorName('');
    setSponsorCategory('Food & Cafe');
    setRewardTitle('');
    setRewardDescription('');
    setPromoCode('');
    setXpAmount(250);
    setFoilType('gold');
    setFormError('');
    setShowCreateModal(true);
  };

  const handleCreateCard = () => {
    if (!sponsorName.trim()) {
      setFormError('Please enter the Sponsor or Brand name.');
      return;
    }
    if (!rewardTitle.trim()) {
      setFormError('Please enter the Reward Title (e.g. Free Latte + 250 XP).');
      return;
    }
    if (!promoCode.trim()) {
      setFormError('Please enter a secret Promo/Voucher Code.');
      return;
    }

    addSponsorScratchCard({
      sponsorName: sponsorName.trim(),
      sponsorCategory,
      rewardTitle: rewardTitle.trim(),
      rewardDescription:
        rewardDescription.trim() ||
        `Redeem this exclusive promo code at ${sponsorName} outlets.`,
      promoCode: promoCode.trim().toUpperCase(),
      xpAmount: Number(xpAmount) || 150,
      type: foilType,
      createdBy: organizerName,
      isActive: true,
      expiryDate: '2026-12-31',
      terms: 'Valid for all registered campus hunt participants.',
    });

    playCelebrationSound();
    setShowCreateModal(false);
  };

  const handleDeleteCard = (id: string, name: string) => {
    if (typeof window !== 'undefined') {
      const confirmDelete = window.confirm(
        `Are you sure you want to remove the sponsor scratch card for "${name}"?`
      );
      if (!confirmDelete) return;
    }
    deleteSponsorScratchCard(id);
    playSuccessSound();
  };

  const handleToggleStatus = (id: string) => {
    toggleSponsorScratchCardStatus(id);
    playSuccessSound();
  };

  const handleCopyCode = (id: string, code: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code);
      }
    } catch (e) {}
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Stats calculation
  const totalCards = cards.length;
  const activeCards = cards.filter((c) => c.isActive).length;
  const totalClaims = cards.reduce((acc, c) => acc + (c.totalClaims || 0), 0);

  const categories = [
    'Food & Cafe',
    'Tech & Audio',
    'Student Deals',
    'Apparel & Merch',
    'Books & Stationery',
    'Entertainment',
  ];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeaderCard}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBox}>
            <Gift size={22} color="#fbbf24" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.subCategoryBadge}>OFFICIAL SPONSORSHIP PORTAL</Text>
              <View style={styles.liveSyncPill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveSyncText}>Synced to Players</Text>
              </View>
            </View>
            <Text style={styles.mainTitle}>Sponsor Scratch Cards</Text>
            <Text style={styles.mainSub}>
              Create branded scratch cards for your hunt sponsors. Players will reveal them in their Rewards tab to claim discounts, merchandise & bonus XP!
            </Text>
          </View>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalCards}</Text>
            <Text style={styles.statLbl}>Total Cards</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>{activeCards}</Text>
            <Text style={styles.statLbl}>Live for Players</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#fbbf24' }]}>{totalClaims}</Text>
            <Text style={styles.statLbl}>Times Scratched</Text>
          </View>
        </View>

        {/* Create Scratch Card CTA Button */}
        <TouchableOpacity
          onPress={handleOpenCreateModal}
          style={styles.createCardBtn}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#0f172a" />
          <Text style={styles.createCardBtnText}>+ Create New Sponsor Scratch Card</Text>
        </TouchableOpacity>
      </View>

      {/* List of Sponsor Cards */}
      <View style={styles.cardsList}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listSectionTitle}>Active Sponsor Promotions ({cards.length})</Text>
          <Text style={styles.listSectionHint}>Shown to players in real-time</Text>
        </View>

        {cards.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Gift size={32} color="#64748b" />
            <Text style={styles.emptyTitle}>No Sponsor Scratch Cards Yet</Text>
            <Text style={styles.emptySub}>
              Click "+ Create New Sponsor Scratch Card" above to add your first sponsor perk!
            </Text>
          </View>
        ) : (
          cards.map((card) => {
            const isCopied = copiedCodeId === card.id;

            return (
              <View
                key={card.id}
                style={[
                  styles.cardItem,
                  !card.isActive && styles.cardItemInactive,
                  card.type === 'gold'
                    ? styles.cardGoldBorder
                    : card.type === 'silver'
                    ? styles.cardSilverBorder
                    : styles.cardBronzeBorder,
                ]}
              >
                {/* Top Row: Sponsor Brand, Category, Status Toggle */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardBrandRow}>
                      <Store size={14} color="#fbbf24" />
                      <Text style={styles.cardBrandText}>{card.sponsorName}</Text>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{card.sponsorCategory}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardRewardTitle}>{card.rewardTitle}</Text>
                  </View>

                  {/* Active / Inactive Toggle */}
                  <TouchableOpacity
                    onPress={() => handleToggleStatus(card.id)}
                    style={styles.toggleBtn}
                    activeOpacity={0.75}
                  >
                    {card.isActive ? (
                      <View style={styles.activePill}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    ) : (
                      <View style={styles.inactivePill}>
                        <Text style={styles.inactivePillText}>Hidden</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <Text style={styles.cardDescText}>{card.rewardDescription}</Text>

                {/* Promo Code & XP Badges Row */}
                <View style={styles.cardMetaRow}>
                  {/* Promo Code Pill with Copy Action */}
                  <TouchableOpacity
                    onPress={() => handleCopyCode(card.id, card.promoCode)}
                    style={styles.promoCodeBox}
                    activeOpacity={0.75}
                  >
                    <Tag size={12} color="#fde047" />
                    <Text style={styles.promoCodeLabel}>CODE:</Text>
                    <Text style={styles.promoCodeValue}>{card.promoCode}</Text>
                    {isCopied ? (
                      <Check size={12} color="#10b981" />
                    ) : (
                      <Copy size={12} color="#94a3b8" />
                    )}
                  </TouchableOpacity>

                  {/* XP Reward Badge */}
                  <View style={styles.xpRewardBadge}>
                    <Zap size={12} color="#fbbf24" />
                    <Text style={styles.xpRewardText}>+{card.xpAmount} XP</Text>
                  </View>

                  {/* Foil Theme Pill */}
                  <View style={styles.foilTypePill}>
                    <Layers size={11} color="#cbd5e1" />
                    <Text style={styles.foilTypeText}>
                      {card.type === 'gold'
                        ? 'Gold Vault'
                        : card.type === 'silver'
                        ? 'Cyber Silver'
                        : 'Flame Bronze'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Actions Row */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.claimsCountText}>
                    Scratched <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{card.totalClaims || 0}</Text> times by players
                  </Text>

                  <View style={styles.actionButtonsGroup}>
                    <TouchableOpacity
                      onPress={() => handleDeleteCard(card.id, card.sponsorName)}
                      style={styles.deleteCardBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#f87171" />
                      <Text style={styles.deleteCardBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ======================================================== */}
      {/* MODAL: CREATE NEW SPONSOR SCRATCH CARD                   */}
      {/* ======================================================== */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Plus size={20} color="#0f172a" />
                </View>
                <View>
                  <Text style={styles.modalCategoryTag}>NEW SPONSOR PROMOTION</Text>
                  <Text style={styles.modalTitle}>Create Sponsor Scratch Card</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {formError ? (
                <View style={styles.errorAlertBox}>
                  <AlertTriangle size={15} color="#ef4444" />
                  <Text style={styles.errorAlertText}>{formError}</Text>
                </View>
              ) : null}

              {/* 1. Sponsor / Brand Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sponsor / Brand Name *</Text>
                <TextInput
                  value={sponsorName}
                  onChangeText={(val) => {
                    setSponsorName(val);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. Red Bull, Starbucks, Dominos Pizza, Boat Audio"
                  placeholderTextColor="#64748b"
                  style={styles.textInput}
                />
              </View>

              {/* 2. Sponsor Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Sponsor Category</Text>
                <View style={styles.categoryPillsWrap}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSponsorCategory(cat)}
                      style={[
                        styles.catSelectPill,
                        sponsorCategory === cat && styles.catSelectPillActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.catSelectPillText,
                          sponsorCategory === cat && styles.catSelectPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Reward Headline */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reward Headline (Revealed when Scratched) *</Text>
                <TextInput
                  value={rewardTitle}
                  onChangeText={(val) => {
                    setRewardTitle(val);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. Free Large Iced Latte + 250 XP"
                  placeholderTextColor="#64748b"
                  style={styles.textInput}
                />
              </View>

              {/* 4. Secret Promo / Discount Code */}
              <View style={styles.formGroup}>
                <View style={styles.labelBetweenRow}>
                  <Text style={styles.formLabel}>Secret Promo Code *</Text>
                  <TouchableOpacity onPress={generateRandomCode} activeOpacity={0.7}>
                    <Text style={styles.autoGenText}>⚡ Auto-Generate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={promoCode}
                  onChangeText={(val) => {
                    setPromoCode(val.toUpperCase());
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g. CAMPUS50, REDBULLXP"
                  placeholderTextColor="#64748b"
                  style={[styles.textInput, { letterSpacing: 1.5, fontWeight: '800' }]}
                />
              </View>

              {/* 5. Bonus XP Amount Drop */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bonus XP Drop Awarded to Player</Text>
                <View style={styles.xpQuickRow}>
                  {[100, 150, 250, 300, 500].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      onPress={() => setXpAmount(amount)}
                      style={[
                        styles.xpQuickBtn,
                        xpAmount === amount && styles.xpQuickBtnActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.xpQuickBtnText,
                          xpAmount === amount && styles.xpQuickBtnTextActive,
                        ]}
                      >
                        +{amount} XP
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 6. Foil Metallic Finish */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Scratch Foil Theme</Text>
                <View style={styles.foilOptionsRow}>
                  <TouchableOpacity
                    onPress={() => setFoilType('gold')}
                    style={[
                      styles.foilOptionBtn,
                      styles.foilOptionGold,
                      foilType === 'gold' && styles.foilOptionActive,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.foilOptionText, { color: '#fbbf24' }]}>Gold Vault</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFoilType('silver')}
                    style={[
                      styles.foilOptionBtn,
                      styles.foilOptionSilver,
                      foilType === 'silver' && styles.foilOptionActive,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.foilOptionText, { color: '#e2e8f0' }]}>Cyber Silver</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFoilType('bronze')}
                    style={[
                      styles.foilOptionBtn,
                      styles.foilOptionBronze,
                      foilType === 'bronze' && styles.foilOptionActive,
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.foilOptionText, { color: '#fb923c' }]}>Flame Bronze</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 7. Offer Description & Terms */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Offer Instructions / Terms</Text>
                <TextInput
                  value={rewardDescription}
                  onChangeText={setRewardDescription}
                  placeholder="e.g. Present this code at the campus cafe counter to redeem."
                  placeholderTextColor="#64748b"
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                />
              </View>

              {/* Preview Box */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>✦ LIVE PLAYER VIEW PREVIEW</Text>
                <View style={styles.previewCardBox}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewBrand}>{sponsorName || 'Brand Sponsor'}</Text>
                    <Text style={styles.previewTag}>✦ SPONSORED SCRATCHER</Text>
                  </View>
                  <Text style={styles.previewReward}>
                    {rewardTitle || 'Your Custom Reward Title'}
                  </Text>
                  <View style={styles.previewCodeRow}>
                    <Text style={styles.previewCodeText}>
                      CODE: {promoCode || 'PROMO2026'} • +{xpAmount} XP
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCancelBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateCard}
                style={styles.modalSubmitBtn}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#0f172a" />
                <Text style={styles.modalSubmitBtnText}>Publish Sponsor Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    gap: 14,
  },
  sectionHeaderCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subCategoryBadge: {
    color: '#fbbf24',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  liveSyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveSyncText: {
    color: '#34d399',
    fontSize: 9.5,
    fontWeight: '800',
  },
  mainTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  mainSub: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#090d16',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  createCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0 0 16px rgba(251, 191, 36, 0.4)',
  },
  createCardBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  cardsList: {
    gap: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  listSectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  listSectionHint: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyStateBox: {
    backgroundColor: '#0b1120',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  cardItem: {
    backgroundColor: '#0c1322',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 10,
    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
  },
  cardItemInactive: {
    opacity: 0.6,
  },
  cardGoldBorder: {
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  cardSilverBorder: {
    borderColor: 'rgba(203, 213, 225, 0.4)',
  },
  cardBronzeBorder: {
    borderColor: 'rgba(249, 115, 22, 0.45)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  cardBrandText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  categoryPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  categoryPillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  cardRewardTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '900',
  },
  toggleBtn: {
    padding: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  activePillText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
  },
  inactivePill: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  inactivePillText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
  },
  cardDescText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    lineHeight: 16,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#131b2e',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  promoCodeLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  promoCodeValue: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  xpRewardText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
  },
  foilTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  foilTypeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  claimsCountText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  deleteCardBtnText: {
    color: '#f87171',
    fontSize: 10.5,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#0c1322',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    boxShadow: '0 0 35px rgba(251, 191, 36, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategoryTag: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 12,
  },
  errorAlertText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    color: '#f8fafc',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelBetweenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  autoGenText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#131b2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  categoryPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catSelectPill: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  catSelectPillActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
  },
  catSelectPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  catSelectPillTextActive: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  xpQuickRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  xpQuickBtn: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  xpQuickBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
  },
  xpQuickBtnText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  xpQuickBtnTextActive: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  foilOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  foilOptionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#131b2e',
  },
  foilOptionGold: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  foilOptionSilver: {
    borderColor: 'rgba(203, 213, 225, 0.4)',
  },
  foilOptionBronze: {
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  foilOptionActive: {
    borderWidth: 2,
    backgroundColor: '#1a233d',
    boxShadow: '0 0 12px rgba(251, 191, 36, 0.3)',
  },
  foilOptionText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  previewContainer: {
    backgroundColor: '#090e1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginTop: 6,
    marginBottom: 10,
  },
  previewLabel: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  previewCardBox: {
    backgroundColor: '#10182b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d97706',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewBrand: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
  },
  previewTag: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '800',
  },
  previewReward: {
    color: '#fef08a',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  previewCodeRow: {
    backgroundColor: '#090e1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewCodeText: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: '#0a101d',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  modalCancelBtnText: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    boxShadow: '0 0 14px rgba(251, 191, 36, 0.4)',
  },
  modalSubmitBtnText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '900',
  },
});
