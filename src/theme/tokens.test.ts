import { palettes } from './tokens';
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/.{2}/g)!.map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
test.each(['light', 'dark'] as const)('%s theme keeps normal text readable', mode => {
  const colors = palettes[mode];
  for (const background of [colors.surface, colors.background]) {
    expect(contrast(colors.text, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.muted, background)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast(colors.accent, colors.tint)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.onAccent, colors.accent)).toBeGreaterThanOrEqual(4.5);
});
