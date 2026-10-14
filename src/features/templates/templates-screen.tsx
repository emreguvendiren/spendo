import { FlatList, Pressable, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from '@/features/ledger/provider';
import { LedgerStatus } from '@/features/ledger/status';
import { displayAmount, entityName } from '@/features/ledger/model';
import { controls, layout, spacing } from '@/theme/tokens';
import { templateUsable } from './model';
export default function TemplatesScreen() {
  const { snapshot, loading, refresh } = useLedger(); const { t, colors, preferences } = usePreferences(); const router = useRouter(); const insets = useSafeAreaInsets();
  return <FlatList contentInsetAdjustmentBehavior="automatic" data={snapshot?.templates ?? []} keyExtractor={item => item.id} refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }} style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: Math.max(insets.bottom, spacing.lg), width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', flexGrow: 1, gap: spacing.md }}
    ListHeaderComponent={<View style={{ gap: spacing.md }}><LedgerStatus showUndo={false} /><AppText muted>{t.templateHelp}</AppText><ActionButton title={t.addTemplate} icon="plus" disabled={!snapshot} onPress={() => router.push('/template')} /></View>}
    ListEmptyComponent={snapshot ? <AppText muted>{t.noTemplates}</AppText> : null}
    renderItem={({ item }) => {
      const usable = templateUsable(snapshot!, item), account = snapshot!.accounts.find(account => account.id === item.account_id), category = snapshot!.categories.find(category => category.id === item.category_id);
      return <View style={{ paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: controls.borderWidth, borderColor: colors.separator }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t.useTemplate}: ${item.name}, ${displayAmount(item, preferences.language)}`} disabled={!usable} onPress={() => router.push({ pathname: '/entry', params: { template: item.id } })} style={({ pressed }) => ({ gap: spacing.sm, minHeight: layout.touchTarget, backgroundColor: pressed ? colors.surface : colors.background })}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText weight="semibold">{item.name}</AppText><AppText>{displayAmount(item, preferences.language)}</AppText></View>
          <AppText muted variant="caption">{t[item.kind]} · {account ? entityName(account, preferences.language) : t.account} · {category ? entityName(category, preferences.language) : t.category}</AppText>
        </Pressable>
        {!usable && <AppText muted>{t.templateInactive}</AppText>}
        <Button accessibilityLabel={`${t.editTemplate}: ${item.name}`} onPress={() => router.push({ pathname: '/template', params: { id: item.id } })}>{t.editTemplate}</Button>
      </View>;
    }} />;
}
