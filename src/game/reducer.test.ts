import { describe, expect, it } from 'vitest';
import { HINTS, initialState, reducer } from './reducer';
import type { Action, AppState } from './reducer';
import { PET_IDS } from './rules';

const run = (s: AppState, ...actions: Action[]) => actions.reduce(reducer, s);
const started = (difficulty: 'madali' | 'katamtaman' | 'mahirap' = 'madali') =>
  run(initialState('en'), { type: 'settings', patch: { difficulty, players: 2 } }, { type: 'start', seed: 42 });
const freeCell = (s: AppState) => s.game!.terrain.findIndex((t, i) => t !== 'ilog' && !Object.values(s.game!.pets).includes(i));

describe('reducer', () => {
  it('defaults to English and switches language', () => {
    const s = initialState();
    expect(s.lang).toBe('en');
    expect(reducer(s, { type: 'lang', lang: 'tl' }).lang).toBe('tl');
  });
  it('start uses the settings; notebook and hints follow difficulty', () => {
    for (const d of ['madali', 'katamtaman', 'mahirap'] as const) {
      const s = started(d);
      expect(s.screen).toBe('game');
      expect(s.game!.difficulty).toBe(d);
      expect(s.game!.players).toBe(2);
      expect(s.hintsLeft).toBe(HINTS[d]);
      expect(s.notebook).toBe(d === 'madali');
    }
  });
  it('same seed, same hiding spots; different seed, usually different', () => {
    expect(started().game!.pets).toEqual(started().game!.pets);
    const other = run(initialState(), { type: 'start', seed: 43 });
    expect(other.game!.pets).not.toEqual(started().game!.pets);
  });
  it('search flow: pick a cell then confirm; water and searched cells are ignored', () => {
    let s = started();
    const water = s.game!.terrain.indexOf('ilog');
    s = run(s, { type: 'mode', mode: 'search' }, { type: 'pickCell', cell: water });
    expect(s.mode).toEqual({ kind: 'search', cell: null });
    expect(reducer(s, { type: 'confirmSearch' })).toBe(s);
    const cell = freeCell(s);
    s = run(s, { type: 'pickCell', cell }, { type: 'confirmSearch' });
    expect(s.game!.hoursUsed).toBe(1);
    expect(s.log).toEqual([{ type: 'search', rec: s.game!.searches[0] }]);
    expect(s.mode.kind).toBe('idle');
    s = run(s, { type: 'mode', mode: 'search' }, { type: 'pickCell', cell });
    expect(s.mode).toEqual({ kind: 'search', cell: null });
  });
  it('ask flow needs card, unfound pet and the right parameter', () => {
    let s = run(started(), { type: 'mode', mode: 'ask' });
    const g = s.game!;
    const h = g.hand.findIndex((k) => k === 'init' || k === 'tanaw');
    const hand = h >= 0 ? h : 0;
    s = run(s, { type: 'pickCard', hand }, { type: 'pickPet', pet: 'pusa' });
    const kind = g.hand[hand];
    if (kind === 'init' || kind === 'tanaw') {
      expect(reducer(s, { type: 'confirmAsk', seed: 1 })).toBe(s);
      s = kind === 'init' ? reducer(s, { type: 'pickCell', cell: 7 }) : reducer(s, { type: 'pickLine', line: { axis: 'col', n: 3 } });
    }
    s = reducer(s, { type: 'confirmAsk', seed: 1 });
    expect(s.game!.clues).toHaveLength(1);
    expect(s.game!.hand).toHaveLength(3);
    expect(s.log[0]).toMatchObject({ type: 'ask', clue: { kind, pet: 'pusa' } });
  });
  it('cannot ask about a found pet', () => {
    let s = started();
    s = run(s, { type: 'mode', mode: 'search' }, { type: 'pickCell', cell: s.game!.pets.aso }, { type: 'confirmSearch' });
    expect(s.game!.found.aso).toBe(true);
    s = run(s, { type: 'mode', mode: 'ask' }, { type: 'pickPet', pet: 'aso' });
    expect(s.mode).toMatchObject({ pet: null });
  });
  it('hints are limited and followHint pre-fills without acting', () => {
    let s = started('mahirap');
    s = reducer(s, { type: 'hint', hint: { type: 'search', cell: freeCell(s) } });
    expect(s.hintsLeft).toBe(0);
    expect(reducer(s, { type: 'hint', hint: { type: 'search', cell: 0 } })).toBe(s);
    s = reducer(s, { type: 'followHint' });
    expect(s.mode).toEqual({ kind: 'search', cell: freeCell(s) });
    expect(s.game!.hoursUsed).toBe(0);
  });
  it('a won game moves to the end screen and blocks further actions', () => {
    let s = started();
    for (const p of PET_IDS) s = run(s, { type: 'mode', mode: 'search' }, { type: 'pickCell', cell: s.game!.pets[p] }, { type: 'confirmSearch' });
    expect(s.game!.won).toBe(true);
    expect(reducer(s, { type: 'mode', mode: 'search' })).toBe(s);
    s = reducer(s, { type: 'showEnd' });
    expect(s.screen).toBe('end');
  });
  it('never mutates the previous state', () => {
    const s0 = started();
    const snapshot = structuredClone(s0);
    run(s0, { type: 'mode', mode: 'search' }, { type: 'pickCell', cell: freeCell(s0) }, { type: 'confirmSearch' });
    expect(s0).toEqual(snapshot);
  });
  it('clamps player count', () => {
    expect(reducer(initialState(), { type: 'settings', patch: { players: 9 } }).settings.players).toBe(4);
    expect(reducer(initialState(), { type: 'settings', patch: { players: 0 } }).settings.players).toBe(1);
  });
});
