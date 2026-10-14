import { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Icon } from 'react-native-paper';
import { useLedger } from './provider';
import { usePreferences } from '@/features/preferences/provider';
import { AppText } from '@/components/app-text';
import { ActionButton } from '@/components/action-button';
import { layout, radius, spacing } from '@/theme/tokens';
export function LedgerStatus() {
  const { loading, error, refresh, lastSaved, undo } = useLedger();
  const { t, colors } = usePreferences();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const lock = useRef(false);
  async function reverse() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setFailed(false);
    try { await undo(); } catch { setFailed(true); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!loading && !error && !lastSaved && !failed) return null;
  return <View style={{ gap: spacing.sm }}>
    {loading && <ActivityIndicator accessibilityLabel={t.ledgerLoading} color={colors.accent} />}
    {error && <><AppText accessibilityRole="alert">{t.ledgerError}</AppText><ActionButton title={t.retry} disabled={loading} onPress={() => { void refresh(); }} secondary /></>}
    {lastSaved && <View style={{ backgroundColor: colors.incomeTint, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
      <Icon source="check-circle-outline" color={colors.income} size={layout.icon} />
      <AppText accessibilityLiveRegion="polite" variant="caption" style={{ color: colors.income, flexGrow: 1 }}>{t.saved}</AppText>
      <Button loading={busy} disabled={busy} textColor={colors.income} onPress={() => { void reverse(); }}>{t.undo}</Button>
    </View>}
    {failed && <AppText accessibilityRole="alert">{t.undoError}</AppText>}
  </View>;
}
