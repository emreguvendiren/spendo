import { LedgerSnapshot } from '@/db/ledger';
import { amountText, money } from '@/domain/money';
import { Language, messages } from '@/i18n/messages';
import { displayAmount, entityName } from './model';

export type TransactionFilters = { query: string; kind: 'all' | 'income' | 'expense'; month: string; accountId: string; categoryId: string };
export const emptyTransactionFilters: TransactionFilters = { query: '', kind: 'all', month: '', accountId: '', categoryId: '' };
function normalize(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/ı/g, 'i');
}
export function transactionMonths(snapshot: LedgerSnapshot, current: string) {
  return [...new Set([current, ...snapshot.records.filter(row => !row.voided).map(row => row.occurred_on.slice(0, 7))])].sort().reverse();
}
export function filterTransactions(snapshot: LedgerSnapshot, filters: TransactionFilters, language: Language) {
  const accounts = new Map(snapshot.accounts.map(item => [item.id, entityName(item, language)]));
  const categories = new Map(snapshot.categories.map(item => [item.id, entityName(item, language)]));
  const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return snapshot.records.filter(row => {
    if (row.voided || (filters.kind !== 'all' && row.kind !== filters.kind) || (filters.month && row.occurred_on.slice(0, 7) !== filters.month)
      || (filters.accountId && row.account_id !== filters.accountId && row.target_id !== filters.accountId)
      || (filters.categoryId && row.category_id !== filters.categoryId)) return false;
    if (!tokens.length) return true;
    const text = normalize([
      row.note, messages[language][row.kind], row.occurred_on, accounts.get(row.account_id), accounts.get(row.target_id ?? ''), categories.get(row.category_id ?? ''),
      displayAmount(row, language), amountText(money(row.minor, row.currency), language),
      row.target_currency && row.target_minor !== null ? `${displayAmount({ minor: row.target_minor, currency: row.target_currency }, language)} ${amountText(money(row.target_minor, row.target_currency), language)}` : '',
    ].filter(Boolean).join(' '));
    return tokens.every(token => text.includes(token));
  });
}
