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
import { controls, layout, spacing, radius } from '@/theme/tokens';
import { FeatureIntro } from '@/components/feature-intro';
import { templateUsable } from './model';
export default function TemplatesScreen() {
  const { snapshot, loading, refresh } = useLedger(); const { t, colors, preferences } = usePreferences(); const router = useRouter(); const insets = useSafeAreaInsets();
  return <FlatList contentInsetAdjustmentBehavior="automatic" data={snapshot?.templates ?? []} keyExtractor={item => item.id} refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }} style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: Math.max(insets.bottom, spacing.lg), width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', flexGrow: 1 }}
    ListHeaderComponent={<View style={{ gap: spacing.lg, paddingBottom: spacing.lg }}><LedgerStatus showUndo={false} /><FeatureIntro icon="lightning-bolt-outline" title={t.templates} body={t.templatesIntro} /><ActionButton title={t.addTemplate} icon="plus" disabled={!snapshot} onPress={() => router.push('/template')} /><AppText muted variant="caption">{t.templateHelp}</AppText></View>}
    ListEmptyComponent={snapshot ? <AppText muted>{t.noTemplates}</AppText> : null}
    renderItem={({ item, index }) => {
      const usable = templateUsable(snapshot!, item), account = snapshot!.accounts.find(account => account.id === item.account_id), category = snapshot!.categories.find(category => category.id === item.category_id);
      const last = index === (snapshot?.templates?.length ?? 0) - 1;
      return <View style={{ padding: spacing.md, gap: spacing.sm, borderBottomWidth: last ? 0 : controls.borderWidth, borderColor: colors.separator, borderTopLeftRadius: index === 0 ? radius.lg : 0, borderTopRightRadius: index === 0 ? radius.lg : 0, borderBottomLeftRadius: last ? radius.lg : 0, borderBottomRightRadius: last ? radius.lg : 0, backgroundColor: colors.surface }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t.useTemplate}: ${item.name}, ${displayAmount(item, preferences.language)}`} disabled={!usable} onPress={() => router.push({ pathname: '/entry', params: { template: item.id } })} style={({ pressed }) => ({ gap: spacing.sm, minHeight: layout.touchTarget, backgroundColor: pressed ? colors.tint : colors.surface })}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText weight="semibold">{item.name}</AppText><AppText>{displayAmount(item, preferences.language)}</AppText></View>
          <AppText muted variant="caption">{t[item.kind]} · {account ? entityName(account, preferences.language) : t.account} · {category ? entityName(category, preferences.language) : t.category}</AppText>
        </Pressable>
        {!usable && <AppText muted>{t.templateInactive}</AppText>}
        <Button compact icon="pencil-outline" style={{ alignSelf: 'flex-start' }} accessibilityLabel={`${t.editTemplate}: ${item.name}`} onPress={() => router.push({ pathname: '/template', params: { id: item.id } })}>{t.editTemplate}</Button>
      </View>;
    }} />;
}
