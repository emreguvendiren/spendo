import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import { Account, LedgerError } from '@/db/ledger';
import { Currency, currencyDigits } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { ArchiveButton } from '@/components/archive-button';
import { layout, spacing } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { DemoNotice, LedgerStatus } from './status';
import { parseOpening } from './account-model';
import { entityName, localDay } from './model';

export default function AccountScreen({ accountId }: { accountId?: string }) {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  return <AccountForm key={accountId ?? 'new'} accountId={accountId} />;
}
function AccountForm({ accountId }: { accountId?: string }) {
  const { snapshot, createAccount, renameAccount, archiveAccount } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [initial] = useState(() => snapshot!.accounts.find(account => account.id === accountId));
  const [id] = useState(randomUUID);
  const [day] = useState(localDay);
  const [name, setName] = useState(() => initial ? entityName(initial, preferences.language) : '');
  const [kind, setKind] = useState<Account['kind']>(initial?.kind ?? 'bank');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'TRY');
  const [opening, setOpening] = useState('0');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<'name' | 'amount' | 'save' | 'conflict' | 'last-active' | null>(null);
  const lock = useRef(false);
  usePreventRemove(!done && (dirty || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [{ text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) }]);
  });
  async function submit() {
    if (lock.current) return;
    if (!name.trim() || name.trim().length > 80) { setError('name'); return; }
    let amount;
    try { amount = parseOpening(opening, currency, preferences.language); } catch { setError('amount'); return; }
    lock.current = true; setBusy(true); setError(null);
    try {
      if (initial) await renameAccount(initial, name.trim());
      else await createAccount({ id, name: name.trim(), kind, currency }, amount, day);
      setDone(true);
    } catch (failure) { setError(failure instanceof LedgerError && failure.code === 'conflict' ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function changeArchive() {
    if (lock.current || !initial) return;
    lock.current = true; setBusy(true); setError(null);
    try { await archiveAccount(initial, !initial.archived); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && failure.code === 'last-active' ? 'last-active' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (accountId && !initial) return <Screen><AppText accessibilityRole="alert">{t.accountUnavailable}</AppText></Screen>;
  if (done) return <Screen><AppText accessibilityRole="alert">{t.accountSaved}</AppText><LedgerStatus /><ActionButton title={t.accounts} onPress={() => router.replace('/accounts')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}><Screen>
    <DemoNotice />
    <TextInput mode="outlined" accessibilityLabel={t.accountName} label={t.accountName} value={name} maxLength={80} editable={!busy} error={error === 'name'}
      onChangeText={value => { setName(value); setDirty(true); setError(null); }} />
    {error === 'name' && <AppText accessibilityRole="alert">{t.accountNameError}</AppText>}
    {initial ? <AppText muted>{t.currencyFixed} · {initial.currency}</AppText> : <>
      <View style={{ gap: spacing.sm }}><AppText>{t.accountKind}</AppText>
        <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
          <Picker testID="account-kind" selectedValue={kind} enabled={!busy} onValueChange={value => { setKind(value); setDirty(true); }}>
            {(['cash', 'bank', 'credit', 'other'] as const).map(value => <Picker.Item key={value} value={value} label={t[value]} />)}
          </Picker>
        </Host>
      </View>
      <View style={{ gap: spacing.sm }}><AppText>{t.currency}</AppText>
        <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
          <Picker testID="account-currency" selectedValue={currency} enabled={!busy} onValueChange={value => { setCurrency(value); setDirty(true); }}>
            {(Object.keys(currencyDigits) as Currency[]).map(value => <Picker.Item key={value} value={value} label={value} />)}
          </Picker>
        </Host>
      </View>
      <TextInput mode="outlined" label={`${t.opening} · ${currency}`} accessibilityLabel={t.opening} value={opening} keyboardType="numbers-and-punctuation" editable={!busy} maxLength={40} error={error === 'amount'}
        onChangeText={value => { setOpening(value); setDirty(true); setError(null); }} />
      <AppText muted variant="caption">{t.openingHelp} · {day}</AppText>
    </>}
    {error === 'amount' && <AppText accessibilityRole="alert">{t.openingError}</AppText>}
    {(error === 'save' || error === 'conflict') && <AppText accessibilityRole="alert">{error === 'conflict' ? t.editConflict : t.entryError}</AppText>}
    {error === 'last-active' && <AppText accessibilityRole="alert">{t.lastAccountError}</AppText>}
    <ActionButton title={busy ? t.saving : t.save} busy={busy} onPress={() => { void submit(); }} />
    {initial && <ActionButton title={t.editOpening} secondary disabled={busy || dirty} onPress={() => router.push({ pathname: '/opening', params: { id: initial.id } })} />}
    {initial && <ArchiveButton archived={!!initial.archived} busy={busy || dirty} onChange={() => { void changeArchive(); }} />}
  </Screen></KeyboardAvoidingView>;
}
