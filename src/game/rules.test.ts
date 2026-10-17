import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY, HAND, MAPS, NEIGHBOUR_COPIES, PET_IDS, SIZE, ask, askError, band, bakas, canSearch, consistent, heatmap,
  idx, isWater, manhattan, mulberry32, newGame, purokOf, search, unfoundPets,
} from './rules';
import type { Game, MapId, PetId, Rng } from './rules';
import { LINES } from './bots';

const TOTAL_CARDS = 4 * NEIGHBOUR_COPIES;
const cards = (g: Game) => g.hand.length + g.deck.length + g.discard.length;
const emptyLand = (g: Game) => g.terrain.findIndex((t, i) => t !== 'ilog' && !Object.values(g.pets).includes(i) && canSearch(g, i));

function randomStep(g: Game, rng: Rng): Game {
  if (rng() < 0.35) {
    const cells = g.terrain.flatMap((_, i) => (canSearch(g, i) ? [i] : []));
    return search(g, cells[Math.floor(rng() * cells.length)]);
  }
  const h = Math.floor(rng() * g.hand.length);
  const kind = g.hand[h];
  const pets = unfoundPets(g);
  const pet = pets[Math.floor(rng() * pets.length)];
  const param = kind === 'init' ? Math.floor(rng() * SIZE * SIZE) : kind === 'tanaw' ? LINES[Math.floor(rng() * LINES.length)] : null;
  return ask(g, h, pet, param, rng);
}

describe('helpers', () => {
  it('purokOf splits the map into four 3x3 quarters', () => {
    expect(purokOf(idx(0, 0))).toBe(1);
    expect(purokOf(idx(2, 2))).toBe(1);
    expect(purokOf(idx(0, 3))).toBe(2);
    expect(purokOf(idx(2, 5))).toBe(2);
    expect(purokOf(idx(3, 0))).toBe(3);
    expect(purokOf(idx(5, 2))).toBe(3);
    expect(purokOf(idx(3, 3))).toBe(4);
    expect(purokOf(idx(5, 5))).toBe(4);
  });
  it('manhattan distance', () => {
    expect(manhattan(idx(0, 0), idx(0, 0))).toBe(0);
    expect(manhattan(idx(0, 0), idx(5, 5))).toBe(10);
    expect(manhattan(idx(2, 3), idx(4, 1))).toBe(4);
  });
  it('band thresholds: <=1 mainit, 2 maligamgam, >=3 malamig', () => {
    expect([0, 1, 2, 3, 7].map(band)).toEqual(['mainit', 'mainit', 'maligamgam', 'malamig', 'malamig']);
  });
});

describe('newGame', () => {
  it('pets are on distinct land cells, never in the river (both maps, many seeds)', () => {
    for (const map of MAPS) for (let seed = 1; seed <= 300; seed++) {
      const g = newGame({ mapId: map.id }, mulberry32(seed));
      const spots = PET_IDS.map((p) => g.pets[p]);
      expect(new Set(spots).size).toBe(3);
      for (const s of spots) expect(isWater(g, s)).toBe(false);
    }
  });
  it('starts with a full hand, hours from difficulty, nothing found', () => {
    for (const d of Object.keys(DIFFICULTY) as (keyof typeof DIFFICULTY)[]) {
      const g = newGame({ difficulty: d }, mulberry32(7));
      expect(g.hand).toHaveLength(HAND);
      expect(cards(g)).toBe(TOTAL_CARDS);
      expect(g.hours).toBe(DIFFICULTY[d]);
      expect(g.hoursUsed).toBe(0);
      expect(unfoundPets(g)).toEqual(PET_IDS);
    }
  });
});

describe('search', () => {
  it('finds a pet on its cell', () => {
    const g0 = newGame({}, mulberry32(3));
    const g = search(g0, g0.pets.pusa);
    expect(g.found.pusa).toBe(true);
    expect(g.last).toMatchObject({ kind: 'search', pet: 'pusa', cell: g0.pets.pusa });
    expect(g0.found.pusa).toBe(false);
  });
  it('a miss records bakas = pets in the 8 cells around (found or not)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const g0 = newGame({ mapId: seed % 2 ? 'baryo-masaya' : 'tabing-ilog' }, mulberry32(seed));
      const cell = emptyLand(g0);
      const g = search(g0, cell);
      const rec = g.searches[0];
      expect(rec.pet).toBeNull();
      const [r, c] = [Math.floor(cell / SIZE), cell % SIZE];
      const expected = PET_IDS.filter((p) => { const at = g0.pets[p]; const dr = Math.abs(Math.floor(at / SIZE) - r), dc = Math.abs((at % SIZE) - c); return Math.max(dr, dc) === 1; }).length;
      expect(rec.bakas).toBe(expected);
      expect(bakas(g0, cell)).toBe(expected);
    }
  });
  it('cannot search the river or an already searched cell', () => {
    const g0 = newGame({}, mulberry32(11));
    const water = g0.terrain.indexOf('ilog');
    expect(canSearch(g0, water)).toBe(false);
    expect(() => search(g0, water)).toThrow();
    const cell = emptyLand(g0);
    const g = search(g0, cell);
    expect(canSearch(g, cell)).toBe(false);
    expect(() => search(g, cell)).toThrow();
    expect(canSearch(g0, -1)).toBe(false);
    expect(canSearch(g0, 36)).toBe(false);
  });
});

describe('ask', () => {
  const setHand = (g: Game, hand: Game['hand']): Game => ({ ...g, hand });
  it('validates the pet and the parameter for each kind', () => {
    const g0 = newGame({}, mulberry32(5));
    const g = setHand(g0, ['init', 'tanaw', 'purok']);
    expect(askError(g, 0, 'aso', null)).toBeTruthy();
    expect(askError(g, 0, 'aso', 36)).toBeTruthy();
    expect(askError(g, 0, 'aso', 1.5)).toBeTruthy();
    expect(askError(g, 0, 'aso', 12)).toBeNull();
    expect(askError(g, 1, 'aso', 3)).toBeTruthy();
    expect(askError(g, 1, 'aso', { axis: 'row', n: 6 })).toBeTruthy();
    expect(askError(g, 1, 'aso', { axis: 'col', n: 0 })).toBeNull();
    expect(askError(g, 2, 'aso', null)).toBeNull();
    expect(askError(g, 3, 'aso', null)).toBeTruthy();
    expect(askError(g, 2, 'ibon' as PetId, null)).toBeTruthy();
    const found = search(g, g.pets.aso);
    expect(askError(found, 2, 'aso', null)).toBeTruthy();
    expect(() => ask(found, 2, 'aso', null, mulberry32(1))).toThrow();
  });
  it('answers truthfully', () => {
    const g0 = newGame({}, mulberry32(9));
    const at = g0.pets.manok;
    const [r, c] = [Math.floor(at / SIZE), at % SIZE];
    const q = (hand: Game['hand'], param: Parameters<typeof ask>[3]) => ask(setHand(g0, hand), 0, 'manok', param, mulberry32(1)).last;
    expect(q(['purok', 'lupa', 'init'], null)).toMatchObject({ kind: 'purok', answer: purokOf(at) });
    expect(q(['lupa', 'purok', 'init'], null)).toMatchObject({ kind: 'lupa', answer: g0.terrain[at] });
    expect(q(['init', 'purok', 'lupa'], 0)).toMatchObject({ kind: 'init', answer: band(manhattan(0, at)) });
    expect(q(['tanaw', 'purok', 'lupa'], { axis: 'row', n: r })).toMatchObject({ answer: true });
    expect(q(['tanaw', 'purok', 'lupa'], { axis: 'col', n: (c + 1) % SIZE })).toMatchObject({ answer: false });
    expect(q(['purok', 'lupa', 'init'], 5)).toMatchObject({ param: null });
  });
  it('replaces the used card and reshuffles the discard when the deck runs out', () => {
    let g = newGame({ difficulty: 'madali' }, mulberry32(21));
    const rng = mulberry32(99);
    let reshuffled = false;
    for (let i = 0; i < 15; i++) {
      const before = g.deck.length;
      g = ask(g, 0, unfoundPets(g)[0], g.hand[0] === 'init' ? 0 : g.hand[0] === 'tanaw' ? { axis: 'row', n: 0 } : null, rng);
      expect(g.hand).toHaveLength(HAND);
      expect(cards(g)).toBe(TOTAL_CARDS);
      if (before === 0) { reshuffled = true; expect(g.discard).toHaveLength(0); }
    }
    expect(reshuffled).toBe(true);
    expect(g.done).toBe(false);
  });
});

describe('hours, win and lose', () => {
  it('every action costs one hour; the turn rotates', () => {
    let g = newGame({ players: 3 }, mulberry32(2));
    g = search(g, emptyLand(g));
    expect([g.hoursUsed, g.turn]).toEqual([1, 1]);
    g = ask(g, 0, 'aso', g.hand[0] === 'init' ? 4 : g.hand[0] === 'tanaw' ? { axis: 'col', n: 2 } : null, mulberry32(1));
    expect([g.hoursUsed, g.turn]).toEqual([2, 2]);
    g = search(g, emptyLand(g));
    expect(g.turn).toBe(0);
  });
  it('win when all three are found', () => {
    let g = newGame({ difficulty: 'mahirap' }, mulberry32(4));
    for (const p of PET_IDS) { expect(g.done).toBe(false); g = search(g, g.pets[p]); }
    expect(g).toMatchObject({ done: true, won: true, hoursUsed: 3 });
  });
  it('lose at sunset; no actions after the end', () => {
    let g = newGame({ difficulty: 'mahirap' }, mulberry32(8));
    for (let i = 0; i < 10; i++) g = search(g, emptyLand(g));
    expect(g).toMatchObject({ done: true, won: false, hoursUsed: 10 });
    expect(canSearch(g, emptyLand({ ...g, done: false }))).toBe(false);
    expect(() => ask(g, 0, 'aso', null, mulberry32(1))).toThrow();
  });
  it('finding the last pet on the last hour is a win', () => {
    let g = newGame({ difficulty: 'mahirap' }, mulberry32(12));
    for (let i = 0; i < 7; i++) g = search(g, emptyLand(g));
    for (const p of PET_IDS) g = search(g, g.pets[p]);
    expect(g).toMatchObject({ hoursUsed: 10, done: true, won: true });
  });
});

describe('consistent + heatmap', () => {
  const contains = (g: Game) => consistent(g).some((s) => PET_IDS.every((p) => s[p] === g.pets[p]));
  it('always contains the real placement (200 random games, checked after every action)', () => {
    const maps: MapId[] = ['baryo-masaya', 'tabing-ilog'];
    for (let seed = 1; seed <= 200; seed++) {
      const rng = mulberry32(seed * 7919);
      let g = newGame({ mapId: maps[seed % 2], difficulty: 'madali' }, rng);
      expect(contains(g)).toBe(true);
      while (!g.done) { g = randomStep(g, rng); expect(contains(g)).toBe(true); }
    }
  }, 120_000);
  it('heatmap sums to 1 per unfound pet, and is certain for found pets', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = mulberry32(seed);
      let g = newGame({ difficulty: 'madali' }, rng);
      for (let i = 0; i < 6 && !g.done; i++) {
        g = randomStep(g, rng);
        const { heat, count } = heatmap(g);
        expect(count).toBeGreaterThan(0);
        for (const p of PET_IDS) {
          expect(heat[p].reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
          if (g.found[p]) expect(heat[p][g.pets[p]]).toBe(1);
          g.terrain.forEach((t, i) => { if (t === 'ilog') expect(heat[p][i]).toBe(0); });
        }
      }
    }
  });
  it('respects the limit', () => {
    const g = newGame({}, mulberry32(1));
    expect(consistent(g, 10)).toHaveLength(10);
  });
});
