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
function transfer(): RecordInput {
  return { id: 'transfer', kind: 'transfer', accountId: 'cash', amount: money(2000, 'TRY'),
    targetId: 'card', targetAmount: money(2000, 'TRY'), occurredOn: '2026-10-14', note: '', source: 'manual' };
}

test('migration is repeatable without losing data', async () => {
  await ledger.post(expense());
  await migrate(db);
  expect(raw.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 1 });
  expect(await ledger.balance('cash')).toEqual(money(-1200, 'TRY'));
});

test('future schemas are rejected without changing data or version', async () => {
  raw.exec('PRAGMA user_version = 2');
  await expect(migrate(db)).rejects.toThrow('database.version');
  expect(raw.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 });
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
  expect(() => raw.prepare("INSERT INTO accounts VALUES ('bad','Bad','cash','XYZ')").run()).toThrow();
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
    await persistent.close();
    persistent = undefined;
    const second = await configure(connection(new DatabaseSync(file)));
    await migrate(second);
    persistent = new Ledger(second);
    expect(await persistent.balance('cash')).toEqual(money(-1200, 'TRY'));
    expect(await persistent.records('2026-10-01', '2026-10-31')).toHaveLength(1);
  } finally {
    await persistent?.close();
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('spendo-test-')) throw new Error('Unexpected test directory');
    rmSync(target, { recursive: true });
  }
});
