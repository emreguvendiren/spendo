import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Divider, List, SegmentedButtons, TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove, useHeaderHeight } from 'expo-router/react-navigation';
import { LedgerError, RecordInput, RecordRow } from '@/db/ledger';
import { amountText, money, parseAmount } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { layout, radius, spacing, typography } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { defaultAccount, defaultCategory, entityName, localDay } from './model';
import { DemoNotice, LedgerStatus } from './status';
import { useFontFaces } from '@/theme/fonts';

export default function EntryScreen({ recordId }: { recordId?: string } = {}) {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  return <LoadedEntry key={recordId ?? 'new'} recordId={recordId} />;
}
function LoadedEntry({ recordId }: { recordId?: string }) {
  const { snapshot } = useLedger();
  const { t } = usePreferences();
  const [row] = useState(() => recordId ? snapshot!.records.find(item => item.id === recordId) : undefined);
  if (recordId && (!row || (row.kind !== 'income' && row.kind !== 'expense'))) return <Screen><LedgerStatus /><AppText accessibilityRole="alert">{t.recordUnavailable}</AppText></Screen>;
  return <EntryForm key={recordId ?? 'new'} initial={row} />;
}
function EntryForm({ initial }: { initial?: RecordRow }) {
  const faces = useFontFaces();
  const { snapshot, save, update, remove } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [original] = useState(initial);
  const [requestId] = useState(() => initial?.id ?? randomUUID());
  const [amount, setAmount] = useState(() => initial ? amountText(money(initial.minor, initial.currency), preferences.language) : '');
  const [kind, setKind] = useState<'income' | 'expense'>(initial?.kind === 'income' ? 'income' : 'expense');
  const [accountId, setAccountId] = useState(() => initial?.account_id ?? defaultAccount(snapshot!));
  const [categoryId, setCategoryId] = useState(() => initial?.category_id ?? defaultCategory(snapshot!, initial?.kind === 'income' ? 'income' : 'expense'));
  const [date, setDate] = useState(() => initial ? new Date(`${initial.occurred_on}T12:00:00`) : new Date());
  const [note, setNote] = useState(initial?.note ?? '');
  const [details, setDetails] = useState(Boolean(initial?.note));
  const [pickDate, setPickDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'amount' | 'save' | 'delete' | 'conflict' | null>(null);
  const [done, setDone] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  usePreventRemove(!done && (dirty || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [
      { text: t.stay, style: 'cancel' },
      { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  const account = snapshot!.accounts.find(item => item.id === accountId);
  const categories = snapshot!.categories.filter(item => item.kind === kind && (!item.archived || item.id === original?.category_id));
  async function submit() {
    if (lock.current || !account) return;
    let input: RecordInput;
    try {
      input = { id: requestId, kind, accountId, categoryId, amount: parseAmount(amount, account.currency, preferences.language),
        occurredOn: localDay(date), note, source: original?.source ?? 'manual' };
    } catch { setError('amount'); return; }
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try { if (original) await update(input, original); else await save(input); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && (failure.code === 'conflict' || failure.code === 'missing') ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirmDelete() {
    if (lock.current || !original) return;
    Alert.alert(t.deleteTitle, t.deleteBody, [
      { text: t.cancel, style: 'cancel' },
      { text: t.deleteRecord, style: 'destructive', onPress: () => { void deleteEntry(); } },
    ]);
  }
  async function deleteEntry() {
    if (lock.current || !original) return;
    lock.current = true; setBusy(true); setError(null);
    try { await remove(original); setDeleted(true); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && failure.code === 'conflict' ? 'conflict' : 'delete'); }
    finally { lock.current = false; setBusy(false); }
  }
  // Wait for the navigation guard to render with the committed state before leaving.
  if (done) return <Screen>{original && <AppText accessibilityRole="alert">{deleted ? t.deleted : t.updated}</AppText>}<LedgerStatus showUndo={!original} /><ActionButton title={t.transactions} onPress={() => router.replace('/(tabs)/transactions')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
    <Screen>
      <DemoNotice />
      <View style={{ gap: spacing.sm }}>
        <AppText muted variant="caption">{t.amount} · {account?.currency}</AppText>
        <TextInput mode="flat" accessibilityLabel={t.amount} value={amount} placeholder={preferences.language === 'tr' ? '0,00' : '0.00'}
          onChangeText={value => { setAmount(value); setDirty(true); setError(null); }} underlineColor={colors.separator} activeUnderlineColor={colors.accent}
          editable={!busy} keyboardType="decimal-pad" autoFocus maxLength={40} error={error === 'amount'}
          style={{ backgroundColor: colors.background, fontSize: typography.display }} contentStyle={{ ...faces.semibold, paddingHorizontal: spacing.xs, fontVariant: ['tabular-nums'] }} />
      </View>
      {error === 'amount' && <AppText accessibilityRole="alert">{t.amountError}</AppText>}
      <SegmentedButtons value={kind} onValueChange={value => { setKind(value); setCategoryId(defaultCategory(snapshot!, value)); setDirty(true); }}
        buttons={[{ value: 'expense', label: t.expense, icon: 'arrow-top-right', disabled: busy }, { value: 'income', label: t.income, icon: 'arrow-bottom-left', disabled: busy }]} />
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm }}>
      <AppText muted>{t.category}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget, flexGrow: 1 }}>
        <Picker testID="entry-category" selectedValue={categoryId} enabled={!busy} onValueChange={value => { setCategoryId(value); setDirty(true); }}>
          {categories.map(item => <Picker.Item key={item.id} value={item.id} label={`${entityName(item, preferences.language)}${item.archived ? ` · ${t.archived}` : ''}`} />)}
        </Picker>
      </Host>
      </View><Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm }}>
      <AppText muted>{t.account}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget, flexGrow: 1 }}>
        <Picker testID="entry-account" selectedValue={accountId} enabled={!busy} onValueChange={value => { setAccountId(value); setDirty(true); }}>
          {snapshot!.accounts.filter(item => !item.archived || item.id === original?.account_id).map(item => <Picker.Item key={item.id} value={item.id} label={`${entityName(item, preferences.language)} · ${item.currency}${item.archived ? ` · ${t.archived}` : ''}`} />)}
        </Picker>
      </Host>
      </View><Divider />
      <List.Item title={t.date} description={new Intl.DateTimeFormat(preferences.language, { dateStyle: 'medium' }).format(date)}
        accessibilityRole="button" accessibilityLabel={`${t.date}: ${localDay(date)}`} disabled={busy}
        left={props => <List.Icon {...props} icon="calendar-blank-outline" />} right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => { Keyboard.dismiss(); setPickDate(true); }} />
      </View>
      {pickDate && <DateTimePicker value={date} mode="date" locale={preferences.language} themeVariant={isDark ? 'dark' : 'light'} accentColor={colors.accent}
        onValueChange={(_, value) => { setDate(value); setPickDate(false); setDirty(true); }} onDismiss={() => setPickDate(false)} />}
      <Button icon="text-box-outline" style={{ alignSelf: 'flex-start' }} disabled={busy} onPress={() => setDetails(value => !value)}>{t.details}</Button>
      {details && <TextInput mode="outlined" label={t.note} accessibilityLabel={t.note} value={note} onChangeText={value => { setNote(value); setDirty(true); }} editable={!busy} maxLength={500} multiline style={{ backgroundColor: colors.surface }} />}
      {error === 'save' && <AppText accessibilityRole="alert">{t.entryError}</AppText>}
      {error === 'delete' && <AppText accessibilityRole="alert">{t.deleteError}</AppText>}
      {error === 'conflict' && <AppText accessibilityRole="alert">{t.editConflict}</AppText>}
      <ActionButton title={busy ? t.saving : t.save} icon="check" busy={busy} disabled={!account} onPress={() => { void submit(); }} />
      {original && <Button accessibilityLabel={t.deleteRecord} icon="trash-can-outline" textColor={colors.expense} disabled={busy} onPress={confirmDelete}>{t.deleteRecord}</Button>}
      <AppText muted variant="caption" style={{ textAlign: 'center' }}>{t.offlineReady}</AppText>
    </Screen>
  </KeyboardAvoidingView>;
}
