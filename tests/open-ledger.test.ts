import { openLedger } from '@/db/open';
import { openDatabaseAsync } from 'expo-sqlite';
import { configure } from '@/db/connection';
import { migrate } from '@/db/migrations';
import { demoData } from '@/db/demo';

let mockDevelopment = true;
const mockLedger = { bootstrap: jest.fn(), seedDevelopment: jest.fn(), developmentDay: jest.fn() };
const mockClose = jest.fn();
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('@/db/connection', () => ({ configure: jest.fn() }));
jest.mock('@/db/migrations', () => ({ migrate: jest.fn() }));
jest.mock('@/db/ledger', () => ({ Ledger: jest.fn(() => mockLedger) }));
jest.mock('@/db/demo', () => ({ demoData: jest.fn(() => ({ accounts: [], records: [] })), demoHistory: jest.fn(() => ({ accounts: [], records: [] })), demoBudgets: jest.fn(() => ({ accounts: [], records: [], budgets: [] })), demoGoals: jest.fn(() => ({ accounts: [], records: [], goals: [], contributions: [] })), demoTemplates: jest.fn(() => ({ accounts: [], records: [], templates: [] })) }));
jest.mock('@/db/environment', () => ({
  get developmentDataEnabled() { return mockDevelopment; },
  ledgerDatabaseName: (development: boolean) => development ? 'spendo-demo.db' : 'spendo.db',
}));

beforeEach(() => {
  jest.clearAllMocks(); mockDevelopment = true;
  jest.mocked(openDatabaseAsync).mockResolvedValue({ closeAsync: mockClose } as unknown as Awaited<ReturnType<typeof openDatabaseAsync>>);
  jest.mocked(configure).mockResolvedValue({} as Awaited<ReturnType<typeof configure>>);
  jest.mocked(migrate).mockResolvedValue(undefined);
  mockLedger.bootstrap.mockResolvedValue(undefined);
  mockLedger.seedDevelopment.mockResolvedValue(undefined);
  mockLedger.developmentDay.mockResolvedValue('2026-10-14');
  mockClose.mockResolvedValue(undefined);
});

test('development opening seeds the demo database before handing it to the provider', async () => {
  expect(await openLedger()).toBe(mockLedger);
  expect(openDatabaseAsync).toHaveBeenCalledWith('spendo-demo.db', { useNewConnection: true });
  expect(mockLedger.bootstrap).toHaveBeenCalledTimes(1);
  expect(demoData).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  expect(mockLedger.seedDevelopment).toHaveBeenCalledWith({ accounts: [], records: [] });
  expect(mockLedger.seedDevelopment).toHaveBeenNthCalledWith(2, { accounts: [], records: [] }, 2);
  expect(mockLedger.seedDevelopment).toHaveBeenNthCalledWith(3, { accounts: [], records: [], budgets: [] }, 3);
  expect(mockLedger.seedDevelopment).toHaveBeenNthCalledWith(4, { accounts: [], records: [], goals: [], contributions: [] }, 4);
  expect(mockLedger.seedDevelopment).toHaveBeenLastCalledWith({ accounts: [], records: [], templates: [] }, 5);
});

test('production opening never seeds sample data', async () => {
  mockDevelopment = false;
  await openLedger();
  expect(openDatabaseAsync).toHaveBeenCalledWith('spendo.db', { useNewConnection: true });
  expect(mockLedger.bootstrap).not.toHaveBeenCalled();
  expect(mockLedger.seedDevelopment).not.toHaveBeenCalled();
  expect(demoData).not.toHaveBeenCalled();
});

test('seed failure closes the connection and exposes no raw database error', async () => {
  mockLedger.seedDevelopment.mockRejectedValueOnce(new Error('private failure'));
  await expect(openLedger()).rejects.toThrow('database.open');
  expect(mockClose).toHaveBeenCalledTimes(1);
});
