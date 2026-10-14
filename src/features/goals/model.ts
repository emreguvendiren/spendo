import { Goal, LedgerSnapshot } from '@/db/ledger';
import { money, subtractMoney, sumMoney } from '@/domain/money';
export function goalProgress(snapshot: LedgerSnapshot, goal: Goal) {
  const saved = sumMoney((snapshot.contributions ?? []).filter(item => item.goal_id === goal.id && !item.voided).map(item => money(item.minor, goal.currency)), goal.currency);
  const target = money(goal.target_minor, goal.currency);
  const difference = subtractMoney(target, saved);
  return { saved, target, remaining: money(Math.max(0, difference.minor), goal.currency), complete: saved.minor >= target.minor, progress: Math.min(1, Number(BigInt(saved.minor) * 1000n / BigInt(target.minor)) / 1000) };
}
