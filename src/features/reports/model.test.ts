import { LedgerSnapshot, RecordRow } from '@/db/ledger';
import { money } from '@/domain/money';
import { monthlyReport, moveMonth, reportCurrencies } from './model';

function row(overrides: Partial<RecordRow> = {}): RecordRow {
  return { id: 'expense', kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 10000, category_id: 'food', target_id: null, target_currency: null, target_minor: null, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', note: '', source: 'manual', voided: 0, ...overrides };
}
function data(records: RecordRow[]): LedgerSnapshot {
  return { accounts: [{ id: 'cash', name: 'Cash', kind: 'cash', currency: 'TRY', archived: 1 }], categories: [{ id: 'food', name: 'Food', kind: 'expense', archived: 1 }], records };
}

test('month navigation handles year changes, leap months and supported year boundaries', () => {
  expect(moveMonth('2026-01', -1)).toBe('2025-12');
  expect(moveMonth('2026-12', 1)).toBe('2027-01');
  expect(moveMonth('2024-02', 1)).toBe('2024-03');
  expect(moveMonth('0001-01', -1)).toBe('0001-01');
  expect(moveMonth('9999-12', 1)).toBe('9999-12');
  for (const invalid of ['0000-01', '2026-00', '2026-13', '2026-1', 'bad']) expect(() => moveMonth(invalid, 1)).toThrow('report.month');
});
test('report keeps currencies and months separate and excludes opening, transfer and voided rows', () => {
  const snapshot = data([
    row(), row({ id: 'income', kind: 'income', minor: 20000 }), row({ id: 'usd', currency: 'USD', minor: 500 }),
    row({ id: 'last', occurred_on: '2026-09-30' }), row({ id: 'opening', kind: 'opening', minor: 100000 }),
    row({ id: 'transfer', kind: 'transfer', minor: 99900 }), row({ id: 'deleted', voided: 1, minor: 90000 }),
  ]);
  expect(monthlyReport(snapshot, '2026-10', 'TRY')).toMatchObject({ income: money(20000, 'TRY'), expense: money(10000, 'TRY'), net: money(10000, 'TRY'), count: 2 });
  expect(monthlyReport(snapshot, '2026-10', 'USD')).toMatchObject({ income: money(0, 'USD'), expense: money(500, 'USD'), net: money(-500, 'USD'), count: 1 });
  expect(monthlyReport(snapshot, '2026-09', 'TRY').expense.minor).toBe(10000);
  expect(reportCurrencies(snapshot)).toEqual(['TRY', 'USD']);
});
test('category distribution includes archived history, aggregates and sorts descending with deterministic ties', () => {
  const report = monthlyReport(data([row({ minor: 200 }), row({ id: 'second', minor: 100 }), row({ id: 'third', minor: 100, category_id: 'travel' }), row({ id: 'fourth', minor: 100, category_id: 'bills' })]), '2026-10', 'TRY');
  expect(report.categories).toEqual([
    { categoryId: 'food', amount: money(300, 'TRY'), count: 2, percent: 60 },
    { categoryId: 'bills', amount: money(100, 'TRY'), count: 1, percent: 20 },
    { categoryId: 'travel', amount: money(100, 'TRY'), count: 1, percent: 20 },
  ]);
});
test('empty and income-only months return zeros and no category bars', () => {
  expect(monthlyReport(data([]), '2026-10', 'TRY')).toEqual({ income: money(0, 'TRY'), expense: money(0, 'TRY'), net: money(0, 'TRY'), count: 0, categories: [] });
  expect(monthlyReport(data([row({ kind: 'income' })]), '2026-10', 'TRY').categories).toEqual([]);
});
test('safe-limit amounts and rounded percentages remain exact, unsafe totals are rejected', () => {
  const report = monthlyReport(data([row({ minor: Number.MAX_SAFE_INTEGER - 1 }), row({ id: 'small', minor: 1, category_id: 'other' })]), '2026-10', 'TRY');
  expect(report.expense.minor).toBe(Number.MAX_SAFE_INTEGER);
  expect(report.categories.map(item => item.percent)).toEqual([100, 0]);
  expect(() => monthlyReport(data([row({ minor: Number.MAX_SAFE_INTEGER }), row({ id: 'over', minor: 1 })]), '2026-10', 'TRY')).toThrow('money.range');
});
