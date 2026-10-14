import { View } from 'react-native';
import { Button, Icon, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { LedgerStatus } from './status';
import { RecordItem } from './record-item';
import { monthSummary } from './model';
import { controls, layout, radius, spacing } from '@/theme/tokens';
export default function HomeScreen() {
  const { t, colors, preferences } = usePreferences();
  const { snapshot } = useLedger();
  const router = useRouter();
  let summary: ReturnType<typeof monthSummary> | null = null;
  try { if (snapshot) summary = monthSummary(snapshot, preferences.language); } catch { /* Render explicit overflow state. */ }
  return <Screen>
    <LedgerStatus />
    {snapshot && <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <AppText variant="heading">{t.thisMonth}</AppText>
        <AppText muted variant="caption">{new Intl.DateTimeFormat(preferences.language, { month: 'long', year: 'numeric' }).format(new Date())}</AppText>
      </View>
      {summary ? summary.map(item => <Surface elevation={0} key={item.currency} style={{ padding: spacing.lg, borderRadius: radius.panel, backgroundColor: colors.surface, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}><Icon source="arrow-top-right" size={layout.icon} color={colors.muted} /><AppText muted>{t.expense}</AppText></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.sm }}>
          <AppText variant="display" style={{ flexShrink: 1 }}>{item.expenseValue}</AppText><AppText muted>{item.currency}</AppText>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, paddingTop: spacing.lg, marginTop: spacing.md, borderTopWidth: controls.borderWidth, borderColor: colors.background }}>
          <View style={{ flexGrow: 1, minWidth: layout.summaryMinWidth, gap: spacing.sm }}><AppText muted variant="caption">{t.income}</AppText><AppText variant="heading" style={{ color: colors.income }}>{item.income}</AppText></View>
          <View style={{ flexGrow: 1, minWidth: layout.summaryMinWidth, gap: spacing.sm }}><AppText muted variant="caption">{t.monthlyNet}</AppText><AppText variant="heading">{item.net}</AppText></View>
        </View>
      </Surface>) : <AppText accessibilityRole="alert">{t.summaryError}</AppText>}
    </>}
    <ActionButton title={t.add} icon="plus" disabled={!snapshot} onPress={() => router.push('/entry')} />
    <Button accessibilityLabel={t.accounts} icon="wallet-outline" disabled={!snapshot} onPress={() => router.push('/accounts')}>{t.accounts}</Button>
    <Button accessibilityLabel={t.categories} icon="tag-outline" disabled={!snapshot} onPress={() => router.push('/categories')}>{t.categories}</Button>
    {snapshot && <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <AppText variant="heading">{t.recent}</AppText><Button onPress={() => router.push('/(tabs)/transactions')}>{t.viewAll}</Button>
      </View>
      {snapshot.records.length ? snapshot.records.slice(0, 5).map(row => <RecordItem row={row} key={row.id} />)
        : <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
          <View style={{ padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.tint }}><Icon source="wallet-outline" color={colors.accent} size={layout.emptyIcon} /></View>
          <AppText variant="heading">{t.startTracking}</AppText><AppText muted style={{ textAlign: 'center' }}>{t.startTrackingBody}</AppText>
        </View>}
    </View>}
  </Screen>;
}
