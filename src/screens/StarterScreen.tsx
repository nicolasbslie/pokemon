import React, { useCallback, useEffect, useState } from 'react';
import { alertBox } from '../utils/alert';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ErrorMessage, Loading, PokemonSprite } from '../components/Common';
import { friendlyError, getPokemonIndex } from '../services/pokeApi';
import { STARTERS } from '../data/world';
import { useGame } from '../store/GameContext';
import { cap } from '../utils/typeColors';

export default function StarterScreen({ navigation }: any) {
  const { team, setTeam } = useGame();
  const [names, setNames] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { const idx = await getPokemonIndex(); setNames(Object.fromEntries(idx.map(p => [p.id, p.name]))); }
    catch (e) { setErr(friendlyError(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (team.length) navigation.replace('Map'); else load(); }, []);
  const pick = (id: number) => {
    const name = names[id] ?? `pokemon-${id}`;
    alertBox(`Escolher ${cap(name)}?`, 'Você só pode escolher um inicial.', [{ text: 'Voltar' },
      { text: 'Escolher', onPress: () => { setTeam([{ id, name, level: 5, exp: 125, hp: null, maxHp: null }]); navigation.replace('Map'); } }]);
  };
  if (loading) return <Loading />;
  if (err) return <ErrorMessage message={err} onRetry={load} />;
  return (
    <FlatList data={STARTERS} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: 8 }}
      ListHeaderComponent={<Text variant="titleMedium" style={{ textAlign: 'center', margin: 8 }}>Escolha seu Pokémon inicial (apenas um)</Text>}
      renderItem={({ item, index }) => (<View style={{ marginBottom: 8 }}>
        <Text style={{ marginLeft: 6, fontWeight: '700' }}>Geração {index + 1}</Text>
        <View style={{ flexDirection: 'row' }}>{item.map(id => (
          <Pressable key={id} onPress={() => pick(id)} style={{ flex: 1, margin: 4, padding: 6, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', elevation: 2 }}>
            <PokemonSprite id={id} size={80} /><Text style={{ fontSize: 12 }}>{cap(names[id] ?? '...')}</Text></Pressable>))}</View></View>)} />
  );
}
