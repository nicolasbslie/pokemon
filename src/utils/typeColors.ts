export const TYPE_COLORS: Record<string, string> = {
  fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030', psychic: '#F85888',
  dark: '#705848', ghost: '#705898', dragon: '#7038F8', ice: '#98D8D8', fighting: '#C03028',
  ground: '#E0C068', rock: '#B8A038', flying: '#A890F0', bug: '#A8B820', poison: '#A040A0',
  steel: '#B8B8D0', fairy: '#EE99AC', normal: '#A8A878',
};
export const typeColor = (t: string) => TYPE_COLORS[t] ?? '#888';
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
