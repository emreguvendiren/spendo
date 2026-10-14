import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { List, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton } from '@/components/action-button';
import { AppText } from '@/components/app-text';
import { layout, spacing } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { LedgerStatus } from './status';
import { entityName } from './model';

export default function CategoriesScreen() {
  const { snapshot, loading, refresh } = useLedger();
  const { t, colors, preferences } = usePreferences();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [view, setView] = useState('active');
  const rows = snapshot?.categories.filter(category => category.kind === kind && (view === 'archived' ? !!category.archived : !category.archived)) ?? [];
  return <FlatList data={rows} keyExtractor={category => category.id} contentInsetAdjustmentBehavior="automatic"
    style={{ flex: 1, backgroundColor: colors.background }} refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }}
    contentContainerStyle={{ gap: spacing.sm, padding: spacing.lg, paddingBottom: Math.max(insets.bottom, spacing.lg), maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center', flexGrow: 1 }}
    ListHeaderComponent={<View style={{ gap: spacing.md }}><LedgerStatus /><ActionButton title={t.addCategory} icon="plus" disabled={!snapshot} onPress={() => router.push('/category')} />
      <SegmentedButtons value={kind} onValueChange={setKind} buttons={[{ value: 'expense', label: t.expense }, { value: 'income', label: t.income }]} />
      <SegmentedButtons value={view} onValueChange={setView} buttons={[{ value: 'active', label: t.active }, { value: 'archived', label: t.archived }]} />
    </View>}
    ListEmptyComponent={snapshot ? <AppText>{t.noCategories}</AppText> : null}
    renderItem={({ item }) => <List.Item title={entityName(item, preferences.language)} description={t[item.kind]} titleNumberOfLines={0}
      accessibilityRole="button" accessibilityLabel={`${t.renameCategory}: ${entityName(item, preferences.language)}`}
      left={props => <List.Icon {...props} icon="tag-outline" />} right={props => <List.Icon {...props} icon="chevron-right" />}
      onPress={() => router.push({ pathname: '/category', params: { id: item.id } })} />} />;
}
