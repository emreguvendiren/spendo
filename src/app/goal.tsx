import { Stack, useLocalSearchParams } from 'expo-router';
import GoalScreen from '@/features/goals/goal-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function GoalRoute() { const { id } = useLocalSearchParams<{ id?: string | string[] }>(); const { t } = usePreferences(); return <><Stack.Screen options={{ title: id ? t.editGoal : t.addGoal }} /><GoalScreen goalId={Array.isArray(id) ? id[0] : id} /></>; }
