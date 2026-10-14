import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { usePreferences } from '@/features/preferences/provider';
export function EmptyScreen({ kind }: { kind: 'transactions' | 'reports' | 'assistant' }) {
  const { t } = usePreferences();
  const title = kind === 'transactions' ? t.noTransactions : kind === 'reports' ? t.reportsTitle : t.assistantTitle;
  const body = kind === 'transactions' ? t.noTransactionsBody : kind === 'reports' ? t.reportsBody : t.assistantBody;
  return <Screen><AppText variant="title">{title}</AppText><AppText muted>{body}</AppText>
    {kind === 'transactions' && <AppText muted variant="caption">{t.phaseNote}</AppText>}
  </Screen>;
}
