import { useEffect, useRef } from 'react';
import { ICON, SCENE, petToken } from '../assets/assets';
import { play } from '../assets/audio/sounds.js';
import { launchConfetti } from '../assets/fx.js';
import { unfoundPets } from '../game/rules';
import { Board, TopBar, newSeed, petName } from '../ui/shared';
import type { Props } from '../ui/shared';

export function End(props: Props) {
  const { state, dispatch, t } = props;
  const g = state.game!;
  const missing = unfoundPets(g);

  const played = useRef(false);
  useEffect(() => {
    if (!played.current) play(g.won ? 'win' : 'takipsilim');
    played.current = true;
    if (g.won) return launchConfetti();
  }, [g]);

  return (
    <>
      <TopBar {...props} />
      <main className="screen end center">
        <img className="scene anim-pop" src={g.won ? SCENE.panalo : SCENE.talo} alt="" />
        <h1 className="banner" role="status">{g.won ? t.winTitle : t.loseTitle}</h1>
        {g.won ? <p className="big-line">{t.winHours(g.hoursUsed)}</p> : (
          <>
            <p className="big-line">{t.loseLine}</p>
            <p className="missing">
              {t.missing} {missing.map((p) => <span key={p} className="chip"><img src={petToken(p)} alt="" /> {petName(p)}</span>)}
            </p>
          </>
        )}
        <Board g={g} t={t} reveal />
        <div className="row end-buttons">
          <button type="button" className="btn big accent with-icon" onClick={() => { play('pop'); dispatch({ type: 'start', seed: newSeed() }); }}>
            <img src={ICON.restart} alt="" /> {t.again}
          </button>
          <button type="button" className="btn big ghost with-icon" onClick={() => { play('click'); dispatch({ type: 'go', screen: 'home' }); }}>
            <img src={ICON.home} alt="" /> {t.home}
          </button>
        </div>
      </main>
    </>
  );
}
