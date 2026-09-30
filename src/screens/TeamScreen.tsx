import React, { useState } from 'react';
import { alertBox } from '../utils/alert';
import { FlatList, Image, Modal, Pressable, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { HealthBar, PokemonSprite } from '../components/Common';
import { useGame } from '../store/GameContext';
import { buildFighter, expForLevel, expProgress, statsAt } from '../utils/battle';
import { canLearnByMachine, friendlyError, getPokemon, getStoneEvolution } from '../services/pokeApi';
import { playCry } from '../services/audio';
import { MACHINES, stoneIcon } from '../data/world';
import { cap } from '../utils/typeColors';

type Dlg = { i: number; kind: 'stone' | 'machine' } | { i: number; kind: 'forget'; move: string; moves: string[] } | null;

export default function TeamScreen({ navigation }: any) {
  const { team, setTeam, bag, setBag, setActive, removeFromTeam } = useGame();
  const [dlg, setDlg] = useState<Dlg>(null);
  const stones = Object.entries(bag.stones ?? {}).filter(([, n]) => n > 0);
  const machines = Object.entries(bag.machines ?? {}).filter(([, n]) => n > 0);

  const useStone = async (stone: string) => {
    const i = dlg!.i; setDlg(null); const m = team[i];
    try {
      const evo = await getStoneEvolution(m.id, stone);
      if (!evo) return alertBox('Não surtiu efeito', `${cap(stone)} não afeta ${cap(m.name)}.`);
      const p = await getPokemon(evo.id);
      const s = (n: string) => p.stats.find(x => x.stat.name === n)?.base_stat ?? 50;
      const base = { hp: s('hp'), atk: s('attack'), def: s('defense'), spa: s('special-attack'), spd: s('special-defense'), spe: s('speed') };
      const newMax = statsAt(base, m.level).maxHp, oldMax = m.maxHp ?? newMax, oldHp = m.hp ?? oldMax;
      const hp = Math.min(newMax, Math.max(1, oldHp + newMax - oldMax));
      setTeam(team.map((x, k) => (k === i ? { ...x, id: evo.id, name: evo.name, maxHp: newMax, hp: m.hp === null ? null : hp } : x)));
      setBag({ ...bag, stones: { ...bag.stones, [stone]: (bag.stones?.[stone] ?? 1) - 1 } });
      playCry(p.cries?.latest);
      alertBox('Evolução!', `${cap(m.name)} evoluiu para ${cap(evo.name)}!`);
    } catch (e) { alertBox('Erro', friendlyError(e)); }
  };
  const commit = (i: number, moves: string[], move: string) => {
    setTeam(team.map((x, k) => (k === i ? { ...x, moves } : x)));
    if (!MACHINES[move].hm) setBag({ ...bag, machines: { ...bag.machines, [move]: (bag.machines?.[move] ?? 1) - 1 } });
    setDlg(null); alertBox('Golpe aprendido!', `${cap(team[i].name)} aprendeu ${cap(move)}!`);
  };
  const useMachine = async (move: string) => {
    const i = dlg!.i; setDlg(null); const m = team[i];
    try {
      if (!(await canLearnByMachine(m.id, move))) return alertBox('Incompatível', `${cap(m.name)} não pode aprender ${cap(move)}.`);
      const known = m.moves?.length ? m.moves : (await buildFighter(m.id, m.level, m.hp, undefined, 2)).moves.map(x => x.name);
      if (known.includes(move)) return alertBox('Já sabe', `${cap(m.name)} já conhece ${cap(move)}.`);
      if (known.length < 4) return commit(i, [...known, move], move);
      setDlg({ i, kind: 'forget', move, moves: known });
    } catch (e) { alertBox('Erro', friendlyError(e)); }
  };
  const need = (list: unknown[], msg: string, i: number, kind: 'stone' | 'machine') => list.length ? setDlg({ i, kind }) : alertBox('Sem itens', msg);

  return (<>
    <FlatList data={team} keyExtractor={(m, i) => `${m.id}-${i}`} contentContainerStyle={{ padding: 12 }}
      ListHeaderComponent={<Text variant="titleMedium" style={{ marginBottom: 8 }}>Equipe {team.length}/6 — o primeiro é o ativo</Text>}
      ListEmptyComponent={<Text>Sua equipe está vazia.</Text>}
      renderItem={({ item, index }) => {
        const max = item.maxHp ?? 0, hp = item.hp ?? max;
        return (<Card style={{ marginBottom: 10 }}><Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PokemonSprite id={item.id} size={72} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text variant="titleMedium">{cap(item.name)} {index === 0 ? '★' : ''}</Text>
            <Text>Nv. {item.level} · XP {item.exp - expForLevel(item.level)}/{expForLevel(item.level + 1) - expForLevel(item.level)}</Text>
            <HealthBar hp={max ? hp : 1} max={max || 1} animate={false} />
            <Text style={{ fontSize: 11 }}>{max ? `${hp}/${max} HP` : 'HP cheio'}</Text>
            {!!item.moves?.length && <Text style={{ fontSize: 11 }}>Golpes: {item.moves.map(cap).join(', ')}</Text>}
            <View style={{ height: 6, backgroundColor: '#ddd', borderRadius: 3, marginVertical: 4 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#3B82F6', width: `${expProgress(item.level, item.exp) * 100}%` }} /></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {index > 0 && <Button compact onPress={() => setActive(index)}>Ativar</Button>}
              <Button compact onPress={() => navigation.navigate('Details', { id: item.id })}>Detalhes</Button>
              <Button compact onPress={() => need(stones, 'Ganhe pedras vencendo ginásios ou após batalhas selvagens.', index, 'stone')}>Pedra</Button>
              <Button compact onPress={() => need(machines, 'Ganhe MTs e MOs vencendo ginásios.', index, 'machine')}>MT/MO</Button>
              {team.length > 1 && <Button compact textColor="#E3350D" onPress={() => removeFromTeam(index)}>Soltar</Button>}
            </View></View></Card.Content></Card>);
      }} />
    <Modal transparent animationType="fade" visible={dlg !== null} onRequestClose={() => setDlg(null)}>
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
          {dlg?.kind === 'stone' && <>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Usar qual pedra em {cap(team[dlg.i].name)}?</Text>
            {stones.map(([name, n]) => (
              <Pressable key={name} onPress={() => useStone(name)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                <Image source={{ uri: stoneIcon(name) }} style={{ width: 36, height: 36 }} /><Text style={{ marginLeft: 8 }}>{cap(name)} x{n}</Text></Pressable>))}</>}
          {dlg?.kind === 'machine' && <>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Ensinar qual MT/MO a {cap(team[dlg.i].name)}?</Text>
            {machines.map(([move, n]) => (
              <Pressable key={move} onPress={() => useMachine(move)} style={{ paddingVertical: 8 }}>
                <Text>💿 {MACHINES[move].label} {cap(move)}{MACHINES[move].hm ? '' : ` x${n}`}</Text></Pressable>))}</>}
          {dlg?.kind === 'forget' && <>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>{cap(team[dlg.i].name)} já sabe 4 golpes. Esquecer qual para aprender {cap(dlg.move)}?</Text>
            {dlg.moves.map(mv => <Button key={mv} mode="outlined" style={{ marginVertical: 2 }}
              onPress={() => commit(dlg.i, dlg.moves.map(x => (x === mv ? dlg.move : x)), dlg.move)}>Esquecer {cap(mv)}</Button>)}</>}
          <Button onPress={() => setDlg(null)}>Cancelar</Button></View></View></Modal>
  </>);
}
