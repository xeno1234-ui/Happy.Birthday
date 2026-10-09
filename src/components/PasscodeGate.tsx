import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio.ts';
import { Lock, Unlock, Heart, Sparkles } from 'lucide-react';

interface PasscodeGateProps {
  onUnlock: () => void;
}

export const PasscodeGate: React.FC<PasscodeGateProps> = ({ onUnlock }) => {
  const [digits, setDigits] = useState<string[]>([]);
  // Status stages: 'idle' | 'wrong' | 'verifying' | 'opening' | 'dissolving'
  const [status, setStatus] = useState<'idle' | 'wrong' | 'verifying' | 'opening' | 'dissolving'>('idle');
  const [shake, setShake] = useState(false);
  const flareCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const CORRECT_PIN = '1410';

  const triggerGoldenFlare = () => {
    const canvas = flareCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 460;
    canvas.height = canvas.parentElement?.clientHeight || 560;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    }> = [];

    const luxuryGolds = ['#e6ca65', '#d4af37', '#fdf4dc', '#ffffff', '#c59b27'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        alpha: 1,
        color: luxuryGolds[Math.floor(Math.random() * luxuryGolds.length)],
      });
    }

    let frame = 0;
    const animateFlare = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= 0.02;

        if (p.alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
      });

      frame++;
      if (frame < 50) {
        requestAnimationFrame(animateFlare);
      }
    };
    animateFlare();
  };

  const handleKeyPress = (val: string) => {
    if (status !== 'idle') return;

    if (val === 'clear') {
      sound.playButtonTap();
      setDigits([]);
      return;
    }

    if (val === 'backspace') {
      sound.playButtonTap();
      setDigits(prev => prev.slice(0, -1));
      return;
    }

    if (digits.length >= 4) return;

    sound.playButtonTap();
    const newDigits = [...digits, val];
    setDigits(newDigits);

    if (newDigits.length === 4) {
      const enteredPin = newDigits.join('');
      if (enteredPin === CORRECT_PIN) {
        // Step 1: Verification stage (immediate)
        setStatus('verifying');
        sound.playVaultUnlock();
        triggerGoldenFlare();

        // Step 2: Smooth 3D Door Swing (at 280ms)
        setTimeout(() => {
          setStatus('opening');
        }, 280);

        // Step 3: Cinematic Push In & dissolve (at 1450ms)
        setTimeout(() => {
          setStatus('dissolving');
        }, 1450);

        // Step 4: Complete transition to Slide 2 (at 2050ms)
        setTimeout(() => {
          onUnlock();
        }, 2050);
      } else {
        setStatus('wrong');
        sound.playErrorBuzz();
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits([]);
          setStatus('idle');
        }, 850);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'idle') return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeyPress('backspace');
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleKeyPress('clear');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [digits, status]);

  const isUnlockedFlow = status === 'verifying' || status === 'opening' || status === 'dissolving';
  const isDoorOpen = status === 'opening' || status === 'dissolving';

  return (
    <div
      id="slide-passcode"
      className="relative z-10 w-full max-w-sm mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[80vh]"
      style={{ perspective: '1600px' }}
    >
      {/* Outer Chamber Chassis */}
      <div
        className={`relative w-full rounded-2xl transition-all duration-700 select-none ${
          status === 'dissolving' ? 'animate-vault-pushin pointer-events-none' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ================= REAR INTERIOR CHAMBER (Revealed when door opens) ================= */}
        <div
          className={`absolute inset-0 rounded-2xl p-7 flex flex-col items-center justify-center bg-[#090b12] border border-amber-400/25 overflow-hidden shadow-2xl transition-opacity duration-500 ${
            isDoorOpen ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Warm Amber Core Glow */}
          <div className="absolute inset-0 bg-radial from-amber-500/15 via-amber-900/10 to-transparent pointer-events-none animate-chamber-light" />

          {/* Golden Interior Geometric Trim */}
          <div className="absolute inset-2.5 border border-amber-400/20 rounded-xl pointer-events-none" />
          <div className="absolute top-4 left-4 w-2.5 h-2.5 border-t border-l border-amber-400/60" />
          <div className="absolute top-4 right-4 w-2.5 h-2.5 border-t border-r border-amber-400/60" />
          <div className="absolute bottom-4 left-4 w-2.5 h-2.5 border-b border-l border-amber-400/60" />
          <div className="absolute bottom-4 right-4 w-2.5 h-2.5 border-b border-r border-amber-400/60" />

          {/* Chamber Content: The Mystical Envelope on Velvet Pedestal */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center animate-envelope-emerge">
            {/* Soft Ambient Pedestal */}
            <div className="relative w-44 aspect-[4/3] rounded-xl p-3 flex flex-col items-center justify-center bg-[#11131c] border border-amber-400/30 shadow-[0_15px_35px_rgba(0,0,0,0.8)] animate-float">
              {/* Envelope Flap */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-[#161a26] rounded-t-xl border-b border-white/[0.08] [clip-path:polygon(0_0,100%_0,50%_100%)] flex items-end justify-center pb-1">
                <span className="w-5 h-0.5 bg-amber-400/30 rounded-full mb-1" />
              </div>

              {/* Crimson Wax Seal */}
              <div className="relative z-10 mt-3 flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#6b1e2a] via-[#541620] to-[#3a0d15] flex items-center justify-center shadow-lg border border-[#a1404e]/50">
                  <Heart className="w-4 h-4 text-[#e5c158] fill-[#e5c158]/30" />
                </div>
              </div>
            </div>

            {/* Chamber Plaque Text */}
            <div className="mt-5 flex items-center gap-1.5 text-xs text-[#f5e6b3] font-serif tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Chamber Unsealed</span>
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            </div>
            <p className="text-[10px] text-slate-400/80 font-mono tracking-wider mt-1">
              Entering the sanctum...
            </p>
          </div>
        </div>

        {/* ================= FRONT VAULT DOOR (Swings open on left hinge) ================= */}
        <div
          className={`relative w-full rounded-3xl p-5 sm:p-7 md:p-8 backdrop-blur-2xl transition-colors duration-500 ${
            status === 'wrong'
              ? 'bg-rose-950/25 border border-rose-500/40 shadow-[0_20px_50px_rgba(244,63,94,0.15)]'
              : isUnlockedFlow
              ? 'bg-[#0b0d14] border border-amber-400/50 shadow-[0_25px_60px_rgba(0,0,0,0.85)]'
              : 'bg-[#0a0d16]/85 border border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)]'
          } ${shake ? 'animate-shake' : ''} ${isDoorOpen ? 'animate-vault-door z-20 pointer-events-none' : 'z-20'}`}
          style={{
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Flare Canvas for golden burst */}
          <canvas
            ref={flareCanvasRef}
            className="absolute inset-0 pointer-events-none rounded-3xl z-30"
          />

          {/* Vault Dial / Ornate Emblem */}
          <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
            <div
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center mb-2.5 transition-all duration-500 border ${
                status === 'wrong'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                  : isUnlockedFlow
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400/70 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-dial-spin'
                  : 'bg-white/[0.04] text-[#ffd700] border-amber-400/30 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
              }`}
            >
              {isUnlockedFlow ? (
                <Unlock className="w-5 h-5 text-amber-300" />
              ) : status === 'wrong' ? (
                <Lock className="w-5 h-5 text-rose-400" />
              ) : (
                <Lock className="w-5 h-5 text-[#ffd700]" />
              )}
            </div>
          </div>

          {/* 4 Refined Digit Boxes */}
          <div className="flex justify-center gap-2.5 sm:gap-3.5 mb-5 sm:mb-6">
            {[0, 1, 2, 3].map(index => {
              const hasDigit = digits[index] !== undefined;
              const isCurrent = digits.length === index;

              return (
                <div
                  key={index}
                  id={`digit-box-${index}`}
                  className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-mono transition-all duration-300 ${
                    status === 'wrong'
                      ? 'border border-rose-500/60 bg-rose-950/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                      : isUnlockedFlow
                      ? 'border border-amber-400/80 bg-amber-950/50 text-amber-200 shadow-[0_0_16px_rgba(255,215,0,0.4)] scale-105'
                      : hasDigit
                      ? 'border border-amber-400/50 bg-amber-400/10 text-[#ffd700] shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                      : isCurrent
                      ? 'border border-white/40 bg-white/[0.06] text-white/50 ring-2 ring-amber-400/30'
                      : 'border border-white/[0.06] bg-black/30 text-slate-600'
                  }`}
                >
                  {hasDigit ? (
                    <span className="font-bold">{digits[index]}</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600 inline-block opacity-40" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Minimalist Keypad with sleek rounded keys */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[270px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map(
              btn => {
                const isClear = btn === 'clear';
                const isBack = btn === 'backspace';

                return (
                  <button
                    key={btn}
                    id={`keypad-btn-${btn}`}
                    onClick={() => handleKeyPress(btn)}
                    disabled={isUnlockedFlow}
                    className={`h-12 min-h-[48px] rounded-2xl font-medium transition-all duration-150 flex items-center justify-center active:scale-90 cursor-pointer ${
                      isClear
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs tracking-wider uppercase border border-rose-500/20 active:bg-rose-500/30'
                        : isBack
                        ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-base border border-white/[0.06] active:bg-white/[0.12]'
                        : 'bg-white/[0.04] hover:bg-white/[0.09] active:bg-amber-400/20 text-slate-100 hover:text-white border border-white/[0.08] hover:border-amber-400/40 text-lg font-light'
                    }`}
                  >
                    {isClear ? 'CLR' : isBack ? '⌫' : btn}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
