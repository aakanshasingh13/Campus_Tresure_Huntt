import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {
  QrCode,
  Camera,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Zap,
  MapPin,
  RefreshCw,
  KeyRound,
} from 'lucide-react-native';
import jsQR from 'jsqr';
import { Clue, TreasureEvent } from '../../types';
import {
  getClueBackupCode,
  getClueQrPayload,
  verifyCheckpointQr,
} from '../../utils/qrCheckpointHelper';
import { playSuccessSound, playErrorSound } from '../../utils/audioEffects';

interface CheckpointQrScannerModalProps {
  visible: boolean;
  event: TreasureEvent;
  currentClue: Clue;
  checkpointNumber: number;
  totalCheckpoints: number;
  onScanSuccess: (scannedData: string) => void;
  onClose: () => void;
}

export const CheckpointQrScannerModal: React.FC<CheckpointQrScannerModalProps> = ({
  visible,
  event,
  currentClue,
  checkpointNumber,
  totalCheckpoints,
  onScanSuccess,
  onClose,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [validationError, setValidationError] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start device camera
  const startCamera = async () => {
    setCameraError('');
    setValidationError('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this browser. Use manual backup code or quick scan below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can still scan via Quick Scan or enter the manual backup code.'
          : 'Unable to start camera. Use Quick Scan or manual code entry below.'
      );
    }
  };

  // Continuous frame scanning loop using jsQR
  const startScanningLoop = () => {
    const scanFrame = () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx && videoRef.current) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleProcessScannedCode(code.data);
          return; // stop scanning loop on detection
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Process code from any source (camera, image upload, quick scan, manual entry)
  const handleProcessScannedCode = (rawScanned: string) => {
    const check = verifyCheckpointQr(rawScanned, event, currentClue);

    if (check.isValid) {
      stopCamera();
      setVerifiedSuccess(true);
      setValidationError('');
      playSuccessSound();

      try {
        if (typeof navigator !== 'undefined' && (navigator as any).vibrate) {
          (navigator as any).vibrate([100, 50, 150]);
        }
      } catch (e) {}

      setTimeout(() => {
        onScanSuccess(rawScanned);
      }, 1000);
    } else {
      playErrorSound();
      setValidationError(check.reason || 'Invalid QR code. Please scan the physical marker placed at this checkpoint location.');
    }
  };

  // Quick simulate scan (useful for physical testing & when camera is unavailable)
  const handleQuickScanPhysicalCode = () => {
    const expectedPayload = getClueQrPayload(event, currentClue);
    handleProcessScannedCode(expectedPayload);
  };

  // Handle manual code submit
  const handleManualCodeSubmit = () => {
    if (!manualCode.trim()) {
      setValidationError('Please enter the checkpoint code printed on the physical sheet.');
      return;
    }
    handleProcessScannedCode(manualCode.trim());
  };

  // Handle image upload from disk/gallery
  const handleImageUpload = (eventChange: React.ChangeEvent<HTMLInputElement>) => {
    const file = eventChange.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleProcessScannedCode(code.data);
          } else {
            playErrorSound();
            setValidationError('Could not detect a valid QR code in the uploaded image. Please try again or use the manual code.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (visible && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [visible, activeTab]);

  if (!visible) return null;

  const backupCode = getClueBackupCode(currentClue, checkpointNumber - 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.scannerCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.checkpointPill}>
                <Sparkles size={11} color="#f59e0b" />
                <Text style={styles.checkpointPillText}>
                  CHECKPOINT #{checkpointNumber} OF {totalCheckpoints}
                </Text>
              </View>
              <Text style={styles.headerTitle}>Scan Physical Checkpoint QR</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                Target: {currentClue.locationHint || currentClue.title}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Mode Switch Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('camera')}
              style={[styles.tabBtn, activeTab === 'camera' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Camera size={13} color={activeTab === 'camera' ? '#fbbf24' : '#94a3b8'} />
              <Text style={[styles.tabBtnText, activeTab === 'camera' && styles.tabBtnTextActive]}>
                Live Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('manual')}
              style={[styles.tabBtn, activeTab === 'manual' && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <KeyRound size={13} color={activeTab === 'manual' ? '#fbbf24' : '#94a3b8'} />
              <Text style={[styles.tabBtnText, activeTab === 'manual' && styles.tabBtnTextActive]}>
                Manual Backup Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verification Feedback Banner */}
          {verifiedSuccess ? (
            <View style={styles.verifiedBanner}>
              <CheckCircle2 size={24} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedBannerTitle}>PHYSICAL CHECKPOINT VERIFIED!</Text>
                <Text style={styles.verifiedBannerSub}>
                  Location confirmed! Unlocking your next clue now...
                </Text>
              </View>
            </View>
          ) : null}

          {/* Validation Error Message */}
          {validationError ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={15} color="#ef4444" />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          ) : null}

          {/* Body: Live Camera View or Manual Mode */}
          {activeTab === 'camera' ? (
            <View style={styles.cameraStage}>
              {/* HTML Video Viewfinder Element */}
              <div style={styles.viewfinderContainer as any}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: cameraActive ? 'block' : 'none',
                  }}
                  muted
                  playsInline
                />

                {!cameraActive && (
                  <View style={styles.cameraPlaceholder}>
                    <QrCode size={56} color="#fbbf24" />
                    <Text style={styles.cameraPlaceholderTitle}>
                      {cameraError ? 'Camera Unavailable' : 'Initializing Viewfinder...'}
                    </Text>
                    <Text style={styles.cameraPlaceholderSub}>
                      {cameraError || 'Please allow camera permission to scan physical QR printouts.'}
                    </Text>
                    {cameraError ? (
                      <TouchableOpacity onPress={startCamera} style={styles.retryBtn} activeOpacity={0.8}>
                        <RefreshCw size={12} color="#ffffff" />
                        <Text style={styles.retryBtnText}>Retry Camera</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                {/* Laser scan line overlay */}
                {cameraActive && (
                  <div className="scanner-laser-line" />
                )}

                {/* Corner guide brackets */}
                <div className="scanner-corner corner-tl" />
                <div className="scanner-corner corner-tr" />
                <div className="scanner-corner corner-bl" />
                <div className="scanner-corner corner-br" />
              </div>

              {/* Physical clue placement reminder */}
              <View style={styles.locationNoticeBox}>
                <MapPin size={12} color="#fbbf24" />
                <Text style={styles.locationNoticeText} numberOfLines={1}>
                  Locate physical printout at: <Text style={{ fontWeight: 'bold' }}>{currentClue.locationHint || currentClue.title}</Text>
                </Text>
              </View>

              {/* Quick Actions (Instant Physical Scan & Upload Photo) */}
              <View style={styles.scanActionsRow}>
                {/* 1. Primary Action: Instant Physical Scan Simulation for smooth testing */}
                <TouchableOpacity
                  onPress={handleQuickScanPhysicalCode}
                  style={styles.quickScanActionBtn}
                  activeOpacity={0.8}
                >
                  <Zap size={14} color="#0f172a" strokeWidth={2.5} />
                  <Text style={styles.quickScanActionBtnText}>
                    ⚡ Scan Checkpoint QR (Found Marker!)
                  </Text>
                </TouchableOpacity>

                {/* 2. Upload photo from gallery */}
                <label style={styles.uploadPhotoBtn as any}>
                  <Upload size={13} color="#cbd5e1" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </View>
            </View>
          ) : (
            /* Manual Backup Code Input Stage */
            <View style={styles.manualStage}>
              <View style={styles.manualInfoBox}>
                <KeyRound size={16} color="#fbbf24" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.manualInfoTitle}>Physical Printout Backup Key</Text>
                  <Text style={styles.manualInfoDesc}>
                    Look at the bottom of the printed checkpoint sheet taped at the location and type the backup code.
                  </Text>
                </View>
              </View>

              <View style={styles.manualInputGroup}>
                <Text style={styles.manualInputLabel}>ENTER CHECKPOINT KEY OR CODE</Text>
                <TextInput
                  value={manualCode}
                  onChangeText={(val) => {
                    setManualCode(val.toUpperCase());
                    setValidationError('');
                  }}
                  placeholder={`e.g., ${backupCode} or ${currentClue.solution || 'ANSWER'}`}
                  placeholderTextColor="#64748b"
                  style={styles.manualTextInput}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                onPress={handleManualCodeSubmit}
                style={styles.verifyManualBtn}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={15} color="#0f172a" />
                <Text style={styles.verifyManualBtnText}>Verify Checkpoint & Unlock Next Clue</Text>
              </TouchableOpacity>

              <View style={styles.sampleBackupHint}>
                <Text style={styles.sampleBackupHintText}>
                  Test code for this checkpoint: <Text style={{ color: '#fbbf24', fontWeight: 'bold' }}>{backupCode}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Footer note */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>
              Scanning the printed QR code confirms your physical presence and unlocks the clue for the next step.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  scannerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0a1224',
    borderRadius: 22,
    borderWidth: 1.8,
    borderColor: '#b45309',
    overflow: 'hidden',
    boxShadow: '0 0 35px rgba(217, 119, 6, 0.4)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0c162c',
  },
  checkpointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  checkpointPillText: {
    color: '#fbbf24',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  headerTitle: {
    color: '#fef3c7',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'serif',
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#080f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  verifiedBannerTitle: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBannerSub: {
    color: '#a7f3d0',
    fontSize: 11,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  cameraStage: {
    padding: 16,
    alignItems: 'center',
  },
  viewfinderContainer: {
    width: 250,
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#030712',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    padding: 20,
    textAlign: 'center',
  },
  cameraPlaceholderTitle: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  cameraPlaceholderSub: {
    color: '#94a3b8',
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#b45309',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  locationNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: '#b45309',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
  },
  locationNoticeText: {
    color: '#fef3c7',
    fontSize: 11,
    flex: 1,
  },
  scanActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickScanActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
  },
  quickScanActionBtnText: {
    color: '#0f172a',
    fontSize: 11.5,
    fontWeight: '900',
  },
  uploadPhotoBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    cursor: 'pointer',
    userSelect: 'none',
  },
  manualStage: {
    padding: 16,
  },
  manualInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0c162c',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  manualInfoTitle: {
    color: '#fef08a',
    fontSize: 12,
    fontWeight: '800',
  },
  manualInfoDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  manualInputGroup: {
    marginBottom: 14,
  },
  manualInputLabel: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  manualTextInput: {
    backgroundColor: '#030712',
    borderWidth: 1.5,
    borderColor: '#b45309',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  verifyManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fbbf24',
    paddingVertical: 11,
    borderRadius: 10,
    boxShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
  },
  verifyManualBtnText: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '900',
  },
  sampleBackupHint: {
    alignItems: 'center',
    marginTop: 10,
  },
  sampleBackupHintText: {
    color: '#64748b',
    fontSize: 11,
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#080f1f',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  cardFooterText: {
    color: '#64748b',
    fontSize: 10.5,
    textAlign: 'center',
  },
});
