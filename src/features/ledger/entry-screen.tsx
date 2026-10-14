import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Divider, List, SegmentedButtons, TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove, useHeaderHeight } from 'expo-router/react-navigation';
import { RecordInput } from '@/db/ledger';
import { parseAmount } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { layout, radius, spacing, typography } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { defaultAccount, entityName, localDay } from './model';
import { LedgerStatus } from './status';

export default function EntryScreen() {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  return <EntryForm />;
}
function EntryForm() {
  const { snapshot, save } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [requestId] = useState(randomUUID);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState(() => defaultAccount(snapshot!));
  const [categoryId, setCategoryId] = useState('default-general');
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [details, setDetails] = useState(false);
  const [pickDate, setPickDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'amount' | 'save' | null>(null);
  const [done, setDone] = useState(false);
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
  const categories = snapshot!.categories.filter(item => item.kind === kind);
  async function submit() {
    if (lock.current || !account) return;
    let input: RecordInput;
    try {
      input = { id: requestId, kind, accountId, categoryId, amount: parseAmount(amount, account.currency, preferences.language),
        occurredOn: localDay(date), note, source: 'manual' };
    } catch { setError('amount'); return; }
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try { await save(input); setDone(true); }
    catch { setError('save'); }
    finally { lock.current = false; setBusy(false); }
  }
  // Wait for the navigation guard to render with the committed state before leaving.
  if (done) return <Screen><LedgerStatus /><ActionButton title={t.transactions} onPress={() => router.replace('/(tabs)/transactions')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <AppText muted variant="caption">{t.amount} · {account?.currency}</AppText>
        <TextInput mode="flat" accessibilityLabel={t.amount} value={amount} placeholder={preferences.language === 'tr' ? '0,00' : '0.00'}
          onChangeText={value => { setAmount(value); setDirty(true); setError(null); }} underlineColor={colors.separator} activeUnderlineColor={colors.accent}
          editable={!busy} keyboardType="decimal-pad" autoFocus maxLength={40} error={error === 'amount'}
          style={{ backgroundColor: colors.background, fontSize: typography.display }} contentStyle={{ paddingHorizontal: spacing.xs, fontVariant: ['tabular-nums'] }} />
      </View>
      {error === 'amount' && <AppText accessibilityRole="alert">{t.amountError}</AppText>}
      <SegmentedButtons value={kind} onValueChange={value => { setKind(value); setCategoryId(value === 'expense' ? 'default-general' : 'default-salary'); setDirty(true); }}
        buttons={[{ value: 'expense', label: t.expense, icon: 'arrow-top-right', disabled: busy }, { value: 'income', label: t.income, icon: 'arrow-bottom-left', disabled: busy }]} />
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm }}>
      <AppText muted>{t.category}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget, flexGrow: 1 }}>
        <Picker testID="entry-category" selectedValue={categoryId} enabled={!busy} onValueChange={value => { setCategoryId(value); setDirty(true); }}>
          {categories.map(item => <Picker.Item key={item.id} value={item.id} label={entityName(item, preferences.language)} />)}
        </Picker>
      </Host>
      </View><Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm }}>
      <AppText muted>{t.account}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget, flexGrow: 1 }}>
        <Picker testID="entry-account" selectedValue={accountId} enabled={!busy} onValueChange={value => { setAccountId(value); setDirty(true); }}>
          {snapshot!.accounts.map(item => <Picker.Item key={item.id} value={item.id} label={`${entityName(item, preferences.language)} · ${item.currency}`} />)}
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
      <ActionButton title={busy ? t.saving : t.save} icon="check" busy={busy} disabled={!account} onPress={() => { void submit(); }} />
      <AppText muted variant="caption" style={{ textAlign: 'center' }}>{t.offlineReady}</AppText>
    </Screen>
  </KeyboardAvoidingView>;
}
