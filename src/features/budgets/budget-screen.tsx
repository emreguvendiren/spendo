import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import { LedgerError, validateMonth } from '@/db/ledger';
import { amountText, Currency, currencyDigits, money, parseAmount } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { usePreferences } from '@/features/preferences/provider';
import { useLedger } from '@/features/ledger/provider';
import { LedgerStatus } from '@/features/ledger/status';
import { defaultCategory, entityName } from '@/features/ledger/model';
import { layout, spacing } from '@/theme/tokens';

type Props = { month?: string; currency?: string; categoryId?: string };
export default function BudgetScreen(props: Props) {
  const { snapshot } = useLedger();
  const { t } = usePreferences();
  if (!snapshot) return <Screen><LedgerStatus showUndo={false} /></Screen>;
  try { validateMonth(props.month ?? ''); if (!Object.hasOwn(currencyDigits, props.currency ?? '')) throw new Error('currency'); }
  catch { return <Screen><AppText accessibilityRole="alert">{t.budgetUnavailable}</AppText></Screen>; }
  return <BudgetForm key={`${props.month}-${props.currency}-${props.categoryId ?? 'new'}`} month={props.month!} currency={props.currency as Currency} categoryId={props.categoryId} />;
}
function BudgetForm({ month, currency, categoryId }: { month: string; currency: Currency; categoryId?: string }) {
  const { snapshot, saveBudget, removeBudget } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences();
  const router = useRouter(), navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const [original] = useState(() => snapshot!.budgets?.find(item => item.month === month && item.currency === currency && item.category_id === categoryId) ?? null);
  const [category, setCategory] = useState(categoryId ?? defaultCategory(snapshot!, 'expense'));
  const [amount, setAmount] = useState(() => original ? amountText(money(original.minor, currency), preferences.language) : '');
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [removed, setRemoved] = useState(false);
  const [error, setError] = useState<'amount' | 'save' | 'conflict' | null>(null);
  const lock = useRef(false);
  usePreventRemove(!done && (dirty || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [{ text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) }]);
  });
  async function submit() {
    if (lock.current) return;
    let parsed;
    try { parsed = parseAmount(amount, currency, preferences.language); } catch { setError('amount'); return; }
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try { await saveBudget({ month, currency, category_id: category, minor: parsed.minor }, original); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && ['conflict', 'archived'].includes(failure.code) ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove() {
    if (!original || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await removeBudget(original); setRemoved(true); setDone(true); }
    catch (failure) { setError(failure instanceof LedgerError && failure.code === 'conflict' ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (categoryId && !original) return <Screen><AppText accessibilityRole="alert">{t.budgetUnavailable}</AppText></Screen>;
  if (done) return <Screen><AppText accessibilityRole="alert">{removed ? t.budgetRemoved : t.budgetSaved}</AppText><LedgerStatus showUndo={false} /><ActionButton title={t.reports} onPress={() => router.back()} /></Screen>;
  if (!original && !snapshot!.categories.some(item => item.kind === 'expense' && !item.archived)) return <Screen><AppText>{t.noCategories}</AppText><ActionButton title={t.categories} onPress={() => router.push('/categories')} /></Screen>;
  const label = new Intl.DateTimeFormat(preferences.language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-15T12:00:00Z`));
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}><Screen>
    <AppText variant="heading">{label} · {currency}</AppText>
    <AppText muted>{t.budgetHelp}</AppText>
    <View style={{ gap: spacing.sm }}><AppText>{t.category}</AppText>
      <Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}>
        <Picker testID="budget-category" selectedValue={category} enabled={!busy && !original} onValueChange={value => { setCategory(value); setDirty(true); setError(null); }}>
          {snapshot!.categories.filter(item => item.kind === 'expense' && (!item.archived || item.id === original?.category_id)).map(item => <Picker.Item key={item.id} value={item.id} label={`${entityName(item, preferences.language)}${item.archived ? ` · ${t.archived}` : ''}`} />)}
        </Picker>
      </Host>
    </View>
    <TextInput mode="outlined" label={`${t.budgetLimit} · ${currency}`} accessibilityLabel={t.budgetLimit} value={amount} maxLength={40} editable={!busy} keyboardType="decimal-pad" error={error === 'amount'} onChangeText={value => { setAmount(value); setDirty(true); setError(null); }} />
    {error && <AppText accessibilityRole="alert">{error === 'amount' ? t.amountError : error === 'conflict' ? t.budgetConflict : t.entryError}</AppText>}
    <ActionButton title={busy ? t.saving : t.save} busy={busy} onPress={() => { void submit(); }} />
    {original && <Button accessibilityLabel={t.removeBudget} icon="trash-can-outline" textColor={colors.expense} disabled={busy} onPress={() => Alert.alert(t.removeBudget, t.removeBudgetBody, [{ text: t.cancel, style: 'cancel' }, { text: t.removeBudget, style: 'destructive', onPress: () => { void remove(); } }])}>{t.removeBudget}</Button>}
  </Screen></KeyboardAvoidingView>;
}
