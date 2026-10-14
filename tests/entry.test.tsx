import { fireEvent, render, screen, waitFor, act } from '@testing-library/react-native';
import { Alert, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Category, Ledger, LedgerError, LedgerSnapshot, RecordInput, RecordRow } from '@/db/ledger';
import { Money } from '@/domain/money';
import { PreferencesProvider } from '@/features/preferences/provider';
import { LedgerProvider, useLedger } from '@/features/ledger/provider';
import EntryScreen from '@/features/ledger/entry-screen';
import TransactionsScreen from '@/features/ledger/transactions-screen';
import HomeScreen from '@/features/ledger/home-screen';
import AccountScreen from '@/features/ledger/account-screen';
import AccountsScreen from '@/features/ledger/accounts-screen';
import CategoryScreen from '@/features/ledger/category-screen';
import CategoriesScreen from '@/features/ledger/categories-screen';
import TransferScreen from '@/features/ledger/transfer-screen';
import OpeningScreen from '@/features/ledger/opening-screen';
import { localDay, monthSummary } from '@/features/ledger/model';
import { useRouter } from 'expo-router';

jest.mock('@/db/open', () => ({ openLedger: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'request-test' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })), useNavigation: () => ({ dispatch: jest.fn() }) }));
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
        category_id: input.kind === 'expense' || input.kind === 'income' ? input.categoryId : null, target_id: input.kind === 'transfer' ? input.targetId : null, target_currency: input.kind === 'transfer' ? input.targetAmount.currency : null, target_minor: input.kind === 'transfer' ? input.targetAmount.minor : null,
        occurred_on: input.occurredOn, created_at: new Date().toISOString(), note: input.note, source: input.source, voided: 0 };
      state = { ...state, records: [row, ...state.records] };
      return row;
    }),
    voidRecord: jest.fn(async (id: string) => { state = { ...state, records: state.records.filter(row => row.id !== id) }; }),
    update: jest.fn(async (input: RecordInput, expected: RecordRow): Promise<RecordRow> => {
      const row = { ...expected, kind: input.kind, minor: input.amount.minor, currency: input.amount.currency, account_id: input.accountId,
        category_id: input.kind === 'income' || input.kind === 'expense' ? input.categoryId : null, occurred_on: input.occurredOn, note: input.note };
      state = { ...state, records: state.records.map(item => item.id === input.id ? row : item) };
      return row;
    }),
    updateTransfer: jest.fn(async (input: Extract<RecordInput, { kind: 'transfer' }>, expected: RecordRow): Promise<RecordRow> => {
      const row = { ...expected, account_id: input.accountId, currency: input.amount.currency, minor: input.amount.minor, target_id: input.targetId, target_currency: input.targetAmount.currency, target_minor: input.targetAmount.minor, occurred_on: input.occurredOn, note: input.note };
      state = { ...state, records: state.records.map(item => item.id === input.id ? row : item) };
      return row;
    }),
    createAccountWithOpening: jest.fn(async (account: Account, amount: Money, day: string): Promise<void> => {
      state = { ...state, accounts: [...state.accounts, account], records: [...state.records, {
        id: `opening-${account.id}`, kind: 'opening', account_id: account.id, currency: amount.currency, minor: amount.minor,
        occurred_on: day, created_at: new Date().toISOString(), category_id: null, target_id: null, target_currency: null, target_minor: null, note: '', source: 'manual', voided: 0,
      }] };
    }),
    setOpening: jest.fn(async (input: Extract<RecordInput, { kind: 'opening' }>, expected: RecordRow | null): Promise<RecordRow> => {
      const row: RecordRow = { ...(expected ?? { created_at: new Date().toISOString(), category_id: null, target_id: null, target_currency: null, target_minor: null, voided: 0 }), id: input.id, kind: 'opening', account_id: input.accountId, currency: input.amount.currency, minor: input.amount.minor, occurred_on: input.occurredOn, note: input.note, source: input.source };
      state = { ...state, records: [...state.records.filter(item => item.id !== row.id), row] };
      return row;
    }),
    renameAccount: jest.fn(async (id: string, name: string, expectedName: string): Promise<void> => {
      state = { ...state, accounts: state.accounts.map(account => account.id === id && account.name === expectedName ? { ...account, name } : account) };
    }),
    createCategory: jest.fn(async (category: Category): Promise<void> => { state = { ...state, categories: [...state.categories, category] }; }),
    renameCategory: jest.fn(async (id: string, name: string, expectedName: string): Promise<void> => { state = { ...state, categories: state.categories.map(category => category.id === id && category.name === expectedName ? { ...category, name } : category) }; }),
    setAccountArchived: jest.fn(async (id: string, archived: boolean): Promise<void> => { state = { ...state, accounts: state.accounts.map(account => account.id === id ? { ...account, archived: archived ? 1 : 0 } : account) }; }),
    setCategoryArchived: jest.fn(async (id: string, archived: boolean): Promise<void> => { state = { ...state, categories: state.categories.map(category => category.id === id ? { ...category, archived: archived ? 1 : 0 } : category) }; }),
  };
  return { api, open: jest.fn(async () => api as unknown as Ledger) };
}

beforeEach(() => { jest.clearAllMocks(); jest.mocked(AsyncStorage.getItem).mockResolvedValue(null); });
async function mountEntry(fake = fakeLedger()) {
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Tutar')).toBeTruthy());
  return fake;
}

test('account details opens correction and blocks leaving a dirty name for another form', async () => {
  const push = jest.fn(); jest.mocked(useRouter).mockReturnValue({ push, replace: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><AccountScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Başlangıç bakiyesini düzelt' })).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Başlangıç bakiyesini düzelt' }));
  expect(push).toHaveBeenCalledWith({ pathname: '/opening', params: { id: 'default-cash' } });
  await fireEvent.changeText(screen.getByLabelText('Hesap adı'), 'New name');
  expect(screen.getByRole('button', { name: 'Başlangıç bakiyesini düzelt' })).toBeDisabled();
});

test('opening correction preloads signed amount and preserves id, date, source and note', async () => {
  const fake = fakeLedger();
  const old = await fake.api.post({ id: 'old-opening', kind: 'opening', accountId: 'default-cash', amount: { minor: -123456, currency: 'TRY' }, occurredOn: '2026-09-01', note: 'Imported', source: 'import' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByDisplayValue('-1234,56')).toBeTruthy());
  expect(screen.getByText('Tarih · 2026-09-01')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Başlangıç bakiyesi kaydedildi')).toBeTruthy());
  expect(fake.api.setOpening).toHaveBeenCalledWith({ id: old.id, kind: 'opening', accountId: old.account_id, amount: { minor: 0, currency: 'TRY' }, occurredOn: old.occurred_on, note: old.note, source: old.source }, old);
  expect(screen.queryByRole('button', { name: 'Geri al' })).toBeNull();
  expect((await fake.api.snapshot()).records).toHaveLength(1);
});

test('missing opening rejects invalid input and preserves a failed signed draft for identical retry', async () => {
  const fake = fakeLedger();
  fake.api.setOpening.mockRejectedValueOnce(new Error('write'));
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Başlangıç bakiyesi')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '1,234');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(fake.api.setOpening).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '-250,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('-250,50')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Başlangıç bakiyesi kaydedildi')).toBeTruthy());
  expect(fake.api.setOpening.mock.calls[0]).toEqual(fake.api.setOpening.mock.calls[1]);
  expect(fake.api.setOpening).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'request-test', amount: { minor: -25050, currency: 'TRY' }, occurredOn: localDay() }), null);
});

test('opening correction keeps conflicting draft and missing account never becomes a new form', async () => {
  const fake = fakeLedger(); fake.api.setOpening.mockRejectedValueOnce(new LedgerError('conflict'));
  const view = await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Başlangıç bakiyesi')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '10');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Bu kayıt değişmiş veya silinmiş. Bilgilerin korunuyor; listeden güncel kaydı yeniden aç.')).toBeTruthy());
  expect(screen.getByDisplayValue('10')).toBeTruthy();
  await view.unmount();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="missing" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.queryByLabelText('Başlangıç bakiyesi')).toBeNull());
  expect(screen.queryByRole('button', { name: 'Kaydet' })).toBeNull();
});

test('opening correction English dark pending guard and committed refresh failure', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ language: 'en', theme: 'dark' }));
  const fake = fakeLedger();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const save = fake.api.setOpening.getMockImplementation()!;
  fake.api.setOpening.mockImplementationOnce(async (input, expected) => { await pending; return save(input, expected); });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Opening balance')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Opening balance'), '-1,234.56');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Saving…' }));
  expect(fake.api.setOpening).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Opening balance').props.editable).toBe(false);
  fake.api.snapshot.mockRejectedValueOnce(new Error('refresh'));
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('Opening balance saved')).toBeTruthy());
  expect(fake.api.setOpening).toHaveBeenCalledWith(expect.objectContaining({ amount: { minor: -123456, currency: 'TRY' } }), null);
});

test('archived account with no opening requires restore while an existing opening remains editable', async () => {
  const fake = fakeLedger();
  await fake.api.setAccountArchived('default-cash', true);
  const view = await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Başlangıç kaydı oluşturmak için önce hesabı arşivden çıkar.')).toBeTruthy());
  expect(screen.queryByLabelText('Başlangıç bakiyesi')).toBeNull();
  await view.unmount();
  await fake.api.post({ id: 'archived-opening', kind: 'opening', accountId: 'default-cash', amount: { minor: 100, currency: 'TRY' }, occurredOn: localDay(), note: '', source: 'manual' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><OpeningScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByDisplayValue('1,00')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '-2');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Başlangıç bakiyesi kaydedildi')).toBeTruthy());
});

test('valid expense saves exact amount and undo removes it', async () => {
  const { api } = await mountEntry();
  expect(screen.getByText('Örnek veri modu · Bu kayıtlar test içindir.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '12,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(api.post).toHaveBeenCalledWith(expect.objectContaining({ amount: { minor: 1250, currency: 'TRY' }, accountId: 'default-cash', categoryId: 'default-general', occurredOn: localDay(), kind: 'expense' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Geri al' }));
  await waitFor(() => expect(api.voidRecord).toHaveBeenCalledWith('request-test'));
  await waitFor(() => expect(screen.queryByText('İşlem kaydedildi')).toBeNull());
});

test('category form validates name and creates an income category', async () => {
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Kategori adı')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(fake.api.createCategory).not.toHaveBeenCalled();
  expect(screen.getByText('1–80 karakter arasında bir kategori adı gir.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Kategori adı'), ' Ek iş ');
  await fireEvent.press(screen.getByText('Gelir'));
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kategori kaydedildi')).toBeTruthy());
  expect(fake.api.createCategory).toHaveBeenCalledWith({ id: 'request-test', name: 'Ek iş', kind: 'income' });
});

test('failed category write preserves its name and retries the same id', async () => {
  const fake = fakeLedger();
  fake.api.createCategory.mockRejectedValueOnce(new Error('failed'));
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Kategori adı')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Kategori adı'), 'Sağlık');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('Sağlık')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kategori kaydedildi')).toBeTruthy());
  expect(fake.api.createCategory.mock.calls[0]).toEqual(fake.api.createCategory.mock.calls[1]);
});

test('renaming a category preserves type and lists are filtered by income/expense', async () => {
  const fake = fakeLedger();
  const view = await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoryScreen categoryId="default-general" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Kategori adı')).toBeTruthy());
  expect(screen.queryByText('Gelir')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Kategori adı'), 'Günlük');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kategori kaydedildi')).toBeTruthy());
  expect(fake.api.renameCategory).toHaveBeenCalledWith('default-general', 'Günlük', 'General');
  await view.unmount();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoriesScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Günlük')).toBeTruthy());
  await fireEvent.press(screen.getByText('Gelir'));
  expect(screen.queryByText('Günlük')).toBeNull();
  expect(screen.getByText('Salary')).toBeTruthy();
});

test('new category is offered only to matching entry kind', async () => {
  const fake = fakeLedger();
  await fake.api.createCategory({ id: 'health', name: 'Sağlık', kind: 'expense' });
  await mountEntry(fake);
  await fireEvent(screen.getByTestId('entry-category'), 'valueChange', 'health');
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '25');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(fake.api.post).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'health', kind: 'expense' })));
});

test('account archive requires confirmation and retained accounts can be restored', async () => {
  const fake = fakeLedger();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  try {
    const view = await render(<PreferencesProvider><LedgerProvider open={fake.open}><AccountScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Arşivle' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Arşivle' }));
    expect(fake.api.setAccountArchived).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][2]?.[0].style).toBe('cancel');
    await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
    await waitFor(() => expect(screen.getByText('Hesap kaydedildi')).toBeTruthy());
    expect(fake.api.setAccountArchived).toHaveBeenCalledWith('default-cash', true);
    await view.unmount();
    await render(<PreferencesProvider><LedgerProvider open={fake.open}><AccountScreen accountId="default-cash" /></LedgerProvider></PreferencesProvider>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Arşivden çıkar' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Arşivden çıkar' }));
    await waitFor(() => expect(fake.api.setAccountArchived).toHaveBeenLastCalledWith('default-cash', false));
  } finally { alert.mockRestore(); }
});

test('last-active archive rejection preserves the form and its account', async () => {
  const fake = fakeLedger();
  fake.api.setAccountArchived.mockRejectedValueOnce(new LedgerError('last-active'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  try {
    await mountAccount(fake, 'default-cash');
    await fireEvent.press(screen.getByRole('button', { name: 'Arşivle' }));
    await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
    await waitFor(() => expect(screen.getByText('En az bir aktif hesap kalmalı.')).toBeTruthy());
    expect(screen.getByDisplayValue('Nakit')).toBeTruthy();
    expect((await fake.api.snapshot()).accounts[0].archived).toBeUndefined();
  } finally { alert.mockRestore(); }
});

test('archived category is absent from active list and appears in Archive view', async () => {
  const fake = fakeLedger();
  await fake.api.setCategoryArchived('default-general', true);
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoriesScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Bu türde kategori yok.')).toBeTruthy());
  expect(screen.queryByText('General')).toBeNull();
  await fireEvent.press(screen.getByText('Arşiv'));
  expect(screen.getByText('General')).toBeTruthy();
});

test('new entry picks active defaults and historical edit retains its archived references', async () => {
  const fake = fakeLedger();
  const original = await fake.api.post({ id: 'old', kind: 'expense', accountId: 'default-cash', categoryId: 'default-general', amount: { minor: 1250, currency: 'TRY' }, occurredOn: localDay(), source: 'manual', note: '' });
  await fake.api.createAccountWithOpening({ id: 'active-account', name: 'Active', kind: 'bank', currency: 'TRY' }, { minor: 0, currency: 'TRY' }, localDay());
  await fake.api.createCategory({ id: 'active-category', name: 'Active category', kind: 'expense' });
  await fake.api.setAccountArchived('default-cash', true);
  await fake.api.setCategoryArchived('default-general', true);
  const view = await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByTestId('entry-account')).toBeTruthy());
  expect(screen.getByTestId('entry-account').props.selectedValue).toBe('active-account');
  expect(screen.getByTestId('entry-category').props.selectedValue).toBe('active-category');
  await view.unmount();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen recordId="old" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByDisplayValue('12,50')).toBeTruthy());
  expect(screen.getByTestId('entry-account').props.selectedValue).toBe(original.account_id);
  expect(screen.getByTestId('entry-category').props.selectedValue).toBe(original.category_id);
});

test('English dark archived category restores and an unsaved rename disables Archive', async () => {
  const fake = fakeLedger();
  await fake.api.setCategoryArchived('default-general', true);
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoryScreen categoryId="default-general" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Restore' })).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'Restore' }));
  await waitFor(() => expect(screen.getByText('Category saved')).toBeTruthy());
  expect(fake.api.setCategoryArchived).toHaveBeenLastCalledWith('default-general', false);
});

test('English dark category form commits only once and survives a post-commit refresh error', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  const fake = fakeLedger();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const create = fake.api.createCategory.getMockImplementation()!;
  fake.api.createCategory.mockImplementationOnce(async category => { await pending; await create(category); });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><CategoryScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Category name')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Category name'), 'Health');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Saving…' }));
  expect(fake.api.createCategory).toHaveBeenCalledTimes(1);
  fake.api.snapshot.mockRejectedValueOnce(new Error('failed refresh'));
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('Category saved')).toBeTruthy());
  expect(screen.getByText('Could not refresh data. Try again.')).toBeTruthy();
});

async function mountTransfer(currency: 'TRY' | 'USD' = 'TRY') {
  const fake = fakeLedger();
  await fake.api.createAccountWithOpening({ id: 'target', name: 'Target', kind: 'bank', currency }, { minor: 0, currency }, localDay());
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Gönderilen tutar')).toBeTruthy());
  return fake;
}

test('same-currency transfer saves equal legs and undo removes both effects', async () => {
  const { api } = await mountTransfer();
  expect(screen.queryByLabelText('Alınan tutar')).toBeNull();
  // Explicit selection because creating an opening may make its account the recent default.
  await fireEvent(screen.getByTestId('transfer-source'), 'valueChange', 'default-cash');
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'target');
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '200,25');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(api.post).toHaveBeenCalledWith(expect.objectContaining({ kind: 'transfer', accountId: 'default-cash', targetId: 'target', amount: { minor: 20025, currency: 'TRY' }, targetAmount: { minor: 20025, currency: 'TRY' } }));
  const snapshot = await api.snapshot();
  expect(monthSummary(snapshot, 'tr')[0]).toMatchObject({ income: '0,00 TRY', expense: '0,00 TRY', net: '0,00 TRY' });
  await fireEvent.press(screen.getByRole('button', { name: 'Geri al' }));
  await waitFor(() => expect(api.voidRecord).toHaveBeenCalledWith('request-test'));
  expect((await api.snapshot()).records.some(row => row.kind === 'transfer')).toBe(false);
});

test('foreign transfer requires the independently entered destination amount', async () => {
  const { api } = await mountTransfer('USD');
  await fireEvent(screen.getByTestId('transfer-source'), 'valueChange', 'default-cash');
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'target');
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '1000');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(api.post).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Alınan tutar'), '25,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(api.post).toHaveBeenCalledWith(expect.objectContaining({ amount: { minor: 100000, currency: 'TRY' }, targetAmount: { minor: 2550, currency: 'USD' } }));
});

test('self transfer and invalid amounts never reach storage', async () => {
  const { api } = await mountTransfer();
  await fireEvent(screen.getByTestId('transfer-source'), 'valueChange', 'default-cash');
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'default-cash');
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '10');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(screen.getByText('Gönderen ve alan hesap farklı olmalı.')).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'target');
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.getByText('Seçili para birimine uygun, sıfırdan büyük bir tutar gir.')).toBeTruthy();
});

test('failed transfer keeps both amounts and retries the same operation', async () => {
  const { api } = await mountTransfer('USD');
  api.post.mockRejectedValueOnce(new Error('failed'));
  await fireEvent(screen.getByTestId('transfer-source'), 'valueChange', 'default-cash');
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'target');
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '40');
  await fireEvent.changeText(screen.getByLabelText('Alınan tutar'), '1');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('40')).toBeTruthy();
  expect(screen.getByDisplayValue('1')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem kaydedildi')).toBeTruthy());
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
});

test('one-account transfer state offers account management', async () => {
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Transfer için en az iki hesap oluştur.')).toBeTruthy());
  expect(screen.queryByLabelText('Gönderilen tutar')).toBeNull();
  expect(screen.getByRole('button', { name: 'Hesaplar' })).toBeTruthy();
});

test('English dark transfer blocks repeated pending taps and keeps success after refresh failure', async () => {
  const fake = fakeLedger();
  await fake.api.createAccountWithOpening({ id: 'usd', name: 'Dollars', kind: 'bank', currency: 'USD' }, { minor: 0, currency: 'USD' }, localDay());
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Amount sent')).toBeTruthy());
  await fireEvent(screen.getByTestId('transfer-source'), 'valueChange', 'default-cash');
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'usd');
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const post = fake.api.post.getMockImplementation()!;
  fake.api.post.mockImplementationOnce(async input => { await pending; return post(input); });
  await fireEvent.changeText(screen.getByLabelText('Amount sent'), '100.25');
  await fireEvent.changeText(screen.getByLabelText('Amount received'), '2.50');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Saving…' }));
  expect(fake.api.post).toHaveBeenCalledTimes(1);
  fake.api.snapshot.mockRejectedValueOnce(new Error('failed refresh'));
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('Transaction saved')).toBeTruthy());
  expect(screen.getByText('Could not refresh data. Try again.')).toBeTruthy();
});

test('transfer rows show source and destination amounts and accounts together', async () => {
  const fake = fakeLedger();
  const push = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ push, replace: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  await fake.api.createAccountWithOpening({ id: 'usd', name: 'Dollars', kind: 'bank', currency: 'USD' }, { minor: 0, currency: 'USD' }, localDay());
  await fake.api.post({ id: 'fx', kind: 'transfer', accountId: 'default-cash', targetId: 'usd', amount: { minor: 100000, currency: 'TRY' }, targetAmount: { minor: 2500, currency: 'USD' }, occurredOn: localDay(), note: 'Example FX', source: 'manual' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransactionsScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('1.000,00 TRY → 25,00 USD')).toBeTruthy());
  expect(screen.getByText('Transfer · Nakit → Dollars')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: `Transferi düzenle: Example FX, 1.000,00 TRY → 25,00 USD, ${localDay()}` }));
  expect(push).toHaveBeenCalledWith({ pathname: '/transfer', params: { id: 'fx' } });
});

async function mountTransferEdit(archived = false) {
  const fake = fakeLedger();
  await fake.api.createAccountWithOpening({ id: 'target', name: 'Dollars', kind: 'bank', currency: 'USD' }, { minor: 0, currency: 'USD' }, localDay());
  await fake.api.createAccountWithOpening({ id: 'card', name: 'Card', kind: 'credit', currency: 'TRY' }, { minor: 0, currency: 'TRY' }, localDay());
  const original = await fake.api.post({ id: 'existing-transfer', kind: 'transfer', accountId: 'default-cash', targetId: 'target', amount: { minor: 100000, currency: 'TRY' }, targetAmount: { minor: 2500, currency: 'USD' }, occurredOn: '2026-09-30', note: 'Original transfer', source: 'import' });
  if (archived) await fake.api.setAccountArchived('target', true);
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferScreen recordId={original.id} /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Gönderilen tutar')).toBeTruthy());
  return { ...fake, original };
}

test('transfer edit preloads exact values and updates the same record preserving source', async () => {
  const { api, original } = await mountTransferEdit();
  expect(screen.getByDisplayValue('1000,00')).toBeTruthy();
  expect(screen.getByDisplayValue('25,00')).toBeTruthy();
  expect(screen.getByDisplayValue('Original transfer')).toBeTruthy();
  expect(screen.getByLabelText('Tarih: 2026-09-30')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '2000,25');
  await fireEvent.changeText(screen.getByLabelText('Alınan tutar'), '50,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem güncellendi')).toBeTruthy());
  expect(api.updateTransfer).toHaveBeenCalledWith(expect.objectContaining({ id: original.id, kind: 'transfer', amount: { minor: 200025, currency: 'TRY' }, targetAmount: { minor: 5050, currency: 'USD' }, source: 'import' }), original);
  expect(api.update).not.toHaveBeenCalled();
  expect(api.post).toHaveBeenCalledTimes(1); // Fixture only.
});

test('transfer edit keeps drafts on failure and reports conflict without losing values', async () => {
  const { api } = await mountTransferEdit();
  api.updateTransfer.mockRejectedValueOnce(new Error('failed')).mockRejectedValueOnce(new LedgerError('conflict'));
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '42');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('42')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Bu kayıt değişmiş veya silinmiş. Bilgilerin korunuyor; listeden güncel kaydı yeniden aç.')).toBeTruthy());
  expect(screen.getByDisplayValue('42')).toBeTruthy();
  expect(api.updateTransfer.mock.calls[0]).toEqual(api.updateTransfer.mock.calls[1]);
});

test('old transfer with an archived destination remains editable', async () => {
  const { api, original } = await mountTransferEdit(true);
  expect(screen.getByTestId('transfer-target').props.selectedValue).toBe('target');
  await fireEvent.changeText(screen.getByLabelText('Alınan tutar'), '26');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem güncellendi')).toBeTruthy());
  expect(api.updateTransfer).toHaveBeenCalledWith(expect.objectContaining({ targetId: 'target', targetAmount: { minor: 2600, currency: 'USD' } }), original);
});

test('FX edit can switch to same currency and mirrors the source amount', async () => {
  const { api } = await mountTransferEdit();
  await fireEvent(screen.getByTestId('transfer-target'), 'valueChange', 'card');
  expect(screen.queryByLabelText('Alınan tutar')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '1234,56');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem güncellendi')).toBeTruthy());
  expect(api.updateTransfer).toHaveBeenCalledWith(expect.objectContaining({ targetId: 'card', amount: { minor: 123456, currency: 'TRY' }, targetAmount: { minor: 123456, currency: 'TRY' } }), expect.anything());
});

test('English dark transfer edit locks duplicate save/delete and reports committed refresh failure as success', async () => {
  const fake = fakeLedger();
  await fake.api.createAccountWithOpening({ id: 'usd', name: 'USD', kind: 'bank', currency: 'USD' }, { minor: 0, currency: 'USD' }, localDay());
  await fake.api.post({ id: 'old', kind: 'transfer', accountId: 'default-cash', targetId: 'usd', amount: { minor: 100025, currency: 'TRY' }, targetAmount: { minor: 2500, currency: 'USD' }, occurredOn: '2026-09-30', source: 'manual', note: '' });
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferScreen recordId="old" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByDisplayValue('1000.25')).toBeTruthy());
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const update = fake.api.updateTransfer.getMockImplementation()!;
  fake.api.updateTransfer.mockImplementationOnce(async (input, expected) => { await pending; return update(input, expected); });
  await fireEvent.changeText(screen.getByLabelText('Amount sent'), '2000.50');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Saving…' }));
  expect(fake.api.updateTransfer).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Delete transaction' })).toBeDisabled();
  fake.api.snapshot.mockRejectedValueOnce(new Error('failed refresh'));
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('Transaction updated')).toBeTruthy());
  expect(screen.getByText('Could not refresh data. Try again.')).toBeTruthy();
});

test('transfer delete is confirmed, keeps the draft on failure and removes the record on retry', async () => {
  const { api, original } = await mountTransferEdit();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  try {
    await fireEvent.press(screen.getByRole('button', { name: 'İşlemi sil' }));
    expect(api.voidRecord).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][1]).toBe('Bu transferin iki hesap üzerindeki etkisi birlikte kaldırılacak. Bu silme işlemi geri alınamaz.');
    expect(alert.mock.calls[0][2]?.[0].style).toBe('cancel');
    api.voidRecord.mockRejectedValueOnce(new Error('failed'));
    await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
    await waitFor(() => expect(screen.getByText('İşlem silinemedi. Tekrar dene.')).toBeTruthy());
    expect(screen.getByDisplayValue('1000,00')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'İşlemi sil' }));
    await act(async () => { alert.mock.calls[1][2]?.[1].onPress?.(); });
    await waitFor(() => expect(screen.getByText('İşlem silindi')).toBeTruthy());
    expect(api.voidRecord).toHaveBeenLastCalledWith(original.id, original);
    expect((await api.snapshot()).records.some(row => row.id === original.id)).toBe(false);
  } finally { alert.mockRestore(); }
});

test('missing transfer edit does not become a new entry form', async () => {
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferScreen recordId="missing" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Transfer bulunamadı veya bu ekranda düzenlenemiyor.')).toBeTruthy());
  expect(screen.queryByLabelText('Gönderilen tutar')).toBeNull();
});

function TransferWithOtherSavedEntry() {
  const { save } = useLedger();
  return <><Pressable accessibilityRole="button" accessibilityLabel="save another" onPress={() => { void save({ id: 'another', kind: 'expense', categoryId: 'default-general', accountId: 'default-cash', amount: { minor: 100, currency: 'TRY' }, occurredOn: localDay(), note: '', source: 'manual' }); }} /><TransferScreen recordId="old" /></>;
}
test('transfer edit success never offers undo for a different recently saved entry', async () => {
  const fake = fakeLedger();
  await fake.api.createAccountWithOpening({ id: 'target', name: 'Target', kind: 'bank', currency: 'TRY' }, { minor: 0, currency: 'TRY' }, localDay());
  await fake.api.post({ id: 'old', kind: 'transfer', accountId: 'default-cash', targetId: 'target', amount: { minor: 2000, currency: 'TRY' }, targetAmount: { minor: 2000, currency: 'TRY' }, occurredOn: localDay(), note: '', source: 'manual' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransferWithOtherSavedEntry /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Gönderilen tutar')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'save another' }));
  await waitFor(() => expect(fake.api.post).toHaveBeenCalledTimes(2));
  await fireEvent.changeText(screen.getByLabelText('Gönderilen tutar'), '25');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem güncellendi')).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Geri al' })).toBeNull();
  expect((await fake.api.snapshot()).records.some(row => row.id === 'another')).toBe(true);
});

async function mountAccount(fake = fakeLedger(), accountId?: string) {
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><AccountScreen accountId={accountId} /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Hesap adı')).toBeTruthy());
  return fake;
}

test('new account validates name and saves a signed opening without creating an income', async () => {
  const { api } = await mountAccount();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(api.createAccountWithOpening).not.toHaveBeenCalled();
  expect(screen.getByText('1–80 karakter arasında bir hesap adı gir.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Hesap adı'), ' Test kartı ');
  await fireEvent(screen.getByTestId('account-kind'), 'valueChange', 'credit');
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '-1250,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Hesap kaydedildi')).toBeTruthy());
  expect(api.createAccountWithOpening).toHaveBeenCalledWith({ id: 'request-test', name: 'Test kartı', kind: 'credit', currency: 'TRY' }, { minor: -125050, currency: 'TRY' }, localDay());
  expect(api.post).not.toHaveBeenCalled();
});

test('failed account creation keeps the draft and retries the same account id', async () => {
  const { api } = await mountAccount();
  api.createAccountWithOpening.mockRejectedValueOnce(new Error('failed'));
  await fireEvent.changeText(screen.getByLabelText('Hesap adı'), 'Test');
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '1,234');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  expect(api.createAccountWithOpening).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Başlangıç bakiyesi'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('Test')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Hesap kaydedildi')).toBeTruthy());
  expect(api.createAccountWithOpening.mock.calls[0]).toEqual(api.createAccountWithOpening.mock.calls[1]);
});

test('pending account creation blocks repeated taps and a failed refresh keeps the successful result', async () => {
  const { api } = await mountAccount();
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const create = api.createAccountWithOpening.getMockImplementation()!;
  api.createAccountWithOpening.mockImplementationOnce(async (account, opening, day) => { await pending; await create(account, opening, day); });
  await fireEvent.changeText(screen.getByLabelText('Hesap adı'), 'Test banka');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydediliyor…' }));
  expect(api.createAccountWithOpening).toHaveBeenCalledTimes(1);
  api.snapshot.mockRejectedValueOnce(new Error('failed refresh'));
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('Hesap kaydedildi')).toBeTruthy());
  expect(screen.getByText('Veriler güncellenemedi. Yeniden dene.')).toBeTruthy();
});

test('rename fixes currency/type and preserves the existing account on submit', async () => {
  const { api } = await mountAccount(undefined, 'default-cash');
  expect(screen.getByDisplayValue('Nakit')).toBeTruthy();
  expect(screen.queryByTestId('account-currency')).toBeNull();
  expect(screen.queryByLabelText('Başlangıç bakiyesi')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Hesap adı'), 'Cüzdan');
  expect(screen.getByRole('button', { name: 'Arşivle' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Hesap kaydedildi')).toBeTruthy());
  expect(api.renameAccount).toHaveBeenCalledWith('default-cash', 'Cüzdan', 'Cash');
  expect(api.createAccountWithOpening).not.toHaveBeenCalled();
});

test('accounts list shows balance and exposes add and rename actions', async () => {
  const fake = fakeLedger();
  await fake.api.post({ id: 'expense', kind: 'expense', accountId: 'default-cash', categoryId: 'default-general', amount: { minor: 1250, currency: 'TRY' }, occurredOn: localDay(), source: 'manual', note: '' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><AccountsScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Nakit · -12,50 TRY')).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Hesap ekle' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Hesap adını düzenle: Nakit, -12,50 TRY' })).toBeTruthy();
});

test('English dark account form selects USD and a precise opening balance', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><AccountScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Account name')).toBeTruthy());
  await fireEvent.changeText(screen.getByLabelText('Account name'), 'Dollar account');
  await fireEvent(screen.getByTestId('account-currency'), 'valueChange', 'USD');
  await fireEvent.changeText(screen.getByLabelText('Opening balance'), '10.25');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(screen.getByText('Account saved')).toBeTruthy());
  expect(fake.api.createAccountWithOpening).toHaveBeenCalledWith(expect.objectContaining({ currency: 'USD' }), { minor: 1025, currency: 'USD' }, localDay());
});

async function mountEdit() {
  const fake = fakeLedger();
  const original = await fake.api.post({ id: 'existing', kind: 'expense', accountId: 'default-cash', categoryId: 'default-general',
    amount: { minor: 1250, currency: 'TRY' }, occurredOn: '2026-09-30', note: 'Original note', source: 'import' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen recordId="existing" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByLabelText('Tutar')).toBeTruthy());
  return { ...fake, original };
}

test('edit preloads exact values and saves one existing record preserving source', async () => {
  const { api, original } = await mountEdit();
  expect(screen.getByDisplayValue('12,50')).toBeTruthy();
  expect(screen.getByDisplayValue('Original note')).toBeTruthy();
  expect(screen.getByLabelText('Tarih: 2026-09-30')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '20,25');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem güncellendi')).toBeTruthy());
  expect(api.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'existing', amount: { minor: 2025, currency: 'TRY' }, source: 'import', occurredOn: '2026-09-30' }), original);
  expect(api.post).toHaveBeenCalledTimes(1); // Fixture only; editing does not create another record.
  expect((await api.snapshot()).records).toHaveLength(1);
});

test('failed edit keeps draft and committed edit survives a refresh error', async () => {
  const { api } = await mountEdit();
  api.update.mockRejectedValueOnce(new Error('failed'));
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '42');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Kayıt kaydedilemedi. Bilgilerin korunuyor; tekrar dene.')).toBeTruthy());
  expect(screen.getByDisplayValue('42')).toBeTruthy();
  api.snapshot.mockRejectedValueOnce(new Error('failed refresh'));
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('İşlem güncellendi')).toBeTruthy());
  expect(screen.getByText('Veriler güncellenemedi. Yeniden dene.')).toBeTruthy();
  expect(api.update.mock.calls[0]).toEqual(api.update.mock.calls[1]);
});

test('edit conflict keeps draft and explains how to reopen the current record', async () => {
  const { api } = await mountEdit();
  api.update.mockRejectedValueOnce(new LedgerError('conflict'));
  await fireEvent.changeText(screen.getByLabelText('Tutar'), '99');
  await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));
  await waitFor(() => expect(screen.getByText('Bu kayıt değişmiş veya silinmiş. Bilgilerin korunuyor; listeden güncel kaydı yeniden aç.')).toBeTruthy());
  expect(screen.getByDisplayValue('99')).toBeTruthy();
});

test('English dark edit preserves exact decimals and blocks a second pending save', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('{"language":"en","theme":"dark"}');
  const fake = fakeLedger();
  await fake.api.post({ id: 'existing', kind: 'expense', accountId: 'default-cash', categoryId: 'default-general', amount: { minor: 1250, currency: 'TRY' }, occurredOn: '2026-09-30', source: 'manual', note: '' });
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen recordId="existing" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByDisplayValue('12.50')).toBeTruthy());
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const update = fake.api.update.getMockImplementation()!;
  fake.api.update.mockImplementationOnce(async (input, original) => { await pending; return update(input, original); });
  await fireEvent.changeText(screen.getByLabelText('Amount'), '10.25');
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('button', { name: 'Delete transaction' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Saving…' }));
  expect(fake.api.update).toHaveBeenCalledTimes(1);
  await act(async () => { release(); });
  await waitFor(() => expect(screen.getByText('Transaction updated')).toBeTruthy());
  expect(fake.api.update).toHaveBeenCalledWith(expect.objectContaining({ amount: { minor: 1025, currency: 'TRY' } }), expect.anything());
});

test('delete requires confirmation, preserves draft on failure and supports retry', async () => {
  const { api, original } = await mountEdit();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  try {
    await fireEvent.press(screen.getByRole('button', { name: 'İşlemi sil' }));
    expect(api.voidRecord).not.toHaveBeenCalled();
    expect(alert.mock.calls[0][2]?.[0].style).toBe('cancel');
    api.voidRecord.mockRejectedValueOnce(new Error('failure'));
    await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
    await waitFor(() => expect(screen.getByText('İşlem silinemedi. Tekrar dene.')).toBeTruthy());
    expect(screen.getByDisplayValue('12,50')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'İşlemi sil' }));
    await act(async () => { alert.mock.calls[1][2]?.[1].onPress?.(); });
    await waitFor(() => expect(screen.getByText('İşlem silindi')).toBeTruthy());
    expect(api.voidRecord).toHaveBeenLastCalledWith('existing', original);
    expect((await api.snapshot()).records).toEqual([]);
  } finally { alert.mockRestore(); }
});

test('missing edit target never becomes a new entry form', async () => {
  const fake = fakeLedger();
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><EntryScreen recordId="missing" /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Bu kayıt bulunamadı veya bu ekranda düzenlenemiyor.')).toBeTruthy());
  expect(screen.queryByLabelText('Tutar')).toBeNull();
});

test('transaction row opens the edit route with its id', async () => {
  const fake = fakeLedger();
  await fake.api.post({ id: 'existing', kind: 'expense', accountId: 'default-cash', categoryId: 'default-general', amount: { minor: 1250, currency: 'TRY' }, occurredOn: '2026-09-30', source: 'manual', note: 'Tap me' });
  const push = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ push, replace: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  await render(<PreferencesProvider><LedgerProvider open={fake.open}><TransactionsScreen /></LedgerProvider></PreferencesProvider>);
  await waitFor(() => expect(screen.getByText('Tap me')).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: 'İşlemi düzenle: Tap me, 12,50 TRY, 2026-09-30' }));
  expect(push).toHaveBeenCalledWith({ pathname: '/entry', params: { id: 'existing' } });
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
  expect(screen.getByText('Sample data mode · These entries are for testing.')).toBeTruthy();
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
