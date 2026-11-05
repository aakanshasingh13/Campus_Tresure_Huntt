import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetUserPassword,
} from '../lib/supabase';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onPasswordResetSuccess: (identifier: string, newPassword: string) => void;
}

type Step = 'identifier' | 'otp' | 'new_password' | 'success';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  initialIdentifier = '',
  onPasswordResetSuccess,
}) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('identifier');

  // Input states
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // OTP details from backend
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Timer states
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(574); // ~09:34
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const otpTimerRef = useRef<any>(null);
  const resendTimerRef = useRef<any>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Reset state on open/close
  useEffect(() => {
    if (visible) {
      setCurrentStep('identifier');
      setIdentifier(initialIdentifier || '');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setMaskedEmail('');
      setResetToken(null);
      setIsLoading(false);
      setResendCooldown(0);
      setOtpExpiresIn(574);
    } else {
      clearInterval(otpTimerRef.current);
      clearInterval(resendTimerRef.current);
    }

    return () => {
      clearInterval(otpTimerRef.current);
      clearInterval(resendTimerRef.current);
    };
  }, [visible, initialIdentifier]);

  // Handle OTP Expiration Countdown
  useEffect(() => {
    if (currentStep === 'otp' && otpExpiresIn > 0) {
      clearInterval(otpTimerRef.current);
      otpTimerRef.current = setInterval(() => {
        setOtpExpiresIn((prev) => {
          if (prev <= 1) {
            clearInterval(otpTimerRef.current);
            setErrorMsg('Verification code has expired. Please click Resend.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (currentStep !== 'otp') {
      clearInterval(otpTimerRef.current);
    }

    return () => clearInterval(otpTimerRef.current);
  }, [currentStep, otpExpiresIn]);

  // Handle Resend Cooldown Countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(resendTimerRef.current);
  }, [resendCooldown]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Empty', color: '#64748b' };
    let score = 0;
    if (pass.length >= 6) score += 30;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;

    if (score < 40) return { score: 30, label: 'Weak', color: '#ef4444' };
    if (score < 75) return { score: 65, label: 'Medium', color: '#f59e0b' };
    return { score: 100, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(newPassword);

  // Handle individual OTP digit changes
  const handleOtpDigitChange = (val: string, index: number) => {
    if (errorMsg) setErrorMsg(null);

    // If pasted multi-digit text
    if (val.length > 1) {
      const cleanDigits = val.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const updated = [...otpDigits];
      cleanDigits.forEach((digit, i) => {
        if (i < 6) updated[i] = digit;
      });
      setOtpDigits(updated);
      const nextFocus = Math.min(cleanDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const cleanDigit = val.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];
    updated[index] = cleanDigit;
    setOtpDigits(updated);

    // Move to next digit if entered
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // STEP 1: Request OTP for Registered Email or Username
  const handleRequestOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg('Please enter your registered email or username.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordResetOtp(cleanId);
      setIsLoading(false);

      if (res.success) {
        setMaskedEmail(res.maskedEmail || cleanId);
        setOtpExpiresIn(res.expiresInSeconds || 574);
        setResendCooldown(30);
        setOtpDigits(['', '', '', '', '', '']);
        setCurrentStep('otp');
        setTimeout(() => inputRefs.current[0]?.focus(), 150);
      } else {
        setErrorMsg(res.error || 'Failed to send OTP. Please check your identifier.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Network error while requesting OTP. Please try again.');
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await requestPasswordResetOtp(identifier.trim());
      setIsLoading(false);

      if (res.success) {
        setOtpExpiresIn(res.expiresInSeconds || 574);
        setResendCooldown(30);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg('New verification code sent to your registered email!');
        inputRefs.current[0]?.focus();
      } else {
        setErrorMsg(res.error || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Failed to resend code.');
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    if (otpExpiresIn <= 0) {
      setErrorMsg('This code has expired. Please click "Resend" to get a fresh code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyPasswordResetOtp(identifier.trim(), fullCode);
      setIsLoading(false);

      if (res.success) {
        setResetToken(res.resetToken || null);
        setCurrentStep('new_password');
        setErrorMsg(null);
      } else {
        setErrorMsg(res.error || 'Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Verification service error. Please try again.');
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetUserPassword(
        identifier.trim(),
        cleanPass,
        resetToken || undefined,
        otpDigits.join('')
      );
      setIsLoading(false);

      if (res.success) {
        setCurrentStep('success');
        setSuccessMsg(res.message || 'Password updated successfully!');

        setTimeout(() => {
          onPasswordResetSuccess(identifier.trim(), cleanPass);
          onClose();
        }, 1400);
      } else {
        setErrorMsg(res.error || 'Password reset failed. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Failed to update password. Please try again.');
    }
  };

  const isOtpComplete = otpDigits.every((d) => d.length === 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={styles.goldTitle}>
              {currentStep === 'identifier' && 'RESET PASSWORD'}
              {currentStep === 'otp' && 'VERIFY YOUR EMAIL'}
              {currentStep === 'new_password' && 'SET NEW PASSWORD'}
              {currentStep === 'success' && 'PASSWORD UPDATED!'}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Subtitle / Change Link */}
          {currentStep === 'otp' ? (
            <View style={styles.otpSubtitleContainer}>
              <Text style={styles.otpSubtitleText}>
                Enter the 6-digit code we sent to
              </Text>
              <View style={styles.emailRow}>
                <Text style={styles.emailHighlightText}>
                  {maskedEmail || identifier}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentStep('identifier');
                    setErrorMsg(null);
                  }}
                  activeOpacity={0.7}
                  style={styles.changeBtn}
                >
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentStep === 'identifier' ? (
            <Text style={styles.defaultSubtitle}>
              Enter your registered email or username to receive a 6-digit verification code.
            </Text>
          ) : currentStep === 'new_password' ? (
            <Text style={styles.defaultSubtitle}>
              Identity verified for <Text style={{ color: '#fef08a', fontWeight: '700' }}>{maskedEmail || identifier}</Text>. Create a new password below.
            </Text>
          ) : null}

          {/* Stepper Progress Bar matching Reference */}
          {currentStep !== 'success' && (
            <View style={styles.stepperContainer}>
              {/* Step 1: Email */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 'identifier'
                      ? styles.stepCircleActiveGold
                      : styles.stepCircleDone,
                  ]}
                >
                  {currentStep === 'identifier' ? (
                    <Text style={styles.stepNumberActive}>1</Text>
                  ) : (
                    <Check size={14} color="#f59e0b" strokeWidth={3} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === 'identifier' && styles.stepLabelActive,
                  ]}
                >
                  Email
                </Text>
              </View>

              {/* Connecting Line 1 -> 2 */}
              <View
                style={[
                  styles.stepLine,
                  currentStep !== 'identifier' ? styles.stepLineActive : styles.stepLineInactive,
                ]}
              />

              {/* Step 2: Verify */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 'otp'
                      ? styles.stepCircleSolidGold
                      : currentStep === 'new_password'
                      ? styles.stepCircleDone
                      : styles.stepCircleInactive,
                  ]}
                >
                  {currentStep === 'otp' ? (
                    <Text style={styles.stepNumberSolidGold}>2</Text>
                  ) : currentStep === 'new_password' ? (
                    <Check size={14} color="#f59e0b" strokeWidth={3} />
                  ) : (
                    <Text style={styles.stepNumberInactive}>2</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === 'otp' && styles.stepLabelActive,
                  ]}
                >
                  Verify
                </Text>
              </View>

              {/* Connecting Line 2 -> 3 */}
              <View
                style={[
                  styles.stepLine,
                  currentStep === 'new_password' ? styles.stepLineActive : styles.stepLineInactive,
                ]}
              />

              {/* Step 3: Password */}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    currentStep === 'new_password'
                      ? styles.stepCircleSolidGold
                      : styles.stepCircleInactive,
                  ]}
                >
                  <Text
                    style={
                      currentStep === 'new_password'
                        ? styles.stepNumberSolidGold
                        : styles.stepNumberInactive
                    }
                  >
                    3
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    currentStep === 'new_password' && styles.stepLabelActive,
                  ]}
                >
                  Password
                </Text>
              </View>
            </View>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color="#f87171" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Success Banner */}
          {successMsg && (
            <View style={styles.successBox}>
              <CheckCircle2 size={15} color="#34d399" />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* ============================================================= */}
          {/* STEP 1: Enter Registered Email or Username */}
          {/* ============================================================= */}
          {currentStep === 'identifier' && (
            <View style={styles.stepContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Email or Username</Text>
                <View style={styles.darkInputWrapper}>
                  <Mail size={16} color="#d97706" style={styles.inputIcon} />
                  <TextInput
                    value={identifier}
                    onChangeText={(val) => {
                      setIdentifier(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="e.g. singhhgudduu0202@gmail.com or Aakansha singh"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.darkInput}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleRequestOtp}
                disabled={isLoading || !identifier.trim()}
                style={[
                  styles.goldActionButton,
                  (isLoading || !identifier.trim()) && { opacity: 0.6 },
                ]}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#0c1322" />
                    <Text style={styles.goldActionButtonText}>Sending code...</Text>
                  </View>
                ) : (
                  <Text style={styles.goldActionButtonText}>Send verification code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                disabled={isLoading}
                style={styles.backLinkBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.backLinkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================= */}
          {/* STEP 2: Verify OTP matching user reference screenshot */}
          {/* ============================================================= */}
          {currentStep === 'otp' && (
            <View style={styles.stepContent}>
              {/* Header Label Row: Verification Code & Expires in */}
              <View style={styles.verificationCodeHeaderRow}>
                <Text style={styles.verificationCodeLabel}>Verification code</Text>
                <Text style={styles.expiresInText}>
                  Expires in <Text style={styles.expiresInBold}>{formatTime(otpExpiresIn)}</Text>
                </Text>
              </View>

              {/* 6 Individual Digit Input Boxes */}
              <View style={styles.otpBoxesRow}>
                {otpDigits.map((digit, idx) => {
                  const isFilled = digit.length > 0;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        isFilled && styles.otpBoxFilled,
                      ]}
                    >
                      <TextInput
                        ref={(ref) => {
                          inputRefs.current[idx] = ref;
                        }}
                        value={digit}
                        onChangeText={(val) => handleOtpDigitChange(val, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={styles.otpBoxInput}
                        selectTextOnFocus
                        editable={!isLoading}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Resend Row matching reference: Didn't get the code? Resend in Xs */}
              <View style={styles.resendPromptRow}>
                <Text style={styles.resendQuestion}>Didn’t get the code? </Text>
                {resendCooldown > 0 ? (
                  <Text style={styles.resendCountdown}>
                    Resend in {resendCooldown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resendActiveLink}>Resend code</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Primary Action Button: Verify code */}
              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={isLoading || !isOtpComplete}
                style={[
                  styles.goldActionButton,
                  isOtpComplete
                    ? styles.goldActionButtonActive
                    : styles.goldActionButtonMuted,
                  isLoading && { opacity: 0.7 },
                ]}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#0c1322" />
                    <Text style={styles.goldActionButtonText}>Verifying...</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.goldActionButtonText,
                      isOtpComplete && styles.goldActionButtonTextActive,
                    ]}
                  >
                    Verify code
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back Link */}
              <TouchableOpacity
                onPress={() => {
                  setCurrentStep('identifier');
                  setErrorMsg(null);
                }}
                disabled={isLoading}
                style={styles.backLinkBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.backLinkText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================= */}
          {/* STEP 3: New Password and Confirm Password */}
          {/* ============================================================= */}
          {currentStep === 'new_password' && (
            <View style={styles.stepContent}>
              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.darkInputWrapper}>
                  <Lock size={16} color="#d97706" style={styles.inputIcon} />
                  <TextInput
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showNewPassword}
                    editable={!isLoading}
                    style={styles.darkInput}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    {showNewPassword ? (
                      <EyeOff size={16} color="#f87171" />
                    ) : (
                      <Eye size={16} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarBg}>
                      <View
                        style={[
                          styles.strengthBarFill,
                          {
                            width: `${strength.score}%`,
                            backgroundColor: strength.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm New Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithBadgeRow}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  {confirmPassword.length > 0 && (
                    <Text
                      style={[
                        styles.matchBadgeText,
                        {
                          color:
                            newPassword === confirmPassword ? '#34d399' : '#f87171',
                        },
                      ]}
                    >
                      {newPassword === confirmPassword
                        ? '✓ Passwords match'
                        : '✕ Passwords mismatch'}
                    </Text>
                  )}
                </View>

                <View style={styles.darkInputWrapper}>
                  <ShieldCheck size={16} color="#d97706" style={styles.inputIcon} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Re-enter your new password"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    style={styles.darkInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} color="#f87171" />
                    ) : (
                      <Eye size={16} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Action Button: Save Password */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={
                  isLoading ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                style={[
                  styles.goldActionButton,
                  newPassword.length >= 6 && newPassword === confirmPassword
                    ? styles.goldActionButtonActive
                    : styles.goldActionButtonMuted,
                  isLoading && { opacity: 0.7 },
                ]}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#0c1322" />
                    <Text style={styles.goldActionButtonText}>Updating...</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.goldActionButtonText,
                      newPassword.length >= 6 &&
                        newPassword === confirmPassword &&
                        styles.goldActionButtonTextActive,
                    ]}
                  >
                    Update password
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentStep('otp');
                  setErrorMsg(null);
                }}
                disabled={isLoading}
                style={styles.backLinkBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.backLinkText}>Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================= */}
          {/* STEP 4: Success Screen */}
          {/* ============================================================= */}
          {currentStep === 'success' && (
            <View style={styles.successScreenContainer}>
              <View style={styles.successCheckCircle}>
                <CheckCircle2 size={46} color="#34d399" />
              </View>
              <Text style={styles.successTitleText}>Password Reset Complete</Text>
              <Text style={styles.successBodyText}>
                Your password has been securely updated in the database.
              </Text>
              <View style={styles.redirectRow}>
                <ActivityIndicator size="small" color="#f59e0b" />
                <Text style={styles.redirectRowText}>Redirecting to Login...</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 410,
    backgroundColor: '#0c1322',
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goldTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fef08a',
    letterSpacing: 1.2,
    fontFamily: "'Cinzel', 'Outfit', serif, sans-serif",
    textShadowColor: 'rgba(245, 158, 11, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },

  /* Subtitles */
  defaultSubtitle: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  otpSubtitleContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 3,
  },
  otpSubtitleText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailHighlightText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  changeBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  changeBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f59e0b',
  },

  /* Stepper Progress Bar */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActiveGold: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    backgroundColor: '#0c1322',
  },
  stepCircleSolidGold: {
    backgroundColor: '#fbbf24',
  },
  stepCircleDone: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  stepCircleInactive: {
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: 'transparent',
  },
  stepNumberActive: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '900',
  },
  stepNumberSolidGold: {
    color: '#0c1322',
    fontSize: 13,
    fontWeight: '900',
  },
  stepNumberInactive: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  stepLabelActive: {
    color: '#fde047',
    fontWeight: '800',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#f59e0b',
  },
  stepLineInactive: {
    backgroundColor: '#334155',
  },

  /* Alerts */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: '#f87171',
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    fontSize: 12.5,
    color: '#34d399',
    fontWeight: '600',
    flex: 1,
  },

  /* Step Content */
  stepContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  darkInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080d19',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  darkInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },

  /* Verification Code Header & 6 Boxes */
  verificationCodeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  verificationCodeLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#f8fafc',
  },
  expiresInText: {
    fontSize: 12.5,
    color: '#94a3b8',
  },
  expiresInBold: {
    color: '#ffffff',
    fontWeight: '800',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#080d19',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  otpBoxInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },

  /* Resend Prompt */
  resendPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  resendQuestion: {
    fontSize: 13,
    color: '#94a3b8',
  },
  resendCountdown: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  resendActiveLink: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '800',
  },

  /* Buttons matching reference */
  goldActionButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  goldActionButtonMuted: {
    backgroundColor: '#78591c', // Muted bronze from reference
  },
  goldActionButtonActive: {
    backgroundColor: '#b45309', // Rich gold/amber
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  goldActionButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#d4af37',
    letterSpacing: 0.3,
  },
  goldActionButtonTextActive: {
    color: '#ffffff',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backLinkBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  /* Strength Bar */
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'right',
  },

  /* Success Screen */
  successScreenContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  successCheckCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#34d399',
    marginBottom: 4,
  },
  successTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fef08a',
    textAlign: 'center',
    fontFamily: "'Cinzel', 'Outfit', serif, sans-serif",
  },
  successBodyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  redirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  redirectRowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
});
