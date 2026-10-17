// Tiny effects helpers. Needs styles/animations.css.
const COLORS = ['#E23B3B', '#FFC93C', '#21A35A', '#2F6FE0', '#FF8A1F', '#FF6B9D', '#8A4FD0'];

/** Rain confetti over the whole screen. Returns a function that removes it early. */
export function launchConfetti(count = 90, ms = 3400) {
  if (typeof window === 'undefined') return () => {};
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'confetti-piece';
    const round = Math.random() < 0.35;
    const w = 6 + Math.random() * 8;
    p.style.setProperty('--x', Math.random() * 100 + 'vw');
    p.style.setProperty('--w', w + 'px');
    p.style.setProperty('--h', (round ? w : w * 1.7) + 'px');
    p.style.setProperty('--r', round ? '50%' : '2px');
    p.style.setProperty('--c', COLORS[(Math.random() * COLORS.length) | 0]);
    p.style.setProperty('--d', 2.2 + Math.random() * 1.6 + 's');
    p.style.setProperty('--delay', Math.random() * 0.8 + 's');
    p.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
    p.style.setProperty('--rot', (360 + Math.random() * 720) + 'deg');
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  const t = setTimeout(() => layer.remove(), ms);
  return () => { clearTimeout(t); layer.remove(); };
}

/** Replay a CSS animation class on an element (e.g. replay(el, 'anim-bump')). */
export function replay(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // force reflow so the animation restarts
  el.classList.add(cls);
}
