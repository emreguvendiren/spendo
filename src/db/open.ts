import { openDatabaseAsync } from 'expo-sqlite';
import { configure } from './connection';
import { migrate } from './migrations';
import { Ledger } from './ledger';

/** The caller owns one ledger for the app lifecycle and closes it on teardown. */
export async function openLedger(): Promise<Ledger> {
  const connection = await openDatabaseAsync('spendo.db', { useNewConnection: true });
  try {
    const db = await configure(connection);
    await migrate(db);
    return new Ledger(db);
  } catch {
    await connection.closeAsync();
    // Native SQL errors must not expose user data to UI/logging.
    throw new Error('database.open');
  }
}
