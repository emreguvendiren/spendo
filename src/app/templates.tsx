import { Stack } from 'expo-router';
import TemplatesScreen from '@/features/templates/templates-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function TemplatesRoute() { const { t } = usePreferences(); return <><Stack.Screen options={{ title: t.templates }} /><TemplatesScreen /></>; }
