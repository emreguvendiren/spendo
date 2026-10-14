import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '@/i18n/messages';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Preferences = { language: Language; theme: ThemeMode };
export const preferencesKey = 'spendo.preferences.v1';
export function parsePreferences(raw: string | null, defaults: Preferences): Preferences {
  if (!raw) return defaults;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return defaults;
    const data = value as Record<string, unknown>;
    return {
      language: data.language === 'tr' || data.language === 'en' ? data.language : defaults.language,
      theme: data.theme === 'system' || data.theme === 'light' || data.theme === 'dark' ? data.theme : defaults.theme,
    };
  } catch { return defaults; }
}
export const preferenceStorage = {
  read: () => AsyncStorage.getItem(preferencesKey),
  write: (preferences: Preferences) => AsyncStorage.setItem(preferencesKey, JSON.stringify(preferences)),
};
