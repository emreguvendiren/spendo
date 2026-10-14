import { View } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { Goal } from '@/db/ledger';
import { AppText } from '@/components/app-text';
import { useLedger } from '@/features/ledger/provider';
import { usePreferences } from '@/features/preferences/provider';
import { displayAmount } from '@/features/ledger/model';
import { spacing } from '@/theme/tokens';
import { goalProgress } from './model';
export function GoalProgress({ goal }: { goal: Goal }) {
  const { snapshot } = useLedger(); const { t, colors, preferences } = usePreferences();
  let progress: ReturnType<typeof goalProgress>;
  try { progress = goalProgress(snapshot!, goal); } catch { return <AppText accessibilityRole="alert">{t.summaryError}</AppText>; }
  return <View style={{ gap: spacing.sm }}>
    <AppText>{t.goalSavedAmount}: {displayAmount(progress.saved, preferences.language)} / {displayAmount(progress.target, preferences.language)}</AppText>
    <AppText weight="semibold" style={{ color: progress.complete ? colors.income : colors.text }}>{progress.complete ? t.goalComplete : `${t.budgetRemaining}: ${displayAmount(progress.remaining, preferences.language)}`}</AppText>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><ProgressBar progress={progress.progress} color={colors.accent} /></View>
  </View>;
}
