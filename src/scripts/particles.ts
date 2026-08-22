/**
 * Floating dust particles for the hero section.
 *
 * Gold + warm-blue specks drift upward with a gentle sway and twinkle.
 * Canvas-based for smoothness; density adapts to the viewport; the loop
 * pauses off-screen / on hidden tabs, and reduced-motion users get a
 * single static frame of faint dots.
 */

/** Palettes: `dark` pops on navy backgrounds, `light` reads on warm cream. */
const PALETTES = {
  dark: ["#e6c96a", "#c9a227", "#d9b95c", "#9fb4dd"],
  light: ["#b8860b", "#8f6c12", "#a07c17", "#41639e"],
} as const;

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  swayAmplitude: number;
  swaySpeed: number;
  phase: number;
  twinkleSpeed: number;
  color: string;
  baseAlpha: number;
  isSparkle: boolean;
}

export function initParticles(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-particles]");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Opt into the high-contrast set with data-theme="light" on light pages.
  const theme = canvas.dataset.theme === "light" ? PALETTES.light : PALETTES.dark;
  const alphaFloor = theme === PALETTES.light ? 0.38 : 0.28;

  let width = 0;
  let height = 0;
  let particles: Particle[] = [];

  /** Rebuild the particle field on resize (density adapts to area). */
  const populate = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(48, Math.round((width * height) / 20_000));
    particles = Array.from({ length: count }, () => spawn(true));
  };

  const spawn = (anywhere: boolean): Particle => ({
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : height + 8,
    radius: 0.8 + Math.random() * 1.8,
    speed: 6 + Math.random() * 14,
    swayAmplitude: 6 + Math.random() * 16,
    swaySpeed: 0.25 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.6 + Math.random() * 1.6,
    color: theme[Math.floor(Math.random() * theme.length)],
    baseAlpha: alphaFloor + Math.random() * 0.45,
    isSparkle: Math.random() < 0.18, // few four-point sparkles among dots
  });

  /** Draw one particle at time `t` (seconds). */
  const draw = (p: Particle, t: number) => {
    const twinkle = 0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.phase);
    ctx.globalAlpha = p.baseAlpha * twinkle;
    ctx.fillStyle = p.color;

    if (p.isSparkle) {
      // Four-point star
      const r = p.radius * 2.6;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4 + p.phase);
      ctx.fillRect(-r, -r / 5, r * 2, (r * 2) / 5);
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-r, -r / 5, r * 2, (r * 2) / 5);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const step = (now: number) => {
    const t = now / 1000;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= (p.speed * 1) / 60; // frame-based drift (~60fps reference)
      if (p.y < -12) particles[i] = spawn(false);

      // Sway uses the live position so respawns stay coherent
      const px = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.swayAmplitude;
      draw({ ...p, x: px }, t);
    }
  };

  let running = false;
  let rafId = 0;

  const loop = (now: number) => {
    if (!running) return;
    step(now);
    rafId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || reduce) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  populate();

  if (reduce) {
    // Static, faint constellation — no motion
    step(0);
    return;
  }

  // Only animate while the hero is on screen and the tab is visible
  const observer = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stop()),
    { threshold: 0.02 },
  );
  observer.observe(canvas);

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  window.addEventListener("resize", () => {
    populate();
    if (!running) step(0);
  });
}
