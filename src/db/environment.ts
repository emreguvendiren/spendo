export const developmentDataEnabled = __DEV__;
export function ledgerDatabaseName(development: boolean): string {
  return development ? 'spendo-demo.db' : 'spendo.db';
}
