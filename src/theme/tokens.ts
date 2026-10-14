export const palettes = {
  light: {
    background: '#FAF9FC', surface: '#FFFFFF', text: '#201D26', muted: '#625C6C',
    accent: '#6817CD', onAccent: '#FFFFFF', tint: '#F3E8FD', separator: '#DED9E5',
  },
  dark: {
    background: '#151218', surface: '#211D27', text: '#F4F0F8', muted: '#BDB4C8',
    accent: '#BB91F2', onAccent: '#211039', tint: '#30213F', separator: '#443B50',
  },
} as const;
export type AppColors = { [K in keyof typeof palettes.light]: string };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;
export const typography = { title: 28, heading: 20, body: 17, caption: 14, amount: 36 } as const;
export const layout = { maxWidth: 640, touchTarget: 48, choiceMinWidth: 100 } as const;
