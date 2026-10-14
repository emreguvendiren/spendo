import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { useLedger } from '@/features/ledger/provider';
import { LedgerStatus } from '@/features/ledger/status';
import { usePreferences } from '@/features/preferences/provider';
import { controls, layout, spacing } from '@/theme/tokens';
import { GoalProgress } from './goal-progress';
export default function GoalsScreen() {
  const { snapshot, refresh, loading } = useLedger(); const { t, colors } = usePreferences(); const router = useRouter();
  return <FlatList contentInsetAdjustmentBehavior="automatic" data={snapshot?.goals ?? []} keyExtractor={item => item.id} refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }} style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', flexGrow: 1 }}
    ListHeaderComponent={<View style={{ gap: spacing.md }}><LedgerStatus showUndo={false} /><AppText muted>{t.goalHelp}</AppText><ActionButton title={t.addGoal} icon="plus" disabled={!snapshot} onPress={() => router.push('/goal')} /></View>}
    ListEmptyComponent={snapshot ? <AppText muted>{t.noGoals}</AppText> : null}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${t.editGoal}: ${item.name}`} onPress={() => router.push({ pathname: '/goal', params: { id: item.id } })} style={({ pressed }) => ({ paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: controls.borderWidth, borderColor: colors.separator, backgroundColor: pressed ? colors.surface : colors.background })}><AppText variant="heading">{item.name}</AppText><GoalProgress goal={item} /></Pressable>} />;
}
