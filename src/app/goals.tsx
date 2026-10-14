import { Stack } from 'expo-router';
import GoalsScreen from '@/features/goals/goals-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function GoalsRoute() { const { t } = usePreferences(); return <><Stack.Screen options={{ title: t.goals }} /><GoalsScreen /></>; }
