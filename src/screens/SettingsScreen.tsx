import React from 'react';
import { alertBox } from '../utils/alert';
import { View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { useGame } from '../store/GameContext';

export default function SettingsScreen() {
  const { settings: st, setSettings, reset } = useGame();
  const row = (label: string, k: 'music' | 'sfx' | 'animations') => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }}>
      <Text>{label}</Text><Switch value={st[k]} onValueChange={v => setSettings({ [k]: v })} /></View>);
  const vol = (d: number) => setSettings({ volume: Math.min(1, Math.max(0, Math.round((st.volume + d) * 10) / 10)) });
  return (<View style={{ padding: 20 }}>
    {row('Música', 'music')}{row('Efeitos sonoros', 'sfx')}{row('Animações', 'animations')}
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 }}>
      <Text>Volume: {Math.round(st.volume * 100)}%</Text>
      <View style={{ flexDirection: 'row' }}><Button mode="outlined" onPress={() => vol(-0.1)}>−</Button><Button mode="outlined" onPress={() => vol(0.1)}>+</Button></View></View>
    <Button mode="contained" buttonColor="#E3350D" style={{ marginTop: 24 }}
      onPress={() => alertBox('Limpar progresso?', 'Equipe e configurações serão apagadas.', [{ text: 'Cancelar' }, { text: 'Limpar', style: 'destructive', onPress: reset }])}>Limpar progresso</Button></View>);
}
