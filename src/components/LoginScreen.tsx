import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Award,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  KeyRound,
  Phone,
} from 'lucide-react-native';
import { CampusType, Role, UserProfile } from '../types';
import { INITIAL_USER } from '../data/mockData';
import { CampusBackground } from './CampusBackground';
import {
  registerUserInSupabase,
  loginUserWithSupabase,
  getRememberedUser,
} from '../lib/supabase';
import { TreasureChestIcon } from './TreasureChestIcon';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

interface CampusOptionMeta {
  type: CampusType;
  title: string;
  emoji: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
}

const CAMPUS_OPTIONS: CampusOptionMeta[] = [
  {
    type: 'College Campus',
    title: 'College Campus',
    emoji: '🎓',
    badgeColor: '#4f46e5',
    badgeBg: '#eef2ff',
    borderColor: '#818cf8',
  },
  {
    type: 'Office Campus',
    title: 'Office Campus',
    emoji: '🏢',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5',
    borderColor: '#34d399',
  },
  {
    type: 'Other',
    title: 'Other',
    emoji: '📍',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    borderColor: '#fbbf24',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email');
  const [role, setRole] = useState<Role>('player');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [campusType, setCampusType] = useState<CampusType>('College Campus');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [rememberedUser, setRememberedUser] = useState<UserProfile | null>(null);

  // Field touch tracking for responsive inline validation
  const [touched, setTouched] = useState<{
    username?: boolean;
    email?: boolean;
    phone?: boolean;
    password?: boolean;
  }>({});

  // Validation functions
  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Please provide an email address';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed.includes('@') || !emailRegex.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validatePhone = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Please provide a phone number';
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      return 'Phone number must have at least 10 digits';
    }
    return null;
  };

  const validateLoginIdentifier = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Please enter your registered email or username';
    }
    const hasAt = trimmed.includes('@');
    if (hasAt) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address format';
      }
      return null;
    }
    // Username
    if (trimmed.length < 3) {
      return 'Must be at least 3 characters';
    }
    return null;
  };

  const validateUsername = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Username is required';
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    return null;
  };

  const validatePassword = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Password is required';
    if (trimmed.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  // Field errors
  const emailError = touched.email
    ? (authMode === 'login' ? validateLoginIdentifier(email) : validateEmail(email))
    : null;
  const usernameError = touched.username && authMode === 'register' ? validateUsername(username) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  const isEmailValid = email.trim().length > 0 && (authMode === 'login' ? validateLoginIdentifier(email) === null : validateEmail(email) === null);
  const isUsernameValid = username.trim().length >= 3 && validateUsername(username) === null;
  const isPasswordValid = password.trim().length >= 6 && validatePassword(password) === null;

  // Check for remembered registered user on mount
  useEffect(() => {
    const existing = getRememberedUser();
    if (existing) {
      setRememberedUser(existing);
      if (existing.email) setEmail(existing.email);
      if (existing.phone) setPhone(existing.phone);
      if (existing.username) setUsername(existing.username);
      if (existing.role) setRole(existing.role);
      if (existing.campusType) setCampusType(existing.campusType);
    }
  }, []);

  const selectedCampusMeta =
    CAMPUS_OPTIONS.find((c) => c.type === campusType) || CAMPUS_OPTIONS[0];

  // Quick 1-click continue for recognized registered user
  const handleQuickLogin = () => {
    if (rememberedUser) {
      onLoginSuccess(rememberedUser);
    }
  };

  const handleSubmit = async () => {
    if (isSyncing) return;

    // Mark all required fields as touched for immediate visual cues
    setTouched({
      username: true,
      email: true,
      phone: true,
      password: true,
    });
    setErrorMessage(null);
    setSuccessNotice(null);

    const isOrg = role === 'organizer';

    if (authMode === 'login') {
      // STRICT SIGN-IN FLOW: Validates user with Phone Number or Email entered during registration + Password
      const cleanIdentifier = email.trim();
      const cleanPassword = password.trim();

      if (!cleanIdentifier) {
        setErrorMessage('Please enter your registered email or username.');
        return;
      }

      const idErr = validateLoginIdentifier(cleanIdentifier);
      if (idErr) {
        setErrorMessage(idErr);
        return;
      }

      if (!cleanPassword) {
        setErrorMessage('Password is required to log in.');
        return;
      }

      if (cleanPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      setIsSyncing(true);
      try {
        const result = await loginUserWithSupabase(cleanIdentifier, cleanPassword, role);
        if (result.success && result.user) {
          setIsSyncing(false);
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Invalid credentials. Please verify your email and password.');
          setIsSyncing(false);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Login failed. Please check credentials.');
        setIsSyncing(false);
      }
    } else {
      // SECURE REGISTRATION FLOW: Register with Username, Email & Password
      const cleanUsername = username.trim();
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      if (!cleanUsername) {
        setErrorMessage('Username is required for registration.');
        return;
      }

      if (cleanUsername.length < 3) {
        setErrorMessage('Username must be at least 3 characters.');
        return;
      }

      if (!cleanEmail) {
        setErrorMessage('Please provide a valid email address to register.');
        return;
      }
      const eErr = validateEmail(cleanEmail);
      if (eErr) {
        setErrorMessage(eErr);
        return;
      }

      if (!cleanPassword) {
        setErrorMessage('Password is required for registration.');
        return;
      }

      if (cleanPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      setIsSyncing(true);
      try {
        const result = await registerUserInSupabase({
          role,
          username: cleanUsername,
          email: cleanEmail,
          registrationMethod: 'email',
          password: cleanPassword,
          campusLocation: campusType,
        });

        if (result.success && result.user) {
          setIsSyncing(false);
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Registration failed');
          setIsSyncing(false);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Registration error');
        setIsSyncing(false);
      }
    }
  };

  const handleSelectCampus = (option: CampusType) => {
    setCampusType(option);
    setIsDropdownOpen(false);
  };

  return (
    <CampusBackground dimAmount="subtle">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header Area */}
        <View style={styles.headerBox}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>CAMPUS QUEST</Text>
          </View>

          <View style={styles.funBadgePill}>
            <Sparkles size={13} color="#fde047" />
            <Text style={styles.funBadgeText}>COLLEGIATE TREASURE ADVENTURE</Text>
          </View>
        </View>

        {/* Main Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: 420,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <View style={styles.card}>

            {/* Mode Switcher: Log In vs Register */}
            <View style={styles.authModeTabs}>
              <TouchableOpacity
                onPress={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                activeOpacity={0.8}
                style={[
                  styles.authModeTab,
                  authMode === 'login' && styles.authModeTabActive,
                ]}
              >
                <LogIn size={15} color={authMode === 'login' ? '#4338ca' : '#64748b'} />
                <Text
                  style={[
                    styles.authModeTabText,
                    authMode === 'login' && styles.authModeTabTextActive,
                  ]}
                >
                  Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                activeOpacity={0.8}
                style={[
                  styles.authModeTab,
                  authMode === 'register' && styles.authModeTabActive,
                ]}
              >
                <UserPlus size={15} color={authMode === 'register' ? '#4338ca' : '#64748b'} />
                <Text
                  style={[
                    styles.authModeTabText,
                    authMode === 'register' && styles.authModeTabTextActive,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role Switcher */}
            <View style={styles.roleTabsContainer}>
              <TouchableOpacity
                onPress={() => setRole('player')}
                activeOpacity={0.8}
                style={[
                  styles.roleTab,
                  role === 'player' ? styles.roleTabPlayerActive : styles.roleTabInactive,
                ]}
              >
                <Text style={styles.tabEmoji}>🏃‍♂️</Text>
                <Text
                  style={[
                    styles.roleTabText,
                    role === 'player' ? styles.roleTabTextActive : styles.roleTabTextInactive,
                  ]}
                >
                  Player
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('organizer')}
                activeOpacity={0.8}
                style={[
                  styles.roleTab,
                  role === 'organizer' ? styles.roleTabOrgActive : styles.roleTabInactive,
                ]}
              >
                <Text style={styles.tabEmoji}>👑</Text>
                <Text
                  style={[
                    styles.roleTabText,
                    role === 'organizer' ? styles.roleTabTextActive : styles.roleTabTextInactive,
                  ]}
                >
                  Organizer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Success Notice Banner */}
            {successNotice && (
              <View style={styles.successNoticeBox}>
                <CheckCircle2 size={16} color="#34d399" />
                <Text style={styles.successNoticeText}>{successNotice}</Text>
              </View>
            )}

            {/* Error Message */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formSpace}>
              {/* REGISTER MODE: Username */}
              {authMode === 'register' && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <View style={[styles.miniIconBadge, { backgroundColor: '#e0e7ff' }]}>
                      <UserIcon size={13} color="#4f46e5" />
                    </View>
                    <Text style={styles.inputLabel}>Username / Player Name</Text>
                  </View>

                  <View
                    style={[
                      styles.inputBoxContainer,
                      styles.inputBorderIndigo,
                      usernameError && styles.inputBoxError,
                      touched.username && isUsernameValid && styles.inputBoxValid,
                    ]}
                  >
                    <TextInput
                      value={username}
                      onChangeText={(val) => {
                        setUsername(val);
                        setTouched((prev) => ({ ...prev, username: true }));
                        if (errorMessage) setErrorMessage(null);
                        if (successNotice) setSuccessNotice(null);
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                      placeholder="e.g. CaptainClue"
                      placeholderTextColor="#94a3b8"
                      style={[styles.textInput, { paddingRight: 38 }]}
                    />
                    <View style={styles.inputStatusIcon}>
                      {usernameError ? (
                        <AlertCircle size={17} color="#e11d48" />
                      ) : touched.username && isUsernameValid ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : null}
                    </View>
                  </View>

                  {usernameError ? (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={12} color="#e11d48" />
                      <Text style={styles.fieldErrorText}>{usernameError}</Text>
                    </View>
                  ) : (
                    <Text style={styles.fieldHintText}>Minimum 3 characters (letters, numbers)</Text>
                  )}
                </View>
              )}

              {/* REGISTER MODE: Registration Method Switcher (Phone vs Email) */}
              {/* REGISTER MODE: Email Field */}
              {authMode === 'register' && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <View style={[styles.miniIconBadge, { backgroundColor: '#ecfdf5' }]}>
                      <Mail size={13} color="#059669" />
                    </View>
                    <Text style={styles.inputLabel}>Campus or Personal Email</Text>
                  </View>

                  <View
                    style={[
                      styles.inputBoxContainer,
                      styles.inputBorderEmerald,
                      emailError && styles.inputBoxError,
                      touched.email && isEmailValid && styles.inputBoxValid,
                    ]}
                  >
                    <TextInput
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        setTouched((prev) => ({ ...prev, email: true }));
                        if (errorMessage) setErrorMessage(null);
                        if (successNotice) setSuccessNotice(null);
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                      placeholder="e.g. hunter@campus.edu"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.textInput, { paddingRight: 38 }]}
                    />
                    <View style={styles.inputStatusIcon}>
                      {emailError ? (
                        <AlertCircle size={17} color="#e11d48" />
                      ) : touched.email && isEmailValid ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : null}
                    </View>
                  </View>

                  {emailError ? (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={12} color="#e11d48" />
                      <Text style={styles.fieldErrorText}>{emailError}</Text>
                    </View>
                  ) : (
                    <Text style={styles.fieldHintText}>You will log in using this email and your password</Text>
                  )}
                </View>
              )}

              {/* LOGIN MODE: Registered Identifier (Email or Username) */}
              {authMode === 'login' && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <View style={[styles.miniIconBadge, { backgroundColor: '#ecfdf5' }]}>
                      <Mail size={13} color="#059669" />
                    </View>
                    <Text style={styles.inputLabel}>Registered Email or Username</Text>
                  </View>

                  <View
                    style={[
                      styles.inputBoxContainer,
                      styles.inputBorderEmerald,
                      emailError && styles.inputBoxError,
                      touched.email && isEmailValid && styles.inputBoxValid,
                    ]}
                  >
                    <TextInput
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        setTouched((prev) => ({ ...prev, email: true }));
                        if (errorMessage) setErrorMessage(null);
                        if (successNotice) setSuccessNotice(null);
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                      placeholder="e.g. dd@gmail.com or ExplorerArjun"
                      placeholderTextColor="#94a3b8"
                      keyboardType="default"
                      autoCapitalize="none"
                      style={[styles.textInput, { paddingRight: 38 }]}
                    />
                    <View style={styles.inputStatusIcon}>
                      {emailError ? (
                        <AlertCircle size={17} color="#e11d48" />
                      ) : touched.email && isEmailValid ? (
                        <CheckCircle2 size={17} color="#10b981" />
                      ) : null}
                    </View>
                  </View>

                  {emailError ? (
                    <View style={styles.fieldErrorRow}>
                      <AlertCircle size={12} color="#e11d48" />
                      <Text style={styles.fieldErrorText}>{emailError}</Text>
                    </View>
                  ) : (
                    <Text style={styles.fieldHintText}>Enter the email or username you registered with</Text>
                  )}
                </View>
              )}

              {/* Password Input (Both Modes) */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <View style={[styles.miniIconBadge, { backgroundColor: '#ffe4e6' }]}>
                    <Lock size={13} color="#e11d48" />
                  </View>
                  <Text style={styles.inputLabel}>Password</Text>
                </View>

                <View
                  style={[
                    styles.passwordWrapper,
                    styles.inputBorderRose,
                    passwordError && styles.inputBoxError,
                    touched.password && isPasswordValid && styles.inputBoxValid,
                  ]}
                >
                  <TextInput
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setTouched((prev) => ({ ...prev, password: true }));
                      if (errorMessage) setErrorMessage(null);
                      if (successNotice) setSuccessNotice(null);
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    placeholder="Enter password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    style={[styles.textInput, styles.passwordInput]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#e11d48" />
                    ) : (
                      <Eye size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>

                {passwordError ? (
                  <View style={styles.fieldErrorRow}>
                    <AlertCircle size={12} color="#e11d48" />
                    <Text style={styles.fieldErrorText}>{passwordError}</Text>
                  </View>
                ) : (
                  <Text style={styles.fieldHintText}>At least 6 characters required</Text>
                )}
              </View>

              {/* FORGOT PASSWORD OPTION (Login Mode Only - Below Password Section) */}
              {authMode === 'login' && (
                <View style={styles.forgotPasswordRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowForgotModal(true);
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    style={styles.forgotPasswordBtn}
                    activeOpacity={0.75}
                  >
                    <KeyRound size={13} color="#a5b4fc" />
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* REGISTER MODE ONLY: Campus Dropdown & Phone */}
            {authMode === 'register' && (
              <>
                {/* Campus Type DROPDOWN LIST */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <View style={[styles.miniIconBadge, { backgroundColor: '#fef3c7' }]}>
                      <MapPin size={13} color="#d97706" />
                    </View>
                    <Text style={styles.inputLabel}>Campus Location</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                    activeOpacity={0.85}
                    style={[
                      styles.dropdownTrigger,
                      isDropdownOpen && styles.dropdownTriggerOpen,
                      { borderColor: selectedCampusMeta.borderColor },
                    ]}
                  >
                    <View style={styles.dropdownLeftContent}>
                      <View
                        style={[
                          styles.campusTypeEmojiBox,
                          { backgroundColor: selectedCampusMeta.badgeBg },
                        ]}
                      >
                        <Text style={styles.campusTypeEmoji}>
                          {selectedCampusMeta.emoji}
                        </Text>
                      </View>
                      <View style={styles.dropdownSelectedTexts}>
                        <Text style={styles.dropdownSelectedTitle}>
                          {selectedCampusMeta.title}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.dropdownChevronCircle,
                        isDropdownOpen && styles.dropdownChevronCircleActive,
                      ]}
                    >
                      {isDropdownOpen ? (
                        <ChevronUp size={18} color="#4f46e5" />
                      ) : (
                        <ChevronDown size={18} color="#64748b" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {CAMPUS_OPTIONS.map((item) => {
                        const isSelected = item.type === campusType;
                        return (
                          <TouchableOpacity
                            key={item.type}
                            onPress={() => handleSelectCampus(item.type)}
                            activeOpacity={0.7}
                            style={[
                              styles.dropdownItem,
                              isSelected && styles.dropdownItemSelected,
                            ]}
                          >
                            <View
                              style={[
                                styles.itemEmojiCircle,
                                { backgroundColor: item.badgeBg },
                              ]}
                            >
                              <Text style={styles.itemEmoji}>{item.emoji}</Text>
                            </View>

                            <View style={styles.itemTextContainer}>
                              <Text
                                style={[
                                  styles.itemTitle,
                                  isSelected && { color: item.badgeColor, fontWeight: '800' },
                                ]}
                              >
                                {item.title}
                              </Text>
                            </View>

                            <View style={styles.itemRadioCircle}>
                              {isSelected ? (
                                <CheckCircle2 size={18} color={item.badgeColor} />
                              ) : (
                                <View style={styles.radioEmpty} />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            )}

              {/* Submit Action Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSyncing}
                style={[
                  styles.submitBtn,
                  role === 'organizer' ? styles.submitBtnOrg : styles.submitBtnPlayer,
                  isSyncing && { opacity: 0.85 },
                ]}
                activeOpacity={0.88}
              >
                <View style={styles.submitBtnContent}>
                  {isSyncing ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.submitBtnText}>
                        {authMode === 'login' ? 'Logging in...' : 'Registering...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.submitBtnEmoji}>
                        {authMode === 'login' ? '🔑' : role === 'organizer' ? '👑' : '🚀'}
                      </Text>
                      <Text style={styles.submitBtnText}>
                        {authMode === 'login'
                          ? `Log In as ${role === 'organizer' ? 'Organizer' : 'Player'}`
                          : `Register & Enter ${role === 'organizer' ? 'Organizer' : 'Hunt'}`}
                      </Text>
                      <Award size={18} color="#ffffff" />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Mode Switcher Toggle Footer */}
              <TouchableOpacity
                onPress={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setErrorMessage(null);
                }}
                style={styles.switchModeRow}
                activeOpacity={0.7}
              >
                <Text style={styles.switchModePrompt}>
                  {authMode === 'login'
                    ? "Don't have an account yet?"
                    : 'Already registered?'}
                </Text>
                <Text style={styles.switchModeAction}>
                  {authMode === 'login' ? 'Register here' : 'Direct Log In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </motion.div>
      </ScrollView>

      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        visible={showForgotModal}
        initialIdentifier={email.trim()}
        onClose={() => setShowForgotModal(false)}
        onPasswordResetSuccess={(updatedId, newPass) => {
          setAuthMode('login');
          setEmail(updatedId);
          setPassword(newPass);
          setSuccessNotice('Password successfully reset! You can now log in with your new password.');
          setErrorMessage(null);
        }}
      />
    </CampusBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fef08a',
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: "'Cinzel', 'Outfit', sans-serif",
    textShadowColor: 'rgba(245, 158, 11, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  funBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },
  funBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fde047',
    letterSpacing: 0.8,
  },
  welcomeBackCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fbbf24',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeBackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  welcomeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fde047',
  },
  welcomeAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  welcomeBackInfo: {
    flex: 1,
  },
  welcomeBackNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  welcomeBackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fef08a',
  },
  welcomeBackSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  quickEnterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  quickEnterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 22,
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    position: 'relative',
  },
  authModeTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  authModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  authModeTabActive: {
    backgroundColor: '#b45309',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  authModeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  authModeTabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 11,
    gap: 5,
  },
  tabEmoji: {
    fontSize: 14,
  },
  roleTabInactive: {
    backgroundColor: 'transparent',
  },
  roleTabPlayerActive: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34d399',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabOrgActive: {
    backgroundColor: '#701a75',
    borderWidth: 1,
    borderColor: '#e879f9',
    shadowColor: '#c026d3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabAdminActive: {
    backgroundColor: '#991b1b',
    borderWidth: 1,
    borderColor: '#f87171',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  roleTabTextActive: {
    color: '#ffffff',
  },
  roleTabTextInactive: {
    color: '#94a3b8',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  formSpace: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  requiredAsterisk: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f87171',
    marginLeft: -2,
  },
  requiredPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#f87171',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  requiredPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fca5a5',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputBoxContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputBoxError: {
    borderColor: '#ef4444',
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  inputBoxValid: {
    borderColor: '#10b981',
    borderWidth: 1.5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  inputStatusIcon: {
    position: 'absolute',
    right: 12,
    top: 10,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  fieldErrorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fca5a5',
  },
  fieldHintText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94a3b8',
    paddingHorizontal: 4,
    marginTop: 1,
  },
  inputBorderIndigo: {
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  inputBorderEmerald: {
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  inputBorderRose: {
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  inputBorderBlue: {
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  registerMethodContainer: {
    marginBottom: 4,
  },
  registerMethodLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  registerMethodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 12,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  registerMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  registerMethodBtnActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  registerMethodBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  registerMethodBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '600',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    padding: 6,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownTriggerOpen: {
    backgroundColor: '#1e293b',
    borderColor: '#f59e0b',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  dropdownLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  campusTypeEmojiBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campusTypeEmoji: {
    fontSize: 16,
  },
  dropdownSelectedTexts: {
    flex: 1,
  },
  dropdownSelectedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  dropdownChevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownChevronCircleActive: {
    backgroundColor: '#b45309',
  },
  dropdownMenu: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 12,
    marginTop: 4,
    padding: 4,
    elevation: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  itemEmojiCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 14,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  itemRadioCircle: {
    paddingLeft: 4,
  },
  radioEmpty: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#64748b',
  },
  submitBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#fde047',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  submitBtnPlayer: {
    backgroundColor: '#d97706',
    shadowColor: '#f59e0b',
  },
  submitBtnOrg: {
    backgroundColor: '#b45309',
    shadowColor: '#f59e0b',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnEmoji: {
    fontSize: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  switchModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
  },
  switchModePrompt: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  switchModeAction: {
    fontSize: 12,
    color: '#fde047',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  forgotPasswordRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    marginBottom: 2,
  },
  forgotPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  successNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  successNoticeText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});
