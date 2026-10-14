import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SegmentedButtons, TextInput } from 'react-native-paper';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import { LedgerError } from '@/db/ledger';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { ArchiveButton } from '@/components/archive-button';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { DemoNotice, LedgerStatus } from './status';
import { entityName } from './model';

export default function CategoryScreen({ categoryId }: { categoryId?: string }) {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  return <CategoryForm key={categoryId ?? 'new'} categoryId={categoryId} />;
}
function CategoryForm({ categoryId }: { categoryId?: string }) {
  const { snapshot, createCategory, renameCategory, archiveCategory } = useLedger();
  const { t, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [initial] = useState(() => snapshot!.categories.find(category => category.id === categoryId));
  const [id] = useState(randomUUID);
  const [name, setName] = useState(() => initial ? entityName(initial, preferences.language) : '');
  const [kind, setKind] = useState<'expense' | 'income'>(initial?.kind ?? 'expense');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<'name' | 'save' | 'conflict' | 'last-active' | null>(null);
  const lock = useRef(false);
  usePreventRemove(!done && (dirty || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [{ text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) }]);
  });
  async function submit() {
    if (lock.current) return;
    if (!name.trim() || name.trim().length > 80) { setError('name'); return; }
    lock.current = true; setBusy(true); setError(null);
    try {
      if (initial) await renameCategory(initial, name.trim());
      else await createCategory({ id, name: name.trim(), kind });
      setDone(true);
    } catch (failure) { setError(failure instanceof LedgerError && (failure.code === 'conflict' || failure.code === 'missing') ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function changeArchive() {
    if (lock.current || !initial) return;
    lock.current = true; setBusy(true); setError(null);
    try { await archiveCategory(initial, !initial.archived); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && failure.code === 'last-active' ? 'last-active' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (categoryId && !initial) return <Screen><AppText accessibilityRole="alert">{t.categoryUnavailable}</AppText></Screen>;
  if (done) return <Screen><AppText accessibilityRole="alert">{t.categorySaved}</AppText><LedgerStatus /><ActionButton title={t.categories} onPress={() => router.replace('/categories')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}><Screen>
    <DemoNotice />
    <TextInput mode="outlined" accessibilityLabel={t.categoryName} label={t.categoryName} value={name} maxLength={80} editable={!busy} error={error === 'name'} onChangeText={value => { setName(value); setDirty(true); setError(null); }} />
    {initial ? <AppText muted>{t.categoryKindFixed} · {t[kind]}</AppText> : <SegmentedButtons value={kind} onValueChange={value => { setKind(value); setDirty(true); }} buttons={[{ value: 'expense', label: t.expense, disabled: busy }, { value: 'income', label: t.income, disabled: busy }]} />}
    {error && <AppText accessibilityRole="alert">{error === 'name' ? t.categoryNameError : error === 'last-active' ? t.lastCategoryError : error === 'conflict' ? t.editConflict : t.entryError}</AppText>}
    <ActionButton title={busy ? t.saving : t.save} busy={busy} onPress={() => { void submit(); }} />
    {initial && <ArchiveButton archived={!!initial.archived} busy={busy || dirty} onChange={() => { void changeArchive(); }} />}
  </Screen></KeyboardAvoidingView>;
}
