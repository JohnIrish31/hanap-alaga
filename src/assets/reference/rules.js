// HANAP-ALAGA: reference rules engine (pure JS, no DOM). Cooperative: everyone vs the sunset.
// Every function returns a NEW state. Port to a typed reducer; use this file as the test oracle.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const clone = (x) => structuredClone(x);

export const SIZE = 6;
export const TERRAIN = { B: 'bahay', P: 'puno', L: 'palayan', I: 'ilog', T: 'tindahan', H: 'halamanan' };
export const MAPS = [
  { id: 'baryo-masaya', name: 'Baryo Masaya', rows: ['PPBLLI', 'PBHLIL', 'BHTILL', 'HTIBHP', 'LIBHPP', 'ILTBBP'] },
  { id: 'tabing-ilog', name: 'Tabing-Ilog', rows: ['LLIPPB', 'LIHPBB', 'LIHTBH', 'PITHLL', 'PBIHLL', 'BBIPLT'] },
];
export const PETS = [
  { id: 'aso', name: 'Bantay', kind: 'Aso' },
  { id: 'pusa', name: 'Muning', kind: 'Pusa' },
  { id: 'manok', name: 'Kikay', kind: 'Manok' },
];
// Kapitbahay (neighbour) cards: each kind answers one type of question about ONE pet.
export const NEIGHBOURS = {
  purok: { who: 'Aling Nena', ask: 'Saang purok?' },               // which 3x3 quarter (1-4)
  lupa: { who: 'Mang Ben', ask: 'Anong lugar?' },                  // terrain type of the pet's cell
  init: { who: 'Bunso', ask: 'Init o lamig?' },                    // distance band from a cell you pick
  tanaw: { who: 'Lolo Tasyo', ask: 'Nasa hilerang ito ba?' },      // yes/no for a row or column you pick
};
export const NEIGHBOUR_COPIES = 4;
export const HAND = 3;
// Day starts 6:00, every action costs one hour. Hours available per difficulty:
export const DIFFICULTY = { madali: 16, katamtaman: 13, mahirap: 10 };

export const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
export const idx = (r, c) => r * SIZE + c;
export const purokOf = (i) => { const [r, c] = rc(i); return (r < 3 ? 0 : 2) + (c < 3 ? 0 : 1) + 1; }; // 1 2 / 3 4
export const manhattan = (a, b) => { const [r1, c1] = rc(a), [r2, c2] = rc(b); return Math.abs(r1 - r2) + Math.abs(c1 - c2); };
export const band = (d) => (d <= 1 ? 'mainit' : d === 2 ? 'maligamgam' : 'malamig');
export function neighbours8(i) {
  const [r, c] = rc(i), out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < SIZE && cc < SIZE) out.push(idx(rr, cc));
  }
  return out;
}
export const terrainOf = (g, i) => g.terrain[i];
export const isWater = (g, i) => g.terrain[i] === 'ilog';

/** Answer a question truthfully. line = { axis: 'row'|'col', n: 0..5 } for tanaw; cell for init. */
export function answer(g, kind, petId, param) {
  const at = g.pets[petId];
  if (kind === 'purok') return purokOf(at);
  if (kind === 'lupa') return g.terrain[at];
  if (kind === 'init') return band(manhattan(param, at));
  if (kind === 'tanaw') { const [r, c] = rc(at); return param.axis === 'row' ? r === param.n : c === param.n; }
  throw new Error('Unknown neighbour');
}
/** Footprints when a search misses: how many pets (found or not) are in the 8 cells around. */
export const bakas = (g, cell) => neighbours8(cell).filter((n) => Object.values(g.pets).includes(n)).length;

function drawTo(g, rng) {
  while (g.hand.length < HAND) {
    if (g.deck.length === 0) { g.deck = shuffle(g.discard, rng); g.discard = []; }
    if (g.deck.length === 0) break;
    g.hand.push(g.deck.pop());
  }
}

export function newGame({ mapId = 'baryo-masaya', difficulty = 'katamtaman', players = 1 } = {}, rng) {
  const map = MAPS.find((m) => m.id === mapId);
  if (!map) throw new Error('No such map');
  const terrain = map.rows.join('').split('').map((ch) => TERRAIN[ch]);
  const land = terrain.flatMap((t, i) => (t === 'ilog' ? [] : [i]));
  const spots = shuffle(land, rng).slice(0, PETS.length);
  const g = {
    mapId, difficulty, players,
    terrain,
    pets: Object.fromEntries(PETS.map((p, k) => [p.id, spots[k]])), // HIDDEN: never render until found
    found: Object.fromEntries(PETS.map((p) => [p.id, false])),
    searches: [],          // [{ cell, pet: id|null, bakas: n }]
    clues: [],             // [{ kind, pet, param, answer }]
    deck: shuffle(Object.keys(NEIGHBOURS).flatMap((k) => Array(NEIGHBOUR_COPIES).fill(k)), rng),
    discard: [],
    hand: [],
    hoursUsed: 0,
    hours: DIFFICULTY[difficulty],
    turn: 0,               // whose turn (cooperative, it only rotates who taps)
    done: false,
    won: false,
    last: null,
  };
  drawTo(g, rng);
  return g;
}

function tick(g) {
  g.hoursUsed += 1;
  g.turn = (g.turn + 1) % g.players;
  if (PETS.every((p) => g.found[p.id])) { g.done = true; g.won = true; }
  else if (g.hoursUsed >= g.hours) { g.done = true; g.won = false; }
}

export const canSearch = (g, cell) => !g.done && !isWater(g, cell) && !g.searches.some((s) => s.cell === cell);

export function search(g0, cell) {
  if (!canSearch(g0, cell)) throw new Error('Hindi pwedeng hanapin diyan');
  const g = clone(g0);
  const pet = PETS.find((p) => g.pets[p.id] === cell)?.id ?? null;
  const rec = { cell, pet, bakas: bakas(g, cell) };
  if (pet) g.found[pet] = true;
  g.searches.push(rec);
  g.last = { kind: 'search', ...rec };
  tick(g);
  return g;
}

export function ask(g0, handIndex, petId, param, rng) {
  if (g0.done) throw new Error('Tapos na');
  const kind = g0.hand[handIndex];
  if (!kind) throw new Error('Walang ganyang kapitbahay');
  if (g0.found[petId]) throw new Error('Nahanap na iyan');
  if (kind === 'init' && !(Number.isInteger(param) && param >= 0 && param < SIZE * SIZE)) throw new Error('Pumili ng parisukat');
  if (kind === 'tanaw' && !(param && (param.axis === 'row' || param.axis === 'col') && param.n >= 0 && param.n < SIZE)) throw new Error('Pumili ng hilera o hanay');
  const g = clone(g0);
  const clue = { kind, pet: petId, param: kind === 'init' || kind === 'tanaw' ? param : null, answer: answer(g, kind, petId, param) };
  g.clues.push(clue);
  g.discard.push(g.hand.splice(handIndex, 1)[0]);
  drawTo(g, rng);
  g.last = { kind: 'ask', ...clue };
  tick(g);
  return g;
}

/** Every pet placement (joint) consistent with what the players know. Used by the "Kuwaderno" helper and bots. */
export function consistent(g, limit = Infinity) {
  const land = g.terrain.flatMap((t, i) => (t === 'ilog' ? [] : [i]));
  const known = Object.fromEntries(PETS.map((p) => [p.id, g.found[p.id] ? g.pets[p.id] : null]));
  const missed = new Set(g.searches.filter((s) => !s.pet).map((s) => s.cell));
  const cand = {};
  for (const p of PETS) {
    if (known[p.id] !== null) { cand[p.id] = [known[p.id]]; continue; }
    cand[p.id] = land.filter((i) => !missed.has(i) && g.clues.filter((c) => c.pet === p.id).every((c) => answer({ ...g, pets: { ...g.pets, [p.id]: i } }, c.kind, p.id, c.param) === c.answer));
  }
  const out = [];
  const [A, B, C] = PETS.map((p) => p.id);
  for (const a of cand[A]) for (const b of cand[B]) {
    if (b === a) continue;
    for (const c of cand[C]) {
      if (c === a || c === b) continue;
      const pos = [a, b, c];
      if (g.searches.every((s) => neighbours8(s.cell).filter((n) => pos.includes(n)).length === s.bakas)) {
        out.push({ [A]: a, [B]: b, [C]: c });
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

/** Per-pet probability of each cell (0..1), from the consistent placements. */
export function heatmap(g) {
  const sols = consistent(g);
  const heat = Object.fromEntries(PETS.map((p) => [p.id, Array(SIZE * SIZE).fill(0)]));
  for (const s of sols) for (const p of PETS) heat[p.id][s[p.id]] += 1;
  for (const p of PETS) heat[p.id] = heat[p.id].map((n) => (sols.length ? n / sols.length : 0));
  return { heat, count: sols.length };
}
