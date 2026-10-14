import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '@/components/app-text';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from '@/features/ledger/provider';
import { displayAmount, entityName } from '@/features/ledger/model';
import { chartKeys, layout, spacing, visual } from '@/theme/tokens';
import { expenseSlices } from './chart-model';
import { monthlyReport } from './model';
export function ExpenseChart({ report }: { report: ReturnType<typeof monthlyReport> }) {
  const { t, colors, preferences } = usePreferences(); const { snapshot } = useLedger();
  const slices = expenseSlices(report), circumference = Math.PI * 2 * visual.ringRadius;

  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: visual.ringSize, height: visual.ringSize, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={visual.ringSize} height={visual.ringSize} style={{ position: 'absolute' }}><Circle cx={visual.ringCenter} cy={visual.ringCenter} r={visual.ringRadius} fill="none" stroke={colors.separator} strokeWidth={visual.ringStroke} />{slices.map((slice, index) => { const start = slices.slice(0, index).reduce((sum, item) => sum + item.ratio, 0); return <Circle key={slice.categoryId} cx={visual.ringCenter} cy={visual.ringCenter} r={visual.ringRadius} fill="none" stroke={colors[chartKeys[index]]} strokeWidth={visual.ringStroke} strokeDasharray={`${Math.max(0, slice.ratio * circumference - (slices.length > 1 ? visual.chartGap : 0))} ${circumference}`} strokeDashoffset={-start * circumference} transform={`rotate(-90 ${visual.ringCenter} ${visual.ringCenter})`} />; })}</Svg>
      <Icon source="chart-donut" color={colors.accent} size={layout.emptyIcon} />
    </View>
    <View style={{ flex: 1, minWidth: layout.summaryMinWidth, gap: spacing.md }}>{slices.map((slice, index) => { const category = snapshot?.categories.find(item => item.id === slice.categoryId); const name = slice.categoryId === '__other__' ? t.otherCategories : category ? entityName(category, preferences.language) : t.category;
      return <View key={slice.categoryId} accessible accessibilityLabel={`${name}: ${displayAmount(slice.amount, preferences.language)}, ${slice.percent}%`} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}><View style={{ width: visual.dot, height: visual.dot, marginTop: spacing.sm, borderRadius: visual.dot, backgroundColor: colors[chartKeys[index]] }} /><View style={{ flex: 1 }}><AppText variant="caption" weight="medium">{name}</AppText><AppText variant="caption" muted>{slice.percent}%</AppText></View></View>; })}</View>
  </View>;
}
