import { DIFFICULTY, ask, askError, canSearch, isCell, mulberry32, newGame, search } from './rules';
import type { Clue, Difficulty, Game, Line, MapId, Param, PetId, SearchRec } from './rules';
import type { BotAction } from './bots';

export type Lang = 'en' | 'tl';
export type Screen = 'home' | 'rules' | 'setup' | 'game' | 'end';
export interface Settings { players: number; names: string[]; mapId: MapId; difficulty: Difficulty }

export type Mode =
  | { kind: 'idle' }
  | { kind: 'search'; cell: number | null }
  | { kind: 'ask'; hand: number | null; pet: PetId | null; param: Param };

export type LogEntry = { type: 'search'; rec: SearchRec } | { type: 'ask'; clue: Clue };

export interface AppState {
  screen: Screen;
  lang: Lang;
  muted: boolean;
  ambient: boolean;
  settings: Settings;
  game: Game | null;
  mode: Mode;
  notebook: boolean;
  hintsLeft: number;
  hint: BotAction | null;
  log: LogEntry[];
  seq: number;
}

export type Action =
  | { type: 'lang'; lang: Lang }
  | { type: 'mute'; muted: boolean }
  | { type: 'ambient'; on: boolean }
  | { type: 'go'; screen: 'home' | 'rules' | 'setup' }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'start'; seed: number }
  | { type: 'resume' }
  | { type: 'mode'; mode: 'idle' | 'search' | 'ask' }
  | { type: 'pickCell'; cell: number }
  | { type: 'pickCard'; hand: number }
  | { type: 'pickPet'; pet: PetId }
  | { type: 'pickLine'; line: Line }
  | { type: 'confirmSearch' }
  | { type: 'confirmAsk'; seed: number }
  | { type: 'notebook'; on: boolean }
  | { type: 'hint'; hint: BotAction }
  | { type: 'followHint' }
  | { type: 'showEnd' };

export const HINTS: Record<Difficulty, number> = { madali: 3, katamtaman: 2, mahirap: 1 };
export const MAX_PLAYERS = 4;

export const DEFAULT_SETTINGS: Settings = { players: 1, names: ['', '', '', ''], mapId: 'baryo-masaya', difficulty: 'madali' };

export function initialState(lang: Lang = 'en'): AppState {
  return {
    screen: 'home', lang, muted: false, ambient: false, settings: DEFAULT_SETTINGS,
    game: null, mode: { kind: 'idle' }, notebook: true, hintsLeft: 0, hint: null, log: [], seq: 0,
  };
}

export function askReady(g: Game, mode: Mode): boolean {
  return mode.kind === 'ask' && mode.hand !== null && mode.pet !== null && askError(g, mode.hand, mode.pet, mode.param) === null;
}

function startGame(s: AppState, seed: number): AppState {
  const { mapId, difficulty, players } = s.settings;
  const game = newGame({ mapId, difficulty, players }, mulberry32(seed));
  return {
    ...s, screen: 'game', game, mode: { kind: 'idle' }, log: [], hint: null, seq: s.seq + 1,
    notebook: difficulty === 'madali', hintsLeft: HINTS[difficulty],
  };
}

export function reducer(s: AppState, a: Action): AppState {
  const g = s.game;
  switch (a.type) {
    case 'lang': return { ...s, lang: a.lang };
    case 'mute': return { ...s, muted: a.muted };
    case 'ambient': return { ...s, ambient: a.on };
    case 'go': return { ...s, screen: a.screen, mode: { kind: 'idle' }, hint: null };
    case 'settings': {
      const next = { ...s.settings, ...a.patch };
      next.players = Math.min(MAX_PLAYERS, Math.max(1, Math.round(next.players)));
      if (!(next.difficulty in DIFFICULTY)) return s;
      return { ...s, settings: next };
    }
    case 'start': return startGame(s, a.seed);
    case 'resume': return g && !g.done ? { ...s, screen: 'game' } : s;
    case 'showEnd': return g?.done ? { ...s, screen: 'end', mode: { kind: 'idle' } } : s;
    case 'notebook': return { ...s, notebook: a.on };
  }

  if (!g || g.done || s.screen !== 'game') return s;
  const m = s.mode;
  switch (a.type) {
    case 'mode': {
      if (a.mode === 'search') return { ...s, mode: { kind: 'search', cell: null } };
      if (a.mode === 'ask') return { ...s, mode: { kind: 'ask', hand: null, pet: null, param: null } };
      return { ...s, mode: { kind: 'idle' } };
    }
    case 'pickCell': {
      if (!isCell(a.cell)) return s;
      if (m.kind === 'search') return canSearch(g, a.cell) ? { ...s, mode: { ...m, cell: a.cell } } : s;
      if (m.kind === 'ask' && m.hand !== null && g.hand[m.hand] === 'init') return { ...s, mode: { ...m, param: a.cell } };
      return s;
    }
    case 'pickCard': {
      if (m.kind !== 'ask' || !g.hand[a.hand]) return s;
      const sameParamKind = m.hand !== null && g.hand[m.hand] === g.hand[a.hand];
      return { ...s, mode: { ...m, hand: a.hand, param: sameParamKind ? m.param : null } };
    }
    case 'pickPet': return m.kind === 'ask' && !g.found[a.pet] ? { ...s, mode: { ...m, pet: a.pet } } : s;
    case 'pickLine': {
      if (m.kind !== 'ask' || m.hand === null || g.hand[m.hand] !== 'tanaw') return s;
      return { ...s, mode: { ...m, param: { axis: a.line.axis, n: a.line.n } } };
    }
    case 'confirmSearch': {
      if (m.kind !== 'search' || m.cell === null || !canSearch(g, m.cell)) return s;
      const game = search(g, m.cell);
      const rec = game.searches[game.searches.length - 1];
      return { ...s, game, mode: { kind: 'idle' }, hint: null, log: [...s.log, { type: 'search', rec }], seq: s.seq + 1 };
    }
    case 'confirmAsk': {
      if (m.kind !== 'ask' || !askReady(g, m)) return s;
      const game = ask(g, m.hand!, m.pet!, m.param, mulberry32(a.seed));
      const clue = game.clues[game.clues.length - 1];
      return { ...s, game, mode: { kind: 'idle' }, hint: null, log: [...s.log, { type: 'ask', clue }], seq: s.seq + 1 };
    }
    case 'hint': return s.hintsLeft > 0 ? { ...s, hint: a.hint, hintsLeft: s.hintsLeft - 1 } : s;
    case 'followHint': {
      const h = s.hint;
      if (!h) return s;
      if (h.type === 'search') return { ...s, mode: { kind: 'search', cell: canSearch(g, h.cell) ? h.cell : null } };
      return { ...s, mode: { kind: 'ask', hand: h.hand, pet: h.pet, param: h.param } };
    }
  }
  return s;
}
