import { Stack, useLocalSearchParams } from 'expo-router';
import EntryScreen from '@/features/ledger/entry-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function TemplateRoute() { const { id } = useLocalSearchParams<{ id?: string | string[] }>(); const { t } = usePreferences(); return <><Stack.Screen options={{ title: id ? t.editTemplate : t.addTemplate }} /><EntryScreen templateMode templateId={Array.isArray(id) ? id[0] : id} /></>; }
