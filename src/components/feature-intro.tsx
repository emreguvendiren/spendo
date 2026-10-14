import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import { AppText } from './app-text';
import { usePreferences } from '@/features/preferences/provider';
import { layout, radius, spacing } from '@/theme/tokens';
export function FeatureIntro({ icon, title, body }: { icon: string; title: string; body?: string }) {
  const { colors } = usePreferences();
  return <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
    <View style={{ width: layout.iconBadge, height: layout.iconBadge, borderRadius: radius.md, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}><Icon source={icon} color={colors.accent} size={layout.icon} /></View>
    <View style={{ flex: 1, gap: spacing.xs }}><AppText variant="heading">{title}</AppText>{body && <AppText variant="caption" muted>{body}</AppText>}</View>
  </View>;
}
