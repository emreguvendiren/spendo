import { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, ProgressBar, Surface } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { useRouter } from 'expo-router';
import { Currency } from '@/domain/money';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { Screen } from '@/components/screen';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from '@/features/ledger/provider';
import { LedgerStatus } from '@/features/ledger/status';
import { BudgetSection } from '@/features/budgets/budget-section';
import { displayAmount, entityName, localDay } from '@/features/ledger/model';
import { controls, layout, radius, spacing } from '@/theme/tokens';
import { monthlyReport, moveMonth, reportCurrencies } from './model';

export default function ReportsScreen() {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus showUndo={false} /></Screen>;
  return <ReportContent />;
}
function ReportContent() {
  const { snapshot } = useLedger();
  const { t, colors, preferences, isDark } = usePreferences();
  const router = useRouter();
  const [month, setMonth] = useState(() => localDay().slice(0, 7));
  const [chosenCurrency, setChosenCurrency] = useState<Currency>('TRY');
  const currencies = reportCurrencies(snapshot!);
  const currency = currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0] ?? 'TRY';
  const label = new Intl.DateTimeFormat(preferences.language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-15T12:00:00Z`));
  let report: ReturnType<typeof monthlyReport> | null = null;
  try { report = monthlyReport(snapshot!, month, currency); } catch { /* Explicit financial overflow state. */ }
  return <Screen>
    <LedgerStatus showUndo={false} />
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
      <IconButton icon="chevron-left" accessibilityLabel={t.previousMonth} disabled={moveMonth(month, -1) === month} onPress={() => setMonth(moveMonth(month, -1))} />
      <AppText variant="heading" style={{ flex: 1 }} accessibilityLiveRegion="polite">{label}</AppText>
      <IconButton icon="chevron-right" accessibilityLabel={t.nextMonth} disabled={moveMonth(month, 1) === month} onPress={() => setMonth(moveMonth(month, 1))} />
    </View>
    <Button accessibilityLabel={t.thisMonth} disabled={month === localDay().slice(0, 7)} onPress={() => setMonth(localDay().slice(0, 7))}>{t.thisMonth}</Button>
    <View style={{ gap: spacing.sm }}><AppText>{t.currency}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
        <Picker testID="report-currency" selectedValue={currency} onValueChange={value => setChosenCurrency(value)}>
          {(currencies.length ? currencies : ['TRY']).map(code => <Picker.Item key={code} value={code} label={code} />)}
        </Picker>
      </Host>
    </View>
    {report ? <>
      <Surface elevation={0} style={{ padding: spacing.lg, gap: spacing.md, borderRadius: radius.panel, backgroundColor: colors.surface }}>
        <AppText variant="heading">{t.monthOverview}</AppText>
        {([{ label: t.income, value: report.income, color: colors.income }, { label: t.expense, value: report.expense, color: colors.expense }, { label: t.monthlyNet, value: report.net, color: colors.text }]).map(item => <View key={item.label} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}>
          <AppText muted>{item.label}</AppText><AppText weight="semibold" style={{ color: item.color }}>{displayAmount(item.value, preferences.language)}</AppText>
        </View>)}
        <AppText muted variant="caption">{t.transactionCount}: {report.count}</AppText>
      </Surface>
      {!report.count && <View style={{ gap: spacing.md }}><AppText>{t.reportEmpty}</AppText><ActionButton title={t.add} icon="plus" onPress={() => router.push('/entry')} /></View>}
      <BudgetSection month={month} currency={currency} />
      <AppText variant="heading">{t.categorySpending}</AppText>
      {report.categories.length ? report.categories.map(item => {
        const category = snapshot!.categories.find(category => category.id === item.categoryId);
        const name = category ? entityName(category, preferences.language) : t.category;
        return <View key={item.categoryId} accessible accessibilityLabel={`${name}: ${displayAmount(item.amount, preferences.language)}, ${item.percent}%, ${t.transactionCount}: ${item.count}`} style={{ gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: controls.borderWidth, borderColor: colors.separator }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText weight="medium">{name}</AppText><AppText weight="semibold">{displayAmount(item.amount, preferences.language)}</AppText></View>
          <AppText muted variant="caption">{item.percent}% · {t.transactionCount}: {item.count}</AppText>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><ProgressBar progress={item.percent / 100} color={colors.accent} /></View>
        </View>;
      }) : <AppText muted>{t.noCategorySpending}</AppText>}
      <AppText muted variant="caption">{t.reportHelp}</AppText>
    </> : <AppText accessibilityRole="alert">{t.summaryError}</AppText>}
  </Screen>;
}
