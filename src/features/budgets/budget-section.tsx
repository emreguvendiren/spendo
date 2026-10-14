import { Pressable, View } from 'react-native';
import { Button, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Currency } from '@/domain/money';
import { AppText } from '@/components/app-text';
import { Panel } from '@/components/panel';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from '@/features/ledger/provider';
import { displayAmount, entityName } from '@/features/ledger/model';
import { controls, spacing, visual, radius } from '@/theme/tokens';
import { budgetOverview } from './model';

export function BudgetSection({ month, currency }: { month: string; currency: Currency }) {
  const { snapshot } = useLedger();
  const { t, colors, preferences } = usePreferences();
  const router = useRouter();
  let overview: ReturnType<typeof budgetOverview> | null = null;
  try { if (snapshot) overview = budgetOverview(snapshot, month, currency); } catch { /* Show explicit financial error. */ }
  return <View style={{ gap: spacing.md }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}><AppText variant="heading">{t.budgets}</AppText><Button icon="plus" accessibilityLabel={t.addBudget} onPress={() => router.push({ pathname: '/budget', params: { month, currency } })}>{t.addBudget}</Button></View>
    <Panel style={{ paddingVertical: spacing.sm }}>
    {overview ? overview.length ? overview.map(item => {
      const category = snapshot!.categories.find(category => category.id === item.budget.category_id);
      const name = category ? entityName(category, preferences.language) : t.category;
      const status = item.exceeded ? t.budgetExceeded : t.budgetRemaining;
      return <Pressable key={item.budget.category_id} accessibilityRole="button" accessibilityLabel={`${t.editBudget}: ${name}, ${t.budgetSpent}: ${displayAmount(item.spent, preferences.language)}, ${status}: ${displayAmount(item.available, preferences.language)}`} onPress={() => router.push({ pathname: '/budget', params: { month, currency, category: item.budget.category_id } })} style={({ pressed }) => ({ paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: controls.borderWidth, borderColor: colors.separator, backgroundColor: pressed ? colors.tint : colors.surface })}>
        <AppText weight="medium">{name}{category?.archived ? ` · ${t.archived}` : ''}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText muted>{t.budgetSpent}: {displayAmount(item.spent, preferences.language)}</AppText><AppText muted>{t.budgetLimit}: {displayAmount(item.limit, preferences.language)}</AppText></View>
        <AppText weight="semibold" style={{ color: item.exceeded ? colors.expense : colors.text }}>{status}: {displayAmount(item.available, preferences.language)}</AppText>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><ProgressBar style={{ height: visual.progressHeight, borderRadius: radius.sm }} progress={item.progress} color={item.exceeded ? colors.expense : colors.accent} /></View>
      </Pressable>;
    }) : <AppText muted>{t.noBudgets}</AppText> : <AppText accessibilityRole="alert">{t.summaryError}</AppText>}
    </Panel>
  </View>;
}
