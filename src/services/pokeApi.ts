import { MoveInfo, NamedRef, PokemonData } from '../types';
const BASE = 'https://pokeapi.co/api/v2';
const cache = new Map<string, Promise<any>>();

async function get<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : BASE + path;
  if (!cache.has(url)) {
    const p = fetch(url).then(r => {
      if (!r.ok) throw new Error(r.status === 404 ? 'NOT_FOUND' : `HTTP_${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url)!;
}

export const idFromUrl = (u: string) => Number(u.split('/').filter(Boolean).pop());
export const artwork = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export function friendlyError(e: unknown): string {
  const m = e instanceof Error ? e.message : '';
  if (m === 'NOT_FOUND') return 'Pokémon não encontrado.';
  if (m.includes('Network') || m.includes('fetch')) return 'Sem conexão com a internet. Verifique sua rede e tente de novo.';
  return 'Não foi possível carregar os dados da PokéAPI. Tente novamente.';
}
/** Índice leve (id + nome) de todos os Pokémon; formas alternativas (id > 10000) ficam de fora. */
export async function getPokemonIndex() {
  const r = await get<{ results: NamedRef[] }>('/pokemon?limit=100000');
  return r.results.map(x => ({ id: idFromUrl(x.url), name: x.name })).filter(x => x.id < 10000);
}
export const getPokemon = (idOrName: number | string) => get<PokemonData>(`/pokemon/${String(idOrName).toLowerCase()}`);
export const getSpecies = (id: number | string) => get<any>(`/pokemon-species/${id}`);
export const getMove = (name: string) => get<MoveInfo>(`/move/${name}`);
export const getType = (name: string) => get<any>(`/type/${name}`);
export const getTypes = async () => (await get<{ results: NamedRef[] }>('/type')).results.filter(t => idFromUrl(t.url) < 10000);
export const getGenerations = async () => (await get<{ results: NamedRef[] }>('/generation')).results;
export const getGeneration = (id: number | string) => get<any>(`/generation/${id}`);
export const getEvolutionChain = (url: string) => get<any>(url);

export async function idsByType(type: string) {
  const t = await getType(type);
  return new Set<number>(t.pokemon.map((p: any) => idFromUrl(p.pokemon.url)));
}
export async function idsByGeneration(gen: string) {
  const g = await getGeneration(gen);
  return new Set<number>(g.pokemon_species.map((s: any) => idFromUrl(s.url)));
}
export function flattenEvolution(node: any, acc: string[] = []): string[] {
  acc.push(node.species.name);
  node.evolves_to.forEach((n: any) => flattenEvolution(n, acc));
  return acc;
}
export const englishText = (entries: any[], key: string) =>
  entries?.find((e: any) => e.language.name === 'en')?.[key]?.replace(/\s+/g, ' ') ?? 'Sem descrição disponível.';

function findNode(node: any, name: string): any | null {
  if (node.species.name === name) return node;
  for (const n of node.evolves_to) { const r = findNode(n, name); if (r) return r; }
  return null;
}
/** Evolução por nível disponível para o Pokémon (via /pokemon-species e /evolution-chain). Ignora itens, troca e locais. */
export async function getEvolutionFor(id: number, level: number): Promise<{ id: number; name: string } | null> {
  const sp = await getSpecies(id);
  const chain = await getEvolutionChain(sp.evolution_chain.url);
  const node = findNode(chain.chain, sp.name);
  if (!node) return null;
  const opts = node.evolves_to.filter((n: any) => n.evolution_details.some((d: any) => {
    const min = d.min_level ?? (d.min_happiness ? 22 : null); // evolução por amizade: aproximada para o nível 22
    return d.trigger?.name === 'level-up' && min !== null && level >= min && !d.item && !d.held_item && !d.location &&
      !d.known_move && !d.known_move_type && !d.party_species && !d.party_type && !d.trade_species;
  }));
  if (!opts.length) return null;
  const pick = opts[Math.floor(Math.random() * opts.length)];
  const p = await getPokemon(idFromUrl(pick.species.url));
  return { id: p.id, name: p.name };
}

/** Evolução por item (trigger "use-item") para a pedra informada, via /evolution-chain. */
export async function getStoneEvolution(id: number, item: string): Promise<{ id: number; name: string } | null> {
  const sp = await getSpecies(id);
  const chain = await getEvolutionChain(sp.evolution_chain.url);
  const node = findNode(chain.chain, sp.name);
  if (!node) return null;
  const opt = node.evolves_to.find((n: any) => n.evolution_details.some((d: any) => d.trigger?.name === 'use-item' && d.item?.name === item));
  if (!opt) return null;
  const p = await getPokemon(idFromUrl(opt.species.url));
  return { id: p.id, name: p.name };
}

/** O Pokémon pode aprender o golpe por MT/MO? (move_learn_method = machine em /pokemon/{id}) */
export async function canLearnByMachine(id: number, move: string) {
  const p = await getPokemon(id);
  return p.moves.some(m => m.move.name === move && m.version_group_details.some(v => v.move_learn_method.name === 'machine'));
}
