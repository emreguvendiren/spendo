import { LedgerSnapshot, RecordRow } from '@/db/ledger';
import { budgetOverview } from './model';
const record = (overrides: Partial<RecordRow> = {}): RecordRow => ({ id: 'cost', kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 25000, category_id: 'food', target_id: null, target_currency: null, target_minor: null, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', source: 'manual', note: '', voided: 0, ...overrides });
const snapshot: LedgerSnapshot = { accounts: [], categories: [], records: [record()], budgets: [{ month: '2026-10', currency: 'TRY', category_id: 'food', minor: 100000 }] };
test('budget sums selected category and currency expenses across accounts', () => {
  const data = { ...snapshot, records: [record(), record({ id: 'bank', account_id: 'bank' }), record({ id: 'usd', currency: 'USD' }), record({ id: 'past', occurred_on: '2026-09-30' }), record({ id: 'income', kind: 'income' }), record({ id: 'void', voided: 1 })] };
  expect(budgetOverview(data, '2026-10', 'TRY')[0]).toMatchObject({ spent: { minor: 50000, currency: 'TRY' }, remaining: { minor: 50000, currency: 'TRY' }, exceeded: false, progress: 0.5 });
  expect(budgetOverview(data, '2026-10', 'USD')).toEqual([]);
  expect(budgetOverview(data, '2026-09', 'TRY')).toEqual([]);
});
test('over budget reports excess and caps visual bar, no expenses leave full limit', () => {
  expect(budgetOverview({ ...snapshot, records: [record({ minor: 125000 })] }, '2026-10', 'TRY')[0]).toMatchObject({ remaining: { minor: -25000, currency: 'TRY' }, available: { minor: 25000, currency: 'TRY' }, exceeded: true, progress: 1 });
  expect(budgetOverview({ ...snapshot, records: [] }, '2026-10', 'TRY')[0].remaining.minor).toBe(100000);
});
test('unconfigured budgets are empty and safe integer limit stays exact', () => {
  expect(budgetOverview({ ...snapshot, budgets: undefined }, '2026-10', 'TRY')).toEqual([]);
  expect(budgetOverview({ ...snapshot, budgets: [{ ...snapshot.budgets![0], minor: Number.MAX_SAFE_INTEGER }], records: [record({ minor: Number.MAX_SAFE_INTEGER })] }, '2026-10', 'TRY')[0]).toMatchObject({ remaining: { minor: 0, currency: 'TRY' }, progress: 1 });
});
