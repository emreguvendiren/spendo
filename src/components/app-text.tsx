import { Text, TextProps } from 'react-native';
import { usePreferences } from '@/features/preferences/provider';
import { typography, textMetrics, fontFaces } from '@/theme/tokens';
import { useFontFaces } from '@/theme/fonts';
export function AppText({ variant = 'body', muted = false, weight, style, ...props }: TextProps & { variant?: keyof typeof typography; muted?: boolean; weight?: keyof typeof fontFaces }) {
  const { colors } = usePreferences();
  const faces = useFontFaces();
  const face = weight ?? (['title', 'heading', 'amount', 'display'].includes(variant) ? 'semibold' : 'regular');
  return <Text selectable {...props} style={[{ color: muted ? colors.muted : colors.text, fontSize: typography[variant],
    ...textMetrics[variant], ...faces[face],
    ...(['amount', 'display'].includes(variant) ? { fontVariant: ['tabular-nums'] as const } : {}) }, style]} />;
}
