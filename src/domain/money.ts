/** Supported currencies are explicit: unknown codes must never default to 2 digits. */
export const currencyDigits = { TRY: 2, USD: 2, EUR: 2, GBP: 2, JPY: 0, KWD: 3 } as const;
export type Currency = keyof typeof currencyDigits;
export type Money = Readonly<{ currency: Currency; minor: number }>;
export type MoneyErrorCode = 'currency' | 'format' | 'precision' | 'range' | 'positive' | 'mismatch';

export class MoneyError extends Error {
  constructor(public readonly code: MoneyErrorCode) {
    // Do not include user-entered amounts in error messages.
    super(`money.${code}`);
    this.name = 'MoneyError';
  }
}

function digitsFor(currency: Currency): number {
  if (!Object.hasOwn(currencyDigits, currency)) throw new MoneyError('currency');
  return currencyDigits[currency];
}

export function money(minor: number, currency: Currency): Money {
  digitsFor(currency);
  if (!Number.isSafeInteger(minor)) throw new MoneyError('range');
  return Object.freeze({ minor: minor === 0 ? 0 : minor, currency });
}

function fromExact(minor: bigint, currency: Currency): Money {
  const limit = BigInt(Number.MAX_SAFE_INTEGER);
  if (minor > limit || minor < -limit) throw new MoneyError('range');
  return money(Number(minor), currency);
}

/** Positive income/expense input. Grouping follows the selected UI language strictly. */
export function parseAmount(input: string, currency: Currency, language: 'tr' | 'en'): Money {
  const digits = digitsFor(currency);
  const value = input.trim();
  const decimal = language === 'tr' ? ',' : '.';
  const group = language === 'tr' ? '.' : ',';
  const parts = value.split(decimal);
  if (parts.length > 2) throw new MoneyError('format');
  const [whole, fraction] = parts;
  const groups = whole.split(group);
  const validWhole = groups.length === 1
    ? /^\d+$/.test(whole)
    : /^[1-9]\d{0,2}$/.test(groups[0]) && groups.slice(1).every(part => /^\d{3}$/.test(part));
  if (!validWhole || (fraction !== undefined && !/^\d+$/.test(fraction))) {
    throw new MoneyError('format');
  }
  if (fraction !== undefined && fraction.length > digits) throw new MoneyError('precision');
  const integer = groups.join('').replace(/^0+/, '') || '0';
  // Bound input before BigInt conversion; a supported safe integer has at most 16 digits.
  if (integer.length > 16) throw new MoneyError('range');
  const minor = BigInt(integer) * 10n ** BigInt(digits) + BigInt((fraction ?? '').padEnd(digits, '0') || '0');
  const result = fromExact(minor, currency);
  if (result.minor <= 0) throw new MoneyError('positive');
  return result;
}

/** Exact editable representation without grouping or floating-point division. */
export function amountText(value: Money, language: 'tr' | 'en'): string {
  const checked = money(value.minor, value.currency);
  const digits = digitsFor(checked.currency);
  const absolute = BigInt(checked.minor) < 0n ? -BigInt(checked.minor) : BigInt(checked.minor);
  const raw = absolute.toString().padStart(digits + 1, '0');
  const sign = checked.minor < 0 ? '-' : '';
  if (digits === 0) return sign + raw;
  return sign + raw.slice(0, -digits) + (language === 'tr' ? ',' : '.') + raw.slice(-digits);
}

/** Group the exact integer text; never convert minor units through floating-point division. */
export function displayMoney(value: Money, language: 'tr' | 'en'): string {
  const decimal = language === 'tr' ? ',' : '.';
  const separator = language === 'tr' ? '.' : ',';
  const [whole, fraction] = amountText(value, language).split(decimal);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return fraction === undefined ? grouped : `${grouped}${decimal}${fraction}`;
}

/** Never combine currencies implicitly. Accumulate exactly and check the final safe range. */
export function sumMoney(values: readonly Money[], currency: Currency): Money {
  digitsFor(currency);
  let total = 0n;
  for (const value of values) {
    const checked = money(value.minor, value.currency);
    if (checked.currency !== currency) throw new MoneyError('mismatch');
    total += BigInt(checked.minor);
  }
  return fromExact(total, currency);
}

export function subtractMoney(left: Money, right: Money): Money {
  const checked = money(right.minor, right.currency);
  return sumMoney([left, money(-checked.minor, checked.currency)], left.currency);
}
