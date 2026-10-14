import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferencesProvider } from '@/features/preferences/provider';
import SettingsScreen from '@/features/preferences/settings-screen';
beforeEach(() => { jest.clearAllMocks(); jest.mocked(AsyncStorage.getItem).mockResolvedValue(null); jest.mocked(AsyncStorage.setItem).mockResolvedValue(); });
test('language changes are persisted and immediately translate the interface', async () => {
  await render(<PreferencesProvider><SettingsScreen /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Görünüm')).toBeTruthy());
  await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  await waitFor(() => expect(screen.getByText('Appearance')).toBeTruthy());
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('spendo.preferences.v1', JSON.stringify({ language: 'en', theme: 'system' }));
});
test('failed persistence keeps the previous language and offers another attempt', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk unavailable'));
  await render(<PreferencesProvider><SettingsScreen /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Görünüm')).toBeTruthy());
  await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  await waitFor(() => expect(screen.getByText('Tercihler kaydedilemedi. Tekrar dene.')).toBeTruthy());
  expect(screen.getByText('Görünüm')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'English' }));
  await waitFor(() => expect(screen.getByText('Appearance')).toBeTruthy());
});
test('stored theme and language are restored on launch', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  await render(<PreferencesProvider><SettingsScreen /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Dark', selected: true })).toBeTruthy());
});
test('theme selection is persisted', async () => {
  await render(<PreferencesProvider><SettingsScreen /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Görünüm')).toBeTruthy());
  await fireEvent.press(screen.getByRole('radio', { name: 'Koyu' }));
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Koyu', selected: true })).toBeTruthy());
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('spendo.preferences.v1', JSON.stringify({ language: 'tr', theme: 'dark' }));
});
test('initial storage failure can be retried without entering an unhydrated screen', async () => {
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('unavailable'));
  await render(<PreferencesProvider><SettingsScreen /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Tercihler yüklenemedi.')).toBeTruthy());
  expect(screen.queryByText('Görünüm')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
  await waitFor(() => expect(screen.getByText('Görünüm')).toBeTruthy());
});
