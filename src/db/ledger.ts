import { Currency, Money, MoneyError, money, sumMoney } from '../domain/money';
import { Connection, Database } from './connection';

export type Account = { id: string; name: string; kind: 'cash' | 'bank' | 'credit' | 'other'; currency: Currency };
export type Category = { id: string; name: string; kind: 'income' | 'expense' };
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
  constructor(public readonly code: 'invalid' | 'missing' | 'conflict' | 'storage') {
    super(`ledger.${code}`);
    this.name = 'LedgerError';
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

export class Ledger {
  constructor(private readonly db: Database, private readonly now: () => string = () => new Date().toISOString()) {}

  private async run<T>(work: (tx: Connection) => Promise<T>): Promise<T> {
    try { return await this.db.transaction(work); }
    catch (error) {
      if (error instanceof LedgerError || error instanceof MoneyError) throw error;
      throw new LedgerError('storage');
    }
  }

  async createAccount(account: Account): Promise<void> {
    id(account.id); name(account.name); money(0, account.currency);
    if (!['cash', 'bank', 'credit', 'other'].includes(account.kind)) throw new LedgerError('invalid');
    await this.run(async tx => {
      await tx.runAsync('INSERT INTO accounts(id,name,kind,currency) VALUES (?,?,?,?)', [account.id, account.name, account.kind, account.currency]);
    });
  }

  async createCategory(category: Category): Promise<void> {
    id(category.id); name(category.name);
    if (!['income', 'expense'].includes(category.kind)) throw new LedgerError('invalid');
    await this.run(async tx => {
      await tx.runAsync('INSERT INTO categories(id,name,kind) VALUES (?,?,?)', [category.id, category.name, category.kind]);
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
      const createdAt = this.now();
      if (!Number.isFinite(Date.parse(createdAt))) throw new LedgerError('invalid');
      await tx.runAsync(`INSERT INTO records
        (id,kind,account_id,currency,minor,category_id,target_id,target_currency,target_minor,occurred_on,note,source,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, [row.id, row.kind, row.account_id, row.currency, row.minor,
        row.category_id, row.target_id, row.target_currency, row.target_minor, row.occurred_on, row.note, row.source, createdAt]);
      await balance(tx, row.account_id);
      if (row.target_id) await balance(tx, row.target_id);
      return { ...row, created_at: createdAt, voided: 0 };
    });
  }

  async voidRecord(recordId: string): Promise<void> {
    id(recordId);
    await this.run(async tx => {
      const [row] = await tx.getAllAsync<RecordRow>('SELECT * FROM records WHERE id = ?', [recordId]);
      if (!row) throw new LedgerError('missing');
      if (row.voided) return;
      await tx.runAsync('UPDATE records SET voided = 1 WHERE id = ?', [recordId]);
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
