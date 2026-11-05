import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Copy, Check, QrCode as QrIcon, ShieldCheck, Sparkles } from 'lucide-react-native';
import Svg, { Rect, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PaymentQrCodeProps {
  upiId?: string;
  payeeName?: string;
  amount?: number;
  currency?: string;
  qrImageUrl?: string;
  onCopyUpi?: () => void;
}

export const PaymentQrCode: React.FC<PaymentQrCodeProps> = ({
  upiId = 'campustreasure@oksbi',
  payeeName = 'Campus Hunt Organizer',
  amount = 150,
  currency = '₹',
  qrImageUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <View style={styles.container}>
      {/* QR Code Container */}
      <View style={styles.qrCard}>
        <View style={styles.scannerCorners}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {qrImageUrl ? (
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
          ) : (
            /* High-fidelity Vector QR Code Matrix with UPI Target Center */
            <Svg width="180" height="180" viewBox="0 0 180 180">
              <Defs>
                <LinearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#0f172a" />
                  <Stop offset="100%" stopColor="#1e293b" />
                </LinearGradient>
              </Defs>

              {/* White clean background */}
              <Rect x="0" y="0" width="180" height="180" rx="10" fill="#ffffff" />

              {/* Top-Left Finder Pattern */}
              <Rect x="14" y="14" width="42" height="42" rx="6" fill="#0f172a" />
              <Rect x="20" y="20" width="30" height="30" rx="4" fill="#ffffff" />
              <Rect x="26" y="26" width="18" height="18" rx="3" fill="#3b82f6" />

              {/* Top-Right Finder Pattern */}
              <Rect x="124" y="14" width="42" height="42" rx="6" fill="#0f172a" />
              <Rect x="130" y="20" width="30" height="30" rx="4" fill="#ffffff" />
              <Rect x="136" y="26" width="18" height="18" rx="3" fill="#3b82f6" />

              {/* Bottom-Left Finder Pattern */}
              <Rect x="14" y="124" width="42" height="42" rx="6" fill="#0f172a" />
              <Rect x="20" y="130" width="30" height="30" rx="4" fill="#ffffff" />
              <Rect x="26" y="136" width="18" height="18" rx="3" fill="#3b82f6" />

              {/* Simulated QR Code Data Pixels */}
              <G fill="#1e293b">
                {/* Horizontal & vertical timing lines */}
                <Rect x="64" y="26" width="6" height="6" rx="1" />
                <Rect x="76" y="26" width="6" height="6" rx="1" />
                <Rect x="88" y="26" width="6" height="6" rx="1" />
                <Rect x="100" y="26" width="6" height="6" rx="1" />
                <Rect x="112" y="26" width="6" height="6" rx="1" />

                <Rect x="26" y="64" width="6" height="6" rx="1" />
                <Rect x="26" y="76" width="6" height="6" rx="1" />
                <Rect x="26" y="88" width="6" height="6" rx="1" />
                <Rect x="26" y="100" width="6" height="6" rx="1" />
                <Rect x="26" y="112" width="6" height="6" rx="1" />

                {/* Inner clusters */}
                <Rect x="64" y="64" width="10" height="10" rx="2" fill="#0284c7" />
                <Rect x="80" y="64" width="8" height="8" rx="1" />
                <Rect x="96" y="64" width="8" height="8" rx="1" />
                <Rect x="108" y="64" width="10" height="10" rx="2" fill="#0284c7" />

                <Rect x="64" y="80" width="8" height="8" rx="1" />
                <Rect x="108" y="80" width="8" height="8" rx="1" />

                <Rect x="64" y="96" width="8" height="8" rx="1" />
                <Rect x="80" y="96" width="8" height="8" rx="1" />
                <Rect x="96" y="96" width="8" height="8" rx="1" />
                <Rect x="108" y="96" width="8" height="8" rx="1" />

                <Rect x="64" y="108" width="10" height="10" rx="2" fill="#0284c7" />
                <Rect x="80" y="114" width="8" height="8" rx="1" />
                <Rect x="96" y="114" width="8" height="8" rx="1" />
                <Rect x="108" y="108" width="10" height="10" rx="2" fill="#0284c7" />

                <Rect x="126" y="64" width="8" height="8" rx="1" />
                <Rect x="140" y="64" width="8" height="8" rx="1" />
                <Rect x="154" y="64" width="8" height="8" rx="1" />
                <Rect x="134" y="78" width="10" height="10" rx="2" />
                <Rect x="150" y="78" width="8" height="8" rx="1" />
                <Rect x="126" y="94" width="8" height="8" rx="1" />
                <Rect x="144" y="94" width="10" height="10" rx="2" />
                <Rect x="130" y="110" width="8" height="8" rx="1" />
                <Rect x="146" y="110" width="8" height="8" rx="1" />
                <Rect x="126" y="126" width="8" height="8" rx="1" />
                <Rect x="142" y="126" width="8" height="8" rx="1" />
                <Rect x="156" y="136" width="8" height="8" rx="1" />
                <Rect x="130" y="146" width="10" height="10" rx="2" />
                <Rect x="148" y="150" width="8" height="8" rx="1" />

                <Rect x="64" y="130" width="8" height="8" rx="1" />
                <Rect x="78" y="130" width="8" height="8" rx="1" />
                <Rect x="94" y="130" width="10" height="10" rx="2" />
                <Rect x="64" y="146" width="10" height="10" rx="2" />
                <Rect x="82" y="146" width="8" height="8" rx="1" />
                <Rect x="98" y="146" width="8" height="8" rx="1" />
                <Rect x="110" y="146" width="8" height="8" rx="1" />
              </G>

              {/* Center UPI Badge */}
              <Rect x="72" y="72" width="36" height="36" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
              <Rect x="76" y="76" width="28" height="28" rx="6" fill="#2563eb" />
              {/* UPI Emblem letters */}
              <Path
                d="M 83 83 L 83 91 C 83 93.5 85 95 87.5 95 C 90 95 92 93.5 92 91 L 92 83"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <Rect x="94" y="83" width="2.5" height="12" rx="1" fill="#facc15" />
            </Svg>
          )}
        </View>

        {/* Scan instruction pill */}
        <View style={styles.scanInstructionPill}>
          <QrIcon size={12} color="#0284c7" />
          <Text style={styles.scanInstructionText}>Scan via GPay / PhonePe / Paytm / Any UPI</Text>
        </View>
      </View>

      {/* Payee Details Card */}
      <View style={styles.detailsBox}>
        <View style={styles.amountBanner}>
          <Text style={styles.amountLabel}>Payable Registration Fee</Text>
          <Text style={styles.amountValue}>
            {currency}{amount}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payee Name:</Text>
          <Text style={styles.infoValue}>{payeeName}</Text>
        </View>

        <View style={styles.upiRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Organizer UPI ID:</Text>
            <Text style={styles.upiIdText}>{upiId}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopy}
            style={[styles.copyBtn, copied && styles.copiedBtn]}
            activeOpacity={0.7}
          >
            {copied ? (
              <>
                <Check size={13} color="#ffffff" />
                <Text style={styles.copyBtnTextActive}>Copied</Text>
              </>
            ) : (
              <>
                <Copy size={13} color="#0f172a" />
                <Text style={styles.copyBtnText}>Copy UPI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  qrCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  scannerCorners: {
    position: 'relative',
    padding: 6,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#2563eb',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 10,
  },
  scanInstructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  scanInstructionText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369a1',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  amountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fbbf24',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 2,
  },
  upiIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copiedBtn: {
    backgroundColor: '#10b981',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  copyBtnTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
});
