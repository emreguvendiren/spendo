import { View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { usePreferences } from '@/features/preferences/provider';
import { spacing } from '@/theme/tokens';
export default function HomeScreen() {
  const { t, colors, preferences } = usePreferences();
  const zero = new Intl.NumberFormat(preferences.language, { style: 'currency', currency: 'TRY' }).format(0);
  return <Screen>
    <View style={{ gap: spacing.sm }}><AppText variant="title">{t.greeting}</AppText><AppText muted>{t.intro}</AppText></View>
    <View style={{ paddingVertical: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.separator }}>
      <AppText muted variant="caption">{t.thisMonth}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
        {[t.expense, t.income].map(label => <View key={label} style={{ flexGrow: 1, gap: spacing.sm }}>
          <AppText muted>{label}</AppText><AppText variant="amount">{zero}</AppText>
        </View>)}
      </View>
    </View>
    <AppText variant="heading">{t.recent}</AppText>
    <View style={{ gap: spacing.sm }}><AppText>{t.noTransactions}</AppText><AppText muted>{t.noTransactionsBody}</AppText></View>
    <AppText variant="caption" muted>{t.phaseNote}</AppText>
  </Screen>;
}
