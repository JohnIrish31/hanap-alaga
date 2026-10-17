import { GAME_ICON, PET_INFO, SCENE, bakasOverlay, bandIcon, neighbourCard, pet, purokIcon, terrainIcon, yesNoIcon } from '../assets/assets';
import { play } from '../assets/audio/sounds.js';
import { DIFFICULTY, NEIGHBOURS, NEIGHBOUR_KINDS, PETS } from '../game/rules';
import type { NeighbourKind } from '../game/rules';
import { TopBar } from '../ui/shared';
import type { Props } from '../ui/shared';

const EXAMPLE_ICON: Record<NeighbourKind, string> = {
  purok: purokIcon(2), lupa: terrainIcon('bahay'), init: bandIcon('maligamgam'), tanaw: yesNoIcon(true),
};

export function Rules(props: Props) {
  const { dispatch, t } = props;
  const r = t.rules;
  return (
    <>
      <TopBar {...props} title={t.howTo} />
      <main className="screen rules">
        <section className="panel">
          <h2>{r.goalT}</h2>
          <ul className="trio">
            {PETS.map((p) => (
              <li key={p.id}><img src={pet(p.id)} alt="" /><span style={{ color: PET_INFO[p.id].hex }}>{t.pet[p.id]}</span></li>
            ))}
          </ul>
          <p>{r.goal}</p>
        </section>

        <section className="panel">
          <h2><img className="h-icon" src={GAME_ICON.araw} alt="" /> {r.timeT}</h2>
          <div className="sky"><img src={SCENE.sky} alt="" /><img className="sun anim-sun-glow" src={GAME_ICON.araw} style={{ left: '30%' }} alt="" /></div>
          <p>{r.time}</p>
          <p className="chips">{(Object.keys(DIFFICULTY) as (keyof typeof DIFFICULTY)[]).map((d) => <span key={d} className="chip">{t.diff[d]}: {t.hours(DIFFICULTY[d])}</span>)}</p>
        </section>

        <section className="panel">
          <h2><img className="h-icon" src={GAME_ICON.maghanap} alt="" /> {r.searchT}</h2>
          <p>{r.search}</p>
          <ul className="bakas-demo" aria-label={t.bakasLabel(0) + ' … ' + t.bakasLabel(3)}>
            {([0, 1, 2, 3] as const).map((n) => <li key={n}><img src={bakasOverlay(n)} alt="" /><span>{t.bakasLabel(n)}</span></li>)}
          </ul>
          <p><strong>{r.river}</strong></p>
        </section>

        <section className="panel">
          <h2><img className="h-icon" src={GAME_ICON.magtanong} alt="" /> {r.askT}</h2>
          <p>{r.ask}</p>
          <ul className="neighbour-list">
            {NEIGHBOUR_KINDS.map((k) => (
              <li key={k}>
                <img className="card" src={neighbourCard(k)} alt="" />
                <div>
                  <h3>{NEIGHBOURS[k].who}: {t.ask[k]}</h3>
                  <p>{t.askHelp[k]}</p>
                  <p className="example"><span>“{r.exQ[k]}”</span> <img src={EXAMPLE_ICON[k]} alt="" /> <strong>{r.exA[k]}</strong></p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>{r.toolsT}</h2>
          <p className="with-icon"><img src={GAME_ICON.kuwaderno} alt="" /> <span><strong>{t.notebook}:</strong> {r.notebook}</span></p>
          <p className="with-icon"><img src={GAME_ICON.tulong} alt="" /> <span><strong>{t.hint}:</strong> {r.hint}</span></p>
        </section>

        <section className="panel">
          <h2>{r.exampleT}</h2>
          <ol className="example-steps">{r.ex.map((line) => <li key={line}>{line}</li>)}</ol>
        </section>

        <button type="button" className="btn big accent" onClick={() => { play('click'); dispatch({ type: 'go', screen: 'setup' }); }}>{t.play}</button>
      </main>
    </>
  );
}
