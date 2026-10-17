import { useEffect, useReducer } from 'react';
import { setMuted, startAmbient, stopAmbient, unlockAudio } from './assets/audio/sounds.js';
import { initialState, reducer } from './game/reducer';
import type { Lang } from './game/reducer';
import { STRINGS } from './i18n';
import { End } from './screens/End';
import { Game } from './screens/Game';
import { Home } from './screens/Home';
import { Rules } from './screens/Rules';
import { Setup } from './screens/Setup';

const LANG_KEY = 'hanap-alaga.lang';
function savedLang(): Lang {
  try { return localStorage.getItem(LANG_KEY) === 'tl' ? 'tl' : 'en'; } catch { return 'en'; }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(savedLang()));
  const t = STRINGS[state.lang];

  useEffect(() => {
    document.documentElement.lang = state.lang;
    try { localStorage.setItem(LANG_KEY, state.lang); } catch {}
  }, [state.lang]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);
  useEffect(() => { setMuted(state.muted); }, [state.muted]);
  useEffect(() => {
    if (state.ambient && !state.muted) startAmbient();
    else stopAmbient();
    return stopAmbient;
  }, [state.ambient, state.muted]);
  useEffect(() => { window.scrollTo(0, 0); }, [state.screen]);

  const props = { state, dispatch, t };
  let screen;
  switch (state.screen) {
    case 'home': screen = <Home {...props} />; break;
    case 'rules': screen = <Rules {...props} />; break;
    case 'setup': screen = <Setup {...props} />; break;
    case 'game': screen = state.game ? <Game {...props} /> : <Home {...props} />; break;
    case 'end': screen = state.game ? <End {...props} /> : <Home {...props} />; break;
  }
  return <div className="app">{screen}</div>;
}
