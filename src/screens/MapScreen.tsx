import React, { memo, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { alertBox } from '../utils/alert';
import { Button, Text } from 'react-native-paper';
import { useGame } from '../store/GameContext';
import { BLOCKED, isDark, tileAt, tileColor, tileEmoji } from '../data/world';

const VW = 9, VH = 11;
const Tile = memo(({ t, size, dark }: { t: string; size: number; dark: boolean }) => (
  <View style={{ width: size, height: size, backgroundColor: dark ? '#000' : tileColor(t), alignItems: 'center', justifyContent: 'center' }}>
    {!dark && <Text style={{ fontSize: size * 0.55 }}>{tileEmoji(t)}</Text>}</View>));

export default function MapScreen({ navigation }: any) {
  const { team, pos, setPos, badges, bag, healAll } = useGame();
  const { width, height } = useWindowDimensions();
  const [lit, setLit] = useState(false); // Flash ativo na caverna atual
  const size = Math.max(24, Math.floor(Math.min(Math.min(width, 960) / VW, (height - 230) / VH, 72)));
  const focused = useIsFocused();
  const focusRef = useRef(true); focusRef.current = focused;
  const stepRef = useRef<(dx: number, dy: number) => void>(() => {});
  useEffect(() => { // web: setas do teclado e WASD
    if (Platform.OS !== 'web') return;
    const keys: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const h = (e: any) => { const k = keys[e.key]; if (k && focusRef.current) { e.preventDefault(); stepRef.current(k[0], k[1]); } };
    (globalThis as any).addEventListener('keydown', h);
    return () => (globalThis as any).removeEventListener('keydown', h);
  }, []);
  useEffect(() => { if (!team.length) navigation.replace('Starter'); }, [team.length]);
  if (!team.length) return null;

  const step = (dx: number, dy: number) => {
    const x = pos.x + dx, y = pos.y + dy, t = tileAt(x, y);
    if (BLOCKED.has(t)) return;
    setPos({ x, y });
    if (lit && !isDark(x, y)) setLit(false);
    if ((t === 'g' && Math.random() < 0.18) || (t === 'c' && Math.random() < 0.12)) navigation.navigate('Battle');
    else if (t === 'C') { healAll(); alertBox('Centro Pokémon', 'Sua equipe foi totalmente curada!'); }
    else if (/[1-8]/.test(t)) navigation.navigate('Gym', { gym: Number(t) - 1 });
  };
  stepRef.current = step;
  const flash = () => {
    if (!badges.includes(0)) return alertBox('Flash', 'Você precisa da Insígnia Pedra (Boulder) para usar Flash fora de batalha.');
    if (!team.some(m => m.moves?.includes('flash'))) return alertBox('Flash', 'Nenhum Pokémon da equipe conhece Flash. Ensine a MO05 na tela Equipe.');
    setLit(true); alertBox('Flash', 'A caverna foi iluminada!');
  };
  const rows = [];
  for (let dy = -5; dy <= 5; dy++) {
    const cells = [];
    for (let dx = -4; dx <= 4; dx++) {
      const x = pos.x + dx, y = pos.y + dy;
      cells.push(<Tile key={dx} t={tileAt(x, y)} size={size} dark={!lit && isDark(x, y) && Math.max(Math.abs(dx), Math.abs(dy)) > 1} />);
    }
    rows.push(<View key={dy} style={{ flexDirection: 'row' }}>{cells}</View>);
  }
  const Pad = ({ l, dx, dy }: { l: string; dx: number; dy: number }) => (
    <Pressable onPress={() => step(dx, dy)} style={s.pad}><Text style={{ fontSize: 26, color: '#fff' }}>{l}</Text></Pressable>);
  return (
    <View style={s.root}>
      <View style={s.bar}>
        <Text style={s.info}>🏅 {badges.length}/8  🧪 {bag.potions}  ⚪ {bag.balls}  💎 {Object.values(bag.stones ?? {}).reduce((a, b) => a + b, 0)}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Button compact textColor="#fff" onPress={() => navigation.navigate('Pokedex')}>Pokédex</Button>
          <Button compact textColor="#fff" onPress={() => navigation.navigate('Team')}>Equipe</Button>
          <Button compact textColor="#fff" onPress={() => navigation.navigate('Settings')}>Config</Button></View></View>
      <View style={{ width: size * VW, height: size * VH }}>{rows}
        <Image source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${team[0].id}.png` }}
          style={{ position: 'absolute', width: size, height: size, left: size * 4, top: size * 5 }} /></View>
      {isDark(pos.x, pos.y) && !lit && <Button mode="contained-tonal" style={{ marginTop: 8 }} onPress={flash}>🔦 Usar Flash</Button>}
      {Platform.OS === 'web' && <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Use as setas ou WASD para andar</Text>}
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Pad l="▲" dx={0} dy={-1} />
        <View style={{ flexDirection: 'row' }}><Pad l="◀" dx={-1} dy={0} /><Pad l="▼" dx={0} dy={1} /><Pad l="▶" dx={1} dy={0} /></View></View>
    </View>);
}
const s = StyleSheet.create({ root: { flex: 1, backgroundColor: '#1d1d1d', alignItems: 'center' },
  bar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingTop: Platform.OS === 'web' ? 8 : 30 },
  info: { color: '#fff', fontSize: 12 }, pad: { width: 60, height: 60, margin: 3, borderRadius: 14, backgroundColor: '#E3350D', alignItems: 'center', justifyContent: 'center' } });
