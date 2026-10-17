import { PETS, SIZE, answer, canSearch, consistent, heatmap, neighbours8, unfoundPets } from './rules';
import type { Game, Line, Param, PetId, Rng } from './rules';

export type BotAction = { type: 'search'; cell: number } | { type: 'ask'; hand: number; pet: PetId; param: Param };

export const LINES: Line[] = [...Array(SIZE).keys()].flatMap((n) => [{ axis: 'row', n }, { axis: 'col', n }] as Line[]);

function entropy(counts: Map<string, number>, total: number) {
  let h = 0;
  for (const n of counts.values()) { const p = n / total; h -= p * Math.log2(p); }
  return h;
}

export function smartAction(g: Game, rng: Rng, sample = 1500): BotAction {
  let sols = consistent(g);
  const unfound = unfoundPets(g);
  for (const pet of unfound) {
    const cells = new Set(sols.map((s) => s[pet]));
    if (cells.size === 1) return { type: 'search', cell: [...cells][0] };
  }
  if (sols.length > sample) sols = Array.from({ length: sample }, () => sols[Math.floor(rng() * sols.length)]);
  const total = sols.length;
  const best: { v: number; act: BotAction | null } = { v: -Infinity, act: null };
  const consider = (score: number, act: BotAction) => { const v = score + rng() * 1e-6; if (!best.act || v > best.v) { best.v = v; best.act = act; } };
  for (let cell = 0; cell < SIZE * SIZE; cell++) {
    if (!canSearch(g, cell)) continue;
    const counts = new Map<string, number>(); let hit = 0;
    const around = neighbours8(cell);
    for (const s of sols) {
      const pet = unfound.find((p) => s[p] === cell);
      const pos = PETS.map((p) => s[p.id]);
      const key = pet ? 'P' + pet : 'B' + around.filter((n) => pos.includes(n)).length;
      if (pet) hit++;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    consider(entropy(counts, total) + 0.6 * (hit / total), { type: 'search', cell });
  }
  const seen = new Set<string>();
  g.hand.forEach((kind, h) => {
    if (seen.has(kind)) return; seen.add(kind);
    const params: Param[] = kind === 'init' ? [...Array(SIZE * SIZE).keys()] : kind === 'tanaw' ? LINES : [null];
    for (const pet of unfound) for (const param of params) {
      const counts = new Map<string, number>();
      for (const s of sols) {
        const key = String(answer({ terrain: g.terrain, pets: s }, kind, pet, param));
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      consider(entropy(counts, total), { type: 'ask', hand: h, pet, param });
    }
  });
  return best.act!;
}

export function casualAction(g: Game, rng: Rng): BotAction {
  const { heat } = heatmap(g);
  const unfound = unfoundPets(g);
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

