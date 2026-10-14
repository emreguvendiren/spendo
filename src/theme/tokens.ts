export const palettes = {
  light: {
    background: '#F5F6FA', surface: '#FFFFFF', text: '#201D26', muted: '#625C6C',
    accent: '#6817CD', onAccent: '#FFFFFF', tint: '#F3E8FD', separator: '#DED9E5',
    income: '#176343', incomeTint: '#EAF5EF', expense: '#A43240', expenseTint: '#FBECEF',
  },
  dark: {
    background: '#151218', surface: '#211D27', text: '#F4F0F8', muted: '#BDB4C8',
    accent: '#BB91F2', onAccent: '#211039', tint: '#30213F', separator: '#443B50',
    income: '#8DD8B0', incomeTint: '#19392B', expense: '#F1A4AD', expenseTint: '#43272E',
  },
} as const;
export type AppColors = { [K in keyof typeof palettes.light]: string };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, panel: 24 } as const;
export const typography = { title: 28, heading: 20, body: 16, caption: 13, amount: 40, display: 48 } as const;
export const layout = { maxWidth: 640, touchTarget: 48, buttonHeight: 52, choiceMinWidth: 100, icon: 22, iconBadge: 44, emptyIcon: 32, summaryMinWidth: 120, headerLogoWidth: 112, headerLogoHeight: 32 } as const;
export const controls = { borderWidth: 1, pressedOpacity: 0.7, disabledOpacity: 0.5 } as const;
