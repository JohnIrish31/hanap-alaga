import { ICON, SCENE, pet } from '../assets/assets';
import { play } from '../assets/audio/sounds.js';
import { PETS } from '../game/rules';
import { STRINGS } from '../i18n';
import { LangSwitch, SoundToggle } from '../ui/shared';
import type { Props } from '../ui/shared';

export function Home(props: Props) {
  const { state, dispatch, t } = props;
  const inProgress = state.game && !state.game.done;
  return (
    <>
      <div className="banderitas-top" aria-hidden="true" />
      <main className="screen home">
        <h1 className="sr-only">Hanap-Alaga</h1>
        <img className="logo anim-pop" src={SCENE.logo} alt={`Hanap-Alaga: ${t.tagline}`} />
        {state.lang === 'en' && <p className="tagline">{t.tagline}</p>}

        <section className="panel bilingual" aria-labelledby="bilingual-title">
          <h2 id="bilingual-title" className="bilingual-title">
            <span lang="en">{STRINGS.en.bilingual}</span>
            <span lang="tl">{STRINGS.tl.bilingual}</span>
          </h2>
          <LangSwitch {...props} big />
        </section>

        <img className="hero" src={SCENE.hero} alt="" />
        <ul className="trio" aria-hidden="true">
          {PETS.map((p, i) => <li key={p.id}><img className="anim-float" style={{ animationDelay: `${i * 0.4}s` }} src={pet(p.id)} alt="" /></li>)}
        </ul>
        <p className="intro">{t.intro}</p>

        {inProgress && <button type="button" className="btn big" onClick={() => { play('click'); dispatch({ type: 'resume' }); }}>{t.resume}</button>}
        <button type="button" className="btn big accent" onClick={() => { play('click'); dispatch({ type: 'go', screen: 'setup' }); }}>{t.play}</button>
        <button type="button" className="btn big ghost with-icon" onClick={() => { play('click'); dispatch({ type: 'go', screen: 'rules' }); }}>
          <img src={ICON.rules} alt="" /> {t.howTo}
        </button>
        <div className="row wrap">
          <SoundToggle {...props} />
          <button type="button" className="choice" aria-pressed={state.ambient} disabled={state.muted}
            onClick={() => dispatch({ type: 'ambient', on: !state.ambient })}>
            {t.ambient}
          </button>
        </div>
      </main>
    </>
  );
}
