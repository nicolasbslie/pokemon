import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ErrorMessage, FadeIn, Loading, PokemonSprite, PokemonType } from '../components/Common';
import { englishText, flattenEvolution, friendlyError, getEvolutionChain, getPokemon, getSpecies } from '../services/pokeApi';
import { playCry } from '../services/audio';
import { useGame } from '../store/GameContext';
import { cap } from '../utils/typeColors';
import { PokemonData } from '../types';

export default function DetailsScreen({ route }: any) {
  const { addToTeam } = useGame();
  const [p, setP] = useState<PokemonData | null>(null);
  const [extra, setExtra] = useState<{ desc: string; gen: string; evo: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null); setP(null);
    try {
      const pk = await getPokemon(route.params.id); setP(pk);
      const sp = await getSpecies(pk.id);
      const evo = await getEvolutionChain(sp.evolution_chain.url);
      setExtra({ desc: englishText(sp.flavor_text_entries, 'flavor_text'), gen: sp.generation.name, evo: flattenEvolution(evo.chain) });
    } catch (e) { setErr(friendlyError(e)); }
  }, [route.params.id]);
  useEffect(() => { load(); }, [load]);
  if (err) return <ErrorMessage message={err} onRetry={load} />;
  if (!p) return <Loading />;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}><FadeIn>
      <View style={{ alignItems: 'center' }}>
        <Text variant="headlineMedium">#{p.id} {cap(p.name)}</Text>
        <PokemonSprite id={p.id} size={220} />
        <View style={{ flexDirection: 'row', marginVertical: 8 }}>{p.types.map(t => <PokemonType key={t.type.name} type={t.type.name} />)}</View>
        <Button icon="volume-high" onPress={() => playCry(p.cries?.latest)}>Ouvir som</Button>
        <Text style={{ textAlign: 'center', marginVertical: 8 }}>{extra?.desc ?? '...'}</Text>
        <Text>Geração: {extra ? extra.gen.replace('generation-', '').toUpperCase() : '...'} · {p.height / 10} m · {p.weight / 10} kg</Text>
        <Text style={{ marginTop: 8 }}>Habilidades: {p.abilities.map(a => cap(a.ability.name)).join(', ')}</Text>
        <Text variant="titleMedium" style={{ marginTop: 12 }}>Estatísticas</Text>
        {p.stats.map(s => <Text key={s.stat.name}>{cap(s.stat.name)}: {s.base_stat}</Text>)}
        <Text variant="titleMedium" style={{ marginTop: 12 }}>Evolução</Text>
        <Text>{extra ? extra.evo.map(cap).join(' → ') : '...'}</Text>
        <Text variant="titleMedium" style={{ marginTop: 12 }}>Ataques ({p.moves.length})</Text>
        <Text style={{ textAlign: 'center' }}>{p.moves.slice(0, 30).map(m => cap(m.move.name)).join(', ')}{p.moves.length > 30 ? '…' : ''}</Text>
      </View></FadeIn></ScrollView>
  );
}
