import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';

export const PlayerFixedBackground: React.FC = () => {
  return (
    <View style={styles.fixedBgContainer} pointerEvents="none">
      {/* 1. Base Nocturnal Sky Gradient & Atmospheric Glows */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Deep Obsidian-to-Midnight Sky Gradient matching Organizer Dashboard */}
          <LinearGradient id="playerFixedSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#040817" />
            <Stop offset="18%" stopColor="#06122e" />
            <Stop offset="42%" stopColor="#0b1d44" />
            <Stop offset="70%" stopColor="#08132c" />
            <Stop offset="100%" stopColor="#030610" />
          </LinearGradient>

          {/* Top Emerald Canopy Atmospheric Aura */}
          <RadialGradient id="playerTopCanopyAura" cx="50%" cy="0%" r="65%">
            <Stop offset="0%" stopColor="#15803d" stopOpacity="0.22" />
            <Stop offset="45%" stopColor="#040817" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
          </RadialGradient>

          {/* Luminous Celestial Moon Aura */}
          <RadialGradient id="playerFixedMoonAura" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <Stop offset="30%" stopColor="#bae6fd" stopOpacity="0.45" />
            <Stop offset="65%" stopColor="#38bdf8" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#040817" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Full Viewport Sky Fill */}
        <Rect width="100%" height="100%" fill="url(#playerFixedSkyGrad)" />
        <Rect width="100%" height="240" fill="url(#playerTopCanopyAura)" />

        {/* Twinkling Golden & White Celestial Stars (Anchored) */}
        <Circle cx="35" cy="40" r="1.3" fill="#fbbf24" opacity="0.85" />
        <Circle cx="72" cy="75" r="1.1" fill="#ffffff" opacity="0.9" />
        <Circle cx="120" cy="35" r="1.4" fill="#fbbf24" opacity="0.8" />
        <Circle cx="160" cy="90" r="1" fill="#ffffff" opacity="0.75" />
        <Circle cx="205" cy="45" r="1.5" fill="#fbbf24" opacity="0.85" />
        <Circle cx="250" cy="70" r="1.1" fill="#ffffff" opacity="0.75" />
        <Circle cx="45" cy="140" r="1.2" fill="#ffffff" opacity="0.6" />
        <Circle cx="295" cy="150" r="1.3" fill="#fbbf24" opacity="0.7" />
        <Circle cx="75" cy="220" r="1.1" fill="#ffffff" opacity="0.65" />
        <Circle cx="270" cy="250" r="1.3" fill="#fbbf24" opacity="0.6" />
        <Circle cx="50" cy="360" r="1" fill="#ffffff" opacity="0.5" />
        <Circle cx="310" cy="380" r="1.2" fill="#fbbf24" opacity="0.55" />
        <Circle cx="180" cy="440" r="1" fill="#ffffff" opacity="0.45" />
        <Circle cx="85" cy="510" r="1.2" fill="#fbbf24" opacity="0.5" />
        <Circle cx="280" cy="530" r="1.1" fill="#ffffff" opacity="0.45" />

        {/* Crescent Moon on Upper Right */}
        <Circle cx="315" cy="55" r="22" fill="url(#playerFixedMoonAura)" />
        <Path
          d="M 307 39 A 15 15 0 1 0 325 63 A 13.5 13.5 0 0 1 307 39 Z"
          fill="#fef08a"
          opacity="0.98"
        />
      </Svg>

      {/* 2. Lower Gothic Castle Silhouette */}
      <View style={styles.fixedCastleWrap}>
        <Svg width="100%" height="95" viewBox="0 0 360 95" preserveAspectRatio="none">
          {/* Castle Walls & Turrets */}
          <Path
            d="M 0 95 L 0 45 L 45 45 L 45 32 L 68 8 L 92 32 L 92 45 L 135 45 L 135 18 L 180 0 L 225 18 L 225 45 L 268 45 L 268 32 L 292 8 L 315 32 L 315 45 L 360 45 L 360 95 Z"
            fill="#050c18"
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fixedBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  fixedCastleWrap: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    zIndex: 1,
    opacity: 0.95,
  },
});
