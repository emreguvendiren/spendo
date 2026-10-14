import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { AppText } from './app-text';
import { spacing } from '@/theme/tokens';
export function SectionHeading({ title, action, label, onPress }: { title: string; action?: string; label?: string; onPress?: () => void }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}><AppText variant="heading">{title}</AppText>{action && <Button compact accessibilityLabel={label ?? action} onPress={onPress}>{action}</Button>}</View>;
}
