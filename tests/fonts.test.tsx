import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useFonts } from 'expo-font';
import { hideAsync } from 'expo-splash-screen';
import { FontsProvider, useFontFaces, fallbackFontFaces } from '@/theme/fonts';
import { fontFaces } from '@/theme/tokens';
import { PreferencesProvider } from '@/features/preferences/provider';
import { AppText } from '@/components/app-text';

jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), useFonts: jest.fn() }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn().mockResolvedValue(undefined), hideAsync: jest.fn().mockResolvedValue(undefined) }));
function Probe() {
  const faces = useFontFaces();
  return <Text style={faces.regular}>Ready</Text>;
}
beforeEach(() => { jest.clearAllMocks(); jest.mocked(useFonts).mockReturnValue([true, null]); });

test('startup holds content until local fonts are ready, then hides splash', async () => {
  jest.mocked(useFonts).mockReturnValue([false, null]);
  const view = await render(<FontsProvider><Probe /></FontsProvider>);
  expect(screen.queryByText('Ready')).toBeNull();
  expect(hideAsync).not.toHaveBeenCalled();
  jest.mocked(useFonts).mockReturnValue([true, null]);
  await view.rerender(<FontsProvider><Probe /></FontsProvider>);
  expect(screen.getByText('Ready')).toHaveStyle(fontFaces.regular);
  expect(hideAsync).toHaveBeenCalledTimes(1);
});

test('font failure leaves the app usable with system faces', async () => {
  jest.mocked(useFonts).mockReturnValue([false, new Error('font.load')]);
  await render(<FontsProvider><Probe /></FontsProvider>);
  expect(screen.getByText('Ready')).toHaveStyle(fallbackFontFaces.regular);
  expect(hideAsync).toHaveBeenCalledTimes(1);
});

test('text uses real weight faces, tabular amounts, Turkish glyphs and system text scaling', async () => {
  await render(<FontsProvider><PreferencesProvider><AppText variant="display">1234,50 ₺</AppText><AppText weight="medium">İı Şş Ğğ Çç Öö Üü</AppText></PreferencesProvider></FontsProvider>);
  await waitFor(() => expect(screen.getByText('1234,50 ₺')).toBeTruthy());
  expect(screen.getByText('1234,50 ₺')).toHaveStyle({ ...fontFaces.semibold, fontVariant: ['tabular-nums'] });
  expect(screen.getByText('İı Şş Ğğ Çç Öö Üü')).toHaveStyle(fontFaces.medium);
  expect(screen.getByText('1234,50 ₺').props.allowFontScaling).not.toBe(false);
});
