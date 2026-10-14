import { Account, RecordInput, RecordRow, validateDay } from '@/db/ledger';
import { parseAmount } from '@/domain/money';
import { Language } from '@/i18n/messages';
import { localDay } from './model';

export class TransferError extends Error {
  constructor() { super('transfer.accounts'); }
}
export function transferInput(draft: { id: string; sourceId: string; targetId: string; amount: string; targetAmount: string; date: Date; note: string }, accounts: Account[], language: Language, previous?: RecordRow): Extract<RecordInput, { kind: 'transfer' }> {
  const source = accounts.find(account => account.id === draft.sourceId);
  const target = accounts.find(account => account.id === draft.targetId);
  if (!source || !target || (source.archived && source.id !== previous?.account_id) || (target.archived && target.id !== previous?.target_id) || source.id === target.id) throw new TransferError();
  const amount = parseAmount(draft.amount, source.currency, language);
  const targetAmount = source.currency === target.currency ? amount : parseAmount(draft.targetAmount, target.currency, language);
  const occurredOn = localDay(draft.date);
  validateDay(occurredOn);
  return { id: draft.id, kind: 'transfer', accountId: source.id, targetId: target.id, amount, targetAmount, occurredOn, note: draft.note, source: previous?.source ?? 'manual' };
}
