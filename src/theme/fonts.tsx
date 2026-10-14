import { createContext, PropsWithChildren, useContext, useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { fontFaces, palettes } from './tokens';

export const fontAssets = {
  'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
};
export type FontFaces = Record<keyof typeof fontFaces, { fontFamily: string; fontWeight: 'normal' | '400' | '500' | '600' }>;
const systemFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
export const fallbackFontFaces: FontFaces = {
  regular: { fontFamily: systemFamily, fontWeight: '400' },
  medium: { fontFamily: systemFamily, fontWeight: '500' },
  semibold: { fontFamily: systemFamily, fontWeight: '600' },
};
const FontContext = createContext<FontFaces>(fontFaces);
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
export function FontsProvider({ children }: PropsWithChildren) {
  const [loaded, error] = useFonts(fontAssets);
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded, error]);
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: palettes.light.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  return <FontContext.Provider value={loaded ? fontFaces : fallbackFontFaces}>{children}</FontContext.Provider>;
}
export function useFontFaces() { return useContext(FontContext); }
