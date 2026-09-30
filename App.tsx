import React from 'react';
import { View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider } from './src/store/GameContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider><PaperProvider><GameProvider>
      <View style={{ flex: 1, backgroundColor: '#14141f', alignItems: 'center' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 960, backgroundColor: '#f2f2f2' }}><AppNavigator /></View>
      </View>
    </GameProvider></PaperProvider></SafeAreaProvider>
  );
}
