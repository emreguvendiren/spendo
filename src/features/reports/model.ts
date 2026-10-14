import { LedgerSnapshot } from '@/db/ledger';
import { Currency, currencyDigits, money, subtractMoney, sumMoney } from '@/domain/money';

function monthIndex(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month.startsWith('0000')) throw new Error('report.month');
  const [year, value] = month.split('-').map(Number);
  return (year - 1) * 12 + value - 1;
}
export function moveMonth(month: string, step: -1 | 1) {
  const index = monthIndex(month) + step;
  if (index < 0 || index >= 9999 * 12) return month;
  return `${String(Math.floor(index / 12) + 1).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}`;
}
export function reportCurrencies(snapshot: LedgerSnapshot): Currency[] {
  const codes = new Set([...snapshot.accounts.map(account => account.currency), ...snapshot.records.map(row => row.currency)]);
  return (Object.keys(currencyDigits) as Currency[]).filter(currency => codes.has(currency));
}
export function monthlyReport(snapshot: LedgerSnapshot, month: string, currency: Currency) {
  monthIndex(month);
  const rows = snapshot.records.filter(row => !row.voided && row.currency === currency && row.occurred_on.slice(0, 7) === month && (row.kind === 'income' || row.kind === 'expense'));
  const total = (kind: 'income' | 'expense') => sumMoney(rows.filter(row => row.kind === kind).map(row => money(row.minor, currency)), currency);
  const income = total('income'), expense = total('expense');
  const groups = new Map<string, number[]>();
  for (const row of rows.filter(item => item.kind === 'expense')) {
    const key = row.category_id ?? '';
    groups.set(key, [...(groups.get(key) ?? []), row.minor]);
  }
  const categories = [...groups.entries()].map(([categoryId, minors]) => {
    const amount = sumMoney(minors.map(minor => money(minor, currency)), currency);
    const percent = expense.minor ? Number((BigInt(amount.minor) * 100n + BigInt(expense.minor) / 2n) / BigInt(expense.minor)) : 0;
    return { categoryId, amount, count: minors.length, percent };
  }).sort((a, b) => a.amount.minor === b.amount.minor ? a.categoryId.localeCompare(b.categoryId) : a.amount.minor > b.amount.minor ? -1 : 1);
  return { income, expense, net: subtractMoney(income, expense), count: rows.length, categories };
}
