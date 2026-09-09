'use client';

import { useEffect, useRef } from 'react';

const SMOOTHING = 0.18;
const RING_PERIOD_MS = 1400;
const MAX_RADIUS = 22;

/**
 * A soft water disturbance that stays right under the cursor: one ring
 * quietly grows and fades on a loop at the cursor's (eased) position. The
 * canvas is fully cleared every frame and only the current spot is drawn —
 * no trail builds up as the cursor moves. Mouse-only and off under
 * `prefers-reduced-motion`.
 */
export function CursorWater() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    let targetX = width / 2;
    let targetY = height / 2;
    let x = targetX;
    let y = targetY;
    let visible = false;
    let loopStart: number | null = null;

    function onPointerMove(event: PointerEvent) {
      targetX = event.clientX;
      targetY = event.clientY;
      visible = true;
    }
    function onLeave() {
      visible = false;
    }
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('mouseleave', onLeave);

    let frame: number;

    function draw(now: number) {
      ctx!.clearRect(0, 0, width, height);

      if (visible) {
        x += (targetX - x) * SMOOTHING;
        y += (targetY - y) * SMOOTHING;

        if (loopStart === null) loopStart = now;
        const progress = ((now - loopStart) % RING_PERIOD_MS) / RING_PERIOD_MS;
        const eased = 1 - (1 - progress) * (1 - progress);
        const radius = eased * MAX_RADIUS;
        const ringAlpha = (1 - progress) * 0.4;

        // Soft ambient glow at the spot, always present, no growth.
        const glow = ctx!.createRadialGradient(x, y, 0, x, y, MAX_RADIUS * 0.9);
        glow.addColorStop(0, 'rgba(134, 233, 219, 0.16)');
        glow.addColorStop(1, 'rgba(134, 233, 219, 0)');
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(x, y, MAX_RADIUS * 0.9, 0, Math.PI * 2);
        ctx!.fill();

        // One expanding, fading ring, looping in place.
        ctx!.beginPath();
        ctx!.arc(x, y, radius, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(134, 233, 219, ${ringAlpha})`;
        ctx!.lineWidth = 1.2;
        ctx!.stroke();

        // A small bright core marking exactly where the cursor is.
        ctx!.beginPath();
        ctx!.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx!.fill();
      }

      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-water-canvas" aria-hidden="true" />;
}
