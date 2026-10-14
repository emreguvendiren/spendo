import { MoneyInput } from '@/components/money-input';
import { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Host, Picker } from '@expo/ui';
import { randomUUID } from 'expo-crypto';
import { useNavigation, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import { LedgerError } from '@/db/ledger';
import { amountText, Currency, currencyDigits, money, parseAmount } from '@/domain/money';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { FeatureIntro } from '@/components/feature-intro';
import { Panel } from '@/components/panel';
import { ActionButton } from '@/components/action-button';
import { useLedger } from '@/features/ledger/provider';
import { LedgerStatus } from '@/features/ledger/status';
import { usePreferences } from '@/features/preferences/provider';
import { displayAmount, localDay } from '@/features/ledger/model';
import { layout, spacing } from '@/theme/tokens';
import { GoalProgress } from './goal-progress';
export default function GoalScreen({ goalId }: { goalId?: string }) {
  const { snapshot } = useLedger();
  if (!snapshot) return <Screen><LedgerStatus showUndo={false} /></Screen>;
  return <GoalForm key={goalId ?? 'new'} goalId={goalId} />;
}
function GoalForm({ goalId }: { goalId?: string }) {
  const { snapshot, saveGoal, removeGoal, addContribution, removeContribution } = useLedger();
  const { t, colors, isDark, preferences } = usePreferences(); const router = useRouter(), navigation = useNavigation(); const headerHeight = useHeaderHeight();
  const [original] = useState(() => snapshot!.goals?.find(item => item.id === goalId));
  const [id] = useState(() => original?.id ?? randomUUID());
  const [name, setName] = useState(original?.name ?? ''); const [currency, setCurrency] = useState<Currency>(original?.currency ?? 'TRY');
  const [target, setTarget] = useState(() => original ? amountText(money(original.target_minor, original.currency), preferences.language) : '');
  const [contribution, setContribution] = useState(''); const [contributionId, setContributionId] = useState(() => `contribution-${randomUUID()}`);
  const [contributionDay, setContributionDay] = useState(localDay);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [notice, setNotice] = useState(false), [removed, setRemoved] = useState(false);
  const [error, setError] = useState<'name' | 'amount' | 'contribution' | 'save' | 'conflict' | null>(null); const lock = useRef(false);
  usePreventRemove(!done && (dirty || !!contribution || busy), ({ data }) => {
    if (lock.current) return;
    Alert.alert(t.discardTitle, t.discardBody, [{ text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(data.action) }]);
  });
  async function perform(work: () => Promise<void>, finish: () => void) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); Keyboard.dismiss();
    try { await work(); finish(); }
    catch (failure) { setError(failure instanceof LedgerError && ['missing', 'conflict'].includes(failure.code) ? 'conflict' : 'save'); }
    finally { lock.current = false; setBusy(false); }
  }
  function submitGoal() {
    if (!name.trim() || name.trim().length > 80) { setError('name'); return; }
    let amount; try { amount = parseAmount(target, currency, preferences.language); } catch { setError('amount'); return; }
    void perform(() => saveGoal({ id, name: name.trim(), currency, target_minor: amount.minor }, original ?? null), () => setDone(true));
  }
  function contribute() {
    if (!original || dirty) return;
    let amount; try { amount = parseAmount(contribution, currency, preferences.language); } catch { setError('contribution'); return; }
    void perform(() => addContribution({ id: contributionId, goalId: id, amount, day: contributionDay }), () => { setContribution(''); setContributionId(`contribution-${randomUUID()}`); setContributionDay(localDay()); setNotice(true); });
  }
  if (goalId && !original) return <Screen><AppText accessibilityRole="alert">{t.goalUnavailable}</AppText></Screen>;
  if (done) return <Screen><AppText accessibilityRole="alert">{removed ? t.goalRemoved : t.goalSaved}</AppText><LedgerStatus showUndo={false} /><ActionButton title={t.goals} onPress={() => router.replace('/goals')} /></Screen>;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={headerHeight}><Screen form>
    <LedgerStatus showUndo={false} />
    <FeatureIntro icon="bullseye-arrow" title={t.goalDetails} />
    <TextInput mode="outlined" label={t.goalName} accessibilityLabel={t.goalName} value={name} maxLength={80} editable={!busy} error={error === 'name'} onChangeText={value => { setName(value); setDirty(true); setError(null); }} />
    {error === 'name' && <AppText accessibilityRole="alert">{t.goalNameError}</AppText>}
    {original ? <AppText muted>{currency}</AppText> : <View style={{ gap: spacing.sm }}><AppText>{t.currency}</AppText><Host matchContents colorScheme={isDark ? 'dark' : 'light'} seedColor={colors.accent} style={{ minHeight: layout.touchTarget }}><Picker testID="goal-currency" selectedValue={currency} enabled={!busy} onValueChange={value => { setCurrency(value); setDirty(true); }}>
      {(Object.keys(currencyDigits) as Currency[]).map(code => <Picker.Item key={code} value={code} label={code} />)}
    </Picker></Host></View>}
    <MoneyInput mode="outlined" label={`${t.goalTarget} · ${currency}`} accessibilityLabel={t.goalTarget} value={target} maxLength={40} editable={!busy} keyboardType="decimal-pad" error={error === 'amount'} onChangeText={value => { setTarget(value); setDirty(true); setError(null); }} />
    {error === 'amount' && <AppText accessibilityRole="alert">{t.amountError}</AppText>}
    <ActionButton title={busy ? t.saving : t.save} busy={busy} onPress={submitGoal} />
    <AppText muted variant="caption">{t.goalHelp}</AppText>
    {original && <>
      <Panel style={{ backgroundColor: colors.background }}>
      <FeatureIntro icon="piggy-bank-outline" title={t.contributionDetails} />
      <GoalProgress goal={original} />
      <MoneyInput mode="outlined" label={`${t.goalContribution} · ${currency}`} accessibilityLabel={t.goalContribution} value={contribution} maxLength={40} editable={!busy && !dirty} keyboardType="decimal-pad" error={error === 'contribution'} onChangeText={value => { setContribution(value); setError(null); setNotice(false); }} />
      {error === 'contribution' && <AppText accessibilityRole="alert">{t.amountError}</AppText>}
      <ActionButton title={t.addContribution} secondary busy={busy} disabled={dirty} onPress={contribute} />
      </Panel>
      {notice && <AppText accessibilityRole="alert">{t.contributionSaved}</AppText>}
      <AppText variant="heading">{t.recentContributions}</AppText>
      {(snapshot!.contributions ?? []).filter(item => item.goal_id === id).slice(0, 5).map(item => <View key={item.id} style={{ gap: spacing.sm }}><AppText>{displayAmount({ minor: item.minor, currency }, preferences.language)} · {item.occurred_on}</AppText><Button accessibilityLabel={`${t.removeContribution}: ${displayAmount({ minor: item.minor, currency }, preferences.language)}, ${item.occurred_on}`} disabled={busy || dirty} onPress={() => Alert.alert(t.removeContribution, t.removeContributionBody, [{ text: t.cancel, style: 'cancel' }, { text: t.removeContribution, style: 'destructive', onPress: () => { void perform(() => removeContribution(item), () => setNotice(false)); } }])}>{t.removeContribution}</Button></View>)}
      <Button accessibilityLabel={t.removeGoal} textColor={colors.expense} disabled={busy || dirty} onPress={() => Alert.alert(t.removeGoal, t.removeGoalBody, [{ text: t.cancel, style: 'cancel' }, { text: t.removeGoal, style: 'destructive', onPress: () => { void perform(() => removeGoal(original), () => { setRemoved(true); setDone(true); }); } }])}>{t.removeGoal}</Button>
    </>}
    {error === 'save' && <AppText accessibilityRole="alert">{t.entryError}</AppText>}
    {error === 'conflict' && <AppText accessibilityRole="alert">{t.goalConflict}</AppText>}
  </Screen></KeyboardAvoidingView>;
}
