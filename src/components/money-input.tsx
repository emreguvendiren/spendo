import { ComponentProps } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { AppText } from './app-text';
import { usePreferences } from '@/features/preferences/provider';
import { useFontFaces } from '@/theme/fonts';
import { spacing, visual } from '@/theme/tokens';
export function MoneyInput({ style, contentStyle, label, ...props }: ComponentProps<typeof TextInput>) {
  const { colors, preferences } = usePreferences(); const faces = useFontFaces();
  return <View style={{ gap: spacing.sm }}>{!!label && <AppText variant="caption" muted>{label}</AppText>}<TextInput placeholder={preferences.language === 'tr' ? '0,00' : '0.00'} {...props} style={[{ backgroundColor: colors.surface, fontSize: visual.formAmount, minHeight: visual.moneyInputHeight }, style]} contentStyle={[{ ...faces.semibold, fontVariant: ['tabular-nums'] }, contentStyle]} /></View>;
}
