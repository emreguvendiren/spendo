import { Pressable, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/app-text';
import { Panel } from '@/components/panel';
import { SectionHeading } from '@/components/section-heading';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from '@/features/ledger/provider';
import { displayAmount, entityName, localDay } from '@/features/ledger/model';
import { controls, layout, spacing, visual, radius } from '@/theme/tokens';
import { homeOverview } from './home-model';

export function HomeSections() {
  const { snapshot } = useLedger(); const { t, colors, preferences } = usePreferences(); const router = useRouter();
  if (!snapshot) return null;
  const overview = homeOverview(snapshot, localDay());
  const header = (title: string, label: string, onPress: () => void) => <SectionHeading title={title} label={label} action={t.viewAll} onPress={onPress} />;
  const rowStyle = (pressed: boolean) => ({ gap: spacing.sm, minHeight: layout.touchTarget, paddingVertical: spacing.md, borderBottomWidth: controls.borderWidth, borderColor: colors.separator, backgroundColor: pressed ? colors.tint : colors.surface });
  return <>
    <View style={{ gap: spacing.sm }}>
      {header(t.budgets, t.budgets, () => router.push('/(tabs)/reports'))}
      <Panel style={{ paddingVertical: spacing.sm }}>
      {overview.budgets.error ? <AppText accessibilityRole="alert">{t.summaryError}</AppText> : overview.budgets.items.length ? overview.budgets.items.map(item => {
        const category = snapshot.categories.find(category => category.id === item.budget.category_id);
        const name = category ? entityName(category, preferences.language) : t.category, status = item.exceeded ? t.budgetExceeded : t.budgetRemaining;
        return <Pressable key={`${item.budget.category_id}-${item.budget.currency}`} accessibilityRole="button" accessibilityLabel={`${t.editBudget}: ${name}, ${t.budgetSpent}: ${displayAmount(item.spent, preferences.language)}, ${t.budgetLimit}: ${displayAmount(item.limit, preferences.language)}, ${status}: ${displayAmount(item.available, preferences.language)}`} onPress={() => router.push({ pathname: '/budget', params: { month: overview.month, currency: item.budget.currency, category: item.budget.category_id } })} style={({ pressed }) => rowStyle(pressed)}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText weight="medium">{name}{category?.archived ? ` · ${t.archived}` : ''}</AppText><AppText weight="semibold" style={{ color: item.exceeded ? colors.expense : colors.text }}>{status}: {displayAmount(item.available, preferences.language)}</AppText></View>
          <AppText muted variant="caption">{t.budgetSpent}: {displayAmount(item.spent, preferences.language)} / {t.budgetLimit}: {displayAmount(item.limit, preferences.language)}</AppText>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><ProgressBar style={{ height: visual.progressHeight, borderRadius: radius.sm }} progress={item.progress} color={item.exceeded ? colors.expense : colors.accent} /></View>
        </Pressable>;
      }) : <AppText muted>{t.homeNoBudgets}</AppText>}
      </Panel>
    </View>
    <View style={{ gap: spacing.sm }}>
      {header(t.goals, t.allGoals, () => router.push('/goals'))}
      <Panel style={{ paddingVertical: spacing.sm }}>
      {overview.goals.error ? <AppText accessibilityRole="alert">{t.summaryError}</AppText> : overview.goals.items.length ? overview.goals.items.map(item => <Pressable key={item.goal.id} accessibilityRole="button" accessibilityLabel={`${t.editGoal}: ${item.goal.name}, ${t.goalSavedAmount}: ${displayAmount(item.saved, preferences.language)}, ${t.goalTarget}: ${displayAmount(item.target, preferences.language)}, ${item.complete ? t.goalComplete : `${t.budgetRemaining}: ${displayAmount(item.remaining, preferences.language)}`}`} onPress={() => router.push({ pathname: '/goal', params: { id: item.goal.id } })} style={({ pressed }) => rowStyle(pressed)}>
        <AppText weight="medium">{item.goal.name}</AppText>
        <AppText muted>{t.goalSavedAmount}: {displayAmount(item.saved, preferences.language)} / {displayAmount(item.target, preferences.language)}</AppText>
        <AppText weight="semibold" style={{ color: item.complete ? colors.income : colors.text }}>{item.complete ? t.goalComplete : `${t.budgetRemaining}: ${displayAmount(item.remaining, preferences.language)}`}</AppText>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><ProgressBar style={{ height: visual.progressHeight, borderRadius: radius.sm }} progress={item.progress} color={colors.accent} /></View>
      </Pressable>) : <AppText muted>{t.noGoals}</AppText>}
      </Panel>
    </View>
    <View style={{ gap: spacing.sm }}>
      {header(t.quickTemplates, t.allTemplates, () => router.push('/templates'))}
      <Panel style={{ paddingVertical: spacing.sm }}>
      {overview.templates.length ? overview.templates.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${t.useTemplate}: ${item.name}, ${displayAmount(item, preferences.language)}`} onPress={() => router.push({ pathname: '/entry', params: { template: item.id } })} style={({ pressed }) => rowStyle(pressed)}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText weight="medium">{item.name}</AppText><AppText weight="semibold">{displayAmount(item, preferences.language)}</AppText></View><AppText muted variant="caption">{t[item.kind]} · {t.useTemplate}</AppText>
      </Pressable>) : <AppText muted>{t.homeNoTemplates}</AppText>}
      </Panel>
    </View>
  </>;
}
