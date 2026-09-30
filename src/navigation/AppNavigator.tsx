import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStack } from '../types';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import PokedexScreen from '../screens/PokedexScreen';
import DetailsScreen from '../screens/DetailsScreen';
import TeamScreen from '../screens/TeamScreen';
import BattleScreen from '../screens/BattleScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MapScreen from '../screens/MapScreen';
import StarterScreen from '../screens/StarterScreen';
import GymScreen from '../screens/GymScreen';
import ResultScreen from '../screens/ResultScreen';

const Stack = createNativeStackNavigator<RootStack>();
export default function AppNavigator() {
  return (<NavigationContainer><Stack.Navigator initialRouteName="Home">
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Starter" component={StarterScreen} options={{ title: 'Inicial', headerBackVisible: false }} />
    <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false, gestureEnabled: false }} />
    <Stack.Screen name="Gym" component={GymScreen} options={{ title: 'Ginásio' }} />
    <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
    <Stack.Screen name="Pokedex" component={PokedexScreen} options={{ title: 'Pokédex' }} />
    <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Detalhes' }} />
    <Stack.Screen name="Team" component={TeamScreen} options={{ title: 'Minha Equipe' }} />
    <Stack.Screen name="Battle" component={BattleScreen} options={{ title: 'Batalha', gestureEnabled: false }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
    <Stack.Screen name="Result" component={ResultScreen} options={{ headerShown: false, gestureEnabled: false }} />
  </Stack.Navigator></NavigationContainer>);
}
