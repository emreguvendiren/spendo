import { LedgerSnapshot } from '@/db/ledger';
import { Currency, money, subtractMoney } from '@/domain/money';
import { monthlyReport } from '@/features/reports/model';

export function budgetOverview(snapshot: LedgerSnapshot, month: string, currency: Currency) {
  const report = monthlyReport(snapshot, month, currency);
  return (snapshot.budgets ?? []).filter(budget => budget.month === month && budget.currency === currency).map(budget => {
    const spent = report.categories.find(item => item.categoryId === budget.category_id)?.amount ?? money(0, currency);
    const limit = money(budget.minor, currency);
    const remaining = subtractMoney(limit, spent);
    return { budget, limit, spent, remaining, exceeded: remaining.minor < 0, available: money(Math.abs(remaining.minor), currency), progress: Math.min(1, Number(BigInt(spent.minor) * 1000n / BigInt(limit.minor)) / 1000) };
  });
}
