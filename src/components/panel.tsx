import { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { usePreferences } from '@/features/preferences/provider';
import { radius, spacing, visual } from '@/theme/tokens';
export function Panel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = usePreferences();
  return <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, borderCurve: 'continuous', padding: visual.panelPadding, gap: spacing.md }, style]}>{children}</View>;
}
