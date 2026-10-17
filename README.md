# Hanap-Alaga

A warm, cooperative pet-finding game for 1-4 players on one device. **Play it in English or in Tagalog.** English is the default; tap **TL** (or "Tagalog" on the home screen) to switch the whole game to Tagalog at any time, even mid-game. The game remembers your choice.

Bantay (dog), Muning (cat) and Kikay (chicken) are lost in the village. Find all three before the sun sets.

## Run

```bash
npm install
npm run dev      # play at http://localhost:5173
npm test         # rules, reducer, parity with the reference engine, balance
npm run build    # production build in dist/
npm run size     # gzip sizes + budget check (JS <= 75 KB, CSS <= 8 KB)
```

## How to play (5 lines)

1. Every action costs 1 hour of daylight. Easy gives 16 hours, Medium 13, Hard 10.
2. **Search / Maghanap:** tap a square. If a pet is there, you found it! If not, the paw prints (bakas) tell how many pets are in the 8 squares around it.
3. **Ask / Magtanong:** pick a neighbour card and a pet. Aling Nena tells the purok (quarter), Mang Ben the kind of place, Bunso hot/warm/cold from a square, and Lolo Tasyo yes/no for a row or column.
4. **Notebook / Kuwaderno** shades where each pet could still be; **Hint / Tulong** suggests a smart move (limited per difficulty).
5. Find all three pets before sunset to win. Pets never hide in the river.

## Deploy

`npm run build`, then upload the `dist/` folder to any static host (Netlify, GitHub Pages, Vercel, S3, an nginx folder). No backend, no network calls, no service worker.

## Project layout

- `src/game/`: pure TypeScript rules engine (`rules.ts`), helper bots (`bots.ts`) and the app reducer. No React imports. Tests live next to them.
- `src/i18n.ts`: every UI string in English and Tagalog.
- `src/screens/`, `src/ui/`: React screens and shared pieces.
- `src/assets/`: the art, sound and reference-engine pack (`reference/*.js` is the test oracle).
- `reference-preview.html`: the visual reference demo (not shipped).
