// Typed access to every SVG. Vite hashes + serves them as plain URLs, so use <img src={...}>.
// Keep this file next to the svg/ folder (e.g. src/assets/assets.ts).
const urls = import.meta.glob('./svg/**/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const svg = (path: string): string => {
  const u = urls[`./svg/${path}.svg`];
  if (!u) throw new Error(`Missing asset: ${path}`);
  return u;
};

export const ICON = {
  soundOn: svg('icons/sound-on'), soundOff: svg('icons/sound-off'), rules: svg('icons/rules'), trophy: svg('icons/trophy'),
  robot: svg('icons/robot'), home: svg('icons/home'), restart: svg('icons/restart'), players: svg('icons/players'),
  check: svg('icons/check'), close: svg('icons/close'),
} as const;

export type Terrain = 'bahay' | 'puno' | 'palayan' | 'ilog' | 'tindahan' | 'halamanan';
export type PetId = 'aso' | 'pusa' | 'manok';
export type NeighbourKind = 'purok' | 'lupa' | 'init' | 'tanaw';
export type Band = 'mainit' | 'maligamgam' | 'malamig';

export const PET_INFO: Record<PetId, { name: string; kind: string; hex: string }> = {
  aso: { name: 'Bantay', kind: 'Aso', hex: '#C8792B' }, pusa: { name: 'Muning', kind: 'Pusa', hex: '#F28C28' }, manok: { name: 'Kikay', kind: 'Manok', hex: '#E23B3B' },
};
export const terrainTile = (t: Terrain) => svg(`terrain/${t}`);
export const terrainIcon = (t: Terrain) => svg(`terrain/icon-${t}`);
export const pet = (p: PetId) => svg(`pets/${p}`);
export const petToken = (p: PetId) => svg(`pets/token-${p}`);
export const petHidden = (p: PetId) => svg(`pets/hidden-${p}`);
export const neighbourCard = (k: NeighbourKind) => svg(`neighbours/${k}`);
export const neighbourBack = () => svg('neighbours/card-back');
export const bakasOverlay = (n: 0 | 1 | 2 | 3) => svg(`overlays/bakas-${n}`);
export const bandIcon = (b: Band) => svg(`answers/${b}`);
export const yesNoIcon = (yes: boolean) => svg(yes ? 'answers/oo' : 'answers/hindi');
export const purokIcon = (n: 1 | 2 | 3 | 4) => svg(`answers/purok-${n}`);

export const OVERLAY = { target: svg('overlays/target'), found: svg('overlays/found'), selectedCell: svg('overlays/selected-cell'), selectedLine: svg('overlays/selected-line') } as const;
export const GAME_ICON = {
  maghanap: svg('icons/maghanap'), magtanong: svg('icons/magtanong'), kuwaderno: svg('icons/kuwaderno'), tulong: svg('icons/tulong'),
  araw: svg('icons/araw'), buwan: svg('icons/buwan'), orasan: svg('icons/orasan'), bakas: svg('icons/bakas'),
} as const;
export const SCENE = { logo: svg('scenes/logo'), hero: svg('scenes/hero'), panalo: svg('scenes/panalo'), talo: svg('scenes/talo'), frame: svg('board/frame'), sky: svg('decor/sky-track') } as const;
