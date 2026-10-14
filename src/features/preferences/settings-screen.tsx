import { Pressable, View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { usePreferences } from './provider';
import { spacing, radius, layout } from '@/theme/tokens';
export default function SettingsScreen() {
  const { preferences, t, colors, update, saving, saveError } = usePreferences();
  function option(label: string, selected: boolean, onPress: () => void) {
    return <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label}
      accessibilityState={{ selected, disabled: saving }} disabled={saving} onPress={onPress}
      style={({ pressed }) => ({ minHeight: layout.touchTarget, minWidth: layout.choiceMinWidth, flexGrow: 1, padding: spacing.md,
        borderRadius: radius.sm, backgroundColor: selected ? colors.tint : colors.surface,
        borderWidth: 1, borderColor: selected ? colors.accent : colors.separator, opacity: pressed || saving ? 0.6 : 1 })}>
      <AppText style={{ color: selected ? colors.accent : colors.text }}>{label}</AppText>
    </Pressable>;
  }
  return <Screen>
    <AppText variant="heading">{t.language}</AppText>
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {option('Türkçe', preferences.language === 'tr', () => { void update({ ...preferences, language: 'tr' }); })}
      {option('English', preferences.language === 'en', () => { void update({ ...preferences, language: 'en' }); })}
    </View>
    <AppText variant="heading">{t.appearance}</AppText>
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {(['system', 'light', 'dark'] as const).map(mode => option(t[mode], preferences.theme === mode, () => { void update({ ...preferences, theme: mode }); }))}
    </View>
    {saveError && <AppText accessibilityRole="alert">{t.saveError}</AppText>}
    <AppText variant="heading">{t.privacy}</AppText><AppText muted>{t.privacyBody}</AppText>
  </Screen>;
}
