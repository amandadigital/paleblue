import React, { useEffect, useRef } from 'react';

export const SketchBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Statically placed tiny hand-drawn dots / stars
    const dots: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 90; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    let frame = 0;
    let animationId: number;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw faint stars
      for (const d of dots) {
        const twinkle = 0.5 + 0.5 * Math.sin(frame * d.speed + d.x);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
    />
  );
};
