import { terrainTile } from '../assets/assets';
import { play } from '../assets/audio/sounds.js';
import { DIFFICULTY, MAPS, mapTerrain } from '../game/rules';
import type { Difficulty } from '../game/rules';
import { HINTS, MAX_PLAYERS } from '../game/reducer';
import { TopBar, newSeed } from '../ui/shared';
import type { Props } from '../ui/shared';

export function Setup(props: Props) {
  const { state, dispatch, t } = props;
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => { play('click'); dispatch({ type: 'settings', patch }); };
  return (
    <>
      <TopBar {...props} title={t.setupTitle} />
      <main className="screen setup">
        <section className="panel">
          <h2 id="players-h">{t.players}</h2>
          <div className="row wrap" role="group" aria-labelledby="players-h">
            {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className="choice num" aria-pressed={s.players === n} onClick={() => set({ players: n })}>{n}</button>
            ))}
          </div>
          <p className="note">{t.coop}</p>
          {s.players > 1 && (
            <div className="names">
              {Array.from({ length: s.players }, (_, i) => (
                <label key={i}>
                  <span className="sr-only">{t.nameOf(i + 1)}</span>
                  <input type="text" maxLength={14} placeholder={t.playerN(i + 1)} value={s.names[i]} autoComplete="off"
                    onChange={(e) => dispatch({ type: 'settings', patch: { names: s.names.map((x, k) => (k === i ? e.target.value : x)) } })} />
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2 id="map-h">{t.map}</h2>
          <div className="options" role="group" aria-labelledby="map-h">
            {MAPS.map((m) => (
              <button key={m.id} type="button" className="choice option" aria-pressed={s.mapId === m.id} onClick={() => set({ mapId: m.id })}>
                <span className="thumb" aria-hidden="true">{mapTerrain(m.id).map((tr, i) => <img key={i} src={terrainTile(tr)} alt="" />)}</span>
                <span>{m.name}</span>
                <small>{t.mapSub[m.id]}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 id="diff-h">{t.difficulty}</h2>
          <div className="options diff" role="group" aria-labelledby="diff-h">
            {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
              <button key={d} type="button" className="choice option" aria-pressed={s.difficulty === d} onClick={() => set({ difficulty: d })}>
                <span>{t.diff[d]}</span>
                <strong>{t.hours(DIFFICULTY[d])}</strong>
                <small>{t.diffNote(HINTS[d], d === 'madali')}</small>
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="btn big accent" onClick={() => { play('pop'); dispatch({ type: 'start', seed: newSeed() }); }}>{t.start}</button>
      </main>
    </>
  );
}
