import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, List, SegmentedButtons } from 'react-native-paper';
import { AppText } from '@/components/app-text';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/action-button';
import { layout, spacing } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { LedgerStatus } from './status';
import { accountBalance } from './account-model';
import { displayAmount, entityName } from './model';

export default function AccountsScreen() {
  const { snapshot, refresh, loading } = useLedger();
  const { t, preferences, colors } = usePreferences();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState('active');
  const rows = snapshot?.accounts.filter(account => view === 'archived' ? !!account.archived : !account.archived) ?? [];
  return <FlatList data={rows} keyExtractor={account => account.id} contentInsetAdjustmentBehavior="automatic"
    style={{ flex: 1, backgroundColor: colors.background }} refreshing={!!snapshot && loading} onRefresh={() => { void refresh(); }}
    contentContainerStyle={{ gap: spacing.sm, padding: spacing.lg, paddingBottom: Math.max(insets.bottom, spacing.lg), maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center' }}
    ListHeaderComponent={<View style={{ gap: spacing.md }}><LedgerStatus /><ActionButton title={t.addAccount} icon="plus" disabled={!snapshot} onPress={() => router.push('/account')} /><Button icon="bank-transfer" accessibilityLabel={t.transfer} disabled={!snapshot} onPress={() => router.push('/transfer')}>{t.transfer}</Button><SegmentedButtons value={view} onValueChange={setView} buttons={[{ value: 'active', label: t.active }, { value: 'archived', label: t.archived }]} /></View>}
    ListEmptyComponent={snapshot ? <AppText>{t.emptyArchiveList}</AppText> : null}
    renderItem={({ item }) => {
      let balance: string;
      try { balance = displayAmount(accountBalance(snapshot!, item), preferences.language); } catch { balance = t.summaryError; }
      return <List.Item title={entityName(item, preferences.language)} description={`${t[item.kind]} · ${balance}`} titleNumberOfLines={0} descriptionNumberOfLines={0}
        accessibilityRole="button" accessibilityLabel={`${t.renameAccount}: ${entityName(item, preferences.language)}, ${balance}`}
        onPress={() => router.push({ pathname: '/account', params: { id: item.id } })}
        left={props => <List.Icon {...props} icon={item.kind === 'credit' ? 'credit-card-outline' : item.kind === 'bank' ? 'bank-outline' : 'wallet-outline'} />}
        right={props => <List.Icon {...props} icon="chevron-right" />} />;
    }} />;
}
