import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const editable = row.kind === 'income' || row.kind === 'expense' || row.kind === 'transfer';
  const category = snapshot?.categories.find(item => item.id === row.category_id);
  const account = snapshot?.accounts.find(item => item.id === row.account_id);
  const target = snapshot?.accounts.find(item => item.id === row.target_id);
  const transfer = row.kind === 'transfer';
  const amountLabel = transfer && row.target_minor !== null && row.target_currency ? `${displayAmount(row, preferences.language)} → ${displayAmount({ minor: row.target_minor, currency: row.target_currency }, preferences.language)}` : displayAmount(row, preferences.language);
  const income = row.kind === 'income';
  const icon = transfer ? 'bank-transfer' : row.category_id === 'default-food' ? 'silverware-fork-knife' : row.category_id === 'default-transport' ? 'train-car' : row.category_id === 'default-bills' ? 'receipt-text-outline' : income ? 'arrow-bottom-left' : 'arrow-top-right';
  return <Pressable accessibilityRole={editable ? 'button' : undefined} disabled={!editable}
    accessibilityLabel={editable ? `${transfer ? t.editTransfer : t.editRecord}: ${row.note || t[row.kind]}, ${amountLabel}, ${row.occurred_on}` : undefined}
    onPress={() => router.push({ pathname: row.kind === 'transfer' ? '/transfer' : '/entry', params: { id: row.id } })}
    style={({ pressed }) => ({ backgroundColor: pressed ? colors.surface : colors.background, minHeight: layout.touchTarget, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', paddingVertical: spacing.md, borderBottomWidth: controls.borderWidth, borderColor: colors.separator })}>
    <View style={{ width: layout.iconBadge, height: layout.iconBadge, alignItems: 'center', justifyContent: 'center', backgroundColor: income ? colors.incomeTint : colors.surface, borderRadius: radius.md }}>
      <Icon source={icon} size={layout.icon} color={income ? colors.income : colors.muted} />
    </View>
    <View style={{ flex: 1, gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText weight="medium">{row.note || (category ? entityName(category, preferences.language) : t[row.kind])}</AppText>
        <AppText weight="semibold" accessibilityLabel={`${t[row.kind]} ${amountLabel}`} style={{ color: income ? colors.income : colors.text, fontVariant: ['tabular-nums'] }}>{income ? '+' : row.kind === 'expense' ? '−' : ''}{amountLabel}</AppText>
      </View>
      <AppText variant="caption" muted>{category ? entityName(category, preferences.language) : t[row.kind]}{account ? ` · ${entityName(account, preferences.language)}` : ''}{target ? ` → ${entityName(target, preferences.language)}` : ''}</AppText>
      <AppText variant="caption" muted>{row.occurred_on}</AppText>
    </View>
  </Pressable>;
}
