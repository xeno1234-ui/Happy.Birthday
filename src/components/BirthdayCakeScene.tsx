import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio.ts';
import { Sparkles, Wind, Utensils, Heart, PartyPopper } from 'lucide-react';

interface BirthdayCakeSceneProps {
  onVisitTree: () => void;
}

interface Balloon {
  id: number;
  left: number;
  size: number;
  color: string;
  highlightColor: string;
  delay: number;
  duration: number;
  stringLength: number;
}

export const BirthdayCakeScene: React.FC<BirthdayCakeSceneProps> = ({ onVisitTree }) => {
  const [cartArrived, setCartArrived] = useState(false);
  const [isBlowing, setIsBlowing] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showScreenAura, setShowScreenAura] = useState(false);

  // Dynamic Flame Physics: tilts under wind, then shrinks gradually transform: scale(0) over 400ms
  const [flameTilt, setFlameTilt] = useState(0);
  const [flameScale, setFlameScale] = useState(1);
  const [isFlameTurbulent, setIsFlameTurbulent] = useState(false);
  const [flameOpacity, setFlameOpacity] = useState(1);

  // Cake Cutting Sequence states: 'idle' | 'knife-cutting' | 'slice-lifting' | 'sliced'
  const [cutStage, setCutStage] = useState<'idle' | 'knife-cutting' | 'slice-lifting' | 'sliced'>('idle');

  // Served Slice to User (Foreground Dish Presentation) State
  const [showServedPlate, setShowServedPlate] = useState(false);
  const [biteCount, setBiteCount] = useState(0);
  const [biteFeedback, setBiteFeedback] = useState<string | null>(null);
  const [flyingCrumbs, setFlyingCrumbs] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  // Interactive Cat Petting Reaction State
  const [isCatPetted, setIsCatPetted] = useState(false);
  const [catHearts, setCatHearts] = useState<Array<{ id: number; x: number; y: number; delay?: number }>>([]);

  const celebrationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const windCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isBlowingRef = useRef(false);
  const candlesBlownRef = useRef(false);
  const cutStageRef = useRef('idle');
  const triggerInitialSmokeBurstRef = useRef(false);
  const emberStartTimeRef = useRef(0);

  useEffect(() => {
    isBlowingRef.current = isBlowing;
  }, [isBlowing]);

  useEffect(() => {
    candlesBlownRef.current = candlesBlown;
  }, [candlesBlown]);

  useEffect(() => {
    cutStageRef.current = cutStage;
  }, [cutStage]);

  // Balloons dataset for festive ascension
  const [balloons, setBalloons] = useState<Balloon[]>([]);

  useEffect(() => {
    const palette = [
      { base: '#d4af37', highlight: '#fdf4dc' }, // Royal Gold
      { base: '#991b1b', highlight: '#fca5a5' }, // Ruby Crimson
      { base: '#1e3a8a', highlight: '#93c5fd' }, // Sapphire Blue
      { base: '#581c87', highlight: '#d8b4fe' }, // Violet Amethyst
      { base: '#be185d', highlight: '#fbcfe8' }, // Rose Pink
      { base: '#065f46', highlight: '#a7f3d0' }, // Emerald Green
      { base: '#c2410c', highlight: '#fed7aa' }, // Warm Amber
      { base: '#b45309', highlight: '#fde68a' }, // Champagne Bronze
    ];

    const generated: Balloon[] = [];
    for (let i = 0; i < 14; i++) {
      const col = palette[i % palette.length];
      generated.push({
        id: i,
        left: 4 + i * 7 + (Math.random() * 4 - 2),
        size: 36 + Math.floor(Math.random() * 16),
        color: col.base,
        highlightColor: col.highlight,
        delay: 0.1 + i * 0.28 + Math.random() * 0.3,
        duration: 7 + Math.random() * 3.5,
        stringLength: 45 + Math.floor(Math.random() * 20),
      });
    }
    setBalloons(generated);
  }, []);

  // Cat Cart slow entrance timer (4.5s entrance over screen before Blow Candle is active)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCartArrived(true);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // ================= DELICATE, MINIMAL & SLOW-RISING CURLY SMOKE LOOP =================
  useEffect(() => {
    const canvas = smokeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Wick tip positions matching the SVG coordinates with 110px top headroom offset:
    const wickPositions = [
      { x: 287, y: 170 }, // Left Candle wick tip (SVG y=60 + 110 headroom)
      { x: 310, y: 164 }, // Center Candle wick tip (SVG y=54 + 110 headroom)
      { x: 333, y: 170 }, // Right Candle wick tip (SVG y=60 + 110 headroom)
    ];

    interface SmokeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxSize: number;
      growth: number;
      alpha: number;
      decay: number;
      curlPhase: number;
      curlSpeed: number;
      curlRadius: number;
      curlRadiusGrowth: number;
      windDrift: number;
    }

    const smokeList: SmokeParticle[] = [];
    let smokeFrameCount = 0;

    const renderSmoke = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isBlown = candlesBlownRef.current;
      const currentCut = cutStageRef.current;

      // 1. Initial burst: The moment the flames vanish, spawn a minimal, subtle initial wisp (no clunky dots!)
      if (triggerInitialSmokeBurstRef.current) {
        triggerInitialSmokeBurstRef.current = false;
        wickPositions.forEach(pos => {
          for (let k = 0; k < 5; k++) {
            smokeList.push({
              x: pos.x + (Math.random() - 0.5) * 1.5,
              y: pos.y - k * 1.8,
              vx: (Math.random() - 0.5) * 0.12,
              vy: -Math.random() * 0.28 - 0.42,
              size: 1.2 + k * 0.25,
              maxSize: 12,
              growth: 0.038 + Math.random() * 0.015,
              alpha: 0.22 - k * 0.02,
              decay: 0.0016 + Math.random() * 0.0006,
              curlPhase: Math.random() * Math.PI * 2,
              curlSpeed: 0.025 + Math.random() * 0.012,
              curlRadius: 0.4,
              curlRadiusGrowth: 0.028,
              windDrift: 0.07 + Math.random() * 0.04,
            });
          }
        });
      }

      // 2. Continuous delicate thin spiral string of semi-transparent smoke from each wick
      if (isBlown && currentCut === 'idle') {
        smokeFrameCount++;
        // Emit 1 delicate particle every 3 frames per wick to form a thin spiral string
        if (smokeFrameCount % 3 === 0) {
          wickPositions.forEach((pos, idx) => {
            smokeList.push({
              x: pos.x + (Math.random() - 0.5) * 0.8,
              y: pos.y,
              vx: (Math.random() - 0.5) * 0.08,
              vy: -Math.random() * 0.25 - 0.38, // SLOW upward drift
              size: 1.2,
              maxSize: 13,
              growth: 0.034 + Math.random() * 0.012,
              alpha: 0.20 + Math.random() * 0.03, // Subtle semi-transparent rgba(220, 220, 220, 0.2)
              decay: 0.0014 + Math.random() * 0.0005,
              curlPhase: smokeFrameCount * 0.07 + idx * 2.1,
              curlSpeed: 0.022 + Math.random() * 0.008,
              curlRadius: 0.3,
              curlRadiusGrowth: 0.026,
              windDrift: 0.06 + Math.random() * 0.04,
            });
          });
        }
      }

      // 3. Render tiny glowing red-hot ember at each wick tip (slowly cooling to charcoal)
      if (isBlown && emberStartTimeRef.current > 0) {
        const emberAge = Date.now() - emberStartTimeRef.current;
        if (emberAge < 5000) {
          const emberAlpha = Math.max(0, 1 - emberAge / 5000);
          wickPositions.forEach(pos => {
            ctx.save();
            const halo = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 4.5);
            halo.addColorStop(0, `rgba(249, 115, 22, ${0.85 * emberAlpha})`);
            halo.addColorStop(0.5, `rgba(239, 68, 68, ${0.4 * emberAlpha})`);
            halo.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(254, 240, 138, ${0.9 * emberAlpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }
      }

      // 4. Update and render delicate smoke swirling, rising slowly, expanding softly, and dissolving near header
      for (let i = smokeList.length - 1; i >= 0; i--) {
        const s = smokeList[i];
        s.curlPhase += s.curlSpeed;
        s.curlRadius += s.curlRadiusGrowth;
        // Gentle horizontal wisp/swirl effect
        s.x += s.vx + Math.sin(s.curlPhase) * s.curlRadius * 0.35 + s.windDrift;
        s.y += s.vy;
        s.vy *= 0.997; // Fluid buoyancy deceleration
        s.size = Math.min(s.maxSize, s.size + s.growth);
        s.alpha -= s.decay;

        // Altitude factor for gradual fade out as smoke ascends near the header (y from 90 down to 10)
        const altitudeFactor = Math.max(0, Math.min(1, (s.y - 12) / 78));
        const renderedAlpha = s.alpha * altitudeFactor;
        const currentSize = s.size * (0.55 + 0.45 * altitudeFactor);

        if (renderedAlpha <= 0.003 || s.y < 5 || s.x > canvas.width + 30) {
          smokeList.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = renderedAlpha;
        // Semi-transparent, soft-blurred radial gradient (rgba(220, 220, 220, 0.2)) - NO harsh dots!
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, currentSize);
        grad.addColorStop(0, 'rgba(220, 220, 220, 0.22)');
        grad.addColorStop(0.4, 'rgba(215, 218, 225, 0.11)');
        grad.addColorStop(0.75, 'rgba(200, 205, 215, 0.03)');
        grad.addColorStop(1, 'rgba(180, 190, 205, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(renderSmoke);
    };

    renderSmoke();
    return () => cancelAnimationFrame(animId);
  }, []);

  // ================= REALISTIC WIND DRAFT (CURVED MIST PARTICLES - NO STRAIGHT LINES) =================
  const triggerSlowWindDraft = (onWindHitCandles: () => void, onComplete: () => void) => {
    const canvas = windCanvasRef.current;
    if (!canvas) {
      onWindHitCandles();
      setTimeout(onComplete, 1000);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onWindHitCandles();
      setTimeout(onComplete, 1000);
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const candlesEl = document.getElementById('master-candles');
    const rect = candlesEl?.getBoundingClientRect();
    const candleY = rect ? rect.top + rect.height * 0.15 : canvas.height * 0.42;
    const candleX = rect ? rect.left + rect.width * 0.5 : canvas.width * 0.5;

    // 1. Soft-curved streamline ribbons (wisps)
    interface BreezeStream {
      headX: number;
      baseY: number;
      speed: number;
      trailLength: number;
      wavelength: number;
      amplitude: number;
      phase: number;
      width: number;
      alpha: number;
      maxAlpha: number;
    }

    // 2. Volumetric soft mist / vapor puffs
    interface MistPuff {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      growth: number;
      alpha: number;
      maxAlpha: number;
      decay: number;
    }

    // 3. Air sparkle micro-particles
    interface AirSparkle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      sparkleSpeed: number;
      phase: number;
    }

    const streams: BreezeStream[] = [];
    const puffs: MistPuff[] = [];
    const sparkles: AirSparkle[] = [];

    // Create 34 soft-curved streamline ribbons (slow, gentle breeze over 2 to 2.5s)
    for (let i = 0; i < 34; i++) {
      streams.push({
        headX: -Math.random() * 220 - 40,
        baseY: candleY + (Math.random() - 0.5) * 200,
        speed: Math.random() * 1.2 + 4.2, // Gentle slow drift (~4.2 to 5.4 px/frame)
        trailLength: Math.random() * 180 + 130,
        wavelength: Math.random() * 0.012 + 0.008,
        amplitude: Math.random() * 10 + 5,
        phase: Math.random() * Math.PI * 2,
        width: Math.random() * 2.5 + 1.2,
        alpha: 0,
        maxAlpha: Math.random() * 0.35 + 0.18,
      });
    }

    // Create 36 soft volumetric mist puffs
    for (let i = 0; i < 36; i++) {
      puffs.push({
        x: -Math.random() * 200 - 30,
        y: candleY + (Math.random() - 0.5) * 160,
        vx: Math.random() * 1.2 + 3.8,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 16 + 12,
        growth: Math.random() * 0.12 + 0.06,
        alpha: 0,
        maxAlpha: Math.random() * 0.18 + 0.08,
        decay: Math.random() * 0.0018 + 0.001,
      });
    }

    // Create 35 air sparkle micro-particles
    for (let i = 0; i < 35; i++) {
      sparkles.push({
        x: -Math.random() * 180 - 20,
        y: candleY + (Math.random() - 0.5) * 140,
        vx: Math.random() * 1.3 + 4.1,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.2 + 0.7,
        alpha: Math.random() * 0.45 + 0.2,
        sparkleSpeed: Math.random() * 0.08 + 0.04,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;
    const totalFrames = 220; // ~3.6s total animation
    let hitCandlesTriggered = false;

    const animateWind = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Detect when the gentle breeze sweeps across the candle flames (at 2 to 2.5s)
      if (!hitCandlesTriggered) {
        const leadingStream = streams.find(s => s.headX >= candleX - 25);
        if (leadingStream || frame >= 135) {
          hitCandlesTriggered = true;
          onWindHitCandles();
        }
      }

      // 1. Render Soft-Curved Mist Streams (No straight lines!)
      streams.forEach(st => {
        st.headX += st.speed;
        if (st.headX < canvas.width * 0.75) {
          st.alpha = Math.min(st.maxAlpha, st.alpha + 0.04);
        } else {
          st.alpha = Math.max(0, st.alpha - 0.025);
        }

        if (st.alpha <= 0 || st.headX - st.trailLength > canvas.width + 50) return;

        ctx.save();
        ctx.beginPath();
        const steps = 14;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          const px = st.headX - st.trailLength * (1 - t);
          const distToCandle = Math.hypot(px - candleX, st.baseY - candleY);
          const deflection = distToCandle < 220 ? -Math.sin((1 - distToCandle / 220) * Math.PI) * 18 : 0;
          const wave = Math.sin(px * st.wavelength + st.phase) * st.amplitude;
          const py = st.baseY + wave + deflection;

          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        const grad = ctx.createLinearGradient(st.headX - st.trailLength, st.baseY, st.headX, st.baseY);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.35, `rgba(186, 230, 253, ${st.alpha * 0.45})`);
        grad.addColorStop(0.75, `rgba(240, 249, 255, ${st.alpha * 0.85})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = st.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.restore();
      });

      // 2. Render Soft Volumetric Mist Puffs
      puffs.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        if (p.x < candleX) {
          p.alpha = Math.min(p.maxAlpha, p.alpha + 0.02);
        } else {
          p.alpha = Math.max(0, p.alpha - p.decay);
        }

        if (p.alpha <= 0 || p.x - p.radius > canvas.width + 50) return;

        ctx.save();
        const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.05, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.35})`);
        grad.addColorStop(0.45, `rgba(186, 230, 253, ${p.alpha * 0.18})`);
        grad.addColorStop(1, 'rgba(186, 230, 253, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Render Air Sparkle Micro-Particles
      sparkles.forEach(sp => {
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.phase += sp.sparkleSpeed;
        const currentAlpha = Math.max(0, (Math.sin(sp.phase) * 0.5 + 0.5) * sp.alpha);

        if (sp.x > canvas.width + 30) return;

        ctx.save();
        ctx.fillStyle = `rgba(240, 249, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(animateWind);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
      }
    };

    animateWind();
  };

  // Fireworks, Crackers & Celebration Burst
  const triggerCelebrationCrackers = () => {
    const canvas = celebrationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface CrackerSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      sparkle: boolean;
    }

    interface ConfettiPiece {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotSpeed: number;
      wobble: number;
      wobbleSpeed: number;
      alpha: number;
    }

    const sparks: CrackerSpark[] = [];
    const confetti: ConfettiPiece[] = [];

    const vibrantPalette = [
      '#d4af37', '#f5e6b3', '#f43f5e', '#38bdf8', '#a855f7', '#34d399', '#fb923c', '#ffffff',
    ];

    const burstCenters = [
      { x: canvas.width * 0.22, y: canvas.height * 0.28 },
      { x: canvas.width * 0.78, y: canvas.height * 0.25 },
      { x: canvas.width * 0.5, y: canvas.height * 0.18 },
      { x: canvas.width * 0.35, y: canvas.height * 0.42 },
      { x: canvas.width * 0.65, y: canvas.height * 0.4 },
    ];

    const isMobile = window.innerWidth < 768;
    burstCenters.forEach((center, bIndex) => {
      const sparkCount = isMobile ? 22 : 45;
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        sparks.push({
          x: center.x,
          y: center.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.8 + 1.2,
          color: vibrantPalette[(i + bIndex) % vibrantPalette.length],
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008,
          sparkle: Math.random() > 0.4,
        });
      }
    });

    const confettiCount = isMobile ? 45 : 90;
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -120,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2.2 + 1.6,
        size: Math.random() * 6 + 3.5,
        color: vibrantPalette[Math.floor(Math.random() * vibrantPalette.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.09,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.12 + 0.05,
        alpha: 0.95,
      });
    }

    let frame = 0;
    const animateCelebration = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparks.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05;
        s.vx *= 0.97;
        s.alpha -= s.decay;

        if (s.alpha > 0) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.max(0, s.alpha);
          ctx.shadowBlur = s.sparkle ? 6 : 0;
          ctx.shadowColor = s.color;
          ctx.fill();
        }
      });

      confetti.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotSpeed;
        c.wobble += c.wobbleSpeed;

        if (c.y > canvas.height + 20) {
          c.y = -20;
          c.x = Math.random() * canvas.width;
        }

        const widthScale = Math.cos(c.wobble);
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = c.alpha;
        ctx.fillRect((-c.size / 2) * widthScale, -c.size / 2, c.size * widthScale, c.size * 0.6);
        ctx.restore();
      });

      frame++;
      if (frame < 240) {
        requestAnimationFrame(animateCelebration);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animateCelebration();
  };

  const handleReplayConfetti = () => {
    sound.playButtonTap();
    sound.playConfettiPop();
    triggerCelebrationCrackers();
  };

  const handleBlowCandle = () => {
    if (isBlowing || candlesBlown) return;
    setIsBlowing(true);
    sound.playWindBlow();

    triggerSlowWindDraft(
      // 1. Interactive Flame Response: The moment breeze sweeps across the candle flames
      () => {
        setFlameTilt(28);
        setIsFlameTurbulent(true);

        // Animate candle flame elements shrinking gradually (transform: scale(0) over 400ms)
        setTimeout(() => {
          setFlameScale(0);
          setFlameOpacity(0);
          setShowScreenAura(true);

          setTimeout(() => {
            setCandlesBlown(true);
            setIsBlowing(false);
            setIsFlameTurbulent(false);
            emberStartTimeRef.current = Date.now();
            triggerInitialSmokeBurstRef.current = true;

            // Soft screen-glow & smoke wisps drift upward before displaying celebratory header
            setTimeout(() => {
              sound.playCheers();
              sound.playConfettiPop();
              sound.playMagicalChime();
              sound.playHappyBirthdayMelody();
              triggerCelebrationCrackers();
              setShowCelebration(true);

              setTimeout(() => {
                setShowScreenAura(false);
              }, 1200);
            }, 350);
          }, 400); // Exactly 400ms scale(0) shrinking transition
        }, 500);
      },
      // 2. Wind breeze completion
      () => {}
    );
  };

  // Smooth "Knife & Slice" interaction - slices and serves directly forward to the user!
  const handleSliceCake = () => {
    if (cutStage !== 'idle') return;

    setCutStage('knife-cutting');
    sound.playKnifeSlice();

    // 1. Knife slices down into top cake layer (850ms)
    setTimeout(() => {
      setCutStage('slice-lifting');
      sound.playConfettiPop();

      // 2. Slice lifts up out of cake and floats forward to user (700ms)
      setTimeout(() => {
        setCutStage('sliced');
        setShowServedPlate(true);
        sound.playMagicalChime();
      }, 700);
    }, 850);
  };

  // Interactive Cake Bite Handler (User eating their served slice!)
  const handleTakeBite = () => {
    if (biteCount >= 3) {
      setBiteCount(0);
      setBiteFeedback('Here is another fresh, delicious slice for you! 🍰✨');
      sound.playMagicalChime();
      return;
    }

    const nextBite = biteCount + 1;
    setBiteCount(nextBite);
    sound.playCakeBite();

    // Flying sweet crumb particles
    const newCrumbs = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 160 + (Math.random() * 80 - 40),
      y: 130 + (Math.random() * 50 - 25),
      color: ['#4e2a1e', '#ffd700', '#f43f5e', '#ffffff'][Math.floor(Math.random() * 4)],
    }));
    setFlyingCrumbs(newCrumbs);

    if (nextBite === 1) {
      setBiteFeedback('Mmm... rich velvety chocolate & sweet cream! 😋');
    } else if (nextBite === 2) {
      setBiteFeedback('So soft, moist, and fluffy! Pure sweetness ✨');
    } else {
      setBiteFeedback('All gone! Every single bite baked with love for you, Fati! 💕');
      sound.playCheers();
    }

    setTimeout(() => {
      setFlyingCrumbs([]);
    }, 1200);
  };

  // Interactive Cat Petting Handler (Extended 7s sweet reaction)
  const handlePetCat = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      if ('preventDefault' in e) {
        e.preventDefault();
      }
    }
    sound.playCatPurrMeow();
    setIsCatPetted(true);

    const generatedHearts = [
      { id: Date.now() + 1, x: 108, y: 140, delay: 0 },
      { id: Date.now() + 2, x: 124, y: 130, delay: 0.6 },
      { id: Date.now() + 3, x: 92, y: 125, delay: 1.2 },
      { id: Date.now() + 4, x: 116, y: 115, delay: 1.8 },
      { id: Date.now() + 5, x: 102, y: 135, delay: 2.6 },
      { id: Date.now() + 6, x: 128, y: 120, delay: 3.4 },
      { id: Date.now() + 7, x: 88, y: 110, delay: 4.2 },
      { id: Date.now() + 8, x: 112, y: 105, delay: 5.0 },
    ];
    setCatHearts(generatedHearts);

    setTimeout(() => {
      setIsCatPetted(false);
      setCatHearts([]);
    }, 7000);
  };

  return (
    <div
      id="slide-cake"
      className="relative z-10 w-full max-w-4xl mx-auto px-2 sm:px-4 pt-3 sm:pt-5 pb-1 sm:pb-2 flex flex-col items-center justify-between h-[calc(100svh-60px)] max-h-[calc(100svh-60px)] select-none overflow-visible"
    >
      {/* Canvases for Crackers and Wind (Sitting around/behind header at z-30) */}
      <canvas ref={celebrationCanvasRef} className="fixed inset-0 pointer-events-none z-30" />
      <canvas ref={windCanvasRef} className="fixed inset-0 pointer-events-none z-25" />

      {/* ================= SOFT SCREEN-GLOW / PARTICLE AURA TRIGGERED ON CANDLE BLOW ================= */}
      {showScreenAura && (
        <div className="fixed inset-0 pointer-events-none z-35 bg-radial from-amber-300/35 via-amber-500/10 to-transparent animate-screen-aura" />
      )}

      {/* ================= ASCENDING CELEBRATORY BALLOONS (BEHIND TEXT AT Z-20) ================= */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
          {balloons.map(b => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: `${b.left}%`,
                bottom: '-100px',
                animation: `balloonRiseUp ${b.duration}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                animationDelay: `${b.delay}s`,
                willChange: 'transform',
              }}
            >
              <div
                style={{
                  animation: `balloonSway 3.2s ease-in-out infinite alternate`,
                }}
                className="flex flex-col items-center"
              >
                <div
                  style={{
                    width: `${b.size}px`,
                    height: `${b.size * 1.25}px`,
                    background: `radial-gradient(circle at 35% 30%, ${b.highlightColor} 0%, ${b.color} 55%, #05060a 100%)`,
                    borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                    boxShadow: `0 12px 25px rgba(0,0,0,0.5), inset -2px -4px 10px rgba(0,0,0,0.4)`,
                  }}
                  className="relative flex items-center justify-center"
                >
                  <div className="absolute top-2 left-2.5 w-2 h-4 rounded-full bg-white/40 rotate-[-25deg] blur-[0.5px]" />
                </div>

                <div
                  style={{
                    borderTopColor: b.color,
                  }}
                  className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] -mt-0.5"
                />

                <svg
                  width="14"
                  height={b.stringLength}
                  viewBox={`0 0 14 ${b.stringLength}`}
                  className="overflow-visible opacity-70"
                >
                  <path
                    d={`M 7 0 Q 3 ${b.stringLength * 0.3} 10 ${b.stringLength * 0.6} T 6 ${b.stringLength}`}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= CELEBRATORY HEADLINE: "HAPPY BIRTHDAY FATI" (UPGRADED AESTHETIC TYPOGRAPHY) ================= */}
      <div className="relative min-h-[96px] flex items-center justify-center text-center mt-1 mb-2 z-40 overflow-visible pt-1.5">
        {showCelebration ? (
          <div className="animate-birthday-glow relative flex flex-col items-center overflow-visible pt-2 pb-1">
            {/* Atmospheric Warm Golden Halo Glow behind text */}
            <div className="absolute inset-0 -inset-x-12 -inset-y-6 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.22)_0%,rgba(255,165,0,0.1)_45%,transparent_75%)] blur-xl pointer-events-none" />

            {/* Line 1: ✦ HAPPY BIRTHDAY ✦ in Refined Luxury Cinzel Decorative Font */}
            <div className="relative flex items-center justify-center gap-2.5 sm:gap-4 overflow-visible pt-1">
              {/* Custom 4-Pointed Star Sparkle with dot (Left) */}
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffd700] drop-shadow-[0_0_8px_#ffd700] shrink-0 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 C12 8 8 12 3 12 C8 12 12 16 12 21 C12 16 16 12 21 12 C16 12 12 8 12 3 Z" />
                <circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" />
              </svg>

              <h1
                style={{ letterSpacing: '2px' }}
                className="text-2xl sm:text-4xl md:text-5xl font-cinzel-decorative font-bold uppercase golden-neon-glow animate-neon-shimmer select-none text-center leading-normal pt-1"
              >
                HAPPY BIRTHDAY
              </h1>

              {/* Custom 4-Pointed Star Sparkle with dot (Right) */}
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffd700] drop-shadow-[0_0_8px_#ffd700] shrink-0 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 C12 8 8 12 3 12 C8 12 12 16 12 21 C12 16 16 12 21 12 C16 12 12 8 12 3 Z" />
                <circle cx="5" cy="19" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </div>

            {/* Line 2: Fati in Glowing Cursive Calligraphy Accent Font (Great Vibes) */}
            <span
              className="text-4xl sm:text-6xl md:text-7xl font-great-vibes font-normal golden-neon-glow animate-neon-shimmer tracking-normal mt-1 sm:mt-1.5 select-none text-center leading-tight drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]"
            >
              Fati
            </span>
          </div>
        ) : (
          <div className="text-center opacity-90">
            <span className="text-xs font-mono tracking-widest uppercase text-slate-200">
              {cartArrived ? 'The Cake has arrived!' : 'A special guest is approaching...'}
            </span>
          </div>
        )}
      </div>

      {/* ================= PERFECTLY CENTERED MASTER ASSEMBLY (CAT + CART + CAKE + CANDLES) ================= */}
      <div className="relative w-full max-w-[min(540px,88vw,calc((100svh-230px)*540/370))] mx-auto flex items-center justify-center">
        {/* Soft atmospheric ground glow beneath trolley */}
        <div className="absolute bottom-1 inset-x-8 h-10 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Master Stage Container with aspect ratio guarantee */}
        <div
          className={`relative w-full aspect-[540/370] flex items-center justify-center select-none ${
            !cartArrived ? 'animate-cart-slow-enter' : ''
          }`}
        >
          {/* ================= MASTER UNIFIED SVG ================= */}
          <svg
            viewBox="0 0 540 370"
            width="100%"
            height="auto"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full drop-shadow-[0_15px_35px_rgba(0,0,0,0.65)] overflow-visible select-none"
          >
            <defs>
              <linearGradient id="masterPlateRim" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
              <linearGradient id="masterChoco" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4e2a1e" />
                <stop offset="50%" stopColor="#361a11" />
                <stop offset="100%" stopColor="#251009" />
              </linearGradient>
              <linearGradient id="masterSponge" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fdf4eb" />
                <stop offset="50%" stopColor="#f7e5d2" />
                <stop offset="100%" stopColor="#edd0b7" />
              </linearGradient>
              <linearGradient id="masterGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>

              {/* Kawaii Orange Tabby Kitten Gradients */}
              <radialGradient id="kawaiiFurGrad" cx="38%" cy="32%" r="68%">
                <stop offset="0%" stopColor="#ffb978" />
                <stop offset="45%" stopColor="#f59445" />
                <stop offset="85%" stopColor="#ea6c1b" />
                <stop offset="100%" stopColor="#c24e0b" />
              </radialGradient>
              <linearGradient id="kawaiiFurDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d96a1a" />
                <stop offset="100%" stopColor="#9a3412" />
              </linearGradient>
              <radialGradient id="kawaiiCreamBelly" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#fff8ed" />
                <stop offset="100%" stopColor="#fed7aa" />
              </radialGradient>
              <linearGradient id="kawaiiEyeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0b132b" />
                <stop offset="35%" stopColor="#1c2541" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="kawaiiPartyHat" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="40%" stopColor="#a855f7" />
                <stop offset="80%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <radialGradient id="kawaiiPartyGold" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="45%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#f59e0b" />
              </radialGradient>
              <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="55%" stopColor="#facc15" />
                <stop offset="95%" stopColor="#ffffff" />
              </linearGradient>
              <radialGradient id="flameAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(254, 240, 138, 0.75)" />
                <stop offset="50%" stopColor="rgba(245, 158, 11, 0.3)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
              </radialGradient>
              <linearGradient id="smokeWispGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* ================= 1. DESSERT TROLLEY (GROUNDED AT Y=358) ================= */}
            <g id="master-trolley" className={!cartArrived ? 'animate-trolley-sync-bob' : ''}>
              {/* Trolley Legs & Lower Shelf */}
              <rect x="210" y="260" width="8" height="76" fill="#3e2016" stroke="#25120a" strokeWidth="1" />
              <rect x="398" y="260" width="8" height="76" fill="#3e2016" stroke="#25120a" strokeWidth="1" />
              <rect x="195" y="318" width="226" height="8" rx="2" fill="#2d170d" stroke="#482717" strokeWidth="1" />

              {/* Trolley Top Tray (Surface at y=258) */}
              <rect x="175" y="258" width="268" height="14" rx="3" fill="#2d170d" stroke="#482717" strokeWidth="1.5" />
              <line x1="178" y1="260" x2="440" y2="260" stroke="#d4af37" strokeWidth="1.5" />

              {/* Trolley Brass Handle (Extends to x=140, y=264) */}
              <path
                d="M 175 264 L 140 264 L 140 294"
                fill="none"
                stroke="url(#masterGold)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="140" cy="294" r="3" fill="#d4af37" />

              {/* Wheels (Touching ground at y=358) */}
              {/* Left Wheel (center: 220, 340, radius 18) */}
              <g
                className={!cartArrived ? 'animate-wheel-rolling' : ''}
                style={{ transformOrigin: '220px 340px' }}
              >
                <circle cx="220" cy="340" r="18" fill="none" stroke="url(#masterGold)" strokeWidth="3" />
                <circle cx="220" cy="340" r="3.5" fill="#482717" />
                <line x1="220" y1="322" x2="220" y2="358" stroke="#d4af37" strokeWidth="1.4" />
                <line x1="202" y1="340" x2="238" y2="340" stroke="#d4af37" strokeWidth="1.4" />
                <line x1="207" y1="327" x2="233" y2="353" stroke="#d4af37" strokeWidth="1.4" />
                <line x1="207" y1="353" x2="233" y2="327" stroke="#d4af37" strokeWidth="1.4" />
              </g>

              {/* Right Wheel (center: 396, 340, radius 18) */}
              <g
                className={!cartArrived ? 'animate-wheel-rolling' : ''}
                style={{ transformOrigin: '396px 340px' }}
              >
                <circle cx="396" cy="340" r="18" fill="none" stroke="url(#masterGold)" strokeWidth="3" />
                <circle cx="396" cy="340" r="3.5" fill="#482717" />
                <line x1="396" y1="322" x2="396" y2="358" stroke="#d4af37" strokeWidth="1.4" />
                <line x1="378" y1="340" x2="414" y2="340" stroke="#d4af37" strokeWidth="1.4" />
                <line x1="383" y1="327" x2="409" y2="353" stroke="#d4af37" strokeWidth="1.4" />
                <line x1="383" y1="353" x2="409" y2="327" stroke="#d4af37" strokeWidth="1.4" />
              </g>
            </g>

            {/* ================= 2. ADORABLE CHIBI KITTEN PUSHING TROLLEY (PERFECTLY PROPORTIONED) ================= */}
            <g
              id="master-cat"
              className="cursor-pointer group select-none pointer-events-auto"
              onClick={handlePetCat}
            >
              <title>Tap or click to pet the kitten! 💕</title>
              {/* Ground contact shadow beneath standing chibi kitten at y=358 */}
              <ellipse cx="108" cy="358" rx="28" ry="4" fill="#04060d" opacity="0.45" />

              {/* Master Body Waddle & Step Container (Synchronized with Cart Deceleration) */}
              <g className={!cartArrived ? 'animate-cat-sync-waddle' : 'animate-kawaii-breathe'}>
                {/* ----- 1. FLUFFY SWAYING TAIL (Permanently rooted at lower body (78, 332)) ----- */}
                <g transform="translate(78, 332)">
                  <g className={isCatPetted ? 'animate-cat-happy-tail' : 'animate-kawaii-cat-tail'}>
                    {/* Gracefully upward curling kawaii tail */}
                    <path
                      d="M 0 0 C -18 -6, -28 -28, -22 -48 C -18 -60, -6 -64, 0 -54 C 5 -46, -2 -38, -6 -28 C -10 -16, -4 -6, 0 0 Z"
                      fill="url(#kawaiiFurGrad)"
                      stroke="#ea580c"
                      strokeWidth="1.2"
                    />
                    {/* Marshmallow fluffy white tail tip */}
                    <path
                      d="M -20 -50 C -16 -60, -6 -64, 0 -54 C 4 -48, -2 -42, -7 -36 C -12 -38, -17 -44, -20 -50 Z"
                      fill="#ffffff"
                    />
                  </g>
                </g>

                {/* ----- 2. CHUBBY PEAR-SHAPED CHIBI BODY (Proportional, Soft & Rounded) ----- */}
                {/* Torso: flares gently over hips/thighs, rounded belly base, smooth tapering towards neck at y=252 */}
                <path
                  d="M 94 252 
                     C 86 260, 78 282, 76 308 
                     C 74 330, 80 354, 96 354 
                     C 104 354, 112 354, 120 354 
                     C 136 354, 142 330, 140 308 
                     C 138 282, 130 260, 122 252 Z"
                  fill="url(#kawaiiFurGrad)"
                  stroke="#ea580c"
                  strokeWidth="1.6"
                />

                {/* Soft Back Fur Highlights */}
                <path
                  d="M 80 326 C 78 296, 82 268, 92 254"
                  stroke="#fed7aa"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />

                {/* Left Tabby Side Stripes */}
                <path d="M 76 296 Q 86 298, 92 295" stroke="#c24e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 75 316 Q 86 319, 93 315" stroke="#c24e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 78 335 Q 88 337, 95 333" stroke="#c24e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />

                {/* Right Tabby Side Stripes */}
                <path d="M 140 296 Q 130 298, 124 295" stroke="#c24e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 141 316 Q 130 319, 123 315" stroke="#c24e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 138 335 Q 128 337, 121 333" stroke="#c24e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />

                {/* Marshmallow White Plump Oval Belly */}
                <ellipse cx="108" cy="312" rx="21" ry="27" fill="url(#kawaiiCreamBelly)" stroke="#fed7aa" strokeWidth="0.8" />

                {/* ----- 3. CHUBBY BACK LEGS & FEET (Synchronized Decelerating Walking) ----- */}
                {/* Left foot with synchronized stepping animation */}
                <g className={!cartArrived ? 'animate-cat-sync-walk-left' : ''}>
                  <ellipse cx="94" cy="356" rx="8" ry="4.2" fill="#ffffff" stroke="#fed7aa" strokeWidth="0.9" />
                  <line x1="92" y1="355" x2="92" y2="357" stroke="#fda4af" strokeWidth="0.8" strokeLinecap="round" />
                  <line x1="95" y1="355" x2="95" y2="357" stroke="#fda4af" strokeWidth="0.8" strokeLinecap="round" />
                </g>

                {/* Right foot with synchronized alternate stepping animation */}
                <g className={!cartArrived ? 'animate-cat-sync-walk-right' : ''}>
                  <ellipse cx="122" cy="356" rx="8" ry="4.2" fill="#ffffff" stroke="#fed7aa" strokeWidth="0.9" />
                  <line x1="120" y1="355" x2="120" y2="357" stroke="#fda4af" strokeWidth="0.8" strokeLinecap="round" />
                  <line x1="123" y1="355" x2="123" y2="357" stroke="#fda4af" strokeWidth="0.8" strokeLinecap="round" />
                </g>

                {/* ----- 4. CUTE CHIBI HEAD WITH FLUFFY ROUND CHEEKS (Balanced 1:1 Proportion) ----- */}
                {/* Head Silhouette: chubby squishy cheeks, soft rounded forehead, cheek fluff tufts */}
                <path
                  d="M 94 198 
                     C 100 195, 116 195, 122 198
                     C 134 200, 144 212, 146 226
                     C 147 239, 138 249, 124 253
                     C 114 255, 102 255, 92 253
                     C 78 249, 69 239, 70 226
                     C 72 212, 82 200, 94 198 Z"
                  fill="url(#kawaiiFurGrad)"
                  stroke="#ea580c"
                  strokeWidth="1.6"
                />

                {/* Fluffy Cheek Tuft Accents */}
                <path d="M 70 224 Q 65 228, 71 232" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 146 224 Q 151 228, 145 232" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />

                {/* Soft Forehead Highlight */}
                <path d="M 96 200 Q 108 197 120 200" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

                {/* Left Fluffy Kitten Ear */}
                <path
                  d="M 82 204 L 76 172 Q 86 182 96 197 Z"
                  fill="url(#kawaiiFurGrad)"
                  stroke="#ea580c"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <polygon points="81,200 79,178 93,195" fill="#fda4af" />
                <path d="M 83 194 Q 86 188 90 192" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />

                {/* Right Fluffy Kitten Ear */}
                <path
                  d="M 120 197 Q 130 182 140 172 L 134 204 Z"
                  fill="url(#kawaiiFurGrad)"
                  stroke="#ea580c"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <polygon points="123,195 137,178 135,200" fill="#fda4af" />
                <path d="M 126 192 Q 130 188 133 194" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />

                {/* ----- 5. NATURALLY ATTACHED BIRTHDAY PARTY HAT ----- */}
                <g id="chibi-party-hat">
                  {/* Elastic chin strap comfortably curving along cheek */}
                  <path d="M 94 202 Q 102 248 120 248" stroke="#f472b6" strokeWidth="1.2" fill="none" strokeDasharray="3 2" />

                  {/* Main Party Hat Cone nestled between the ears */}
                  <polygon points="98,197 118,197 108,148" fill="url(#kawaiiPartyHat)" stroke="#ec4899" strokeWidth="0.8" />

                  {/* Festive Colorful Stripes */}
                  <path d="M 100 195 L 105 182 L 108 182 L 103 195 Z" fill="#fde047" opacity="0.95" />
                  <path d="M 104 186 L 108 172 L 111 173 L 107 187 Z" fill="#34d399" opacity="0.95" />
                  <path d="M 106 174 L 109 160 L 112 161 L 109 175 Z" fill="#38bdf8" opacity="0.95" />
                  <path d="M 108 162 L 109 152 L 111 153 L 110 163 Z" fill="#fb7185" opacity="0.95" />

                  {/* Sparkle Polka Dots */}
                  <circle cx="103" cy="190" r="1.2" fill="#ffffff" />
                  <circle cx="114" cy="186" r="1.2" fill="#fef08a" />
                  <circle cx="109" cy="178" r="1.1" fill="#ffffff" />

                  {/* White Fluffy Tinsel Brim sitting cleanly on skull curve */}
                  <path
                    d="M 96 197 Q 100 194 104 196 Q 108 193 112 195 Q 116 193 120 196"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                  />

                  {/* Golden Pom-Pom & Star Sparkle at Apex (108, 148) */}
                  <circle cx="108" cy="148" r="5.5" fill="url(#kawaiiPartyGold)" stroke="#d97706" strokeWidth="0.6" />
                  <circle cx="106.5" cy="146.5" r="1.5" fill="#ffffff" />
                  <line x1="108" y1="140" x2="108" y2="156" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
                  <line x1="100" y1="148" x2="116" y2="148" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
                  <line x1="102" y1="142" x2="114" y2="154" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />
                  <line x1="102" y1="154" x2="114" y2="142" stroke="#fef08a" strokeWidth="0.8" strokeLinecap="round" />
                </g>

                {/* ----- 6. ADORABLE KAWAII FACE ----- */}
                {/* Tabby Forehead Stripes */}
                <path d="M 104 204 L 105 210 M 108 203 L 108 211 M 112 204 L 111 210" stroke="#c24e0b" strokeWidth="1.8" strokeLinecap="round" />

                {/* Left Glossy Anime Kitten Eye (Squints happily when petted) */}
                {isCatPetted ? (
                  <g id="chibi-left-eye-happy">
                    <path d="M 89 221 Q 95 214 101 221" fill="none" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
                    <path d="M 90 223 Q 95 216 100 223" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                ) : (
                  <g id="chibi-left-eye">
                    <ellipse cx="95" cy="221" rx="5" ry="6.5" fill="#090d16" />
                    <ellipse cx="95.5" cy="222" rx="4.5" ry="6" fill="url(#kawaiiEyeGrad)" />
                    <ellipse cx="95.8" cy="221" rx="2.8" ry="4.2" fill="#090d16" />
                    <ellipse cx="95.5" cy="225" rx="2.8" ry="1.5" fill="#7dd3fc" opacity="0.85" />
                    <circle cx="97.5" cy="218.5" r="2" fill="#ffffff" />
                    <circle cx="93.5" cy="224" r="1" fill="#ffffff" />
                    <path d="M 90 216 Q 95 213 100 217" fill="none" stroke="#090d16" strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                )}

                {/* Right Glossy Anime Kitten Eye (Squints happily when petted) */}
                {isCatPetted ? (
                  <g id="chibi-right-eye-happy">
                    <path d="M 115 221 Q 121 214 127 221" fill="none" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
                    <path d="M 116 223 Q 121 216 126 223" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                ) : (
                  <g id="chibi-right-eye">
                    <ellipse cx="121" cy="221" rx="5" ry="6.5" fill="#090d16" />
                    <ellipse cx="121.5" cy="222" rx="4.5" ry="6" fill="url(#kawaiiEyeGrad)" />
                    <ellipse cx="121.8" cy="221" rx="2.8" ry="4.2" fill="#090d16" />
                    <ellipse cx="121.5" cy="225" rx="2.8" ry="1.5" fill="#7dd3fc" opacity="0.85" />
                    <circle cx="123.5" cy="218.5" r="2" fill="#ffffff" />
                    <circle cx="119.5" cy="224" r="1" fill="#ffffff" />
                    <path d="M 116 216 Q 121 213 126 217" fill="none" stroke="#090d16" strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                )}

                {/* Soft Glowing Rosy Cheeks (Blooms extra pink on pet) */}
                <ellipse cx="83" cy="228" rx={isCatPetted ? 8 : 6} ry={isCatPetted ? 5 : 4} fill="#f43f5e" opacity={isCatPetted ? 0.85 : 0.45} />
                <ellipse cx="133" cy="228" rx={isCatPetted ? 8 : 6} ry={isCatPetted ? 5 : 4} fill="#f43f5e" opacity={isCatPetted ? 0.85 : 0.45} />
                <line x1="81" y1="227" x2="85" y2="229" stroke="#fda4af" strokeWidth="0.8" strokeLinecap="round" />
                <line x1="131" y1="227" x2="135" y2="229" stroke="#fda4af" strokeWidth="0.8" strokeLinecap="round" />

                {/* Marshmallow Whisker Pads */}
                <ellipse cx="104" cy="229" rx="3.6" ry="2.8" fill="#ffffff" opacity="0.95" />
                <ellipse cx="112" cy="229" rx="3.6" ry="2.8" fill="#ffffff" opacity="0.95" />

                {/* Cute Pink Button Nose */}
                <polygon points="106,225 110,225 108,228" fill="#f43f5e" />
                <circle cx="107.5" cy="225.5" r="0.5" fill="#ffffff" />

                {/* Sweet ":3" Cat Smile */}
                <path
                  d="M 103.5 228.5 Q 105.5 231.5 108 228.5 Q 110.5 231.5 112.5 228.5"
                  fill="none"
                  stroke="#78350f"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />

                {/* Delicate Curved White Whiskers */}
                <g opacity="0.9">
                  <path d="M 83 225 Q 73 222 65 224" stroke="#ffffff" strokeWidth="0.9" fill="none" />
                  <path d="M 83 229 Q 72 230 66 235" stroke="#ffffff" strokeWidth="0.9" fill="none" />

                  <path d="M 133 225 Q 143 222 151 224" stroke="#ffffff" strokeWidth="0.9" fill="none" />
                  <path d="M 133 229 Q 144 230 150 235" stroke="#ffffff" strokeWidth="0.9" fill="none" />
                </g>

                {/* Dainty Golden Collar & Chime Bell at Neck (y=252) */}
                <path d="M 94 250 Q 108 258 122 250" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <circle cx="108" cy="256" r="3.4" fill="url(#kawaiiPartyGold)" stroke="#d97706" strokeWidth="0.8" />
                <circle cx="107" cy="254.5" r="0.9" fill="#ffffff" />

                {/* ----- 7. FRONT PAWS (RESTING COMFORTABLY DIRECTLY ON CART HANDLE AT Y=264) ----- */}
                {/* Natural arm reach: shoulders at y=256-260, paws cup right on top of brass bar at y=264 */}
                <g id="chibi-front-paws">
                  {/* Left Arm & Paw */}
                  <path
                    d="M 118 258 Q 128 258 138 262"
                    fill="none"
                    stroke="url(#kawaiiFurGrad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <ellipse cx="138" cy="263" rx="6.5" ry="4.8" fill="#ffffff" stroke="#fed7aa" strokeWidth="1" />
                  <ellipse cx="137" cy="263" rx="2" ry="1.4" fill="#fda4af" />

                  {/* Right Arm & Paw */}
                  <path
                    d="M 124 258 Q 134 258 146 262"
                    fill="none"
                    stroke="url(#kawaiiFurGrad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <ellipse cx="146" cy="263" rx="6.5" ry="4.8" fill="#ffffff" stroke="#fed7aa" strokeWidth="1" />
                  <ellipse cx="145" cy="263" rx="2" ry="1.4" fill="#fda4af" />
                </g>
              </g>

              {/* Floating Hearts When Cat is Petted */}
              {catHearts.map(h => (
                <g
                  key={h.id}
                  className="animate-float-heart pointer-events-none"
                  style={{ animationDelay: `${h.delay || 0}s` }}
                  transform={`translate(${h.x}, ${h.y})`}
                >
                  <path d="M 0 0 C -4 -6, -9 -6, -9 -1 C -9 5, 0 10, 0 12 C 0 10, 9 5, 9 -1 C 9 -6, 4 -6, 0 0 Z" fill="#f43f5e" />
                </g>
              ))}
            </g>

            {/* ================= 3. BIRTHDAY CAKE (FLUSH ON TROLLEY TRAY AT Y=258) ================= */}
            <g id="master-cake">
              {/* Platter Shadow & Dish Base (zero vertical gap, sitting on y=258) */}
              <ellipse cx="310" cy="259" rx="128" ry="12" fill="#170c07" opacity="0.55" />
              <path
                d="M 186 254 Q 310 274 434 254 L 430 258 Q 310 278 190 258 Z"
                fill="#3e2016"
                stroke="#22110b"
                strokeWidth="1.5"
              />
              <path
                d="M 224 262 Q 310 272 384 266"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <ellipse cx="310" cy="254" rx="122" ry="18" fill="url(#masterPlateRim)" stroke="#3e2016" strokeWidth="2.2" />
              <ellipse cx="310" cy="253" rx="116" ry="15" fill="#ffffff" />

              {/* ================= TIER 1 (BASE TIER) ================= */}
              <g>
                <path
                  d="M 200 196 Q 310 214 420 196 L 420 248 Q 310 268 200 248 Z"
                  fill="url(#masterSponge)"
                  stroke="#381e14"
                  strokeWidth="2.5"
                />
                <path d="M 202 230 Q 310 250 418 230" fill="none" stroke="#d7ba9d" strokeWidth="2.5" />

                {/* Candy Polka Dots */}
                <circle cx="216" cy="242" r="4.5" fill="#e53935" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="230" cy="245" r="4" fill="#f59e0b" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="244" cy="250" r="5" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="270" cy="256" r="5" fill="#0284c7" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="296" cy="258" r="5.5" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="322" cy="257" r="4.5" fill="#451a03" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="340" cy="254" r="4.5" fill="#ea580c" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="362" cy="253" r="5.5" fill="#0284c7" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="386" cy="248" r="4.5" fill="#78350f" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="404" cy="242" r="5" fill="#eab308" stroke="#381e14" strokeWidth="0.8" />

                {/* Chocolate Drip Ganache */}
                <path
                  d="M 198 194 Q 310 216 422 194 
                     Q 424 216 414 226 Q 404 236 396 222 
                     Q 388 210 380 228 Q 372 246 362 238 
                     Q 352 230 344 220 Q 334 212 324 232 
                     Q 314 252 302 244 Q 290 236 282 218 
                     Q 272 208 262 234 Q 252 256 242 246 
                     Q 232 236 226 216 Q 216 230 206 224 Q 200 216 198 194 Z"
                  fill="url(#masterChoco)"
                  stroke="#221008"
                  strokeWidth="2.5"
                />

                {/* White Gloss Sheen Curves */}
                <path d="M 206 199 Q 232 208 262 207" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                <path d="M 242 241 Q 244 249 247 246" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <path d="M 300 240 Q 303 248 306 245" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <path d="M 372 238 Q 374 245 376 241" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <path d="M 320 206 Q 370 204 412 197" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />

                {/* Colorful Elongated Sprinkles */}
                <line x1="214" y1="204" x2="223" y2="209" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" />
                <line x1="234" y1="214" x2="243" y2="210" stroke="#ffeb3b" strokeWidth="3" strokeLinecap="round" />
                <line x1="272" y1="216" x2="280" y2="224" stroke="#ff4081" strokeWidth="3" strokeLinecap="round" />
                <line x1="292" y1="219" x2="301" y2="216" stroke="#ff9800" strokeWidth="3" strokeLinecap="round" />
                <line x1="336" y1="218" x2="345" y2="223" stroke="#f44336" strokeWidth="3" strokeLinecap="round" />
                <line x1="357" y1="220" x2="366" y2="216" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" />
                <line x1="382" y1="216" x2="390" y2="211" stroke="#ffeb3b" strokeWidth="3" strokeLinecap="round" />
                <line x1="400" y1="208" x2="408" y2="214" stroke="#ff4081" strokeWidth="3" strokeLinecap="round" />
              </g>

              {/* ================= TIER 2 (MIDDLE TIER) ================= */}
              <g>
                <path
                  d="M 220 144 Q 310 162 400 144 L 400 196 Q 310 216 220 196 Z"
                  fill="url(#masterSponge)"
                  stroke="#381e14"
                  strokeWidth="2.5"
                />
                <path d="M 222 174 Q 310 192 398 174" fill="none" stroke="#d7ba9d" strokeWidth="2.5" />

                <circle cx="234" cy="186" r="4" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="250" cy="190" r="4.5" fill="#0284c7" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="274" cy="195" r="4.5" fill="#16a34a" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="294" cy="197" r="4" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="320" cy="198" r="4.5" fill="#f59e0b" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="350" cy="197" r="5" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="370" cy="192" r="4" fill="#f43f5e" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="388" cy="186" r="4.5" fill="#0284c7" stroke="#381e14" strokeWidth="0.8" />

                {/* Chocolate Drip Ganache */}
                <path
                  d="M 218 142 Q 310 163 402 142 
                     Q 404 160 396 170 Q 388 180 380 166 
                     Q 372 154 364 174 Q 354 192 344 182 
                     Q 334 172 326 160 Q 316 154 306 176 
                     Q 296 196 284 186 Q 274 176 266 160 
                     Q 256 152 246 174 Q 236 190 228 180 Q 220 168 218 142 Z"
                  fill="url(#masterChoco)"
                  stroke="#221008"
                  strokeWidth="2.5"
                />

                <path d="M 226 148 Q 262 156 292 155" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                <path d="M 238 176 Q 240 184 243 181" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
                <path d="M 298 186 Q 300 194 303 190" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
                <path d="M 354 182 Q 356 190 358 186" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
                <path d="M 326 154 Q 362 152 396 146" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />

                <line x1="234" y1="153" x2="242" y2="158" stroke="#00e5ff" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="254" y1="162" x2="262" y2="157" stroke="#ffeb3b" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="286" y1="163" x2="294" y2="170" stroke="#ff4081" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="312" y1="165" x2="321" y2="162" stroke="#ff9800" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="340" y1="164" x2="348" y2="169" stroke="#00e5ff" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="372" y1="160" x2="380" y2="155" stroke="#ffeb3b" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="386" y1="153" x2="394" y2="159" stroke="#ff4081" strokeWidth="2.8" strokeLinecap="round" />
              </g>

              {/* ================= TIER 3 (TOP TIER) ================= */}
              <g id="master-tier-3">
                {/* Main Top Tier Body */}
                <path
                  d="M 240 98 Q 310 112 380 98 L 380 140 Q 310 156 240 140 Z"
                  fill="url(#masterSponge)"
                  stroke="#381e14"
                  strokeWidth="2.5"
                />

                {/* Base Cake Sprinkles & Berries on Front/Left */}
                <circle cx="254" cy="130" r="3.5" fill="#f59e0b" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="270" cy="135" r="4" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                <circle cx="300" cy="138" r="4" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />

                {/* Chocolate Drip Ganache & Top Cap */}
                <path
                  d="M 236 96 Q 310 112 384 96 
                     Q 386 110 378 118 Q 370 126 364 114 
                     Q 356 106 348 122 Q 340 138 332 128 
                     Q 324 118 316 110 Q 308 104 300 124 
                     Q 292 142 282 132 Q 274 122 266 110 
                     Q 258 102 250 122 Q 242 136 234 126 Q 230 116 236 96 Z"
                  fill="url(#masterChoco)"
                  stroke="#221008"
                  strokeWidth="2.5"
                />

                <ellipse cx="310" cy="96" rx="74" ry="12" fill="#442216" stroke="#221008" strokeWidth="1.5" />

                {/* Decorative ganache piping lines */}
                <path d="M 246 100 Q 272 106 298 105" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                <path d="M 250 122 Q 252 130 255 126" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
                <path d="M 294 132 Q 296 139 299 135" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />

                <line x1="250" y1="104" x2="258" y2="109" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="268" y1="112" x2="276" y2="107" stroke="#ffeb3b" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="292" y1="114" x2="300" y2="119" stroke="#ff4081" strokeWidth="2.5" strokeLinecap="round" />

                {/* Exposed Inner Cut Wall (Revealed inside cavity when slice lifts and slides away) */}
                {(cutStage === 'slice-lifting' || cutStage === 'sliced') && (
                  <g className="animate-fadeIn">
                    <polygon
                      points="310,96 376,98 376,138 310,140"
                      fill="url(#masterSponge)"
                      stroke="#2f190e"
                      strokeWidth="1.5"
                    />
                    <line x1="310" y1="118" x2="376" y2="118" stroke="#361a11" strokeWidth="3.5" strokeLinecap="round" />
                    <polygon points="310,96 376,98 376,138 310,140" fill="rgba(0,0,0,0.18)" />
                  </g>
                )}

                {/* ================= TRIANGULAR CAKE SLICE (LIFTS AND FLOATS FORWARD TOWARDS USER) ================= */}
                <g
                  id="cake-triangular-slice"
                  style={{
                    transform:
                      cutStage === 'slice-lifting'
                        ? 'translateY(-26px) translateX(6px) scale(1.08)'
                        : cutStage === 'sliced'
                        ? 'translateY(16px) translateX(14px)'
                        : 'translateY(0px) translateX(0px)',
                    transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
                    filter:
                      cutStage === 'slice-lifting'
                        ? 'drop-shadow(0 15px 25px rgba(245,158,11,0.6))'
                        : cutStage === 'sliced'
                        ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.65))'
                        : 'none',
                    willChange: 'transform',
                  }}
                >
                  {/* Slice Sponge Front Face */}
                  <path
                    d="M 330 108 L 378 98 L 378 138 Q 355 146 330 144 Z"
                    fill="url(#masterSponge)"
                    stroke="#381e14"
                    strokeWidth="2"
                  />

                  {/* Slice Chocolate Ganache Top Wedge */}
                  <path
                    d="M 310 96 L 378 98 Q 355 108 330 108 Z"
                    fill="url(#masterChoco)"
                    stroke="#221008"
                    strokeWidth="2"
                  />

                  {/* Slice Inner Cut Side Wall (Visible when slice slides away) */}
                  {(cutStage === 'slice-lifting' || cutStage === 'sliced') && (
                    <g>
                      <polygon
                        points="310,96 330,108 330,144 310,138"
                        fill="url(#masterSponge)"
                        stroke="#2f190e"
                        strokeWidth="1.5"
                      />
                      <line x1="310" y1="118" x2="330" y2="126" stroke="#361a11" strokeWidth="3" strokeLinecap="round" />
                    </g>
                  )}

                  {/* Slice Chocolate Filling Line on Front */}
                  <path d="M 330 126 Q 355 128 378 118" stroke="#361a11" strokeWidth="3" strokeLinecap="round" />

                  {/* Slice Ganache Glaze Drips */}
                  <path
                    d="M 330 108 Q 340 120 348 112 Q 358 122 368 110 Q 374 116 378 98"
                    fill="url(#masterChoco)"
                    stroke="#221008"
                    strokeWidth="1.2"
                  />

                  {/* Decorative Sprinkles on Slice */}
                  <line x1="338" y1="104" x2="346" y2="108" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="352" y1="102" x2="360" y2="106" stroke="#ffeb3b" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="364" y1="100" x2="372" y2="103" stroke="#ff4081" strokeWidth="2.2" strokeLinecap="round" />

                  {/* Sweet Red Cherry on Slice */}
                  <circle cx="355" cy="98" r="4.5" fill="#dc2626" stroke="#381e14" strokeWidth="0.8" />
                  <circle cx="353.5" cy="96" r="1.5" fill="#ffffff" opacity="0.85" />
                </g>
              </g>

              {/* ================= 4. CANDY BERRIES ON TOP (NESTLED NATURALLY AROUND CANDLES) ================= */}
              <g id="master-candies">
                {/* Red Candy (Flanking Left of Yellow Candle) */}
                <ellipse cx="264" cy="98" rx="9" ry="11" fill="#e53935" stroke="#381e14" strokeWidth="1.5" />
                <ellipse cx="262" cy="94" rx="3" ry="4" fill="#ffffff" opacity="0.75" />

                {/* Lime Green Candy (Flanking Right of Pink Candle) */}
                <ellipse cx="356" cy="98" rx="10" ry="12" fill="#7cb342" stroke="#381e14" strokeWidth="1.5" />
                <ellipse cx="353" cy="93" rx="3.5" ry="4.5" fill="#ffffff" opacity="0.75" />

                {/* Cute Front Berry (Nestled at Base of Middle Candle) */}
                <ellipse cx="310" cy="104" rx="6.5" ry="8" fill="#d81b60" stroke="#381e14" strokeWidth="1.2" />
                <ellipse cx="308.5" cy="101" rx="2" ry="2.8" fill="#ffffff" opacity="0.75" />
              </g>

              {/* ================= 5. 3 SPIRAL CANDLES & WICKS (PERFECTLY TIGHT GAP) ================= */}
              <g id="master-candles">
                {/* CANDLE 1 (LEFT: YELLOW SPIRAL) - CENTER AT X=287 */}
                <g>
                  <rect x="280.5" y="68" width="13" height="38" rx="3" fill="#facc15" stroke="#381e14" strokeWidth="1.5" />
                  <path d="M 280.5 74 L 293.5 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 280.5 84 L 293.5 90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 280.5 94 L 293.5 100" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="287" cy="105" rx="6.5" ry="2.5" fill="#ca8a04" opacity="0.6" />
                  {/* Black Wick: Base at (287, 68), Tip at (287, 60) */}
                  <line x1="287" y1="68" x2="287" y2="60" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* CANDLE 2 (CENTER: PURPLE SPIRAL) - CENTER AT X=310 */}
                <g>
                  <rect x="303.5" y="62" width="13" height="44" rx="3" fill="#a21caf" stroke="#381e14" strokeWidth="1.5" />
                  <path d="M 303.5 70 L 316.5 76" stroke="#fbcfe8" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 303.5 80 L 316.5 86" stroke="#fbcfe8" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 303.5 90 L 316.5 96" stroke="#fbcfe8" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="310" cy="105" rx="6.5" ry="2.5" fill="#701a75" opacity="0.6" />
                  {/* Black Wick: Base at (310, 62), Tip at (310, 54) */}
                  <line x1="310" y1="62" x2="310" y2="54" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* CANDLE 3 (RIGHT: PINK SPIRAL) - CENTER AT X=333 */}
                <g>
                  <rect x="326.5" y="68" width="13" height="38" rx="3" fill="#db2777" stroke="#381e14" strokeWidth="1.5" />
                  <path d="M 326.5 74 L 339.5 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 326.5 84 L 339.5 90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 326.5 94 L 339.5 100" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="333" cy="105" rx="6.5" ry="2.5" fill="#9d174d" opacity="0.6" />
                  {/* Black Wick: Base at (333, 68), Tip at (333, 60) */}
                  <line x1="333" y1="68" x2="333" y2="60" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
                </g>
              </g>

              {/* ================= 6. CANDLE FLAMES (GRADUAL SHRINKING SCALE(0) OVER 400MS) ================= */}
              {!candlesBlown && (
                <g
                  id="master-flames"
                  style={{
                    opacity: flameOpacity,
                    transition: 'opacity 0.4s ease-out',
                  }}
                >
                  {/* FLAME 1 (LEFT): Anchored at wick tip (287, 60) */}
                  <g
                    transform={`rotate(${flameTilt}, 287, 60) scale(${flameScale})`}
                    style={{
                      transformOrigin: '287px 60px',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
                    }}
                    className={isFlameTurbulent ? 'animate-flame-wild-flicker' : 'animate-flame-flicker'}
                  >
                    <circle cx="287" cy="49" r="14" fill="url(#flameAura)" />
                    <path
                      d="M 282.5 60 Q 280.5 50 287 38 Q 293.5 50 291.5 60 Z"
                      fill="url(#flameGrad)"
                    />
                    <path
                      d="M 284.5 60 Q 283.5 53 287 47 Q 289.5 53 289.5 60 Z"
                      fill="#ffffff"
                    />
                  </g>

                  {/* FLAME 2 (CENTER): Anchored at wick tip (310, 54) */}
                  <g
                    transform={`rotate(${flameTilt}, 310, 54) scale(${flameScale})`}
                    style={{
                      transformOrigin: '310px 54px',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
                    }}
                    className={isFlameTurbulent ? 'animate-flame-wild-flicker' : 'animate-flame-flicker'}
                  >
                    <circle cx="310" cy="42" r="15" fill="url(#flameAura)" />
                    <path
                      d="M 305 54 Q 303 43 310 30 Q 317 43 315 54 Z"
                      fill="url(#flameGrad)"
                    />
                    <path
                      d="M 307.5 54 Q 306 47 310 40 Q 314 47 312.5 54 Z"
                      fill="#ffffff"
                    />
                  </g>

                  {/* FLAME 3 (RIGHT): Anchored at wick tip (333, 60) */}
                  <g
                    transform={`rotate(${flameTilt}, 333, 60) scale(${flameScale})`}
                    style={{
                      transformOrigin: '333px 60px',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out',
                    }}
                    className={isFlameTurbulent ? 'animate-flame-wild-flicker' : 'animate-flame-flicker'}
                  >
                    <circle cx="333" cy="49" r="14" fill="url(#flameAura)" />
                    <path
                      d="M 328.5 60 Q 326.5 50 333 38 Q 339.5 50 337.5 60 Z"
                      fill="url(#flameGrad)"
                    />
                    <path
                      d="M 330.5 60 Q 329.5 53 333 47 Q 335.5 53 335.5 60 Z"
                      fill="#ffffff"
                    />
                  </g>
                </g>
              )}

              {/* ================= SUBTLE SVG SMOKE WISPS DRIFTING UPWARD FROM WICKS ================= */}
              {candlesBlown && (
                <g id="svg-smoke-wisps" className="pointer-events-none">
                  {/* Left Wick (287, 60) */}
                  <g transform="translate(287, 60)" className="animate-smoke-wisp-1">
                    <path
                      d="M 0 0 Q -5 -16 3 -32 T -2 -60"
                      fill="none"
                      stroke="url(#smokeWispGrad)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </g>
                  {/* Center Wick (310, 54) */}
                  <g transform="translate(310, 54)" className="animate-smoke-wisp-2">
                    <path
                      d="M 0 0 Q 6 -18 -4 -38 T 3 -66"
                      fill="none"
                      stroke="url(#smokeWispGrad)"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                  </g>
                  {/* Right Wick (333, 60) */}
                  <g transform="translate(333, 60)" className="animate-smoke-wisp-3">
                    <path
                      d="M 0 0 Q 5 -15 -3 -30 T 2 -58"
                      fill="none"
                      stroke="url(#smokeWispGrad)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </g>
                </g>
              )}

            </g>

            {/* ================= 7. CHEF'S KNIFE SLICING ANIMATION (SLICES INTO TOP LAYER) ================= */}
            {cutStage === 'knife-cutting' && (
              <g className="animate-knife-cut-cake drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] pointer-events-none">
                <defs>
                  <linearGradient id="knifeBladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="60%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                  <linearGradient id="knifeHandleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#78350f" />
                    <stop offset="100%" stopColor="#451a03" />
                  </linearGradient>
                </defs>
                <g transform="translate(0, 0)">
                  <rect x="0" y="0" width="13" height="42" rx="4" fill="url(#knifeHandleGrad)" stroke="#271005" strokeWidth="1.5" />
                  <circle cx="6.5" cy="12" r="1.8" fill="#d4af37" />
                  <circle cx="6.5" cy="28" r="1.8" fill="#d4af37" />
                  <rect x="-2" y="42" width="17" height="6" rx="2" fill="#d4af37" />
                  <path d="M 2 48 L 11 48 L 10 116 Q 8 128 -2 130 L -2 48 Z" fill="url(#knifeBladeGrad)" stroke="#475569" strokeWidth="1.2" />
                  <line x1="-1" y1="50" x2="-1" y2="126" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              </g>
            )}
          </svg>

          {/* Smoke Canvas: Extended upwards to allow smoke to drift towards header */}
          <canvas
            ref={smokeCanvasRef}
            width={540}
            height={480}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 'calc(-100% * 110 / 370)',
              width: '100%',
              height: 'calc(100% * 480 / 370)',
              pointerEvents: 'none',
              zIndex: 30,
            }}
          />
        </div>
      </div>

      {/* ================= STEP-BY-STEP ACTION BUTTONS WITH MICRO-FEEDBACK ================= */}
      <div className="mt-3 min-h-[48px] flex flex-wrap items-center justify-center gap-2.5 z-20 px-2">
        {!cartArrived ? (
          <div className="text-xs font-mono text-slate-300 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>The procession is arriving...</span>
          </div>
        ) : !candlesBlown ? (
          !isBlowing ? (
            <div className="flex items-center gap-2.5 flex-wrap justify-center animate-zoomIn">
              <button
                id="blow-candle-btn"
                onClick={handleBlowCandle}
                className="group relative overflow-hidden min-h-[48px] px-8 py-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-serif text-xs md:text-sm font-bold tracking-widest uppercase shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.7)] flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-amber-300/60"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmerGlow_1.6s_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                <Wind className="w-4 h-4 text-stone-950" />
                <span className="relative z-10">Blow Candle</span>
              </button>
            </div>
          ) : null
        ) : cutStage === 'idle' ? (
          <div className="flex items-center gap-2.5 flex-wrap justify-center animate-zoomIn">
            <button
              id="slice-cake-btn"
              onClick={handleSliceCake}
              className="group relative overflow-hidden min-h-[48px] px-8 py-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-serif text-xs md:text-sm font-bold tracking-widest uppercase shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_30px_rgba(212,175,55,0.7)] flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-amber-300/60"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmerGlow_1.6s_infinite] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
              <Utensils className="w-4 h-4 text-stone-950" />
              <span className="relative z-10">Slice Cake 🍰</span>
            </button>
          </div>
        ) : cutStage === 'knife-cutting' ? (
          <div className="flex items-center gap-2 min-h-[48px] text-xs font-serif text-amber-200 tracking-widest uppercase animate-pulse">
            <Utensils className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>Slicing into the sweet cake...</span>
          </div>
        ) : cutStage === 'slice-lifting' ? (
          <div className="flex items-center gap-2 min-h-[48px] text-xs font-serif text-amber-200 tracking-widest uppercase animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span>Serving your special slice to you... 🍰</span>
          </div>
        ) : cutStage === 'sliced' ? (
          <div className="flex items-center gap-2.5 animate-zoomIn flex-wrap justify-center">
            {!showServedPlate && (
              <button
                onClick={() => {
                  sound.playButtonTap();
                  setShowServedPlate(true);
                }}
                className="group relative overflow-hidden min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-[#fffbeb] font-serif text-xs md:text-sm font-semibold tracking-wider uppercase shadow-[0_4px_20px_rgba(212,175,55,0.4)] flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-amber-400/60"
              >
                <Utensils className="w-3.5 h-3.5 text-amber-200" />
                <span>View My Slice 🍰</span>
              </button>
            )}
            <button
              id="visit-memory-tree-btn"
              onClick={() => {
                sound.playButtonTap();
                onVisitTree();
              }}
              className="group relative overflow-hidden min-h-[48px] px-7 py-3 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-500 text-white font-serif text-xs md:text-sm font-semibold tracking-wider uppercase shadow-[0_6px_25px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-emerald-400/50 animate-zoomIn"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmerGlow_1.6s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <span>Visit Memory Tree</span>
              <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
            </button>
          </div>
        ) : null}
      </div>

      {/* ================= GOURMET SERVED CAKE SLICE PRESENTATION MODAL ================= */}
      {showServedPlate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-fadeIn select-none">
          <div className="relative w-full max-w-[380px] sm:max-w-[420px] rounded-3xl bg-gradient-to-b from-stone-900/95 via-stone-950/98 to-stone-900/95 border border-amber-400/50 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.25)] p-4 sm:p-5 flex flex-col items-center text-center animate-zoomIn overflow-hidden">
            {/* Ambient Warm Spotlight */}
            <div className="absolute -top-12 inset-x-12 h-24 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Close / Minimize Button to view full trolley */}
            <button
              onClick={() => {
                sound.playButtonTap();
                setShowServedPlate(false);
              }}
              title="View Entire Cake"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700/80 text-amber-200/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-amber-400/30 text-xs"
            >
              ✕
            </button>

            {/* Header Titles */}
            <h3 className="font-great-vibes text-3xl sm:text-4xl text-[#ebd186] font-normal leading-tight golden-neon-glow mt-1 mb-1">
              A Special Slice for Fati
            </h3>
            <p className="text-[11px] sm:text-xs text-amber-100/75 font-serif italic max-w-xs mb-3">
              {biteFeedback || "The first and sweetest piece, baked with endless love just for you! 💖"}
            </p>

            {/* SVG Master Served Plate Assembly */}
            <div
              className="relative w-full aspect-[400/260] max-h-[250px] flex items-center justify-center cursor-pointer group"
              onClick={handleTakeBite}
              title="Click slice to take a bite!"
            >
              {/* Flying Crumbs & Heart Particles on Bite */}
              {flyingCrumbs.map(crumb => (
                <div
                  key={crumb.id}
                  className="absolute rounded-full pointer-events-none animate-ping"
                  style={{
                    left: `${crumb.x}px`,
                    top: `${crumb.y}px`,
                    width: '6px',
                    height: '6px',
                    backgroundColor: crumb.color,
                  }}
                />
              ))}

              <svg
                viewBox="0 0 400 260"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] overflow-visible"
              >
                <defs>
                  {/* Porcelain Plate Gradients */}
                  <radialGradient id="servedPlateBody" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="70%" stopColor="#fdfcf8" />
                    <stop offset="95%" stopColor="#ede7db" />
                    <stop offset="100%" stopColor="#d5caa8" />
                  </radialGradient>
                  <linearGradient id="servedPlateGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffe57f" />
                    <stop offset="35%" stopColor="#ffd700" />
                    <stop offset="70%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#ffe57f" />
                  </linearGradient>

                  {/* Moist Cake Layer Gradients */}
                  <linearGradient id="servedChocoSponge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4a2618" />
                    <stop offset="50%" stopColor="#381c10" />
                    <stop offset="100%" stopColor="#251209" />
                  </linearGradient>
                  <linearGradient id="servedVanillaCream" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fffdf0" />
                    <stop offset="50%" stopColor="#fef3c7" />
                    <stop offset="100%" stopColor="#fde68a" />
                  </linearGradient>
                  <linearGradient id="servedBerryGanache" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#be123c" />
                    <stop offset="50%" stopColor="#9f1239" />
                    <stop offset="100%" stopColor="#881337" />
                  </linearGradient>
                  <linearGradient id="servedDarkGanache" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#32140b" />
                    <stop offset="50%" stopColor="#220d06" />
                    <stop offset="100%" stopColor="#150703" />
                  </linearGradient>
                  <radialGradient id="servedCherryGrad" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#ff4d6d" />
                    <stop offset="40%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#5f0c13" />
                  </radialGradient>
                  <linearGradient id="servedGoldFork" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="40%" stopColor="#fde047" />
                    <stop offset="80%" stopColor="#ca8a04" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </linearGradient>
                </defs>

                {/* Ground Ambient Plate Shadow */}
                <ellipse cx="200" cy="188" rx="150" ry="38" fill="rgba(0,0,0,0.55)" filter="blur(6px)" />

                {/* ================= 1. LUXURY PORCELAIN DESSERT PLATE ================= */}
                <ellipse cx="200" cy="180" rx="150" ry="44" fill="url(#servedPlateBody)" stroke="url(#servedPlateGoldRim)" strokeWidth="3" />
                <ellipse cx="200" cy="180" rx="136" ry="38" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
                <ellipse cx="200" cy="182" rx="122" ry="32" fill="#faf6ed" stroke="#e7dfcf" strokeWidth="1" />

                {/* ================= 2. GOLDEN DESSERT FORK (RESTING BESIDE SLICE) ================= */}
                <g transform="rotate(-26 95 180) translate(15, -15)">
                  {/* Fork Handle */}
                  <path d="M 60 210 Q 75 195 90 180 Q 95 175 100 170" stroke="url(#servedGoldFork)" strokeWidth="4.5" strokeLinecap="round" />
                  {/* Fork Neck */}
                  <path d="M 100 170 C 104 165 106 160 110 156" stroke="url(#servedGoldFork)" strokeWidth="6" strokeLinecap="round" />
                  {/* 4 Elegant Golden Tines */}
                  <path d="M 108 156 L 114 135" stroke="url(#servedGoldFork)" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 111 156 L 118 134" stroke="url(#servedGoldFork)" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 114 156 L 122 135" stroke="url(#servedGoldFork)" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 117 156 L 126 137" stroke="url(#servedGoldFork)" strokeWidth="1.8" strokeLinecap="round" />
                </g>

                {/* ================= 3. THE GOURMET BIRTHDAY CAKE SLICE ================= */}
                {biteCount < 3 ? (
                  <g className="transition-transform duration-300 group-hover:scale-[1.02] transform-origin-center">
                    {/* Shadow Cast by Slice on Plate */}
                    <path
                      d={
                        biteCount === 0
                          ? "M 130 185 Q 210 200 270 175 Q 230 160 150 165 Z"
                          : "M 160 185 Q 220 198 270 175 Q 230 160 170 168 Z"
                      }
                      fill="rgba(40,15,5,0.35)"
                      filter="blur(3px)"
                    />

                    {/* --- Back Exterior Wall (Dark Chocolate Ganache Frosting) --- */}
                    <path
                      d="M 235 90 Q 255 100 272 110 L 272 170 Q 255 160 235 150 Z"
                      fill="url(#servedDarkGanache)"
                      stroke="#1a0803"
                      strokeWidth="2"
                    />

                    {/* Back Ganache Specular Sheen */}
                    <path d="M 242 98 Q 256 106 268 114" stroke="#e2c275" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />

                    {/* --- Top Wedge (Dark Ganache Glaze Surface) --- */}
                    {biteCount === 0 && (
                      <polygon points="135 132 272 110 235 90" fill="url(#servedDarkGanache)" stroke="#1a0803" strokeWidth="2" />
                    )}
                    {biteCount === 1 && (
                      <path
                        d="M 160 128 C 158 132 150 134 148 130 C 146 126 142 128 140 125 L 272 110 L 235 90 Z"
                        fill="url(#servedDarkGanache)"
                        stroke="#1a0803"
                        strokeWidth="2"
                      />
                    )}
                    {biteCount === 2 && (
                      <path
                        d="M 188 124 C 185 128 178 126 175 120 L 272 110 L 235 90 Z"
                        fill="url(#servedDarkGanache)"
                        stroke="#1a0803"
                        strokeWidth="2"
                      />
                    )}

                    {/* --- Moist Multi-Layered Front Sponge Face --- */}
                    {/* Layer 1 (Bottom Fudge Base) */}
                    <path
                      d={
                        biteCount === 0
                          ? "M 135 174 L 272 170 L 272 186 L 135 190 Z"
                          : biteCount === 1
                          ? "M 158 176 C 154 180 148 178 146 182 L 146 190 L 272 186 L 272 170 Z"
                          : "M 188 174 C 182 178 176 182 174 188 L 272 186 L 272 170 Z"
                      }
                      fill="url(#servedChocoSponge)"
                      stroke="#220e06"
                      strokeWidth="1.2"
                    />

                    {/* Layer 2 (Vanilla Cream Layer) */}
                    <path
                      d={
                        biteCount === 0
                          ? "M 135 160 L 272 156 L 272 170 L 135 174 Z"
                          : biteCount === 1
                          ? "M 156 162 C 150 166 148 170 144 172 L 272 170 L 272 156 Z"
                          : "M 186 160 C 182 164 178 168 176 172 L 272 170 L 272 156 Z"
                      }
                      fill="url(#servedVanillaCream)"
                      stroke="#f59e0b"
                      strokeWidth="0.8"
                    />

                    {/* Layer 3 (Raspberry Ganache Swirl) */}
                    <path
                      d={
                        biteCount === 0
                          ? "M 135 146 L 272 142 L 272 156 L 135 160 Z"
                          : biteCount === 1
                          ? "M 154 148 C 148 152 146 156 142 160 L 272 156 L 272 142 Z"
                          : "M 184 146 C 180 150 176 154 174 158 L 272 156 L 272 142 Z"
                      }
                      fill="url(#servedBerryGanache)"
                      stroke="#881337"
                      strokeWidth="0.8"
                    />

                    {/* Layer 4 (Top Cocoa Sponge Tier) */}
                    <path
                      d={
                        biteCount === 0
                          ? "M 135 132 L 272 110 L 272 142 L 135 146 Z"
                          : biteCount === 1
                          ? "M 152 134 C 148 138 144 140 140 144 L 272 142 L 272 110 Z"
                          : "M 182 132 C 178 136 174 140 172 144 L 272 142 L 272 110 Z"
                      }
                      fill="url(#servedChocoSponge)"
                      stroke="#220e06"
                      strokeWidth="1.2"
                    />

                    {/* --- Luscious Ganache Drips on Slice Side --- */}
                    <path
                      d="M 170 134 Q 174 146 178 138 Q 186 152 194 136 Q 204 150 212 134 Q 222 146 230 132"
                      fill="url(#servedDarkGanache)"
                      stroke="#150703"
                      strokeWidth="1"
                    />

                    {/* --- Golden Flecks & Rainbow Sprinkles on Top --- */}
                    <circle cx="218" cy="112" r="2.2" fill="#00e5ff" />
                    <circle cx="242" cy="104" r="2.5" fill="#fde047" />
                    <circle cx="258" cy="116" r="2.2" fill="#ff4081" />
                    <circle cx="204" cy="120" r="2" fill="#a855f7" />
                    <line x1="228" y1="106" x2="236" y2="110" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                    <line x1="250" y1="114" x2="258" y2="112" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

                    {/* --- Whipped Cream Cloud & Cherry on Top --- */}
                    {biteCount < 2 && (
                      <g>
                        {/* Whipped Cream Base */}
                        <ellipse cx="230" cy="88" rx="16" ry="6" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />
                        <ellipse cx="228" cy="85" rx="12" ry="5" fill="#fef08a" opacity="0.6" />

                        {/* Plump Red Cherry */}
                        <circle cx="228" cy="74" r="13" fill="url(#servedCherryGrad)" stroke="#5f0c13" strokeWidth="1.2" />
                        <ellipse cx="224" cy="69" rx="4" ry="2.5" fill="#ffffff" opacity="0.85" />

                        {/* Curled Green Stem & Mint Leaf */}
                        <path d="M 228 62 C 228 48 240 40 248 38" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 242 44 Q 248 40 252 46 Q 246 50 242 44 Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
                      </g>
                    )}
                  </g>
                ) : (
                  /* ================= EMPTY PLATE WITH DELICIOUS CRUMBS (ALL EATEN!) ================= */
                  <g className="animate-zoomIn">
                    {/* Chocolate Crumbs Scattered */}
                    <circle cx="170" cy="182" r="3.5" fill="#4a2618" />
                    <circle cx="185" cy="186" r="2.5" fill="#381c10" />
                    <circle cx="215" cy="180" r="3" fill="#4a2618" />
                    <circle cx="230" cy="184" r="2" fill="#220e06" />
                    <circle cx="195" cy="178" r="2" fill="#ffd700" />
                    <circle cx="224" cy="176" r="1.8" fill="#f43f5e" />

                    {/* Leftover Cherry Stem */}
                    <path d="M 195 186 C 205 174 218 172 225 170" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />

                    {/* Golden Thank You Star Aura */}
                    <g transform="translate(190, 140)">
                      <polygon
                        points="10,0 13,7 20,8 15,13 16,20 10,16 4,20 5,13 0,8 7,7"
                        fill="#ffd700"
                        stroke="#b45309"
                        strokeWidth="1"
                        className="animate-spin"
                        style={{ transformOrigin: '10px 10px', animationDuration: '6s' }}
                      />
                    </g>
                  </g>
                )}
              </svg>
            </div>

            {/* Micro-Instructions for Interactive Eating */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300/80 mb-3 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>{biteCount < 3 ? 'Tap cake to take delicious bites! 😋' : 'Every bite loved! 💕'}</span>
            </div>

            {/* Action Buttons inside Served Slice Modal */}
            <div className="w-full flex items-center justify-center gap-2.5 pt-2 border-t border-amber-400/20">
              <button
                onClick={handleTakeBite}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-serif text-xs font-bold tracking-wider uppercase shadow-[0_4px_15px_rgba(212,175,55,0.4)] flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-amber-300/60"
              >
                <Utensils className="w-3.5 h-3.5 text-stone-950" />
                <span>{biteCount === 0 ? 'Take a Bite' : biteCount < 3 ? 'Take Another Bite' : 'Fresh Slice? 🍰'}</span>
              </button>

              <button
                id="modal-visit-tree-btn"
                onClick={() => {
                  sound.playButtonTap();
                  onVisitTree();
                }}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-500 text-white font-serif text-xs font-semibold tracking-wider uppercase shadow-[0_4px_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-emerald-400/50"
              >
                <span>Memory Tree</span>
                <Heart className="w-3 h-3 text-rose-300 fill-rose-300" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
