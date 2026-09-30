import { typeColor } from '../utils/typeColors';

export interface Gym { city: string; leader: string; type: string; badge: string; team: { id: number; level: number }[]; tm?: string; hm?: string; perk?: string }
// Dados de ginásio (estilo FireRed). Nomes, sprites, tipos e golpes dos Pokémon continuam vindo da PokéAPI.
export const GYMS: Gym[] = [
  { city: 'Pewter', leader: 'Brock', type: 'rock', badge: 'Boulder', team: [{ id: 74, level: 12 }, { id: 95, level: 14 }], tm: 'rock-tomb', hm: 'flash',
    perk: 'Insígnia Pedra: +10% de Ataque físico para os seus Pokémon e permite usar Flash (MO05) fora de batalha.' },
  { city: 'Cerulean', leader: 'Misty', type: 'water', badge: 'Cascade', team: [{ id: 120, level: 18 }, { id: 121, level: 21 }] },
  { city: 'Vermilion', leader: 'Lt. Surge', type: 'electric', badge: 'Thunder', team: [{ id: 100, level: 21 }, { id: 25, level: 18 }, { id: 26, level: 24 }] },
  { city: 'Celadon', leader: 'Erika', type: 'grass', badge: 'Rainbow', team: [{ id: 71, level: 29 }, { id: 114, level: 24 }, { id: 45, level: 29 }] },
  { city: 'Fuchsia', leader: 'Koga', type: 'poison', badge: 'Soul', team: [{ id: 109, level: 37 }, { id: 89, level: 39 }, { id: 109, level: 37 }, { id: 110, level: 43 }] },
  { city: 'Saffron', leader: 'Sabrina', type: 'psychic', badge: 'Marsh', team: [{ id: 64, level: 38 }, { id: 122, level: 37 }, { id: 49, level: 38 }, { id: 65, level: 43 }] },
  { city: 'Cinnabar', leader: 'Blaine', type: 'fire', badge: 'Volcano', team: [{ id: 58, level: 42 }, { id: 77, level: 40 }, { id: 78, level: 42 }, { id: 59, level: 47 }] },
  { city: 'Viridian', leader: 'Giovanni', type: 'ground', badge: 'Earth', team: [{ id: 111, level: 45 }, { id: 51, level: 42 }, { id: 31, level: 44 }, { id: 34, level: 45 }, { id: 112, level: 50 }] },
];
// Iniciais de todas as gerações (1 a 9)
export const STARTERS = [[1, 4, 7], [152, 155, 158], [252, 255, 258], [387, 390, 393], [495, 498, 501], [650, 653, 656], [722, 725, 728], [810, 813, 816], [906, 909, 912]];

export const START = { x: 4, y: 27 };
const W = 30, H = 30;
const g: string[][] = Array.from({ length: H }, () => Array(W).fill('#'));
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const r = rnd(); g[y][x] = r < 0.45 ? 'g' : r < 0.62 ? '#' : r < 0.68 ? '~' : '.'; }
for (const y of [3, 9, 15, 21, 27]) for (let x = 1; x < W - 1; x++) g[y][x] = '.';
for (const x of [4, 14, 25]) for (let y = 1; y < H - 1; y++) g[y][x] = '.';
for (let y = 16; y <= 20; y++) for (let x = 5; x <= 13; x++) g[y][x] = y === 18 || rnd() > 0.25 ? 'c' : '#';
[[5, 24], [15, 24], [26, 24], [26, 14], [15, 14], [5, 14], [15, 6], [26, 6]].forEach(([x, y], i) => (g[y][x] = String(i + 1)));
[[6, 28], [15, 18], [26, 18]].forEach(([x, y]) => (g[y][x] = 'C'));

export const tileAt = (x: number, y: number) => g[y]?.[x] ?? '#';
export const BLOCKED = new Set(['#', '~']);
export const tileColor = (t: string) =>
  t === '.' ? '#E8D9A8' : t === 'g' ? '#5FAE4B' : t === '#' ? '#2F6B3A' : t === '~' ? '#4A90D9' : t === 'C' ? '#F5A3B0' : t === 'c' ? '#8C8C8C' : typeColor(GYMS[Number(t) - 1].type);
export const tileEmoji = (t: string) => (t === 'g' ? '🌿' : t === '#' ? '🌲' : t === '~' ? '🌊' : t === 'C' ? '🏥' : /[1-8]/.test(t) ? '🏛️' : '');

// Pedras de evolução (nomes de itens da PokéAPI; ícones em sprites/items do repositório da PokéAPI)
export const STONES = ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone', 'shiny-stone', 'dusk-stone', 'dawn-stone', 'ice-stone'];
export const stoneIcon = (n: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${n}.png`;

// Caverna escura (precisa de Flash para enxergar): região entre as trilhas do meio do mapa
export const isDark = (x: number, y: number) => tileAt(x, y) === 'c';
export const MACHINES: Record<string, { label: string; hm: boolean }> = {
  'rock-tomb': { label: 'MT39', hm: false }, // MT some ao ser usada
  flash: { label: 'MO05', hm: true },        // MO nunca é consumida
};
