import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import {
  Sparkles,
  Check,
  X,
  Plus,
  Crown,
  ChevronDown,
  Edit2,
  Cloud,
  Smartphone,
  Gem,
  LogOut,
  ShieldCheck,
  Mail,
  Building2,
  Globe,
  KeyRound,
  Shield,
  Calendar,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { PIXAR_AVATARS, PixarAvatar, COUNTRIES, AVATAR_CATEGORIES } from '../../data/avatars';
import { UserProfile } from '../../types';
import { ChangePasswordModal } from '../ChangePasswordModal';

interface OrganizerProfileModalProps {
  visible: boolean;
  user: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const OrganizerProfileModal: React.FC<OrganizerProfileModalProps> = ({
  visible,
  user,
  onUpdateUser,
  onLogout,
  onClose,
}) => {
  const isPlayer = user.role === 'player';
  const defaultInitialName = user.username || (isPlayer ? 'Player' : 'Organizer');

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'female' | 'male' | 'animals' | 'objects' | 'special'>('all');
  const [selectedCountry, setSelectedCountry] = useState(user.country || 'India');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>(
    user.avatarUrl || PIXAR_AVATARS[0].url
  );

  const [organizerName, setOrganizerName] = useState(defaultInitialName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(defaultInitialName);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [saveBannerMsg, setSaveBannerMsg] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    if (visible) {
      if (user.avatarUrl) setCurrentAvatarUrl(user.avatarUrl);
      if (user.username) {
        setOrganizerName(user.username);
        setNameInput(user.username);
      }
      if (user.country) setSelectedCountry(user.country);
    }
  }, [visible, user.avatarUrl, user.username, user.country]);

  const currentCountryObj =
    COUNTRIES.find((c) => c.name.toLowerCase() === selectedCountry.toLowerCase()) || COUNTRIES[0];

  const filteredAvatars = PIXAR_AVATARS.filter((a) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'female') return a.gender === 'female' || a.category === 'female';
    if (selectedCategory === 'male') return a.gender === 'male' || a.category === 'male';
    if (selectedCategory === 'animals') return a.category === 'animals';
    if (selectedCategory === 'objects') return a.category === 'objects';
    if (selectedCategory === 'special') return a.gender === 'special' || a.category === 'animals' || a.category === 'objects';
    return true;
  });

  const handleSelectAvatar = (avatar: PixarAvatar) => {
    setCurrentAvatarUrl(avatar.url);
    if (onUpdateUser) {
      onUpdateUser({ avatarUrl: avatar.url });
    }
    setSaveBannerMsg(`Cartoon Avatar set to ${avatar.name}!`);
    setTimeout(() => setSaveBannerMsg(''), 2200);
  };

  const handleAddCustomAvatar = () => {
    if (customUrlInput.trim()) {
      setCurrentAvatarUrl(customUrlInput.trim());
      if (onUpdateUser) {
        onUpdateUser({ avatarUrl: customUrlInput.trim() });
      }
      setShowCustomUrlInput(false);
      setCustomUrlInput('');
      setSaveBannerMsg('Custom avatar applied successfully!');
      setTimeout(() => setSaveBannerMsg(''), 2200);
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setOrganizerName(trimmed);
      if (onUpdateUser) {
        onUpdateUser({ username: trimmed });
      }
      setIsEditingName(false);
      setSaveBannerMsg('Organizer name updated!');
      setTimeout(() => setSaveBannerMsg(''), 2200);
    }
  };

  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setShowCountryDropdown(false);
    if (onUpdateUser) {
      onUpdateUser({ country: countryName });
    }
    setSaveBannerMsg(`Country updated to ${countryName}!`);
    setTimeout(() => setSaveBannerMsg(''), 2200);
  };

  const handleContinue = () => {
    if (nameInput.trim() && nameInput.trim() !== organizerName) {
      handleSaveName();
    }
    onClose();
  };

  const activeAvatarObj = PIXAR_AVATARS.find((a) => a.url === currentAvatarUrl);

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {/* Close X button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#ffffff" />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* 1. TOP NOTICE (Matching Image) */}
              <Text style={styles.topNoticeText}>
                *Your country name & Flag will be shown to other players when you play online multiplayer
              </Text>

              {/* 2. COUNTRY SELECTOR BAR (Matching Image) */}
              <View style={styles.countrySelectorWrapper}>
                <TouchableOpacity
                  onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                  style={styles.countryBarBtn}
                  activeOpacity={0.8}
                >
                  <View style={styles.countryFlagRow}>
                    <Text style={styles.countryFlagEmoji}>{currentCountryObj.flag}</Text>
                    <Text style={styles.countryNameText}>{currentCountryObj.name}</Text>
                  </View>
                  <ChevronDown size={20} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Country dropdown menu */}
                {showCountryDropdown && (
                  <View style={styles.countryDropdownList}>
                    <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={true}>
                      {COUNTRIES.map((c) => (
                        <TouchableOpacity
                          key={c.code}
                          onPress={() => handleSelectCountry(c.name)}
                          style={[
                            styles.countryOptionRow,
                            c.name === selectedCountry && styles.countryOptionSelected,
                          ]}
                        >
                          <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                          <Text
                            style={[
                              styles.countryOptionText,
                              c.name === selectedCountry && styles.countryOptionTextActive,
                            ]}
                          >
                            {c.name}
                          </Text>
                          {c.name === selectedCountry && <Check size={14} color="#f59e0b" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 3. PROFILE PREVIEW & EDITABLE NAME BOX (Matching Image) */}
              <View style={styles.profileIdentityRow}>
                {/* Big Square Cartoon Avatar Frame */}
                <View style={styles.avatarBigSquareFrame}>
                  <Image source={{ uri: currentAvatarUrl }} style={styles.avatarBigImage} />
                  <View style={styles.avatarCrownBadge}>
                    <Crown size={12} color="#0f172a" />
                  </View>
                </View>

                {/* Dashed Editable Name Box */}
                <View style={styles.nameSectionContainer}>
                  {isEditingName ? (
                    <View style={styles.dashedNameEditBox}>
                      <TextInput
                        value={nameInput}
                        onChangeText={setNameInput}
                        placeholder="Enter Name"
                        placeholderTextColor="#94a3b8"
                        style={styles.nameTextInput}
                        autoFocus
                        onSubmitEditing={handleSaveName}
                      />
                      <TouchableOpacity
                        onPress={handleSaveName}
                        style={styles.saveNameMiniBtn}
                        activeOpacity={0.7}
                      >
                        <Check size={14} color="#0f172a" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setIsEditingName(true)}
                      style={styles.dashedNameBox}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.organizerNameTitle} numberOfLines={1}>
                        {organizerName}
                      </Text>
                      <Edit2 size={13} color="#f59e0b" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.roleSubtext}>
                    {isPlayer ? 'Campus Explorer' : 'Game Master'} • {user.campusName || user.campusType || 'Campus HQ'}
                  </Text>
                  {activeAvatarObj && (
                    <Text style={styles.avatarBadgePersona}>
                      {activeAvatarObj.emoji} {activeAvatarObj.name}
                    </Text>
                  )}
                </View>
              </View>

              {/* 4. GENDER & CATEGORY SELECTOR CIRCLES (Matching Image) */}
              <View style={styles.categoryCirclesRow}>
                {/* Male Circle */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory('male')}
                  style={[
                    styles.categoryCircleBtn,
                    { backgroundColor: '#0284c7' },
                    selectedCategory === 'male' && styles.categoryCircleActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCircleEmoji}>👦</Text>
                </TouchableOpacity>

                {/* Female Circle */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory('female')}
                  style={[
                    styles.categoryCircleBtn,
                    { backgroundColor: '#ec4899' },
                    selectedCategory === 'female' && styles.categoryCircleActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCircleEmoji}>👧</Text>
                </TouchableOpacity>

                {/* Animals / Special Circle */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory('animals')}
                  style={[
                    styles.categoryCircleBtn,
                    { backgroundColor: '#eab308' },
                    selectedCategory === 'animals' && styles.categoryCircleActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCircleEmoji}>🦊</Text>
                </TouchableOpacity>

                {/* Objects Circle */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory('objects')}
                  style={[
                    styles.categoryCircleBtn,
                    { backgroundColor: '#10b981' },
                    selectedCategory === 'objects' && styles.categoryCircleActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCircleEmoji}>💎</Text>
                </TouchableOpacity>

                {/* All / Checkmark Circle */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory('all')}
                  style={[
                    styles.categoryCircleBtn,
                    { backgroundColor: '#6366f1' },
                    selectedCategory === 'all' && styles.categoryCircleActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#ffffff" strokeWidth={3} />
                </TouchableOpacity>
              </View>

              {/* Custom URL Input Box (if toggled) */}
              {showCustomUrlInput && (
                <View style={styles.customUrlInputContainer}>
                  <TextInput
                    value={customUrlInput}
                    onChangeText={setCustomUrlInput}
                    placeholder="Paste Cartoon/Pixar image URL..."
                    placeholderTextColor="#94a3b8"
                    style={styles.customUrlInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={handleAddCustomAvatar}
                    style={styles.applyUrlBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyUrlBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Save Feedback Banner */}
              {Boolean(saveBannerMsg) && (
                <View style={styles.saveNotificationPill}>
                  <CheckCircle size={13} color="#10b981" />
                  <Text style={styles.saveNotificationText}>{saveBannerMsg}</Text>
                </View>
              )}

              {/* 5. MAIN "SELECT PROFILE PICTURE" CARD (Matching Reference Image) */}
              <View style={styles.avatarSelectionContainer}>
                {/* Header Title */}
                <View style={styles.avatarSelectionHeader}>
                  <Text style={styles.avatarSelectionTitle}>SELECT PROFILE PICTURE</Text>
                  <Text style={styles.avatarSelectionSubtitle}>
                    100% Pixar & Cartoon Avatars • Male, Female, Animals & Relics
                  </Text>
                </View>

                {/* Avatars Grid */}
                <View style={styles.avatarGrid}>
                  {/* Red '+' Add Custom Photo Button */}
                  <TouchableOpacity
                    onPress={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    style={styles.addCustomAvatarCard}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addIconBg}>
                      <Plus size={26} color="#ffffff" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>

                  {/* Pixar / Cartoon Avatar List */}
                  {filteredAvatars.map((avatar) => {
                    const isSelected = avatar.url === currentAvatarUrl;
                    return (
                      <TouchableOpacity
                        key={avatar.id}
                        onPress={() => handleSelectAvatar(avatar)}
                        style={[
                          styles.avatarItemCard,
                          isSelected && styles.avatarItemCardSelected,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: avatar.url }} style={styles.avatarItemImage} />

                        {isSelected && (
                          <View style={styles.avatarItemCheckOverlay}>
                            <Check size={11} color="#0f172a" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 6. LOGIN INFORMATION & SECURITY SECTION (From Registration / Login) */}
              <View style={styles.loginInfoCard}>
                <View style={styles.sectionHeaderRow}>
                  <ShieldCheck size={14} color="#fbbf24" />
                  <Text style={styles.loginInfoSectionTitle}>LOGIN & ACCOUNT CREDENTIALS</Text>
                </View>

                {/* Email (Provided at Login) */}
                <View style={styles.loginInfoRow}>
                  <View style={[styles.loginInfoIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Mail size={14} color="#60a5fa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loginInfoLabel}>LOGIN EMAIL</Text>
                    <Text style={styles.loginInfoValue}>
                      {user.email || (isPlayer ? 'player@campusquest.edu' : 'organizer@campusquest.edu')}
                    </Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Check size={10} color="#34d399" strokeWidth={3} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                <View style={styles.loginInfoDivider} />

                {/* Campus Name & Type (Provided at Login) */}
                <View style={styles.loginInfoRow}>
                  <View style={[styles.loginInfoIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Building2 size={14} color="#34d399" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loginInfoLabel}>CAMPUS / ORGANIZATION</Text>
                    <Text style={styles.loginInfoValue}>
                      {user.campusName || user.campusType || 'Main Campus'} {user.campusType ? `(${user.campusType})` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.loginInfoDivider} />

                {/* Country (Provided at Login) */}
                <View style={styles.loginInfoRow}>
                  <View style={[styles.loginInfoIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Globe size={14} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loginInfoLabel}>COUNTRY</Text>
                    <Text style={styles.loginInfoValue}>{selectedCountry}</Text>
                  </View>
                </View>

                <View style={styles.loginInfoDivider} />

                {/* Account Status & Joined Date (Provided at Login) */}
                <View style={styles.loginInfoRow}>
                  <View style={[styles.loginInfoIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                    <Calendar size={14} color="#818cf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.loginInfoLabel}>REGISTRATION DATE & STATUS</Text>
                    <Text style={styles.loginInfoValue}>
                      Joined {user.joinedDate || 'September 2026'} • {isPlayer ? 'Active Campus Explorer' : 'Active Game Master'}
                    </Text>
                  </View>
                </View>

                <View style={styles.loginInfoDivider} />

                {/* OPTION TO CHANGE PASSWORD */}
                <TouchableOpacity
                  onPress={() => setShowChangePasswordModal(true)}
                  style={styles.changePasswordCardBtn}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={styles.keyIconCircle}>
                      <KeyRound size={15} color="#0f172a" strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.changePasswordTitle}>Change Password</Text>
                      <Text style={styles.changePasswordSubtitle}>
                        Update login password & security credentials
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#fbbf24" />
                </TouchableOpacity>
              </View>


              {/* 8. BIG "CONTINUE" BUTTON (Matching Reference Image) */}
              <TouchableOpacity
                onPress={handleContinue}
                style={styles.continueBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userEmail={user.email}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '94%',
    backgroundColor: '#0c1527',
    borderWidth: 2.5,
    borderColor: '#0284c7',
    borderRadius: 24,
    padding: 14,
    position: 'relative',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 16,
    gap: 12,
  },
  topNoticeText: {
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 16,
    fontWeight: '600',
  },
  countrySelectorWrapper: {
    position: 'relative',
    zIndex: 40,
  },
  countryBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#334155',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  countryFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryFlagEmoji: {
    fontSize: 22,
  },
  countryNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  countryDropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 6,
    zIndex: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  countryOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  countryOptionSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  countryOptionText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '700',
    flex: 1,
  },
  countryOptionTextActive: {
    color: '#fde047',
    fontWeight: '900',
  },
  profileIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
  },
  avatarBigSquareFrame: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a',
    position: 'relative',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  avatarBigImage: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    backgroundColor: '#1e293b',
  },
  avatarCrownBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  nameSectionContainer: {
    flex: 1,
    gap: 3,
  },
  dashedNameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#fbbf24',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dashedNameEditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#fbbf24',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  nameTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    padding: 0,
  },
  saveNameMiniBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 6,
    padding: 4,
  },
  organizerNameTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0f172a',
    flex: 1,
  },
  roleSubtext: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  avatarBadgePersona: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  categoryCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 4,
  },
  categoryCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCircleActive: {
    borderColor: '#fde047',
    borderWidth: 3,
    transform: [{ scale: 1.12 }],
    shadowColor: '#fde047',
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  categoryCircleEmoji: {
    fontSize: 17,
  },
  customUrlInputContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    padding: 6,
  },
  customUrlInput: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  applyUrlBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyUrlBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  saveNotificationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 4,
  },
  saveNotificationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },
  avatarSelectionContainer: {
    backgroundColor: '#070f20',
    borderWidth: 2.5,
    borderColor: '#0284c7',
    borderRadius: 18,
    padding: 10,
    gap: 10,
  },
  avatarSelectionHeader: {
    alignItems: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  avatarSelectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 0.8,
  },
  avatarSelectionSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    maxHeight: 240,
    overflow: 'hidden',
  },
  addCustomAvatarCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarItemCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarItemCardSelected: {
    borderColor: '#fde047',
    borderWidth: 3,
    shadowColor: '#fde047',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  avatarItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  avatarItemCheckOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fde047',
    borderRadius: 6,
    padding: 2,
  },
  gameUtilityCard: {
    backgroundColor: '#070f20',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 14,
    padding: 8,
  },
  utilityActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  utilityItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  utilityItemText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  gemBonusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  gemBonusText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#60a5fa',
  },
  loginInfoCard: {
    backgroundColor: '#070f20',
    borderWidth: 2,
    borderColor: '#0284c7',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  loginInfoSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  loginInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  loginInfoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginInfoLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.4,
  },
  loginInfoValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#f8fafc',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34d399',
  },
  loginInfoDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
  changePasswordCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  keyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#fde047',
  },
  changePasswordSubtitle: {
    fontSize: 9.5,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  signOutRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  signOutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f87171',
  },
  continueBtn: {
    backgroundColor: '#0284c7',
    borderWidth: 2.5,
    borderColor: '#fde047',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

export const ProfileModal = OrganizerProfileModal;
