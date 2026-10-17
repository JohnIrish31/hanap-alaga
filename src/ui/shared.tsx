import { useRef, useState } from 'react';
import type { Dispatch, KeyboardEvent } from 'react';
import {
  GAME_ICON, ICON, OVERLAY, PET_INFO, SCENE, bakasOverlay, bandIcon, pet as petArt, petHidden, petToken, purokIcon, terrainIcon, terrainTile, yesNoIcon,
} from '../assets/assets';
import { play } from '../assets/audio/sounds.js';
import { NEIGHBOURS, PETS, SIZE, isLine, rc } from '../game/rules';
import type { Band, Clue, Game, Heat, Line, PetId, Terrain } from '../game/rules';
import type { Action, AppState, LogEntry } from '../game/reducer';
import { LANGS, STRINGS, clockTime } from '../i18n';
import type { T } from '../i18n';

export interface Props { state: AppState; dispatch: Dispatch<Action>; t: T }

export const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const petName = (p: PetId) => PETS.find((x) => x.id === p)!.name;
export const PET_SOUND: Record<PetId, string> = { aso: 'kahol', pusa: 'ngiyaw', manok: 'putak' };

export function answerText(t: T, c: Clue): string {
  if (c.kind === 'purok') return `Purok ${c.answer}`;
  if (c.kind === 'lupa') return t.terrain[c.answer as Terrain];
  if (c.kind === 'init') return t.band[c.answer as Band];
  return c.answer ? t.yes : t.no;
}
export function answerIcon(c: Clue): string {
  if (c.kind === 'purok') return purokIcon(c.answer as 1 | 2 | 3 | 4);
  if (c.kind === 'lupa') return terrainIcon(c.answer as Terrain);
  if (c.kind === 'init') return bandIcon(c.answer as Band);
  return yesNoIcon(c.answer as boolean);
}
export function answerSound(c: Clue): string {
  if (c.kind === 'init') return c.answer as Band;
  if (c.kind === 'tanaw') return c.answer ? 'oo' : 'hindi';
  return 'pop';
}
export const lineName = (t: T, l: Line) => (l.axis === 'row' ? t.row(l.n + 1) : t.col(l.n + 1));

export function logText(t: T, e: LogEntry): string {
  if (e.type === 'search') return e.rec.pet ? t.logFound(petName(e.rec.pet), e.rec.cell) : t.logMiss(e.rec.cell, e.rec.bakas);
  const c = e.clue, who = NEIGHBOURS[c.kind].who, p = petName(c.pet), ans = answerText(t, c);
  if (c.kind === 'purok') return t.logPurok(who, p, c.answer as number, t.purokWhere[c.answer as number]);
  if (c.kind === 'lupa') return t.logLupa(who, p, t.terrainAt[c.answer as Terrain]);
  if (c.kind === 'init') return t.logInit(who, p, c.param as number, ans);
  return t.logTanaw(who, p, lineName(t, c.param as Line), ans);
}
export const logIcon = (e: LogEntry) => (e.type === 'ask' ? answerIcon(e.clue) : e.rec.pet ? petToken(e.rec.pet) : GAME_ICON.bakas);

export function LangSwitch({ state, dispatch, big = false }: Props & { big?: boolean }) {
  return (
    <div className={big ? 'lang lang-big' : 'lang'} role="group" aria-label={`${STRINGS.en.language} / ${STRINGS.tl.language}`}>
      {LANGS.map((l) => (
        <button key={l} type="button" className="choice" lang={l} aria-pressed={state.lang === l}
          onClick={() => { play('click'); dispatch({ type: 'lang', lang: l }); }}>
          {big ? STRINGS[l].langName : l.toUpperCase()}
          {!big && <span className="sr-only"> {STRINGS[l].langName}</span>}
        </button>
      ))}
    </div>
  );
}

export function SoundToggle({ state, dispatch, t }: Props) {
  return (
    <button type="button" className="btn icon-btn" aria-pressed={!state.muted} aria-label={state.muted ? t.soundOff : t.soundOn}
      title={state.muted ? t.soundOff : t.soundOn} onClick={() => dispatch({ type: 'mute', muted: !state.muted })}>
      <img src={state.muted ? ICON.soundOff : ICON.soundOn} alt="" />
    </button>
  );
}

export function TopBar(props: Props & { home?: boolean; title?: string }) {
  const { dispatch, t, home = true, title } = props;
  return (
    <header className="topbar">
      {home ? (
        <button type="button" className="btn icon-btn" aria-label={t.home} title={t.home} onClick={() => { play('click'); dispatch({ type: 'go', screen: 'home' }); }}>
          <img src={ICON.home} alt="" />
        </button>
      ) : <span className="topbar-spacer" />}
      {title ? <h1 className="topbar-title">{title}</h1> : <span className="grow" />}
      <LangSwitch {...props} />
      <SoundToggle {...props} />
    </header>
  );
}

export function SunClock({ g, t }: { g: Game; t: T }) {
  const left = Math.max(0, g.hours - g.hoursUsed);
  const pct = 6 + (88 * g.hoursUsed) / g.hours;
  const night = g.done && !g.won;
  return (
    <div className="clock">
      <div className="sky">
        <img src={SCENE.sky} alt="" />
        <img className={night ? 'sun' : 'sun anim-sun-glow'} src={night ? GAME_ICON.buwan : GAME_ICON.araw} style={{ left: `${pct}%` }} alt="" />
      </div>
      <p className="hours"><img src={GAME_ICON.orasan} alt="" /> {t.clock(clockTime(g.hoursUsed), left)}</p>
    </div>
  );
}

export function PetsRow({ g, t }: { g: Game; t: T }) {
  return (
    <ul className="pets-row" aria-label="Bantay, Muning, Kikay">
      {PETS.map(({ id }) => (
        <li key={id + g.found[id]}>
          <img className={g.found[id] ? 'anim-pop' : ''} src={g.found[id] ? petToken(id) : petHidden(id)} alt={`${t.pet[id]}: ${g.found[id] ? t.found : t.notFound}`} />
        </li>
      ))}
    </ul>
  );
}

export interface BoardProps {
  g: Game;
  t: T;
  pickable?: (cell: number) => boolean;
  onPick?: (cell: number) => void;
  target?: number | null;
  selectedCell?: number | null;
  selectedLine?: Line | null;
  hinted?: number | null;
  rustle?: number | null;
  heat?: { pet: PetId; values: Heat[PetId] } | null;
  reveal?: boolean;
}

export function Board({ g, t, pickable, onPick, target, selectedCell, selectedLine, hinted, rustle, heat, reveal }: BoardProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focus, setFocus] = useState(0);
  const searched = new Map(g.searches.map((s) => [s.cell, s]));
  const inLine = (i: number) => {
    if (!selectedLine || !isLine(selectedLine)) return false;
    const [r, c] = rc(i);
    return selectedLine.axis === 'row' ? r === selectedLine.n : c === selectedLine.n;
  };
  const move = (e: KeyboardEvent, i: number) => {
    const [r, c] = rc(i);
    const to: Record<string, number> = {
      ArrowUp: r > 0 ? i - SIZE : i, ArrowDown: r < SIZE - 1 ? i + SIZE : i,
      ArrowLeft: c > 0 ? i - 1 : i, ArrowRight: c < SIZE - 1 ? i + 1 : i,
      Home: i - c, End: i - c + SIZE - 1,
    };
    if (!(e.key in to)) return;
    e.preventDefault();
    setFocus(to[e.key]);
    refs.current[to[e.key]]?.focus();
  };

  return (
    <div className="map">
      <img className="frame" src={SCENE.frame} alt="" />
      <div className="grid6" role="group" aria-label={t.map_}>
        {g.terrain.map((terrain, i) => {
          const [r, c] = rc(i);
          const s = searched.get(i);
          const foundPet = s?.pet ?? null;
          const shownPet: PetId | null = foundPet ?? (reveal ? (PETS.find((p) => g.pets[p.id] === i)?.id ?? null) : null);
          const canPick = !!pickable?.(i);
          const p = heat && !s ? heat.values[i] : 0;
          const pct = Math.round(p * 100);
          const selected = target === i || selectedCell === i || inLine(i);
          const label = [
            t.cellLabel(r + 1, c + 1), t.terrain[terrain],
            s && !foundPet ? t.bakasLabel(s.bakas) : '',
            shownPet ? (foundPet ? t.foundHere : t.wasHere)(petName(shownPet)) : '',
            pct > 0 && heat ? t.chance(petName(heat.pet), pct) : '',
          ].filter(Boolean).join(', ');
          return (
            <button key={i} ref={(el) => { refs.current[i] = el; }} type="button"
              className={`cell${terrain === 'ilog' ? ' water' : ''}${hinted === i ? ' hinted' : ''}${canPick ? ' pickable' : ''}`}
              tabIndex={i === focus ? 0 : -1} aria-label={label} aria-disabled={!canPick}
              aria-pressed={pickable ? selected : undefined}
              onFocus={() => setFocus(i)} onKeyDown={(e) => move(e, i)}
              onClick={() => { if (canPick) onPick?.(i); else if (pickable) play('invalid'); }}>
              <img className={rustle === i ? 'anim-rustle' : ''} src={terrainTile(terrain)} alt="" />
              {p > 0 && <span className="heat" style={{ ['--p' as string]: Math.max(0.15, p), ['--heat-color' as string]: PET_INFO[heat!.pet].hex }} />}
              {p > 0 && <span className="pct" aria-hidden="true">{pct}%</span>}
              {s && !foundPet && <img className="anim-paw-in" src={bakasOverlay(Math.min(3, s.bakas) as 0 | 1 | 2 | 3)} alt="" />}
              {shownPet && <img className="found" src={OVERLAY.found} alt="" />}
              {shownPet && <img className={`pet ${foundPet ? 'anim-pet-jump' : 'anim-pop'}`} src={petArt(shownPet)} alt="" />}
              {target === i && <img className="overlay" src={OVERLAY.target} alt="" />}
              {selectedCell === i && <img className="overlay" src={OVERLAY.selectedCell} alt="" />}
              {inLine(i) && <img className="overlay" src={OVERLAY.selectedLine} alt="" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
