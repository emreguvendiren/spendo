import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '@/features/preferences/provider';
import { spacing, layout } from '@/theme/tokens';
export function Screen({ children }: PropsWithChildren) {
  const { colors } = usePreferences();
  const insets = useSafeAreaInsets();
  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
    style={{ flex: 1, backgroundColor: colors.background }}
    contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: Math.max(insets.bottom, spacing.lg), flexGrow: 1 }}>
    <View style={{ width: '100%', maxWidth: layout.maxWidth, alignSelf: 'center', gap: spacing.lg }}>{children}</View>
  </ScrollView>;
}
