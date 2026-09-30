import React, { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { artwork } from '../services/pokeApi';
import { cap, typeColor } from '../utils/typeColors';

export const Loading = ({ label = 'Carregando...' }: { label?: string }) => (
  <View style={s.center}><ActivityIndicator size="large" color="#E3350D" /><Text style={{ marginTop: 8 }}>{label}</Text></View>
);
export const ErrorMessage = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <View style={s.center}><Text style={{ textAlign: 'center', marginBottom: 12 }}>{message}</Text>
    {onRetry && <Button mode="contained" onPress={onRetry}>Tentar novamente</Button>}</View>
);
export const PokemonType = ({ type }: { type: string }) => (
  <View style={[s.type, { backgroundColor: typeColor(type) }]}><Text style={s.typeText}>{cap(type)}</Text></View>
);
export const PokemonSprite = ({ id, uri, size = 120 }: { id: number; uri?: string | null; size?: number }) => {
  const [fail, setFail] = useState(false);
  if (fail) return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><Text>?</Text></View>;
  return <Image source={{ uri: uri ?? artwork(id) }} style={{ width: size, height: size }} resizeMode="contain" onError={() => setFail(true)} />;
};
export const HealthBar = ({ hp, max, animate = true }: { hp: number; max: number; animate?: boolean }) => {
  const pct = Math.max(0, hp) / max;
  const w = useRef(new Animated.Value(pct)).current;
  useEffect(() => { animate ? Animated.timing(w, { toValue: pct, duration: 600, useNativeDriver: false }).start() : w.setValue(pct); }, [pct]);
  const color = pct > 0.5 ? '#3DBE4B' : pct > 0.2 ? '#F5C518' : '#E3350D';
  return <View style={s.track}><Animated.View style={{ height: '100%', backgroundColor: color, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /></View>;
};
export const PokemonCard = memo(({ id, name, onPress, cols = 2 }: { id: number; name: string; onPress: () => void; cols?: number }) => (
  <Pressable onPress={onPress} style={[s.card, { maxWidth: `${Math.floor(97 / cols)}%` as `${number}%` }]}>
    <Text style={{ color: '#888' }}>#{String(id).padStart(4, '0')}</Text>
    <PokemonSprite id={id} size={96} /><Text variant="titleSmall">{cap(name)}</Text>
  </Pressable>
));
export const AttackButton = ({ name, type, power, acc, pp, cat, disabled, onPress }: any) => (
  <Pressable disabled={disabled} onPress={onPress} style={[s.atk, { borderColor: typeColor(type), opacity: disabled ? 0.4 : 1 }]}>
    <Text variant="titleSmall">{cap(name)}</Text>
    <Text style={{ fontSize: 11 }}>{cap(type)} · {cap(cat)}</Text>
    <Text style={{ fontSize: 11 }}>Poder {power ?? '—'} · Prec. {acc ?? '—'} · PP {pp}</Text>
  </Pressable>
);
export const FadeIn = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 500, useNativeDriver: true }).start(); }, []);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>{children}</Animated.View>;
};
const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  type: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginRight: 6 },
  typeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  track: { height: 10, backgroundColor: '#ddd', borderRadius: 5, overflow: 'hidden' },
  card: { flex: 1, margin: 6, padding: 10, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', elevation: 2, maxWidth: '47%' },
  atk: { width: '48%', margin: '1%', padding: 8, borderWidth: 2, borderRadius: 10, backgroundColor: '#fff' },
});
