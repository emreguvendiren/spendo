import { Currency, Money, MoneyError, money, sumMoney } from '../domain/money';
import { Connection, Database } from './connection';

export type Account = { id: string; name: string; kind: 'cash' | 'bank' | 'credit' | 'other'; currency: Currency; archived?: number };
export type Category = { id: string; name: string; kind: 'income' | 'expense'; archived?: number };
export type Budget = { month: string; currency: Currency; category_id: string; minor: number };
export type EntryTemplate = { id: string; name: string; kind: 'income' | 'expense'; account_id: string; currency: Currency; minor: number; category_id: string; note: string; deleted?: number };
export type Goal = { id: string; name: string; currency: Currency; target_minor: number; deleted?: number };
export type Contribution = { id: string; goal_id: string; minor: number; occurred_on: string; created_at: string; voided: number };
export type ContributionInput = { id: string; goalId: string; amount: Money; day: string };
export type LedgerSnapshot = { accounts: Account[]; categories: Category[]; records: RecordRow[]; feeLinks?: { transfer_id: string; fee_id: string }[]; budgets?: Budget[]; goals?: Goal[]; contributions?: Contribution[]; templates?: EntryTemplate[] };
export type TransferFeeInput = Extract<RecordInput, { kind: 'income' | 'expense' }> & { kind: 'expense' };
type Common = { id: string; accountId: string; amount: Money; occurredOn: string; note: string; source: 'manual' | 'import' | 'recurring' | 'assistant' };
export type RecordInput = Common & (
  | { kind: 'income' | 'expense'; categoryId: string }
  | { kind: 'opening' }
  | { kind: 'transfer'; targetId: string; targetAmount: Money }
);
export type RecordRow = {
  id: string; kind: 'income' | 'expense' | 'opening' | 'transfer'; account_id: string;
  currency: Currency; minor: number; category_id: string | null; target_id: string | null;
  target_currency: Currency | null; target_minor: number | null; occurred_on: string;
  created_at: string; note: string; source: Common['source']; voided: number;
};

export class LedgerError extends Error {
  constructor(public readonly code: 'invalid' | 'missing' | 'conflict' | 'storage' | 'archived' | 'last-active') {
    super(`ledger.${code}`);
    this.name = 'LedgerError';
  }
}

async function ensureActiveReferences(tx: Connection, row: ReturnType<typeof fields>, previous?: RecordRow) {
  for (const [accountId, previousId] of [[row.account_id, previous?.account_id], [row.target_id, previous?.target_id]]) {
    if (!accountId || accountId === previousId) continue;
    const [account] = await tx.getAllAsync<Account>('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (account?.archived) throw new LedgerError('archived');
  }
  if (row.category_id && row.category_id !== previous?.category_id) {
    const [category] = await tx.getAllAsync<Category>('SELECT * FROM categories WHERE id = ?', [row.category_id]);
    if (category?.archived) throw new LedgerError('archived');
  }
}

function id(value: string) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new LedgerError('invalid');
}
function name(value: string) {
  if (typeof value !== 'string' || !value.trim() || value.length > 80) throw new LedgerError('invalid');
}
export function validateDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) throw new LedgerError('invalid');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new LedgerError('invalid');
}
export function validateMonth(value: string) { validateDay(`${value}-01`); }

function fields(input: RecordInput) {
  id(input.id); id(input.accountId); validateDay(input.occurredOn);
  money(input.amount.minor, input.amount.currency);
  if (!['income', 'expense', 'opening', 'transfer'].includes(input.kind)
    || !['manual', 'import', 'recurring', 'assistant'].includes(input.source)
    || typeof input.note !== 'string' || input.note.length > 500
    || (input.kind !== 'opening' && input.amount.minor <= 0)) throw new LedgerError('invalid');
  if (input.kind === 'income' || input.kind === 'expense') id(input.categoryId);
  if (input.kind === 'transfer') {
    id(input.targetId); money(input.targetAmount.minor, input.targetAmount.currency);
    if (input.targetId === input.accountId || input.targetAmount.minor <= 0
      || (input.amount.currency === input.targetAmount.currency && input.amount.minor !== input.targetAmount.minor)) {
      throw new LedgerError('invalid');
    }
  }
  return {
    id: input.id, kind: input.kind, account_id: input.accountId, currency: input.amount.currency, minor: input.amount.minor,
    category_id: input.kind === 'income' || input.kind === 'expense' ? input.categoryId : null,
    target_id: input.kind === 'transfer' ? input.targetId : null,
    target_currency: input.kind === 'transfer' ? input.targetAmount.currency : null,
    target_minor: input.kind === 'transfer' ? input.targetAmount.minor : null,
    occurred_on: input.occurredOn, note: input.note, source: input.source,
  };
}

function goalFields(goal: Goal) {
  id(goal.id); name(goal.name); money(goal.target_minor, goal.currency);
  if (goal.target_minor <= 0 || goal.deleted) throw new LedgerError('invalid');
}
function templateFields(template: EntryTemplate) {
  name(template.name);
  if (template.deleted || !['income', 'expense'].includes(template.kind)) throw new LedgerError('invalid');
  return fields({ id: template.id, kind: template.kind, accountId: template.account_id, amount: money(template.minor, template.currency), categoryId: template.category_id, note: template.note, occurredOn: '2000-01-01', source: 'manual' });
}
const templateKeys = ['id', 'name', 'kind', 'account_id', 'currency', 'minor', 'category_id', 'note'] as const;
function sameTemplate(left: EntryTemplate, right: EntryTemplate) { return templateKeys.every(key => left[key] === right[key]); }
async function goalBalance(tx: Connection, goal: Goal) {
  const rows = await tx.getAllAsync<Contribution>('SELECT * FROM goal_contributions WHERE goal_id = ? AND voided = 0', [goal.id]);
  return sumMoney(rows.map(row => money(row.minor, goal.currency)), goal.currency);
}

async function balance(tx: Connection, accountId: string): Promise<Money> {
  const [account] = await tx.getAllAsync<Account>('SELECT * FROM accounts WHERE id = ?', [accountId]);
  if (!account) throw new LedgerError('missing');
  const rows = await tx.getAllAsync<{ minor: number }>(`
    SELECT CASE WHEN kind IN ('expense','transfer') THEN -minor ELSE minor END AS minor
    FROM records WHERE account_id = ? AND voided = 0
    UNION ALL SELECT target_minor AS minor FROM records WHERE target_id = ? AND voided = 0
  `, [accountId, accountId]);
  // SQLite SUM can overflow or yield unsafe JS integers; use the exact domain accumulator.
  return sumMoney(rows.map(row => money(row.minor, account.currency)), account.currency);
}

async function insertRecord(tx: Connection, row: ReturnType<typeof fields>, createdAt: string, checkActive = true, checkBalance = true): Promise<RecordRow> {
  if (!Number.isFinite(Date.parse(createdAt))) throw new LedgerError('invalid');
  if (checkActive) await ensureActiveReferences(tx, row);
  await tx.runAsync(`INSERT INTO records
    (id,kind,account_id,currency,minor,category_id,target_id,target_currency,target_minor,occurred_on,note,source,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [row.id, row.kind, row.account_id, row.currency, row.minor,
    row.category_id, row.target_id, row.target_currency, row.target_minor, row.occurred_on, row.note, row.source, createdAt]);
  if (checkBalance) {
    await balance(tx, row.account_id);
    if (row.target_id) await balance(tx, row.target_id);
  }
  return { ...row, created_at: createdAt, voided: 0 };
}

export class Ledger {
  constructor(private readonly db: Database, private readonly now: () => string = () => new Date().toISOString()) {}

  private async run<T>(work: (tx: Connection) => Promise<T>): Promise<T> {
    try { return await this.db.transaction(work); }
    catch (error) {
      if (error instanceof LedgerError || error instanceof MoneyError) throw error;
      throw new LedgerError('storage');
    }
  }

  /** Stable built-in identifiers are translated in the UI; no sample financial records. */
  async bootstrap(): Promise<void> {
    await this.run(async tx => {
      await tx.runAsync("INSERT INTO accounts(id,name,kind,currency) VALUES ('default-cash','Cash','cash','TRY') ON CONFLICT(id) DO NOTHING", []);
      for (const [key, kind] of [['general', 'expense'], ['food', 'expense'], ['transport', 'expense'], ['bills', 'expense'], ['salary', 'income'], ['other-income', 'income']]) {
        await tx.runAsync('INSERT INTO categories(id,name,kind) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING', [`default-${key}`, key, kind]);
      }
    });
  }

  snapshot(): Promise<LedgerSnapshot> {
    return this.run(async tx => ({
      accounts: await tx.getAllAsync<Account>('SELECT * FROM accounts ORDER BY name, id', []),
      categories: await tx.getAllAsync<Category>('SELECT * FROM categories ORDER BY id', []),
      records: await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE voided = 0 ORDER BY occurred_on DESC, created_at DESC, id', []),
      feeLinks: await tx.getAllAsync<{ transfer_id: string; fee_id: string }>('SELECT l.* FROM transfer_fees l JOIN records f ON f.id = l.fee_id WHERE f.voided = 0', []),
      budgets: await tx.getAllAsync<Budget>('SELECT month,currency,category_id,minor FROM budgets ORDER BY month DESC, category_id, currency', []),
      goals: await tx.getAllAsync<Goal>('SELECT * FROM goals WHERE deleted = 0 ORDER BY name,id', []),
      contributions: await tx.getAllAsync<Contribution>('SELECT c.* FROM goal_contributions c JOIN goals g ON g.id = c.goal_id WHERE c.voided = 0 AND g.deleted = 0 ORDER BY occurred_on DESC,created_at DESC,c.id', []),
      templates: await tx.getAllAsync<EntryTemplate>('SELECT * FROM entry_templates WHERE deleted = 0 ORDER BY name,id', []),
    }));
  }

  async setTemplate(input: EntryTemplate, expected: EntryTemplate | null): Promise<void> {
    const row = templateFields(input);
    if (expected && input.id !== expected.id) throw new LedgerError('invalid');
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<EntryTemplate>('SELECT * FROM entry_templates WHERE id = ?', [input.id]);
      if (current?.deleted) throw new LedgerError('missing');
      if (current && sameTemplate(current, input)) return;
      if (expected ? !current || !sameTemplate(current, expected) : !!current) throw new LedgerError('conflict');
      const previous = current ? { ...templateFields(current), created_at: '', voided: 0 } : undefined;
      await ensureActiveReferences(tx, row, previous);
      if (current) await tx.runAsync('UPDATE entry_templates SET name = ?, kind = ?, account_id = ?, currency = ?, minor = ?, category_id = ?, note = ? WHERE id = ?', [input.name, input.kind, input.account_id, input.currency, input.minor, input.category_id, input.note, input.id]);
      else await tx.runAsync('INSERT INTO entry_templates(id,name,kind,account_id,currency,minor,category_id,note) VALUES (?,?,?,?,?,?,?,?)', [input.id, input.name, input.kind, input.account_id, input.currency, input.minor, input.category_id, input.note]);
    });
  }
  async removeTemplate(expected: EntryTemplate): Promise<void> {
    templateFields({ ...expected, deleted: 0 });
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<EntryTemplate>('SELECT * FROM entry_templates WHERE id = ?', [expected.id]);
      if (!current || current.deleted) return;
      if (!sameTemplate(current, expected)) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE entry_templates SET deleted = 1 WHERE id = ?', [expected.id]);
    });
  }

  async setGoal(input: Goal, expected: Goal | null): Promise<void> {
    goalFields(input);
    if (expected && (input.id !== expected.id || input.currency !== expected.currency)) throw new LedgerError('invalid');
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<Goal>('SELECT * FROM goals WHERE id = ?', [input.id]);
      if (current?.deleted) throw new LedgerError('missing');
      if (current && current.name === input.name && current.currency === input.currency && current.target_minor === input.target_minor) return;
      if (expected ? !current || current.name !== expected.name || current.target_minor !== expected.target_minor || current.currency !== expected.currency : !!current) throw new LedgerError('conflict');
      if (current) await tx.runAsync('UPDATE goals SET name = ?, target_minor = ? WHERE id = ?', [input.name, input.target_minor, input.id]);
      else await tx.runAsync('INSERT INTO goals(id,name,currency,target_minor) VALUES (?,?,?,?)', [input.id, input.name, input.currency, input.target_minor]);
    });
  }
  async removeGoal(expected: Goal): Promise<void> {
    goalFields({ ...expected, deleted: 0 });
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<Goal>('SELECT * FROM goals WHERE id = ?', [expected.id]);
      if (!current || current.deleted) return;
      if (current.name !== expected.name || current.target_minor !== expected.target_minor || current.currency !== expected.currency) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE goals SET deleted = 1 WHERE id = ?', [expected.id]);
    });
  }
  async addContribution(input: ContributionInput): Promise<void> {
    id(input.id); id(input.goalId); validateDay(input.day); money(input.amount.minor, input.amount.currency);
    if (input.amount.minor <= 0) throw new LedgerError('invalid');
    await this.run(async tx => {
      const [goal] = await tx.getAllAsync<Goal>('SELECT * FROM goals WHERE id = ?', [input.goalId]);
      if (!goal || goal.deleted) throw new LedgerError('missing');
      if (goal.currency !== input.amount.currency) throw new LedgerError('invalid');
      const [current] = await tx.getAllAsync<Contribution>('SELECT * FROM goal_contributions WHERE id = ?', [input.id]);
      if (current) {
        if (current.goal_id !== input.goalId || current.minor !== input.amount.minor || current.occurred_on !== input.day) throw new LedgerError('conflict');
        return;
      }
      await tx.runAsync('INSERT INTO goal_contributions(id,goal_id,minor,occurred_on,created_at) VALUES (?,?,?,?,?)', [input.id, input.goalId, input.amount.minor, input.day, this.now()]);
      await goalBalance(tx, goal);
    });
  }
  async removeContribution(expected: Contribution): Promise<void> {
    id(expected.id);
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<Contribution>('SELECT * FROM goal_contributions WHERE id = ?', [expected.id]);
      if (!current || current.voided) return;
      if (Object.keys(current).some(key => current[key as keyof Contribution] !== expected[key as keyof Contribution])) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE goal_contributions SET voided = 1 WHERE id = ?', [expected.id]);
    });
  }

  async setBudget(input: Budget, expected: Budget | null): Promise<void> {
    validateMonth(input.month); id(input.category_id); money(input.minor, input.currency);
    if (input.minor <= 0 || (expected && (expected.month !== input.month || expected.currency !== input.currency || expected.category_id !== input.category_id))) throw new LedgerError('invalid');
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<Budget>('SELECT month,currency,category_id,minor FROM budgets WHERE month = ? AND currency = ? AND category_id = ?', [input.month, input.currency, input.category_id]);
      if (current?.minor === input.minor) return;
      if (expected ? !current || current.minor !== expected.minor : !!current) throw new LedgerError('conflict');
      const [category] = await tx.getAllAsync<Category>('SELECT * FROM categories WHERE id = ?', [input.category_id]);
      if (!category || category.kind !== 'expense') throw new LedgerError('invalid');
      if (category.archived && !current) throw new LedgerError('archived');
      if (current) await tx.runAsync('UPDATE budgets SET minor = ? WHERE month = ? AND currency = ? AND category_id = ?', [input.minor, input.month, input.currency, input.category_id]);
      else await tx.runAsync('INSERT INTO budgets(month,currency,category_id,minor) VALUES (?,?,?,?)', [input.month, input.currency, input.category_id, input.minor]);
    });
  }
  async removeBudget(expected: Budget): Promise<void> {
    validateMonth(expected.month); id(expected.category_id); money(expected.minor, expected.currency);
    await this.run(async tx => {
      const [current] = await tx.getAllAsync<Budget>('SELECT month,currency,category_id,minor FROM budgets WHERE month = ? AND currency = ? AND category_id = ?', [expected.month, expected.currency, expected.category_id]);
      if (!current) return;
      if (current.minor !== expected.minor) throw new LedgerError('conflict');
      await tx.runAsync('DELETE FROM budgets WHERE month = ? AND currency = ? AND category_id = ?', [expected.month, expected.currency, expected.category_id]);
    });
  }

  /** Called only for the separate development DB. Seed once, preserving edits/deletions on reload. */
  async seedDevelopment(data: { accounts: Account[]; records: RecordInput[]; budgets?: Budget[]; goals?: Goal[]; contributions?: ContributionInput[]; templates?: EntryTemplate[] }, version = 1): Promise<void> {
    if (!Number.isSafeInteger(version) || version < 1) throw new LedgerError('invalid');
    await this.run(async tx => {
      await tx.execAsync('CREATE TABLE IF NOT EXISTS development_seed (version INTEGER PRIMARY KEY) STRICT;');
      const seeded = await tx.getAllAsync<{ version: number }>('SELECT version FROM development_seed WHERE version = ?', [version]);
      if (seeded.length) return;
      for (const account of data.accounts) {
        id(account.id); name(account.name); money(0, account.currency);
        if (!['cash', 'bank', 'credit', 'other'].includes(account.kind)) throw new LedgerError('invalid');
        await tx.runAsync('INSERT INTO accounts(id,name,kind,currency) VALUES (?,?,?,?)', [account.id, account.name, account.kind, account.currency]);
      }
      for (const input of data.records) await insertRecord(tx, fields(input), this.now(), false);
      for (const budget of data.budgets ?? []) {
        validateMonth(budget.month); id(budget.category_id); money(budget.minor, budget.currency);
        if (budget.minor <= 0) throw new LedgerError('invalid');
        // Preserve user-created limits and do not activate archived categories while seeding.
        await tx.runAsync("INSERT INTO budgets(month,currency,category_id,minor) SELECT ?,?,?,? FROM categories WHERE id = ? AND kind = 'expense' AND archived = 0 ON CONFLICT(month,currency,category_id) DO NOTHING", [budget.month, budget.currency, budget.category_id, budget.minor, budget.category_id]);
      }
      for (const goal of data.goals ?? []) {
        goalFields(goal);
        await tx.runAsync('INSERT INTO goals(id,name,currency,target_minor) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING', [goal.id, goal.name, goal.currency, goal.target_minor]);
      }
      for (const input of data.contributions ?? []) {
        id(input.id); id(input.goalId); validateDay(input.day); money(input.amount.minor, input.amount.currency);
        if (input.amount.minor <= 0) throw new LedgerError('invalid');
        const [goal] = await tx.getAllAsync<Goal>('SELECT * FROM goals WHERE id = ?', [input.goalId]);
        if (!goal || goal.deleted) continue;
        if (goal.currency !== input.amount.currency) throw new LedgerError('invalid');
        await tx.runAsync('INSERT INTO goal_contributions(id,goal_id,minor,occurred_on,created_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING', [input.id, input.goalId, input.amount.minor, input.day, this.now()]);
        await goalBalance(tx, goal);
      }
      for (const template of data.templates ?? []) {
        templateFields(template);
        await tx.runAsync('INSERT INTO entry_templates(id,name,kind,account_id,currency,minor,category_id,note) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING', [template.id, template.name, template.kind, template.account_id, template.currency, template.minor, template.category_id, template.note]);
      }
      await tx.runAsync('INSERT INTO development_seed(version) VALUES (?)', [version]);
    });
  }

  developmentDay(): Promise<string> {
    return this.run(async tx => {
      const [row] = await tx.getAllAsync<{ occurred_on: string }>("SELECT occurred_on FROM records WHERE id = 'demo-opening-cash'", []);
      if (!row) throw new LedgerError('missing');
      return row.occurred_on;
    });
  }

  async createAccount(account: Account): Promise<void> {
    id(account.id); name(account.name); money(0, account.currency);
    if (!['cash', 'bank', 'credit', 'other'].includes(account.kind)) throw new LedgerError('invalid');
    await this.run(async tx => {
      await tx.runAsync('INSERT INTO accounts(id,name,kind,currency) VALUES (?,?,?,?)', [account.id, account.name, account.kind, account.currency]);
    });
  }

  async createAccountWithOpening(account: Account, opening: Money, day: string): Promise<void> {
    id(account.id); name(account.name); money(0, account.currency);
    if (!['cash', 'bank', 'credit', 'other'].includes(account.kind) || opening.currency !== account.currency) throw new LedgerError('invalid');
    const row = fields({ id: `opening-${account.id}`, kind: 'opening', accountId: account.id, amount: opening, occurredOn: day, note: '', source: 'manual' });
    await this.run(async tx => {
      const [existing] = await tx.getAllAsync<Account>('SELECT * FROM accounts WHERE id = ?', [account.id]);
      if (existing) {
        const [record] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
        if (Object.keys(account).some(key => account[key as keyof Account] !== existing[key as keyof Account]) || !record
          || Object.entries(row).some(([key, value]) => record[key as keyof RecordRow] !== value)) throw new LedgerError('conflict');
        return;
      }
      await tx.runAsync('INSERT INTO accounts(id,name,kind,currency) VALUES (?,?,?,?)', [account.id, account.name, account.kind, account.currency]);
      await insertRecord(tx, row, this.now());
    });
  }

  async renameAccount(accountId: string, nextName: string, expectedName: string): Promise<void> {
    id(accountId); name(nextName);
    await this.run(async tx => {
      const [account] = await tx.getAllAsync<Account>('SELECT * FROM accounts WHERE id = ?', [accountId]);
      if (!account) throw new LedgerError('missing');
      if (account.name === nextName) return;
      if (account.name !== expectedName) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE accounts SET name = ? WHERE id = ?', [nextName, accountId]);
    });
  }

  async createCategory(category: Category): Promise<void> {
    id(category.id); name(category.name);
    if (!['income', 'expense'].includes(category.kind)) throw new LedgerError('invalid');
    await this.run(async tx => {
      const [existing] = await tx.getAllAsync<Category>('SELECT * FROM categories WHERE id = ?', [category.id]);
      if (existing) {
        if (existing.name !== category.name || existing.kind !== category.kind) throw new LedgerError('conflict');
        return;
      }
      await tx.runAsync('INSERT INTO categories(id,name,kind) VALUES (?,?,?)', [category.id, category.name, category.kind]);
    });
  }

  async renameCategory(categoryId: string, nextName: string, expectedName: string): Promise<void> {
    id(categoryId); name(nextName);
    await this.run(async tx => {
      const [category] = await tx.getAllAsync<Category>('SELECT * FROM categories WHERE id = ?', [categoryId]);
      if (!category) throw new LedgerError('missing');
      if (category.name === nextName) return;
      if (category.name !== expectedName) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE categories SET name = ? WHERE id = ?', [nextName, categoryId]);
    });
  }

  async setAccountArchived(accountId: string, archived: boolean): Promise<void> {
    id(accountId);
    if (typeof archived !== 'boolean') throw new LedgerError('invalid');
    await this.run(async tx => {
      const [account] = await tx.getAllAsync<Account>('SELECT * FROM accounts WHERE id = ?', [accountId]);
      if (!account) throw new LedgerError('missing');
      if (!!account.archived === archived) return;
      if (archived) {
        const [count] = await tx.getAllAsync<{ n: number }>('SELECT COUNT(*) AS n FROM accounts WHERE archived = 0', []);
        if (count.n <= 1) throw new LedgerError('last-active');
      }
      await tx.runAsync('UPDATE accounts SET archived = ? WHERE id = ?', [archived ? 1 : 0, accountId]);
    });
  }

  async setCategoryArchived(categoryId: string, archived: boolean): Promise<void> {
    id(categoryId);
    if (typeof archived !== 'boolean') throw new LedgerError('invalid');
    await this.run(async tx => {
      const [category] = await tx.getAllAsync<Category>('SELECT * FROM categories WHERE id = ?', [categoryId]);
      if (!category) throw new LedgerError('missing');
      if (!!category.archived === archived) return;
      if (archived) {
        const [count] = await tx.getAllAsync<{ n: number }>('SELECT COUNT(*) AS n FROM categories WHERE archived = 0 AND kind = ?', [category.kind]);
        if (count.n <= 1) throw new LedgerError('last-active');
      }
      await tx.runAsync('UPDATE categories SET archived = ? WHERE id = ?', [archived ? 1 : 0, categoryId]);
    });
  }

  accounts(): Promise<Account[]> { return this.run(tx => tx.getAllAsync<Account>('SELECT * FROM accounts ORDER BY name, id', [])); }
  categories(): Promise<Category[]> { return this.run(tx => tx.getAllAsync<Category>('SELECT * FROM categories ORDER BY name, id', [])); }

  async post(input: RecordInput): Promise<RecordRow> {
    const row = fields(input);
    return this.run(async tx => {
      const [existing] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
      if (existing) {
        if (Object.entries(row).some(([key, value]) => existing[key as keyof RecordRow] !== value)) throw new LedgerError('conflict');
        return existing; // A voided request remains voided on retry.
      }
      return insertRecord(tx, row, this.now());
    });
  }

  /** Compare the opened draft with storage so another edit is never silently overwritten. */
  async update(input: RecordInput, expected: RecordRow): Promise<RecordRow> {
    const row = fields(input);
    if (!['income', 'expense'].includes(row.kind) || row.id !== expected.id || row.source !== expected.source) throw new LedgerError('invalid');
    return this.run(async tx => {
      const [current] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
      if (!current || current.voided) throw new LedgerError('missing');
      if (!['income', 'expense'].includes(current.kind)) throw new LedgerError('invalid');
      if ((await tx.getAllAsync('SELECT fee_id FROM transfer_fees WHERE fee_id = ?', [row.id])).length) throw new LedgerError('conflict');
      if (current.source !== row.source) throw new LedgerError('conflict');
      // Retrying a committed edit is harmless, even if its refresh failed.
      if (Object.entries(row).every(([key, value]) => current[key as keyof RecordRow] === value)) return current;
      if (Object.keys(current).some(key => current[key as keyof RecordRow] !== expected[key as keyof RecordRow])) throw new LedgerError('conflict');
      await ensureActiveReferences(tx, row, current);
      await tx.runAsync(`UPDATE records SET kind = ?, account_id = ?, currency = ?, minor = ?, category_id = ?, occurred_on = ?, note = ? WHERE id = ?`,
        [row.kind, row.account_id, row.currency, row.minor, row.category_id, row.occurred_on, row.note, row.id]);
      await balance(tx, current.account_id);
      if (row.account_id !== current.account_id) await balance(tx, row.account_id);
      return { ...current, ...row };
    });
  }

  async setOpening(input: Extract<RecordInput, { kind: 'opening' }>, expected: RecordRow | null): Promise<RecordRow> {
    const row = fields(input);
    if (row.kind !== 'opening' || (expected && (expected.kind !== 'opening' || expected.id !== row.id || expected.account_id !== row.account_id || expected.currency !== row.currency || expected.source !== row.source))) throw new LedgerError('invalid');
    return this.run(async tx => {
      const [current] = await tx.getAllAsync<RecordRow>("SELECT * FROM records WHERE account_id = ? AND kind = 'opening' AND voided = 0", [row.account_id]);
      if (current && Object.entries(row).every(([key, value]) => current[key as keyof RecordRow] === value)) return current;
      if (!expected) {
        if (current) throw new LedgerError('conflict');
        const existing = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
        if (existing.length) throw new LedgerError('conflict');
        return insertRecord(tx, row, this.now());
      }
      if (!current) throw new LedgerError('missing');
      if (Object.keys(current).some(key => current[key as keyof RecordRow] !== expected[key as keyof RecordRow])) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE records SET minor = ?, occurred_on = ?, note = ? WHERE id = ?', [row.minor, row.occurred_on, row.note, row.id]);
      await balance(tx, row.account_id);
      return { ...current, ...row };
    });
  }

  async updateTransfer(input: Extract<RecordInput, { kind: 'transfer' }>, expected: RecordRow): Promise<RecordRow> {
    const row = fields(input);
    if (row.kind !== 'transfer' || expected.kind !== 'transfer' || row.id !== expected.id || row.source !== expected.source) throw new LedgerError('invalid');
    return this.run(async tx => {
      const [current] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
      if (!current || current.voided) throw new LedgerError('missing');
      if (current.kind !== 'transfer' || current.source !== row.source) throw new LedgerError('conflict');
      if ((await tx.getAllAsync('SELECT l.fee_id FROM transfer_fees l JOIN records f ON f.id = l.fee_id WHERE l.transfer_id = ? AND f.voided = 0', [row.id])).length) throw new LedgerError('conflict');
      if (Object.entries(row).every(([key, value]) => current[key as keyof RecordRow] === value)) return current;
      if (Object.keys(current).some(key => current[key as keyof RecordRow] !== expected[key as keyof RecordRow])) throw new LedgerError('conflict');
      await ensureActiveReferences(tx, row, current);
      await tx.runAsync(`UPDATE records SET account_id = ?, currency = ?, minor = ?, target_id = ?, target_currency = ?, target_minor = ?, occurred_on = ?, note = ? WHERE id = ?`,
        [row.account_id, row.currency, row.minor, row.target_id, row.target_currency, row.target_minor, row.occurred_on, row.note, row.id]);
      // Removing the old legs can overflow too; check every affected account after the full edit.
      const affected = new Set([current.account_id, current.target_id, row.account_id, row.target_id]);
      for (const accountId of affected) if (accountId) await balance(tx, accountId);
      return { ...current, ...row };
    });
  }

  /** Transfer and its optional fee are compared and committed as one financial change. */
  async writeTransfer(input: Extract<RecordInput, { kind: 'transfer' }>, fee: TransferFeeInput | null, expected?: RecordRow, expectedFee: RecordRow | null = null): Promise<RecordRow> {
    const row = fields(input);
    const feeRow = fee ? fields(fee) : null;
    if (row.kind !== 'transfer' || (expected && (expected.kind !== 'transfer' || expected.id !== row.id || expected.source !== row.source))) throw new LedgerError('invalid');
    if (feeRow && (feeRow.kind !== 'expense' || feeRow.id === row.id || feeRow.account_id !== row.account_id || feeRow.currency !== row.currency || feeRow.occurred_on !== row.occurred_on || feeRow.source !== row.source)) throw new LedgerError('invalid');
    const same = (saved: RecordRow, desired: ReturnType<typeof fields>) => Object.entries(desired).every(([key, value]) => saved[key as keyof RecordRow] === value);
    const unchanged = (saved: RecordRow, opened: RecordRow) => Object.keys(saved).every(key => saved[key as keyof RecordRow] === opened[key as keyof RecordRow]);
    return this.run(async tx => {
      const [current] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
      const [currentFee] = await tx.getAllAsync<RecordRow>('SELECT f.* FROM records f JOIN transfer_fees l ON l.fee_id = f.id WHERE l.transfer_id = ? AND f.voided = 0', [row.id]);
      if (current?.voided) throw new LedgerError('missing');
      if (current && same(current, row) && (feeRow ? currentFee && same(currentFee, feeRow) : !currentFee)) return current;
      if (expected) {
        if (!current) throw new LedgerError('missing');
        if (!unchanged(current, expected) || (currentFee ? !expectedFee || !unchanged(currentFee, expectedFee) : !!expectedFee)) throw new LedgerError('conflict');
      } else if (current || currentFee) throw new LedgerError('conflict');
      if (currentFee && feeRow && currentFee.id !== feeRow.id) throw new LedgerError('invalid');
      await ensureActiveReferences(tx, row, current);
      if (feeRow) {
        // Existing archived source stays valid even when adding the first fee to its old transfer.
        await ensureActiveReferences(tx, feeRow, currentFee ?? (current ? { ...current, category_id: null } : undefined));
        if (!currentFee && (await tx.getAllAsync('SELECT id FROM records WHERE id = ?', [feeRow.id])).length) throw new LedgerError('conflict');
      }
      if (current) {
        await tx.runAsync('UPDATE records SET account_id = ?, currency = ?, minor = ?, target_id = ?, target_currency = ?, target_minor = ?, occurred_on = ?, note = ? WHERE id = ?', [row.account_id, row.currency, row.minor, row.target_id, row.target_currency, row.target_minor, row.occurred_on, row.note, row.id]);
      } else await insertRecord(tx, row, this.now(), false, false);
      if (currentFee && feeRow) {
        await tx.runAsync('UPDATE records SET account_id = ?, currency = ?, minor = ?, category_id = ?, occurred_on = ?, note = ? WHERE id = ?', [feeRow.account_id, feeRow.currency, feeRow.minor, feeRow.category_id, feeRow.occurred_on, feeRow.note, feeRow.id]);
      } else if (currentFee) await tx.runAsync('UPDATE records SET voided = 1 WHERE id = ?', [currentFee.id]);
      else if (feeRow) {
        await insertRecord(tx, feeRow, this.now(), false, false);
        await tx.runAsync('INSERT INTO transfer_fees(fee_id,transfer_id) VALUES (?,?)', [feeRow.id, row.id]);
      }
      for (const accountId of new Set([current?.account_id, current?.target_id, currentFee?.account_id, row.account_id, row.target_id])) if (accountId) await balance(tx, accountId);
      const [saved] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
      return saved;
    });
  }

  async voidRecord(recordId: string, expected?: RecordRow, expectedFee?: RecordRow | null): Promise<void> {
    id(recordId);
    await this.run(async tx => {
      const [row] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [recordId]);
      if (!row) throw new LedgerError('missing');
      if (row.voided) return;
      if ((await tx.getAllAsync('SELECT fee_id FROM transfer_fees WHERE fee_id = ?', [row.id])).length) throw new LedgerError('conflict');
      if (expected && Object.keys(row).some(key => row[key as keyof RecordRow] !== expected[key as keyof RecordRow])) throw new LedgerError('conflict');
      const [fee] = await tx.getAllAsync<RecordRow>('SELECT f.* FROM records f JOIN transfer_fees l ON l.fee_id = f.id WHERE l.transfer_id = ? AND f.voided = 0', [row.id]);
      if (expected && (fee ? !expectedFee || Object.keys(fee).some(key => fee[key as keyof RecordRow] !== expectedFee[key as keyof RecordRow]) : !!expectedFee)) throw new LedgerError('conflict');
      await tx.runAsync('UPDATE records SET voided = 1 WHERE id = ?', [recordId]);
      if (fee) await tx.runAsync('UPDATE records SET voided = 1 WHERE id = ?', [fee.id]);
      await balance(tx, row.account_id);
      if (row.target_id) await balance(tx, row.target_id);
    });
  }

  balance(accountId: string): Promise<Money> { id(accountId); return this.run(tx => balance(tx, accountId)); }

  records(from: string, through: string): Promise<RecordRow[]> {
    validateDay(from); validateDay(through);
    if (from > through) throw new LedgerError('invalid');
    return this.run(tx => tx.getAllAsync<RecordRow>(
      'SELECT * FROM records WHERE voided = 0 AND occurred_on BETWEEN ? AND ? ORDER BY occurred_on DESC, created_at DESC, id', [from, through]));
  }

  /** Totals for this currency only; this is not a converted cross-currency report. */
  async totals(from: string, through: string, currency: Currency): Promise<{ income: Money; expense: Money }> {
    money(0, currency);
    const rows = await this.records(from, through);
    const total = (kind: 'income' | 'expense') => sumMoney(rows.filter(row => row.kind === kind && row.currency === currency)
      .map(row => money(row.minor, row.currency)), currency);
    return { income: total('income'), expense: total('expense') };
  }

  close(): Promise<void> { return this.db.close(); }
}
