import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bag, Settings, TeamMember } from '../types';
import { applySettings } from '../services/audio';
import { START } from '../data/world';

const KEY = 'pokemon-adventure:v2';
const DEF: Settings = { music: true, sfx: true, volume: 0.7, animations: true };
const DEF_BAG: Bag = { potions: 5, balls: 10 };
interface Ctx {
  team: TeamMember[]; settings: Settings; ready: boolean; pos: { x: number; y: number }; badges: number[]; bag: Bag;
  setTeam: (t: TeamMember[]) => void; setBag: (b: Bag) => void; setPos: (p: { x: number; y: number }) => void;
  addBadge: (i: number) => void; healAll: () => void; respawn: () => void;
  addToTeam: (m: { id: number; name: string }) => string | null;
  removeFromTeam: (i: number) => void; setActive: (i: number) => void;
  setSettings: (s: Partial<Settings>) => void; reset: () => void;
}
const C = createContext<Ctx>(null as any);
export const useGame = () => useContext(C);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [settings, setS] = useState<Settings>(DEF);
  const [pos, setPos] = useState(START);
  const [badges, setBadges] = useState<number[]>([]);
  const [bag, setBag] = useState<Bag>(DEF_BAG);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (!raw) return;
      try { const d = JSON.parse(raw); setTeam(d.team ?? []); setS({ ...DEF, ...d.settings }); setPos(d.pos ?? START); setBadges(d.badges ?? []); setBag(d.bag ?? DEF_BAG); } catch {}
    }).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ team, settings, pos, badges, bag })).catch(() => {});
    applySettings(settings);
  }, [team, settings, pos, badges, bag, ready]);

  const value: Ctx = {
    team, settings, ready, pos, badges, bag, setTeam, setBag, setPos,
    addBadge: i => setBadges(b => (b.includes(i) ? b : [...b, i])),
    healAll: () => setTeam(team.map(m => ({ ...m, hp: null }))),
    respawn: () => setPos(START),
    addToTeam: m => {
      if (team.length >= 6) return 'Sua equipe já tem 6 Pokémon.';
      if (team.some(t => t.id === m.id)) return 'Este Pokémon já está na equipe.';
      setTeam([...team, { id: m.id, name: m.name, level: 5, exp: 125, hp: null, maxHp: null }]); return null;
    },
    removeFromTeam: i => setTeam(team.filter((_, k) => k !== i)),
    setActive: i => setTeam([team[i], ...team.filter((_, k) => k !== i)]),
    setSettings: p => setS(s => ({ ...s, ...p })),
    reset: () => { setTeam([]); setS(DEF); setPos(START); setBadges([]); setBag(DEF_BAG); },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
