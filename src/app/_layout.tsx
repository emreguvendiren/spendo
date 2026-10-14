import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PreferencesProvider, usePreferences } from '@/features/preferences/provider';
function Navigation() {
  const { t, colors, isDark } = usePreferences();
  return <><StatusBar style={isDark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: t.settings }} />
    </Stack>
  </>;
}
export default function RootLayout() { return <PreferencesProvider><Navigation /></PreferencesProvider>; }
