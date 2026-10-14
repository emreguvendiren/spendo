import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, List, TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import { amountText, money, MoneyError } from '@/domain/money';
import { LedgerError, RecordRow } from '@/db/ledger';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { layout, spacing } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { DemoNotice, LedgerStatus } from './status';
import { defaultAccount, defaultCategory, entityName, localDay } from './model';
import { transferInput, transferFeeInput, TransferError } from './transfer-model';

export default function TransferScreen({ recordId }: { recordId?: string } = {}) {
  const { snapshot } = useLedger();
  const { t } = usePreferences();
  const router = useRouter();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  if (recordId) return <LoadedTransfer key={recordId} recordId={recordId} />;
  if (snapshot.accounts.filter(account => !account.archived).length < 2) return <Screen><LedgerStatus /><AppText>{t.transferNeedsAccounts}</AppText><ActionButton title={t.accounts} onPress={() => router.replace('/accounts')} /></Screen>;
  return <TransferForm />;
}
function LoadedTransfer({ recordId }: { recordId: string }) {
  const { snapshot } = useLedger();
  const { t } = usePreferences();
  const [initial] = useState(() => snapshot!.records.find(row => row.id === recordId));
  if (!initial || initial.kind !== 'transfer') return <Screen><LedgerStatus /><AppText accessibilityRole="alert">{t.transferUnavailable}</AppText></Screen>;
  return <TransferForm initial={initial} />;
}
function TransferForm({ initial }: { initial?: RecordRow }) {
  const { snapshot, save, update, remove, saveTransfer } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [original] = useState(initial);
  const [originalFee] = useState(() => {
    const link = snapshot!.feeLinks?.find(item => item.transfer_id === initial?.id);
    return snapshot!.records.find(row => row.id === link?.fee_id);
  });
  const [feeId] = useState(() => originalFee?.id ?? `fee-${randomUUID()}`);
  const [feeAmount, setFeeAmount] = useState(() => originalFee ? amountText(money(originalFee.minor, originalFee.currency), preferences.language) : '');
  const [feeCategory, setFeeCategory] = useState(() => originalFee?.category_id ?? defaultCategory(snapshot!, 'expense'));
  const [id] = useState(() => initial?.id ?? randomUUID());
  const [sourceId, setSourceId] = useState(() => initial?.account_id ?? defaultAccount(snapshot!));
  const [targetId, setTargetId] = useState(() => initial?.target_id ?? snapshot!.accounts.find(account => account.id !== sourceId && !account.archived)!.id);
  const [amount, setAmount] = useState(() => initial ? amountText(money(initial.minor, initial.currency), preferences.language) : '');
  const [targetAmount, setTargetAmount] = useState(() => initial?.target_minor !== null && initial?.target_minor !== undefined && initial.target_currency ? amountText(money(initial.target_minor, initial.target_currency), preferences.language) : '');
  const [date, setDate] = useState(() => initial ? new Date(`${initial.occurred_on}T12:00:00`) : new Date());
  const [pickDate, setPickDate] = useState(false);
  const [note, setNote] = useState(initial?.note ?? '');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<'accounts' | 'amount' | 'fee' | 'save' | 'delete' | 'conflict' | null>(null);
  const lock = useRef(false);
  const source = snapshot!.accounts.find(account => account.id === sourceId);
  const target = snapshot!.accounts.find(account => account.id === targetId);
  const foreign = source?.currency !== target?.currency;
  usePreventRemove(!done && (dirty || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [{ text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) }]);
  });
  async function submit() {
    if (lock.current) return;
    let input;
    try { input = transferInput({ id, sourceId, targetId, amount, targetAmount, date, note }, snapshot!.accounts, preferences.language, original); }
    catch (failure) { setError(failure instanceof TransferError ? 'accounts' : failure instanceof MoneyError ? 'amount' : 'save'); return; }
    let fee;
    try { fee = transferFeeInput(feeAmount, feeId, feeCategory, snapshot!.categories, input, preferences.language, originalFee); }
    catch { setError('fee'); return; }
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try { if (fee || originalFee) await saveTransfer(input, fee, original, originalFee ?? null); else if (original) await update(input, original); else await save(input); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && (failure.code === 'conflict' || failure.code === 'missing') ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function deleteTransfer() {
    if (lock.current || !original) return;
    lock.current = true; setBusy(true); setError(null);
    try { if (originalFee) await remove(original, originalFee); else await remove(original); setDeleted(true); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && failure.code === 'conflict' ? 'conflict' : 'delete'); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirmDelete() {
    if (lock.current || !original) return;
    Alert.alert(t.deleteTransferTitle, t.deleteTransferBody, [{ text: t.cancel, style: 'cancel' }, { text: t.deleteRecord, style: 'destructive', onPress: () => { void deleteTransfer(); } }]);
  }
  if (done) return <Screen>{original && <AppText accessibilityRole="alert">{deleted ? t.deleted : t.updated}</AppText>}<LedgerStatus showUndo={!original} /><ActionButton title={t.transactions} onPress={() => router.replace('/(tabs)/transactions')} /></Screen>;
  function accountPicker(label: string, testID: string, selectedValue: string, setValue: (value: string) => void, keptId?: string | null) {
    return <View style={{ gap: spacing.sm }}><AppText>{label}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
        <Picker testID={testID} selectedValue={selectedValue} enabled={!busy} onValueChange={value => { setValue(value); setDirty(true); setError(null); }}>
          {snapshot!.accounts.filter(account => !account.archived || account.id === keptId).map(account => <Picker.Item key={account.id} value={account.id} label={`${entityName(account, preferences.language)} · ${account.currency}${account.archived ? ` · ${t.archived}` : ''}`} />)}
        </Picker>
      </Host>
    </View>;
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}><Screen>
    <DemoNotice />
    {accountPicker(t.sourceAccount, 'transfer-source', sourceId, setSourceId, original?.account_id)}
    {accountPicker(t.targetAccount, 'transfer-target', targetId, setTargetId, original?.target_id)}
    {error === 'accounts' && <AppText accessibilityRole="alert">{t.transferAccountError}</AppText>}
    <TextInput mode="outlined" accessibilityLabel={t.sentAmount} label={`${t.sentAmount} · ${source?.currency}`} value={amount} keyboardType="decimal-pad" maxLength={40} editable={!busy} error={error === 'amount'} onChangeText={value => { setAmount(value); setDirty(true); setError(null); }} />
    {foreign && <TextInput mode="outlined" accessibilityLabel={t.receivedAmount} label={`${t.receivedAmount} · ${target?.currency}`} value={targetAmount} keyboardType="decimal-pad" maxLength={40} editable={!busy} error={error === 'amount'} onChangeText={value => { setTargetAmount(value); setDirty(true); setError(null); }} />}
    <AppText muted variant="caption">{foreign ? t.transferForeignHelp : t.transferSameHelp}</AppText>
    {error === 'amount' && <AppText accessibilityRole="alert">{t.amountError}</AppText>}
    <TextInput mode="outlined" accessibilityLabel={t.transferFee} label={`${t.transferFee} · ${source?.currency}`} value={feeAmount} keyboardType="decimal-pad" maxLength={40} editable={!busy} error={error === 'fee'} onChangeText={value => { setFeeAmount(value); setDirty(true); setError(null); }} />
    <AppText muted variant="caption">{t.transferFeeHelp}</AppText>
    {!!feeAmount.trim() && <View style={{ gap: spacing.sm }}><AppText>{t.feeCategory}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
        <Picker testID="transfer-fee-category" selectedValue={feeCategory} enabled={!busy} onValueChange={value => { setFeeCategory(value); setDirty(true); setError(null); }}>
          {snapshot!.categories.filter(category => category.kind === 'expense' && (!category.archived || category.id === originalFee?.category_id)).map(category => <Picker.Item key={category.id} value={category.id} label={`${entityName(category, preferences.language)}${category.archived ? ` · ${t.archived}` : ''}`} />)}
        </Picker>
      </Host>
    </View>}
    {error === 'fee' && <AppText accessibilityRole="alert">{t.transferFeeError}</AppText>}
    <List.Item title={t.date} description={new Intl.DateTimeFormat(preferences.language, { dateStyle: 'medium' }).format(date)} accessibilityRole="button" accessibilityLabel={`${t.date}: ${localDay(date)}`} disabled={busy} onPress={() => { Keyboard.dismiss(); setPickDate(true); }} left={props => <List.Icon {...props} icon="calendar-blank-outline" />} />
    {pickDate && <DateTimePicker value={date} mode="date" locale={preferences.language} themeVariant={isDark ? 'dark' : 'light'} accentColor={colors.accent} onValueChange={(_, value) => { setDate(value); setPickDate(false); setDirty(true); }} onDismiss={() => setPickDate(false)} />}
    <TextInput mode="outlined" accessibilityLabel={t.note} label={t.note} value={note} maxLength={500} editable={!busy} multiline onChangeText={value => { setNote(value); setDirty(true); }} />
    {error === 'save' && <AppText accessibilityRole="alert">{t.entryError}</AppText>}
    {error === 'delete' && <AppText accessibilityRole="alert">{t.deleteError}</AppText>}
    {error === 'conflict' && <AppText accessibilityRole="alert">{t.editConflict}</AppText>}
    <ActionButton title={busy ? t.saving : t.save} busy={busy} onPress={() => { void submit(); }} />
    {original && <Button accessibilityLabel={t.deleteRecord} icon="trash-can-outline" textColor={colors.expense} disabled={busy} onPress={confirmDelete}>{t.deleteRecord}</Button>}
    <AppText muted variant="caption">{t.transferExcluded}</AppText>
  </Screen></KeyboardAvoidingView>;
}
