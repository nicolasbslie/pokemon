import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, View, useWindowDimensions } from 'react-native';
import { Chip, Searchbar } from 'react-native-paper';
import { ErrorMessage, Loading, PokemonCard } from '../components/Common';
import { friendlyError, getGenerations, getPokemonIndex, getTypes, idsByGeneration, idsByType } from '../services/pokeApi';
import { cap } from '../utils/typeColors';

const PAGE = 30;
export default function PokedexScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const cols = Math.max(2, Math.min(6, Math.floor(Math.min(width, 960) / 160)));
  const [all, setAll] = useState<{ id: number; name: string }[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [gens, setGens] = useState<string[]>([]);
  const [q, setQ] = useState(''); const [type, setType] = useState<string | null>(null); const [gen, setGen] = useState<string | null>(null);
  const [typeIds, setTypeIds] = useState<Set<number> | null>(null); const [genIds, setGenIds] = useState<Set<number> | null>(null);
  const [shown, setShown] = useState(PAGE); const [err, setErr] = useState<string | null>(null); const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [a, t, g] = await Promise.all([getPokemonIndex(), getTypes(), getGenerations()]);
      setAll(a); setTypes(t.map(x => x.name)); setGens(g.map(x => x.name));
    } catch (e) { setErr(friendlyError(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setShown(PAGE); type ? idsByType(type).then(setTypeIds).catch(e => setErr(friendlyError(e))) : setTypeIds(null); }, [type]);
  useEffect(() => { setShown(PAGE); gen ? idsByGeneration(gen).then(setGenIds).catch(e => setErr(friendlyError(e))) : setGenIds(null); }, [gen]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter(p => (!t || p.name.includes(t) || String(p.id) === t) && (!type || typeIds?.has(p.id)) && (!gen || genIds?.has(p.id)));
  }, [all, q, type, gen, typeIds, genIds]);

  if (loading) return <Loading label="Carregando Pokédex..." />;
  if (err) return <ErrorMessage message={err} onRetry={load} />;
  const chips = (items: string[], sel: string | null, set: (v: string | null) => void, fmt: (s: string) => string) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, paddingHorizontal: 8, marginBottom: 4 }}>
      {items.map(i => <Chip key={i} selected={sel === i} onPress={() => set(sel === i ? null : i)} style={{ marginRight: 6 }}>{fmt(i)}</Chip>)}
    </ScrollView>);
  return (
    <View style={{ flex: 1 }}>
      <Searchbar placeholder="Buscar nome ou número" value={q} onChangeText={t => { setQ(t); setShown(PAGE); }} style={{ margin: 8 }} />
      {chips(types, type, setType, cap)}
      {chips(gens, gen, setGen, g => g.replace('generation-', 'Gen ').toUpperCase())}
      <FlatList data={list.slice(0, shown)} keyExtractor={p => String(p.id)} key={cols} numColumns={cols} contentContainerStyle={{ padding: 6 }}
        renderItem={({ item }) => <PokemonCard cols={cols} id={item.id} name={item.name} onPress={() => navigation.navigate('Details', { id: item.id })} />}
        onEndReached={() => setShown(n => n + PAGE)} onEndReachedThreshold={0.5} initialNumToRender={10} windowSize={7}
        ListEmptyComponent={<ErrorMessage message="Nenhum Pokémon encontrado com esses filtros." />} />
    </View>
  );
}
