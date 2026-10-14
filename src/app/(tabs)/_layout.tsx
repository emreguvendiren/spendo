import { Tabs, useRouter } from 'expo-router';
import { Icon, IconButton } from 'react-native-paper';
import { HeaderBrand } from '@/components/header-brand';
import { usePreferences } from '@/features/preferences/provider';
import { layout, typography } from '@/theme/tokens';
export default function TabLayout() {
  const { t, colors } = usePreferences();
  const router = useRouter();
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator },
    tabBarLabelStyle: { fontSize: typography.caption },
    headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
    headerRight: () => <IconButton icon="cog-outline" size={layout.icon} style={{ minWidth: layout.touchTarget, minHeight: layout.touchTarget }} accessibilityLabel={t.settings} onPress={() => router.push('/settings')} /> }}>
    <Tabs.Screen name="index" options={{ title: t.home, headerTitle: '', headerLeft: () => <HeaderBrand />, tabBarLabel: t.home, tabBarIcon: ({ focused }) => <Icon source={focused ? 'home-variant' : 'home-variant-outline'} color={focused ? colors.accent : colors.muted} size={layout.icon} /> }} />
    <Tabs.Screen name="transactions" options={{ title: t.transactions, tabBarIcon: ({ focused }) => <Icon source="swap-vertical" color={focused ? colors.accent : colors.muted} size={layout.icon} /> }} />
    <Tabs.Screen name="reports" options={{ title: t.reports, tabBarIcon: ({ focused }) => <Icon source="chart-bar" color={focused ? colors.accent : colors.muted} size={layout.icon} /> }} />
    <Tabs.Screen name="assistant" options={{ title: t.assistant, tabBarIcon: ({ focused }) => <Icon source="message-outline" color={focused ? colors.accent : colors.muted} size={layout.icon} /> }} />
  </Tabs>;
}
