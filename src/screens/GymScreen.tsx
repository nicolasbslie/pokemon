import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { PokemonSprite, PokemonType } from '../components/Common';
import { GYMS, MACHINES } from '../data/world';
import { getPokemonIndex } from '../services/pokeApi';
import { useGame } from '../store/GameContext';
import { cap, typeColor } from '../utils/typeColors';

export default function GymScreen({ navigation, route }: any) {
  const i: number = route.params.gym, gym = GYMS[i];
  const { badges } = useGame();
  const [names, setNames] = useState<Record<number, string>>({});
  useEffect(() => { getPokemonIndex().then(ix => setNames(Object.fromEntries(ix.map(p => [p.id, p.name])))).catch(() => {}); }, []);
  const has = badges.includes(i), blocked = i > 0 && !badges.includes(i - 1);
  return (
    <ScrollView style={{ backgroundColor: typeColor(gym.type) + '33' }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      <Text variant="headlineMedium" style={{ fontWeight: '800' }}>Ginásio de {gym.city}{i === 0 ? ' City' : ''}</Text>
      <Text variant="titleMedium" style={{ marginVertical: 6 }}>Líder {gym.leader}</Text>
      <View style={{ flexDirection: 'row' }}><PokemonType type={gym.type} /></View>
      <Text variant="titleSmall" style={{ marginTop: 16 }}>Equipe do líder</Text>
      <View style={{ flexDirection: 'row' }}>{gym.team.map((t, k) => (
        <View key={k} style={{ alignItems: 'center', margin: 6 }}><PokemonSprite id={t.id} size={84} />
          <Text style={{ fontSize: 12 }}>{cap(names[t.id] ?? '...')}</Text><Text style={{ fontSize: 12 }}>Nv. {t.level}</Text></View>))}</View>
      <Text variant="titleSmall" style={{ marginTop: 16 }}>Recompensas</Text>
      <Text>🏅 Insígnia {gym.badge}</Text>
      {gym.tm && <Text>💿 {MACHINES[gym.tm].label} {cap(gym.tm)}</Text>}
      {gym.hm && <Text>💿 {MACHINES[gym.hm].label} {cap(gym.hm)}</Text>}
      {gym.perk && <Text style={{ textAlign: 'center', marginTop: 8 }}>{gym.perk}</Text>}
      <Button mode="contained" style={{ marginTop: 24 }} disabled={has || blocked} onPress={() => navigation.replace('Battle', { gym: i })}>
        {has ? 'Insígnia já conquistada' : blocked ? `Conquiste antes a insígnia ${GYMS[i - 1].badge}` : 'Desafiar'}</Button>
    </ScrollView>);
}
