export const palettes = {
  light: {
    background: '#F6F5F9', surface: '#FFFFFF', text: '#211B2D', muted: '#665E72',
    accent: '#6817CD', onAccent: '#FFFFFF', tint: '#F3E8FD', separator: '#DED9E5',
    income: '#176343', incomeTint: '#EAF5EF', expense: '#A43240', expenseTint: '#FBECEF',
    hero: '#292039', onHero: '#FFFFFF', heroMuted: '#D9CFE5', heroInset: '#3C304F',
    chart1: '#7139B8', chart2: '#267A73', chart3: '#AE5A29', chart4: '#416DA8', chart5: '#8C536E',
  },
  dark: {
    background: '#151218', surface: '#211D27', text: '#F4F0F8', muted: '#BDB4C8',
    accent: '#BB91F2', onAccent: '#211039', tint: '#30213F', separator: '#443B50',
    income: '#8DD8B0', incomeTint: '#19392B', expense: '#F1A4AD', expenseTint: '#43272E',
    hero: '#302640', onHero: '#FFFFFF', heroMuted: '#D9CFE5', heroInset: '#453658',
    chart1: '#C0A0F1', chart2: '#84C9BE', chart3: '#E8AE85', chart4: '#9FBCE9', chart5: '#D9A4BF',
  },
} as const;
export type AppColors = { [K in keyof typeof palettes.light]: string };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, panel: 24 } as const;
export const typography = { title: 28, heading: 20, body: 16, caption: 13, amount: 40, display: 48 } as const;
export const fontFaces = {
  regular: { fontFamily: 'Inter-Regular', fontWeight: 'normal' as const },
  medium: { fontFamily: 'Inter-Medium', fontWeight: 'normal' as const },
  semibold: { fontFamily: 'Inter-SemiBold', fontWeight: 'normal' as const },
};
export const textMetrics = { title: { lineHeight: 36 }, heading: { lineHeight: 28 }, body: { lineHeight: 24 }, caption: { lineHeight: 20 }, amount: { lineHeight: 48 }, display: { lineHeight: 58, letterSpacing: -1 } } as const;
export const layout = { maxWidth: 640, touchTarget: 48, buttonHeight: 52, choiceMinWidth: 100, icon: 22, iconBadge: 44, emptyIcon: 32, summaryMinWidth: 120, headerLogoWidth: 112, headerLogoHeight: 32 } as const;
export const controls = { borderWidth: 1, pressedOpacity: 0.7, disabledOpacity: 0.5 } as const;
export const bottomBar = { actionSize: 56, actionIcon: 28, actionLift: 12, itemMinHeight: 56 } as const;
export const homePreview = { budgets: 3, goals: 2, templates: 3 } as const;
export const visual = { pagePadding: 20, sectionGap: 28, panelPadding: 20, progressHeight: 6, dot: 8, chartHeight: 140, chartWidth: 300, ringSize: 144, ringStroke: 18, ringRadius: 54, ringCenter: 72, chartGap: 3, axisSize: 12, quickMinWidth: 72, metricMinWidth: 100, formAmount: 32, moneyInputHeight: 72 } as const;
export const chartKeys = ['chart1', 'chart2', 'chart3', 'chart4', 'chart5'] as const;
