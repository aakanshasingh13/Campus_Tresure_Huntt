import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Alert,
  Image,
} from 'react-native';
import {
  User as UserIcon,
  Globe,
  Mail,
  Trash2,
  FileText,
  LogOut,
  X,
  ChevronRight,
  Check,
  AlertTriangle,
  Send,
  ShieldCheck,
  HelpCircle,
  Phone,
  Building2,
  CheckCircle2,
  Lock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  KeyRound,
  Database,
} from 'lucide-react-native';
import { UserProfile } from '../types';
import { AvatarPickerModal } from './AvatarPickerModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SupabaseBackendModal } from './SupabaseBackendModal';
import { PIXAR_AVATARS, PixarAvatar } from '../data/avatars';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  onDeleteAccount?: () => void;
}

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dial: '+91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dial: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dial: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dial: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dial: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dial: '+33' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dial: '+65' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dial: '+971' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dial: '+81' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dial: '+55' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dial: '+27' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dial: '+64' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dial: '+31' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dial: '+353' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dial: '+46' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dial: '+41' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dial: '+34' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dial: '+39' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dial: '+52' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  user,
  onUpdateUser,
  onLogout,
  onDeleteAccount,
}) => {
  const isOrganizer = user.role === 'organizer';

  // Editable Name State
  const [name, setName] = useState(user.username || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaveSuccess, setNameSaveSuccess] = useState(false);

  // Editable Phone State
  const [phone, setPhone] = useState(user.phone || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneFeedback, setPhoneFeedback] = useState('');

  // Country Selection State
  const [country, setCountry] = useState(user.country || 'India');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Sub-Modals
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Contact Form State
  const [contactSubject, setContactSubject] = useState('General Support');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Delete Account Confirmation State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Save Name
  const handleSaveName = () => {
    if (!name.trim()) return;
    if (onUpdateUser) {
      onUpdateUser({ username: name.trim() });
    }
    setIsEditingName(false);
    setNameSaveSuccess(true);
    setTimeout(() => setNameSaveSuccess(false), 2500);
  };

  // Save Phone
  const handleSavePhone = () => {
    if (onUpdateUser) {
      onUpdateUser({ phone: phone.trim() });
    }
    setIsEditingPhone(false);
    setPhoneFeedback('Phone number updated!');
    setTimeout(() => setPhoneFeedback(''), 2500);
  };

  // Remove Phone
  const handleRemovePhone = () => {
    if (onUpdateUser) {
      onUpdateUser({ phone: '' });
    }
    setPhone('');
    setIsEditingPhone(false);
    setPhoneFeedback('Phone number removed!');
    setTimeout(() => setPhoneFeedback(''), 2500);
  };

  // Avatar Selection
  const handleSelectAvatar = (avatar: PixarAvatar) => {
    if (onUpdateUser) {
      onUpdateUser({ avatarUrl: avatar.url });
    }
  };

  // Select Country
  const handleSelectCountry = (selectedCountryName: string) => {
    setCountry(selectedCountryName);
    if (onUpdateUser) {
      onUpdateUser({ country: selectedCountryName });
    }
    setShowCountryPicker(false);
  };

  // Submit Contact Us
  const handleSendContact = () => {
    if (!contactMessage.trim()) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactMessage('');
      setShowContactModal(false);
    }, 2000);
  };

  // Delete Account
  const handleConfirmDelete = () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      onClose();
      if (onDeleteAccount) {
        onDeleteAccount();
      } else {
        onLogout();
      }
    }, 1200);
  };

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountryObj = COUNTRIES.find((c) => c.name === country) || COUNTRIES[0];
  const currentAvatarObj = PIXAR_AVATARS.find((a) => a.url === user.avatarUrl) || null;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <ShieldCheck size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Account & Settings</Text>
                <Text style={styles.headerSubtitle}>
                  {isOrganizer ? 'Organizer & HQ Preferences' : 'Player Account & App Preferences'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Feedback Notifications */}
            {nameSaveSuccess && (
              <View style={styles.successBar}>
                <CheckCircle2 size={15} color="#16a34a" />
                <Text style={styles.successBarText}>Name updated successfully!</Text>
              </View>
            )}

            {Boolean(phoneFeedback) && (
              <View style={styles.successBar}>
                <CheckCircle2 size={15} color="#16a34a" />
                <Text style={styles.successBarText}>{phoneFeedback}</Text>
              </View>
            )}

            {/* SECTION: 3D PIXAR AVATAR */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>3D PIXAR AVATAR</Text>
            </View>

            <View style={styles.settingsGroup}>
              <TouchableOpacity
                onPress={() => setShowAvatarPicker(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.avatarSettingWrapper}>
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={styles.avatarSettingImg} />
                    ) : (
                      <View style={[styles.settingIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.2)' }]}>
                        <Sparkles size={16} color="#fbbf24" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Persona & 3D Character</Text>
                    <Text style={styles.settingSubtext}>
                      {currentAvatarObj
                        ? `${currentAvatarObj.emoji} ${currentAvatarObj.name} (${currentAvatarObj.badge})`
                        : 'Choose from Pixar style male, female, animals & objects'}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingActionRow}>
                  <Text style={styles.changeText}>Choose</Text>
                  <ChevronRight size={16} color="#fbbf24" />
                </View>
              </TouchableOpacity>
            </View>

            {/* SECTION 1: ACCOUNT DETAILS (NAME, PHONE, COUNTRY) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACCOUNT & LOGIN DETAILS</Text>
            </View>

            <View style={styles.settingsGroup}>
              {/* Name Setting */}
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                    <UserIcon size={16} color="#818cf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>
                      {isOrganizer ? 'Organizer Name' : 'Player Name'}
                    </Text>
                    {isEditingName ? (
                      <View style={styles.inlineEditRow}>
                        <TextInput
                          value={name}
                          onChangeText={setName}
                          placeholder="Enter name"
                          placeholderTextColor="#94a3b8"
                          style={styles.inlineInput}
                          autoFocus
                        />
                        <TouchableOpacity onPress={handleSaveName} style={styles.inlineSaveBtn}>
                          <Check size={14} color="#0f172a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setName(user.username || '');
                            setIsEditingName(false);
                          }}
                          style={styles.inlineCancelBtn}
                        >
                          <X size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.settingValue}>{name || user.username || 'Not Specified'}</Text>
                    )}
                  </View>
                </View>

                {!isEditingName && (
                  <TouchableOpacity
                    onPress={() => setIsEditingName(true)}
                    style={styles.editBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.divider} />

              {/* Login Email (Read Only Display) */}
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Mail size={16} color="#60a5fa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Login Email</Text>
                    <Text style={styles.settingValue}>{user.email || 'None'}</Text>
                  </View>
                </View>
                <View style={styles.verifiedTag}>
                  <Check size={10} color="#34d399" />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Phone Number (With Edit and Remove Options) */}
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                    <Phone size={16} color="#f472b6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Phone Number</Text>
                    {isEditingPhone ? (
                      <View style={styles.inlineEditRow}>
                        <TextInput
                          value={phone}
                          onChangeText={setPhone}
                          placeholder="+1 555-0192"
                          placeholderTextColor="#94a3b8"
                          style={styles.inlineInput}
                          autoFocus
                        />
                        <TouchableOpacity onPress={handleSavePhone} style={styles.inlineSaveBtn}>
                          <Check size={14} color="#0f172a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setIsEditingPhone(false)}
                          style={styles.inlineCancelBtn}
                        >
                          <X size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.settingValue}>{user.phone || 'No phone number'}</Text>
                    )}
                  </View>
                </View>

                {!isEditingPhone && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {Boolean(user.phone) && (
                      <TouchableOpacity
                        onPress={handleRemovePhone}
                        style={styles.removePhoneBtn}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={12} color="#f87171" />
                        <Text style={styles.removePhoneBtnText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        setPhone(user.phone || '');
                        setIsEditingPhone(true);
                      }}
                      style={styles.editBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editBtnText}>{user.phone ? 'Edit' : '+ Add'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Country Setting */}
              <TouchableOpacity
                onPress={() => setShowCountryPicker(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Globe size={16} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Country</Text>
                    <View style={styles.countryValueRow}>
                      <Text style={styles.countryFlagText}>{selectedCountryObj.flag}</Text>
                      <Text style={styles.settingValue}>{country}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.settingActionRow}>
                  <Text style={styles.changeText}>Change</Text>
                  <ChevronRight size={16} color="#fbbf24" />
                </View>
              </TouchableOpacity>
            </View>

            {/* SECTION 2: SECURITY & PASSWORD */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SECURITY & ACCESS</Text>
            </View>

            <View style={styles.settingsGroup}>
              {/* Change Password Button */}
              <TouchableOpacity
                onPress={() => setShowChangePasswordModal(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.2)' }]}>
                    <KeyRound size={16} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Change Password</Text>
                    <Text style={styles.settingSubtext}>Update your login password and security key</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#f59e0b" />
              </TouchableOpacity>
            </View>

            {/* SECTION 3: SUPPORT & LEGAL */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SUPPORT & LEGAL</Text>
            </View>

            <View style={styles.settingsGroup}>
              {/* Contact Us */}
              <TouchableOpacity
                onPress={() => setShowContactModal(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
                    <Mail size={16} color="#f472b6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Contact Us & Help Center</Text>
                    <Text style={styles.settingSubtext}>Get support or report campus hunt issues</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Terms of Service */}
              <TouchableOpacity
                onPress={() => setShowTermsModal(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <FileText size={16} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Terms of Service</Text>
                    <Text style={styles.settingSubtext}>Fair play rules, safety & privacy terms</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Supabase Backend & Database */}
              <TouchableOpacity
                onPress={() => setShowSupabaseModal(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Database size={16} color="#34d399" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.settingLabel, { color: '#34d399' }]}>Supabase Backend</Text>
                      <View style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#34d399' }}>14 SERVICES</Text>
                      </View>
                    </View>
                    <Text style={styles.settingSubtext}>Database tables, RLS rules, and SQL schema</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#34d399" />
              </TouchableOpacity>
            </View>

            {/* SECTION 4: DANGER ZONE & SESSION ACTIONS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>
            </View>

            <View style={styles.settingsGroup}>
              {/* Delete Account */}
              <TouchableOpacity
                onPress={() => setShowDeleteModal(true)}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Trash2 size={16} color="#f87171" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: '#f87171' }]}>Delete my Account</Text>
                    <Text style={styles.settingSubtext}>Permanently delete all data, scores and hunts</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#fca5a5" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Sign Out */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onLogout();
                }}
                style={styles.settingItemClickable}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.2)' }]}>
                    <LogOut size={16} color="#cbd5e1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Sign Out</Text>
                    <Text style={styles.settingSubtext}>Log out from this device session</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Bottom Close Button */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Close Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3D Pixar Avatar Picker Modal */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatarUrl={user.avatarUrl}
        onSelectAvatar={handleSelectAvatar}
        onClose={() => setShowAvatarPicker(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        userEmail={user.email}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Supabase Backend & Database Modal */}
      <SupabaseBackendModal
        visible={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />


      {/* ========================================================================= */}
      {/* SUB-MODAL 1: COUNTRY PICKER                                              */}
      {/* ========================================================================= */}
      {showCountryPicker && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowCountryPicker(false)}>
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalCard}>
              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Globe size={18} color="#16a34a" />
                  <Text style={styles.subModalTitle}>Select Your Country</Text>
                </View>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={styles.closeBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.countrySearchBox}>
                <TextInput
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Search countries..."
                  placeholderTextColor="#94a3b8"
                  style={styles.countrySearchInput}
                />
              </View>

              <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                {filteredCountries.map((c) => {
                  const isSelected = c.name === country;
                  return (
                    <TouchableOpacity
                      key={c.code}
                      onPress={() => handleSelectCountry(c.name)}
                      style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontSize: 20 }}>{c.flag}</Text>
                        <Text style={[styles.countryItemName, isSelected && { fontWeight: 'bold', color: '#16a34a' }]}>
                          {c.name}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color="#16a34a" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 2: CONTACT US                                                   */}
      {/* ========================================================================= */}
      {showContactModal && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowContactModal(false)}>
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalCard}>
              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Mail size={18} color="#db2777" />
                  <Text style={styles.subModalTitle}>Contact Us & Support</Text>
                </View>
                <TouchableOpacity onPress={() => setShowContactModal(false)} style={styles.closeBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {contactSubmitted ? (
                  <View style={styles.contactSuccessBox}>
                    <CheckCircle2 size={36} color="#16a34a" />
                    <Text style={styles.contactSuccessTitle}>Message Sent!</Text>
                    <Text style={styles.contactSuccessSub}>
                      Our campus support team will respond to {user.email || 'your registered email'} within 2-4 hours.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {/* Quick Direct Support Info */}
                    <View style={styles.directSupportBox}>
                      <View style={styles.supportChip}>
                        <Mail size={12} color="#4f46e5" />
                        <Text style={styles.supportChipText}>support@campustreasure.app</Text>
                      </View>
                      <View style={styles.supportChip}>
                        <Phone size={12} color="#059669" />
                        <Text style={styles.supportChipText}>+1 (800) 428-HUNT</Text>
                      </View>
                    </View>

                    {/* Inquiry Topic */}
                    <View>
                      <Text style={styles.inputLabel}>Inquiry Topic</Text>
                      <View style={styles.topicRow}>
                        {['General Support', 'Bug / GPS Issue', 'Event Organizer Query', 'Payment / Fee'].map((topic) => (
                          <TouchableOpacity
                            key={topic}
                            onPress={() => setContactSubject(topic)}
                            style={[
                              styles.topicChip,
                              contactSubject === topic && styles.topicChipSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.topicChipText,
                                contactSubject === topic && styles.topicChipTextSelected,
                              ]}
                            >
                              {topic}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Message Box */}
                    <View>
                      <Text style={styles.inputLabel}>Your Message / Issue Details</Text>
                      <TextInput
                        value={contactMessage}
                        onChangeText={setContactMessage}
                        placeholder="Describe your question, bug or request in detail..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        style={styles.messageInput}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={handleSendContact}
                      disabled={!contactMessage.trim()}
                      style={[styles.sendBtn, !contactMessage.trim() && styles.sendBtnDisabled]}
                    >
                      <Send size={15} color="#ffffff" />
                      <Text style={styles.sendBtnText}>Submit Message</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 3: TERMS OF SERVICE                                             */}
      {/* ========================================================================= */}
      {showTermsModal && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowTermsModal(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalCard, { maxWidth: 520, maxHeight: '85%' }]}>
              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#d97706" />
                  <Text style={styles.subModalTitle}>Terms of Service & Rules</Text>
                </View>
                <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.closeBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ paddingVertical: 4 }}>
                <View style={styles.termsBlock}>
                  <Text style={styles.termsHeading}>1. Campus Safety & Code of Conduct</Text>
                  <Text style={styles.termsText}>
                    All players and organizers must prioritize personal safety and adhere to campus regulations. Trespassing in restricted laboratory areas, roof access points, construction zones, or private faculty offices is strictly prohibited during any hunt.
                  </Text>
                </View>

                <View style={styles.termsBlock}>
                  <Text style={styles.termsHeading}>2. Fair Play & Anti-Cheating</Text>
                  <Text style={styles.termsText}>
                    Clues and GPS secret locations are intended for team discovery. Sharing direct solutions on public communication forums or tampering with QR codes physically deployed on campus will result in immediate team disqualification.
                  </Text>
                </View>

                <View style={styles.termsBlock}>
                  <Text style={styles.termsHeading}>3. Organizer Responsibilities</Text>
                  <Text style={styles.termsText}>
                    Organizers are responsible for placing clues in secure, publicly accessible campus zones. If paid registration fees are collected via UPI or cash, the organizer remains accountable for timely prize distribution as listed on the event page.
                  </Text>
                </View>

                <View style={styles.termsBlock}>
                  <Text style={styles.termsHeading}>4. Data Privacy & Account Rights</Text>
                  <Text style={styles.termsText}>
                    We only store credentials and hunt participation data necessary for leaderboard rankings and event coordination. You retain full rights to delete your account and personal identifiers at any time via the Settings menu.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.termsCloseBtn}>
                <Text style={styles.termsCloseBtnText}>I Understand & Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL 4: DELETE MY ACCOUNT CONFIRMATION                               */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
          <View style={styles.subModalOverlay}>
            <View style={[styles.subModalCard, { borderColor: '#fca5a5' }]}>
              <View style={styles.subModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#ef4444" />
                  <Text style={[styles.subModalTitle, { color: '#dc2626' }]}>Delete Account</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.closeBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12, paddingVertical: 6 }}>
                <View style={styles.deleteWarningBox}>
                  <Text style={styles.deleteWarningTitle}>⚠️ This action is permanent and irreversible!</Text>
                  <Text style={styles.deleteWarningText}>
                    Deleting your account will immediately remove:
                    {'\n'}• Your {isOrganizer ? 'organizer profile & created hunts' : 'player profile & game progress'}
                    {'\n'}• Leaderboard rankings, earned trophies and badges
                    {'\n'}• Clue records and active team associations
                  </Text>
                </View>

                <Text style={styles.deleteInstruction}>
                  To confirm, type <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>DELETE</Text> below:
                </Text>

                <TextInput
                  value={deleteConfirmText}
                  onChangeText={setDeleteConfirmText}
                  placeholder='Type "DELETE"'
                  placeholderTextColor="#94a3b8"
                  style={styles.deleteInput}
                  autoCapitalize="characters"
                />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => setShowDeleteModal(false)}
                    style={styles.deleteCancelBtn}
                  >
                    <Text style={styles.deleteCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmDelete}
                    disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || isDeleting}
                    style={[
                      styles.deleteConfirmBtn,
                      deleteConfirmText.toUpperCase() !== 'DELETE' && styles.deleteConfirmBtnDisabled,
                    ]}
                  >
                    <Trash2 size={14} color="#ffffff" />
                    <Text style={styles.deleteConfirmBtnText}>
                      {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 100,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  contentScroll: {
    marginBottom: 12,
  },
  successBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  successBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6366f1',
    letterSpacing: 0.6,
  },
  settingsGroup: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
  },
  settingItemClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    gap: 10,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSettingWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSettingImg: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  removePhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  removePhoneBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  settingValue: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  countryValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  countryFlagText: {
    fontSize: 15,
  },
  settingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  inlineEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  inlineInput: {
    flex: 1,
    height: 34,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  inlineSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  inlineSaveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  inlineCancelBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  doneBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  /* Sub-Modal Styles */
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 150,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subModalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  countrySearchBox: {
    marginBottom: 10,
  },
  countrySearchInput: {
    height: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  countryItemSelected: {
    backgroundColor: '#f0fdf4',
  },
  countryItemName: {
    fontSize: 13,
    color: '#334155',
  },
  directSupportBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    borderRadius: 12,
  },
  supportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  supportChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topicChipSelected: {
    backgroundColor: '#fdf2f8',
    borderColor: '#f472b6',
  },
  topicChipText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  topicChipTextSelected: {
    color: '#db2777',
    fontWeight: 'bold',
  },
  messageInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    height: 90,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#db2777',
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contactSuccessBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  contactSuccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  contactSuccessSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  termsBlock: {
    marginBottom: 12,
  },
  termsHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  termsCloseBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  termsCloseBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deleteWarningBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  deleteWarningTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  deleteWarningText: {
    fontSize: 11,
    color: '#991b1b',
    lineHeight: 16,
  },
  deleteInstruction: {
    fontSize: 12,
    color: '#475569',
  },
  deleteInput: {
    height: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  deleteCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  deleteConfirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteConfirmBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  deleteConfirmBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
