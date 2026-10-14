import { Stack, useLocalSearchParams } from 'expo-router';
import TransferScreen from '@/features/ledger/transfer-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function TransferRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { t } = usePreferences();
  const recordId = Array.isArray(id) ? id[0] : id;
  return <><Stack.Screen options={{ title: recordId ? t.editTransfer : t.transfer }} /><TransferScreen recordId={recordId} /></>;
}
