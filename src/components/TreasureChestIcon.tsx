import React from 'react';
import { View } from 'react-native';
import Svg, {
  Rect,
  Path,
  Circle,
  Polygon,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Ellipse,
} from 'react-native-svg';

interface TreasureChestIconProps {
  size?: number;
}

export const TreasureChestIcon: React.FC<TreasureChestIconProps> = ({ size = 36 }) => {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          {/* Ambient Glow from Inside */}
          <RadialGradient id="innerTreasureGlow" cx="50%" cy="45%" r="50%">
            <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </RadialGradient>

          {/* Chest Wood Gradients */}
          <LinearGradient id="woodLid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#b45309" />
            <Stop offset="40%" stopColor="#92400e" />
            <Stop offset="100%" stopColor="#78350f" />
          </LinearGradient>

          <LinearGradient id="woodBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#92400e" />
            <Stop offset="60%" stopColor="#78350f" />
            <Stop offset="100%" stopColor="#451a03" />
          </LinearGradient>

          <LinearGradient id="woodInnerDark" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#291305" />
            <Stop offset="100%" stopColor="#451a03" />
          </LinearGradient>

          {/* Polished Gold Gradients */}
          <LinearGradient id="goldLustre" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#fffbeb" />
            <Stop offset="25%" stopColor="#fde047" />
            <Stop offset="65%" stopColor="#eab308" />
            <Stop offset="100%" stopColor="#a16207" />
          </LinearGradient>

          <LinearGradient id="goldTrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fef08a" />
            <Stop offset="45%" stopColor="#eab308" />
            <Stop offset="100%" stopColor="#854d0e" />
          </LinearGradient>

          <LinearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fef9c3" />
            <Stop offset="30%" stopColor="#facc15" />
            <Stop offset="80%" stopColor="#ca8a04" />
            <Stop offset="100%" stopColor="#854d0e" />
          </LinearGradient>

          {/* Gemstone Gradients */}
          <LinearGradient id="rubyGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#fca5a5" />
            <Stop offset="40%" stopColor="#ef4444" />
            <Stop offset="100%" stopColor="#991b1b" />
          </LinearGradient>

          <LinearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#86efac" />
            <Stop offset="40%" stopColor="#10b981" />
            <Stop offset="100%" stopColor="#065f46" />
          </LinearGradient>

          <LinearGradient id="sapphireGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#93c5fd" />
            <Stop offset="40%" stopColor="#3b82f6" />
            <Stop offset="100%" stopColor="#1e3a8a" />
          </LinearGradient>

          {/* Pearl / Diamond Gradient */}
          <LinearGradient id="diamondGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="50%" stopColor="#e0e7ff" />
            <Stop offset="100%" stopColor="#a5b4fc" />
          </LinearGradient>
        </Defs>

        {/* 1. SOFT BASE SHADOW */}
        <Ellipse cx="60" cy="110" rx="44" ry="7" fill="#0f172a" fillOpacity="0.25" />

        {/* 2. MAGICAL AMBIENT LIGHT & SPARKLES */}
        <Circle cx="60" cy="52" r="32" fill="url(#innerTreasureGlow)" />
        
        {/* Magic Sparkle Stars */}
        {/* Star 1 - Top Left */}
        <Path
          d="M32 20 Q32 26 26 26 Q32 26 32 32 Q32 26 38 26 Q32 26 32 20 Z"
          fill="#fef08a"
        />
        {/* Star 2 - Top Right */}
        <Path
          d="M86 16 Q86 23 79 23 Q86 23 86 30 Q86 23 93 23 Q86 23 86 16 Z"
          fill="#fef08a"
        />
        {/* Star 3 - Center Top */}
        <Path
          d="M58 8 Q58 13 53 13 Q58 13 58 18 Q58 13 63 13 Q58 13 58 8 Z"
          fill="#ffffff"
        />

        {/* 3. OPEN LID (Curved Vault Tilted Back) */}
        <G>
          {/* Lid Back Wood Shell */}
          <Path
            d="M20 38 C20 18, 40 10, 60 10 C80 10, 100 18, 100 38 L98 50 C75 42, 45 42, 22 50 Z"
            fill="url(#woodLid)"
            stroke="#451a03"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Lid Inner Cavity (Dark Depth) */}
          <Path
            d="M23 48 C44 41, 76 41, 97 48 L96 55 C74 48, 46 48, 24 55 Z"
            fill="url(#woodInnerDark)"
          />
          {/* Lid Gold Reinforcement Straps */}
          {/* Left Strap */}
          <Path
            d="M36 14 C30 20, 28 32, 29 49 L35 47 C34 33, 36 21, 42 16 Z"
            fill="url(#goldLustre)"
            stroke="#78350f"
            strokeWidth="1"
          />
          <Circle cx="32" cy="28" r="1.6" fill="#451a03" />
          <Circle cx="32" cy="40" r="1.6" fill="#451a03" />

          {/* Right Strap */}
          <Path
            d="M84 14 C90 20, 92 32, 91 49 L85 47 C86 33, 84 21, 78 16 Z"
            fill="url(#goldLustre)"
            stroke="#78350f"
            strokeWidth="1"
          />
          <Circle cx="88" cy="28" r="1.6" fill="#451a03" />
          <Circle cx="88" cy="40" r="1.6" fill="#451a03" />

          {/* Lid Top Gold Trim Arch */}
          <Path
            d="M24 35 C28 20, 42 12, 60 12 C78 12, 92 20, 96 35 L93 37 C89 24, 76 16, 60 16 C44 16, 31 24, 27 37 Z"
            fill="url(#goldLustre)"
          />
        </G>

        {/* 4. OVERFLOWING TREASURE MOUND */}
        <G>
          {/* Base Heap of Gold */}
          <Path
            d="M22 62 C22 45, 42 36, 60 36 C78 36, 98 45, 98 62 C90 68, 30 68, 22 62 Z"
            fill="url(#coinGrad)"
            stroke="#b45309"
            strokeWidth="1.5"
          />

          {/* Stacked Shiny Gold Coins */}
          {/* Back Tier Coins */}
          <Ellipse cx="42" cy="48" rx="8" ry="5.5" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="58" cy="44" rx="8" ry="5.5" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="76" cy="47" rx="8" ry="5.5" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />

          {/* Mid Tier Coins */}
          <Ellipse cx="32" cy="54" rx="8.5" ry="6" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="48" cy="52" rx="9" ry="6" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="68" cy="50" rx="9" ry="6" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="86" cy="54" rx="8.5" ry="6" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />

          {/* Front Spill Coins */}
          <Ellipse cx="38" cy="61" rx="8.5" ry="5.5" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="56" cy="59" rx="9" ry="6" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />
          <Ellipse cx="78" cy="60" rx="8.5" ry="5.5" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="1" />

          {/* Inner Coin Rim Details for Depth */}
          <Ellipse cx="56" cy="58.5" rx="6.5" ry="4" fill="none" stroke="#fef08a" strokeWidth="1" />
          <Ellipse cx="48" cy="51.5" rx="6.5" ry="4" fill="none" stroke="#fef08a" strokeWidth="1" />
          <Ellipse cx="68" cy="49.5" rx="6.5" ry="4" fill="none" stroke="#fef08a" strokeWidth="1" />

          {/* 5. VIBRANT JEWELS & GEMS */}
          {/* Emerald (Center-Right Octagon Gem) */}
          <Polygon
            points="68,40 76,40 81,46 76,52 68,52 63,46"
            fill="url(#emeraldGrad)"
            stroke="#064e3b"
            strokeWidth="1"
          />
          <Polygon points="70,42 74,42 77,46 74,50 70,50 67,46" fill="#a7f3d0" fillOpacity="0.4" />
          <Circle cx="70" cy="44" r="1.2" fill="#ffffff" />

          {/* Large Ruby (Center-Left Brilliant Cut) */}
          <Polygon
            points="46,38 56,38 60,45 51,54 42,45"
            fill="url(#rubyGrad)"
            stroke="#7f1d1d"
            strokeWidth="1.2"
          />
          <Polygon points="48,40 54,40 57,44 51,50 45,44" fill="#fecaca" fillOpacity="0.4" />
          <Circle cx="50" cy="42" r="1.5" fill="#ffffff" />

          {/* Sapphire (Far Left Diamond Gem) */}
          <Polygon
            points="28,47 34,42 40,47 34,53"
            fill="url(#sapphireGrad)"
            stroke="#1e3a8a"
            strokeWidth="1"
          />
          <Circle cx="33" cy="45" r="1" fill="#ffffff" />

          {/* Diamond / Pearl Drop on Front */}
          <Circle cx="86" cy="62" r="4.5" fill="url(#diamondGrad)" stroke="#6366f1" strokeWidth="0.8" />
          <Circle cx="85" cy="60.5" r="1.5" fill="#ffffff" />

          <Circle cx="93" cy="66" r="3.5" fill="url(#diamondGrad)" stroke="#6366f1" strokeWidth="0.8" />
          <Circle cx="92" cy="65" r="1" fill="#ffffff" />
        </G>

        {/* 6. CHEST BASE (Heavy Solid Box) */}
        <G>
          {/* Main Box Body */}
          <Path
            d="M18 58 L102 58 L98 104 C98 107, 95 109, 92 109 L28 109 C25 109, 22 107, 22 104 Z"
            fill="url(#woodBody)"
            stroke="#451a03"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Horizontal Wood Plank Dividers */}
          <Path d="M20 74 L100 74" stroke="#451a03" strokeWidth="2" strokeOpacity="0.8" />
          <Path d="M21 91 L99 91" stroke="#451a03" strokeWidth="2" strokeOpacity="0.8" />
          
          {/* Plank Highlights */}
          <Path d="M20 76 L100 76" stroke="#b45309" strokeWidth="1" strokeOpacity="0.4" />
          <Path d="M21 93 L99 93" stroke="#b45309" strokeWidth="1" strokeOpacity="0.4" />

          {/* Golden Corner Reinforcements & Brackets */}
          {/* Left Vertical Band */}
          <Path
            d="M18 58 L30 58 L28 109 L22 109 C20 109, 18 107, 18 104 Z"
            fill="url(#goldTrim)"
            stroke="#78350f"
            strokeWidth="1.5"
          />
          {/* Right Vertical Band */}
          <Path
            d="M90 58 L102 58 L102 104 C102 107, 100 109, 98 109 L92 109 Z"
            fill="url(#goldTrim)"
            stroke="#78350f"
            strokeWidth="1.5"
          />

          {/* Top Edge Gold Rim */}
          <Path
            d="M16 57 L104 57 L102 64 L18 64 Z"
            fill="url(#goldLustre)"
            stroke="#78350f"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Bottom Edge Gold Rim */}
          <Path
            d="M20 104 L100 104 L98 110 L22 110 Z"
            fill="url(#goldTrim)"
            stroke="#78350f"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Metal Rivets / Bolts on Straps */}
          {/* Left Straps Rivets */}
          <Circle cx="24" cy="69" r="1.8" fill="#451a03" />
          <Circle cx="24" cy="68.5" r="1.2" fill="#fde047" />
          <Circle cx="24" cy="83" r="1.8" fill="#451a03" />
          <Circle cx="24" cy="82.5" r="1.2" fill="#fde047" />
          <Circle cx="24" cy="99" r="1.8" fill="#451a03" />
          <Circle cx="24" cy="98.5" r="1.2" fill="#fde047" />

          {/* Right Straps Rivets */}
          <Circle cx="96" cy="69" r="1.8" fill="#451a03" />
          <Circle cx="96" cy="68.5" r="1.2" fill="#fde047" />
          <Circle cx="96" cy="83" r="1.8" fill="#451a03" />
          <Circle cx="96" cy="82.5" r="1.2" fill="#fde047" />
          <Circle cx="96" cy="99" r="1.8" fill="#451a03" />
          <Circle cx="96" cy="98.5" r="1.2" fill="#fde047" />

          {/* 7. ORNATE CENTER GOLDEN LOCK & HASP */}
          {/* Vertical Center Strap */}
          <Path
            d="M54 58 L66 58 L65 109 L55 109 Z"
            fill="url(#goldTrim)"
            stroke="#78350f"
            strokeWidth="1.2"
          />

          {/* Center Lock Plate Escutcheon */}
          <Path
            d="M50 63 L70 63 L72 79 C72 85, 60 90, 60 90 C60 90, 48 85, 48 79 Z"
            fill="url(#goldLustre)"
            stroke="#78350f"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Lock Plate Inner Bevel */}
          <Path
            d="M53 66 L67 66 L68 78 C68 82, 60 86, 60 86 C60 86, 52 82, 52 78 Z"
            fill="none"
            stroke="#fef08a"
            strokeWidth="1"
          />

          {/* Keyhole */}
          <Circle cx="60" cy="73" r="3" fill="#3b1502" />
          <Path d="M58.5 73 L61.5 73 L62.5 81 L57.5 81 Z" fill="#3b1502" />

          {/* Golden Padlock Rivets */}
          <Circle cx="53" cy="67" r="1.2" fill="#451a03" />
          <Circle cx="67" cy="67" r="1.2" fill="#451a03" />

          {/* Hanging Gold Coin overflowing over front bottom */}
          <Ellipse cx="46" cy="66" rx="5" ry="3.5" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="0.8" />
          <Ellipse cx="73" cy="67" rx="4.5" ry="3" fill="url(#coinGrad)" stroke="#b45309" strokeWidth="0.8" />
        </G>
      </Svg>
    </View>
  );
};
