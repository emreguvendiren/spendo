import { useState } from 'react';
import { FlatList, Keyboard, View } from 'react-native';
import { Button, Searchbar, SegmentedButtons } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '@/features/preferences/provider';
import { AppText } from '@/components/app-text';
import { layout, spacing, radius, visual } from '@/theme/tokens';
import { useLedger } from './provider';
import { LedgerStatus } from './status';
import { RecordItem } from './record-item';
import { emptyTransactionFilters, filterTransactions, transactionMonths, TransactionFilters } from './transaction-filters';
import { entityName, localDay } from './model';
export default function TransactionsScreen() {
  const { snapshot, loading, refresh } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<TransactionFilters>(emptyTransactionFilters);
  const [expanded, setExpanded] = useState(false);
  const rows = snapshot ? filterTransactions(snapshot, filters, preferences.language) : [];
  const filterCount = Number(!!filters.query.trim()) + Number(filters.kind !== 'all') + Number(!!filters.month) + Number(!!filters.accountId) + Number(!!filters.categoryId);
  const monthLabel = (month: string) => new Intl.DateTimeFormat(preferences.language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-15T12:00:00Z`));
  const months = snapshot ? [...new Set([...transactionMonths(snapshot, localDay().slice(0, 7)), ...(filters.month ? [filters.month] : [])])].sort().reverse() : [];
  function picker(field: 'month' | 'accountId' | 'categoryId', label: string, options: { value: string; label: string }[]) {
    return <View style={{ gap: spacing.sm }}><AppText>{label}</AppText><Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
      <Picker testID={`transactions-${field}`} selectedValue={filters[field]} onValueChange={value => setFilters(previous => ({ ...previous, [field]: value }))}>
        <Picker.Item value="" label={t.all} />{options.map(option => <Picker.Item key={option.value} value={option.value} label={option.label} />)}
      </Picker>
    </Host></View>;
  }
  return <FlatList data={rows} keyExtractor={row => row.id} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
    style={{ flex: 1, backgroundColor: colors.background }}
    contentContainerStyle={{ padding: visual.pagePadding, paddingBottom: Math.max(insets.bottom, spacing.xl), width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', flexGrow: 1 }}
    refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }}
    ListHeaderComponent={<View style={{ gap: spacing.md }}>
      <LedgerStatus />
      <Searchbar style={{ backgroundColor: colors.surface, borderRadius: radius.md }} accessibilityLabel={t.searchTransactions} placeholder={t.searchTransactions} value={filters.query} onChangeText={query => setFilters(previous => ({ ...previous, query }))} maxLength={160} />
      <SegmentedButtons value={filters.kind} onValueChange={value => setFilters(previous => ({ ...previous, kind: value as TransactionFilters['kind'], categoryId: value !== 'all' && snapshot?.categories.find(item => item.id === previous.categoryId)?.kind !== value ? '' : previous.categoryId }))} buttons={[{ value: 'all', label: t.all }, { value: 'expense', label: t.expense }, { value: 'income', label: t.income }]} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
        <Button icon="filter-variant" accessibilityLabel={t.filters} accessibilityState={{ expanded }} onPress={() => { Keyboard.dismiss(); setExpanded(value => !value); }}>{t.filters}{filterCount ? ` (${filterCount})` : ''}</Button>
        <Button accessibilityLabel={t.clearFilters} disabled={!filterCount} onPress={() => { Keyboard.dismiss(); setFilters(emptyTransactionFilters); }}>{t.clearFilters}</Button>
      </View>
      {expanded && snapshot && <View style={{ gap: spacing.md }}>
        {picker('month', t.month, months.map(month => ({ value: month, label: monthLabel(month) })))}
        {picker('accountId', t.account, snapshot.accounts.map(account => ({ value: account.id, label: `${entityName(account, preferences.language)} · ${account.currency}${account.archived ? ` · ${t.archived}` : ''}` })))}
        {picker('categoryId', t.category, snapshot.categories.filter(category => filters.kind === 'all' || category.kind === filters.kind).map(category => ({ value: category.id, label: `${entityName(category, preferences.language)} · ${t[category.kind]}${category.archived ? ` · ${t.archived}` : ''}` })))}
      </View>}
      {snapshot && <AppText muted variant="caption" accessibilityLiveRegion="polite">{rows.length} {t.searchResults}</AppText>}
      <Button icon="plus" accessibilityLabel={t.add} disabled={!snapshot} onPress={() => router.push('/entry')}>{t.add}</Button>
    </View>}
    ListEmptyComponent={snapshot ? <View style={{ gap: spacing.sm, paddingVertical: spacing.lg }}><AppText>{snapshot.records.length ? t.noMatches : t.noTransactions}</AppText><AppText muted>{snapshot.records.length ? t.noMatchesBody : t.noTransactionsBody}</AppText></View> : null}
    renderItem={({ item, index }) => <View>
      {(index === 0 || rows[index - 1].occurred_on !== item.occurred_on) && <AppText variant="caption" weight="medium" muted style={{ paddingTop: spacing.lg, paddingBottom: spacing.sm }}>{new Intl.DateTimeFormat(preferences.language, { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${item.occurred_on}T12:00:00Z`))}</AppText>}
      <View style={{ backgroundColor: colors.surface, paddingHorizontal: spacing.md, borderTopLeftRadius: index === 0 || rows[index - 1].occurred_on !== item.occurred_on ? radius.lg : 0, borderTopRightRadius: index === 0 || rows[index - 1].occurred_on !== item.occurred_on ? radius.lg : 0, borderBottomLeftRadius: index === rows.length - 1 || rows[index + 1].occurred_on !== item.occurred_on ? radius.lg : 0, borderBottomRightRadius: index === rows.length - 1 || rows[index + 1].occurred_on !== item.occurred_on ? radius.lg : 0 }}><RecordItem row={item} /></View>
    </View>} />;
}
