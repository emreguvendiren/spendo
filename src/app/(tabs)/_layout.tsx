import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, Text } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView } from 'expo-symbols';
import { usePreferences } from '@/features/preferences/provider';
import { layout, spacing, typography } from '@/theme/tokens';
export default function TabLayout() {
  const { t, colors } = usePreferences();
  const router = useRouter();
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator },
    headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text,
    headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel={t.settings} onPress={() => router.push('/settings')}
      style={({ pressed }) => ({ minHeight: layout.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md, opacity: pressed ? 0.5 : 1 })}>
      <Text style={{ color: colors.accent, fontSize: typography.caption }}>{t.settings}</Text>
    </Pressable> }}>
    <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: ({ color }) => Platform.OS === 'ios' ? <SymbolView name="house" tintColor={color} size={24} /> : <MaterialIcons name="home" color={color} size={24} /> }} />
    <Tabs.Screen name="transactions" options={{ title: t.transactions, tabBarIcon: ({ color }) => Platform.OS === 'ios' ? <SymbolView name="list.bullet" tintColor={color} size={24} /> : <MaterialIcons name="list" color={color} size={24} /> }} />
    <Tabs.Screen name="reports" options={{ title: t.reports, tabBarIcon: ({ color }) => Platform.OS === 'ios' ? <SymbolView name="chart.bar" tintColor={color} size={24} /> : <MaterialIcons name="bar-chart" color={color} size={24} /> }} />
    <Tabs.Screen name="assistant" options={{ title: t.assistant, tabBarIcon: ({ color }) => Platform.OS === 'ios' ? <SymbolView name="bubble.left" tintColor={color} size={24} /> : <MaterialIcons name="chat-bubble-outline" color={color} size={24} /> }} />
  </Tabs>;
}
