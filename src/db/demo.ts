import type { Account, RecordInput } from './ledger';
import { validateDay } from './ledger';
import { money } from '@/domain/money';

/** Synthetic fixtures only. Dates anchor once to the first development launch. */
export function demoData(day: string): { accounts: Account[]; records: RecordInput[] } {
  validateDay(day);
  const month = day.slice(0, 7);
  const previous = new Date(`${month}-01T12:00:00Z`);
  previous.setUTCDate(0);
  const previousDay = previous.toISOString().slice(0, 10);
  const accounts: Account[] = [
    { id: 'demo-bank', name: 'Örnek Banka', kind: 'bank', currency: 'TRY' },
    { id: 'demo-card', name: 'Örnek Kredi Kartı', kind: 'credit', currency: 'TRY' },
    { id: 'demo-usd', name: 'Örnek Dolar Hesabı', kind: 'bank', currency: 'USD' },
  ];
  const common = { occurredOn: day, source: 'import' as const };
  return { accounts, records: [
    { ...common, id: 'demo-opening-cash', kind: 'opening', accountId: 'default-cash', amount: money(100000, 'TRY'), note: 'Örnek nakit başlangıcı' },
    { ...common, id: 'demo-opening-bank', kind: 'opening', accountId: 'demo-bank', amount: money(1000000, 'TRY'), note: 'Örnek banka başlangıcı' },
    { ...common, id: 'demo-opening-usd', kind: 'opening', accountId: 'demo-usd', amount: money(10000, 'USD'), note: 'Örnek dolar başlangıcı' },
    { ...common, id: 'demo-salary', kind: 'income', accountId: 'demo-bank', categoryId: 'default-salary', amount: money(3500000, 'TRY'), occurredOn: `${month}-01`, note: 'Örnek maaş' },
    { ...common, id: 'demo-groceries', kind: 'expense', accountId: 'demo-card', categoryId: 'default-food', amount: money(85075, 'TRY'), note: 'Örnek market alışverişi' },
    { ...common, id: 'demo-coffee', kind: 'expense', accountId: 'default-cash', categoryId: 'default-food', amount: money(9550, 'TRY'), note: 'Örnek kahve' },
    { ...common, id: 'demo-transport', kind: 'expense', accountId: 'default-cash', categoryId: 'default-transport', amount: money(4200, 'TRY'), note: 'Örnek toplu taşıma' },
    { ...common, id: 'demo-bills', kind: 'expense', accountId: 'demo-bank', categoryId: 'default-bills', amount: money(120000, 'TRY'), note: 'Örnek elektrik ve internet faturası — uzun açıklama denemesi' },
    { ...common, id: 'demo-usd-expense', kind: 'expense', accountId: 'demo-usd', categoryId: 'default-general', amount: money(1599, 'USD'), note: 'Örnek dijital abonelik' },
    { ...common, id: 'demo-transfer', kind: 'transfer', accountId: 'demo-bank', targetId: 'default-cash', amount: money(200000, 'TRY'), targetAmount: money(200000, 'TRY'), note: 'Örnek nakit çekimi' },
    { ...common, id: 'demo-last-month', kind: 'expense', accountId: 'demo-bank', categoryId: 'default-food', amount: money(62000, 'TRY'), occurredOn: previousDay, note: 'Örnek geçen ay alışverişi' },
  ] };
}

/** Five preceding months; stable IDs let v2 extend an existing sample DB without replacing v1. */
export function demoHistory(day: string): { accounts: Account[]; records: RecordInput[] } {
  validateDay(day);
  const records: RecordInput[] = [];
  for (let offset = 1; offset <= 5; offset++) {
    const date = new Date(`${day.slice(0, 7)}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - offset);
    const month = date.toISOString().slice(0, 7);
    const common = { source: 'import' as const, occurredOn: `${month}-15` };
    const prefix = `demo-history-${offset}`;
    records.push(
      { ...common, id: `${prefix}-salary`, kind: 'income', accountId: 'demo-bank', categoryId: 'default-salary', amount: money((35000 - offset * 1000) * 100, 'TRY'), occurredOn: `${month}-01`, note: `Örnek ${month} maaş` },
      { ...common, id: `${prefix}-rent`, kind: 'expense', accountId: 'demo-bank', categoryId: 'default-bills', amount: money(1000000, 'TRY'), occurredOn: `${month}-05`, note: `Örnek ${month} kira` },
      { ...common, id: `${prefix}-food`, kind: 'expense', accountId: 'demo-card', categoryId: 'default-food', amount: money((1500 + offset * 250) * 100, 'TRY'), note: `Örnek ${month} market` },
      { ...common, id: `${prefix}-usd`, kind: 'expense', accountId: 'demo-usd', categoryId: 'default-general', amount: money(1299 + offset * 100, 'USD'), note: `Örnek ${month} abonelik` },
      { ...common, id: `${prefix}-transfer`, kind: 'transfer', accountId: 'demo-bank', targetId: 'default-cash', amount: money(100000, 'TRY'), targetAmount: money(100000, 'TRY'), note: `Örnek ${month} nakit çekimi` },
    );
  }
  return { accounts: [], records };
}
