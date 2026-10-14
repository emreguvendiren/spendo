import { Contribution, Goal, LedgerSnapshot } from '@/db/ledger';
import { goalProgress } from './model';
const goal: Goal = { id: 'holiday', name: 'Holiday', currency: 'TRY', target_minor: 100000 };
const contribution: Contribution = { id: 'one', goal_id: 'holiday', minor: 25000, occurred_on: '2026-10-14', created_at: '2026-10-14T09:00:00Z', voided: 0 };
const snapshot: LedgerSnapshot = { accounts: [], categories: [], records: [], contributions: [contribution] };
test('goal progress tracks only its active contributions and exact remaining', () => {
  const result = goalProgress({ ...snapshot, contributions: [contribution, { ...contribution, id: 'voided', voided: 1 }, { ...contribution, id: 'other', goal_id: 'other' }] }, goal);
  expect(result).toMatchObject({ saved: { minor: 25000, currency: 'TRY' }, remaining: { minor: 75000, currency: 'TRY' }, complete: false, progress: 0.25 });
});
test('completed goals preserve excess savings but cap progress and remaining', () => {
  expect(goalProgress({ ...snapshot, contributions: [{ ...contribution, minor: 120000 }] }, goal)).toMatchObject({ saved: { minor: 120000, currency: 'TRY' }, remaining: { minor: 0, currency: 'TRY' }, complete: true, progress: 1 });
  expect(goalProgress({ ...snapshot, contributions: [] }, goal).saved.minor).toBe(0);
});
