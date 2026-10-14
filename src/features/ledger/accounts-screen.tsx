import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Button, Icon, SegmentedButtons } from 'react-native-paper';
import { AppText } from '@/components/app-text';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/action-button';
import { layout, spacing, radius, visual } from '@/theme/tokens';
import { FeatureIntro } from '@/components/feature-intro';
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
    contentContainerStyle={{ gap: spacing.md, padding: visual.pagePadding, paddingBottom: Math.max(insets.bottom, spacing.xl), maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center' }}
    ListHeaderComponent={<View style={{ gap: spacing.lg }}><LedgerStatus /><FeatureIntro icon="wallet-outline" title={t.accountOverview} body={t.accountsIntro} /><ActionButton title={t.addAccount} icon="plus" disabled={!snapshot} onPress={() => router.push('/account')} /><Button mode="outlined" icon="bank-transfer" accessibilityLabel={t.transfer} disabled={!snapshot} onPress={() => router.push('/transfer')}>{t.transfer}</Button><SegmentedButtons value={view} onValueChange={setView} buttons={[{ value: 'active', label: t.active }, { value: 'archived', label: t.archived }]} /></View>}
    ListEmptyComponent={snapshot ? <AppText>{t.emptyArchiveList}</AppText> : null}
    renderItem={({ item }) => {
      let balance: string;
      try { balance = displayAmount(accountBalance(snapshot!, item), preferences.language); } catch { balance = t.summaryError; }
      return <Pressable style={({ pressed }) => ({ backgroundColor: pressed ? colors.tint : colors.surface, padding: visual.panelPadding, borderRadius: radius.lg, gap: spacing.lg })}
        accessibilityRole="button" accessibilityLabel={`${t.renameAccount}: ${entityName(item, preferences.language)}, ${balance}`}
        onPress={() => router.push({ pathname: '/account', params: { id: item.id } })}
        ><View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}><Icon source={item.kind === 'credit' ? 'credit-card-outline' : item.kind === 'bank' ? 'bank-outline' : 'wallet-outline'} color={colors.accent} size={layout.icon} /><View style={{ flex: 1, gap: spacing.xs }}><AppText weight="semibold">{entityName(item, preferences.language)}</AppText><AppText variant="caption" muted>{t[item.kind]} · {item.currency}</AppText></View><Icon source="chevron-right" color={colors.muted} size={layout.icon} /></View><AppText variant="heading">{balance}</AppText></Pressable>;
    }} />;
}
