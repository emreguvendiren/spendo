import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import { RecordRow } from '@/db/ledger';
import { AppText } from '@/components/app-text';
import { usePreferences } from '@/features/preferences/provider';
import { controls, layout, radius, spacing } from '@/theme/tokens';
import { displayAmount, entityName } from './model';
import { useLedger } from './provider';
export function RecordItem({ row }: { row: RecordRow }) {
  const { t, colors, preferences } = usePreferences();
  const { snapshot } = useLedger();
  const category = snapshot?.categories.find(item => item.id === row.category_id);
  const account = snapshot?.accounts.find(item => item.id === row.account_id);
  const income = row.kind === 'income';
  const icon = row.category_id === 'default-food' ? 'silverware-fork-knife' : row.category_id === 'default-transport' ? 'train-car' : row.category_id === 'default-bills' ? 'receipt-text-outline' : income ? 'arrow-bottom-left' : 'arrow-top-right';
  return <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingVertical: spacing.md, borderBottomWidth: controls.borderWidth, borderColor: colors.separator }}>
    <View style={{ width: layout.iconBadge, height: layout.iconBadge, alignItems: 'center', justifyContent: 'center', backgroundColor: income ? colors.incomeTint : colors.surface, borderRadius: radius.md }}>
      <Icon source={icon} size={layout.icon} color={income ? colors.income : colors.muted} />
    </View>
    <View style={{ flex: 1, gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText style={{ fontWeight: '600' }}>{row.note || (category ? entityName(category, preferences.language) : t[row.kind])}</AppText>
        <AppText accessibilityLabel={`${t[row.kind]} ${displayAmount(row, preferences.language)}`} style={{ color: income ? colors.income : colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{income ? '+' : row.kind === 'expense' ? '−' : ''}{displayAmount(row, preferences.language)}</AppText>
      </View>
      <AppText variant="caption" muted>{category ? entityName(category, preferences.language) : t[row.kind]}{account ? ` · ${entityName(account, preferences.language)}` : ''}</AppText>
      <AppText variant="caption" muted>{row.occurred_on}</AppText>
    </View>
  </View>;
}
