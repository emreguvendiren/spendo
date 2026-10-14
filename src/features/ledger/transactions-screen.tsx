import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '@/features/preferences/provider';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { layout, spacing } from '@/theme/tokens';
import { useLedger } from './provider';
import { LedgerStatus } from './status';
import { RecordItem } from './record-item';
export default function TransactionsScreen() {
  const { snapshot, loading, refresh } = useLedger();
  const { t, colors } = usePreferences();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const rows = snapshot?.records.filter(row => filter === 'all' || row.kind === filter) ?? [];
  return <FlatList data={rows} keyExtractor={row => row.id} contentInsetAdjustmentBehavior="automatic"
    style={{ flex: 1, backgroundColor: colors.background }}
    contentContainerStyle={{ padding: spacing.lg, paddingBottom: Math.max(insets.bottom, spacing.lg), width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', flexGrow: 1 }}
    refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }}
    ListHeaderComponent={<View style={{ gap: spacing.md }}>
      <ActionButton title={t.add} icon="plus" disabled={!snapshot} onPress={() => router.push('/entry')} />
      <LedgerStatus />
      <SegmentedButtons value={filter} onValueChange={setFilter} buttons={[{ value: 'all', label: t.all }, { value: 'expense', label: t.expense }, { value: 'income', label: t.income }]} />
    </View>}
    ListEmptyComponent={snapshot ? <View style={{ gap: spacing.sm, paddingVertical: spacing.lg }}><AppText>{t.noTransactions}</AppText><AppText muted>{t.noTransactionsBody}</AppText></View> : null}
    renderItem={({ item, index }) => <View>
      {(index === 0 || rows[index - 1].occurred_on !== item.occurred_on) && <AppText variant="heading" style={{ paddingTop: spacing.lg }}>{item.occurred_on}</AppText>}
      <RecordItem row={item} />
    </View>} />;
}
