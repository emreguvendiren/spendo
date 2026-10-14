import { Text, TextProps } from 'react-native';
import { usePreferences } from '@/features/preferences/provider';
import { typography } from '@/theme/tokens';
export function AppText({ variant = 'body', muted = false, style, ...props }: TextProps & { variant?: keyof typeof typography; muted?: boolean }) {
  const { colors } = usePreferences();
  return <Text selectable {...props} style={[{ color: muted ? colors.muted : colors.text, fontSize: typography[variant],
    fontWeight: variant === 'title' || variant === 'heading' || variant === 'amount' ? '600' : '400',
    ...(variant === 'amount' ? { fontVariant: ['tabular-nums'] as const } : {}) }, style]} />;
}
