import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomBar, BottomBarProps } from '@/features/navigation/bottom-bar';
import { PreferencesProvider } from '@/features/preferences/provider';
import { bottomBar, palettes } from '@/theme/tokens';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

function props() {
  const routes = ['index', 'transactions', 'reports', 'assistant'].map(name => ({ name, key: name }));
  const titles = ['Ana Sayfa', 'İşlemler', 'Raporlar', 'Asistan'];
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();
  const barProps = {
    state: { routes, index: 1 }, insets: { bottom: 34, top: 0, left: 0, right: 0 },
    descriptors: Object.fromEntries(routes.map((route, index) => [route.key, { options: { title: titles[index] } }])),
    navigation: { emit, navigate },
  } as unknown as BottomBarProps;
  return { barProps, emit, navigate };
}
beforeEach(() => { jest.clearAllMocks(); jest.mocked(AsyncStorage.getItem).mockResolvedValue(null); });

test('add sits after Transactions and pushes the existing entry screen without switching tabs', async () => {
  const { barProps, navigate, emit } = props();
  await render(<PreferencesProvider><BottomBar {...barProps} /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'İşlem ekle' })).toBeTruthy());
  expect(screen.getAllByRole('button').map(button => button.props.accessibilityLabel)).toEqual(['Ana Sayfa', 'İşlemler', 'İşlem ekle', 'Raporlar', 'Asistan']);
  await fireEvent.press(screen.getByRole('button', { name: 'İşlem ekle' }));
  expect(mockPush).toHaveBeenCalledWith('/entry');
  expect(navigate).not.toHaveBeenCalled();
  expect(emit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'İşlemler' }).props.accessibilityState.selected).toBe(true);
});

test('tabs keep selected state, navigation events, preventDefault and long press', async () => {
  const { barProps, navigate, emit } = props();
  await render(<PreferencesProvider><BottomBar {...barProps} /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Raporlar')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Raporlar' }));
  expect(navigate).toHaveBeenCalledWith('reports', undefined);
  emit.mockReturnValueOnce({ defaultPrevented: true });
  await fireEvent.press(screen.getByRole('button', { name: 'Asistan' }));
  await fireEvent.press(screen.getByRole('button', { name: 'İşlemler' }));
  expect(navigate).toHaveBeenCalledTimes(1);
  await fireEvent(screen.getByRole('button', { name: 'İşlemler' }), 'longPress');
  expect(emit).toHaveBeenLastCalledWith({ type: 'tabLongPress', target: 'transactions' });
});

test('English dark action has an accessible label and uses central theme dimensions', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  const { barProps } = props();
  await render(<PreferencesProvider><BottomBar {...barProps} /></PreferencesProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add transaction' })).toBeTruthy());
  const button = screen.getByRole('button', { name: 'Add transaction' });
  expect(button).toHaveStyle({ width: bottomBar.actionSize, height: bottomBar.actionSize, backgroundColor: palettes.dark.accent });
  expect(bottomBar.actionSize).toBeGreaterThanOrEqual(48);
});
