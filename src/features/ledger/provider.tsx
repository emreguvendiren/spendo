import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Ledger, LedgerSnapshot, RecordInput, RecordRow } from '@/db/ledger';
import { openLedger } from '@/db/open';

type State = { snapshot: LedgerSnapshot | null; loading: boolean; error: boolean; lastSaved: string | null };
type Context = State & { refresh: () => Promise<void>; save: (input: RecordInput) => Promise<RecordRow>; undo: () => Promise<void> };
const LedgerContext = createContext<Context | null>(null);
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
  async function undo() {
    if (!ledger.current || !state.lastSaved) return;
    await ledger.current.voidRecord(state.lastSaved);
    if (alive.current) setState(previous => ({ ...previous, lastSaved: null }));
    if (alive.current) await refresh();
  }
  return <LedgerContext.Provider value={{ ...state, refresh, save, undo }}>{children}</LedgerContext.Provider>;
}
export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('LedgerProvider is required');
  return context;
}
