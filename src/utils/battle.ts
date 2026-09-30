import { getMove, getPokemon, getType } from '../services/pokeApi';
import { MoveInfo, PokemonData } from '../types';

export interface Base { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
export interface Learn { name: string; level: number }
export interface Fighter {
  id: number; name: string; level: number; maxHp: number; hp: number; types: string[];
  atk: number; def: number; spa: number; spd: number; spe: number; moves: MoveInfo[];
  base: Base; baseExp: number; learn: Learn[]; front?: string | null; back?: string | null; cry?: string;
}
const calc = (b: number, l: number) => Math.floor((2 * b * l) / 100) + 5;
export const statsAt = (b: Base, l: number) => ({
  maxHp: Math.floor((2 * b.hp * l) / 100) + l + 10, atk: calc(b.atk, l), def: calc(b.def, l),
  spa: calc(b.spa, l), spd: calc(b.spd, l), spe: calc(b.spe, l),
});
export const applyLevel = (f: Fighter, l: number) => Object.assign(f, { level: l }, statsAt(f.base, l));
/** XP total necessário para um nível (curva "medium fast") */
export const expForLevel = (l: number) => l ** 3;
export const expProgress = (level: number, exp: number) =>
  Math.min(1, Math.max(0, (exp - expForLevel(level)) / (expForLevel(level + 1) - expForLevel(level))));

/** Golpes aprendidos por nível (move_learn_method = level-up), da versão de jogo mais recente listada */
export function learnsetOf(p: PokemonData): Learn[] {
  const out: Learn[] = [];
  for (const m of p.moves) {
    const d = m.version_group_details.filter(v => v.move_learn_method.name === 'level-up');
    if (d.length) out.push({ name: m.move.name, level: Math.max(1, d[d.length - 1].level_learned_at) });
  }
  return out;
}
const eligible = (ls: Learn[], level: number) => ls.filter(l => l.level <= level).sort((a, b) => b.level - a.level).map(l => l.name);
const fetchMoves = async (names: string[]) =>
  (await Promise.allSettled(names.map(getMove))).filter((r): r is PromiseFulfilledResult<MoveInfo> => r.status === 'fulfilled').map(r => r.value);

/** moveNames: golpes já conhecidos. Sem eles, pega os `count` golpes mais recentes aprendidos até o nível. */
export async function buildFighter(id: number, level: number, hp: number | null = null, moveNames?: string[], count = 4): Promise<Fighter> {
  const p = await getPokemon(id);
  const s = (n: string) => p.stats.find(x => x.stat.name === n)?.base_stat ?? 50;
  const base: Base = { hp: s('hp'), atk: s('attack'), def: s('defense'), spa: s('special-attack'), spd: s('special-defense'), spe: s('speed') };
  const learn = learnsetOf(p), pool = eligible(learn, level);
  const names = moveNames?.length ? moveNames : (pool.length ? pool : p.moves.map(m => m.move.name).sort(() => Math.random() - 0.5)).slice(0, count);
  let moves = await fetchMoves(names);
  if (!moves.some(m => m.power)) { // garante ao menos um golpe de dano
    const extra = (await fetchMoves(pool.filter(n => !names.includes(n)).slice(0, 6))).find(m => m.power);
    if (extra) moves = [extra, ...moves].slice(0, Math.max(names.length, 1));
  }
  if (!moves.length) moves = [{ name: 'struggle', power: 40, accuracy: 100, pp: 10, type: { name: 'normal' }, damage_class: { name: 'physical' }, effect_entries: [] }];
  const st = statsAt(base, level);
  return {
    id, name: p.name, level, ...st, hp: hp === null ? st.maxHp : Math.min(hp, st.maxHp), types: p.types.map(t => t.type.name),
    moves, base, baseExp: p.base_experience ?? 60, learn, front: p.sprites.front_default, back: p.sprites.back_default ?? p.sprites.front_default, cry: p.cries?.latest,
  };
}
export async function effectiveness(moveType: string, defTypes: string[]) {
  const rel = (await getType(moveType)).damage_relations;
  const has = (l: any[], t: string) => l.some((x: any) => x.name === t);
  return defTypes.reduce((m, t) => m * (has(rel.double_damage_to, t) ? 2 : has(rel.half_damage_to, t) ? 0.5 : has(rel.no_damage_to, t) ? 0 : 1), 1);
}
export function calcDamage(a: Fighter, d: Fighter, m: MoveInfo, eff: number, crit: boolean, atkMult = 1) {
  const phys = m.damage_class.name === 'physical';
  const A = phys ? a.atk * atkMult : a.spa, D = phys ? d.def : d.spd;
  const base = Math.floor(Math.floor(((2 * a.level) / 5 + 2) * (m.power ?? 0) * A / D) / 50) + 2;
  const stab = a.types.includes(m.type.name) ? 1.5 : 1;
  const dmg = Math.floor(base * stab * eff * (crit ? 1.5 : 1) * (0.85 + Math.random() * 0.15));
  return eff === 0 ? 0 : Math.max(1, dmg);
}
