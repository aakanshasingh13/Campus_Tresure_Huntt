import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Path,
  Rect,
  Circle,
  Ellipse,
  Polygon,
  Line,
  Text as SvgText,
} from 'react-native-svg';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeSignHover, setActiveSignHover] = useState<string | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
        setIsReady(true);
      }
    }, 25);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.fullScreenContainer}>
      {/* Complete 9:16 High-Fidelity Vector Artwork Matching Exactly "CAMPUS QUEST" */}
      <View style={styles.svgWrapper} pointerEvents="box-none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 540 960"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            {/* Deep Midnight Sky Gradient */}
            <LinearGradient id="nightSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#040817" />
              <Stop offset="25%" stopColor="#081432" />
              <Stop offset="55%" stopColor="#0d1f4a" />
              <Stop offset="80%" stopColor="#091328" />
              <Stop offset="100%" stopColor="#040711" />
            </LinearGradient>

            {/* Radiant Crescent Moon Glow */}
            <RadialGradient id="moonAura" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="25%" stopColor="#e0f2fe" stopOpacity="0.8" />
              <Stop offset="60%" stopColor="#38bdf8" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </RadialGradient>

            {/* Glowing Vintage Street Lantern Amber Flare */}
            <RadialGradient id="lanternFlare" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="20%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="45%" stopColor="#f59e0b" stopOpacity="0.7" />
              <Stop offset="75%" stopColor="#d97706" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </RadialGradient>

            {/* Midground Lantern Halo */}
            <RadialGradient id="midLanternGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <Stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>

            {/* Clock Tower Glowing Windows & Entrance Warm Light */}
            <RadialGradient id="portalLight" cx="50%" cy="80%" r="60%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="25%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="55%" stopColor="#f59e0b" stopOpacity="0.6" />
              <Stop offset="85%" stopColor="#b45309" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>

            {/* Clock Face Glow */}
            <RadialGradient id="clockFaceGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <Stop offset="45%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="80%" stopColor="#f59e0b" stopOpacity="0.75" />
              <Stop offset="100%" stopColor="#b45309" stopOpacity="0.3" />
            </RadialGradient>

            {/* 3D Carved Gold Stone Title Top Surface Gradient */}
            <LinearGradient id="goldStoneSurface" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#fffbeb" />
              <Stop offset="15%" stopColor="#fef08a" />
              <Stop offset="45%" stopColor="#facc15" />
              <Stop offset="75%" stopColor="#eab308" />
              <Stop offset="100%" stopColor="#ca8a04" />
            </LinearGradient>

            {/* 3D Carved Stone Bevel / Shadow Gradient */}
            <LinearGradient id="goldStoneBevel" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ca8a04" />
              <Stop offset="30%" stopColor="#a16207" />
              <Stop offset="70%" stopColor="#713f12" />
              <Stop offset="100%" stopColor="#3b1d07" />
            </LinearGradient>

            {/* 3D Extrusion Side Wall Gradient */}
            <LinearGradient id="goldStoneExtrusion" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#854d0e" />
              <Stop offset="50%" stopColor="#582a08" />
              <Stop offset="100%" stopColor="#2c1404" />
            </LinearGradient>

            {/* Ivy Vine Leaves Gradient */}
            <LinearGradient id="ivyLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#86efac" />
              <Stop offset="35%" stopColor="#4ade80" />
              <Stop offset="75%" stopColor="#16a34a" />
              <Stop offset="100%" stopColor="#14532d" />
            </LinearGradient>

            {/* Dark Ivy Leaves */}
            <LinearGradient id="ivyDarkLeafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#22c55e" />
              <Stop offset="60%" stopColor="#15803d" />
              <Stop offset="100%" stopColor="#052e16" />
            </LinearGradient>

            {/* Rustic Wooden Signpost Planks */}
            <LinearGradient id="woodPlankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#78350f" />
              <Stop offset="25%" stopColor="#5c2609" />
              <Stop offset="70%" stopColor="#451a03" />
              <Stop offset="100%" stopColor="#270e02" />
            </LinearGradient>

            {/* Wooden Sign Highlight Border */}
            <LinearGradient id="woodBorderHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#a16207" />
              <Stop offset="50%" stopColor="#ca8a04" />
              <Stop offset="100%" stopColor="#78350f" />
            </LinearGradient>

            {/* Crimson Collegiate Pennant Banner Gradient */}
            <LinearGradient id="bannerCrimsonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#881337" />
              <Stop offset="35%" stopColor="#70102b" />
              <Stop offset="75%" stopColor="#4c0519" />
              <Stop offset="100%" stopColor="#29020d" />
            </LinearGradient>

            {/* Banner Gold Embroidered Crest Gradient */}
            <LinearGradient id="crestGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fffbeb" />
              <Stop offset="30%" stopColor="#fde047" />
              <Stop offset="70%" stopColor="#eab308" />
              <Stop offset="100%" stopColor="#92400e" />
            </LinearGradient>

            {/* Stone Pillar Bricks */}
            <LinearGradient id="stoneBrickGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#64748b" />
              <Stop offset="40%" stopColor="#475569" />
              <Stop offset="80%" stopColor="#334155" />
              <Stop offset="100%" stopColor="#1e293b" />
            </LinearGradient>

            {/* Cobblestone Paver Warm Reflection */}
            <RadialGradient id="pathAmberGlow" cx="40%" cy="85%" r="50%">
              <Stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <Stop offset="40%" stopColor="#b45309" stopOpacity="0.25" />
              <Stop offset="80%" stopColor="#451a03" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* ---------------------------------------------------- */}
          {/* 1. NIGHT SKY & CELESTIAL ELEMENTS */}
          {/* ---------------------------------------------------- */}
          <Rect width="540" height="960" fill="url(#nightSkyGrad)" />

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
          </G>

          {/* Glowing Aura Behind Crescent Moon */}
          <Circle cx="295" cy="120" r="60" fill="url(#moonAura)" opacity="0.85" />

          {/* Luminous Crescent Moon (Facing Upward-Left as in Artwork) */}
          <G transform="translate(270, 95)">
            <Path
              d="M 12 18 C 30 18 46 32 46 52 C 46 64 39 74 30 80 C 44 76 56 62 56 46 C 56 22 36 2 12 2 C 8 2 4 3 0 4 C 5 8 10 13 12 18 Z"
              fill="#f8fafc"
            />
            {/* Subtle Moon Inner Rim Glow */}
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

          {/* ---------------------------------------------------- */}
          {/* 2. BACKGROUND COLLEGIATE GOTHIC CAMPUS & CLOCK TOWER */}
          {/* ---------------------------------------------------- */}
          {/* Distant Campus Silhouette Building Complex */}
          <G transform="translate(0, 360)">
            {/* Central Light Aura behind the Main Clock Tower */}
            <Circle cx="270" cy="180" r="140" fill="url(#portalLight)" opacity="0.7" />

            {/* Left Academic Wing Silhouette */}
            <Polygon points="120,240 120,180 150,150 180,180 180,240" fill="#0f172a" />
            <Rect x="130" y="190" width="120" height="90" fill="#0f172a" />
            {/* Left Gables & Roofs */}
            <Polygon points="130,190 190,120 250,190" fill="#0b1120" />
            <Polygon points="160,155 190,120 220,155" fill="#020617" />
            {/* Left Roof Chimney / Small Spires */}
            <Rect x="165" y="110" width="6" height="24" fill="#020617" />
            <Polygon points="163,110 168,96 173,110" fill="#020617" />

            {/* Right Academic Wing Silhouette */}
            <Rect x="290" y="190" width="120" height="90" fill="#0f172a" />
            <Polygon points="290,190 350,120 410,190" fill="#0b1120" />
            {/* Right Roof Spires */}
            <Rect x="365" y="110" width="6" height="24" fill="#020617" />
            <Polygon points="363,110 368,96 373,110" fill="#020617" />
            <Polygon points="380,240 380,180 410,150 440,180 440,240" fill="#0f172a" />

            {/* Grand Central Gothic Clock Tower (Majestic Centerpiece) */}
            {/* Lower Base */}
            <Rect x="235" y="140" width="70" height="140" fill="#0f172a" />
            {/* Mid Belfry Section */}
            <Rect x="240" y="80" width="60" height="65" fill="#0b1120" />
            <Polygon points="236,80 270,30 304,80" fill="#020617" />
            {/* Central Spire Top & Finial */}
            <Polygon points="255,35 270,-15 285,35" fill="#020617" />
            <Line x1="270" y1="-15" x2="270" y2="-28" stroke="#020617" strokeWidth="2.5" />
            <Circle cx="270" cy="-28" r="3" fill="#facc15" />

            {/* Corner Turret Pinnacles on Tower */}
            <Polygon points="236,80 240,65 244,80" fill="#020617" />
            <Polygon points="296,80 300,65 304,80" fill="#020617" />

            {/* Illuminated Windows on Left Wing (Warm Glowing Arches & Grids) */}
            <G fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8">
              {/* Top Row Arched Windows */}
              <Rect x="160" y="170" width="10" height="16" rx="4" />
              <Rect x="185" y="170" width="10" height="16" rx="4" />
              <Rect x="210" y="170" width="10" height="16" rx="4" />
              {/* Mid Row Windows */}
              <Rect x="160" y="200" width="10" height="14" rx="2" />
              <Rect x="185" y="200" width="10" height="14" rx="2" />
              <Rect x="210" y="200" width="10" height="14" rx="2" />
              {/* Lower Row Windows */}
              <Rect x="160" y="225" width="10" height="14" rx="2" />
              <Rect x="185" y="225" width="10" height="14" rx="2" />
              <Rect x="210" y="225" width="10" height="14" rx="2" />
            </G>

            {/* Illuminated Windows on Right Wing */}
            <G fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8">
              {/* Top Row Arched Windows */}
              <Rect x="320" y="170" width="10" height="16" rx="4" />
              <Rect x="345" y="170" width="10" height="16" rx="4" />
              <Rect x="370" y="170" width="10" height="16" rx="4" />
              {/* Mid Row Windows */}
              <Rect x="320" y="200" width="10" height="14" rx="2" />
              <Rect x="345" y="200" width="10" height="14" rx="2" />
              <Rect x="370" y="200" width="10" height="14" rx="2" />
              {/* Lower Row Windows */}
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
              {/* Outer Amber Halo */}
              <Circle cx="0" cy="0" r="24" fill="url(#clockFaceGlow)" opacity="0.9" />
              {/* Beveled Rim */}
              <Circle cx="0" cy="0" r="16" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
              {/* Clock Face White Glow */}
              <Circle cx="0" cy="0" r="13" fill="#ffffff" />
              {/* Roman / Tick Marks */}
              <Line x1="0" y1="-12" x2="0" y2="-9" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="0" y1="9" x2="0" y2="12" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="-12" y1="0" x2="-9" y2="0" stroke="#713f12" strokeWidth="1.5" />
              <Line x1="9" y1="0" x2="12" y2="0" stroke="#713f12" strokeWidth="1.5" />
              {/* Hands pointing to Midnight (12:00) */}
              <Line x1="0" y1="0" x2="0" y2="-10" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
              <Line x1="0" y1="0" x2="2" y2="-8" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" />
              <Circle cx="0" cy="0" r="2" fill="#d97706" />
            </G>

            {/* Grand Illuminated Entrance Portal Arch */}
            <G transform="translate(270, 260)">
              {/* Bright Spilling Archway Light */}
              <Ellipse cx="0" cy="20" rx="36" ry="18" fill="url(#portalLight)" />
              {/* Arched Stone Frame */}
              <Path d="M -18 20 L -18 2 C -18 -12 18 -12 18 2 L 18 20 Z" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
              {/* Radiant Light Doors */}
              <Path d="M -14 20 L -14 3 C -14 -8 14 -8 14 3 L 14 20 Z" fill="#fef08a" />
              {/* Portal Grid Ironwork */}
              <Line x1="0" y1="-7" x2="0" y2="20" stroke="#b45309" strokeWidth="1.2" />
              <Line x1="-14" y1="8" x2="14" y2="8" stroke="#b45309" strokeWidth="1" />
            </G>

            {/* Middle Ground Distant Courtyard Lanterns */}
            <G transform="translate(225, 265)">
              <Circle cx="0" cy="0" r="14" fill="url(#midLanternGlow)" />
              <Line x1="0" y1="0" x2="0" y2="15" stroke="#0f172a" strokeWidth="1.8" />
              <Polygon points="-3,0 0,-5 3,0" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            </G>
            <G transform="translate(315, 265)">
              <Circle cx="0" cy="0" r="14" fill="url(#midLanternGlow)" />
              <Line x1="0" y1="0" x2="0" y2="15" stroke="#0f172a" strokeWidth="1.8" />
              <Polygon points="-3,0 0,-5 3,0" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            </G>
          </G>

          {/* ---------------------------------------------------- */}
          {/* 3. COBBLESTONE PATHWAY IN FOREGROUND */}
          {/* ---------------------------------------------------- */}
          <G transform="translate(0, 620)">
            {/* Background Lawn Borders */}
            <Polygon points="0,0 200,0 120,340 0,340" fill="#061f14" />
            <Polygon points="340,0 540,0 540,340 420,340" fill="#061f14" />

            {/* Main Curved Cobblestone / Flagstone Path */}
            <Path
              d="M 200 0 Q 270 20 340 0 L 460 340 Q 270 360 80 340 Z"
              fill="#1e293b"
            />

            {/* Warm Lantern Light Spill over Cobblestones */}
            <Path
              d="M 200 0 Q 270 20 340 0 L 460 340 Q 270 360 80 340 Z"
              fill="url(#pathAmberGlow)"
            />

            {/* Individual Chiseled Stone Flagstones in Perspective */}
            {/* Top Distant Stone Row */}
            <G stroke="#0f172a" strokeWidth="1.5" fill="#334155" opacity="0.85">
              <Path d="M 220 15 L 245 10 L 265 18 L 240 24 Z" />
              <Path d="M 250 10 L 280 8 L 295 18 L 268 18 Z" />
              <Path d="M 285 8 L 315 12 L 320 22 L 298 18 Z" />

              {/* Row 2 */}
              <Path d="M 205 32 L 235 28 L 255 42 L 220 45 Z" />
              <Path d="M 240 28 L 275 25 L 290 40 L 258 42 Z" />
              <Path d="M 280 25 L 320 28 L 330 45 L 294 40 Z" />

              {/* Row 3 */}
              <Path d="M 190 55 L 230 50 L 250 72 L 205 76 Z" />
              <Path d="M 235 50 L 285 46 L 305 70 L 255 72 Z" />
              <Path d="M 290 46 L 335 50 L 345 74 L 310 70 Z" />

              {/* Row 4 */}
              <Path d="M 175 88 L 225 80 L 245 110 L 190 116 Z" />
              <Path d="M 230 80 L 290 76 L 315 108 L 250 110 Z" />
              <Path d="M 295 76 L 350 82 L 365 112 L 320 108 Z" />

              {/* Row 5 */}
              <Path d="M 155 130 L 215 122 L 238 160 L 170 168 Z" fill="#475569" />
              <Path d="M 220 122 L 295 116 L 325 158 L 244 160 Z" fill="#52525b" />
              <Path d="M 302 116 L 370 124 L 388 162 L 332 158 Z" fill="#475569" />

              {/* Row 6 (Foreground Large Pavers) */}
              <Path d="M 130 185 L 205 174 L 230 225 L 145 235 Z" fill="#52525b" />
              <Path d="M 212 174 L 305 166 L 340 220 L 238 225 Z" fill="#713f12" opacity="0.9" />
              <Path d="M 312 166 L 395 176 L 415 228 L 348 220 Z" fill="#475569" />

              {/* Row 7 (Massive Base Cobblestones) */}
              <Path d="M 100 255 L 195 242 L 225 315 L 115 330 Z" fill="#475569" />
              <Path d="M 202 242 L 325 230 L 365 310 L 234 315 Z" fill="#854d0e" />
              <Path d="M 332 230 L 435 245 L 460 320 L 372 310 Z" fill="#52525b" />
            </G>

            {/* Scattered Autumn Golden Leaves on Path */}
            <G fill="#f59e0b" stroke="#78350f" strokeWidth="0.8">
              {/* Leaf 1 */}
              <Polygon points="195,145 205,140 200,152 190,148" />
              {/* Leaf 2 */}
              <Polygon points="280,185 292,180 286,194 274,188" fill="#ea580c" />
              {/* Leaf 3 */}
              <Polygon points="350,150 360,145 355,158 344,152" fill="#eab308" />
              {/* Leaf 4 */}
              <Polygon points="160,265 174,258 168,274 154,268" fill="#f59e0b" />
              {/* Leaf 5 */}
              <Polygon points="260,280 275,270 268,290 252,282" fill="#d97706" />
              {/* Leaf 6 */}
              <Polygon points="410,285 424,278 418,295 404,288" fill="#ea580c" />
            </G>
          </G>

          {/* ---------------------------------------------------- */}
          {/* 4. LEFT FOREGROUND: STREET LANTERN & WOODEN SIGNPOST */}
          {/* ---------------------------------------------------- */}
          {/* Antique Wrought-Iron Street Lamp on Left */}
          <G transform="translate(85, 410)">
            {/* Radiant Street Lantern Ambient Flare */}
            <Circle cx="0" cy="0" r="95" fill="url(#lanternFlare)" opacity="0.95" />

            {/* Lamp Post Top Spire & Crown Cap */}
            <Polygon points="-14,-42 0,-62 14,-42" fill="#0f172a" stroke="#020617" strokeWidth="2" />
            <Circle cx="0" cy="-62" r="4" fill="#facc15" />
            <Rect x="-18" y="-42" width="36" height="8" rx="2" fill="#1e293b" />

            {/* 4-Sided Lantern Glass Housing with Glowing Flame */}
            <Polygon points="-22,-34 22,-34 16,22 -16,22" fill="#fef08a" stroke="#0f172a" strokeWidth="3" />
            {/* Glowing Internal Filament */}
            <Ellipse cx="0" cy="-4" rx="10" ry="16" fill="#ffffff" />
            <Ellipse cx="0" cy="-4" rx="6" ry="10" fill="#fef08a" />
            {/* Glass Corner Ribs */}
            <Line x1="0" y1="-34" x2="0" y2="22" stroke="#0f172a" strokeWidth="2.5" />
            <Line x1="-22" y1="-34" x2="-16" y2="22" stroke="#0f172a" strokeWidth="2.5" />
            <Line x1="22" y1="-34" x2="16" y2="22" stroke="#0f172a" strokeWidth="2.5" />

            {/* Lantern Base Collar */}
            <Polygon points="-16,22 16,22 8,36 -8,36" fill="#0f172a" />
            {/* Lamp Post Cast Iron Pole */}
            <Rect x="-5" y="36" width="10" height="240" fill="#0f172a" />
            <Rect x="-8" y="80" width="16" height="8" rx="2" fill="#1e293b" />
            <Rect x="-8" y="160" width="16" height="8" rx="2" fill="#1e293b" />
            {/* Base Pedestal on Ground */}
            <Polygon points="-16,260 16,260 24,285 -24,285" fill="#0f172a" />
          </G>

          {/* Rustic Dark Wood Directional Signpost (EXPLORE, SOLVE, DISCOVER) */}
          <G transform="translate(130, 640)">
            {/* Main Vertical Wooden Post */}
            <Rect x="-10" y="-80" width="20" height="240" rx="3" fill="url(#woodPlankGrad)" stroke="#1c1917" strokeWidth="2" />
            <Line x1="-2" y1="-80" x2="-2" y2="160" stroke="#78350f" strokeWidth="1.5" />

            {/* SIGN 1: TOP ARROW -> 'EXPLORE' (Pointing Left) */}
            <G transform="translate(-10, -50)">
              {/* Wooden Arrow Plank */}
              <Polygon
                points="-105,0 -80,-20 30,-20 30,20 -80,20"
                fill="url(#woodPlankGrad)"
                stroke="#1c1917"
                strokeWidth="2.5"
              />
              {/* Inner Carved Border */}
              <Polygon
                points="-98,0 -76,-15 24,-15 24,15 -76,15"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              {/* Metallic Rivet Studs */}
              <Circle cx="-74" cy="0" r="2.5" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="20" cy="-10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="20" cy="10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />

              {/* Icon & Text: 🔍 EXPLORE */}
              <G transform="translate(-62, -8)">
                {/* Magnifying Glass Icon */}
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

            {/* SIGN 2: MIDDLE ARROW -> 'SOLVE' (Pointing Left) */}
            <G transform="translate(-10, 0)">
              {/* Wooden Arrow Plank */}
              <Polygon
                points="-95,0 -70,-20 35,-20 35,20 -70,20"
                fill="url(#woodPlankGrad)"
                stroke="#1c1917"
                strokeWidth="2.5"
              />
              {/* Inner Carved Border */}
              <Polygon
                points="-88,0 -66,-15 29,-15 29,15 -66,15"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              {/* Metallic Rivet Studs */}
              <Circle cx="-64" cy="0" r="2.5" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="25" cy="-10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="25" cy="10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />

              {/* Puzzle Icon & Text: 🧩 SOLVE */}
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

            {/* SIGN 3: BOTTOM ARROW -> 'DISCOVER' (Pointing Left) */}
            <G transform="translate(-10, 50)">
              {/* Wooden Arrow Plank */}
              <Polygon
                points="-110,0 -85,-20 28,-20 28,20 -85,20"
                fill="url(#woodPlankGrad)"
                stroke="#1c1917"
                strokeWidth="2.5"
              />
              {/* Inner Carved Border */}
              <Polygon
                points="-103,0 -81,-15 22,-15 22,15 -81,15"
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              {/* Metallic Rivet Studs */}
              <Circle cx="-78" cy="0" r="2.5" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="18" cy="-10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />
              <Circle cx="18" cy="10" r="2" fill="#ca8a04" stroke="#451a03" strokeWidth="0.8" />

              {/* Map/Chest Icon & Text: 🗺️ DISCOVER */}
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

            {/* Ground Bush, Ferns & Stones at Base of Signpost */}
            <G transform="translate(-30, 130)">
              <Ellipse cx="20" cy="15" rx="35" ry="14" fill="#041f12" />
              {/* Fern leaves */}
              <Path d="M 0 10 Q -20 -15 -35 -5 Q -20 0 0 10 Z" fill="#16a34a" />
              <Path d="M 10 10 Q 0 -25 -10 -20 Q 0 -5 10 10 Z" fill="#22c55e" />
              <Path d="M 25 10 Q 35 -20 50 -10 Q 35 0 25 10 Z" fill="#15803d" />
              {/* Ground Stone */}
              <Ellipse cx="-15" cy="14" rx="12" ry="6" fill="#334155" stroke="#1e293b" strokeWidth="1" />
              <Ellipse cx="40" cy="16" rx="10" ry="5" fill="#475569" stroke="#1e293b" strokeWidth="1" />
            </G>
          </G>

          {/* ---------------------------------------------------- */}
          {/* 5. RIGHT FOREGROUND: STONE PILLAR & CRIMSON BANNER */}
          {/* ---------------------------------------------------- */}
          <G transform="translate(450, 600)">
            {/* Weathered Stone Pillar Cap */}
            <Polygon points="-40,-120 40,-120 50,-105 -50,-105" fill="#64748b" stroke="#1e293b" strokeWidth="2" />
            <Rect x="-45" y="-105" width="90" height="15" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />

            {/* Main Stone Brick Column Body */}
            <Rect x="-40" y="-90" width="80" height="280" fill="url(#stoneBrickGrad)" stroke="#0f172a" strokeWidth="2.5" />

            {/* Horizontal Stone Mortar Grooves */}
            <G stroke="#0f172a" strokeWidth="1.8">
              <Line x1="-40" y1="-55" x2="40" y2="-55" />
              <Line x1="-40" y1="-20" x2="40" y2="-20" />
              <Line x1="-40" y1="15" x2="40" y2="15" />
              <Line x1="-40" y1="50" x2="40" y2="50" />
              <Line x1="-40" y1="85" x2="40" y2="85" />
              <Line x1="-40" y1="120" x2="40" y2="120" />
              <Line x1="-40" y1="155" x2="40" y2="155" />

              {/* Vertical Brick Joints */}
              <Line x1="-15" y1="-90" x2="-15" y2="-55" />
              <Line x1="15" y1="-90" x2="15" y2="-55" />
              <Line x1="0" y1="-55" x2="0" y2="-20" />
              <Line x1="-20" y1="-20" x2="-20" y2="15" />
              <Line x1="20" y1="-20" x2="20" y2="15" />
              <Line x1="-5" y1="15" x2="-5" y2="50" />
              <Line x1="-25" y1="50" x2="-25" y2="85" />
              <Line x1="15" y1="50" x2="15" y2="85" />
            </G>

            {/* Climbing Ivy Leaves on Stone Pillar */}
            <G fill="url(#ivyLeafGrad)" stroke="#052e16" strokeWidth="0.8">
              <Circle cx="-35" cy="-80" r="8" />
              <Circle cx="-28" cy="-72" r="6" />
              <Circle cx="-38" cy="-62" r="7" />
              <Circle cx="-30" cy="-45" r="8" />
              <Circle cx="-36" cy="-25" r="9" />
              <Circle cx="-26" cy="5" r="7" />
              <Circle cx="-34" cy="35" r="8" />
            </G>

            {/* Wrought-Iron Banner Rod with Gold Finial */}
            <G transform="translate(-35, -70)">
              {/* Rod */}
              <Line x1="-75" y1="0" x2="15" y2="0" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
              <Circle cx="-75" cy="0" r="5" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
              <Circle cx="15" cy="0" r="4" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
              <Rect x="-2" y="-6" width="6" height="12" rx="1" fill="#ca8a04" />
            </G>

            {/* Hanging Collegiate Crimson / Maroon Pennant Banner */}
            <G transform="translate(-68, -65)">
              {/* Banner Fabric with Swallowtail Cutout at Bottom */}
              <Polygon
                points="0,0 65,0 65,160 32.5,135 0,160"
                fill="url(#bannerCrimsonGrad)"
                stroke="#4c0519"
                strokeWidth="2.5"
              />

              {/* Gold Embroidered Border */}
              <Polygon
                points="5,6 60,6 60,148 32.5,127 5,148"
                fill="none"
                stroke="url(#crestGoldGrad)"
                strokeWidth="2"
              />

              {/* Collegiate Emblem on Banner (Laurel Wreath, Torch & 'C' Monogram) */}
              <G transform="translate(32.5, 65)">
                {/* Flaming Torch of Knowledge on top */}
                <G transform="translate(0, -22)">
                  <Polygon points="-4,8 4,8 2,16 -2,16" fill="#ca8a04" />
                  {/* Torch Flames */}
                  <Path d="M 0 6 Q -6 -2 0 -10 Q 6 -2 0 6 Z" fill="#fde047" stroke="#ea580c" strokeWidth="0.8" />
                  <Path d="M 0 4 Q -3 0 0 -5 Q 3 0 0 4 Z" fill="#ffffff" />
                </G>

                {/* Golden Laurel Wreath Leaves (Left & Right Arms) */}
                <Path
                  d="M -16 6 C -24 -6 -18 -18 0 -22 C 18 -18 24 -6 16 6 C 22 18 12 28 0 28 C -12 28 -22 18 -16 6 Z"
                  fill="none"
                  stroke="url(#crestGoldGrad)"
                  strokeWidth="2.5"
                />

                {/* Golden Central Shield */}
                <Polygon
                  points="-14,-10 14,-10 14,8 0,20 -14,8"
                  fill="#4c0519"
                  stroke="url(#crestGoldGrad)"
                  strokeWidth="2.2"
                />

                {/* Collegiate Monogram Letter 'C' */}
                <SvgText
                  x="0"
                  y="6"
                  fontSize="18"
                  fontWeight="900"
                  fill="url(#crestGoldGrad)"
                  fontFamily="'Cinzel', 'Outfit', serif"
                  textAnchor="middle"
                >
                  C
                </SvgText>
              </G>

              {/* Bottom Gold Tassel Fringe */}
              <Line x1="0" y1="160" x2="32.5" y2="135" stroke="#fde047" strokeWidth="2.5" />
              <Line x1="32.5" y1="135" x2="65" y2="160" stroke="#fde047" strokeWidth="2.5" />
              <Circle cx="32.5" cy="135" r="3" fill="#facc15" />
            </G>

            {/* Foliage at Pillar Base */}
            <G transform="translate(-10, 180)">
              <Ellipse cx="0" cy="10" rx="35" ry="12" fill="#041f12" />
              <Circle cx="-15" cy="0" r="14" fill="#14532d" />
              <Circle cx="5" cy="-5" r="16" fill="#16a34a" />
              <Circle cx="20" cy="2" r="12" fill="#15803d" />
            </G>
          </G>

          {/* ---------------------------------------------------- */}
          {/* 6. OVERHANGING SILHOUETTER CANOPY LEAVES & TREES */}
          {/* ---------------------------------------------------- */}
          {/* Left Canopy Branches & Foliage */}
          <G fill="#051c11" opacity="0.95">
            <Path d="M -20 -20 Q 60 40 140 10 Q 180 80 120 120 Q 40 90 -20 150 Z" />
            <Path d="M 0 100 Q 80 140 110 200 Q 30 220 -20 280 Z" />
            {/* Detailed Leaves */}
            <Circle cx="60" cy="30" r="28" fill="#0a2a1b" />
            <Circle cx="110" cy="50" r="24" fill="#0d3522" />
            <Circle cx="150" cy="30" r="20" fill="#0a2a1b" />
            <Circle cx="90" cy="90" r="26" fill="#0d3522" />
            <Circle cx="40" cy="130" r="30" fill="#061f14" />
            <Circle cx="80" cy="160" r="22" fill="#0a2a1b" />
            <Circle cx="30" cy="220" r="28" fill="#061f14" />
          </G>

          {/* Right Canopy Branches & Foliage */}
          <G fill="#051c11" opacity="0.95">
            <Path d="M 560 -20 Q 480 40 400 10 Q 360 80 420 120 Q 500 90 560 150 Z" />
            <Path d="M 540 100 Q 460 140 430 200 Q 510 220 560 280 Z" />
            {/* Detailed Leaves */}
            <Circle cx="480" cy="30" r="28" fill="#0a2a1b" />
            <Circle cx="430" cy="50" r="24" fill="#0d3522" />
            <Circle cx="390" cy="30" r="20" fill="#0a2a1b" />
            <Circle cx="450" cy="90" r="26" fill="#0d3522" />
            <Circle cx="500" cy="130" r="30" fill="#061f14" />
            <Circle cx="460" cy="160" r="22" fill="#0a2a1b" />
            <Circle cx="510" cy="220" r="28" fill="#061f14" />
          </G>

          {/* ---------------------------------------------------- */}
          {/* 7. TITLE ARTWORK: 3D CARVED GOLD STONE 'CAMPUS QUEST' */}
          {/* ---------------------------------------------------- */}
          <G transform="translate(270, 310)">
            {/* Ambient Golden Bloom Glow Behind Entire Title */}
            <Ellipse cx="0" cy="-25" rx="220" ry="110" fill="url(#lanternFlare)" opacity="0.35" />

            {/* =================================================== */}
            {/* ROW 1: 'CAMPUS' (Arched 3D Stone Carved Golden Text) */}
            {/* =================================================== */}
            <G transform="translate(0, -75)">
              {/* Deep 3D Shadow Cast Below */}
              <SvgText
                x="0"
                y="14"
                fontSize="68"
                fontWeight="900"
                fill="#1e0f03"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="4"
              >
                CAMPUS
              </SvgText>

              {/* 3D Extrusion Depth Layers (Chiseled Stone Blocks) */}
              <SvgText
                x="0"
                y="10"
                fontSize="68"
                fontWeight="900"
                fill="url(#goldStoneExtrusion)"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="4"
              >
                CAMPUS
              </SvgText>
              <SvgText
                x="0"
                y="6"
                fontSize="68"
                fontWeight="900"
                fill="url(#goldStoneBevel)"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="4"
              >
                CAMPUS
              </SvgText>

              {/* Main Golden Stone Face */}
              <SvgText
                x="0"
                y="0"
                fontSize="68"
                fontWeight="900"
                fill="url(#goldStoneSurface)"
                stroke="#713f12"
                strokeWidth="2.5"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="4"
              >
                CAMPUS
              </SvgText>

              {/* Top Surface Specular Chiseled Highlights */}
              <SvgText
                x="0"
                y="-2"
                fontSize="68"
                fontWeight="900"
                fill="none"
                stroke="#fffbeb"
                strokeWidth="1.2"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="4"
                opacity="0.9"
              >
                CAMPUS
              </SvgText>

              {/* Creeping Green Ivy Vines on 'CAMPUS' */}
              {/* Left Vine on 'C' & 'A' */}
              <G fill="url(#ivyLeafGrad)" stroke="#052e16" strokeWidth="0.8">
                <Path d="M -195 10 Q -180 -15 -165 -5 Q -150 15 -135 -10" stroke="#14532d" strokeWidth="2.5" fill="none" />
                <Circle cx="-190" cy="-2" r="5.5" />
                <Circle cx="-175" cy="-12" r="6" />
                <Circle cx="-160" cy="2" r="5" />
                <Circle cx="-145" cy="-8" r="6.5" />
              </G>

              {/* Right Vine on 'U' & 'S' */}
              <G fill="url(#ivyLeafGrad)" stroke="#052e16" strokeWidth="0.8">
                <Path d="M 130 -12 Q 150 10 170 -10 Q 185 12 200 -5" stroke="#14532d" strokeWidth="2.5" fill="none" />
                <Circle cx="138" cy="-5" r="6" />
                <Circle cx="155" cy="5" r="5.5" />
                <Circle cx="172" cy="-8" r="6.5" />
                <Circle cx="190" cy="2" r="5" />
              </G>
            </G>

            {/* =================================================== */}
            {/* ROW 2: 'QUEST' (Massive 3D Stone Carved Golden Text) */}
            {/* =================================================== */}
            <G transform="translate(0, 20)">
              {/* Deep 3D Shadow Cast */}
              <SvgText
                x="0"
                y="16"
                fontSize="84"
                fontWeight="900"
                fill="#1e0f03"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="6"
              >
                QUEST
              </SvgText>

              {/* 3D Extrusion Side Walls */}
              <SvgText
                x="0"
                y="12"
                fontSize="84"
                fontWeight="900"
                fill="url(#goldStoneExtrusion)"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="6"
              >
                QUEST
              </SvgText>
              <SvgText
                x="0"
                y="6"
                fontSize="84"
                fontWeight="900"
                fill="url(#goldStoneBevel)"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="6"
              >
                QUEST
              </SvgText>

              {/* Main Golden Stone Face */}
              <SvgText
                x="0"
                y="0"
                fontSize="84"
                fontWeight="900"
                fill="url(#goldStoneSurface)"
                stroke="#713f12"
                strokeWidth="3"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="6"
              >
                QUEST
              </SvgText>

              {/* Top Highlight Glints */}
              <SvgText
                x="0"
                y="-2"
                fontSize="84"
                fontWeight="900"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                fontFamily="'Cinzel', 'Baloo 2', 'Fredoka', sans-serif"
                textAnchor="middle"
                letterSpacing="6"
                opacity="0.95"
              >
                QUEST
              </SvgText>

              {/* Ivy Leaves Wrapping Around 'QUEST' Letters */}
              {/* Left Vine on 'Q' & 'U' */}
              <G fill="url(#ivyLeafGrad)" stroke="#052e16" strokeWidth="0.8">
                <Path d="M -180 8 Q -160 -18 -135 -5 Q -115 15 -95 -12" stroke="#14532d" strokeWidth="2.8" fill="none" />
                <Circle cx="-172" cy="-4" r="6.5" />
                <Circle cx="-150" cy="-14" r="7" />
                <Circle cx="-130" cy="5" r="6" />
                <Circle cx="-105" cy="-8" r="7.5" />
              </G>

              {/* Bottom Flourish Ribbon / Underline Accent */}
              <Path
                d="M -60 22 Q 0 28 60 22"
                stroke="#ca8a04"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              <Circle cx="0" cy="25" r="2.5" fill="#fef08a" />

              {/* Right Vine on 'S' & 'T' */}
              <G fill="url(#ivyLeafGrad)" stroke="#052e16" strokeWidth="0.8">
                <Path d="M 90 -10 Q 120 15 145 -12 Q 170 10 190 -8" stroke="#14532d" strokeWidth="2.8" fill="none" />
                <Circle cx="102" cy="0" r="6.5" />
                <Circle cx="125" cy="-8" r="7" />
                <Circle cx="148" cy="4" r="6" />
                <Circle cx="175" cy="-6" r="7" />
              </G>
            </G>
          </G>

          {/* ---------------------------------------------------- */}
          {/* 8. FLOATING AMBIENT FIREFLY PARTICLES */}
          {/* ---------------------------------------------------- */}
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

      {/* Interactive Bottom Quest HUD & Loading Action Bar */}
      <View style={styles.bottomHudContainer}>
        {/* Glowing Progress Capsule */}
        <View style={styles.progressCapsule}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{progress}% LOADED</Text>
          <Text style={styles.touchToEnterPrompt}>
            {isReady ? '✨ READY TO EXPLORE ✨' : 'PREPARING CAMPUS QUEST...'}
          </Text>
        </View>

        {/* Start Button */}
        {isReady && (
          <TouchableOpacity
            style={styles.enterButton}
            onPress={onStart}
            activeOpacity={0.85}
          >
            <Text style={styles.enterButtonText}>ENTER CAMPUS QUEST 🗝️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#040817',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  bottomHudContainer: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    zIndex: 40,
    alignItems: 'center',
    gap: 8,
  },
  progressCapsule: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
    overflow: 'hidden',
    shadowColor: '#facc15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#facc15',
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fde047',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? "'Cinzel', 'Outfit', sans-serif" : undefined,
  },
  touchToEnterPrompt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowColor: 'rgba(250, 204, 21, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    fontFamily: Platform.OS === 'web' ? "'Cinzel', 'Outfit', sans-serif" : undefined,
  },
  enterButton: {
    width: '100%',
    backgroundColor: '#b45309',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fde047',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    cursor: 'pointer' as any,
  },
  enterButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? "'Cinzel', 'Outfit', sans-serif" : undefined,
    textShadowColor: '#451a03',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
