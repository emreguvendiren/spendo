import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { palettes, radius } from './tokens';
export function paperTheme(dark: boolean): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  const colors = palettes[dark ? 'dark' : 'light'];
  return { ...base, roundness: radius.sm, colors: { ...base.colors,
    primary: colors.accent, onPrimary: colors.onAccent, primaryContainer: colors.tint, onPrimaryContainer: colors.accent,
    secondaryContainer: colors.tint, onSecondaryContainer: colors.accent,
    background: colors.background, surface: colors.surface, onSurface: colors.text, onBackground: colors.text,
    surfaceVariant: colors.background, onSurfaceVariant: colors.muted, outline: colors.separator, outlineVariant: colors.separator,
    error: colors.expense, errorContainer: colors.expenseTint, onErrorContainer: colors.expense,
    elevation: { ...base.colors.elevation, level0: 'transparent', level1: colors.surface, level2: colors.surface },
  } };
}
