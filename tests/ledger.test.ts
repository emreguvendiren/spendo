/** @jest-environment node */
/// <reference types="node" />
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { configure, Connection, Database } from '../src/db/connection';
import { migrate } from '../src/db/migrations';
import { Ledger, RecordInput } from '../src/db/ledger';
import { money } from '../src/domain/money';
import { demoData, demoHistory } from '../src/db/demo';
import { ledgerDatabaseName } from '../src/db/environment';
import { accountBalance, parseOpening } from '../src/features/ledger/account-model';
import { defaultAccount, defaultCategory, entityName } from '../src/features/ledger/model';
import { transferInput } from '../src/features/ledger/transfer-model';

function connection(raw: DatabaseSync): Connection {
  return {
    execAsync: async sql => { raw.exec(sql); },
    runAsync: async (sql, params) => raw.prepare(sql).run(...params),
    getAllAsync: async <T,>(sql: string, params: (string | number | null)[]) => raw.prepare(sql).all(...params) as T[],
    closeAsync: async () => { raw.close(); },
  };
}

let raw: DatabaseSync;
let db: Database;
let ledger: Ledger;
beforeEach(async () => {
  raw = new DatabaseSync(':memory:');
  db = await configure(connection(raw));
  await migrate(db);
  ledger = new Ledger(db, () => '2026-10-14T09:00:00.000Z');
  await ledger.createAccount({ id: 'cash', name: 'Nakit', currency: 'TRY', kind: 'cash' });
  await ledger.createAccount({ id: 'card', name: 'Kart', currency: 'TRY', kind: 'credit' });
  await ledger.createAccount({ id: 'usd', name: 'USD', currency: 'USD', kind: 'bank' });
  await ledger.createCategory({ id: 'food', name: 'Yemek', kind: 'expense' });
  await ledger.createCategory({ id: 'salary', name: 'Maaş', kind: 'income' });
});
afterEach(async () => { await ledger.close(); });

function expense(overrides: Partial<RecordInput> = {}): RecordInput {
  return { id: 'expense', kind: 'expense', accountId: 'cash', amount: money(1200, 'TRY'),
    categoryId: 'food', occurredOn: '2026-10-14', note: '', source: 'manual', ...overrides } as RecordInput;
}
function transfer(): Extract<RecordInput, { kind: 'transfer' }> {
  return { id: 'transfer', kind: 'transfer', accountId: 'cash', amount: money(2000, 'TRY'),
    targetId: 'card', targetAmount: money(2000, 'TRY'), occurredOn: '2026-10-14', note: '', source: 'manual' };
}

test('opening correction preserves identity and unrelated movements while allowing signed zero values', async () => {
  const input = { id: 'old-opening', kind: 'opening' as const, accountId: 'cash', amount: money(10000, 'TRY'), occurredOn: '2026-09-01', note: 'Imported', source: 'import' as const };
  const original = await ledger.post(input);
  await ledger.post(expense());
  const corrected = await ledger.setOpening({ ...input, amount: money(-2500, 'TRY') }, original);
  expect(corrected).toEqual({ ...original, minor: -2500 });
  expect(await ledger.balance('cash')).toEqual(money(-3700, 'TRY'));
  expect(await ledger.setOpening({ ...input, amount: money(-2500, 'TRY') }, original)).toEqual(corrected);
  const totals = await ledger.totals('2026-01-01', '2026-12-31', 'TRY');
  expect(totals.income.minor).toBe(0); expect(totals.expense.minor).toBe(1200);
  await ledger.setOpening({ ...input, amount: money(0, 'TRY') }, corrected);
  expect((await ledger.snapshot()).records.filter(row => row.kind === 'opening')).toHaveLength(1);
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
});

test('missing opening can be created once with idempotent retries and concurrent conflict protection', async () => {
  const input = { id: 'new-opening', kind: 'opening' as const, accountId: 'cash', amount: money(0, 'TRY'), occurredOn: '2026-10-14', note: '', source: 'manual' as const };
  const first = await ledger.setOpening(input, null);
  expect(await ledger.setOpening(input, null)).toEqual(first);
  await expect(ledger.setOpening({ ...input, id: 'other', amount: money(100, 'TRY') }, null)).rejects.toMatchObject({ code: 'conflict' });
  expect((await ledger.snapshot()).records).toHaveLength(1);
});

test('stale or removed opening cannot be overwritten or resurrected', async () => {
  const input = { id: 'initial', kind: 'opening' as const, accountId: 'cash', amount: money(10, 'TRY'), occurredOn: '2026-10-14', note: '', source: 'manual' as const };
  const first = await ledger.setOpening(input, null);
  const edited = await ledger.setOpening({ ...input, amount: money(20, 'TRY') }, first);
  await expect(ledger.setOpening({ ...input, amount: money(30, 'TRY') }, first)).rejects.toMatchObject({ code: 'conflict' });
  await ledger.voidRecord(edited.id, edited);
  await expect(ledger.setOpening(input, edited)).rejects.toMatchObject({ code: 'missing' });
  await expect(ledger.setOpening(input, null)).rejects.toMatchObject({ code: 'conflict' });
  expect((await ledger.snapshot()).records).toHaveLength(0);
});

test('archived accounts allow correction of their existing opening but block a new opening', async () => {
  const input = { id: 'initial', kind: 'opening' as const, accountId: 'cash', amount: money(10, 'TRY'), occurredOn: '2026-10-14', note: '', source: 'manual' as const };
  const first = await ledger.setOpening(input, null);
  await ledger.setAccountArchived('cash', true);
  expect((await ledger.setOpening({ ...input, amount: money(-20, 'TRY') }, first)).minor).toBe(-20);
  await ledger.setAccountArchived('card', true);
  await expect(ledger.setOpening({ ...input, id: 'card-opening', accountId: 'card' }, null)).rejects.toMatchObject({ code: 'archived' });
});

test('opening correction rolls back on balance overflow and rejects moving or changing currency/source', async () => {
  const input = { id: 'initial', kind: 'opening' as const, accountId: 'cash', amount: money(0, 'TRY'), occurredOn: '2026-10-14', note: '', source: 'manual' as const };
  const first = await ledger.setOpening(input, null);
  await ledger.post(expense({ kind: 'income', categoryId: 'salary', amount: money(Number.MAX_SAFE_INTEGER, 'TRY') }));
  await expect(ledger.setOpening({ ...input, amount: money(1, 'TRY') }, first)).rejects.toMatchObject({ code: 'range' });
  expect((await ledger.snapshot()).records.find(row => row.id === first.id)).toEqual(first);
  for (const invalid of [{ ...input, accountId: 'card' }, { ...input, source: 'import' as const }, { ...input, amount: money(10, 'USD') }]) {
    await expect(ledger.setOpening(invalid, first)).rejects.toMatchObject({ code: 'invalid' });
  }
  await ledger.setOpening({ ...input, amount: money(-Number.MAX_SAFE_INTEGER, 'TRY') }, first);
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
});

test('editing a transfer can move four accounts and currencies while keeping identity and report totals', async () => {
  await ledger.createAccount({ id: 'eur', name: 'Euro', kind: 'bank', currency: 'EUR' });
  const original = await ledger.post({ ...transfer(), source: 'import' });
  const input = { ...transfer(), accountId: 'usd', targetId: 'eur', amount: money(150, 'USD'), targetAmount: money(200, 'EUR'), occurredOn: '2026-09-30', note: 'Moved', source: 'import' as const };
  const edited = await ledger.updateTransfer(input, original);
  expect(edited).toMatchObject({ id: original.id, source: original.source, created_at: original.created_at, occurred_on: '2026-09-30', note: 'Moved' });
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('usd')).toEqual(money(-150, 'USD'));
  expect(await ledger.balance('eur')).toEqual(money(200, 'EUR'));
  expect(await ledger.updateTransfer(input, original)).toEqual(edited);
  expect((await ledger.snapshot()).records).toHaveLength(1);
  expect((await ledger.totals('2026-09-01', '2026-09-30', 'USD')).expense.minor).toBe(0);
  expect((await ledger.totals('2026-09-01', '2026-09-30', 'EUR')).income.minor).toBe(0);
  await ledger.voidRecord(edited.id, edited);
  await ledger.voidRecord(edited.id, edited);
  expect(await ledger.balance('usd')).toEqual(money(0, 'USD'));
  expect(await ledger.balance('eur')).toEqual(money(0, 'EUR'));
});

test('stale transfer update/delete is rejected and a deleted transfer cannot be edited', async () => {
  const original = await ledger.post(transfer());
  const edited = await ledger.updateTransfer({ ...transfer(), note: 'New' }, original);
  await expect(ledger.updateTransfer({ ...transfer(), note: 'Stale' }, original)).rejects.toThrow('ledger.conflict');
  await expect(ledger.voidRecord(original.id, original)).rejects.toThrow('ledger.conflict');
  expect((await ledger.snapshot()).records[0]).toEqual(edited);
  await ledger.voidRecord(edited.id, edited);
  await expect(ledger.updateTransfer({ ...transfer(), note: 'New' }, edited)).rejects.toThrow('ledger.missing');
  expect((await ledger.post({ ...transfer(), note: 'New' })).voided).toBe(1);
});

test('transfer edits keep archived accounts in the same roles and reject moving or swapping to archived references', async () => {
  const original = await ledger.post(transfer());
  await ledger.setAccountArchived('cash', true);
  await ledger.setAccountArchived('card', true);
  const edited = await ledger.updateTransfer({ ...transfer(), amount: money(1000, 'TRY'), targetAmount: money(1000, 'TRY') }, original);
  await expect(ledger.updateTransfer({ ...transfer(), accountId: 'card', targetId: 'cash' }, edited)).rejects.toThrow('ledger.archived');
  const snapshot = await ledger.snapshot();
  expect(snapshot.records[0]).toEqual(edited);
  const draft = { id: edited.id, sourceId: 'cash', targetId: 'card', amount: '10', targetAmount: '', date: new Date('2026-10-14T12:00:00'), note: '' };
  expect(transferInput(draft, snapshot.accounts, 'tr', edited).source).toBe('manual');
  expect(() => transferInput({ ...draft, sourceId: 'card', targetId: 'cash' }, snapshot.accounts, 'tr', edited)).toThrow('transfer.accounts');
  await ledger.voidRecord(edited.id, edited);
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(0, 'TRY'));
});

test.each(['source', 'target'])('removing an old transfer %s leg that would overflow rolls back all changes', async leg => {
  const original = await ledger.post({ ...transfer(), amount: money(1, 'TRY'), targetAmount: money(1, 'TRY') });
  const accountId = leg === 'source' ? 'cash' : 'card';
  await ledger.post({ id: 'opening', kind: 'opening', accountId, amount: money(leg === 'source' ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER, 'TRY'), occurredOn: '2026-10-01', note: '', source: 'manual' });
  await ledger.post(expense({ id: 'boundary', accountId, kind: leg === 'source' ? 'income' : 'expense', categoryId: leg === 'source' ? 'salary' : 'food', amount: money(1, 'TRY') }));
  const input = leg === 'source' ? { ...transfer(), accountId: 'usd', amount: money(1, 'USD'), targetAmount: money(1, 'TRY') } : { ...transfer(), targetId: 'usd', amount: money(1, 'TRY'), targetAmount: money(1, 'USD') };
  await expect(ledger.updateTransfer(input, original)).rejects.toThrow('money.range');
  expect((await ledger.snapshot()).records.find(row => row.id === original.id)).toEqual(original);
  expect(await ledger.balance('usd')).toEqual(money(0, 'USD'));
});

test('overflow on the new destination rolls back both original and replacement legs', async () => {
  const original = await ledger.post(transfer());
  await ledger.post({ id: 'opening', kind: 'opening', accountId: 'usd', amount: money(Number.MAX_SAFE_INTEGER, 'USD'), occurredOn: '2026-10-01', note: '', source: 'manual' });
  await expect(ledger.updateTransfer({ ...transfer(), targetId: 'usd', targetAmount: money(1, 'USD') }, original)).rejects.toThrow('money.range');
  expect(await ledger.balance('cash')).toEqual(money(-2000, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(2000, 'TRY'));
  expect(await ledger.balance('usd')).toEqual(money(Number.MAX_SAFE_INTEGER, 'USD'));
});

test('transfer deletion that would overflow preserves the transfer and both original balances', async () => {
  const original = await ledger.post({ ...transfer(), amount: money(1, 'TRY'), targetAmount: money(1, 'TRY') });
  await ledger.post({ id: 'opening', kind: 'opening', accountId: 'cash', amount: money(Number.MAX_SAFE_INTEGER, 'TRY'), occurredOn: '2026-10-01', note: '', source: 'manual' });
  await ledger.post(expense({ id: 'one', kind: 'income', categoryId: 'salary', amount: money(1, 'TRY') }));
  await expect(ledger.voidRecord(original.id, original)).rejects.toThrow('money.range');
  expect((await ledger.snapshot()).records.find(row => row.id === original.id)).toEqual(original);
  expect(await ledger.balance('cash')).toEqual(money(Number.MAX_SAFE_INTEGER, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(1, 'TRY'));
});

test('invalid transfer edits cannot change kind, source, identity, equal-currency conservation or references', async () => {
  const original = await ledger.post(transfer());
  await expect(ledger.updateTransfer({ ...transfer(), source: 'assistant' }, original)).rejects.toThrow('ledger.invalid');
  await expect(ledger.updateTransfer({ ...transfer(), id: 'different' }, original)).rejects.toThrow('ledger.invalid');
  await expect(ledger.updateTransfer({ ...transfer(), targetAmount: money(1, 'TRY') }, original)).rejects.toThrow('ledger.invalid');
  await expect(ledger.updateTransfer({ ...transfer(), targetId: 'missing' }, original)).rejects.toThrow('ledger.storage');
  await expect(ledger.updateTransfer({ ...transfer(), targetAmount: money(50, 'USD') }, original)).rejects.toThrow('ledger.storage');
  const income = expense({ kind: 'income', categoryId: 'salary' }) as unknown as Extract<RecordInput, { kind: 'transfer' }>;
  await expect(ledger.updateTransfer(income, original)).rejects.toThrow('ledger.invalid');
  expect((await ledger.snapshot()).records[0]).toEqual(original);
});

test('migration is repeatable without losing data', async () => {
  await ledger.post(expense());
  await migrate(db);
  expect(raw.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 });
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
});

test('v1 to v2 migration preserves ledger data and adds active flags', async () => {
  await ledger.post(expense());
  raw.exec('ALTER TABLE accounts DROP COLUMN archived; ALTER TABLE categories DROP COLUMN archived; PRAGMA user_version = 1;');
  await migrate(db);
  await migrate(db);
  expect(raw.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 });
  expect((await ledger.accounts()).every(account => account.archived === 0)).toBe(true);
  expect((await ledger.categories()).every(category => category.archived === 0)).toBe(true);
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
  expect((await ledger.snapshot()).records[0].category_id).toBe('food');
});

test('failed v2 migration rolls back added columns and version before successful retry', async () => {
  raw.exec('ALTER TABLE accounts DROP COLUMN archived; PRAGMA user_version = 1;');
  await expect(migrate(db)).rejects.toThrow(); // Duplicate categories column after accounts ALTER.
  expect(raw.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 1 });
  const columns = raw.prepare('PRAGMA table_info(accounts)').all() as { name: string }[];
  expect(columns.some(column => column.name === 'archived')).toBe(false);
  raw.exec('ALTER TABLE categories DROP COLUMN archived;');
  await migrate(db);
  expect((await ledger.accounts())[0].archived).toBe(0);
});

test('archiving retains financial history, blocks new references and supports restore and historical edits', async () => {
  await ledger.createCategory({ id: 'general', name: 'General', kind: 'expense' });
  const original = await ledger.post(expense());
  await ledger.setAccountArchived('cash', true);
  await ledger.setAccountArchived('cash', true);
  await ledger.setCategoryArchived('food', true);
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).expense.minor).toBe(1200);
  expect(await ledger.post(expense())).toEqual(original); // Retry of an already committed request.
  await expect(ledger.post(expense({ id: 'new-account-ref', categoryId: 'general' }))).rejects.toThrow('ledger.archived');
  await expect(ledger.post(expense({ id: 'new-category-ref', accountId: 'card' }))).rejects.toThrow('ledger.archived');
  await ledger.setAccountArchived('card', true);
  await expect(ledger.update(expense({ accountId: 'card' }), original)).rejects.toThrow('ledger.archived');
  const edited = await ledger.update(expense({ amount: money(2500, 'TRY') }), original);
  expect(edited.minor).toBe(2500);
  await ledger.voidRecord(edited.id);
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  await ledger.setAccountArchived('cash', false);
  await ledger.setCategoryArchived('food', false);
  await ledger.post(expense({ id: 'restored-ref' }));
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
});

test('transfer guards archived source and destination and archive does not remove either leg', async () => {
  await ledger.post(transfer());
  await ledger.setAccountArchived('card', true);
  await expect(ledger.post({ ...transfer(), id: 'new-transfer' } as RecordInput)).rejects.toThrow('ledger.archived');
  expect(await ledger.balance('cash')).toEqual(money(-2000, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(2000, 'TRY'));
  await ledger.voidRecord('transfer');
  expect(await ledger.balance('card')).toEqual(money(0, 'TRY'));
});

test('last active account and category of each kind cannot be archived even concurrently', async () => {
  await ledger.setAccountArchived('cash', true);
  const result = await Promise.allSettled([ledger.setAccountArchived('card', true), ledger.setAccountArchived('usd', true)]);
  expect(result.map(row => row.status)).toEqual(['fulfilled', 'rejected']);
  expect((await ledger.accounts()).filter(account => !account.archived)).toHaveLength(1);
  await expect(ledger.setCategoryArchived('salary', true)).rejects.toThrow('ledger.last-active');
  await expect(ledger.setCategoryArchived('food', true)).rejects.toThrow('ledger.last-active');
});

test('archived defaults stay archived after bootstrap and new defaults choose active references', async () => {
  await ledger.bootstrap();
  await ledger.post(expense({ accountId: 'default-cash', categoryId: 'default-general' }));
  await ledger.setAccountArchived('default-cash', true);
  await ledger.setCategoryArchived('default-general', true);
  await ledger.bootstrap();
  const snapshot = await ledger.snapshot();
  expect(snapshot.accounts.find(account => account.id === 'default-cash')?.archived).toBe(1);
  expect(snapshot.categories.find(category => category.id === 'default-general')?.archived).toBe(1);
  expect(defaultAccount(snapshot)).not.toBe('default-cash');
  expect(defaultCategory(snapshot, 'expense')).not.toBe('default-general');
});

test('bootstrap is idempotent and seeds no financial records', async () => {
  await Promise.all([ledger.bootstrap(), ledger.bootstrap()]);
  const snapshot = await ledger.snapshot();
  expect(snapshot.accounts.filter(account => account.id === 'default-cash')).toHaveLength(1);
  expect(snapshot.categories.filter(category => category.id.startsWith('default-'))).toHaveLength(6);
  expect(snapshot.records).toEqual([]);
  expect(snapshot.accounts.find(account => account.id === 'cash')?.name).toBe('Nakit');
});

test('failed bootstrap is atomic and retry completes the seed', async () => {
  raw.exec("CREATE TRIGGER fail_seed BEFORE INSERT ON categories WHEN NEW.id = 'default-food' BEGIN SELECT RAISE(ABORT, 'test'); END;");
  await expect(ledger.bootstrap()).rejects.toThrow('ledger.storage');
  expect((await ledger.accounts()).some(account => account.id === 'default-cash')).toBe(false);
  expect((await ledger.categories()).some(category => category.id.startsWith('default-'))).toBe(false);
  raw.exec('DROP TRIGGER fail_seed');
  await ledger.bootstrap();
  expect((await ledger.snapshot()).categories).toHaveLength(8);
});

test('future schemas are rejected without changing data or version', async () => {
  raw.exec('PRAGMA user_version = 3');
  await expect(migrate(db)).rejects.toThrow('database.version');
  expect(raw.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 });
  expect(await ledger.accounts()).toHaveLength(3);
});

test('failed migration rolls back DDL and version', async () => {
  const other = new DatabaseSync(':memory:');
  other.exec('CREATE TABLE categories (sentinel TEXT)');
  const otherDb = await configure(connection(other));
  try {
    await expect(migrate(otherDb)).rejects.toThrow();
    expect(other.prepare("SELECT name FROM sqlite_master WHERE name = 'accounts'").get()).toBeUndefined();
    expect(other.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 0 });
  } finally { await otherDb.close(); }
});

test('opening balance, income, expense and credit-card payment are not double counted', async () => {
  await ledger.post({ id: 'opening', kind: 'opening', accountId: 'cash', amount: money(10000, 'TRY'), occurredOn: '2026-10-01', note: '', source: 'manual' });
  await ledger.post(expense({ accountId: 'card' }));
  await ledger.post(expense({ id: 'income', kind: 'income', categoryId: 'salary', amount: money(3000, 'TRY') }));
  await ledger.post(transfer());
  expect(await ledger.balance('cash')).toEqual(money(11000, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(800, 'TRY'));
  expect(await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).toEqual({ income: money(3000, 'TRY'), expense: money(1200, 'TRY') });
});

test('foreign-currency transfer retains both exact amounts and does not become income', async () => {
  await ledger.post({ ...transfer(), targetId: 'usd', targetAmount: money(50, 'USD') } as RecordInput);
  expect(await ledger.balance('cash')).toEqual(money(-2000, 'TRY'));
  expect(await ledger.balance('usd')).toEqual(money(50, 'USD'));
  expect(await ledger.totals('2026-10-01', '2026-10-31', 'USD')).toEqual({ income: money(0, 'USD'), expense: money(0, 'USD') });
});

test('concurrent retries create one record and changed payload conflicts', async () => {
  const results = await Promise.all([ledger.post(expense()), ledger.post(expense()), ledger.post(expense())]);
  expect(results[0]).toEqual(results[1]);
  expect(await ledger.records('2026-10-01', '2026-10-31')).toHaveLength(1);
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
  await expect(ledger.post(expense({ note: 'changed' }))).rejects.toThrow('ledger.conflict');
});

test('undo reverses both transfer legs atomically and retry cannot resurrect it', async () => {
  await ledger.post(transfer());
  await ledger.voidRecord('transfer');
  await ledger.voidRecord('transfer');
  expect((await ledger.post(transfer())).voided).toBe(1);
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(0, 'TRY'));
  expect(await ledger.records('2026-10-01', '2026-10-31')).toHaveLength(0);
});

test.each([
  { accountId: 'missing' }, { categoryId: 'missing' }, { categoryId: 'salary' },
  { amount: money(100, 'USD') },
])('foreign keys reject invalid account/currency/category references: %j', async patch => {
  await expect(ledger.post(expense(patch))).rejects.toThrow('ledger.storage');
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.records('2026-10-01', '2026-10-31')).toHaveLength(0);
});

test('invalid target rolls back transfer and queue recovers after failure', async () => {
  await expect(ledger.post({ ...transfer(), targetId: 'missing' } as RecordInput)).rejects.toThrow('ledger.storage');
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  await ledger.post(expense());
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
});

test('concurrent distinct operations stay isolated when one fails', async () => {
  const results = await Promise.allSettled([
    ledger.post(expense({ id: 'a' })),
    ledger.post(expense({ id: 'bad', categoryId: 'missing' })),
    ledger.post(expense({ id: 'b' })),
  ]);
  expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected', 'fulfilled']);
  expect(await ledger.balance('cash')).toEqual(money(-2400, 'TRY'));
});

test('per-currency totals do not silently convert foreign amounts', async () => {
  await ledger.post(expense());
  await ledger.post(expense({ id: 'usd-expense', accountId: 'usd', amount: money(10, 'USD') }));
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).expense).toEqual(money(1200, 'TRY'));
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'USD')).expense).toEqual(money(10, 'USD'));
});

test('closed ledger rejects further operations', async () => {
  await ledger.close();
  await expect(ledger.accounts()).rejects.toThrow('ledger.storage');
});

test('balance overflow rolls back new transfer on both accounts', async () => {
  await ledger.post({ id: 'opening', kind: 'opening', accountId: 'card', amount: money(Number.MAX_SAFE_INTEGER, 'TRY'), occurredOn: '2026-10-01', note: '', source: 'manual' });
  await expect(ledger.post(transfer())).rejects.toThrow('money.range');
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('card')).toEqual(money(Number.MAX_SAFE_INTEGER, 'TRY'));
  expect(await ledger.records('2026-10-01', '2026-10-31')).toHaveLength(1);
});

test('undo that would overflow rolls back void flag', async () => {
  await ledger.post(expense({ amount: money(1, 'TRY') }));
  await ledger.post(expense({ id: 'large', kind: 'income', categoryId: 'salary', amount: money(Number.MAX_SAFE_INTEGER, 'TRY') }));
  await ledger.post(expense({ id: 'one', kind: 'income', categoryId: 'salary', amount: money(1, 'TRY') }));
  await expect(ledger.voidRecord('expense')).rejects.toThrow('money.range');
  expect(await ledger.balance('cash')).toEqual(money(Number.MAX_SAFE_INTEGER, 'TRY'));
  expect(await ledger.records('2026-10-01', '2026-10-31')).toHaveLength(3);
});

test.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-1-01', '0000-01-01', 'invalid'])('rejects invalid local calendar date %s', async occurredOn => {
  await expect(ledger.post(expense({ occurredOn }))).rejects.toThrow('ledger.invalid');
});

test('local day is independent of creation timestamp and range boundaries are inclusive', async () => {
  await ledger.post(expense({ occurredOn: '2024-02-29' }));
  const rows = await ledger.records('2024-02-29', '2024-02-29');
  expect(rows[0]).toMatchObject({ occurred_on: '2024-02-29', created_at: '2026-10-14T09:00:00.000Z' });
  expect(await ledger.records('2024-03-01', '2024-03-31')).toHaveLength(0);
});

test('user strings are bound parameters, not SQL', async () => {
  const note = "'); DROP TABLE accounts; --";
  await ledger.post(expense({ note }));
  expect((await ledger.records('2026-10-14', '2026-10-14'))[0].note).toBe(note);
  expect(await ledger.accounts()).toHaveLength(3);
});

test('same-currency transfer must preserve amount and cannot target itself', async () => {
  await expect(ledger.post({ ...transfer(), targetId: 'cash' } as RecordInput)).rejects.toThrow('ledger.invalid');
  await expect(ledger.post({ ...transfer(), targetAmount: money(1, 'TRY') } as RecordInput)).rejects.toThrow('ledger.invalid');
});

test('only one active opening is allowed and negative credit balance is supported', async () => {
  const opening: RecordInput = { id: 'open', kind: 'opening', accountId: 'card', amount: money(-100, 'TRY'), occurredOn: '2026-10-01', note: '', source: 'manual' };
  await ledger.post(opening);
  await expect(ledger.post({ ...opening, id: 'open2' })).rejects.toThrow('ledger.storage');
  expect(await ledger.balance('card')).toEqual(money(-100, 'TRY'));
});

test('database rejects unsafe integers and invalid references even outside repository validation', async () => {
  await ledger.post(expense());
  expect(() => raw.prepare('DELETE FROM accounts WHERE id = ?').run('cash')).toThrow();
  expect(() => raw.prepare('UPDATE records SET minor = ?').run(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  expect(() => raw.prepare('UPDATE records SET minor = 0').run()).toThrow();
  expect(() => raw.prepare("UPDATE records SET currency = 'USD'").run()).toThrow();
  expect(() => raw.prepare("INSERT INTO accounts(id,name,kind,currency) VALUES ('bad','Bad','cash','XYZ')").run()).toThrow();
});

test('file database persists records across close and reopen', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'spendo-test-'));
  const file = join(directory, 'ledger.db');
  let persistent: Ledger | undefined;
  try {
    const first = await configure(connection(new DatabaseSync(file)));
    await migrate(first);
    persistent = new Ledger(first);
    await persistent.createAccount({ id: 'cash', name: 'Nakit', kind: 'cash', currency: 'TRY' });
    await persistent.createCategory({ id: 'food', name: 'Yemek', kind: 'expense' });
    await persistent.post(expense());
    const original = (await persistent.snapshot()).records[0];
    await persistent.update(expense({ amount: money(2500, 'TRY'), note: 'Edited' }), original);
    await persistent.createAccount({ id: 'card', name: 'Card', kind: 'credit', currency: 'TRY' });
    const oldTransfer = await persistent.post(transfer());
    await persistent.updateTransfer({ ...transfer(), amount: money(1000, 'TRY'), targetAmount: money(1000, 'TRY') }, oldTransfer);
    const openingInput = { id: 'persist-opening', kind: 'opening' as const, accountId: 'cash', amount: money(0, 'TRY'), occurredOn: '2026-09-01', note: '', source: 'manual' as const };
    const oldOpening = await persistent.setOpening(openingInput, null);
    await persistent.setOpening({ ...openingInput, amount: money(5000, 'TRY') }, oldOpening);
    await persistent.close();
    persistent = undefined;
    const second = await configure(connection(new DatabaseSync(file)));
    await migrate(second);
    persistent = new Ledger(second);
    expect(await persistent.balance('cash')).toEqual(money(1500, 'TRY'));
    expect(await persistent.balance('card')).toEqual(money(1000, 'TRY'));
    expect(await persistent.records('2026-10-01', '2026-10-31')).toHaveLength(2);
    await persistent.voidRecord('expense');
    const savedTransfer = (await persistent.snapshot()).records.find(row => row.id === 'transfer')!;
    await persistent.voidRecord(savedTransfer.id, savedTransfer);
    await persistent.close();
    persistent = undefined;
    persistent = new Ledger(await configure(connection(new DatabaseSync(file))));
    expect((await persistent.snapshot()).records).toEqual([expect.objectContaining({ id: 'persist-opening', minor: 5000, occurred_on: '2026-09-01' })]);
    expect(await persistent.balance('cash')).toEqual(money(5000, 'TRY'));
  } finally {
    await persistent?.close();
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('spendo-test-')) throw new Error('Unexpected test directory');
    rmSync(target, { recursive: true });
  }
});

test('edit moves account, type and month atomically while retaining identity and source', async () => {
  const original = await ledger.post(expense({ source: 'import' }));
  const input = expense({ kind: 'income', categoryId: 'salary', accountId: 'usd', amount: money(123, 'USD'), occurredOn: '2026-09-30', note: 'Updated', source: 'import' });
  const updated = await ledger.update(input, original);
  expect(updated).toMatchObject({ id: original.id, created_at: original.created_at, source: 'import', note: 'Updated' });
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('usd')).toEqual(money(123, 'USD'));
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).expense.minor).toBe(0);
  expect((await ledger.totals('2026-09-01', '2026-09-30', 'USD')).income.minor).toBe(123);
  expect(await ledger.update(input, original)).toEqual(updated);
  expect((await ledger.snapshot()).records).toHaveLength(1);
});

test('stale edits and deletes cannot overwrite newer content', async () => {
  const original = await ledger.post(expense());
  const edited = await ledger.update(expense({ note: 'New' }), original);
  await expect(ledger.update(expense({ note: 'Stale' }), original)).rejects.toThrow('ledger.conflict');
  await expect(ledger.voidRecord(original.id, original)).rejects.toThrow('ledger.conflict');
  expect((await ledger.snapshot()).records[0]).toEqual(edited);
  await ledger.voidRecord(edited.id, edited);
  await ledger.voidRecord(edited.id, edited);
  await expect(ledger.update(expense(), original)).rejects.toThrow('ledger.missing');
  expect((await ledger.snapshot()).records).toEqual([]);
});

test.each([{ categoryId: 'salary' }, { accountId: 'missing' }, { amount: money(5, 'USD') }])('invalid edit references roll back: %j', async patch => {
  const original = await ledger.post(expense());
  await expect(ledger.update(expense(patch), original)).rejects.toThrow('ledger.storage');
  expect((await ledger.snapshot()).records[0]).toEqual(original);
});

test('edit checks overflow on both the old and the new accounts', async () => {
  const original = await ledger.post(expense({ amount: money(1, 'TRY') }));
  await ledger.post(expense({ id: 'large', kind: 'income', categoryId: 'salary', amount: money(Number.MAX_SAFE_INTEGER, 'TRY') }));
  await ledger.post(expense({ id: 'one', kind: 'income', categoryId: 'salary', amount: money(1, 'TRY') }));
  await expect(ledger.update(expense({ accountId: 'card' }), original)).rejects.toThrow('money.range');
  expect(await ledger.balance('card')).toEqual(money(0, 'TRY'));
  expect((await ledger.snapshot()).records.find(row => row.id === original.id)).toEqual(original);
  const cardExpense = await ledger.post(expense({ id: 'card-expense', accountId: 'card', amount: money(1, 'TRY') }));
  await expect(ledger.update(expense({ id: cardExpense.id, kind: 'income', categoryId: 'salary' }), cardExpense)).rejects.toThrow('money.range');
  expect(await ledger.balance('card')).toEqual(money(-1, 'TRY'));
});

test('transfer/opening records and source changes are outside the edit contract', async () => {
  const original = await ledger.post(transfer());
  await expect(ledger.update(expense({ id: original.id }), original)).rejects.toThrow('ledger.invalid');
  const row = await ledger.post(expense());
  await expect(ledger.update(expense({ source: 'assistant' }), row)).rejects.toThrow('ledger.invalid');
  await expect(ledger.update(transfer(), row)).rejects.toThrow('ledger.invalid');
});

test('development fixtures have exact per-currency totals without openings, transfers or last month', async () => {
  await ledger.bootstrap();
  await ledger.seedDevelopment(demoData('2026-10-14'));
  const snapshot = await ledger.snapshot();
  expect(snapshot.records).toHaveLength(11);
  expect(snapshot.accounts.filter(row => row.id.startsWith('demo-'))).toHaveLength(3);
  expect(snapshot.categories.filter(row => row.id.startsWith('default-'))).toHaveLength(6);
  expect(await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).toEqual({ income: money(3500000, 'TRY'), expense: money(218825, 'TRY') });
  expect(await ledger.totals('2026-10-01', '2026-10-31', 'USD')).toEqual({ income: money(0, 'USD'), expense: money(1599, 'USD') });
});

test('concurrent seed and reload do not duplicate or restore edited/deleted fixtures', async () => {
  await ledger.bootstrap();
  await Promise.all([ledger.seedDevelopment(demoData('2026-10-14')), ledger.seedDevelopment(demoData('2026-10-14'))]);
  const coffee = (await ledger.snapshot()).records.find(row => row.id === 'demo-coffee')!;
  await ledger.update({ id: coffee.id, accountId: coffee.account_id, kind: 'expense', categoryId: coffee.category_id!, amount: money(10000, 'TRY'), occurredOn: coffee.occurred_on, note: 'Changed sample', source: coffee.source }, coffee);
  await ledger.voidRecord('demo-transport');
  await ledger.seedDevelopment(demoData('2026-11-01'));
  const rows = (await ledger.snapshot()).records;
  expect(rows).toHaveLength(10);
  expect(rows.find(row => row.id === 'demo-coffee')).toMatchObject({ minor: 10000, note: 'Changed sample', occurred_on: '2026-10-14' });
  expect(rows.find(row => row.id === 'demo-transport')).toBeUndefined();
});

test('failed development seed rolls back all fixtures and can be retried', async () => {
  await ledger.bootstrap();
  raw.exec("CREATE TRIGGER fail_demo BEFORE INSERT ON records WHEN NEW.id = 'demo-bills' BEGIN SELECT RAISE(ABORT, 'test'); END;");
  await expect(ledger.seedDevelopment(demoData('2026-10-14'))).rejects.toThrow('ledger.storage');
  expect((await ledger.snapshot()).records).toEqual([]);
  expect((await ledger.accounts()).filter(row => row.id.startsWith('demo-'))).toEqual([]);
  raw.exec('DROP TRIGGER fail_demo');
  await ledger.seedDevelopment(demoData('2026-10-14'));
  expect((await ledger.snapshot()).records).toHaveLength(11);
});

test('development storage is separate and fixture dates handle January/leap month boundaries', () => {
  expect(ledgerDatabaseName(true)).toBe('spendo-demo.db');
  expect(ledgerDatabaseName(false)).toBe('spendo.db');
  expect(demoData('2026-01-01').records.find(row => row.id === 'demo-last-month')?.occurredOn).toBe('2025-12-31');
  expect(demoData('2024-03-01').records.find(row => row.id === 'demo-last-month')?.occurredOn).toBe('2024-02-29');
  expect(() => demoData('2026-02-29')).toThrow('ledger.invalid');
});

test('v2 adds five preceding months once without changing v1 edits or current totals', async () => {
  await ledger.bootstrap();
  await ledger.seedDevelopment(demoData('2026-10-14'));
  await ledger.voidRecord('demo-coffee');
  const anchor = await ledger.developmentDay();
  expect(anchor).toBe('2026-10-14');
  await Promise.all([ledger.seedDevelopment(demoHistory(anchor), 2), ledger.seedDevelopment(demoHistory(anchor), 2)]);
  expect((await ledger.snapshot()).records).toHaveLength(35);
  expect((await ledger.snapshot()).records.some(row => row.id === 'demo-coffee')).toBe(false);
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).expense.minor).toBe(209275);
  expect(await ledger.totals('2026-09-01', '2026-09-30', 'TRY')).toEqual({ income: money(3400000, 'TRY'), expense: money(1237000, 'TRY') });
  expect(await ledger.totals('2026-05-01', '2026-05-31', 'TRY')).toEqual({ income: money(3000000, 'TRY'), expense: money(1275000, 'TRY') });
  expect((await ledger.totals('2026-09-01', '2026-09-30', 'USD')).expense.minor).toBe(1399);
});

test('history extension rolls back independently and handles year boundaries', async () => {
  await ledger.bootstrap();
  await ledger.seedDevelopment(demoData('2026-01-01'));
  const data = demoHistory(await ledger.developmentDay());
  expect(data.records[0].occurredOn).toBe('2025-12-01');
  expect(data.records.at(-5)?.occurredOn).toBe('2025-08-01');
  raw.exec("CREATE TRIGGER fail_history BEFORE INSERT ON records WHEN NEW.id = 'demo-history-2-rent' BEGIN SELECT RAISE(ABORT, 'test'); END;");
  await expect(ledger.seedDevelopment(data, 2)).rejects.toThrow('ledger.storage');
  expect((await ledger.snapshot()).records).toHaveLength(11);
  raw.exec('DROP TRIGGER fail_history');
  await ledger.seedDevelopment(data, 2);
  expect((await ledger.snapshot()).records).toHaveLength(36);
});

test('account and signed opening are committed together and retry does not duplicate', async () => {
  const account = { id: 'new-card', name: 'Test card', kind: 'credit' as const, currency: 'TRY' as const };
  await Promise.all([ledger.createAccountWithOpening(account, money(-125050, 'TRY'), '2026-10-14'), ledger.createAccountWithOpening(account, money(-125050, 'TRY'), '2026-10-14')]);
  const snapshot = await ledger.snapshot();
  expect(snapshot.records).toHaveLength(1);
  expect(await ledger.balance(account.id)).toEqual(money(-125050, 'TRY'));
  expect(accountBalance(snapshot, account)).toEqual(money(-125050, 'TRY'));
  expect(await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).toEqual({ income: money(0, 'TRY'), expense: money(0, 'TRY') });
  await expect(ledger.createAccountWithOpening({ ...account, name: 'Changed request' }, money(-125050, 'TRY'), '2026-10-14')).rejects.toThrow('ledger.conflict');
});

test('failed opening rolls back the new account and can be retried', async () => {
  const account = { id: 'new-bank', name: 'Test bank', kind: 'bank' as const, currency: 'TRY' as const };
  raw.exec("CREATE TRIGGER fail_opening BEFORE INSERT ON records WHEN NEW.id = 'opening-new-bank' BEGIN SELECT RAISE(ABORT, 'test'); END;");
  await expect(ledger.createAccountWithOpening(account, money(0, 'TRY'), '2026-10-14')).rejects.toThrow('ledger.storage');
  expect((await ledger.accounts()).some(row => row.id === account.id)).toBe(false);
  raw.exec('DROP TRIGGER fail_opening');
  await ledger.createAccountWithOpening(account, money(0, 'TRY'), '2026-10-14');
  expect(await ledger.balance(account.id)).toEqual(money(0, 'TRY'));
});

test('rename preserves account currency, records and balances and rejects stale names', async () => {
  await ledger.post(expense());
  await ledger.renameAccount('cash', 'Wallet', 'Nakit');
  await ledger.renameAccount('cash', 'Wallet', 'Nakit');
  await expect(ledger.renameAccount('cash', 'Stale', 'Nakit')).rejects.toThrow('ledger.conflict');
  expect((await ledger.accounts()).find(row => row.id === 'cash')).toMatchObject({ name: 'Wallet', currency: 'TRY', kind: 'cash' });
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
});

test('category creation is idempotent; changed payload and stale rename conflict', async () => {
  const category = { id: 'health', name: 'Sağlık', kind: 'expense' as const };
  await Promise.all([ledger.createCategory(category), ledger.createCategory(category)]);
  expect((await ledger.categories()).filter(row => row.id === 'health')).toHaveLength(1);
  await expect(ledger.createCategory({ ...category, kind: 'income' })).rejects.toThrow('ledger.conflict');
  await ledger.renameCategory('health', 'Bakım', 'Sağlık');
  await ledger.renameCategory('health', 'Bakım', 'Sağlık');
  await expect(ledger.renameCategory('health', 'Stale', 'Sağlık')).rejects.toThrow('ledger.conflict');
});

test('renaming built-in categories preserves references/totals and shows the custom name in both languages', async () => {
  await ledger.bootstrap();
  await ledger.post(expense({ categoryId: 'default-food' }));
  await ledger.renameCategory('default-food', 'Yeme içme', 'food');
  await ledger.bootstrap();
  const category = (await ledger.categories()).find(row => row.id === 'default-food')!;
  expect(category.kind).toBe('expense');
  expect(entityName(category, 'tr')).toBe('Yeme içme');
  expect(entityName(category, 'en')).toBe('Yeme içme');
  expect((await ledger.snapshot()).records[0].category_id).toBe(category.id);
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).expense.minor).toBe(1200);
});

test('category name validation rejects empty/long names and preserves stored data', async () => {
  await expect(ledger.renameCategory('food', '   ', 'Yemek')).rejects.toThrow('ledger.invalid');
  await expect(ledger.createCategory({ id: 'bad', name: 'x'.repeat(81), kind: 'expense' })).rejects.toThrow('ledger.invalid');
  await expect(ledger.renameCategory('missing', 'Name', 'Old')).rejects.toThrow('ledger.missing');
  expect((await ledger.categories()).find(row => row.id === 'food')?.name).toBe('Yemek');
});

test('transfer draft creates exact atomic legs without changing per-currency income/expense totals', async () => {
  const input = transferInput({ id: 'from-form', sourceId: 'cash', targetId: 'usd', amount: '1000,25', targetAmount: '25,50', date: new Date('2026-10-14T12:00:00'), note: '' }, await ledger.accounts(), 'tr');
  await ledger.post(input);
  await ledger.post(input);
  expect(await ledger.balance('cash')).toEqual(money(-100025, 'TRY'));
  expect(await ledger.balance('usd')).toEqual(money(2550, 'USD'));
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'TRY')).expense.minor).toBe(0);
  expect((await ledger.totals('2026-10-01', '2026-10-31', 'USD')).income.minor).toBe(0);
  await ledger.voidRecord(input.id);
  expect(await ledger.balance('cash')).toEqual(money(0, 'TRY'));
  expect(await ledger.balance('usd')).toEqual(money(0, 'USD'));
});

test('same-currency draft mirrors the exact amount and ignores an unused FX field', async () => {
  const input = transferInput({ id: 'same', sourceId: 'cash', targetId: 'card', amount: '20.25', targetAmount: 'unused', date: new Date('2026-10-14T12:00:00'), note: '' }, await ledger.accounts(), 'en');
  expect(input.targetAmount).toEqual(input.amount);
  expect(input.amount.minor).toBe(2025);
});

test.each(['cash', 'missing'])('draft rejects self or missing destination %s', async targetId => {
  expect(() => transferInput({ id: 'bad', sourceId: 'cash', targetId, amount: '10', targetAmount: '1', date: new Date(), note: '' }, [{ id: 'cash', name: 'Cash', kind: 'cash', currency: 'TRY' }], 'tr')).toThrow('transfer.accounts');
});

test('account balance model matches SQL for both transfer legs and all sample months', async () => {
  await ledger.bootstrap();
  await ledger.seedDevelopment(demoData('2026-10-14'));
  await ledger.seedDevelopment(demoHistory('2026-10-14'), 2);
  const snapshot = await ledger.snapshot();
  for (const account of snapshot.accounts) expect(accountBalance(snapshot, account)).toEqual(await ledger.balance(account.id));
});

test.each([['0', 'TRY', 'tr', 0], ['-1250,50', 'TRY', 'tr', -125050], ['1,250.50', 'USD', 'en', 125050], ['-100', 'JPY', 'en', -100]])('opening parses signed and zero exact values: %s', (text, currency, language, expected) => {
  expect(parseOpening(text as string, currency as 'TRY' | 'USD' | 'JPY', language as 'tr' | 'en').minor).toBe(expected);
});

test.each(['', '-', '1,234', '1e3', '9007199254740992'])('opening rejects invalid or unsafe amounts: %s', text => {
  expect(() => parseOpening(text, 'TRY', 'tr')).toThrow();
});

test('development seed marker and sample edits survive file close and reopen', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'spendo-test-'));
  const file = join(directory, 'demo.db');
  let persistent: Ledger | undefined;
  try {
    const first = await configure(connection(new DatabaseSync(file)));
    await migrate(first);
    persistent = new Ledger(first);
    await persistent.bootstrap();
    await persistent.seedDevelopment(demoData('2026-10-14'));
    await persistent.voidRecord('demo-coffee');
    await persistent.setAccountArchived('demo-bank', true);
    await persistent.setCategoryArchived('default-food', true);
    await persistent.close();
    persistent = undefined;
    const second = await configure(connection(new DatabaseSync(file)));
    await migrate(second);
    persistent = new Ledger(second);
    await persistent.bootstrap();
    await persistent.seedDevelopment(demoData('2026-11-01'));
    const snapshot = await persistent.snapshot();
    expect(snapshot.records).toHaveLength(10);
    expect(snapshot.records.some(row => row.id === 'demo-coffee')).toBe(false);
    expect(snapshot.records.find(row => row.id === 'demo-salary')?.occurred_on).toBe('2026-10-01');
    expect(snapshot.accounts.find(account => account.id === 'demo-bank')?.archived).toBe(1);
    expect(snapshot.categories.find(category => category.id === 'default-food')?.archived).toBe(1);
  } finally {
    await persistent?.close();
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('spendo-test-')) throw new Error('Unexpected test directory');
    rmSync(target, { recursive: true });
  }
});
