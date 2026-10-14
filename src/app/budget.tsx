import { Stack, useLocalSearchParams } from 'expo-router';
import BudgetScreen from '@/features/budgets/budget-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function BudgetRoute() {
  const params = useLocalSearchParams<{ month?: string | string[]; currency?: string | string[]; category?: string | string[] }>();
  const first = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
  const { t } = usePreferences();
  return <><Stack.Screen options={{ title: params.category ? t.editBudget : t.addBudget }} /><BudgetScreen month={first(params.month)} currency={first(params.currency)} categoryId={first(params.category)} /></>;
}
