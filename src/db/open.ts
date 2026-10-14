import { openDatabaseAsync } from 'expo-sqlite';
import { configure } from './connection';
import { migrate } from './migrations';
import { Ledger } from './ledger';
import { developmentDataEnabled, ledgerDatabaseName } from './environment';
import { demoData, demoHistory } from './demo';

/** The caller owns one ledger for the app lifecycle and closes it on teardown. */
export async function openLedger(): Promise<Ledger> {
  const connection = await openDatabaseAsync(ledgerDatabaseName(developmentDataEnabled), { useNewConnection: true });
  try {
    const db = await configure(connection);
    await migrate(db);
    const ledger = new Ledger(db);
    if (developmentDataEnabled) {
      const now = new Date();
      const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      await ledger.bootstrap();
      await ledger.seedDevelopment(demoData(day));
      await ledger.seedDevelopment(demoHistory(await ledger.developmentDay()), 2);
    }
    return ledger;
  } catch {
    await connection.closeAsync();
    // Native SQL errors must not expose user data to UI/logging.
    throw new Error('database.open');
  }
}
