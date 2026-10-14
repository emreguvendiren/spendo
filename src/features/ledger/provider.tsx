import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Account, Budget, EntryTemplate, Goal, Contribution, ContributionInput, Category, Ledger, LedgerSnapshot, RecordInput, RecordRow, TransferFeeInput } from '@/db/ledger';
import { Money } from '@/domain/money';
import { openLedger } from '@/db/open';

type State = { snapshot: LedgerSnapshot | null; loading: boolean; error: boolean; lastSaved: string | null };
type ArchiveActions = { archiveAccount: (account: Account, archived: boolean) => Promise<void>; archiveCategory: (category: Category, archived: boolean) => Promise<void> };
type Context = State & { refresh: () => Promise<void>; save: (input: RecordInput) => Promise<RecordRow>; update: (input: RecordInput, expected: RecordRow) => Promise<RecordRow>; remove: (expected: RecordRow, expectedFee?: RecordRow | null) => Promise<void>; undo: () => Promise<void>; createAccount: (account: Account, opening: Money, day: string) => Promise<void>; renameAccount: (account: Account, name: string) => Promise<void>; createCategory: (category: Category) => Promise<void>; renameCategory: (category: Category, name: string) => Promise<void> };
type OpeningActions = { setOpening: (input: Extract<RecordInput, { kind: 'opening' }>, expected: RecordRow | null) => Promise<RecordRow> };
type TransferActions = { saveTransfer: (input: Extract<RecordInput, { kind: 'transfer' }>, fee: TransferFeeInput | null, expected?: RecordRow, expectedFee?: RecordRow | null) => Promise<RecordRow> };
type BudgetActions = { saveBudget: (input: Budget, expected: Budget | null) => Promise<void>; removeBudget: (expected: Budget) => Promise<void> };
type GoalActions = { saveGoal: (input: Goal, expected: Goal | null) => Promise<void>; removeGoal: (expected: Goal) => Promise<void>; addContribution: (input: ContributionInput) => Promise<void>; removeContribution: (expected: Contribution) => Promise<void> };
type TemplateActions = { saveTemplate: (input: EntryTemplate, expected: EntryTemplate | null) => Promise<void>; removeTemplate: (expected: EntryTemplate) => Promise<void> };
const LedgerContext = createContext<(Context & ArchiveActions & OpeningActions & TransferActions & BudgetActions & GoalActions & TemplateActions) | null>(null);
export function LedgerProvider({ children, open = openLedger }: PropsWithChildren<{ open?: () => Promise<Ledger> }>) {
  const [state, setState] = useState<State>({ snapshot: null, loading: true, error: false, lastSaved: null });
  const ledger = useRef<Ledger | null>(null);
  const alive = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const readVersion = useRef(0);
  const refresh = useCallback(async () => {
    const current = ledger.current;
    if (!current) {
      setState(previous => ({ ...previous, loading: true, error: false }));
      setAttempt(value => value + 1); return;
    }
    const version = ++readVersion.current;
    setState(previous => ({ ...previous, loading: true }));
    try {
      const snapshot = await current.snapshot();
      if (alive.current && ledger.current === current && version === readVersion.current) setState(previous => ({ ...previous, snapshot, loading: false, error: false }));
    } catch {
      if (alive.current && ledger.current === current && version === readVersion.current) setState(previous => ({ ...previous, loading: false, error: true }));
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    let owned: Ledger | null = null;
    alive.current = true;
    void (async () => {
      try {
        owned = await open();
        if (disposed) { await owned.close(); return; }
        await owned.bootstrap();
        const snapshot = await owned.snapshot();
        if (disposed) { await owned.close(); return; }
        ledger.current = owned;
        setState(previous => ({ ...previous, snapshot, loading: false, error: false }));
      } catch {
        await owned?.close().catch(() => undefined);
        if (!disposed) setState(previous => ({ ...previous, loading: false, error: true }));
      }
    })();
    return () => {
      disposed = true; alive.current = false;
      if (ledger.current === owned) {
        ledger.current = null;
        void owned?.close().catch(() => undefined);
      }
    };
  }, [open, attempt]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => { if (next === 'active' && ledger.current) void refresh(); });
    return () => subscription.remove();
  }, [refresh]);
  async function save(input: RecordInput) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    const result = await ledger.current.post(input);
    if (alive.current) setState(previous => ({ ...previous, lastSaved: result.voided ? null : result.id }));
    // A failed refresh must not turn an already committed write into a failed save.
    if (alive.current) await refresh();
    return result;
  }
  async function setOpening(input: Extract<RecordInput, { kind: 'opening' }>, expected: RecordRow | null) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    const result = await ledger.current.setOpening(input, expected);
    if (alive.current) {
      setState(previous => ({ ...previous, lastSaved: previous.lastSaved === result.id ? null : previous.lastSaved }));
      await refresh();
    }
    return result;
  }
  async function undo() {
    if (!ledger.current || !state.lastSaved) return;
    await ledger.current.voidRecord(state.lastSaved);
    if (alive.current) setState(previous => ({ ...previous, lastSaved: null }));
    if (alive.current) await refresh();
  }
  async function update(input: RecordInput, expected: RecordRow) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    const result = input.kind === 'transfer' && expected.kind === 'transfer' ? await ledger.current.updateTransfer(input, expected) : await ledger.current.update(input, expected);
    if (alive.current) {
      setState(previous => ({ ...previous, lastSaved: previous.lastSaved === result.id ? null : previous.lastSaved }));
      await refresh();
    }
    return result;
  }
  async function saveTransfer(input: Extract<RecordInput, { kind: 'transfer' }>, fee: TransferFeeInput | null, expected?: RecordRow, expectedFee?: RecordRow | null) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    const result = await ledger.current.writeTransfer(input, fee, expected, expectedFee);
    if (alive.current) {
      setState(previous => ({ ...previous, lastSaved: expected ? previous.lastSaved === result.id ? null : previous.lastSaved : result.id }));
      await refresh();
    }
    return result;
  }
  async function remove(expected: RecordRow, expectedFee?: RecordRow | null) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    if (expectedFee === undefined) await ledger.current.voidRecord(expected.id, expected);
    else await ledger.current.voidRecord(expected.id, expected, expectedFee);
    if (alive.current) {
      setState(previous => ({ ...previous, lastSaved: previous.lastSaved === expected.id ? null : previous.lastSaved }));
      await refresh();
    }
  }
  async function createAccount(account: Account, opening: Money, day: string) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.createAccountWithOpening(account, opening, day);
    if (alive.current) await refresh();
  }
  async function renameAccount(account: Account, name: string) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.renameAccount(account.id, name, account.name);
    if (alive.current) await refresh();
  }
  async function createCategory(category: Category) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.createCategory(category);
    if (alive.current) await refresh();
  }
  async function renameCategory(category: Category, name: string) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.renameCategory(category.id, name, category.name);
    if (alive.current) await refresh();
  }
  async function saveTemplate(input: EntryTemplate, expected: EntryTemplate | null) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.setTemplate(input, expected);
    if (alive.current) await refresh();
  }
  async function removeTemplate(expected: EntryTemplate) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.removeTemplate(expected);
    if (alive.current) await refresh();
  }
  async function saveGoal(input: Goal, expected: Goal | null) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.setGoal(input, expected);
    if (alive.current) await refresh();
  }
  async function removeGoal(expected: Goal) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.removeGoal(expected);
    if (alive.current) await refresh();
  }
  async function addContribution(input: ContributionInput) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.addContribution(input);
    if (alive.current) await refresh();
  }
  async function removeContribution(expected: Contribution) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.removeContribution(expected);
    if (alive.current) await refresh();
  }
  async function saveBudget(input: Budget, expected: Budget | null) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.setBudget(input, expected);
    if (alive.current) await refresh();
  }
  async function removeBudget(expected: Budget) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.removeBudget(expected);
    if (alive.current) await refresh();
  }
  async function archiveAccount(account: Account, archived: boolean) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.setAccountArchived(account.id, archived);
    if (alive.current) await refresh();
  }
  async function archiveCategory(category: Category, archived: boolean) {
    if (!ledger.current) throw new Error('ledger.unavailable');
    await ledger.current.setCategoryArchived(category.id, archived);
    if (alive.current) await refresh();
  }
  return <LedgerContext.Provider value={{ ...state, refresh, save, update, remove, undo, createAccount, renameAccount, createCategory, renameCategory, archiveAccount, archiveCategory, setOpening, saveTransfer, saveBudget, removeBudget, saveGoal, removeGoal, addContribution, removeContribution, saveTemplate, removeTemplate }}>{children}</LedgerContext.Provider>;
}
export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('LedgerProvider is required');
  return context;
}
