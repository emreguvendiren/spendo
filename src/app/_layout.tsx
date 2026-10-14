import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PreferencesProvider, usePreferences } from '@/features/preferences/provider';
import { LedgerProvider } from '@/features/ledger/provider';
import { FontsProvider, useFontFaces } from '@/theme/fonts';
import { typography } from '@/theme/tokens';
function Navigation() {
  const { t, colors, isDark } = usePreferences();
  const faces = useFontFaces();
  return <><StatusBar style={isDark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerTitleStyle: { ...faces.semibold, fontSize: typography.heading }, headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: t.settings }} />
      <Stack.Screen name="entry" options={{ title: t.add }} />
      <Stack.Screen name="accounts" options={{ title: t.accounts }} />
      <Stack.Screen name="account" options={{ title: t.addAccount }} />
      <Stack.Screen name="categories" options={{ title: t.categories }} />
      <Stack.Screen name="category" options={{ title: t.addCategory }} />
      <Stack.Screen name="transfer" options={{ title: t.transfer }} />
      <Stack.Screen name="opening" options={{ title: t.editOpening }} />
    </Stack>
  </>;
}
export default function RootLayout() { return <FontsProvider><PreferencesProvider><LedgerProvider><Navigation /></LedgerProvider></PreferencesProvider></FontsProvider>; }
