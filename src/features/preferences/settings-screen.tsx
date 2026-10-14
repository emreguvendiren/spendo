import { View } from 'react-native';
import { Divider, Icon, RadioButton } from 'react-native-paper';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { usePreferences } from './provider';
import { spacing, radius, layout } from '@/theme/tokens';
export default function SettingsScreen() {
  const { preferences, t, colors, update, saving, saveError } = usePreferences();
  function option(label: string, selected: boolean, onPress: () => void) {
    return <RadioButton.Item key={label} label={label} value={label} status={selected ? 'checked' : 'unchecked'} disabled={saving} onPress={onPress}
      position="trailing" color={colors.accent} labelStyle={{ color: colors.text }} style={{ minHeight: layout.touchTarget }} />;
  }
  return <Screen>
    <AppText variant="heading">{t.language}</AppText>
    <View accessibilityRole="radiogroup" style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }}>
      {option('Türkçe', preferences.language === 'tr', () => { void update({ ...preferences, language: 'tr' }); })}
      <Divider />
      {option('English', preferences.language === 'en', () => { void update({ ...preferences, language: 'en' }); })}
    </View>
    <AppText variant="heading">{t.appearance}</AppText>
    <View accessibilityRole="radiogroup" style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }}>
      {(['system', 'light', 'dark'] as const).map(mode => option(t[mode], preferences.theme === mode, () => { void update({ ...preferences, theme: mode }); }))}
    </View>
    {saveError && <AppText accessibilityRole="alert">{t.saveError}</AppText>}
    <View style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md }}><Icon source="shield-check-outline" size={layout.icon} color={colors.muted} /><View style={{ flex: 1, gap: spacing.sm }}><AppText style={{ fontWeight: '600' }}>{t.privacy}</AppText><AppText muted variant="caption">{t.privacyBody}</AppText></View></View>
  </Screen>;
}
