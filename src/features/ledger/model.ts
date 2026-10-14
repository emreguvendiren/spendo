import { Account, Category, LedgerSnapshot, RecordRow } from '@/db/ledger';
import { amountText, money, subtractMoney, sumMoney } from '@/domain/money';
import { Language } from '@/i18n/messages';

export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function displayAmount(row: { minor: number; currency: RecordRow['currency'] }, language: Language) {
  return `${amountText(money(row.minor, row.currency), language)} ${row.currency}`;
}
export function monthSummary(snapshot: LedgerSnapshot, language: Language, day = localDay()) {
  const rows = snapshot.records.filter(row => row.occurred_on.slice(0, 7) === day.slice(0, 7));
  return [...new Set(snapshot.accounts.map(account => account.currency))].map(currency => {
    const total = (kind: 'income' | 'expense') => sumMoney(rows.filter(row => row.kind === kind && row.currency === currency)
      .map(row => money(row.minor, currency)), currency);
    const income = total('income'); const expense = total('expense');
    return { currency, income: displayAmount(income, language), expense: displayAmount(expense, language), expenseValue: amountText(expense, language),
      net: displayAmount(subtractMoney(income, expense), language) };
  });
}
const names: Record<Language, Record<string, string>> = {
  tr: { 'default-cash': 'Nakit', 'default-general': 'Genel', 'default-food': 'Yemek', 'default-transport': 'Ulaşım', 'default-bills': 'Faturalar', 'default-salary': 'Maaş', 'default-other-income': 'Diğer gelir' },
  en: { 'default-cash': 'Cash', 'default-general': 'General', 'default-food': 'Food', 'default-transport': 'Transport', 'default-bills': 'Bills', 'default-salary': 'Salary', 'default-other-income': 'Other income' },
};
export function entityName(entity: Account | Category, language: Language) { return names[language][entity.id] ?? entity.name; }
export function defaultAccount(snapshot: LedgerSnapshot): string {
  const recent = [...snapshot.records].sort((a, b) => b.created_at.localeCompare(a.created_at)).find(row => row.source === 'manual');
  return recent?.account_id ?? snapshot.accounts.find(account => account.id === 'default-cash')?.id ?? snapshot.accounts[0]?.id ?? '';
}
