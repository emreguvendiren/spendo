import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { Panel } from '@/components/panel';
import { SectionHeading } from '@/components/section-heading';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { LedgerStatus } from './status';
import { RecordItem } from './record-item';
import { localDay, monthSummary } from './model';
import { controls, layout, radius, spacing, visual } from '@/theme/tokens';
import { HomeSections } from '@/features/overview/home-sections';
import { CashflowChart } from '@/features/reports/cashflow-chart';
export default function HomeScreen() {
  const { t, colors, preferences } = usePreferences(); const { snapshot } = useLedger(); const router = useRouter();
  const [selectedCurrency, setSelectedCurrency] = useState('TRY');
  let summary: ReturnType<typeof monthSummary> | null = null;
  try { if (snapshot) summary = monthSummary(snapshot, preferences.language); } catch { /* Explicit overflow. */ }
  const activeCurrency = summary?.some(item => item.currency === selectedCurrency) ? selectedCurrency : summary?.[0]?.currency;
  const shortcuts = [{ label: t.accounts, icon: 'wallet-outline', route: '/accounts' as const }, { label: t.categories, icon: 'shape-outline', route: '/categories' as const }, { label: t.goals, icon: 'bullseye-arrow', route: '/goals' as const }, { label: t.templates, icon: 'lightning-bolt-outline', route: '/templates' as const }];
  return <Screen>
    <LedgerStatus />
    {snapshot && <>
      <View style={{ gap: spacing.xs }}><SectionHeading title={t.financialOverview} action={t.add} onPress={() => router.push('/entry')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}><AppText muted variant="caption" style={{ flexGrow: 1 }}>{new Intl.DateTimeFormat(preferences.language, { month: 'long', year: 'numeric' }).format(new Date())}</AppText>{summary && summary.length > 1 && summary.map(item => <Pressable key={item.currency} accessibilityRole="button" accessibilityLabel={`${t.currency}: ${item.currency}`} accessibilityState={{ selected: item.currency === activeCurrency }} onPress={() => setSelectedCurrency(item.currency)} style={({ pressed }) => ({ minHeight: layout.touchTarget, minWidth: layout.touchTarget, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: item.currency === activeCurrency || pressed ? colors.tint : colors.surface })}><AppText weight="medium" variant="caption" style={{ color: item.currency === activeCurrency ? colors.accent : colors.muted }}>{item.currency}</AppText></Pressable>)}</View></View>
      {summary ? summary.filter(item => item.currency === activeCurrency).map(item => <Panel key={item.currency} style={{ backgroundColor: colors.hero, padding: spacing.lg, borderRadius: radius.panel, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}><AppText variant="caption" weight="medium" style={{ color: colors.heroMuted }}>{t.thisMonth} · {t.expense}</AppText><View style={{ backgroundColor: colors.heroInset, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}><AppText variant="caption" weight="medium" style={{ color: colors.onHero }}>{item.currency}</AppText></View></View>
        <AppText variant="display" style={{ color: colors.onHero }}>{item.expenseValue}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingTop: spacing.md, borderTopWidth: controls.borderWidth, borderColor: colors.heroInset }}>
          <View style={{ flex: 1, minWidth: visual.metricMinWidth, gap: spacing.sm }}><AppText variant="caption" style={{ color: colors.heroMuted }}>{t.income}</AppText><AppText weight="semibold" style={{ color: colors.onHero }}>{item.income}</AppText></View>
          <View style={{ flex: 1, minWidth: visual.metricMinWidth, gap: spacing.sm }}><AppText variant="caption" style={{ color: colors.heroMuted }}>{t.monthlyNet}</AppText><AppText weight="semibold" style={{ color: colors.onHero }}>{item.net}</AppText></View>
        </View>
      </Panel>) : <AppText accessibilityRole="alert">{t.summaryError}</AppText>}
    </>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{shortcuts.map(item => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.label} disabled={!snapshot} onPress={() => router.push(item.route)} style={({ pressed }) => ({ flex: 1, minWidth: visual.quickMinWidth, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, opacity: !snapshot ? controls.disabledOpacity : pressed ? controls.pressedOpacity : 1 })}><View style={{ width: layout.buttonHeight, height: layout.buttonHeight, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}><Icon source={item.icon} color={colors.accent} size={layout.icon} /></View><AppText variant="caption" style={{ textAlign: 'center' }}>{item.label}</AppText></Pressable>)}</View>
    {snapshot && summary?.filter(item => item.currency === activeCurrency).map(item => <CashflowChart key={item.currency} snapshot={snapshot} month={localDay().slice(0, 7)} currency={item.currency} />)}
    <HomeSections />
    {snapshot && <View style={{ gap: spacing.md }}><SectionHeading title={t.recent} action={t.viewAll} onPress={() => router.push('/(tabs)/transactions')} />
      <Panel style={{ paddingVertical: spacing.xs }}>{snapshot.records.length ? snapshot.records.slice(0, 5).map(row => <RecordItem row={row} key={row.id} />) : <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}><AppText variant="heading">{t.startTracking}</AppText><AppText muted>{t.startTrackingBody}</AppText></View>}</Panel>
    </View>}
  </Screen>;
}
