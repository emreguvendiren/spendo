import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { LedgerSnapshot } from '@/db/ledger';
import { Currency } from '@/domain/money';
import { AppText } from '@/components/app-text';
import { Panel } from '@/components/panel';
import { usePreferences } from '@/features/preferences/provider';
import { displayAmount } from '@/features/ledger/model';
import { layout, radius, spacing, visual } from '@/theme/tokens';
import { cashflowHistory } from './chart-model';
export function CashflowChart({ snapshot, month, currency }: { snapshot: LedgerSnapshot; month: string; currency: Currency }) {
  const { t, colors, preferences } = usePreferences();
  const [selected, setSelected] = useState(month);
  const [availableWidth, setAvailableWidth] = useState<number>(visual.chartWidth);
  let points: ReturnType<typeof cashflowHistory>;
  try { points = cashflowHistory(snapshot, month, currency); } catch { return <Panel><AppText variant="heading">{t.cashflowTrend}</AppText><AppText accessibilityRole="alert">{t.summaryError}</AppText></Panel>; }
  const current = points.find(point => point.month === selected) ?? points[points.length - 1];
  const monthText = (value: string, format: 'short' | 'long') => new Intl.DateTimeFormat(preferences.language, { month: format, ...(format === 'long' ? { year: 'numeric' as const } : {}), timeZone: 'UTC' }).format(new Date(`${value}-15T12:00:00Z`));
  const chartWidth = Math.max(visual.chartWidth, availableWidth);
  const step = chartWidth / points.length, width = step / 4;
  return <Panel>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}><AppText variant="heading">{t.cashflowTrend}</AppText><AppText muted variant="caption">{currency} · {t.lastSixMonths}</AppText></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>{[{ label: t.income, color: colors.income }, { label: t.expense, color: colors.accent }].map(item => <View key={item.label} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}><View style={{ width: visual.dot, height: visual.dot, borderRadius: visual.dot, backgroundColor: item.color }} /><AppText muted variant="caption">{item.label}</AppText></View>)}</View>
    <ScrollView horizontal onLayout={event => setAvailableWidth(event.nativeEvent.layout.width)} showsHorizontalScrollIndicator contentContainerStyle={{ paddingBottom: spacing.sm }}><View style={{ width: chartWidth, gap: spacing.sm }}>
    {points.some(point => point.income.minor || point.expense.minor) ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height={visual.chartHeight} viewBox={`0 0 ${chartWidth} ${visual.chartHeight}`}>
        {[0, 0.5, 1].map(ratio => <Line key={ratio} x1={0} x2={chartWidth} y1={ratio * (visual.chartHeight - spacing.xs) + spacing.xs} y2={ratio * (visual.chartHeight - spacing.xs) + spacing.xs} stroke={colors.separator} strokeWidth={1} />)}
        {points.map((point, index) => <ViewSvgBars key={point.month} index={index} step={step} width={width} income={point.incomeRatio} expense={point.expenseRatio} incomeColor={colors.income} expenseColor={colors.accent} />)}
      </Svg>
    </View> : <AppText muted>{t.chartEmpty}</AppText>}
    <View style={{ flexDirection: 'row' }}>{points.map(point => <Pressable key={point.month} accessibilityRole="button" accessibilityState={{ selected: current.month === point.month }} accessibilityLabel={`${monthText(point.month, 'long')}, ${t.income}: ${displayAmount(point.income, preferences.language)}, ${t.expense}: ${displayAmount(point.expense, preferences.language)}`} onPress={() => setSelected(point.month)} style={({ pressed }) => ({ flex: 1, minHeight: layout.touchTarget, minWidth: layout.touchTarget, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm, backgroundColor: current.month === point.month || pressed ? colors.tint : colors.surface })}><AppText variant="caption" style={{ fontSize: visual.axisSize, color: current.month === point.month ? colors.accent : colors.muted }}>{monthText(point.month, 'short')}</AppText></Pressable>)}</View>
    </View></ScrollView>
    <View accessibilityLiveRegion="polite" style={{ gap: spacing.xs, paddingTop: spacing.sm }}><AppText muted variant="caption">{monthText(current.month, 'long')}</AppText><AppText variant="caption">{t.income}: {displayAmount(current.income, preferences.language)} · {t.expense}: {displayAmount(current.expense, preferences.language)}</AppText></View>
  </Panel>;
}
function ViewSvgBars({ index, step, width, income, expense, incomeColor, expenseColor }: { index: number; step: number; width: number; income: number; expense: number; incomeColor: string; expenseColor: string }) {
  const plot = visual.chartHeight - spacing.sm;
  return <><Rect x={index * step + step / 4 - visual.chartGap / 2} y={visual.chartHeight - plot * income} width={width} height={plot * income} rx={visual.chartGap} fill={incomeColor} /><Rect x={index * step + step / 2 + visual.chartGap / 2} y={visual.chartHeight - plot * expense} width={width} height={plot * expense} rx={visual.chartGap} fill={expenseColor} /></>;
}
