import { describe, expect, it } from 'vitest';
import { ask, mulberry32, newGame, search } from './rules';
import { smartAction } from './bots';

describe('balance', () => {
  it('smartAction finds all pets within 10 hours in >= 85% of 60 games (Baryo Masaya)', () => {
    let wins = 0;
    const hours: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      const rng = mulberry32(seed);
      let g = newGame({ mapId: 'baryo-masaya', difficulty: 'mahirap' }, rng);
      while (!g.done) {
        const act = smartAction(g, rng);
        g = act.type === 'search' ? search(g, act.cell) : ask(g, act.hand, act.pet, act.param, rng);
      }
      if (g.won) { wins++; hours.push(g.hoursUsed); }
    }
    const avg = hours.reduce((a, b) => a + b, 0) / Math.max(1, hours.length);
    console.info(`balance: ${wins}/60 wins within 10 h, avg ${avg.toFixed(1)} h when won`);
    expect(wins / 60).toBeGreaterThanOrEqual(0.85);
  }, 300_000);
});
