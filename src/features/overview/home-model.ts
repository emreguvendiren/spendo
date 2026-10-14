import { LedgerSnapshot } from '@/db/ledger';
import { budgetOverview } from '@/features/budgets/model';
import { goalProgress } from '@/features/goals/model';
import { templateUsable } from '@/features/templates/model';
import { homePreview } from '@/theme/tokens';

function safely<T>(build: () => T[]) {
  try { return { items: build(), error: false }; } catch { return { items: [] as T[], error: true }; }
}
export function homeOverview(snapshot: LedgerSnapshot, day: string) {
  const month = day.slice(0, 7);
  const currencies = [...new Set((snapshot.budgets ?? []).filter(item => item.month === month).map(item => item.currency))];
  const budgets = safely(() => currencies.flatMap(currency => budgetOverview(snapshot, month, currency))
    .sort((a, b) => Number(b.exceeded) - Number(a.exceeded) || b.progress - a.progress || a.budget.category_id.localeCompare(b.budget.category_id) || a.budget.currency.localeCompare(b.budget.currency))
    .slice(0, homePreview.budgets));
  const goals = safely(() => (snapshot.goals ?? []).filter(goal => !goal.deleted).map(goal => ({ goal, ...goalProgress(snapshot, goal) }))
    .sort((a, b) => Number(a.complete) - Number(b.complete) || b.progress - a.progress || a.goal.name.localeCompare(b.goal.name) || a.goal.id.localeCompare(b.goal.id))
    .slice(0, homePreview.goals));
  const templates = (snapshot.templates ?? []).filter(item => templateUsable(snapshot, item)).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)).slice(0, homePreview.templates);
  return { month, budgets, goals, templates };
}
