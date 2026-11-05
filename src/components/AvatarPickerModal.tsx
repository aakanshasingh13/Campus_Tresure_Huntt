import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import {
  Sparkles,
  Check,
  X,
  Crown,
  Smile,
  ShieldCheck,
  Compass,
} from 'lucide-react-native';
import { AVATAR_CATEGORIES, PIXAR_AVATARS, PixarAvatar } from '../data/avatars';

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarUrl?: string;
  onSelectAvatar: (avatar: PixarAvatar) => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  currentAvatarUrl,
  onSelectAvatar,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'female' | 'male' | 'animals' | 'objects' | 'special'>('all');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(() => {
    const found = PIXAR_AVATARS.find((a) => a.url === currentAvatarUrl);
    return found ? found.id : PIXAR_AVATARS[0].id;
  });

  const filteredAvatars = PIXAR_AVATARS.filter((a) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'female') return a.gender === 'female' || a.category === 'female';
    if (selectedCategory === 'male') return a.gender === 'male' || a.category === 'male';
    if (selectedCategory === 'animals') return a.category === 'animals';
    if (selectedCategory === 'objects') return a.category === 'objects';
    if (selectedCategory === 'special') return a.gender === 'special' || a.category === 'animals' || a.category === 'objects';
    return true;
  });
  const activeAvatar = PIXAR_AVATARS.find((a) => a.id === selectedAvatarId) || PIXAR_AVATARS[0];

  const handleConfirm = () => {
    if (activeAvatar) {
      onSelectAvatar(activeAvatar);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconCircle}>
                <Sparkles size={18} color="#fde047" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Choose 3D Pixar Avatar</Text>
                <Text style={styles.modalSubtitle}>Select your persona for Campus Quest</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Active Avatar Highlight Banner */}
          <View style={styles.activePreviewBanner}>
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: activeAvatar.url }} style={styles.previewImage} />
              <View style={styles.previewEmojiBadge}>
                <Text style={{ fontSize: 13 }}>{activeAvatar.emoji}</Text>
              </View>
            </View>
            <View style={styles.previewInfo}>
              <View style={styles.previewBadgePill}>
                <Crown size={11} color="#fbbf24" />
                <Text style={styles.previewBadgeText}>{activeAvatar.badge}</Text>
              </View>
              <Text style={styles.previewName}>{activeAvatar.name}</Text>
              <Text style={styles.previewDesc}>{activeAvatar.description}</Text>
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.categoryTabs}>
            {AVATAR_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Avatars Grid Scroll */}
          <ScrollView
            style={styles.gridScroll}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredAvatars.map((avatar) => {
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <TouchableOpacity
                  key={avatar.id}
                  onPress={() => setSelectedAvatarId(avatar.id)}
                  style={[styles.avatarCard, isSelected && styles.avatarCardSelected]}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarImgWrapper}>
                    <Image source={{ uri: avatar.url }} style={styles.avatarImage} />
                    {isSelected && (
                      <View style={styles.selectedCheckBadge}>
                        <Check size={12} color="#ffffff" />
                      </View>
                    )}
                    <View style={styles.emojiTag}>
                      <Text style={{ fontSize: 12 }}>{avatar.emoji}</Text>
                    </View>
                  </View>

                  <Text style={[styles.avatarNameText, isSelected && styles.avatarNameTextActive]}>
                    {avatar.name}
                  </Text>
                  <Text style={styles.avatarRoleText}>{avatar.badge}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleConfirm} style={styles.saveBtn} activeOpacity={0.8}>
              <Check size={16} color="#0f172a" />
              <Text style={styles.saveBtnText}>Apply 3D Avatar</Text>
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
    backgroundColor: 'rgba(5, 10, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderWidth: 2,
    borderColor: '#d97706',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.3)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#475569',
  },
  activePreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  previewImageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fde047',
    backgroundColor: '#1e293b',
  },
  previewEmojiBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 2,
  },
  previewInfo: {
    flex: 1,
    gap: 2,
  },
  previewBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  previewBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fde047',
    textTransform: 'uppercase',
  },
  previewName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  previewDesc: {
    fontSize: 10.5,
    color: '#cbd5e1',
    lineHeight: 14,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  categoryTabActive: {
    backgroundColor: '#b45309',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 13,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  categoryLabelActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  gridScroll: {
    maxHeight: 260,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  avatarCard: {
    width: '31%',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  avatarCardSelected: {
    borderColor: '#fde047',
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImgWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#0f172a',
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  emojiTag: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#475569',
  },
  avatarNameText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 2,
  },
  avatarNameTextActive: {
    color: '#fef08a',
    fontWeight: '900',
  },
  avatarRoleText: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.3)',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
});
