import { EntryTemplate, LedgerSnapshot, RecordRow } from '@/db/ledger';
import { homeOverview } from './home-model';
const row = (overrides: Partial<RecordRow> = {}): RecordRow => ({ id: 'expense', kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 12500, category_id: 'food', target_id: null, target_currency: null, target_minor: null, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', source: 'manual', note: '', voided: 0, ...overrides });
const template: EntryTemplate = { id: 'coffee', name: 'Coffee', kind: 'expense', account_id: 'cash', category_id: 'food', minor: 9500, currency: 'TRY', note: '' };
const snapshot: LedgerSnapshot = { accounts: [{ id: 'cash', name: 'Cash', kind: 'cash', currency: 'TRY' }], categories: [{ id: 'food', name: 'Food', kind: 'expense' }], records: [row()] };

test('home selects current month, prioritizes exceeded budgets and keeps currencies separate with three rows', () => {
  const data: LedgerSnapshot = { ...snapshot, budgets: ['food', 'transport', 'other', 'last'].map(category_id => ({ month: '2026-10', currency: 'TRY', category_id, minor: 10000 })), records: [row(), row({ id: 'usd', currency: 'USD', minor: 500 })] };
  data.budgets!.push({ month: '2026-10', currency: 'USD', category_id: 'food', minor: 1000 }, { month: '2026-09', currency: 'TRY', category_id: 'food', minor: 100 });
  const result = homeOverview(data, '2026-10-31');
  expect(result.budgets.items).toHaveLength(3);
  expect(result.budgets.items[0]).toMatchObject({ exceeded: true, available: { minor: 2500, currency: 'TRY' } });
  expect(result.budgets.items[1]).toMatchObject({ spent: { minor: 500, currency: 'USD' }, available: { minor: 500, currency: 'USD' } });
  expect(result.budgets.items.every(item => item.budget.month === '2026-10')).toBe(true);
  expect(homeOverview(data, '2026-11-01').budgets.items).toEqual([]);
});

test('home prioritizes incomplete goals and excludes deleted goals and voided contributions', () => {
  const data: LedgerSnapshot = { ...snapshot, goals: ['done', 'near', 'new', 'deleted'].map(id => ({ id, name: id, target_minor: 10000, currency: 'TRY', deleted: id === 'deleted' ? 1 : 0 })), contributions: ['done', 'near', 'deleted'].map((goal_id, index) => ({ id: goal_id, goal_id, minor: index === 1 ? 7500 : 10000, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', voided: 0 })) };
  data.contributions!.push({ ...data.contributions![0], id: 'void', goal_id: 'new', voided: 1 });
  expect(homeOverview(data, '2026-10-14').goals.items.map(item => [item.goal.id, item.saved.minor])).toEqual([['near', 7500], ['new', 0]]);
});

test('home shows three usable templates in stable name order without mutating snapshot', () => {
  const data = { ...snapshot, templates: ['Z', 'C', 'B', 'A'].map(name => ({ ...template, id: name, name })) };
  data.templates.push({ ...template, id: 'deleted', deleted: 1 }, { ...template, id: 'missing', account_id: 'missing' });
  const before = JSON.stringify(data);
  expect(homeOverview(data, '2026-10-14').templates.map(item => item.name)).toEqual(['A', 'B', 'C']);
  expect(JSON.stringify(data)).toBe(before);
  expect(homeOverview({ ...data, accounts: [{ ...data.accounts[0], archived: 1 }] }, '2026-10-14').templates).toEqual([]);
});

test('budget overflow is isolated from goals and quick entry previews', () => {
  const result = homeOverview({ ...snapshot, records: [row({ minor: Number.MAX_SAFE_INTEGER }), row({ id: 'overflow', minor: 1 })], budgets: [{ month: '2026-10', currency: 'TRY', category_id: 'food', minor: 10000 }], goals: [{ id: 'goal', name: 'Goal', target_minor: 10000, currency: 'TRY' }], templates: [template] }, '2026-10-14');
  expect(result.budgets).toEqual({ items: [], error: true });
  expect(result.goals.items[0].remaining.minor).toBe(10000);
  expect(result.templates).toEqual([template]);
});
