import { parsePreferences } from './storage';
import { resolveLanguage, messages } from '@/i18n/messages';
const defaults = { language: 'tr', theme: 'system' } as const;
test.each([null, 'broken', 'null', '[]', '{"theme":"unknown","language":"xx"}'])('invalid preferences recover safely: %s', raw => {
  expect(parsePreferences(raw, defaults)).toEqual(defaults);
});
test('valid persisted choices override device defaults', () => {
  expect(parsePreferences('{"language":"en","theme":"dark"}', defaults)).toEqual({ language: 'en', theme: 'dark' });
});
test('unsupported device language falls back to English', () => {
  expect(resolveLanguage('de-DE')).toBe('en'); expect(resolveLanguage('tr-TR')).toBe('tr');
});
test('both languages contain all interface messages', () => {
  expect(Object.keys(messages.tr).sort()).toEqual(Object.keys(messages.en).sort());
});
