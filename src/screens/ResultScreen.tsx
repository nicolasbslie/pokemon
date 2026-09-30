import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { FadeIn } from '../components/Common';
import { cap } from '../utils/typeColors';

export default function ResultScreen({ route, navigation }: any) {
  const { win, xp, badge, caught, rewards } = route.params;
  const lines: string[] = caught ? [`${cap(caught)} foi capturado!`]
    : win ? [`Você ganhou ${xp} XP no total.`, ...(badge ? [`🏅 Insígnia ${badge} conquistada!`] : []), ...(rewards ?? []).map((r: string) => `💿 ${r} recebida!`)]
    : ['Você correu para o Centro Pokémon e curou sua equipe.'];
  return (<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: win ? '#3DBE4B' : '#555' }}><FadeIn>
    <Text variant="displayMedium" style={{ color: '#fff', fontWeight: '900', textAlign: 'center' }}>{win ? 'Vitória!' : 'Derrota'}</Text>
    <View style={{ marginVertical: 12 }}>{lines.map(l => <Text key={l} style={{ color: '#fff', textAlign: 'center' }}>{l}</Text>)}</View>
    <Button mode="contained" onPress={() => navigation.navigate('Map')}>Voltar ao mapa</Button></FadeIn></View>);
}
