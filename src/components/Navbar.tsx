import React, { useState } from 'react';
import { sound } from '../utils/audio.ts';
import { Volume2, VolumeX, Lock, Mail, Cake, TreePine } from 'lucide-react';

interface NavbarProps {
  currentSlide: number;
  onSelectSlide: (slide: number) => void;
  unlocked: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSlide, onSelectSlide, unlocked }) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playClick();
      sound.startAmbient();
    }
  };

  const slides = [
    { num: 1, title: 'Vault Passcode', Icon: Lock },
    { num: 2, title: 'Wish Envelope', Icon: Mail },
    { num: 3, title: 'Birthday Celebration', Icon: Cake },
    { num: 4, title: 'Memory Tree', Icon: TreePine },
  ];

  return (
    <header className="relative z-30 w-full h-[54px] px-3.5 sm:px-6 flex items-center justify-between bg-transparent select-none">
      {/* Spacer to keep navigation capsule centered */}
      <div className="w-9 sm:w-10" aria-hidden="true" />

      {/* Sleek Floating Glass Stepper Capsule */}
      <nav className="flex items-center p-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {slides.map(s => {
          const isActive = currentSlide === s.num;
          const isDisabled = !unlocked && s.num > 1;
          const IconComponent = s.Icon;

          return (
            <button
              key={s.num}
              id={`nav-slide-${s.num}`}
              onClick={() => {
                if (!isDisabled) {
                  sound.playButtonTap();
                  onSelectSlide(s.num);
                }
              }}
              disabled={isDisabled}
              title={s.title}
              aria-label={s.title}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center relative active:scale-90 ${
                isActive
                  ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-stone-950 shadow-[0_0_14px_rgba(251,191,36,0.5)] scale-105 font-bold'
                  : isDisabled
                  ? 'opacity-20 cursor-not-allowed text-slate-600'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
              }`}
            >
              <IconComponent className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-stone-950 stroke-[2.2]' : 'stroke-[1.8]'}`} />
            </button>
          );
        })}
      </nav>

      {/* Audio Controller (Sleek Circular Glass Pill) */}
      <button
        id="audio-toggle-btn"
        onClick={handleToggleSound}
        className="h-9 sm:h-10 px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/40 text-xs text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-400 font-mono text-[10px] uppercase tracking-wider">Muted</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-[#ffd700]" />
            <div className="flex items-end gap-0.5 h-2.5">
              <span className="w-0.5 h-1 bg-[#ffd700] animate-pulse" />
              <span className="w-0.5 h-2.5 bg-[#ffd700] animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="w-0.5 h-1.5 bg-[#ffd700] animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <span className="hidden sm:inline text-amber-200 font-mono text-[10px] uppercase tracking-wider">Sound</span>
          </>
        )}
      </button>
    </header>
  );
};
