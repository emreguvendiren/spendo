import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PreferencesProvider, usePreferences } from '@/features/preferences/provider';
import { LedgerProvider } from '@/features/ledger/provider';
function Navigation() {
  const { t, colors, isDark } = usePreferences();
  return <><StatusBar style={isDark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: t.settings }} />
      <Stack.Screen name="entry" options={{ title: t.add }} />
    </Stack>
  </>;
}
export default function RootLayout() { return <PreferencesProvider><LedgerProvider><Navigation /></LedgerProvider></PreferencesProvider>; }
