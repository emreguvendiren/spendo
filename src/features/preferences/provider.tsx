import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text, useColorScheme, View } from 'react-native';
import { getLocales } from 'expo-localization';
import { PaperProvider } from 'react-native-paper';
import { paperTheme } from '@/theme/paper';
import { Language, messages, resolveLanguage } from '@/i18n/messages';
import { palettes, AppColors, spacing, layout, typography } from '@/theme/tokens';
import { Preferences, preferenceStorage, parsePreferences } from './storage';
import { useFontFaces } from '@/theme/fonts';

type Context = {
  preferences: Preferences; colors: AppColors; isDark: boolean;
  t: typeof messages[Language]; saving: boolean; saveError: boolean;
  update: (next: Preferences) => Promise<void>;
};
const PreferenceContext = createContext<Context | null>(null);
export function PreferencesProvider({ children }: PropsWithChildren) {
  const faces = useFontFaces();
  const systemTheme = useColorScheme();
  const [defaults] = useState<Preferences>(() => ({ language: resolveLanguage(getLocales()[0]?.languageCode), theme: 'system' }));
  const [preferences, setPreferences] = useState(defaults);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    let active = true;
    preferenceStorage.read().then(raw => {
      if (active) { setPreferences(parsePreferences(raw, defaults)); setStatus('ready'); }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [defaults, attempt]);
  const isDark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemTheme === 'dark');
  const colors = palettes[isDark ? 'dark' : 'light'];
  const t = messages[preferences.language];
  async function update(next: Preferences) {
    if (saving) return;
    setSaving(true); setSaveError(false);
    try { await preferenceStorage.write(next); setPreferences(next); }
    catch { setSaveError(true); }
    finally { setSaving(false); }
  }
  if (status !== 'ready') return (
    <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background }}>
      {status === 'loading' ? <ActivityIndicator accessibilityLabel={t.loading} color={colors.accent} /> : <>
        <Text accessibilityRole="alert" style={{ ...faces.regular, color: colors.text, fontSize: typography.body }}>{t.loadError}</Text>
        <Pressable accessibilityRole="button" onPress={() => { setStatus('loading'); setAttempt(value => value + 1); }} style={{ minHeight: layout.touchTarget, justifyContent: 'center' }}>
          <Text style={{ ...faces.semibold, color: colors.accent, fontSize: typography.body }}>{t.retry}</Text>
        </Pressable>
      </>}
    </View>
  );
  return <PreferenceContext.Provider value={{ preferences, colors, isDark, t, update, saving, saveError }}><PaperProvider theme={paperTheme(isDark, faces)}>{children}</PaperProvider></PreferenceContext.Provider>;
}
export function usePreferences() {
  const context = useContext(PreferenceContext);
  if (!context) throw new Error('PreferencesProvider is required');
  return context;
}
