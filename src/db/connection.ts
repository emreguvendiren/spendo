export type SqlValue = string | number | null;
export interface Connection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  closeAsync(): Promise<void>;
}

/** Owns a private connection. All reads, writes and close are queued on this owner. */
export class Database {
  private tail: Promise<unknown> = Promise.resolve();
  private closed = false;
  private failed = false;

  constructor(private readonly connection: Connection) {}

  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.tail.then(work);
    this.tail = result.catch(() => undefined);
    return result;
  }

  transaction<T>(work: (connection: Connection) => Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      if (this.closed || this.failed) throw new Error('database.unavailable');
      await this.connection.execAsync('BEGIN IMMEDIATE');
      try {
        const result = await work(this.connection);
        await this.connection.execAsync('COMMIT');
        return result;
      } catch (error) {
        try { await this.connection.execAsync('ROLLBACK'); }
        catch { this.failed = true; }
        throw error;
      }
    });
  }

  close(): Promise<void> {
    return this.enqueue(async () => {
      if (!this.closed) {
        this.closed = true;
        await this.connection.closeAsync();
      }
    });
  }
}

export async function configure(connection: Connection): Promise<Database> {
  // Foreign keys are connection-local and must be enabled before BEGIN.
  await connection.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  const [state] = await connection.getAllAsync<{ foreign_keys: number }>('PRAGMA foreign_keys', []);
  if (state?.foreign_keys !== 1) throw new Error('database.foreignKeys');
  return new Database(connection);
}
