import { describe, expect, it } from 'vitest';
import * as rules from './rules';
import * as bots from './bots';
import * as refRules from '../assets/reference/rules.js';
import * as refBots from '../assets/reference/bots.js';
import type { Game, MapId, Rng } from './rules';

const R = refRules as unknown as {
  newGame(o: object, rng: Rng): Game; search(g: Game, cell: number): Game;
  ask(g: Game, h: number, pet: string, param: unknown, rng: Rng): Game;
  consistent(g: Game): object[]; heatmap(g: Game): { heat: object; count: number }; canSearch(g: Game, c: number): boolean;
};
const B = refBots as unknown as { smartAction(g: Game, rng: Rng, sample?: number): bots.BotAction; casualAction(g: Game, rng: Rng): bots.BotAction };

const MAPS: MapId[] = ['baryo-masaya', 'tabing-ilog'];
const DIFFS = ['madali', 'katamtaman', 'mahirap'] as const;

describe('parity with reference/rules.js', () => {
  it('200 seeded games of identical actions give identical states', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const opts = { mapId: MAPS[seed % 2], difficulty: DIFFS[seed % 3], players: 1 + (seed % 4) };
      const rA = rules.mulberry32(seed), rB = rules.mulberry32(seed);
      let a = rules.newGame(opts, rA);
      let b = R.newGame(opts, rB);
      expect(a).toEqual(b);
      const driver = rules.mulberry32(seed * 31 + 1);
      while (!a.done) {
        let act: bots.BotAction;
        if (driver() < 0.3) {
          const cells = a.terrain.flatMap((_, i) => (rules.canSearch(a, i) ? [i] : []));
          act = { type: 'search', cell: cells[Math.floor(driver() * cells.length)] };
        } else act = bots.casualAction(a, driver);
        expect(R.canSearch(b, act.type === 'search' ? act.cell : 0)).toBe(rules.canSearch(a, act.type === 'search' ? act.cell : 0));
        if (act.type === 'search') { a = rules.search(a, act.cell); b = R.search(b, act.cell); }
        else { a = rules.ask(a, act.hand, act.pet, act.param, rA); b = R.ask(b, act.hand, act.pet, act.param, rB); }
        expect(a).toEqual(b);
      }
      expect(rules.consistent(a)).toEqual(R.consistent(b));
    }
  }, 120_000);

  it('consistent() and heatmap() match mid-game', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = rules.mulberry32(seed);
      let g = rules.newGame({ mapId: MAPS[seed % 2], difficulty: 'madali' }, rng);
      for (let i = 0; i < 5 && !g.done; i++) {
        const act = bots.casualAction(g, rng);
        g = act.type === 'search' ? rules.search(g, act.cell) : rules.ask(g, act.hand, act.pet, act.param, rng);
        expect(rules.consistent(g)).toEqual(R.consistent(g));
        expect(rules.heatmap(g)).toEqual(R.heatmap(g));
      }
    }
  }, 60_000);

  it('bots pick the same actions as reference/bots.js', () => {
    for (let seed = 1; seed <= 12; seed++) {
      let g = rules.newGame({ mapId: MAPS[seed % 2], difficulty: 'mahirap' }, rules.mulberry32(seed));
      const play = rules.mulberry32(seed + 1000);
      while (!g.done) {
        const mine = bots.smartAction(g, rules.mulberry32(seed + g.hoursUsed));
        const ref = B.smartAction(g, rules.mulberry32(seed + g.hoursUsed));
        expect(mine).toEqual(ref);
        expect(bots.casualAction(g, rules.mulberry32(seed))).toEqual(B.casualAction(g, rules.mulberry32(seed)));
        g = mine.type === 'search' ? rules.search(g, mine.cell) : rules.ask(g, mine.hand, mine.pet, mine.param, play);
      }
    }
  }, 120_000);
});
