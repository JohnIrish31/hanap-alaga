// HANAP-ALAGA: reference "helpers". Used for the in-game Tulong (hint) button and for balance testing.
// smartAction picks the most informative action; casualAction plays like a relaxed family.
import { PETS, SIZE, canSearch, consistent, answer, neighbours8, heatmap } from './rules.js';

const LINES = [...Array(SIZE).keys()].flatMap((n) => [{ axis: 'row', n }, { axis: 'col', n }]);

function entropy(counts, total) {
  let h = 0;
  for (const n of counts.values()) { const p = n / total; h -= p * Math.log2(p); }
  return h;
}

/** Returns { type:'search', cell } or { type:'ask', hand, pet, param }. */
export function smartAction(g, rng, sample = 1500) {
  let sols = consistent(g);
  const unfound = PETS.filter((p) => !g.found[p.id]).map((p) => p.id);
  // a certain pet: go get it
  for (const pet of unfound) {
    const cells = new Set(sols.map((s) => s[pet]));
    if (cells.size === 1) return { type: 'search', cell: [...cells][0] };
  }
  if (sols.length > sample) sols = Array.from({ length: sample }, () => sols[Math.floor(rng() * sols.length)]);
  const total = sols.length;
  let best = null;
  const consider = (score, act) => { const v = score + rng() * 1e-6; if (!best || v > best.v) best = { v, act }; };
  // searches
  for (let cell = 0; cell < SIZE * SIZE; cell++) {
    if (!canSearch(g, cell)) continue;
    const counts = new Map(); let hit = 0;
    for (const s of sols) {
      const pet = unfound.find((p) => s[p] === cell);
      const pos = PETS.map((p) => s[p.id]);
      const key = pet ? 'P' + pet : 'B' + neighbours8(cell).filter((n) => pos.includes(n)).length;
      if (pet) hit++;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    consider(entropy(counts, total) + 0.6 * (hit / total), { type: 'search', cell });
  }
  // questions
  const seen = new Set();
  g.hand.forEach((kind, h) => {
    if (seen.has(kind)) return; seen.add(kind);
    const params = kind === 'init' ? [...Array(SIZE * SIZE).keys()] : kind === 'tanaw' ? LINES : [null];
    for (const pet of unfound) for (const param of params) {
      const counts = new Map();
      for (const s of sols) {
        const key = String(answer({ ...g, pets: s }, kind, pet, param));
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      consider(entropy(counts, total), { type: 'ask', hand: h, pet, param });
    }
  });
  return best.act;
}

/** A relaxed family: asks random questions, searches once a pet is narrowed to 2 cells. */
export function casualAction(g, rng) {
  const { heat } = heatmap(g);
  const unfound = PETS.filter((p) => !g.found[p.id]).map((p) => p.id);
  for (const pet of unfound) {
    const cells = heat[pet].flatMap((v, i) => (v > 0 ? [i] : [])).filter((i) => canSearch(g, i));
    if (cells.length > 0 && cells.length <= 2) return { type: 'search', cell: cells.sort((a, b) => heat[pet][b] - heat[pet][a])[0] };
  }
  const h = Math.floor(rng() * g.hand.length);
  const kind = g.hand[h];
  const pet = unfound[Math.floor(rng() * unfound.length)];
  const param = kind === 'init' ? Math.floor(rng() * SIZE * SIZE) : kind === 'tanaw' ? LINES[Math.floor(rng() * LINES.length)] : null;
  return { type: 'ask', hand: h, pet, param };
}
