import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  baseAlpha: number;
}

interface GoldenEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  fadeSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  active: boolean;
}

export const StarryBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener('resize', handleResize);

    // Subtle, high-clarity pinprick stars (capped for smooth 60 FPS on mobile)
    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const isMobile = width < 768;
      const divisor = isMobile ? 12000 : 7500;
      const maxCount = isMobile ? 55 : 130;
      const count = Math.min(maxCount, Math.floor((width * height) / divisor));
      for (let i = 0; i < count; i++) {
        const base = Math.random() * 0.45 + 0.15;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.9 + 0.35, // refined fine pinprick
          alpha: base,
          baseAlpha: base,
          twinkleSpeed: Math.random() * 0.008 + 0.003, // slow, peaceful breath
        });
      }
    };
    initStars();

    // Sparse, quiet warm celestial embers
    const embers: GoldenEmber[] = [];
    const emberCount = width < 768 ? 5 : 8;
    for (let i = 0; i < emberCount; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -Math.random() * 0.22 - 0.05, // very slow serene upward drift
        radius: Math.random() * 1.2 + 0.8,
        alpha: Math.random() * 0.35 + 0.15,
        fadeSpeed: Math.random() * 0.004 + 0.002,
      });
    }

    // Rare, delicate shooting star
    const shootingStars: ShootingStar[] = [];
    let lastShootTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Luxurious Deep Obsidian Canvas with barely perceptible warm vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        100,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#0d0f17'); // subtle deep ink
      bgGrad.addColorStop(0.6, '#08090f');
      bgGrad.addColorStop(1, '#040508'); // pure dark obsidian edge
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render fine, quiet stars
      const now = Date.now();
      stars.forEach(star => {
        const pulse = Math.sin(now * star.twinkleSpeed);
        const currentAlpha = Math.max(0.08, star.baseAlpha + pulse * 0.25);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
      });

      // Rare, elegant shooting star (delicate hairline)
      if (now - lastShootTime > 18000 && Math.random() < 0.02) {
        lastShootTime = now;
        shootingStars.push({
          x: Math.random() * width * 0.7 + width * 0.1,
          y: Math.random() * (height * 0.35),
          vx: Math.random() * 6 + 7,
          vy: Math.random() * 2.5 + 3,
          length: Math.random() * 70 + 40,
          alpha: 0.65,
          active: true,
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) continue;

        ctx.beginPath();
        const dist = Math.hypot(s.vx, s.vy);
        const tailX = s.x - (s.vx / dist) * s.length;
        const tailY = s.y - (s.vy / dist) * s.length;

        const shootGrad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        shootGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        shootGrad.addColorStop(1, `rgba(245, 235, 210, ${s.alpha})`);

        ctx.strokeStyle = shootGrad;
        ctx.lineWidth = 1;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.015;

        if (s.alpha <= 0 || s.x > width || s.y > height) {
          shootingStars.splice(i, 1);
        }
      }

      // Render subtle warm golden embers (serene, not flashy)
      embers.forEach(e => {
        e.x += e.vx;
        e.y += e.vy;

        // Wrap around gracefully
        if (e.y < -10) {
          e.y = height + 10;
          e.x = Math.random() * width;
        }
        if (e.x < -10) e.x = width + 10;
        if (e.x > width + 10) e.x = -10;

        const emberGlow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * 3.5);
        emberGlow.addColorStop(0, `rgba(226, 185, 105, ${e.alpha})`);
        emberGlow.addColorStop(0.5, `rgba(190, 145, 75, ${e.alpha * 0.4})`);
        emberGlow.addColorStop(1, 'rgba(190, 145, 75, 0)');

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = emberGlow;
        ctx.globalAlpha = 1;
        ctx.fill();

        // Tiny soft center
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 245, 220, ${e.alpha * 0.8})`;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
