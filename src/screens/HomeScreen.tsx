import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FadeIn } from '../components/Common';
import { playSfx } from '../services/audio';
import { useGame } from '../store/GameContext';

export default function HomeScreen({ navigation }: any) {
  const { team } = useGame();
  const go = (r: string) => { playSfx('select'); navigation.navigate(r); };
  return (
    <View style={s.c}><FadeIn style={{ width: '100%', maxWidth: 420 }}><Text variant="displaySmall" style={s.t}>Pokémon Adventure</Text>
      <Button mode="contained" style={s.b} onPress={() => go(team.length ? 'Map' : 'Starter')}>{team.length ? 'Continuar' : 'Começar Jogo'}</Button>
      <Button mode="contained-tonal" style={s.b} onPress={() => go('Pokedex')}>Pokédex</Button>
      <Button mode="contained-tonal" style={s.b} onPress={() => go('Team')}>Minha Equipe</Button>
      <Button mode="contained-tonal" style={s.b} onPress={() => go('Settings')}>Configurações</Button></FadeIn></View>
  );
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#E3350D' },
  t: { color: '#fff', fontWeight: '900', textAlign: 'center', marginBottom: 32 }, b: { marginVertical: 6 } });
