import { Stack, useLocalSearchParams } from 'expo-router';
import OpeningScreen from '@/features/ledger/opening-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function OpeningRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { t } = usePreferences();
  return <><Stack.Screen options={{ title: t.editOpening }} /><OpeningScreen accountId={Array.isArray(id) ? id[0] : id} /></>;
}
