import { Stack, useLocalSearchParams } from 'expo-router';
import EntryScreen from '@/features/ledger/entry-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function EntryRoute() {
  const { id, template } = useLocalSearchParams<{ id?: string | string[]; template?: string | string[] }>();
  const { t } = usePreferences();
  const recordId = Array.isArray(id) ? id[0] : id;
  return <><Stack.Screen options={{ title: recordId ? t.editRecord : t.add }} /><EntryScreen recordId={recordId} templateId={Array.isArray(template) ? template[0] : template} /></>;
}
