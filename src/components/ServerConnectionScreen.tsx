import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Server, X, Wifi, AlertCircle, CheckCircle2, RefreshCw, Globe } from 'lucide-react-native';
import { testConnection, setApiBaseUrl, getApiBaseUrl, isConfigured, clearApiBaseUrl } from '../lib/apiConfig';

interface ServerConnectionScreenProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: (baseUrl: string) => void;
}

export const ServerConnectionScreen: React.FC<ServerConnectionScreenProps> = ({
  visible,
  onClose,
  onConnected,
}) => {
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status?: number; error?: string } | null>(null);

  const handleTestConnection = async () => {
    const trimmed = serverUrl.trim();
    if (!trimmed) {
      setTestResult({ ok: false, error: 'Please enter a server address.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(trimmed);
      setTestResult(result);
      if (result.ok) {
        setApiBaseUrl(trimmed);
        onConnected?.(trimmed);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = serverUrl.trim();
    setApiBaseUrl(trimmed);
    onConnected?.(trimmed);
    onClose();
  };

  const handleUseRelative = () => {
    clearApiBaseUrl();
    setServerUrl('');
    setTestResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop} onTouchEnd={onClose}>
        <View style={styles.card} pointerEvents="box-none" onTouchEnd={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Globe size={24} color="#3b82f6" />
            <Text style={styles.title}>Server Connection</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Configure the backend API address so this app can connect over LAN.
          </Text>

          <View style={styles.inputRow}>
            <Globe size={18} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="http://192.168.1.100:3000"
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              spellCheck={false}
            />
          </View>

          <View style={styles.hintRow}>
            <Wifi size={16} color="#64748b" />
            <Text style={styles.hintText}>
              Example: http://192.168.1.100:3000 (your computer's LAN IP)
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={handleUseRelative}
              disabled={isTesting}
            >
              <Text style={styles.btnText}>Use Relative (Web Dev)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Wifi size={18} color="white" />
              )}
              <Text style={styles.btnText}>Test Connection</Text>
            </TouchableOpacity>
          </View>

          {testResult && (
            <View style={styles.resultRow}>
              {testResult.ok ? (
                <View style={styles.resultBadgeOk}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <Text style={styles.resultTextOk}>
                    Connected (HTTP {testResult.status})
                  </Text>
                </View>
              ) : (
                <View style={styles.resultBadgeErr}>
                  <AlertCircle size={16} color="#ef4444" />
                  <Text style={styles.resultTextErr}>
                    {testResult.error || `Failed (HTTP ${testResult.status})`}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.saveRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleSave}
              disabled={isTesting || !testResult?.ok && !isConfigured()}
            >
              <Server size={18} color="white" />
              <Text style={styles.btnText}>
                {isConfigured() ? 'Save & Connect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>

          {isConfigured() && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleUseRelative}
            >
              <Text style={styles.clearText}>Clear server address</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 2,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  hintText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
  },
  btnOutline: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultRow: {
    marginBottom: 16,
  },
  resultBadgeOk: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  resultBadgeErr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  resultTextOk: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  resultTextErr: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b91c1c',
  },
  saveRow: {
    marginTop: 8,
  },
  clearBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
  },
});
