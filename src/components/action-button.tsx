import { Button } from 'react-native-paper';
import { layout, radius, typography } from '@/theme/tokens';
import { useFontFaces } from '@/theme/fonts';
export function ActionButton({ title, onPress, disabled = false, busy = false, secondary = false, icon }: {
  title: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; icon?: string;
}) {
  const faces = useFontFaces();
  return <Button mode={secondary ? 'contained-tonal' : 'contained'} icon={icon} loading={busy}
    accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    style={{ borderRadius: radius.md }} contentStyle={{ minHeight: layout.buttonHeight }} labelStyle={{ fontSize: typography.body, ...faces.semibold }}>
    {title}
  </Button>;
}
