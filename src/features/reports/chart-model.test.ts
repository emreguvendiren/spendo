import { LedgerSnapshot, RecordRow } from '@/db/ledger';
import { cashflowHistory, expenseSlices, visualRatio } from './chart-model';
import { monthlyReport } from './model';
const row = (overrides: Partial<RecordRow> = {}): RecordRow => ({ id: 'expense', kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 25000, category_id: 'food', target_id: null, target_currency: null, target_minor: null, occurred_on: '2026-01-14', created_at: '2026-01-14T09:00:00Z', source: 'manual', note: '', voided: 0, ...overrides });
const snapshot: LedgerSnapshot = { accounts: [], categories: [], records: [] };
test('six-month chart crosses years, fills empty months and excludes transfers, voids and other currencies', () => {
  const points = cashflowHistory({ ...snapshot, records: [row(), row({ id: 'income', kind: 'income', minor: 50000 }), row({ id: 'dec', occurred_on: '2025-12-31' }), row({ id: 'old', occurred_on: '2025-07-31' }), row({ id: 'transfer', kind: 'transfer' }), row({ id: 'void', voided: 1 }), row({ id: 'usd', currency: 'USD' })] }, '2026-01', 'TRY');
  expect(points.map(point => point.month)).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
  expect(points[0].expense.minor).toBe(0);
  expect(points[4].expense.minor).toBe(25000);
  expect(points[5]).toMatchObject({ income: { minor: 50000, currency: 'TRY' }, expense: { minor: 25000, currency: 'TRY' }, incomeRatio: 1, expenseRatio: 0.5 });
});
test('chart ratios remain bounded at safe integer limits and empty history has no fake values', () => {
  expect(visualRatio(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(1);
  expect(visualRatio(0, 0)).toBe(0);
  expect(cashflowHistory(snapshot, '0001-02', 'TRY')).toHaveLength(2);
  expect(cashflowHistory(snapshot, '2026-01', 'TRY').every(point => point.incomeRatio === 0 && point.expenseRatio === 0)).toBe(true);
});
test('donut keeps four categories and combines remaining exact amounts without changing report', () => {
  const report = monthlyReport({ ...snapshot, records: Array.from({ length: 6 }, (_, index) => row({ id: String(index), category_id: String(index), minor: (6 - index) * 100 })) }, '2026-01', 'TRY');
  const before = JSON.stringify(report), slices = expenseSlices(report);
  expect(slices.map(slice => slice.categoryId)).toEqual(['0', '1', '2', '3', '__other__']);
  expect(slices[4].amount).toEqual({ minor: 300, currency: 'TRY' });
  expect(slices.reduce((sum, slice) => sum + slice.amount.minor, 0)).toBe(report.expense.minor);
  expect(JSON.stringify(report)).toBe(before);
  expect(expenseSlices(monthlyReport(snapshot, '2026-01', 'TRY'))).toEqual([]);
});
test('historical overflow is surfaced instead of replaced by zero', () => {
  expect(() => cashflowHistory({ ...snapshot, records: [row({ minor: Number.MAX_SAFE_INTEGER }), row({ id: 'overflow', minor: 1 })] }, '2026-02', 'TRY')).toThrow();
});
