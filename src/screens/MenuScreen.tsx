import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
export default function MenuScreen({ navigation }: any) {
  return (<View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
    {[['Pokédex', 'Pokedex'], ['Minha Equipe', 'Team'], ['Batalha', 'Battle'], ['Configurações', 'Settings']].map(([l, r]) =>
      <Button key={r} mode="contained" style={{ marginVertical: 6 }} onPress={() => navigation.navigate(r)}>{l}</Button>)}</View>);
}
