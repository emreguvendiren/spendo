import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Divider, List, SegmentedButtons, TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove, useHeaderHeight } from 'expo-router/react-navigation';
import { EntryTemplate, LedgerError, RecordInput, RecordRow } from '@/db/ledger';
import { amountText, money, parseAmount } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { FeatureIntro } from '@/components/feature-intro';
import { ActionButton } from '@/components/action-button';
import { layout, radius, spacing, typography } from '@/theme/tokens';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from './provider';
import { defaultAccount, defaultCategory, entityName, localDay } from './model';
import { DemoNotice, LedgerStatus } from './status';
import { useFontFaces } from '@/theme/fonts';
import { templateRecord, templateUsable } from '@/features/templates/model';

type EntryProps = { recordId?: string; templateId?: string; templateMode?: boolean };
export default function EntryScreen({ recordId, templateId, templateMode = false }: EntryProps = {}) {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus /></Screen>;
  return <LoadedEntry key={(templateMode ? 'template-' : 'entry-') + (recordId ?? templateId ?? 'new')} recordId={recordId} templateId={templateId} templateMode={templateMode} />;
}
function LoadedEntry({ recordId, templateId, templateMode }: EntryProps) {
  const { snapshot } = useLedger();
  const { t } = usePreferences();
  const router = useRouter();
  const [row] = useState(() => recordId ? snapshot!.records.find(item => item.id === recordId) : undefined);
  const [template] = useState(() => templateId ? snapshot!.templates?.find(item => item.id === templateId) : undefined);
  const feeLink = snapshot!.feeLinks?.find(item => item.fee_id === recordId);
  if (feeLink) return <Screen><AppText>{t.feeEditHelp}</AppText><ActionButton title={t.editTransfer} onPress={() => router.replace({ pathname: '/transfer', params: { id: feeLink.transfer_id } })} /></Screen>;
  if (recordId && (!row || (row.kind !== 'income' && row.kind !== 'expense'))) return <Screen><LedgerStatus /><AppText accessibilityRole="alert">{t.recordUnavailable}</AppText></Screen>;
  if (recordId && (templateId || templateMode)) return <Screen><AppText accessibilityRole="alert">{t.recordUnavailable}</AppText></Screen>;
  if (templateId && !template) return <Screen><AppText accessibilityRole="alert">{t.templateUnavailable}</AppText></Screen>;
  if (template && !templateMode && !templateUsable(snapshot!, template)) return <Screen><AppText accessibilityRole="alert">{t.templateInactive}</AppText><ActionButton title={t.editTemplate} onPress={() => router.replace({ pathname: '/template', params: { id: template.id } })} /></Screen>;
  return <EntryForm initial={row} template={template} templateMode={templateMode} />;
}
function EntryForm({ initial, template, templateMode = false }: { initial?: RecordRow; template?: EntryTemplate; templateMode?: boolean }) {
  const faces = useFontFaces();
  const { snapshot, save, update, remove, saveTemplate, removeTemplate } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const preset = initial ?? (template ? templateRecord(template) : undefined);
  const [templateName, setTemplateName] = useState(template?.name ?? '');
  const [original] = useState(initial);
  const [requestId] = useState(() => initial?.id ?? (templateMode ? template?.id : undefined) ?? randomUUID());
  const [amount, setAmount] = useState(() => preset ? amountText(money(preset.minor, preset.currency), preferences.language) : '');
  const [kind, setKind] = useState<'income' | 'expense'>(preset?.kind === 'income' ? 'income' : 'expense');
  const [accountId, setAccountId] = useState(() => preset?.account_id ?? defaultAccount(snapshot!));
  const [categoryId, setCategoryId] = useState(() => preset?.category_id ?? defaultCategory(snapshot!, preset?.kind === 'income' ? 'income' : 'expense'));
  const [date, setDate] = useState(() => initial ? new Date(`${initial.occurred_on}T12:00:00`) : new Date());
  const [note, setNote] = useState(preset?.note ?? '');
  const [details, setDetails] = useState(Boolean(preset?.note));
  const [pickDate, setPickDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'name' | 'amount' | 'save' | 'delete' | 'conflict' | null>(null);
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
  const categories = snapshot!.categories.filter(item => item.kind === kind && (!item.archived || item.id === (original?.category_id ?? (templateMode ? template?.category_id : undefined))));
  async function submit() {
    if (lock.current || !account) return;
    if (templateMode && (!templateName.trim() || templateName.trim().length > 80)) { setError('name'); return; }
    let input: RecordInput;
    try {
      input = { id: requestId, kind, accountId, categoryId, amount: parseAmount(amount, account.currency, preferences.language),
        occurredOn: localDay(date), note, source: original?.source ?? 'manual' };
    } catch { setError('amount'); return; }
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try { if (templateMode) await saveTemplate({ id: requestId, name: templateName.trim(), kind, account_id: accountId, currency: input.amount.currency, minor: input.amount.minor, category_id: categoryId, note }, template ?? null); else if (original) await update(input, original); else await save(input); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && (failure.code === 'conflict' || failure.code === 'missing') ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirmDelete() {
    if (lock.current || (!original && !(templateMode && template))) return;
    Alert.alert(templateMode ? t.removeTemplate : t.deleteTitle, templateMode ? t.removeTemplateBody : t.deleteBody, [
      { text: t.cancel, style: 'cancel' },
      { text: templateMode ? t.removeTemplate : t.deleteRecord, style: 'destructive', onPress: () => { void deleteEntry(); } },
    ]);
  }
  async function deleteEntry() {
    if (lock.current || (!original && !(templateMode && template))) return;
    lock.current = true; setBusy(true); setError(null);
    try { if (templateMode && template) await removeTemplate(template); else if (original) await remove(original); setDeleted(true); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && failure.code === 'conflict' ? 'conflict' : 'delete'); }
    finally { lock.current = false; setBusy(false); }
  }
  // Wait for the navigation guard to render with the committed state before leaving.
  if (done && templateMode) return <Screen><AppText accessibilityRole="alert">{deleted ? t.templateRemoved : t.templateSaved}</AppText><LedgerStatus showUndo={false} /><ActionButton title={t.templates} onPress={() => router.replace('/templates')} /></Screen>;
  if (done) return <Screen>{original && <AppText accessibilityRole="alert">{deleted ? t.deleted : t.updated}</AppText>}<LedgerStatus showUndo={!original} /><ActionButton title={t.transactions} onPress={() => router.replace('/(tabs)/transactions')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}>
    <Screen form>
      <DemoNotice />
      <FeatureIntro icon={templateMode ? 'lightning-bolt-outline' : kind === 'income' ? 'arrow-bottom-left' : 'arrow-top-right'} title={templateMode ? (template ? t.editTemplate : t.addTemplate) : t.entryIntro} />
      {templateMode && <><TextInput mode="outlined" label={t.templateName} accessibilityLabel={t.templateName} value={templateName} maxLength={80} editable={!busy} error={error === 'name'} onChangeText={value => { setTemplateName(value); setDirty(true); setError(null); }} /><AppText muted variant="caption">{t.templateHelp}</AppText></>}
      {error === 'name' && <AppText accessibilityRole="alert">{t.templateNameError}</AppText>}
      <View style={{ gap: spacing.sm }}>
        <AppText muted variant="caption">{t.amount} · {account?.currency}</AppText>
        <TextInput mode="flat" accessibilityLabel={t.amount} value={amount} placeholder={preferences.language === 'tr' ? '0,00' : '0.00'}
          onChangeText={value => { setAmount(value); setDirty(true); setError(null); }} underlineColor={colors.separator} activeUnderlineColor={colors.accent}
          editable={!busy} keyboardType="decimal-pad" autoFocus maxLength={40} error={error === 'amount'}
          style={{ backgroundColor: colors.surface, fontSize: typography.display }} contentStyle={{ ...faces.semibold, paddingHorizontal: spacing.xs, fontVariant: ['tabular-nums'] }} />
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
          {snapshot!.accounts.filter(item => !item.archived || item.id === (original?.account_id ?? (templateMode ? template?.account_id : undefined))).map(item => <Picker.Item key={item.id} value={item.id} label={`${entityName(item, preferences.language)} · ${item.currency}${item.archived ? ` · ${t.archived}` : ''}`} />)}
        </Picker>
      </Host>
      </View><Divider />
      {!templateMode && <List.Item title={t.date} description={new Intl.DateTimeFormat(preferences.language, { dateStyle: 'medium' }).format(date)}
        accessibilityRole="button" accessibilityLabel={`${t.date}: ${localDay(date)}`} disabled={busy}
        left={props => <List.Icon {...props} icon="calendar-blank-outline" />} right={props => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => { Keyboard.dismiss(); setPickDate(true); }} />}
      </View>
      {!templateMode && pickDate && <DateTimePicker value={date} mode="date" locale={preferences.language} themeVariant={isDark ? 'dark' : 'light'} accentColor={colors.accent}
        onValueChange={(_, value) => { setDate(value); setPickDate(false); setDirty(true); }} onDismiss={() => setPickDate(false)} />}
      <Button icon="text-box-outline" style={{ alignSelf: 'flex-start' }} disabled={busy} onPress={() => setDetails(value => !value)}>{t.details}</Button>
      {details && <TextInput mode="outlined" label={t.note} accessibilityLabel={t.note} value={note} onChangeText={value => { setNote(value); setDirty(true); }} editable={!busy} maxLength={500} multiline style={{ backgroundColor: colors.surface }} />}
      {error === 'save' && <AppText accessibilityRole="alert">{t.entryError}</AppText>}
      {error === 'delete' && <AppText accessibilityRole="alert">{t.deleteError}</AppText>}
      {error === 'conflict' && <AppText accessibilityRole="alert">{templateMode ? t.templateConflict : t.editConflict}</AppText>}
      <ActionButton title={busy ? t.saving : t.save} icon="check" busy={busy} disabled={!account} onPress={() => { void submit(); }} />
      {(original || (templateMode && template)) && <Button accessibilityLabel={templateMode ? t.removeTemplate : t.deleteRecord} icon="trash-can-outline" textColor={colors.expense} disabled={busy} onPress={confirmDelete}>{templateMode ? t.removeTemplate : t.deleteRecord}</Button>}
      <AppText muted variant="caption" style={{ textAlign: 'center' }}>{t.offlineReady}</AppText>
    </Screen>
  </KeyboardAvoidingView>;
}
