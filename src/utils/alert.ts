import { Alert, Platform } from 'react-native';

type Btn = { text?: string; style?: string; onPress?: () => void };
/** Substituto do Alert.alert que também funciona na web (onde o Alert do React Native não faz nada). */
export function alertBox(title: string, message?: string, buttons?: Btn[]) {
  if (Platform.OS !== 'web') { Alert.alert(title, message, buttons as any); return; }
  const w: any = globalThis, text = message ? `${title}\n\n${message}` : title;
  const action = buttons?.find(b => b.onPress);
  if (action) { if (w.confirm(text)) action.onPress!(); } else w.alert(text);
}
