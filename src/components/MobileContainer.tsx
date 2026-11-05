import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Smartphone, Monitor } from 'lucide-react-native';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const [frameMode, setFrameMode] = useState<'mobile' | 'full'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('campus_treasure_hunt_frame_mode');
      if (saved === 'mobile' || saved === 'full') return saved;
    }
    // Default to 'full' responsive view for clean, uncluttered layout
    return 'full';
  });

  const handleSetFrameMode = (mode: 'mobile' | 'full') => {
    setFrameMode(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('campus_treasure_hunt_frame_mode', mode);
      }
    } catch (e) {
      // ignore
    }
  };

  // On native mobile (Android/iOS), simply render children in SafeAreaView
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.nativeContainer}>
        {children}
      </SafeAreaView>
    );
  }

  // Render the authentic mobile frame mockup
  return (
    <View style={styles.webOuterContainer}>
      <View style={styles.mobileFrame}>
        <View style={styles.childrenWrapper}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: '#040817',
  },
  webOuterContainer: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#020611',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  mobileFrame: {
    width: '100%',
    maxWidth: 412,
    height: 860,
    maxHeight: '98vh' as any,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#050b1a',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 36,
  },
  childrenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
