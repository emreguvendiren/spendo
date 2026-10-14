import { Stack, useLocalSearchParams } from 'expo-router';
import AccountScreen from '@/features/ledger/account-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function AccountRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { t } = usePreferences();
  const accountId = Array.isArray(id) ? id[0] : id;
  return <><Stack.Screen options={{ title: accountId ? t.renameAccount : t.addAccount }} /><AccountScreen accountId={accountId} /></>;
}
