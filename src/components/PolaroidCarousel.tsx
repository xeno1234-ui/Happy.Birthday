import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio.ts';
import { ChevronLeft, ChevronRight, Plus, Camera, Sparkles, X, Heart, Trash2, RotateCcw } from 'lucide-react';

export interface PolaroidPhoto {
  id: string;
  title: string;
  caption: string;
  date: string;
  imageUrl?: string;
  theme: 'starlight' | 'cake' | 'sunset' | 'cat' | 'lantern' | 'custom';
}

const DEFAULT_POLAROIDS: PolaroidPhoto[] = [
  {
    id: 'p1',
    title: 'Midnight Constellation',
    caption: 'Under a blanket of golden stardust, where all the secret wishes live ✨',
    date: 'October 14',
    theme: 'starlight',
  },
  {
    id: 'p2',
    title: 'A Cake of Blessings',
    caption: 'May your days be frosted with happiness and sweetness 🎂',
    date: 'Celebration',
    theme: 'cake',
  },
  {
    id: 'p3',
    title: 'Chasing Golden Sunsets',
    caption: "Here's to peaceful mornings, bold dreams, and chasing golden horizons 🌅",
    date: 'Golden Hour',
    theme: 'sunset',
  },
  {
    id: 'p4',
    title: 'Warm Paws & Little Wonders',
    caption: 'The sweetest moments are the quiet, simple ones that make us smile 🐾',
    date: 'Pure Joy',
    theme: 'cat',
  },
  {
    id: 'p5',
    title: 'Lanterns of Hope',
    caption: 'Every light carrying a prayer for health, joy, and endless laughter 🏮',
    date: 'Ever After',
    theme: 'lantern',
  },
];

interface PolaroidCarouselProps {
  onClose?: () => void;
}

export const PolaroidCarousel: React.FC<PolaroidCarouselProps> = ({ onClose }) => {
  const [photos, setPhotos] = useState<PolaroidPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('birthday_polaroid_memories');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return DEFAULT_POLAROIDS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newImageBase64, setNewImageBase64] = useState<string>('');
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('birthday_polaroid_memories', JSON.stringify(photos));
    } catch {}
  }, [photos]);

  const handleNext = () => {
    if (photos.length <= 1) return;
    sound.playButtonTap();
    setCurrentIndex(prev => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    if (photos.length <= 1) return;
    sound.playButtonTap();
    setCurrentIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const handleDeletePhoto = (id: string) => {
    sound.playButtonTap();
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    setDeleteConfirmId(null);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleResetDefaults = () => {
    sound.playButtonTap();
    sound.playMagicalChime();
    setPhotos(DEFAULT_POLAROIDS);
    setCurrentIndex(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 45) {
      handlePrev();
    } else if (diff < -45) {
      handleNext();
    }
    touchStartX.current = null;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        setNewImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!newCaption.trim()) return;

    sound.playButtonTap();
    sound.playMagicalChime();

    const newPhoto: PolaroidPhoto = {
      id: 'custom_' + Date.now(),
      title: newTitle.trim() || 'A Precious Memory',
      caption: newCaption.trim(),
      date: newDate.trim() || 'Today',
      imageUrl: newImageBase64 || undefined,
      theme: 'custom',
    };

    const updated = [newPhoto, ...photos];
    setPhotos(updated);
    setCurrentIndex(0);
    setIsAdding(false);
    setNewTitle('');
    setNewCaption('');
    setNewDate('');
    setNewImageBase64('');
  };

  const currentPhoto = photos[currentIndex] || photos[0] || null;

  const renderIllustration = (theme: PolaroidPhoto['theme'], customImg?: string) => {
    if (customImg) {
      return (
        <img
          src={customImg}
          alt="Personal memory"
          className="w-full h-full object-cover rounded-md"
        />
      );
    }

    switch (theme) {
      case 'starlight':
        return (
          <div className="relative w-full h-full bg-gradient-to-b from-[#090c1a] via-[#121832] to-[#182042] flex items-center justify-center overflow-hidden rounded-md">
            {/* Crescent Moon */}
            <div className="absolute top-5 right-7 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-200 via-amber-100 to-amber-300 shadow-[0_0_28px_rgba(253,224,71,0.7)]">
              <div className="absolute top-0 right-2.5 w-11 h-11 rounded-full bg-[#0d1226]" />
            </div>

            {/* Twinkling ambient stars */}
            <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
            <div className="absolute top-16 left-20 w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-10 right-24 w-1.5 h-1.5 rounded-full bg-amber-100 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-28 right-10 w-2 h-2 rounded-full bg-amber-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-32 left-14 w-1 h-1 rounded-full bg-white" />

            {/* Constellation lines */}
            <svg className="absolute inset-0 w-full h-full opacity-75" viewBox="0 0 240 180">
              <circle cx="40" cy="35" r="2" fill="#fde047" />
              <circle cx="85" cy="55" r="2.2" fill="#ffffff" />
              <circle cx="140" cy="30" r="2" fill="#fef08a" />
              <circle cx="180" cy="70" r="1.5" fill="#ffffff" />
              <circle cx="65" cy="115" r="1.8" fill="#ffffff" />
              <circle cx="120" cy="125" r="2" fill="#fde047" />
              <line x1="40" y1="35" x2="85" y2="55" stroke="#fde047" strokeWidth="0.9" opacity="0.5" />
              <line x1="85" y1="55" x2="140" y2="30" stroke="#fde047" strokeWidth="0.9" opacity="0.5" />
              <line x1="85" y1="55" x2="65" y2="115" stroke="#fde047" strokeWidth="0.9" opacity="0.4" />
              <line x1="65" y1="115" x2="120" y2="125" stroke="#fde047" strokeWidth="0.9" opacity="0.4" />
              {/* Distant mountain silhouette */}
              <path d="M 0 180 Q 70 145 140 165 Q 190 152 240 180 Z" fill="#060914" opacity="0.9" />
            </svg>
          </div>
        );
      case 'cake':
        return (
          <div className="relative w-full h-full bg-gradient-to-b from-[#1b1424] via-[#2a1738] to-[#140e1f] flex flex-col items-center justify-center overflow-hidden rounded-md">
            {/* Ambient soft glow */}
            <div className="absolute w-36 h-36 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

            {/* Gentle decorative golden sparkles in background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
              <circle cx="35" cy="45" r="1.5" fill="#fde047" opacity="0.6" />
              <circle cx="165" cy="55" r="1.2" fill="#fef08a" opacity="0.7" />
              <circle cx="40" cy="140" r="1" fill="#ffffff" opacity="0.5" />
              <circle cx="160" cy="135" r="1.5" fill="#fde047" opacity="0.6" />
              {/* Sparkle crosses */}
              <path d="M 50 70 L 50 76 M 47 73 L 53 73" stroke="#fef08a" strokeWidth="0.8" opacity="0.6" />
              <path d="M 150 85 L 150 91 M 147 88 L 153 88" stroke="#fde047" strokeWidth="0.8" opacity="0.6" />
            </svg>

            {/* Pristine Celebratory Birthday Cake */}
            <svg viewBox="0 0 200 180" className="w-36 h-36 drop-shadow-xl">
              <defs>
                <linearGradient id="cakeStandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="50%" stopColor="#fff1b8" />
                  <stop offset="100%" stopColor="#aa820a" />
                </linearGradient>
                <linearGradient id="cakeFrostingTop" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff8ed" />
                  <stop offset="100%" stopColor="#fed7aa" />
                </linearGradient>
                <linearGradient id="cakeFrostingBase" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>
                <linearGradient id="berryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
                <radialGradient id="cakeFlameGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                  <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Elegant golden pedestal / plate */}
              <ellipse cx="100" cy="148" rx="66" ry="12" fill="url(#cakeStandGrad)" />
              <ellipse cx="100" cy="146" rx="60" ry="10" fill="#fdfbf7" opacity="0.95" />
              <ellipse cx="100" cy="146" rx="55" ry="8" fill="#fef3c7" opacity="0.4" />

              {/* Bottom Tier Base */}
              <path d="M 48 116 C 48 116 48 138 48 138 C 48 144 71 147 100 147 C 129 147 152 144 152 138 L 152 116 Z" fill="#f59e0b" opacity="0.9" />
              <path d="M 48 116 C 48 116 48 134 48 134 C 48 141 71 144 100 144 C 129 144 152 141 152 134 L 152 116 Z" fill="url(#cakeFrostingBase)" />
              {/* Bottom Tier Frosting Swirl Top */}
              <ellipse cx="100" cy="116" rx="52" ry="11" fill="#fffbeb" />

              {/* Middle frosting drip scallops on bottom tier */}
              <path d="M 48 118 Q 58 126 68 118 Q 78 127 88 118 Q 100 128 112 118 Q 122 127 132 118 Q 142 126 152 118" fill="none" stroke="#fbcfe8" strokeWidth="3" strokeLinecap="round" />

              {/* Top Tier Base */}
              <path d="M 64 88 C 64 88 64 106 64 106 C 64 112 80 115 100 115 C 120 115 136 112 136 106 L 136 88 Z" fill="#fbbf24" opacity="0.8" />
              <path d="M 64 88 C 64 88 64 103 64 103 C 64 109 80 112 100 112 C 120 112 136 109 136 103 L 136 88 Z" fill="url(#cakeFrostingTop)" />
              {/* Top Tier Surface */}
              <ellipse cx="100" cy="88" rx="36" ry="8" fill="#ffffff" />

              {/* Decorative frosting scallops on top tier */}
              <path d="M 64 90 Q 73 96 82 90 Q 91 97 100 90 Q 109 97 118 90 Q 127 96 136 90" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />

              {/* Delicate berries around top rim */}
              <circle cx="75" cy="86" r="3.5" fill="url(#berryGrad)" />
              <circle cx="88" cy="89" r="3.2" fill="url(#berryGrad)" />
              <circle cx="112" cy="89" r="3.2" fill="url(#berryGrad)" />
              <circle cx="125" cy="86" r="3.5" fill="url(#berryGrad)" />

              {/* Center Candle */}
              <ellipse cx="100" cy="88" rx="4" ry="1.5" fill="#e2e8f0" />
              <rect x="97" y="60" width="6" height="28" rx="2" fill="#ffffff" stroke="#fde047" strokeWidth="0.8" />
              <path d="M 97 66 L 103 69 M 97 73 L 103 76 M 97 80 L 103 83" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="100" y1="60" x2="100" y2="53" stroke="#475569" strokeWidth="1.2" />

              {/* Golden Candle Flame Glow Halo */}
              <circle cx="100" cy="46" r="16" fill="url(#cakeFlameGlow)" opacity="0.6" />
              <path d="M 100 37 C 96 44 94 48 96 52 C 98 55 102 55 104 52 C 106 48 104 44 100 37 Z" fill="#f97316" />
              <path d="M 100 42 C 98 46 97 49 98 51 C 99 53 101 53 102 51 C 103 49 102 46 100 42 Z" fill="#fef08a" />
              <ellipse cx="100" cy="50" rx="1.2" ry="1.8" fill="#ffffff" />
            </svg>
          </div>
        );
      case 'sunset':
        return (
          <div className="relative w-full h-full bg-gradient-to-b from-[#2b1020] via-[#541e2d] to-[#7c3a27] flex items-center justify-center overflow-hidden rounded-md">
            <div className="absolute bottom-10 w-24 h-24 rounded-full bg-gradient-to-t from-amber-400 to-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.8)]" />
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-b from-[#1b1429] to-[#0c0915] opacity-90" />
            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 200 150">
              <path d="M 40 45 Q 45 42 50 45 Q 55 42 60 45" fill="none" stroke="#fed7aa" strokeWidth="1.2" />
              <path d="M 120 35 Q 124 32 128 35 Q 132 32 136 35" fill="none" stroke="#fed7aa" strokeWidth="1.2" />
            </svg>
          </div>
        );
      case 'cat':
        return (
          <div className="relative w-full h-full bg-gradient-to-b from-[#191924] via-[#242436] to-[#12121b] flex items-center justify-center overflow-hidden rounded-md">
            <svg viewBox="0 0 160 140" className="w-32 h-32 drop-shadow-md">
              <ellipse cx="80" cy="95" rx="35" ry="24" fill="#f59445" />
              <circle cx="80" cy="65" r="24" fill="#f59445" />
              {/* Ears */}
              <polygon points="62,50 68,26 80,44" fill="#f59445" />
              <polygon points="66,48 70,32 78,44" fill="#fbcfe8" />
              <polygon points="98,50 92,26 80,44" fill="#f59445" />
              <polygon points="94,48 90,32 82,44" fill="#fbcfe8" />
              {/* Eyes */}
              <circle cx="72" cy="64" r="3.5" fill="#090d16" />
              <circle cx="88" cy="64" r="3.5" fill="#090d16" />
              <circle cx="71" cy="63" r="1.2" fill="#ffffff" />
              <circle cx="87" cy="63" r="1.2" fill="#ffffff" />
              {/* Nose & Mouth */}
              <polygon points="78,70 82,70 80,72" fill="#f43f5e" />
              <path d="M 76 74 Q 80 77 84 74" fill="none" stroke="#090d16" strokeWidth="1" />
              {/* Tail */}
              <path d="M 115 95 Q 135 85 130 65" fill="none" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'lantern':
      default:
        return (
          <div className="relative w-full h-full bg-gradient-to-b from-[#0a1020] via-[#101b33] to-[#080d19] flex items-center justify-center overflow-hidden rounded-md">
            <svg viewBox="0 0 160 140" className="w-32 h-32 drop-shadow-md">
              <ellipse cx="80" cy="70" rx="18" ry="24" fill="#f59e0b" opacity="0.85" />
              <ellipse cx="80" cy="70" rx="12" ry="18" fill="#fef08a" />
              <rect x="74" y="44" width="12" height="3" fill="#78350f" />
              <rect x="74" y="93" width="12" height="3" fill="#78350f" />
              <line x1="80" y1="96" x2="80" y2="108" stroke="#dc2626" strokeWidth="1.5" />
              {/* Glow sparks */}
              <circle cx="45" cy="40" r="1.5" fill="#fde047" />
              <circle cx="120" cy="50" r="1.8" fill="#fde047" />
              <circle cx="60" cy="110" r="1.2" fill="#fde047" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
      {/* Top Header bar with Close & Add Memory action */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-serif font-semibold text-[#f5e6b3] uppercase tracking-wider">
            Polaroid Memories {photos.length > 0 ? `(${currentIndex + 1}/${photos.length})` : '(0)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="add-polaroid-memory-btn"
            onClick={() => {
              sound.playButtonTap();
              setIsAdding(true);
            }}
            className="min-h-[36px] px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-amber-400/30 text-amber-200 text-xs font-serif flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Add a custom memory photo"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Memory</span>
          </button>
          {onClose && (
            <button
              onClick={() => {
                sound.playButtonTap();
                onClose();
              }}
              className="min-h-[36px] min-w-[36px] rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {photos.length === 0 ? (
        /* Empty State */
        <div className="relative w-full aspect-[4/5] max-w-[340px] bg-[#fdfbf7] text-stone-900 rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center text-center select-none border border-stone-200">
          <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mb-3 text-stone-400">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-800">Album is Empty</h3>
          <p className="text-xs text-stone-600 font-serif italic mt-1 max-w-[220px] leading-relaxed">
            All memories have been deleted. You can create a new memory or restore the original collection.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 w-full max-w-[220px]">
            <button
              onClick={() => {
                sound.playButtonTap();
                setIsAdding(true);
              }}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              + Add New Memory
            </button>
            <button
              onClick={handleResetDefaults}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-serif text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>
        </div>
      ) : currentPhoto && (
        /* Main Polaroid Frame Container */
        <div
          className="relative w-full aspect-[4/5] max-w-[340px] bg-[#fdfbf7] text-stone-900 rounded-xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.15)] flex flex-col justify-between transition-all duration-300 hover:rotate-0 rotate-[-1.5deg] select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Vintage Golden Brass Pin at Top */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-md border border-amber-300 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-900" />
            </div>
          </div>

          {/* Polaroid Inner Photo Canvas */}
          <div className="relative w-full aspect-square rounded-md overflow-hidden bg-[#0c0e17] shadow-inner border border-stone-200">
            {renderIllustration(currentPhoto.theme, currentPhoto.imageUrl)}

            {/* Film Grain Vignette */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {/* Polaroid Caption Area */}
          <div className="pt-3 pb-1 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif font-bold text-sm text-stone-900 tracking-tight">
                  {currentPhoto.title}
                </h3>
                <span className="text-[10px] font-mono text-stone-600 font-semibold tracking-wide shrink-0">
                  {currentPhoto.date}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-700 font-serif italic leading-relaxed">
                "{currentPhoto.caption}"
              </p>
            </div>

            {/* Bottom Card Footer with Delete Button & Pagination */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/80">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500 flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                <span>Memories of Fati</span>
              </span>

              <div className="flex items-center gap-2">
                {currentPhoto.id.startsWith('custom_') && (
                  <button
                    id="delete-current-polaroid-btn"
                    onClick={e => {
                      e.stopPropagation();
                      sound.playButtonTap();
                      setDeleteConfirmId(currentPhoto.id);
                    }}
                    className="px-2 py-0.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                    title="Delete this custom memory"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span className="text-[10px] font-sans font-medium text-stone-500 hover:text-rose-600">Delete</span>
                  </button>
                )}
                <span className="text-[10px] font-mono text-stone-500">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipe & Navigation Controls */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between w-full max-w-[340px] mt-4 px-2">
          <button
            onClick={handlePrev}
            disabled={photos.length <= 1}
            className="min-h-[48px] min-w-[48px] rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="Previous photo"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playButtonTap();
                  setCurrentIndex(idx);
                }}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-[#d4af37]'
                    : 'w-2.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={photos.length <= 1}
            className="min-h-[48px] min-w-[48px] rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="Next photo"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Deleting Memory */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#141724] border border-rose-500/40 p-5 shadow-2xl text-slate-100 animate-zoomIn">
            <div className="flex items-center gap-2.5 mb-3 text-rose-400">
              <div className="w-9 h-9 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-sm text-white">Delete Memory</h3>
                <span className="text-[11px] text-slate-400">This action cannot be undone</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-serif leading-relaxed mb-4 p-3 bg-white/[0.03] rounded-xl border border-white/5">
              Are you sure you want to remove <span className="text-[#f5e6b3] font-semibold">"{photos.find(p => p.id === deleteConfirmId)?.title || 'this photo'}"</span> from your Polaroid album?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  sound.playButtonTap();
                  setDeleteConfirmId(null);
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-serif transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-photo-btn"
                onClick={() => handleDeletePhoto(deleteConfirmId)}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-serif font-semibold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Your Own Polaroid Photo */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#141724] border border-amber-400/30 p-5 shadow-2xl text-slate-100 animate-zoomIn">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-serif font-semibold text-sm text-[#f5e6b3] uppercase tracking-wider">
                  Add Polaroid Memory
                </h3>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-serif mb-1">Upload Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-amber-500/20 file:text-amber-200 hover:file:bg-amber-500/30 cursor-pointer"
                />
                {newImageBase64 && (
                  <div className="mt-2 w-16 h-16 rounded border border-white/20 overflow-hidden">
                    <img src={newImageBase64} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-serif mb-1">Memory Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Birthday Adventures"
                  className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-serif mb-1">Caption / Note</label>
                <textarea
                  value={newCaption}
                  onChange={e => setNewCaption(e.target.value)}
                  rows={2}
                  placeholder="Write a sweet memory or heartfelt caption..."
                  className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 resize-none font-serif"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-serif mb-1">Date</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  placeholder="e.g. October 14"
                  className="w-full p-2.5 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 font-mono"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAdding(false)}
                className="min-h-[44px] px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={!newCaption.trim()}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-semibold text-xs tracking-wider uppercase transition-all disabled:opacity-40 cursor-pointer"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
