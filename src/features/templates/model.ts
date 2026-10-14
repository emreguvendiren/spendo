import { EntryTemplate, LedgerSnapshot, RecordRow } from '@/db/ledger';
import { localDay } from '@/features/ledger/model';
export function templateUsable(snapshot: LedgerSnapshot, template: EntryTemplate) {
  return !template.deleted && snapshot.accounts.some(account => account.id === template.account_id && !account.archived && account.currency === template.currency)
    && snapshot.categories.some(category => category.id === template.category_id && !category.archived && category.kind === template.kind);
}
export function templateRecord(template: EntryTemplate, day = localDay()): RecordRow {
  return { id: template.id, kind: template.kind, account_id: template.account_id, currency: template.currency, minor: template.minor, category_id: template.category_id,
    note: template.note, target_id: null, target_currency: null, target_minor: null, occurred_on: day, created_at: '', source: 'manual', voided: 0 };
}
