export interface Settings { music: boolean; sfx: boolean; volume: number; animations: boolean }
export interface TeamMember { id: number; name: string; level: number; exp: number; hp: number | null; maxHp: number | null; moves?: string[] }
export interface Bag { potions: number; balls: number; stones?: Record<string, number>; machines?: Record<string, number> }
export interface NamedRef { name: string; url: string }
export interface PokemonData {
  id: number; name: string; height: number; weight: number; base_experience: number | null; cries?: { latest?: string };
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string } }[];
  moves: { move: { name: string }; version_group_details: { level_learned_at: number; move_learn_method: { name: string } }[] }[];
  sprites: { front_default: string | null; back_default: string | null };
}
export interface MoveInfo {
  name: string; power: number | null; accuracy: number | null; pp: number;
  type: { name: string }; damage_class: { name: string };
  effect_entries: { short_effect: string; language: { name: string } }[];
}
export type RootStack = {
  Home: undefined; Menu: undefined; Pokedex: undefined; Details: { id: number }; Team: undefined;
  Starter: undefined; Map: undefined; Gym: { gym: number }; Battle: { gym?: number } | undefined; Settings: undefined;
  Result: { win: boolean; xp: number; badge?: string; caught?: string; rewards?: string[] };
};
