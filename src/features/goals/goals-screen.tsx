import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { useLedger } from '@/features/ledger/provider';
import { LedgerStatus } from '@/features/ledger/status';
import { usePreferences } from '@/features/preferences/provider';
import { layout, spacing, radius, visual } from '@/theme/tokens';
import { FeatureIntro } from '@/components/feature-intro';
import { GoalProgress } from './goal-progress';
export default function GoalsScreen() {
  const { snapshot, refresh, loading } = useLedger(); const { t, colors } = usePreferences(); const router = useRouter();
  return <FlatList contentInsetAdjustmentBehavior="automatic" data={snapshot?.goals ?? []} keyExtractor={item => item.id} refreshing={loading && !!snapshot} onRefresh={() => { void refresh(); }} style={{ backgroundColor: colors.background, flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', flexGrow: 1 }}
    ListHeaderComponent={<View style={{ gap: spacing.lg }}><LedgerStatus showUndo={false} /><FeatureIntro icon="bullseye-arrow" title={t.goals} body={t.goalsIntro} /><ActionButton title={t.addGoal} icon="plus" disabled={!snapshot} onPress={() => router.push('/goal')} /><AppText muted variant="caption">{t.goalHelp}</AppText></View>}
    ListEmptyComponent={snapshot ? <AppText muted>{t.noGoals}</AppText> : null}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${t.editGoal}: ${item.name}`} onPress={() => router.push({ pathname: '/goal', params: { id: item.id } })} style={({ pressed }) => ({ padding: visual.panelPadding, borderRadius: radius.lg, gap: spacing.md, backgroundColor: pressed ? colors.tint : colors.surface })}><AppText variant="heading">{item.name}</AppText><GoalProgress goal={item} /></Pressable>} />;
}
