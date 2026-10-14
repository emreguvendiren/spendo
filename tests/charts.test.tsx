import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ledger, LedgerSnapshot, RecordRow } from '@/db/ledger';
import { LedgerProvider } from '@/features/ledger/provider';
import { PreferencesProvider } from '@/features/preferences/provider';
import { CashflowChart } from '@/features/reports/cashflow-chart';
import HomeScreen from '@/features/ledger/home-screen';
import { localDay } from '@/features/ledger/model';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
const row = (overrides: Partial<RecordRow> = {}): RecordRow => ({ id: 'expense', kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 123456, category_id: 'food', target_id: null, target_currency: null, target_minor: null, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', source: 'manual', note: '', voided: 0, ...overrides });
const data: LedgerSnapshot = { accounts: [{ id: 'cash', name: 'Cash', kind: 'cash', currency: 'TRY' }, { id: 'usd', name: 'Dollars', kind: 'bank', currency: 'USD' }], categories: [{ id: 'food', name: 'Food', kind: 'expense' }], records: [row(), row({ id: 'past', minor: 25000, occurred_on: '2026-09-14' })] };
function fixture(snapshot = data) { const post = jest.fn(); const open = async () => ({ bootstrap: async () => {}, close: async () => {}, snapshot: async () => snapshot, post }) as unknown as Ledger; return { open, post }; }
beforeEach(() => { jest.mocked(AsyncStorage.getItem).mockResolvedValue(null); });
test('chart month selection exposes exact localized values and never writes a record', async () => {
  const fake = fixture(); const before = JSON.stringify(data);
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CashflowChart snapshot={data} month="2026-10" currency="TRY" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Gelir: 0,00 TRY · Gider: 1.234,56 TRY')).toBeTruthy());
  const september = screen.getByRole('button', { name: /Eylül 2026, Gelir: 0,00 TRY, Gider: 250,00 TRY/ });
  await fireEvent.press(september);
  expect(september.props.accessibilityState).toEqual({ selected: true });
  expect(screen.getByText('Gelir: 0,00 TRY · Gider: 250,00 TRY')).toBeTruthy();
  expect(fake.post).not.toHaveBeenCalled(); expect(JSON.stringify(data)).toBe(before);
});
test('English dark chart uses grouped amounts and empty history has a clear explanation', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ version: 1, language: 'en', theme: 'dark' }));
  const fake = fixture();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CashflowChart snapshot={data} month="2026-10" currency="TRY" /><CashflowChart snapshot={{ ...data, records: [] }} month="2026-10" currency="USD" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Income: 0.00 TRY · Expenses: 1,234.56 TRY')).toBeTruthy());
  expect(screen.getByText('No income or expenses to chart yet.')).toBeTruthy();
});
test('home switches currency summary and chart while retaining separate budgets and goals', async () => {
  const snapshot = { ...data, records: [row({ occurred_on: localDay() }), row({ id: 'dollar', currency: 'USD', account_id: 'usd', minor: 1599, occurred_on: localDay() })] };
  const fake = fixture(snapshot);
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><HomeScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('1.234,56')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Para birimi: USD' }));
  expect(screen.getByText('15,99')).toBeTruthy();
  expect(screen.queryByText('1.234,56')).toBeNull();
  expect(screen.getByText('Gelir: 0,00 USD · Gider: 15,99 USD')).toBeTruthy();
  expect(fake.post).not.toHaveBeenCalled();
});
