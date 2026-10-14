import { Database } from './connection';

const schema = `
CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
  kind TEXT NOT NULL CHECK(kind IN ('cash','bank','credit','other')),
  currency TEXT NOT NULL CHECK(currency IN ('TRY','USD','EUR','GBP','JPY','KWD')),
  UNIQUE(id, currency)
) STRICT;
CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
  kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
  UNIQUE(id, kind)
) STRICT;
CREATE TABLE records (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('income','expense','opening','transfer')),
  account_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  minor INTEGER NOT NULL CHECK(minor BETWEEN -9007199254740991 AND 9007199254740991),
  category_id TEXT,
  target_id TEXT,
  target_currency TEXT,
  target_minor INTEGER,
  occurred_on TEXT NOT NULL,
  created_at TEXT NOT NULL,
  note TEXT NOT NULL CHECK(length(note) <= 500),
  source TEXT NOT NULL CHECK(source IN ('manual','import','recurring','assistant')),
  voided INTEGER NOT NULL DEFAULT 0 CHECK(voided IN (0,1)),
  FOREIGN KEY(account_id, currency) REFERENCES accounts(id, currency),
  FOREIGN KEY(category_id, kind) REFERENCES categories(id, kind),
  FOREIGN KEY(target_id, target_currency) REFERENCES accounts(id, currency),
  CHECK (
    (kind IN ('income','expense') AND minor > 0 AND category_id IS NOT NULL
      AND target_id IS NULL AND target_currency IS NULL AND target_minor IS NULL)
    OR (kind = 'opening' AND category_id IS NULL
      AND target_id IS NULL AND target_currency IS NULL AND target_minor IS NULL)
    OR (kind = 'transfer' AND minor > 0 AND category_id IS NULL
      AND target_id IS NOT NULL AND target_id <> account_id AND target_currency IS NOT NULL
      AND target_minor IS NOT NULL AND target_minor BETWEEN 1 AND 9007199254740991
      AND (currency <> target_currency OR minor = target_minor))
  )
) STRICT;
CREATE UNIQUE INDEX one_opening ON records(account_id) WHERE kind = 'opening' AND voided = 0;
CREATE INDEX records_date ON records(occurred_on DESC, created_at DESC, id);
CREATE INDEX records_account ON records(account_id);
CREATE INDEX records_target ON records(target_id) WHERE target_id IS NOT NULL;
`;

export async function migrate(db: Database): Promise<void> {
  await db.transaction(async tx => {
    const [version] = await tx.getAllAsync<{ user_version: number }>('PRAGMA user_version', []);
    if (!version || version.user_version > 1 || version.user_version < 0) throw new Error('database.version');
    if (version.user_version === 0) {
      await tx.execAsync(schema);
      await tx.execAsync('PRAGMA user_version = 1');
    }
  });
}
