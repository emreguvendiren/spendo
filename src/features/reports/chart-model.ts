import { LedgerSnapshot } from '@/db/ledger';
import { Currency, sumMoney } from '@/domain/money';
import { monthlyReport, moveMonth } from './model';

// Money remains exact; only chart coordinates use a bounded visual ratio.
export function visualRatio(value: number, total: number) {
  return total > 0 ? Number(BigInt(value) * 1000000n / BigInt(total)) / 1000000 : 0;
}
export function cashflowHistory(snapshot: LedgerSnapshot, endMonth: string, currency: Currency) {
  const months = [endMonth];
  for (let index = 1; index < 6; index++) { const previous = moveMonth(months[0], -1); if (previous === months[0]) break; months.unshift(previous); }
  const points = months.map(month => { const report = monthlyReport(snapshot, month, currency); return { month, income: report.income, expense: report.expense }; });
  const max = Math.max(0, ...points.flatMap(point => [point.income.minor, point.expense.minor]));
  return points.map(point => ({ ...point, incomeRatio: visualRatio(point.income.minor, max), expenseRatio: visualRatio(point.expense.minor, max) }));
}
export function expenseSlices(report: ReturnType<typeof monthlyReport>) {
  const first = report.categories.slice(0, 4).map(item => ({ categoryId: item.categoryId, amount: item.amount, percent: item.percent }));
  const remainder = report.categories.slice(4);
  if (remainder.length) { const amount = sumMoney(remainder.map(item => item.amount), report.expense.currency); first.push({ categoryId: '__other__', amount, percent: Math.round(visualRatio(amount.minor, report.expense.minor) * 100) }); }
  return first.map(item => ({ ...item, ratio: visualRatio(item.amount.minor, report.expense.minor) }));
}
