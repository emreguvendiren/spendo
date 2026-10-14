import { Stack, useLocalSearchParams } from 'expo-router';
import CategoryScreen from '@/features/ledger/category-screen';
import { usePreferences } from '@/features/preferences/provider';
export default function CategoryRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { t } = usePreferences();
  const categoryId = Array.isArray(id) ? id[0] : id;
  return <><Stack.Screen options={{ title: categoryId ? t.renameCategory : t.addCategory }} /><CategoryScreen categoryId={categoryId} /></>;
}
