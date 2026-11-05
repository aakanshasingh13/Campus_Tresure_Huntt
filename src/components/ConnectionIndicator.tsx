import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BackendConnectionStatus } from '../lib/backendDiscovery';

interface ConnectionIndicatorProps {
  status: BackendConnectionStatus;
  detail?: string;
}

const statusConfig: Record<
  BackendConnectionStatus,
  { label: string; dot: string; text: string }
> = {
  connected: { label: 'Connected', dot: '#22c55e', text: '#d9f99d' },
  searching: { label: 'Searching', dot: '#fbbf24', text: '#fde68a' },
  disconnected: { label: 'Disconnected', dot: '#ef4444', text: '#fecaca' },
};

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  detail,
}) => {
  const config = statusConfig[status];

  return (
    <View
      pointerEvents="none"
      style={styles.container}
      accessibilityLabel={detail || config.label}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 500,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 11, 26, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.32)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
