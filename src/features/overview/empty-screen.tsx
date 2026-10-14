import { Screen } from '@/components/screen';
import { AppText } from '@/components/app-text';
import { FeatureIntro } from '@/components/feature-intro';
import { Panel } from '@/components/panel';
import { usePreferences } from '@/features/preferences/provider';
export function EmptyScreen({ kind }: { kind: 'transactions' | 'reports' | 'assistant' }) {
  const { t } = usePreferences();
  const title = kind === 'transactions' ? t.noTransactions : kind === 'reports' ? t.reportsTitle : t.assistantTitle;
  const body = kind === 'transactions' ? t.noTransactionsBody : kind === 'reports' ? t.reportsBody : t.assistantBody;
  return <Screen><FeatureIntro icon={kind === 'assistant' ? 'message-text-outline' : 'chart-bar'} title={title} /><Panel><AppText muted>{body}</AppText></Panel>
    {kind === 'transactions' && <AppText muted variant="caption">{t.phaseNote}</AppText>}
  </Screen>;
}
