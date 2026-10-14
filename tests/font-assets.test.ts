/** @jest-environment node */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function table(font: Buffer, name: string) {
  for (let index = 0; index < font.readUInt16BE(4); index++) {
    const record = 12 + index * 16;
    if (font.toString('ascii', record, record + 4) === name) {
      const offset = font.readUInt32BE(record + 8);
      return font.subarray(offset, offset + font.readUInt32BE(record + 12));
    }
  }
  throw new Error(`Missing font table: ${name}`);
}
function hasGlyph(cmap: Buffer, code: number) {
  for (let index = 0; index < cmap.readUInt16BE(2); index++) {
    const offset = cmap.readUInt32BE(8 + index * 8);
    if (cmap.readUInt16BE(offset) !== 4) continue;
    const count = cmap.readUInt16BE(offset + 6) / 2;
    const ends = offset + 14;
    const starts = ends + count * 2 + 2;
    const deltas = starts + count * 2;
    const ranges = deltas + count * 2;
    for (let segment = 0; segment < count; segment++) {
      const start = cmap.readUInt16BE(starts + segment * 2);
      if (code < start || code > cmap.readUInt16BE(ends + segment * 2)) continue;
      const range = cmap.readUInt16BE(ranges + segment * 2);
      const delta = cmap.readInt16BE(deltas + segment * 2);
      const raw = range ? cmap.readUInt16BE(ranges + segment * 2 + range + (code - start) * 2) : code;
      if (raw && ((raw + delta) & 0xffff)) return true;
    }
  }
  return false;
}
test.each([['Regular', 400], ['Medium', 500], ['SemiBold', 600]])('bundled Inter %s has correct weight, Turkish/currency glyphs and tabular feature', (name, weight) => {
  const font = readFileSync(join(__dirname, '../assets/fonts', `Inter-${name}.ttf`));
  expect(font.readUInt32BE(0)).toBe(0x00010000);
  expect(table(font, 'OS/2').readUInt16BE(4)).toBe(weight);
  const cmap = table(font, 'cmap');
  for (const char of 'İıŞşĞğÇçÖöÜü₺$€£−0123456789,.') expect(hasGlyph(cmap, char.codePointAt(0)!)).toBe(true);
  const gsub = table(font, 'GSUB');
  const features = gsub.readUInt16BE(6);
  const tags = Array.from({ length: gsub.readUInt16BE(features) }, (_, index) => gsub.toString('ascii', features + 2 + index * 6, features + 6 + index * 6));
  expect(tags).toContain('tnum');
});
