import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../utils/audio';
import { VerifiedBadge, isUserVerified } from './VerifiedBadge';

interface IntroAnimationProps {
  username?: string;
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ username = 'explorer', onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<'approaching' | 'shrinking' | 'pale_dot' | 'greeting' | 'ready'>('approaching');

  // Handle keyboard shortcut (Space, Enter, Escape) to comfortably skip or proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        sound.playWhoosh();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

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
    };
    window.addEventListener('resize', handleResize);

    // Star field
    const stars: { x: number; y: number; size: number; alpha: number; speed: number; pulse: number }[] = [];
    for (let i = 0; i < 240; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const startTime = performance.now();
    // Timing milestones in milliseconds:
    // 0 -> 1600ms: approaching
    // 1600ms -> 4600ms: shrinking (Text 1: Voyager 1 leaving solar system)
    // 4600ms -> 8600ms: pale_dot (Text 2: Carl Sagan quote for EXACTLY 4.0 SECONDS!)
    // 8600ms -> 9800ms: greeting
    // 9800ms+: ready
    const DURATION = 10000;

    const render = (now: number) => {
      const elapsed = now - startTime;

      // Determine stages based on exact millisecond durations
      if (elapsed < 1600) {
        setStage('approaching');
      } else if (elapsed < 4600) {
        setStage('shrinking');
      } else if (elapsed < 8600) {
        // SECOND TEXT DURATION: 4600ms to 8600ms = 4000ms (EXACTLY 4 SECONDS)
        setStage('pale_dot');
      } else if (elapsed < 9800) {
        setStage('greeting');
      } else {
        setStage('ready');
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Stars appear as we retreat into deep space
      const starVisibility = Math.min(1, Math.max(0, (elapsed - 800) / 3000));
      if (starVisibility > 0) {
        ctx.save();
        for (const star of stars) {
          star.pulse += star.speed;
          const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(star.pulse)) * starVisibility;
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Sunbeam band (Voyager 1 signature sunbeam scatter across camera)
      if (elapsed > 2500) {
        const beamAlpha = Math.min(0.24, (elapsed - 2500) / 4000 * 0.24);
        ctx.save();
        ctx.translate(width * 0.55, height * 0.48);
        ctx.rotate(-0.35);
        const grad = ctx.createLinearGradient(-120, -height, 120, height);
        grad.addColorStop(0, 'rgba(255, 248, 220, 0)');
        grad.addColorStop(0.5, `rgba(254, 240, 180, ${beamAlpha})`);
        grad.addColorStop(1, 'rgba(255, 248, 220, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(-110, -height, 220, height * 2);
        ctx.restore();
      }

      // Earth position and size
      const centerX = width * 0.55;
      const centerY = height * 0.48;

      if (elapsed < 4600) {
        // Scaling down from large earth sphere to tiny speck
        const easeT = Math.min(1, elapsed / 4600);
        const earthRadius = Math.max(2.2, (1 - easeT * 0.98) * 120);

        ctx.save();
        // Earth glow
        const glowGrad = ctx.createRadialGradient(centerX, centerY, earthRadius * 0.8, centerX, centerY, earthRadius * 2.2);
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Earth body
        const bodyGrad = ctx.createRadialGradient(
          centerX - earthRadius * 0.3,
          centerY - earthRadius * 0.3,
          earthRadius * 0.1,
          centerX,
          centerY,
          earthRadius
        );
        bodyGrad.addColorStop(0, '#7dd3fc');
        bodyGrad.addColorStop(0.4, '#0284c7');
        bodyGrad.addColorStop(0.75, '#0369a1');
        bodyGrad.addColorStop(1, '#070f2b');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        // Clouds/continents sketch pattern if still large enough
        if (earthRadius > 14) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(centerX - earthRadius * 0.2, centerY - earthRadius * 0.1, earthRadius * 0.4, 0, Math.PI * 1.2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(centerX + earthRadius * 0.2, centerY + earthRadius * 0.2, earthRadius * 0.3, 0, Math.PI * 0.9);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        // The Pale Blue Dot (0.12 pixel equivalent)
        ctx.save();
        // Delicate halo
        const dotHalo = ctx.createRadialGradient(centerX, centerY, 0.5, centerX, centerY, 14);
        dotHalo.addColorStop(0, 'rgba(125, 211, 252, 0.9)');
        dotHalo.addColorStop(0.3, 'rgba(56, 189, 248, 0.45)');
        dotHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = dotHalo;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
        ctx.fill();

        // The core dot
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Hand-drawn pointer circle sketch
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 22, 0, Math.PI * 1.85);
        ctx.stroke();

        ctx.restore();
      }

      if (elapsed < DURATION + 1000) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFinish = () => {
    sound.playWhoosh();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Canvas background for space & earth recession */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Skip button in corner */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={handleFinish}
          className="text-neutral-400 hover:text-white transition-colors text-sm px-3 py-1.5 sketch-border-subtle hover:border-white/50 bg-black/60 backdrop-blur-sm cursor-pointer"
        >
          skip intro
        </button>
      </div>

      {/* Story & greetings overlays */}
      <div className="relative z-10 max-w-xl mx-auto px-6 text-center pointer-events-none">
        <AnimatePresence mode="wait">
          {stage === 'shrinking' && (
            <motion.div
              key="shrinking-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="space-y-2"
            >
              <p className="text-neutral-400 text-lg">
                voyager 1, leaving the solar system.
              </p>
              <p className="text-neutral-500 text-sm italic">
                turning its camera back one final time across 6 billion kilometers.
              </p>
            </motion.div>
          )}

          {stage === 'pale_dot' && (
            <motion.div
              key="dot-quote"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="space-y-3"
            >
              <h2 className="text-3xl text-sky-200 font-heading leading-tight">
                "look again at that dot. that's here. that's home. that's us."
              </h2>
              <p className="text-neutral-400 text-sm">
                on it everyone you love, everyone you know, everyone who ever was.
              </p>
            </motion.div>
          )}

          {(stage === 'greeting' || stage === 'ready') && (
            <motion.div
              key="greeting-entry"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-5 pointer-events-auto"
            >
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-sky-400/80">deep space archive</span>
                <h1 className="text-4xl md:text-5xl font-heading text-white tracking-wide inline-flex items-center justify-center gap-2 flex-wrap">
                  <span>hey, {username}</span>
                  {isUserVerified(username) && (
                    <VerifiedBadge size={28} title="verified user" />
                  )}
                  <span>.</span>
                </h1>
                <p className="text-neutral-300 text-base max-w-md mx-auto pt-1">
                  welcome to paleblue. a quiet game of celestial wandering.
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 sketch-border-bold bg-white text-black text-lg hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-sky-950/40"
                >
                  step into the cosmos →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tiny subtle footer coordinates */}
      <div className="absolute bottom-4 left-6 text-xs text-neutral-600 font-mono tracking-wider pointer-events-none">
        voyager-1 · distance 40.5 au · solar elongation 32°
      </div>
    </div>
  );
};
