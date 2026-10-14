import { MD3DarkTheme, MD3LightTheme, MD3Theme } from 'react-native-paper';
import { fontFaces, palettes, radius } from './tokens';
import type { FontFaces } from './fonts';
export function paperTheme(dark: boolean, faces: FontFaces = fontFaces): MD3Theme {
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  const colors = palettes[dark ? 'dark' : 'light'];
  const fonts = { ...base.fonts };
  fonts.default = { ...fonts.default, ...faces.regular };
  for (const key of Object.keys(fonts).filter(key => key !== 'default') as Exclude<keyof typeof fonts, 'default'>[]) {
    const face = key.startsWith('headline') || key.startsWith('display') ? faces.semibold : key.startsWith('title') || key.startsWith('label') ? faces.medium : faces.regular;
    fonts[key] = { ...fonts[key], ...face };
  }
  return { ...base, fonts, roundness: radius.sm, colors: { ...base.colors,
    primary: colors.accent, onPrimary: colors.onAccent, primaryContainer: colors.tint, onPrimaryContainer: colors.accent,
    secondaryContainer: colors.tint, onSecondaryContainer: colors.accent,
    background: colors.background, surface: colors.surface, onSurface: colors.text, onBackground: colors.text,
    surfaceVariant: colors.background, onSurfaceVariant: colors.muted, outline: colors.muted, outlineVariant: colors.separator,
    error: colors.expense, errorContainer: colors.expenseTint, onErrorContainer: colors.expense,
    elevation: { ...base.colors.elevation, level0: 'transparent', level1: colors.surface, level2: colors.surface },
  } };
}
