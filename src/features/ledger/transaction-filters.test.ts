import { LedgerSnapshot, RecordRow } from '@/db/ledger';
import { emptyTransactionFilters, filterTransactions, transactionMonths } from './transaction-filters';
function row(overrides: Partial<RecordRow>): RecordRow {
  return { id: 'coffee', kind: 'expense', account_id: 'default-cash', currency: 'TRY', minor: 123456, category_id: 'default-food', target_id: null, target_currency: null, target_minor: null, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', note: 'İSTANBUL kahve', source: 'manual', voided: 0, ...overrides };
}
const snapshot: LedgerSnapshot = {
  accounts: [{ id: 'default-cash', name: 'Cash', kind: 'cash', currency: 'TRY' }, { id: 'bank', name: 'Örnek Banka', kind: 'bank', currency: 'USD', archived: 1 }],
  categories: [{ id: 'default-food', name: 'food', kind: 'expense', archived: 1 }, { id: 'default-salary', name: 'salary', kind: 'income' }],
  records: [row({}), row({ id: 'past', account_id: 'bank', currency: 'USD', occurred_on: '2026-09-30', note: 'Market' }), row({ id: 'salary', kind: 'income', category_id: 'default-salary', note: '' }), row({ id: 'transfer', kind: 'transfer', category_id: null, target_id: 'bank', target_currency: 'USD', target_minor: 500, note: 'Döviz transferi' }), row({ id: 'voided', voided: 1 })],
};
test('search normalizes Turkish case/diacritics and combines whitespace-separated terms across fields', () => {
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, query: '  istanbul   NAKIT  ' }, 'tr').map(row => row.id)).toEqual(['coffee']);
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, query: 'GELİR maas' }, 'tr').map(row => row.id)).toEqual(['salary']);
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, query: 'istanbul impossible' }, 'tr')).toEqual([]);
});
test('month, category, account and kind are intersected and archived history stays searchable', () => {
  expect(filterTransactions(snapshot, { query: 'market', kind: 'expense', month: '2026-09', accountId: 'bank', categoryId: 'default-food' }, 'tr').map(row => row.id)).toEqual(['past']);
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, month: '2026-10', accountId: 'bank' }, 'tr').map(row => row.id)).toEqual(['transfer']);
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, accountId: 'bank', categoryId: 'default-food', month: '2026-10' }, 'tr')).toEqual([]);
});
test('search supports localized category/account/type labels and grouped or raw amounts in both languages', () => {
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, query: 'yemek 1234,56' }, 'tr').map(row => row.id)).toEqual(['coffee', 'past']);
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, query: 'food cash 1,234.56' }, 'en').map(row => row.id)).toEqual(['coffee']);
  expect(filterTransactions(snapshot, { ...emptyTransactionFilters, query: 'transfer 5,00 USD' }, 'tr').map(row => row.id)).toEqual(['transfer']);
});
test('empty filters preserve live order, exclude voided rows, and never mutate records', () => {
  const before = JSON.stringify(snapshot);
  expect(filterTransactions(snapshot, emptyTransactionFilters, 'tr').map(row => row.id)).toEqual(['coffee', 'past', 'salary', 'transfer']);
  expect(JSON.stringify(snapshot)).toBe(before);
});
test('month options include current empty month and recorded months once in descending order', () => {
  expect(transactionMonths(snapshot, '2027-01')).toEqual(['2027-01', '2026-10', '2026-09']);
  expect(transactionMonths({ ...snapshot, records: [] }, '2026-10')).toEqual(['2026-10']);
});
