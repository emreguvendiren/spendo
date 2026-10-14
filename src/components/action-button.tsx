import { Button } from 'react-native-paper';
import { layout, radius, typography } from '@/theme/tokens';
export function ActionButton({ title, onPress, disabled = false, busy = false, secondary = false, icon }: {
  title: string; onPress: () => void; disabled?: boolean; busy?: boolean; secondary?: boolean; icon?: string;
}) {
  return <Button mode={secondary ? 'contained-tonal' : 'contained'} icon={icon} loading={busy}
    accessibilityLabel={title} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    style={{ borderRadius: radius.md }} contentStyle={{ minHeight: layout.buttonHeight }} labelStyle={{ fontSize: typography.body, fontWeight: '600' }}>
    {title}
  </Button>;
}
