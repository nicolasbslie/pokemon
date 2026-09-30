import { Audio } from 'expo-av';
import { Settings } from '../types';

// Música e SFX locais: coloque arquivos em src/assets/ e aponte aqui, ex.:
// const MUSIC: number | null = require('../assets/music.mp3');
export type SfxName = 'select' | 'attack' | 'hit' | 'super' | 'weak' | 'win' | 'lose' | 'enter';
const MUSIC: number | null = null;
const SFX: Partial<Record<SfxName, number>> = {
  // select: require('../assets/sfx/select.mp3'),
};
let settings: Settings = { music: true, sfx: true, volume: 0.7, animations: true };
let music: Audio.Sound | null = null;
const safe = async (fn: () => Promise<unknown>) => { try { await fn(); } catch { /* áudio nunca quebra o jogo */ } };
const once = async (source: any, volume: number) => {
  const { sound } = await Audio.Sound.createAsync(source, { volume, shouldPlay: true });
  sound.setOnPlaybackStatusUpdate(st => { if (st.isLoaded && st.didJustFinish) sound.unloadAsync(); });
};
export function applySettings(s: Settings) {
  settings = s;
  safe(async () => {
    if (!MUSIC) return;
    if (!music && s.music) music = (await Audio.Sound.createAsync(MUSIC, { isLooping: true })).sound;
    if (music) { await music.setVolumeAsync(s.volume * 0.5); s.music ? await music.playAsync() : await music.pauseAsync(); }
  });
}
export const playCry = (url?: string) => safe(async () => { if (url && settings.sfx) await once({ uri: url }, settings.volume); });
export const playSfx = (n: SfxName) => safe(async () => { const src = SFX[n]; if (src && settings.sfx) await once(src, settings.volume); });
