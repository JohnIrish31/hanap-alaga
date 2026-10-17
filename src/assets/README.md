# HANAP-ALAGA — Asset Pack

Everything for the game's look, sound and rules, generated in code: no image files, no audio files, no fonts, no CDN.
69 SVGs (about 115 KB raw), a synthesized sound module, 2 CSS files, small helpers, and a **tested reference rules engine + bots**.

**Open `preview.html` in any browser**: bots play a real game with these rules, plus every asset, animation and sound.
Then paste `MASTER_PROMPT.md` into Claude Code to build the Vite app.

## Folder layout (keep it as is; put the whole folder at `src/assets/`)

```
assets.ts              typed helpers for Vite (import.meta.glob of svg/)
fx.js                  launchConfetti(), replay(el, cls)
audio/sounds.js        play(name), setMuted(), unlockAudio(), startAmbient()/stopAmbient()
styles/theme.css       tokens + components for this game's screens
styles/animations.css  .anim-* classes + confetti
reference/rules.js     pure rules engine (the test oracle)
reference/bots.js      bots / helpers
svg/
  terrain/     bahay, puno, palayan, ilog, tindahan, halamanan (100x100 tiles) + icon-{terrain} (64)
  pets/        aso (Bantay), pusa (Muning), manok (Kikay) full art + token-{pet} + hidden-{pet}
  overlays/    bakas-0..3, target, found, selected-cell, selected-line
  neighbours/  purok (Aling Nena), lupa (Mang Ben), init (Bunso), tanaw (Lolo Tasyo), card-back
  answers/     mainit, maligamgam, malamig, oo, hindi, purok-1..4
  icons/       maghanap, magtanong, kuwaderno, tulong, araw, buwan, orasan, bakas + common UI icons
  board/       frame (720x720, the 6x6 grid sits at 5.56% inset)
  decor/ scenes/  sky-track, bg-grass, banderitas, logo, hero, panalo, talo
  icons/       sound-on, sound-off, rules, trophy, robot, home, restart, players, check, close
  manifest.json
```

## Rules in one screen

- Cooperative. 3 pets hidden on a 6x6 map (never in the river). Each action costs 1 hour; Madali 16 / Katamtaman 13 / Mahirap 10 hours.
- Maghanap a cell: found, or the number of pets in the 8 cells around (bakas).
- Magtanong one of 3 neighbour cards about one pet: purok (quarter), lupa (terrain), init-lamig (distance from a chosen cell), tanaw (in this row/column?).
- `consistent()` / `heatmap()` power the Kuwaderno helper; `smartAction()` powers the Tulong hint.

## Balance (simulated with the reference bots)

- Perfect logic needs ~8 hours (91% win at 10 h); a decent family ~12 h (~80% at 13 h, 96% at 16 h); random-ish play ~18 h.

## Sounds

`kahol, ngiyaw, putak, kaluskos, bakas, wala, tanong, oo, hindi, mainit, maligamgam, malamig, orasan, takipsilim, nahanap + common`. Browsers block audio until a user gesture: call `unlockAudio()` in the first tap.

## Animations

`anim-rustle, anim-pet-jump, anim-paw-in, anim-sun-glow + common` (common: anim-pop, anim-bump, anim-fade-in, anim-slide-up, anim-shake-x, anim-float, anim-sway, anim-wobble, anim-card-flip, anim-rise-fade). Replay with `replay(el, cls)`. Motion is disabled under `prefers-reduced-motion`.

## Notes

- Every SVG has unique ids (prefixed by file name), so several can be inlined on one page.
- Text inside SVGs is Filipino; edit the SVG text directly to change wording.
