import { useEffect, useMemo, useRef, useState } from 'react';
import { GAME_ICON, PET_INFO, neighbourCard, petToken } from '../assets/assets';
import { play } from '../assets/audio/sounds.js';
import { launchConfetti } from '../assets/fx.js';
import { smartAction } from '../game/bots';
import { askReady } from '../game/reducer';
import type { LogEntry } from '../game/reducer';
import { NEIGHBOURS, PETS, SIZE, canSearch, heatmap, hoursLeft, isLine, mulberry32, unfoundPets } from '../game/rules';
import type { Line, PetId } from '../game/rules';
import {
  Board, PET_SOUND, PetsRow, SunClock, TopBar, answerSound, lineName, logIcon, logText, newSeed, petName, reducedMotion,
} from '../ui/shared';
import type { Props } from '../ui/shared';

const CELLS = [...Array(SIZE * SIZE).keys()];
const LINE_CHOICES: Line[] = (['row', 'col'] as const).flatMap((axis) => [...Array(SIZE).keys()].map((n) => ({ axis, n })));

export function Game(props: Props) {
  const { state, dispatch, t } = props;
  const g = state.game!;
  const { mode, hint } = state;
  const [rustle, setRustle] = useState<number | null>(null);
  const [bubble, setBubble] = useState<LogEntry | null>(null);
  const [thinking, setThinking] = useState(false);
  const [heatPet, setHeatPet] = useState<PetId>('aso');
  const [announce, setAnnounce] = useState('');
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const unfound = unfoundPets(g);
  const left = hoursLeft(g);
  const notebookPet = unfound.includes(heatPet) ? heatPet : unfound[0];
  const heat = useMemo(() => (state.notebook ? heatmap(g) : null), [g, state.notebook]);
  const askKind = mode.kind === 'ask' && mode.hand !== null ? g.hand[mode.hand] : null;
  const busy = rustle !== null || g.done;

  const seenSeq = useRef(state.seq);
  useEffect(() => {
    if (state.seq === seenSeq.current) return;
    seenSeq.current = state.seq;
    const e = state.log[state.log.length - 1];
    if (!e) return;
    setBubble(e);
    setAnnounce(logText(t, e));
    if (e.type === 'search' && e.rec.pet) {
      play(PET_SOUND[e.rec.pet]);
      later(() => play('nahanap'), 450);
      launchConfetti(40, 2200);
    } else if (e.type === 'search') play(e.rec.bakas > 0 ? 'bakas' : 'wala');
    else play(answerSound(e.clue));
    later(() => play('orasan'), 850);
    if (g.done) later(() => dispatch({ type: 'showEnd' }), g.won ? 1800 : 1500);
  }, [state.seq]);

  const flowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode.kind === 'idle') return;
    setBubble(null);
    flowRef.current?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [mode.kind]);

  const confirmSearch = () => {
    if (mode.kind !== 'search' || mode.cell === null || busy) return;
    const cell = mode.cell;
    setRustle(cell);
    setAnnounce(t.waitFor);
    play('kaluskos');
    later(() => { setRustle(null); dispatch({ type: 'confirmSearch' }); }, reducedMotion() ? 60 : 550);
  };
  const confirmAsk = () => {
    if (!askReady(g, mode) || busy) return;
    play('tanong');
    dispatch({ type: 'confirmAsk', seed: newSeed() });
  };
  const askHint = () => {
    if (state.hintsLeft <= 0 || thinking || busy) return;
    setThinking(true);
    setAnnounce(t.thinking);
    later(() => {
      const h = smartAction(g, mulberry32(newSeed()));
      setThinking(false);
      dispatch({ type: 'hint', hint: h });
      play('pop');
    }, 40);
  };

  const hintText = hint
    ? hint.type === 'search'
      ? t.hintSearch(hint.cell)
      : t.hintAsk(NEIGHBOURS[g.hand[hint.hand]].who, petName(hint.pet),
        typeof hint.param === 'number' ? t.hintSquare(hint.param) : isLine(hint.param) ? t.hintLine(hint.param) : '')
    : '';
  useEffect(() => { if (hintText) setAnnounce(hintText); }, [hintText]);

  const pickable = mode.kind === 'search' ? (i: number) => !busy && canSearch(g, i)
    : askKind === 'init' ? () => !busy
      : undefined;
  const pick = (i: number) => { play('click'); dispatch({ type: 'pickCell', cell: i }); };

  let status: string = t.status;
  if (mode.kind === 'search') status = t.pickSearch;
  if (mode.kind === 'ask') {
    status = mode.hand === null ? t.pickCard : mode.pet === null ? t.pickPet
      : askKind === 'init' && mode.param === null ? t.pickCell
        : askKind === 'tanaw' && mode.param === null ? t.pickLine
          : t.askHelp[askKind!];
  }
  const playerName = (state.settings.names[g.turn] ?? '').trim() || t.playerN(g.turn + 1);
  const cellOption = (i: number) => `${t.cellLabel(Math.floor(i / SIZE) + 1, (i % SIZE) + 1)}: ${t.terrain[g.terrain[i]]}`;

  return (
    <>
      <TopBar {...props} />
      <main className="screen game">
        <SunClock g={g} t={t} />
        <PetsRow g={g} t={t} />
        {g.players > 1 && !g.done && <p className="turn" key={g.turn}><span className="anim-pop">{t.turnOf(playerName)}</span></p>}
        {left <= 2 && !g.done && <p className="banner warn anim-shake-x" role="status">{t.warn(left)}</p>}

        {bubble && mode.kind === 'idle' ? (
          <div className="bubble anim-slide-up" key={state.seq}>
            {bubble.type === 'ask' && <img className="who" src={neighbourCard(bubble.clue.kind)} alt="" />}
            <img className="answer anim-pop" src={logIcon(bubble)} alt="" />
            <p>{logText(t, bubble)}</p>
          </div>
        ) : (
          <p className="hint status">{status}</p>
        )}

        <Board g={g} t={t} pickable={pickable} onPick={pick} rustle={rustle}
          target={mode.kind === 'search' ? mode.cell : null}
          selectedCell={askKind === 'init' && mode.kind === 'ask' && typeof mode.param === 'number' ? mode.param : null}
          selectedLine={askKind === 'tanaw' && mode.kind === 'ask' && isLine(mode.param) ? mode.param : null}
          hinted={hint?.type === 'search' ? hint.cell : hint?.type === 'ask' && typeof hint.param === 'number' ? hint.param : null}
          heat={heat && notebookPet ? { pet: notebookPet, values: heat.heat[notebookPet] } : null} />

        {mode.kind === 'idle' && (
          <div className="actions">
            <button type="button" className="btn action search" disabled={busy} onClick={() => { play('click'); dispatch({ type: 'mode', mode: 'search' }); }}>
              <img src={GAME_ICON.maghanap} alt="" /> {t.search}
            </button>
            <button type="button" className="btn action ask" disabled={busy} onClick={() => { play('card'); dispatch({ type: 'mode', mode: 'ask' }); }}>
              <img src={GAME_ICON.magtanong} alt="" /> {t.askBtn}
            </button>
          </div>
        )}

        {mode.kind === 'search' && (
          <div className="flow panel anim-slide-up" ref={flowRef}>
            <label className="list-pick">
              <span>{t.fromList}</span>
              <select value={mode.cell ?? ''} onChange={(e) => e.target.value !== '' && pick(Number(e.target.value))}>
                <option value="">{t.chooseSquare}</option>
                {CELLS.filter((i) => canSearch(g, i)).map((i) => <option key={i} value={i}>{cellOption(i)}</option>)}
              </select>
            </label>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => dispatch({ type: 'mode', mode: 'idle' })}>{t.cancel}</button>
              <button type="button" className="btn accent grow with-icon" disabled={mode.cell === null || busy} onClick={confirmSearch}>
                <img src={GAME_ICON.maghanap} alt="" /> {t.searchHere}
              </button>
            </div>
          </div>
        )}

        {mode.kind === 'ask' && (
          <div className="flow panel anim-slide-up" ref={flowRef}>
            <div className="neighbours" role="group" aria-label={t.pickCard}>
              {g.hand.map((k, h) => (
                <button key={`${h}-${k}-${g.hoursUsed}`} type="button" className={`tap card-pick${hint?.type === 'ask' && hint.hand === h ? ' hinted' : ''}`}
                  aria-pressed={mode.hand === h} aria-label={`${NEIGHBOURS[k].who}: ${t.ask[k]}`}
                  onClick={() => { play('card'); dispatch({ type: 'pickCard', hand: h }); }}>
                  <img className="anim-card-flip" style={{ animationDelay: `${h * 0.08}s` }} src={neighbourCard(k)} alt="" />
                  {state.lang === 'en' && <span className="caption">{t.ask[k]}</span>}
                </button>
              ))}
            </div>

            {mode.hand !== null && (
              <div className="pick-pets row wrap" role="group" aria-label={t.pickPet}>
                {PETS.map(({ id }) => (
                  <button key={id} type="button" className={`choice pet-choice${hint?.type === 'ask' && hint.pet === id ? ' hinted' : ''}`}
                    aria-pressed={mode.pet === id} disabled={g.found[id]} style={{ ['--pet' as string]: PET_INFO[id].hex }}
                    onClick={() => { play('pop'); dispatch({ type: 'pickPet', pet: id }); }}>
                    <img src={petToken(id)} alt="" /> {petName(id)}
                  </button>
                ))}
              </div>
            )}

            {askKind === 'init' && mode.pet !== null && (
              <label className="list-pick">
                <span>{t.fromList}</span>
                <select value={typeof mode.param === 'number' ? mode.param : ''} onChange={(e) => e.target.value !== '' && pick(Number(e.target.value))}>
                  <option value="">{t.chooseSquare}</option>
                  {CELLS.map((i) => <option key={i} value={i}>{cellOption(i)}</option>)}
                </select>
              </label>
            )}

            {askKind === 'tanaw' && mode.pet !== null && (
              <div className="lines" role="group" aria-label={t.pickLine}>
                {LINE_CHOICES.map((l) => {
                  const on = isLine(mode.param) && mode.param.axis === l.axis && mode.param.n === l.n;
                  const hinted = hint?.type === 'ask' && isLine(hint.param) && hint.param.axis === l.axis && hint.param.n === l.n;
                  return (
                    <button key={l.axis + l.n} type="button" className={`choice small${hinted ? ' hinted' : ''}`} aria-pressed={on}
                      onClick={() => { play('click'); dispatch({ type: 'pickLine', line: l }); }}>
                      {lineName(t, l)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="row">
              <button type="button" className="btn ghost" onClick={() => dispatch({ type: 'mode', mode: 'idle' })}>{t.cancel}</button>
              <button type="button" className="btn accent grow with-icon" disabled={!askReady(g, mode) || busy} onClick={confirmAsk}>
                <img src={GAME_ICON.magtanong} alt="" /> {t.askNow}
              </button>
            </div>
          </div>
        )}

        {hint && (
          <div className="hint-box anim-pop" role="note">
            <img src={GAME_ICON.tulong} alt="" />
            <p>{hintText}</p>
            <button type="button" className="btn small" onClick={() => { play('click'); dispatch({ type: 'followHint' }); }}>{t.doHint}</button>
          </div>
        )}
        <div className="tools row">
          <button type="button" className="choice with-icon grow" aria-pressed={state.notebook} onClick={() => { play('click'); dispatch({ type: 'notebook', on: !state.notebook }); }}>
            <img src={GAME_ICON.kuwaderno} alt="" /> {t.notebook}
          </button>
          <button type="button" className="choice with-icon grow" disabled={state.hintsLeft <= 0 || thinking || busy} onClick={askHint}>
            <img src={GAME_ICON.tulong} alt="" /> {thinking ? t.thinking : <>{t.hint} <span className="badge" aria-hidden="true">{state.hintsLeft}</span><span className="sr-only">{t.hintsLeft(state.hintsLeft)}</span></>}
          </button>
        </div>

        {heat && unfound.length > 0 && (
          <section className="panel notebook" aria-label={t.notebook}>
            <div className="row wrap" role="group" aria-label={t.notebookFor}>
              {unfound.map((p) => (
                <button key={p} type="button" className="choice small pet-choice" aria-pressed={notebookPet === p} style={{ ['--pet' as string]: PET_INFO[p].hex }}
                  onClick={() => setHeatPet(p)}>
                  <img src={petToken(p)} alt="" /> {petName(p)}
                </button>
              ))}
            </div>
            <ul>
              {unfound.map((p) => (
                <li key={p}><span className="dot" style={{ background: PET_INFO[p].hex }} />{t.possible(petName(p), heat.heat[p].filter((v) => v > 0).length)}</li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="clues-h">
          <h2 id="clues-h" className="clues-title">{t.clues}</h2>
          {state.log.length === 0 ? <p className="note">{t.noClues}</p> : (
            <ol className="clue-log" reversed>
              {[...state.log].reverse().map((e, i) => (
                <li key={state.log.length - i} className={`clue${i === 0 ? ' anim-slide-up' : ''}`}>
                  <img src={logIcon(e)} alt="" /> <span>{logText(t, e)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="sr-only" aria-live="polite">{announce}</p>
      </main>
    </>
  );
}
