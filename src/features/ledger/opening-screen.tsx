import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import { LedgerError } from '@/db/ledger';
import { amountText, money } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { DemoNotice, LedgerStatus } from './status';
import { parseOpening } from './account-model';
import { entityName, localDay } from './model';

export default function OpeningScreen({ accountId }: { accountId?: string }) {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  return <OpeningForm key={accountId} accountId={accountId} />;
}
function OpeningForm({ accountId }: { accountId?: string }) {
  const { snapshot, setOpening } = useLedger();
  const { t, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [account] = useState(() => snapshot!.accounts.find(item => item.id === accountId));
  const [original] = useState(() => snapshot!.records.find(row => row.account_id === accountId && row.kind === 'opening') ?? null);
  const [id] = useState(() => original?.id ?? randomUUID());
  const [day] = useState(() => original?.occurred_on ?? localDay());
  const [amount, setAmount] = useState(() => original ? amountText(money(original.minor, original.currency), preferences.language) : '0');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<'amount' | 'conflict' | 'save' | null>(null);
  const lock = useRef(false);
  usePreventRemove(!done && (dirty || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [{ text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) }]);
  });
  async function submit() {
    if (lock.current || !account) return;
    let value;
    try { value = parseOpening(amount, account.currency, preferences.language); }
    catch { setError('amount'); return; }
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try {
      await setOpening({ id, kind: 'opening', accountId: account.id, amount: value, occurredOn: day, note: original?.note ?? '', source: original?.source ?? 'manual' }, original);
      setDone(true);
    } catch (failure) {
      setError(failure instanceof LedgerError && ['missing', 'conflict', 'archived'].includes(failure.code) ? 'conflict' : 'save');
    } finally { lock.current = false; setBusy(false); }
  }
  if (!account) return <Screen><AppText accessibilityRole="alert">{t.accountUnavailable}</AppText></Screen>;
  if (account.archived && !original) return <Screen><AppText accessibilityRole="alert">{t.openingRestoreRequired}</AppText><ActionButton title={t.accounts} onPress={() => router.replace('/accounts')} /></Screen>;
  if (done) return <Screen><AppText accessibilityRole="alert">{t.openingSaved}</AppText><LedgerStatus showUndo={false} /><ActionButton title={t.accounts} onPress={() => router.replace('/accounts')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}><Screen>
    <DemoNotice />
    <AppText weight="medium">{entityName(account, preferences.language)} · {account.currency}</AppText>
    <AppText muted>{t.openingCorrectionHelp}</AppText>
    <TextInput mode="outlined" label={`${t.opening} · ${account.currency}`} accessibilityLabel={t.opening} value={amount} keyboardType="numbers-and-punctuation" editable={!busy} maxLength={40} error={error === 'amount'} onChangeText={value => { setAmount(value); setDirty(true); setError(null); }} />
    <AppText muted>{t.date} · {day}</AppText>
    {error && <AppText accessibilityRole="alert">{error === 'amount' ? t.openingError : error === 'conflict' ? t.editConflict : t.entryError}</AppText>}
    <ActionButton title={busy ? t.saving : t.save} busy={busy} onPress={() => { void submit(); }} />
  </Screen></KeyboardAvoidingView>;
}
