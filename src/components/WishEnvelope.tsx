import React, { useState, useRef } from 'react';
import { sound } from '../utils/audio.ts';
import { Sparkles, ArrowRight, Heart, Feather } from 'lucide-react';
import { WishData, WishItem } from '../types.ts';
import { addSharedWish } from '../firebase.ts';

interface WishEnvelopeProps {
  onWishComplete: () => void;
  onSkip: () => void;
}

export const WishEnvelope: React.FC<WishEnvelopeProps> = ({ onWishComplete, onSkip }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wishText, setWishText] = useState('');
  const [isFolding, setIsFolding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleOpenEnvelope = () => {
    if (isOpen) return;
    sound.playMagicalChime();
    setIsOpen(true);
  };

  const triggerGlitterDissolve = (callback: () => void) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      callback();
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback();
      return;
    }

    canvas.width = canvas.parentElement?.clientWidth || 540;
    canvas.height = canvas.parentElement?.clientHeight || 580;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      spin: number;
      spinSpeed: number;
    }> = [];

    const luxuryTones = ['#e6ca65', '#d4af37', '#fdf4dc', '#ffffff', '#e2d3b3'];
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 45 : 75;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 160,
        y: canvas.height / 2 + (Math.random() - 0.5) * 120,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 5.5 - 2.0, // gentle upward drift to the stars
        size: Math.random() * 3 + 1.5,
        alpha: 1,
        color: luxuryTones[Math.floor(Math.random() * luxuryTones.length)],
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.1,
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.04; // float upwards like stardust
        p.alpha -= 0.018;
        p.spin += p.spinSpeed;

        if (p.alpha > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.spin);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      frame++;
      if (frame < 55) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        callback();
      }
    };
    animate();
  };

  const handleSendWish = () => {
    const trimmed = wishText.trim();
    if (!trimmed) {
      sound.playErrorBuzz();
      setErrorMessage('Please write your wish before sealing.');
      return;
    }

    sound.playButtonTap();
    sound.playMagicalChime();
    setIsFolding(true);

    // Save to Firebase Firestore asynchronously in background
    addSharedWish(trimmed).catch(err => {
      console.warn('Background wish save notice:', err);
    });

    // Elegant, celestial float-up transition to the stars before Slide 3
    triggerGlitterDissolve(() => {
      onWishComplete();
    });
  };

  const handleLeave = () => {
    sound.playButtonTap();
    onSkip();
  };

  return (
    <div
      id="slide-envelope"
      className="relative z-10 w-full max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col items-center justify-center my-auto"
      style={{ perspective: '1200px' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none rounded-2xl z-30"
      />

      {/* When Envelope is Sealed - Matured bespoke design */}
      {!isOpen && (
        <div className="flex flex-col items-center w-full max-w-sm animate-fadeIn">
          <h2 className="text-xl sm:text-2xl font-serif text-[#ffd700] mb-3 text-center tracking-wide font-medium">
            A Special Wish
          </h2>
          <div
            onClick={handleOpenEnvelope}
            className="group relative cursor-pointer w-full aspect-[4/3] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-500 hover:scale-[1.02] select-none bg-[#11131c] border border-white/10 shadow-[0_25px_50px_rgba(0,0,0,0.6)] animate-float"
          >
            {/* Envelope Top Flap */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-[#161a26] rounded-t-2xl border-b border-white/[0.08] [clip-path:polygon(0_0,100%_0,50%_100%)] flex items-end justify-center pb-2">
              <span className="w-8 h-0.5 bg-amber-400/20 rounded-full mb-3" />
            </div>

            {/* Understated inner border */}
            <div className="absolute inset-2.5 border border-white/[0.04] rounded-xl pointer-events-none" />

            {/* Antique Burgundy Wax Stamp */}
            <div className="relative z-10 mt-5 flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#6b1e2a] via-[#541620] to-[#3a0d15] flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.5)] border border-[#a1404e]/40 group-hover:scale-105 transition-transform duration-300">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#421019]/60">
                  <Heart className="w-5 h-5 text-[#e5c158] fill-[#e5c158]/20" />
                </div>
              </div>

              <span className="mt-3.5 text-[#f5e6b3] font-serif font-medium text-xs sm:text-sm tracking-widest uppercase">
                Tap Seal to Open
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Unfolded Natural Linen Stationery */}
      {isOpen && (
        <div
          className={`relative w-full max-w-md transition-all duration-700 ${
            isFolding ? 'animate-wish-float-up pointer-events-none' : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          {isFolding ? (
            <div className="w-full flex flex-col items-center justify-center py-16 text-center">
              <div className="relative w-20 h-20 text-[#d4af37] animate-bounce">
                <Feather className="w-16 h-16 mx-auto opacity-95 drop-shadow-[0_0_15px_rgba(212,175,55,0.7)]" />
                <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-amber-200 animate-spin" />
              </div>
              <p className="mt-4 font-serif text-[#f5e6b3] tracking-widest text-sm uppercase">
                Sending your wish...
              </p>
            </div>
          ) : (
            <div className="rounded-2xl p-6 sm:p-7 shadow-2xl relative border border-stone-300/40 bg-[#fbf9f5] text-stone-800 select-none">
              <div className="mb-3 text-center">
                <h2 className="text-lg font-serif font-semibold text-stone-900">
                  Make a Wish
                </h2>
              </div>

              {/* Textarea with editorial stationery styling and high contrast */}
              <div className="relative my-4">
                <textarea
                  id="wish-textarea"
                  value={wishText}
                  onChange={e => setWishText(e.target.value)}
                  maxLength={350}
                  rows={4}
                  placeholder="Write your wish here..."
                  className="w-full p-3.5 rounded-xl border border-stone-400/80 bg-white text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-serif text-sm resize-none leading-relaxed transition-all shadow-inner"
                />
                <div className="flex items-center justify-between text-xs font-mono text-stone-500 mt-1">
                  <span className="text-rose-600 font-sans font-medium">{errorMessage}</span>
                  <span>{wishText.length} / 350</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-200">
                <button
                  id="leave-wish-btn"
                  onClick={handleLeave}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-medium tracking-wide uppercase transition-colors cursor-pointer active:scale-95"
                >
                  Skip
                </button>

                <button
                  id="submit-wish-btn"
                  onClick={handleSendWish}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-100 font-serif text-xs font-medium tracking-wider uppercase flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <span>Send Wish</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
