import { fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ledger, LedgerSnapshot, RecordInput, RecordRow } from '@/db/ledger';
import { PreferencesProvider } from '@/features/preferences/provider';
import { LedgerProvider, useLedger } from '@/features/ledger/provider';
import EntryScreen from '@/features/ledger/entry-screen';
import TransactionsScreen from '@/features/ledger/transactions-screen';
import HomeScreen from '@/features/ledger/home-screen';
import { localDay, monthSummary } from '@/features/ledger/model';

jest.mock('@/db/open', () => ({ openLedger: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'request-test' }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useNavigation: () => ({ dispatch: jest.fn() }) }));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn(), useHeaderHeight: () => 0 }));
jest.mock('@expo/ui/community/datetime-picker', () => ({ DateTimePicker: () => null }));
jest.mock('@expo/ui', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Picker = Object.assign((props: object) => React.createElement(View, props), { Item: () => null });
  return { Host: View, Picker };
});

function fakeLedger() {
  let state: LedgerSnapshot = {
    accounts: [{ id: 'default-cash', name: 'Cash', kind: 'cash', currency: 'TRY' }],
    categories: [{ id: 'default-general', name: 'General', kind: 'expense' }, { id: 'default-salary', name: 'Salary', kind: 'income' }], records: [],
  };
  const api = {
    bootstrap: jest.fn().mockResolvedValue(undefined), close: jest.fn().mockResolvedValue(undefined),
    snapshot: jest.fn(async () => ({ ...state, records: [...state.records] })),
    post: jest.fn(async (input: RecordInput): Promise<RecordRow> => {
      const row: RecordRow = { id: input.id, kind: input.kind, account_id: input.accountId, currency: input.amount.currency, minor: input.amount.minor,
        category_id: input.kind === 'expense' || input.kind === 'income' ? input.categoryId : null, target_id: null, target_currency: null, target_minor: null,
        occurred_on: input.occurredOn, created_at: new Date().toISOString(), note: input.note, source: input.source, voided: 0 };
      state = { ...state, records: [row, ...state.records] };
      return row;
    }),
    voidRecord: jest.fn(async (id: string) => { state = { ...state, records: state.records.filter(row => row.id !== id) }; }),
  };
  return { api, open: jest.fn(async () => api as unknown as Ledger) };
}

beforeEach(() => { jest.clearAllMocks(); jest.mocked(AsyncStorage.getItem).mockResolvedValue(null); });
async function mountEntry(fake = fakeLedger()) {
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Tutar')).toBeTruthy());
  return fake;
}

test('valid expense saves exact amount and undo removes it', async () => {
  const { api } = await mountEntry();
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '12,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(api.post).toHaveBeenCalledWith(expect.objectContaining({ amount: { minor: 1250, currency: 'TRY' }, accountId: 'default-cash', categoryId: 'default-general', occurredOn: localDay(), kind: 'expense' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Geri al' }));
  await waitFor(() => expect(api.voidRecord).toHaveBeenCalledWith('request-test'));
  await waitFor(() => expect(screen.queryByText('İşlem kaydedildi')).toBeNull());
});

test('invalid amount stays in form and never reaches storage', async () => {
  const { api } = await mountEntry();
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '1,234');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByDisplayValue('1,234')).toBeTruthy();
});

test('failed save preserves draft and retries with the same request id', async () => {
  const fake = fakeLedger();
  fake.api.post.mockRejectedValueOnce(new Error('failure'));
  await mountEntry(fake);
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '42');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('42')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(fake.api.post.mock.calls[0][0]).toEqual(fake.api.post.mock.calls[1][0]);
});

test('pending save blocks repeated taps', async () => {
  const fake = fakeLedger();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const original = fake.api.post.getMockImplementation()!;
  fake.api.post.mockImplementationOnce(async input => { await pending; return original(input); });
  await mountEntry(fake);
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '20');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydediliyor…' }));
  expect(fake.api.post).toHaveBeenCalledTimes(1);
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
});

test('income selection changes category before saving', async () => {
  const { api } = await mountEntry();
  await fireEvent.press(screen.getByText('Gelir'));
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '100');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(expect.objectContaining({ kind: 'income', categoryId: 'default-salary' })));
});

test('failed undo keeps the action available for retry', async () => {
  const { api } = await mountEntry();
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '20');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  api.voidRecord.mockRejectedValueOnce(new Error('failed'));
  await fireEvent.press(screen.getByRole('button', { name: 'Geri al' }));
  await waitFor(() => expect(screen.getByText('İşlem geri alınamadı. Tekrar dene.')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Geri al' }));
  await waitFor(() => expect(screen.queryByText('İşlem kaydedildi')).toBeNull());
  expect(api.voidRecord).toHaveBeenCalledTimes(2);
});

test('transaction filter displays only the selected kind', async () => {
  const fake = fakeLedger();
  const base = { accountId: 'default-cash', amount: { minor: 100, currency: 'TRY' as const }, occurredOn: localDay(), source: 'manual' as const };
  await fake.api.post({ ...base, id: 'expense', kind: 'expense', categoryId: 'default-general', note: 'Expense example' });
  await fake.api.post({ ...base, id: 'income', kind: 'income', categoryId: 'default-salary', note: 'Income example' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransactionsScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Expense example')).toBeTruthy());
  await fireEvent.press(screen.getByText('Gelir'));
  expect(screen.queryByText('Expense example')).toBeNull();
  expect(screen.getByText('Income example')).toBeTruthy();
});

test('English dark-mode form parses decimal point', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Amount')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Amount'), '10.25');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(fake.api.post).toHaveBeenCalledWith(expect.objectContaining({ amount: { minor: 1025, currency: 'TRY' } })));
});

test('initial open failure offers retry without showing a false empty state', async () => {
  const fake = fakeLedger();
  fake.open.mockRejectedValueOnce(new Error('failed'));
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransactionsScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Veriler güncellenemedi. Yeniden dene.')).toBeTruthy());
  expect(screen.queryByText('Henüz bir işlem yok')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
  await waitFor(() => expect(screen.getByText('Henüz bir işlem yok')).toBeTruthy());
  expect(fake.api.bootstrap).toHaveBeenCalledTimes(1);
});

test('post-commit refresh failure still reports saved and keeps undo', async () => {
  const fake = await mountEntry();
  fake.api.snapshot.mockRejectedValueOnce(new Error('read failure'));
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '20');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(screen.getByText('Veriler güncellenemedi. Yeniden dene.')).toBeTruthy();
  expect(fake.api.post).toHaveBeenCalledTimes(1);
});

test('bootstrap failure closes connection and allows retry', async () => {
  const fake = fakeLedger();
  fake.api.bootstrap.mockRejectedValueOnce(new Error('failure'));
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransactionsScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(fake.api.close).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
  await waitFor(() => expect(screen.getByText('Henüz bir işlem yok')).toBeTruthy());
});

test('provider closes a connection which finishes opening after unmount', async () => {
  const fake = fakeLedger();
  let resolve!: (ledger: Ledger) => void;
  const open = () => new Promise<Ledger>(done => { resolve = done; });
  const view = await render(<LedgerProvider open={open}><Text>child</Text></LedgerProvider>);
  await view.unmount();
  await act(async () => { resolve(fake.api as unknown as Ledger); });
  expect(fake.api.close).toHaveBeenCalledTimes(1);
  expect(fake.api.bootstrap).not.toHaveBeenCalled();
});

function RefreshProbe() {
  const { refresh, snapshot, error } = useLedger();
  return <><Text>{snapshot ? 'loaded' : 'not-loaded'}</Text><Text>{error ? 'error' : 'ok'}</Text><Pressable accessibilityRole="button" accessibilityLabel="refresh" onPress={() => { void refresh(); }} /></>;
}
test('refresh failure retains the loaded snapshot', async () => {
  const fake = fakeLedger();
  await render(<LedgerProvider open={fake.open}><RefreshProbe /></LedgerProvider>);
  await waitFor(() => expect(screen.getByText('loaded')).toBeTruthy());
  fake.api.snapshot.mockRejectedValueOnce(new Error('failed'));
  await fireEvent.press(screen.getByRole('button', { name: 'refresh' }));
  await waitFor(() => expect(screen.getByText('error')).toBeTruthy());
  expect(screen.getByText('loaded')).toBeTruthy();
});

test('month summary keeps currencies separate and excludes transfers and other months', async () => {
  const fake = fakeLedger();
  await fake.api.post({ id: 'a', kind: 'expense', categoryId: 'default-general', accountId: 'default-cash', amount: { minor: 1250, currency: 'TRY' }, occurredOn: '2026-10-01', source: 'manual', note: '' });
  const snapshot = await fake.api.snapshot();
  snapshot.records.push({ ...snapshot.records[0], id: 'b', kind: 'transfer', minor: 10000 });
  snapshot.records.push({ ...snapshot.records[0], id: 'c', occurred_on: '2026-09-30' });
  snapshot.accounts.push({ id: 'usd', name: 'USD', kind: 'bank', currency: 'USD' });
  snapshot.records.push({ ...snapshot.records[0], id: 'd', currency: 'USD', account_id: 'usd', minor: 100 });
  expect(monthSummary(snapshot, 'tr', '2026-10-31')).toEqual([
    { currency: 'TRY', income: '0,00 TRY', expense: '12,50 TRY', expenseValue: '12,50', net: '-12,50 TRY' },
    { currency: 'USD', income: '0,00 USD', expense: '1,00 USD', expenseValue: '1,00', net: '-1,00 USD' },
  ]);
});

test('home shows real monthly expense and net with the entry action', async () => {
  const fake = fakeLedger();
  await fake.api.post({ id: 'a', kind: 'expense', categoryId: 'default-general', accountId: 'default-cash',
    amount: { minor: 12500, currency: 'TRY' }, occurredOn: localDay(), source: 'manual', note: '' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><HomeScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('125,00')).toBeTruthy());
  expect(screen.getByText('-125,00 TRY')).toBeTruthy();
  expect(screen.getByText('Aylık fark')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'İşlem ekle' })).toBeEnabled();
  expect(screen.queryByText('Parana daha yakından bak.')).toBeNull();
});
