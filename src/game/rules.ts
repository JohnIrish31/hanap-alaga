export type Rng = () => number;
export type Terrain = 'bahay' | 'puno' | 'palayan' | 'ilog' | 'tindahan' | 'halamanan';
export type PetId = 'aso' | 'pusa' | 'manok';
export type NeighbourKind = 'purok' | 'lupa' | 'init' | 'tanaw';
export type Band = 'mainit' | 'maligamgam' | 'malamig';
export type Difficulty = 'madali' | 'katamtaman' | 'mahirap';
export type MapId = 'baryo-masaya' | 'tabing-ilog';
export type Line = { axis: 'row' | 'col'; n: number };
export type Param = number | Line | null;
export type Answer = number | Terrain | Band | boolean;
export type Placement = Record<PetId, number>;

export interface SearchRec { cell: number; pet: PetId | null; bakas: number }
export interface Clue { kind: NeighbourKind; pet: PetId; param: Param; answer: Answer }
export type Last = ({ kind: 'search' } & SearchRec) | Clue | null;

export interface Game {
  mapId: MapId;
  difficulty: Difficulty;
  players: number;
  terrain: Terrain[];
  pets: Placement;
  found: Record<PetId, boolean>;
  searches: SearchRec[];
  clues: Clue[];
  deck: NeighbourKind[];
  discard: NeighbourKind[];
  hand: NeighbourKind[];
  hoursUsed: number;
  hours: number;
  turn: number;
  done: boolean;
  won: boolean;
  last: Last;
}

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const clone = <T>(x: T): T => structuredClone(x);

export const SIZE = 6;
export const TERRAIN: Record<string, Terrain> = { B: 'bahay', P: 'puno', L: 'palayan', I: 'ilog', T: 'tindahan', H: 'halamanan' };
export const TERRAINS: Terrain[] = ['bahay', 'puno', 'palayan', 'ilog', 'tindahan', 'halamanan'];
export const MAPS: { id: MapId; name: string; rows: string[] }[] = [
  { id: 'baryo-masaya', name: 'Baryo Masaya', rows: ['PPBLLI', 'PBHLIL', 'BHTILL', 'HTIBHP', 'LIBHPP', 'ILTBBP'] },
  { id: 'tabing-ilog', name: 'Tabing-Ilog', rows: ['LLIPPB', 'LIHPBB', 'LIHTBH', 'PITHLL', 'PBIHLL', 'BBIPLT'] },
];
export const PETS: { id: PetId; name: string; kind: string }[] = [
  { id: 'aso', name: 'Bantay', kind: 'Aso' },
  { id: 'pusa', name: 'Muning', kind: 'Pusa' },
  { id: 'manok', name: 'Kikay', kind: 'Manok' },
];
export const PET_IDS: PetId[] = PETS.map((p) => p.id);
export const NEIGHBOURS: Record<NeighbourKind, { who: string }> = {
  purok: { who: 'Aling Nena' },
  lupa: { who: 'Mang Ben' },
  init: { who: 'Bunso' },
  tanaw: { who: 'Lolo Tasyo' },
};
export const NEIGHBOUR_KINDS = Object.keys(NEIGHBOURS) as NeighbourKind[];
export const NEIGHBOUR_COPIES = 4;
export const HAND = 3;
export const DIFFICULTY: Record<Difficulty, number> = { madali: 16, katamtaman: 13, mahirap: 10 };
export const START_HOUR = 6;

export const rc = (i: number): [number, number] => [Math.floor(i / SIZE), i % SIZE];
export const idx = (r: number, c: number) => r * SIZE + c;
export const purokOf = (i: number) => { const [r, c] = rc(i); return (r < 3 ? 0 : 2) + (c < 3 ? 0 : 1) + 1; };
export const manhattan = (a: number, b: number) => { const [r1, c1] = rc(a), [r2, c2] = rc(b); return Math.abs(r1 - r2) + Math.abs(c1 - c2); };
export const band = (d: number): Band => (d <= 1 ? 'mainit' : d === 2 ? 'maligamgam' : 'malamig');
export function neighbours8(i: number): number[] {
  const [r, c] = rc(i), out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < SIZE && cc < SIZE) out.push(idx(rr, cc));
  }
  return out;
}
export const terrainOf = (g: Pick<Game, 'terrain'>, i: number) => g.terrain[i];
export const isWater = (g: Pick<Game, 'terrain'>, i: number) => g.terrain[i] === 'ilog';
export const mapTerrain = (mapId: MapId): Terrain[] => {
  const map = MAPS.find((m) => m.id === mapId);
  if (!map) throw new Error('No such map');
  return map.rows.join('').split('').map((ch) => TERRAIN[ch]);
};
export const isLine = (p: Param): p is Line => !!p && typeof p === 'object' && (p.axis === 'row' || p.axis === 'col') && Number.isInteger(p.n) && p.n >= 0 && p.n < SIZE;
export const isCell = (p: Param): p is number => typeof p === 'number' && Number.isInteger(p) && p >= 0 && p < SIZE * SIZE;

export function answer(g: Pick<Game, 'terrain' | 'pets'>, kind: NeighbourKind, petId: PetId, param: Param): Answer {
  const at = g.pets[petId];
  if (kind === 'purok') return purokOf(at);
  if (kind === 'lupa') return g.terrain[at];
  if (kind === 'init') return band(manhattan(param as number, at));
  if (kind === 'tanaw') { const [r, c] = rc(at); const l = param as Line; return l.axis === 'row' ? r === l.n : c === l.n; }
  throw new Error('Unknown neighbour');
}
export const bakas = (g: Pick<Game, 'pets'>, cell: number) => neighbours8(cell).filter((n) => Object.values(g.pets).includes(n)).length;

function drawTo(g: Game, rng: Rng) {
  while (g.hand.length < HAND) {
    if (g.deck.length === 0) { g.deck = shuffle(g.discard, rng); g.discard = []; }
    if (g.deck.length === 0) break;
    g.hand.push(g.deck.pop()!);
  }
}

export interface NewGameOpts { mapId?: MapId; difficulty?: Difficulty; players?: number }

export function newGame({ mapId = 'baryo-masaya', difficulty = 'katamtaman', players = 1 }: NewGameOpts, rng: Rng): Game {
  const terrain = mapTerrain(mapId);
  const land = terrain.flatMap((t, i) => (t === 'ilog' ? [] : [i]));
  const spots = shuffle(land, rng).slice(0, PETS.length);
  const g: Game = {
    mapId, difficulty, players,
    terrain,
    pets: Object.fromEntries(PETS.map((p, k) => [p.id, spots[k]])) as Placement,
    found: Object.fromEntries(PETS.map((p) => [p.id, false])) as Record<PetId, boolean>,
    searches: [],
    clues: [],
    deck: shuffle(NEIGHBOUR_KINDS.flatMap((k) => Array<NeighbourKind>(NEIGHBOUR_COPIES).fill(k)), rng),
    discard: [],
    hand: [],
    hoursUsed: 0,
    hours: DIFFICULTY[difficulty],
    turn: 0,
    done: false,
    won: false,
    last: null,
  };
  drawTo(g, rng);
  return g;
}

function tick(g: Game) {
  g.hoursUsed += 1;
  g.turn = (g.turn + 1) % g.players;
  if (PETS.every((p) => g.found[p.id])) { g.done = true; g.won = true; }
  else if (g.hoursUsed >= g.hours) { g.done = true; g.won = false; }
}

export const canSearch = (g: Game, cell: number) => !g.done && isCell(cell) && !isWater(g, cell) && !g.searches.some((s) => s.cell === cell);

export function search(g0: Game, cell: number): Game {
  if (!canSearch(g0, cell)) throw new Error('Hindi pwedeng hanapin diyan');
  const g = clone(g0);
  const pet = PETS.find((p) => g.pets[p.id] === cell)?.id ?? null;
  const rec: SearchRec = { cell, pet, bakas: bakas(g, cell) };
  if (pet) g.found[pet] = true;
  g.searches.push(rec);
  g.last = { kind: 'search', ...rec };
  tick(g);
  return g;
}

export function askError(g: Game, handIndex: number, petId: PetId, param: Param): string | null {
  if (g.done) return 'Tapos na';
  const kind = g.hand[handIndex];
  if (!kind) return 'Walang ganyang kapitbahay';
  if (!PET_IDS.includes(petId)) return 'Walang ganyang alaga';
  if (g.found[petId]) return 'Nahanap na iyan';
  if (kind === 'init' && !isCell(param)) return 'Pumili ng parisukat';
  if (kind === 'tanaw' && !isLine(param)) return 'Pumili ng hilera o hanay';
  return null;
}

export function ask(g0: Game, handIndex: number, petId: PetId, param: Param, rng: Rng): Game {
  const err = askError(g0, handIndex, petId, param);
  if (err) throw new Error(err);
  const kind = g0.hand[handIndex];
  const g = clone(g0);
  const clue: Clue = { kind, pet: petId, param: kind === 'init' || kind === 'tanaw' ? param : null, answer: answer(g, kind, petId, param) };
  g.clues.push(clue);
  g.discard.push(g.hand.splice(handIndex, 1)[0]);
  drawTo(g, rng);
  g.last = { ...clue };
  tick(g);
  return g;
}

export function consistent(g: Game, limit = Infinity): Placement[] {
  const land = g.terrain.flatMap((t, i) => (t === 'ilog' ? [] : [i]));
  const missed = new Set(g.searches.filter((s) => !s.pet).map((s) => s.cell));
  const cand = {} as Record<PetId, number[]>;
  for (const p of PET_IDS) {
    if (g.found[p]) { cand[p] = [g.pets[p]]; continue; }
    const clues = g.clues.filter((c) => c.pet === p);
    cand[p] = land.filter((i) => !missed.has(i) && clues.every((c) => answer({ terrain: g.terrain, pets: { ...g.pets, [p]: i } }, c.kind, p, c.param) === c.answer));
  }
  const out: Placement[] = [];
  const [A, B, C] = PET_IDS;
  for (const a of cand[A]) for (const b of cand[B]) {
    if (b === a) continue;
    for (const c of cand[C]) {
      if (c === a || c === b) continue;
      const pos = [a, b, c];
      if (g.searches.every((s) => neighbours8(s.cell).filter((n) => pos.includes(n)).length === s.bakas)) {
        out.push({ [A]: a, [B]: b, [C]: c } as Placement);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export type Heat = Record<PetId, number[]>;

export function heatmap(g: Game): { heat: Heat; count: number } {
  const sols = consistent(g);
  const heat = Object.fromEntries(PET_IDS.map((p) => [p, Array<number>(SIZE * SIZE).fill(0)])) as Heat;
  for (const s of sols) for (const p of PET_IDS) heat[p][s[p]] += 1;
  for (const p of PET_IDS) heat[p] = heat[p].map((n) => (sols.length ? n / sols.length : 0));
  return { heat, count: sols.length };
}

export const unfoundPets = (g: Game) => PET_IDS.filter((p) => !g.found[p]);
export const hoursLeft = (g: Game) => g.hours - g.hoursUsed;
