import { paperTheme } from './paper';
import { fontFaces, palettes, radius } from './tokens';
test.each([false, true])('Paper uses the shared palette (dark=%s)', dark => {
  const theme = paperTheme(dark);
  const colors = palettes[dark ? 'dark' : 'light'];
  expect(theme.dark).toBe(dark);
  expect(theme.colors.primary).toBe(colors.accent);
  expect(theme.colors.onPrimary).toBe(colors.onAccent);
  expect(theme.colors.surface).toBe(colors.surface);
  expect(theme.colors.onSurface).toBe(colors.text);
  expect(theme.colors.background).toBe(colors.background);
  expect(theme.roundness).toBe(radius.sm);
  expect(theme.fonts.bodyLarge).toMatchObject(fontFaces.regular);
  expect(theme.fonts.labelLarge).toMatchObject(fontFaces.medium);
  expect(theme.fonts.headlineLarge).toMatchObject(fontFaces.semibold);
  for (const font of Object.values(theme.fonts)) expect(font.fontWeight).toBe('normal');
});
