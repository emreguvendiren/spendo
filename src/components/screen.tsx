import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '@/features/preferences/provider';
import { spacing, layout, visual, radius } from '@/theme/tokens';
export function Screen({ children, form = false }: PropsWithChildren<{ form?: boolean }>) {
  const { colors } = usePreferences();
  const insets = useSafeAreaInsets();
  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
    style={{ flex: 1, backgroundColor: colors.background }}
    contentContainerStyle={{ paddingHorizontal: visual.pagePadding, paddingTop: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.xl), flexGrow: 1 }}>
    <View style={{ width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', gap: form ? spacing.lg : visual.sectionGap, ...(form ? { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md } : {}) }}>{children}</View>
  </ScrollView>;
}
