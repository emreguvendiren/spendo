import { EntryTemplate, LedgerSnapshot } from '@/db/ledger';
import { templateRecord, templateUsable } from './model';
const template: EntryTemplate = { id: 'coffee', name: 'Coffee', kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 1250, category_id: 'food', note: 'Morning coffee' };
const snapshot: LedgerSnapshot = { accounts: [{ id: 'cash', name: 'Cash', kind: 'cash', currency: 'TRY' }], categories: [{ id: 'food', name: 'Food', kind: 'expense' }], records: [] };
test('template preset keeps fields and local day without changing records', () => {
  expect(templateRecord(template, '2026-10-14')).toMatchObject({ kind: 'expense', account_id: 'cash', currency: 'TRY', minor: 1250, category_id: 'food', note: 'Morning coffee', occurred_on: '2026-10-14', source: 'manual' });
  expect(snapshot.records).toEqual([]); expect(templateUsable(snapshot, template)).toBe(true);
});
test('archived, deleted and mismatched template references block usage', () => {
  expect(templateUsable({ ...snapshot, accounts: [{ ...snapshot.accounts[0], archived: 1 }] }, template)).toBe(false);
  expect(templateUsable({ ...snapshot, categories: [{ ...snapshot.categories[0], archived: 1 }] }, template)).toBe(false);
  expect(templateUsable(snapshot, { ...template, deleted: 1 })).toBe(false);
  expect(templateUsable(snapshot, { ...template, currency: 'USD' })).toBe(false);
});
