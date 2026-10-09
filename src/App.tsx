import React, { useState } from 'react';
import { StarryBackground } from './components/StarryBackground.tsx';
import { Navbar } from './components/Navbar.tsx';
import { PasscodeGate } from './components/PasscodeGate.tsx';
import { WishEnvelope } from './components/WishEnvelope.tsx';
import { BirthdayCakeScene } from './components/BirthdayCakeScene.tsx';
import { MemoryTree } from './components/MemoryTree.tsx';

export default function App() {
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [unlocked, setUnlocked] = useState<boolean>(false);

  const handleUnlock = () => {
    setUnlocked(true);
    setCurrentSlide(2);
  };

  const handleWishComplete = () => {
    setCurrentSlide(3);
  };

  const handleSkipWish = () => {
    setCurrentSlide(3);
  };

  const handleVisitTree = () => {
    setCurrentSlide(4);
  };

  return (
    <div className="relative h-[100svh] min-h-[100svh] max-h-[100svh] w-full bg-[#02030a] text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Dynamic Floating Fireflies & Twinkling Star Canvas */}
      <StarryBackground />

      {/* Top Navbar with Audio & Navigation */}
      <Navbar
        currentSlide={currentSlide}
        onSelectSlide={slide => setCurrentSlide(slide)}
        unlocked={unlocked}
      />

      {/* Main Slide Carousel Viewport */}
      <main className="relative flex-1 flex flex-col items-center justify-center w-full z-10 px-2 sm:px-4 overflow-y-auto sm:overflow-hidden">
        {currentSlide === 1 && (
          <div className="w-full flex justify-center animate-fadeIn">
            <PasscodeGate onUnlock={handleUnlock} />
          </div>
        )}

        {currentSlide === 2 && (
          <div className="w-full flex justify-center animate-fadeIn">
            <WishEnvelope
              onWishComplete={handleWishComplete}
              onSkip={handleSkipWish}
            />
          </div>
        )}

        {currentSlide === 3 && (
          <div className="w-full flex justify-center animate-fadeIn">
            <BirthdayCakeScene onVisitTree={handleVisitTree} />
          </div>
        )}

        {currentSlide === 4 && (
          <div className="w-full flex justify-center animate-fadeIn">
            <MemoryTree onGoToWishSlide={() => setCurrentSlide(2)} />
          </div>
        )}
      </main>
    </div>
  );
}
