import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Ellipse,
  Path,
  Circle,
  Polygon,
  Line,
  G,
  Text as SvgText,
} from 'react-native-svg';

interface CampusBackgroundProps {
  overlayBlur?: boolean;
  dimAmount?: 'none' | 'subtle' | 'medium' | 'heavy';
  children?: React.ReactNode;
  style?: object;
  artworkOpacity?: number;
}

export const CampusBackground: React.FC<CampusBackgroundProps> = ({
  overlayBlur = true,
  dimAmount = 'subtle',
  children,
  style,
  artworkOpacity,
}) => {
  const dimColorMap = {
    none: 'transparent',
    subtle: 'rgba(4, 8, 23, 0.72)',
    medium: 'rgba(4, 8, 23, 0.85)',
    heavy: 'rgba(4, 8, 23, 0.94)',
  };

  const bgOpacity = artworkOpacity !== undefined ? artworkOpacity : 1;

  return (
    <View style={[styles.container, style]}>
      {/* ------------------------------------------------------------------ */}
      {/* HIGH-FIDELITY GOTHIC MIDNIGHT CAMPUS QUEST VECTOR ARTWORK SVG      */}
      {/* Perfectly matching the Splash Screen atmospheric theme             */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.svgWrapper, { opacity: bgOpacity }]} pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 540 960"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            {/* Deep Midnight Obsidian Sky Gradient */}
            <LinearGradient id="bgNightSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#040817" />
              <Stop offset="22%" stopColor="#07122e" />
              <Stop offset="50%" stopColor="#0b1b42" />
              <Stop offset="75%" stopColor="#091328" />
              <Stop offset="100%" stopColor="#03060f" />
            </LinearGradient>

            {/* Celestial Crescent Moon Halo */}
            <RadialGradient id="bgMoonAura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <Stop offset="30%" stopColor="#bae6fd" stopOpacity="0.65" />
              <Stop offset="65%" stopColor="#38bdf8" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </RadialGradient>

            {/* Glowing Vintage Street Lantern Flare */}
            <RadialGradient id="bgLanternFlare" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="22%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="48%" stopColor="#f59e0b" stopOpacity="0.7" />
              <Stop offset="78%" stopColor="#d97706" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </RadialGradient>

            {/* Distant Courtyard Lantern Glow */}
            <RadialGradient id="bgMidLanternGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <Stop offset="40%" stopColor="#f59e0b" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>

            {/* Clock Tower Glowing Portal & Windows */}
            <RadialGradient id="bgPortalLight" cx="50%" cy="80%" r="60%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="25%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="55%" stopColor="#f59e0b" stopOpacity="0.6" />
              <Stop offset="85%" stopColor="#b45309" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>

            {/* Clock Face Glow */}
            <RadialGradient id="bgClockFaceGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="45%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="80%" stopColor="#f59e0b" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#b45309" stopOpacity="0.3" />
            </RadialGradient>

            {/* Ivy Vine Leaves Gradient */}
            <LinearGradient id="bgIvyLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#86efac" />
              <Stop offset="35%" stopColor="#4ade80" />
              <Stop offset="75%" stopColor="#16a34a" />
              <Stop offset="100%" stopColor="#14532d" />
            </LinearGradient>

            {/* Rustic Wooden Signpost Planks */}
            <LinearGradient id="bgWoodPlankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#78350f" />
              <Stop offset="25%" stopColor="#5c2609" />
              <Stop offset="70%" stopColor="#451a03" />
              <Stop offset="100%" stopColor="#270e02" />
            </LinearGradient>

            {/* Crimson Collegiate Pennant Banner Gradient */}
            <LinearGradient id="bgBannerCrimsonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#881337" />
              <Stop offset="35%" stopColor="#70102b" />
              <Stop offset="75%" stopColor="#4c0519" />
              <Stop offset="100%" stopColor="#29020d" />
            </LinearGradient>

            {/* Banner Gold Embroidered Crest Gradient */}
            <LinearGradient id="bgCrestGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fffbeb" />
              <Stop offset="30%" stopColor="#fde047" />
              <Stop offset="70%" stopColor="#eab308" />
              <Stop offset="100%" stopColor="#92400e" />
            </LinearGradient>

            {/* Stone Pillar Bricks Gradient */}
            <LinearGradient id="bgStoneBrickGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#64748b" />
              <Stop offset="40%" stopColor="#475569" />
              <Stop offset="80%" stopColor="#334155" />
              <Stop offset="100%" stopColor="#1e293b" />
            </LinearGradient>

            {/* Cobblestone Paver Warm Amber Reflection */}
            <RadialGradient id="bgPathAmberGlow" cx="40%" cy="85%" r="50%">
              <Stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <Stop offset="40%" stopColor="#b45309" stopOpacity="0.25" />
              <Stop offset="80%" stopColor="#451a03" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* 1. NIGHT SKY & CELESTIAL ELEMENTS */}
          <Rect width="540" height="960" fill="url(#bgNightSkyGrad)" />

          {/* Twinkling Stars in Upper Sky */}
          <G fill="#ffffff">
            <Circle cx="120" cy="90" r="1.4" opacity="0.9" />
            <Circle cx="160" cy="65" r="1.8" opacity="0.95" />
            <Circle cx="210" cy="110" r="1.2" opacity="0.85" />
            <Circle cx="250" cy="80" r="2.2" opacity="1" />
            <Circle cx="320" cy="95" r="1.5" opacity="0.9" />
            <Circle cx="380" cy="70" r="2" opacity="0.95" />
            <Circle cx="420" cy="115" r="1.3" opacity="0.8" />
            <Circle cx="80" cy="140" r="1.2" opacity="0.75" />
            <Circle cx="450" cy="160" r="1.4" opacity="0.85" />
            <Circle cx="290" cy="50" r="1.6" opacity="0.9" />
            <Circle cx="350" cy="130" r="1.1" opacity="0.7" />
            <Circle cx="70" cy="220" r="1.3" opacity="0.6" />
            <Circle cx="470" cy="240" r="1.5" opacity="0.6" />
          </G>

          {/* Glowing Aura Behind Crescent Moon */}
          <Circle cx="295" cy="120" r="60" fill="url(#bgMoonAura)" opacity="0.85" />

          {/* Luminous Crescent Moon */}
          <G transform="translate(270, 95)">
            <Path
              d="M 12 18 C 30 18 46 32 46 52 C 46 64 39 74 30 80 C 44 76 56 62 56 46 C 56 22 36 2 12 2 C 8 2 4 3 0 4 C 5 8 10 13 12 18 Z"
              fill="#f8fafc"
            />
            <Path
              d="M 16 18 C 32 18 48 32 48 52 C 48 60 44 68 38 73 C 44 67 48 58 48 48 C 48 28 32 10 14 6 C 14 10 15 14 16 18 Z"
              fill="#e0f2fe"
              opacity="0.7"
            />
          </G>

          {/* Soft Night Mist Clouds across Lower Sky */}
          <G opacity="0.25">
            <Ellipse cx="160" cy="160" rx="120" ry="24" fill="#64748b" />
            <Ellipse cx="380" cy="175" rx="140" ry="28" fill="#475569" />
            <Ellipse cx="270" cy="190" rx="160" ry="32" fill="#334155" />
            <Ellipse cx="100" cy="220" rx="90" ry="20" fill="#1e293b" />
            <Ellipse cx="440" cy="230" rx="110" ry="22" fill="#1e293b" />
          </G>

          {/* 2. BACKGROUND COLLEGIATE GOTHIC CAMPUS & CLOCK TOWER */}
          <G transform="translate(0, 340)">
            {/* Central Light Aura behind the Main Clock Tower */}
            <Circle cx="270" cy="180" r="150" fill="url(#bgPortalLight)" opacity="0.7" />

            {/* Left Academic Wing Silhouette */}
            <Polygon points="120,240 120,180 150,150 180,180 180,240" fill="#0f172a" />
            <Rect x="130" y="190" width="120" height="90" fill="#0f172a" />
            <Polygon points="130,190 190,120 250,190" fill="#0b1120" />
            <Polygon points="160,155 190,120 220,155" fill="#020617" />
            <Rect x="165" y="110" width="6" height="24" fill="#020617" />
            <Polygon points="163,110 168,96 173,110" fill="#020617" />

            {/* Right Academic Wing Silhouette */}
            <Rect x="290" y="190" width="120" height="90" fill="#0f172a" />
            <Polygon points="290,190 350,120 410,190" fill="#0b1120" />
            <Rect x="365" y="110" width="6" height="24" fill="#020617" />
            <Polygon points="363,110 368,96 373,110" fill="#020617" />
            <Polygon points="380,240 380,180 410,150 440,180 440,240" fill="#0f172a" />

            {/* Grand Central Gothic Clock Tower */}
            <Rect x="235" y="140" width="70" height="140" fill="#0f172a" />
            <Rect x="240" y="80" width="60" height="65" fill="#0b1120" />
            <Polygon points="236,80 270,30 304,80" fill="#020617" />
            <Polygon points="255,35 270,-15 285,35" fill="#020617" />
            <Line x1="270" y1="-15" x2="270" y2="-28" stroke="#020617" strokeWidth="2.5" />
            <Circle cx="270" cy="-28" r="3" fill="#facc15" />
            <Polygon points="236,80 240,65 244,80" fill="#020617" />
            <Polygon points="296,80 300,65 304,80" fill="#020617" />

            {/* Illuminated Windows on Left Wing */}
            <G fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8">
              <Rect x="160" y="170" width="10" height="16" rx="4" />
              <Rect x="185" y="170" width="10" height="16" rx="4" />
              <Rect x="210" y="170" width="10" height="16" rx="4" />
              <Rect x="160" y="200" width="10" height="14" rx="2" />
              <Rect x="185" y="200" width="10" height="14" rx="2" />
              <Rect x="210" y="200" width="10" height="14" rx="2" />
              <Rect x="160" y="225" width="10" height="14" rx="2" />
              <Rect x="185" y="225" width="10" height="14" rx="2" />
              <Rect x="210" y="225" width="10" height="14" rx="2" />
            </G>

            {/* Illuminated Windows on Right Wing */}
            <G fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8">
              <Rect x="320" y="170" width="10" height="16" rx="4" />
              <Rect x="345" y="170" width="10" height="16" rx="4" />
              <Rect x="370" y="170" width="10" height="16" rx="4" />
              <Rect x="320" y="200" width="10" height="14" rx="2" />
              <Rect x="345" y="200" width="10" height="14" rx="2" />
              <Rect x="370" y="200" width="10" height="14" rx="2" />
              <Rect x="320" y="225" width="10" height="14" rx="2" />
              <Rect x="345" y="225" width="10" height="14" rx="2" />
              <Rect x="370" y="225" width="10" height="14" rx="2" />
            </G>

            {/* Clock Tower Illuminated Arched Windows */}
            <G fill="#fde047" stroke="#ca8a04" strokeWidth="0.8">
              <Rect x="255" y="130" width="10" height="18" rx="4" />
              <Rect x="275" y="130" width="10" height="18" rx="4" />
              <Rect x="255" y="165" width="10" height="18" rx="4" />
              <Rect x="275" y="165" width="10" height="18" rx="4" />
              <Rect x="255" y="200" width="10" height="18" rx="4" />
              <Rect x="275" y="200" width="10" height="18" rx="4" />
            </G>

            {/* Glowing Clock Face on Central Tower (Reading Midnight) */}
            <G transform="translate(270, 75)">
              <Circle cx="0" cy="0" r="24" fill="url(#bgClockFaceGlow)" opacity="0.9" />
              <Circle cx="0" cy="0" r="16" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
              <Circle cx="0" cy="0" r="13" fill="#ffffff" />
              <Line x1="0" y1="-12" x2="0" y2="-9" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="0" y1="9" x2="0" y2="12" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="-12" y1="0" x2="-9" y2="0" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="9" y1="0" x2="12" y2="0" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="0" y1="0" x2="0" y2="-10" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
              <Line x1="0" y1="0" x2="2" y2="-8" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" />
              <Circle cx="0" cy="0" r="2" fill="#d97706" />
            </G>

            {/* Grand Illuminated Entrance Portal Arch */}
            <G transform="translate(270, 260)">
              <Ellipse cx="0" cy="20" rx="36" ry="18" fill="url(#bgPortalLight)" />
              <Path d="M -18 20 L -18 2 C -18 -12 18 -12 18 2 L 18 20 Z" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
              <Path d="M -14 20 L -14 3 C -14 -8 14 -8 14 3 L 14 20 Z" fill="#fef08a" />
              <Line x1="0" y1="-7" x2="0" y2="20" stroke="#b45309" strokeWidth="1.2" />
              <Line x1="-14" y1="8" x2="14" y2="8" stroke="#b45309" strokeWidth="1" />
            </G>

            {/* Middle Ground Distant Courtyard Lanterns */}
            <G transform="translate(225, 265)">
              <Circle cx="0" cy="0" r="14" fill="url(#bgMidLanternGlow)" />
              <Line x1="0" y1="0" x2="0" y2="15" stroke="#0f172a" strokeWidth="1.8" />
              <Polygon points="-3,0 0,-5 3,0" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            </G>
            <G transform="translate(315, 265)">
              <Circle cx="0" cy="0" r="14" fill="url(#bgMidLanternGlow)" />
              <Line x1="0" y1="0" x2="0" y2="15" stroke="#0f172a" strokeWidth="1.8" />
              <Polygon points="-3,0 0,-5 3,0" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            </G>
          </G>

          {/* 3. COBBLESTONE PATHWAY IN FOREGROUND */}
          <G transform="translate(0, 600)">
            <Polygon points="0,0 200,0 120,360 0,360" fill="#061f14" />
            <Polygon points="340,0 540,0 540,360 420,360" fill="#061f14" />
            <Path
              d="M 200 0 Q 270 20 340 0 L 460 360 Q 270 380 80 360 Z"
              fill="#1e293b"
            />
            <Path
              d="M 200 0 Q 270 20 340 0 L 460 360 Q 270 380 80 360 Z"
              fill="url(#bgPathAmberGlow)"
            />

            {/* Chiseled Stone Flagstones in Perspective */}
            <G stroke="#0f172a" strokeWidth="1.5" fill="#334155" opacity="0.85">
              <Path d="M 220 15 L 245 10 L 265 18 L 240 24 Z" />
              <Path d="M 250 10 L 280 8 L 295 18 L 268 18 Z" />
              <Path d="M 285 8 L 315 12 L 320 22 L 298 18 Z" />

              <Path d="M 205 32 L 235 28 L 255 42 L 220 45 Z" />
              <Path d="M 240 28 L 275 25 L 290 40 L 258 42 Z" />
              <Path d="M 280 25 L 320 28 L 330 45 L 294 40 Z" />

              <Path d="M 190 55 L 230 50 L 250 72 L 205 76 Z" />
              <Path d="M 235 50 L 285 46 L 305 70 L 255 72 Z" />
              <Path d="M 290 46 L 335 50 L 345 74 L 310 70 Z" />

              <Path d="M 175 88 L 225 80 L 245 110 L 190 116 Z" />
              <Path d="M 230 80 L 290 76 L 315 108 L 250 110 Z" />
              <Path d="M 295 76 L 350 82 L 365 112 L 320 108 Z" />

              <Path d="M 155 130 L 215 122 L 238 160 L 170 168 Z" fill="#475569" />
              <Path d="M 220 122 L 295 116 L 325 158 L 244 160 Z" fill="#52525b" />
              <Path d="M 302 116 L 370 124 L 388 162 L 332 158 Z" fill="#475569" />

              <Path d="M 130 185 L 205 174 L 230 225 L 145 235 Z" fill="#52525b" />
              <Path d="M 212 174 L 305 166 L 340 220 L 238 225 Z" fill="#713f12" opacity="0.9" />
              <Path d="M 312 166 L 395 176 L 415 228 L 348 220 Z" fill="#475569" />

              <Path d="M 100 255 L 195 242 L 225 315 L 115 330 Z" fill="#475569" />
              <Path d="M 202 242 L 325 230 L 365 310 L 234 315 Z" fill="#854d0e" />
              <Path d="M 332 230 L 435 245 L 460 320 L 372 310 Z" fill="#52525b" />
            </G>

            {/* Scattered Autumn Golden Leaves */}
            <G fill="#f59e0b" stroke="#78350f" strokeWidth="0.8">
              <Polygon points="195,145 205,140 200,152 190,148" />
              <Polygon points="280,185 292,180 286,194 274,188" fill="#ea580c" />
              <Polygon points="350,150 360,145 355,158 344,152" fill="#eab308" />
              <Polygon points="160,265 174,258 168,274 154,268" fill="#f59e0b" />
              <Polygon points="260,280 275,270 268,290 252,282" fill="#d97706" />
              <Polygon points="410,285 424,278 418,295 404,288" fill="#ea580c" />
            </G>
          </G>

          {/* 4. LEFT FOREGROUND: STREET LANTERN & WOODEN SIGNPOST */}
          <G transform="translate(85, 410)">
            <Circle cx="0" cy="0" r="95" fill="url(#bgLanternFlare)" opacity="0.95" />
            <Polygon points="-14,-42 0,-62 14,-42" fill="#0f172a" stroke="#020617" strokeWidth="2" />
            <Circle cx="0" cy="-62" r="4" fill="#facc15" />
            <Rect x="-18" y="-42" width="36" height="8" rx="2" fill="#1e293b" />
            <Polygon points="-22,-34 22,-34 16,22 -16,22" fill="#fef08a" stroke="#0f172a" strokeWidth="3" />
            <Ellipse cx="0" cy="-4" rx="10" ry="16" fill="#ffffff" />
            <Ellipse cx="0" cy="-4" rx="6" ry="10" fill="#fef08a" />
            <Line x1="0" y1="-34" x2="0" y2="22" stroke="#0f172a" strokeWidth="2.5" />
            <Line x1="-22" y1="-34" x2="-16" y2="22" stroke="#0f172a" strokeWidth="2.5" />
            <Line x1="22" y1="-34" x2="16" y2="22" stroke="#0f172a" strokeWidth="2.5" />
            <Polygon points="-16,22 16,22 8,36 -8,36" fill="#0f172a" />
            <Rect x="-5" y="36" width="10" height="240" fill="#0f172a" />
            <Rect x="-8" y="80" width="16" height="8" rx="2" fill="#1e293b" />
            <Rect x="-8" y="160" width="16" height="8" rx="2" fill="#1e293b" />
            <Polygon points="-16,260 16,260 24,285 -24,285" fill="#0f172a" />
          </G>

          {/* Rustic Dark Wood Directional Signpost */}
          <G transform="translate(130, 640)">
            <Rect x="-10" y="-80" width="20" height="240" rx="3" fill="url(#bgWoodPlankGrad)" stroke="#1c1917" strokeWidth="2" />
            <Line x1="-2" y1="-80" x2="-2" y2="160" stroke="#78350f" strokeWidth="1.5" />

            {/* SIGN 1: EXPLORE */}
            <G transform="translate(-10, -50)">
              <Polygon
                points="-105,0 -80,-20 30,-20 30,20 -80,20"
                fill="url(#bgWoodPlankGrad)"
                stroke="#1c1917"
                strokeWidth="2.5"
              />
              <Polygon
                points="-98,0 -76,-15 24,-15 24,15 -76,15"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              <Circle cx="-74" cy="0" r="2.5" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="20" cy="-10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="20" cy="10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <G transform="translate(-62, -8)">
                <Circle cx="0" cy="8" r="6" fill="none" stroke="#fde047" strokeWidth="2" />
                <Line x1="4" y1="12" x2="9" y2="17" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" />
              </G>
              <SvgText
                x="-14"
                y="6"
                fontSize="15"
                fontWeight="900"
                fill="#fef08a"
                fontFamily="Outfit, sans-serif"
                letterSpacing="1.5"
                textAnchor="middle"
              >
                EXPLORE
              </SvgText>
            </G>

            {/* SIGN 2: SOLVE */}
            <G transform="translate(-10, 0)">
              <Polygon
                points="-95,0 -70,-20 35,-20 35,20 -70,20"
                fill="url(#bgWoodPlankGrad)"
                stroke="#1c1917"
                strokeWidth="2.5"
              />
              <Polygon
                points="-88,0 -66,-15 29,-15 29,15 -66,15"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              <Circle cx="-64" cy="0" r="2.5" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="25" cy="-10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="25" cy="10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <G transform="translate(-52, -2)">
                <Rect x="-5" y="-5" width="10" height="10" rx="1.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
                <Circle cx="0" cy="-5" r="2" fill="#fde047" />
                <Circle cx="5" cy="0" r="2" fill="#fde047" />
              </G>
              <SvgText
                x="-10"
                y="6"
                fontSize="15"
                fontWeight="900"
                fill="#fef08a"
                fontFamily="Outfit, sans-serif"
                letterSpacing="1.5"
                textAnchor="middle"
              >
                SOLVE
              </SvgText>
            </G>

            {/* SIGN 3: DISCOVER */}
            <G transform="translate(-10, 50)">
              <Polygon
                points="-110,0 -85,-20 28,-20 28,20 -85,20"
                fill="url(#bgWoodPlankGrad)"
                stroke="#1c1917"
                strokeWidth="2.5"
              />
              <Polygon
                points="-103,0 -81,-15 22,-15 22,15 -81,15"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              <Circle cx="-78" cy="0" r="2.5" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="18" cy="-10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="18" cy="10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <G transform="translate(-68, -4)">
                <Rect x="-6" y="-4" width="12" height="9" rx="1" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
                <Line x1="-2" y1="-4" x2="-2" y2="5" stroke="#78350f" strokeWidth="0.8" />
                <Line x1="2" y1="-4" x2="2" y2="5" stroke="#78350f" strokeWidth="0.8" />
              </G>
              <SvgText
                x="-18"
                y="6"
                fontSize="14"
                fontWeight="900"
                fill="#fef08a"
                fontFamily="Outfit, sans-serif"
                letterSpacing="1.5"
                textAnchor="middle"
              >
                DISCOVER
              </SvgText>
            </G>
          </G>

          {/* 5. RIGHT FOREGROUND: STONE PILLAR & CRIMSON BANNER */}
          <G transform="translate(450, 600)">
            <Polygon points="-40,-120 40,-120 50,-105 -50,-105" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
            <Rect x="-45" y="-105" width="90" height="15" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            <Rect x="-40" y="-90" width="80" height="280" fill="url(#bgStoneBrickGrad)" stroke="#0f172a" strokeWidth="2.5" />

            <G stroke="#0f172a" strokeWidth="1.8">
              <Line x1="-40" y1="-55" x2="40" y2="-55" />
              <Line x1="-40" y1="-20" x2="40" y2="-20" />
              <Line x1="-40" y1="15" x2="40" y2="15" />
              <Line x1="-40" y1="50" x2="40" y2="50" />
              <Line x1="-40" y1="85" x2="40" y2="85" />
              <Line x1="-40" y1="120" x2="40" y2="120" />
              <Line x1="-40" y1="155" x2="40" y2="155" />
              <Line x1="-15" y1="-90" x2="-15" y2="-55" />
              <Line x1="15" y1="-90" x2="15" y2="-55" />
              <Line x1="0" y1="-55" x2="0" y2="-20" />
              <Line x1="-20" y1="-20" x2="-20" y2="15" />
              <Line x1="20" y1="-20" x2="20" y2="15" />
              <Line x1="-5" y1="15" x2="-5" y2="50" />
              <Line x1="-25" y1="50" x2="-25" y2="85" />
              <Line x1="15" y1="50" x2="15" y2="85" />
            </G>

            <G fill="url(#bgIvyLeafGrad)" stroke="#052e16" strokeWidth="0.8">
              <Circle cx="-35" cy="-80" r="8" />
              <Circle cx="-28" cy="-72" r="6" />
              <Circle cx="-38" cy="-62" r="7" />
              <Circle cx="-30" cy="-45" r="8" />
              <Circle cx="-36" cy="-25" r="9" />
              <Circle cx="-26" cy="5" r="7" />
              <Circle cx="-34" cy="35" r="8" />
            </G>

            {/* Banner Rod */}
            <G transform="translate(-35, -70)">
              <Line x1="-75" y1="0" x2="15" y2="0" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
              <Circle cx="-75" cy="0" r="5" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
              <Circle cx="15" cy="0" r="4" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
              <Rect x="-2" y="-6" width="6" height="12" rx="1" fill="#ca8a04" />
            </G>

            {/* Hanging Collegiate Crimson / Maroon Pennant Banner */}
            <G transform="translate(-68, -65)">
              <Polygon
                points="0,0 65,0 65,160 32.5,135 0,160"
                fill="url(#bgBannerCrimsonGrad)"
                stroke="#4c0519"
                strokeWidth="2.5"
              />
              <Polygon
                points="5,6 60,6 60,148 32.5,127 5,148"
                fill="none"
                stroke="url(#bgCrestGoldGrad)"
                strokeWidth="2"
              />
              <G transform="translate(32.5, 65)">
                <G transform="translate(0, -22)">
                  <Polygon points="-4,8 4,8 2,16 -2,16" fill="#ca8a04" />
                  <Path d="M 0 6 Q -6 -2 0 -10 Q 6 -2 0 6 Z" fill="#fde047" stroke="#ea580c" strokeWidth="0.8" />
                  <Path d="M 0 4 Q -3 0 0 -5 Q 3 0 0 4 Z" fill="#ffffff" />
                </G>
                <Path
                  d="M -16 6 C -24 -6 -18 -18 0 -22 C 18 -18 24 -6 16 6 C 22 18 12 28 0 28 C -12 28 -22 18 -16 6 Z"
                  fill="none"
                  stroke="url(#bgCrestGoldGrad)"
                  strokeWidth="2.5"
                />
                <Polygon
                  points="-14,-10 14,-10 14,8 0,20 -14,8"
                  fill="#4c0519"
                  stroke="url(#bgCrestGoldGrad)"
                  strokeWidth="2.2"
                />
                <SvgText
                  x="0"
                  y="6"
                  fontSize="18"
                  fontWeight="900"
                  fill="url(#bgCrestGoldGrad)"
                  fontFamily="'Cinzel', 'Outfit', serif"
                  textAnchor="middle"
                >
                  C
                </SvgText>
              </G>
              <Line x1="0" y1="160" x2="32.5" y2="135" stroke="#fde047" strokeWidth="2.5" />
              <Line x1="32.5" y1="135" x2="65" y2="160" stroke="#fde047" strokeWidth="2.5" />
              <Circle cx="32.5" cy="135" r="3" fill="#facc15" />
            </G>
          </G>

          {/* 6. OVERHANGING SILHOUETTE CANOPY LEAVES & TREES */}
          <G fill="#051c11" opacity="0.95">
            <Path d="M -20 -20 Q 60 40 140 10 Q 180 80 120 120 Q 40 90 -20 150 Z" />
            <Path d="M 0 100 Q 80 140 110 200 Q 30 220 -20 280 Z" />
            <Circle cx="60" cy="30" r="28" fill="#0a2a1b" />
            <Circle cx="110" cy="50" r="24" fill="#0d3522" />
            <Circle cx="150" cy="30" r="20" fill="#0a2a1b" />
            <Circle cx="90" cy="90" r="26" fill="#0d3522" />
            <Circle cx="40" cy="130" r="30" fill="#061f14" />
            <Circle cx="80" cy="160" r="22" fill="#0a2a1b" />
            <Circle cx="30" cy="220" r="28" fill="#061f14" />

            <Path d="M 560 -20 Q 480 40 400 10 Q 360 80 420 120 Q 500 90 560 150 Z" />
            <Path d="M 540 100 Q 460 140 430 200 Q 510 220 560 280 Z" />
            <Circle cx="480" cy="30" r="28" fill="#0a2a1b" />
            <Circle cx="430" cy="50" r="24" fill="#0d3522" />
            <Circle cx="390" cy="30" r="20" fill="#0a2a1b" />
            <Circle cx="450" cy="90" r="26" fill="#0d3522" />
            <Circle cx="500" cy="130" r="30" fill="#061f14" />
            <Circle cx="460" cy="160" r="22" fill="#0a2a1b" />
            <Circle cx="510" cy="220" r="28" fill="#061f14" />
          </G>

          {/* 7. FLOATING AMBIENT FIREFLY PARTICLES */}
          <G fill="#fde047">
            <Circle cx="110" cy="520" r="2.2" opacity="0.9" />
            <Circle cx="160" cy="480" r="1.5" opacity="0.7" />
            <Circle cx="210" cy="550" r="2.5" opacity="0.85" />
            <Circle cx="270" cy="520" r="1.8" opacity="0.8" />
            <Circle cx="330" cy="560" r="2" opacity="0.9" />
            <Circle cx="390" cy="510" r="1.6" opacity="0.75" />
            <Circle cx="140" cy="720" r="2" opacity="0.85" />
            <Circle cx="290" cy="760" r="2.2" opacity="0.9" />
            <Circle cx="360" cy="710" r="1.5" opacity="0.75" />
          </G>
        </Svg>
      </View>

      {/* Atmospheric Dimming Overlay for Perfect Text Contrast on In-App Pages */}
      {dimAmount !== 'none' && (
        <View
          style={[
            styles.dimOverlay,
            { backgroundColor: dimColorMap[dimAmount] },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Screen Foreground Content */}
      <View style={styles.contentContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#040817',
    position: 'relative',
    overflow: 'hidden',
  },
  svgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
});
