import { amountText, Currency, money, MoneyError, parseAmount, subtractMoney, sumMoney } from './money';

function expectCode(action: () => unknown, code: string) {
  expect(action).toThrow(MoneyError);
  expect(action).toThrow(`money.${code}`);
}

test.each([
  ['200', 'TRY', 'tr', 20000], [' 12,5 ', 'TRY', 'tr', 1250],
  ['1.234,56', 'TRY', 'tr', 123456], ['1,234.56', 'USD', 'en', 123456],
  ['0.01', 'EUR', 'en', 1], ['0002,50', 'TRY', 'tr', 250],
  ['1.234', 'TRY', 'tr', 123400], ['1,234', 'USD', 'en', 123400],
  ['123', 'JPY', 'en', 123], ['0.001', 'KWD', 'en', 1],
  ['1,234', 'KWD', 'tr', 1234], ['90071992547409.91', 'USD', 'en', Number.MAX_SAFE_INTEGER],
] as const)('parses %s %s (%s) exactly', (input, currency, language, minor) => {
  expect(parseAmount(input, currency, language)).toEqual({ currency, minor });
});

test.each(['', ' ', '.', ',', '-1', '+1', '1e3', 'Infinity', 'NaN', '₺20', '20 TL',
  '1 000', '12.34,56', '1.234.56', '1,2,3', '1,', ',5', '1.00', '01.234', '1\n2'])('rejects malformed Turkish input %j', input => {
  expectCode(() => parseAmount(input, 'TRY', 'tr'), 'format');
});

test.each(['1.234,56', '12,34.56', '1.', '.5', '1,00'])('rejects malformed English input %s', input => {
  expectCode(() => parseAmount(input, 'USD', 'en'), 'format');
});

test.each([['1.001', 'USD'], ['1.0', 'JPY'], ['0.0001', 'KWD']] as const)('rejects excess precision without rounding: %s %s', (input, currency) => {
  expectCode(() => parseAmount(input, currency, 'en'), 'precision');
});

test.each(['0', '0.00', '000'])('requires a positive transaction amount: %s', input => {
  expectCode(() => parseAmount(input, 'USD', 'en'), 'positive');
});

test.each(['90071992547409.92', '99999999999999999999999999'])('rejects overflow: %s', input => {
  expectCode(() => parseAmount(input, 'USD', 'en'), 'range');
});

test.each([NaN, Infinity, -Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1])('rejects invalid stored minor units: %s', value => {
  expectCode(() => money(value, 'TRY'), 'range');
});

test('rejects unknown currency codes, including object prototype keys', () => {
  for (const currency of ['XYZ', 'toString', '__proto__']) {
    expectCode(() => money(1, currency as Currency), 'currency');
    expectCode(() => parseAmount('1', currency as Currency, 'en'), 'currency');
  }
});

test('sums exact minor units and refuses implicit currency conversion', () => {
  expect(sumMoney([parseAmount('0.10', 'USD', 'en'), parseAmount('0.20', 'USD', 'en')], 'USD')).toEqual(money(30, 'USD'));
  expect(sumMoney([], 'TRY')).toEqual(money(0, 'TRY'));
  expectCode(() => sumMoney([money(1, 'USD')], 'TRY'), 'mismatch');
  expectCode(() => subtractMoney(money(1, 'USD'), money(1, 'TRY')), 'mismatch');
});

test('checks final totals exactly, including cancellation and negative overflow', () => {
  const max = Number.MAX_SAFE_INTEGER;
  expect(sumMoney([money(max, 'TRY'), money(1, 'TRY'), money(-1, 'TRY')], 'TRY')).toEqual(money(max, 'TRY'));
  expectCode(() => sumMoney([money(max, 'TRY'), money(1, 'TRY')], 'TRY'), 'range');
  expectCode(() => subtractMoney(money(-max, 'TRY'), money(1, 'TRY')), 'range');
  expect(subtractMoney(money(100, 'TRY'), money(150, 'TRY'))).toEqual(money(-50, 'TRY'));
});

test.each(['TRY', 'USD', 'EUR', 'GBP', 'JPY', 'KWD'] as const)('round trips every supported precision at safe limits: %s', currency => {
  for (const minor of [1, 10, 12345, Number.MAX_SAFE_INTEGER]) {
    for (const language of ['tr', 'en'] as const) {
      const value = money(minor, currency);
      expect(parseAmount(amountText(value, language), currency, language)).toEqual(value);
    }
  }
});

test('formats signed balances and zero exactly', () => {
  expect(amountText(money(-1, 'TRY'), 'tr')).toBe('-0,01');
  expect(amountText(money(-123, 'JPY'), 'en')).toBe('-123');
  expect(amountText(money(0, 'KWD'), 'en')).toBe('0.000');
  expect(Object.is(money(-0, 'TRY').minor, 0)).toBe(true);
});
