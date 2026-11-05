import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Sparkles, Gift, Copy, Check, Tag } from 'lucide-react';
import { playScratchSound } from '../../utils/audioEffects';

export interface ScratchCardData {
  id: string;
  title: string;
  sub: string;
  rewardText: string;
  xpAmount: number;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorTag?: string;
  promoCode?: string;
  isScratched: boolean;
  type: 'silver' | 'bronze' | 'gold';
}

interface InteractiveScratchSurfaceProps {
  card: ScratchCardData;
  onScratchComplete: (cardId: string) => void;
  onReset?: (cardId: string) => void;
}

export const InteractiveScratchSurface: React.FC<InteractiveScratchSurfaceProps> = ({
  card,
  onScratchComplete,
  onReset: _onReset,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScratchingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [scratchPercent, setScratchPercent] = useState<number>(card.isScratched ? 100 : 0);
  const [hasStartedScratching, setHasStartedScratching] = useState<boolean>(false);
  const completedRef = useRef<boolean>(card.isScratched);

  // Synchronize completed state
  useEffect(() => {
    completedRef.current = card.isScratched;
    if (card.isScratched) {
      setScratchPercent(100);
    }
  }, [card.isScratched]);

  // Draw the metallic foil and sparkling star field
  const drawFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 340;
    const height = rect.height || 124;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Reset composite operation to paint foil
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    // Rich metallic diagonal linear gradient
    let grad: CanvasGradient;
    if (card.type === 'silver') {
      grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0.0, '#475569');
      grad.addColorStop(0.2, '#94a3b8');
      grad.addColorStop(0.45, '#f8fafc');
      grad.addColorStop(0.7, '#cbd5e1');
      grad.addColorStop(0.88, '#64748b');
      grad.addColorStop(1.0, '#334155');
    } else if (card.type === 'bronze') {
      grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0.0, '#7c2d12');
      grad.addColorStop(0.22, '#ea580c');
      grad.addColorStop(0.48, '#fed7aa');
      grad.addColorStop(0.72, '#c2410c');
      grad.addColorStop(0.9, '#9a3412');
      grad.addColorStop(1.0, '#431407');
    } else {
      // Warm Gold Foil matching reference
      grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0.0, '#b45309');
      grad.addColorStop(0.18, '#f59e0b');
      grad.addColorStop(0.42, '#fef08a');
      grad.addColorStop(0.58, '#fef9c3');
      grad.addColorStop(0.78, '#f59e0b');
      grad.addColorStop(0.92, '#d97706');
      grad.addColorStop(1.0, '#92400e');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Outer subtle sheen border
    ctx.strokeStyle =
      card.type === 'silver'
        ? 'rgba(255, 255, 255, 0.45)'
        : card.type === 'bronze'
        ? 'rgba(254, 215, 170, 0.4)'
        : 'rgba(254, 240, 138, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Star sparkles scattered around the foil
    const sparkles = [
      { x: width * 0.08, y: height * 0.22, size: 10, alpha: 0.65 },
      { x: width * 0.92, y: height * 0.25, size: 9, alpha: 0.6 },
      { x: width * 0.12, y: height * 0.78, size: 8, alpha: 0.55 },
      { x: width * 0.88, y: height * 0.76, size: 11, alpha: 0.7 },
      { x: width * 0.26, y: height * 0.32, size: 7, alpha: 0.45 },
      { x: width * 0.72, y: height * 0.68, size: 8, alpha: 0.5 },
      { x: width * 0.83, y: height * 0.38, size: 6, alpha: 0.45 },
      { x: width * 0.18, y: height * 0.62, size: 7, alpha: 0.4 },
    ];

    ctx.fillStyle = '#ffffff';
    sparkles.forEach((s) => {
      ctx.globalAlpha = s.alpha;
      ctx.font = `${s.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', s.x, s.y);
    });

    // Tiny specks
    const specks = [
      { x: width * 0.38, y: height * 0.22, r: 1.2 },
      { x: width * 0.62, y: height * 0.28, r: 1.0 },
      { x: width * 0.22, y: height * 0.45, r: 1.2 },
      { x: width * 0.78, y: height * 0.55, r: 1.0 },
      { x: width * 0.32, y: height * 0.82, r: 1.1 },
    ];
    specks.forEach((sp) => {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Center text: ✦ SCRATCH HERE ✦
    ctx.globalAlpha = 1.0;
    ctx.font = '900 15px "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (card.type === 'silver') {
      ctx.fillStyle = '#1e293b';
    } else if (card.type === 'bronze') {
      ctx.fillStyle = '#431407';
    } else {
      ctx.fillStyle = '#451a03';
    }

    ctx.fillText('✦  SCRATCH HERE  ✦', width / 2, height / 2);
  }, [card.type]);

  // Redraw when card is reset or on initial mount
  useEffect(() => {
    if (!card.isScratched) {
      setScratchPercent(0);
      setHasStartedScratching(false);
      completedRef.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.opacity = '1';
        canvas.style.pointerEvents = 'auto';
        canvas.style.transition = 'none';
      }
      // Small timeout to allow container to have dimensions
      const timer = setTimeout(() => {
        drawFoil();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [card.isScratched, drawFoil]);

  // Window resize observer to keep canvas sharp
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      if (!completedRef.current) {
        drawFoil();
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawFoil]);

  // Check how much of the foil has been scratched away
  const checkScratchPercentage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const sampleCols = 12;
    const sampleRows = 6;
    let transparentCount = 0;
    const totalSamples = sampleCols * sampleRows;

    const stepX = canvas.width / (sampleCols + 1);
    const stepY = canvas.height / (sampleRows + 1);

    for (let c = 1; c <= sampleCols; c++) {
      for (let r = 1; r <= sampleRows; r++) {
        const x = Math.floor(c * stepX);
        const y = Math.floor(r * stepY);
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        // pixel[3] is alpha channel (0 to 255)
        if (pixel[3] < 128) {
          transparentCount++;
        }
      }
    }

    const percent = Math.round((transparentCount / totalSamples) * 100);
    setScratchPercent(percent);

    // If scratched 38% or more, consider it completely uncovered!
    if (percent >= 38 && !completedRef.current) {
      completedRef.current = true;
      if (canvas) {
        canvas.style.transition = 'opacity 0.4s ease-out';
        canvas.style.opacity = '0';
        canvas.style.pointerEvents = 'none';
      }
      onScratchComplete(card.id);
    }
  }, [card.id, onScratchComplete]);

  // Erase a line path along the user's drag gesture
  const eraseLine = (fromX: number, fromY: number, toX: number, toY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 38; // Rich round brush
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.restore();
    playScratchSound();
  };

  // Erase a circle for single press or tap
  const erasePoint = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    playScratchSound();
  };

  // Get pointer coordinates relative to canvas
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (completedRef.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    isScratchingRef.current = true;
    setHasStartedScratching(true);
    const pos = getCoordinates(e);
    lastPointRef.current = pos;
    // Erase a single small spot
    erasePoint(pos.x, pos.y);
    checkScratchPercentage();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isScratchingRef.current || completedRef.current) return;
    const currentPos = getCoordinates(e);

    if (lastPointRef.current) {
      eraseLine(lastPointRef.current.x, lastPointRef.current.y, currentPos.x, currentPos.y);
    } else {
      erasePoint(currentPos.x, currentPos.y);
    }

    lastPointRef.current = currentPos;
    checkScratchPercentage();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isScratchingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    checkScratchPercentage();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isScratchingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const [copiedCode, setCopiedCode] = useState(false);

  return (
    <View style={styles.cardWrapper}>
      {/* Container Frame */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: card.promoCode ? 138 : 124,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#0a1329',
          border: '1.5px solid #d97706',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.65)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* UNDERLYING PRIZE LAYER (Visible through scratched foil) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              card.type === 'gold'
                ? 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.22) 0%, rgba(10, 19, 41, 0.98) 75%)'
                : card.type === 'silver'
                ? 'radial-gradient(ellipse at center, rgba(148, 163, 184, 0.2) 0%, rgba(10, 19, 41, 0.98) 75%)'
                : 'radial-gradient(ellipse at center, rgba(234, 88, 12, 0.22) 0%, rgba(10, 19, 41, 0.98) 75%)',
            padding: '10px 16px',
            boxSizing: 'border-box',
          }}
        >
          {card.isScratched ? (
            // FULLY REVEALED PRIZE STATE
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  marginBottom: 4,
                }}
              >
                <CheckCircle2 size={13} color="#10b981" />
                <span
                  style={{
                    color: '#34d399',
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: 1,
                    fontFamily: 'sans-serif',
                  }}
                >
                  CLAIMED & CREDITED
                </span>
              </div>

              <div
                style={{
                  color: '#fef08a',
                  fontSize: 16,
                  fontWeight: 900,
                  fontFamily: 'Cinzel, Georgia, serif',
                  letterSpacing: 0.8,
                  textShadow: '0 2px 8px rgba(245, 158, 11, 0.5)',
                  marginBottom: 2,
                }}
              >
                {card.rewardText}
              </div>

              {card.promoCode ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(card.promoCode!);
                      }
                    } catch (err) {}
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    border: '1px dashed #fbbf24',
                    cursor: 'pointer',
                    marginTop: 3,
                    marginBottom: 3,
                  }}
                >
                  <Tag size={12} color="#fbbf24" />
                  <span style={{ color: '#fef08a', fontSize: 11, fontWeight: 900, letterSpacing: 0.8 }}>
                    CODE: {card.promoCode}
                  </span>
                  {copiedCode ? (
                    <span style={{ color: '#34d399', fontSize: 10, fontWeight: 800 }}>Copied!</span>
                  ) : (
                    <Copy size={11} color="#fbbf24" />
                  )}
                </div>
              ) : null}

              <div style={{ color: '#94a3b8', fontSize: 10.5 }}>
                {card.promoCode
                  ? 'Tap code to copy & redeem with sponsor partner.'
                  : 'Added to your profile balance & leaderboard score.'}
              </div>
            </div>
          ) : (
            // PARTIALLY REVEALED PRIZE PEAKING THROUGH
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div
                style={{
                  color: '#fef08a',
                  fontSize: 19,
                  fontWeight: 900,
                  fontFamily: 'Cinzel, Georgia, serif',
                  letterSpacing: 1,
                  textShadow: '0 2px 10px rgba(245, 158, 11, 0.7)',
                  marginBottom: 4,
                }}
              >
                {card.rewardText}
              </div>
              <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>
                +{card.xpAmount} XP Bonus
              </div>
            </div>
          )}
        </div>

        {/* FOIL OVERLAY CANVAS (Scratched by user drag) */}
        {!card.isScratched && (
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
              cursor: 'grab',
              touchAction: 'none',
              borderRadius: 16,
            }}
          />
        )}
      </div>

      {/* TACTILE INSTRUCTION / PROGRESS PROMPT */}
      {!card.isScratched && (
        <View style={styles.promptRow}>
          {hasStartedScratching && scratchPercent > 0 ? (
            <Text style={styles.scratchProgressText}>
              Scratched: <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{scratchPercent}%</Text> • Rub back & forth to uncover!
            </Text>
          ) : (
            <Text style={styles.promptHintText}>
              ✦ Rub or drag across the foil to scratch and uncover your prize
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginTop: 8,
  },
  promptRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  promptHintText: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scratchProgressText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    textAlign: 'center',
    fontWeight: '600',
  },
});
