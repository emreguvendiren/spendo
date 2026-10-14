import { Account, LedgerSnapshot } from '@/db/ledger';
import { Currency, MoneyError, money, parseAmount, sumMoney } from '@/domain/money';
import { Language } from '@/i18n/messages';

export function parseOpening(text: string, currency: Currency, language: Language) {
  const raw = text.trim();
  const negative = raw.startsWith('-');
  try {
    const amount = parseAmount(negative ? raw.slice(1) : raw, currency, language);
    return money(negative ? -amount.minor : amount.minor, currency);
  } catch (error) {
    if (error instanceof MoneyError && error.code === 'positive') return money(0, currency);
    throw error;
  }
}
export function accountBalance(snapshot: LedgerSnapshot, account: Account) {
  const entries = snapshot.records.flatMap(row => {
    const amounts = [];
    if (row.account_id === account.id) amounts.push(money(row.kind === 'expense' || row.kind === 'transfer' ? -row.minor : row.minor, row.currency));
    if (row.target_id === account.id && row.target_minor !== null && row.target_currency) amounts.push(money(row.target_minor, row.target_currency));
    return amounts;
  });
  return sumMoney(entries, account.currency);
}
