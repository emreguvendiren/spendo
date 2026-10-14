export const messages = {
  tr: {
    home: 'Ana Sayfa', transactions: 'İşlemler', reports: 'Raporlar', assistant: 'Asistan', settings: 'Ayarlar',
    greeting: 'Parana daha yakından bak.', intro: 'Gelirlerini ve harcamalarını tek bir yerde takip et.',
    thisMonth: 'Bu ay', income: 'Gelir', expense: 'Gider', recent: 'Son işlemler',
    noTransactions: 'Henüz bir işlem yok', noTransactionsBody: 'Gelir ve gider kayıtların burada görünecek.',
    phaseNote: 'Kayıt ekleme bir sonraki geliştirme aşamasında açılacak.',
    reportsTitle: 'Harcamalarını anlamaya başla', reportsBody: 'İşlemlerin eklendiğinde dönem özetleri ve kategori dağılımları burada görünecek.',
    assistantTitle: 'Bütçen için bir yardımcı', assistantBody: 'AI bağlantısı henüz açılmadı. Açıldığında hangi bilgilerin paylaşılacağını sen belirleyeceksin.',
    language: 'Dil', appearance: 'Görünüm', system: 'Sistem', light: 'Açık', dark: 'Koyu',
    privacy: 'Verilerin cihazında', privacyBody: 'Bu sürüm herhangi bir finansal veriyi dışarı göndermiyor.',
    saveError: 'Tercihler kaydedilemedi. Tekrar dene.', loading: 'Tercihler yükleniyor', retry: 'Tekrar dene',
    loadError: 'Tercihler yüklenemedi.',
  },
  en: {
    home: 'Home', transactions: 'Transactions', reports: 'Reports', assistant: 'Assistant', settings: 'Settings',
    greeting: 'Get closer to your money.', intro: 'Track your income and expenses in one place.',
    thisMonth: 'This month', income: 'Income', expense: 'Expenses', recent: 'Recent transactions',
    noTransactions: 'No transactions yet', noTransactionsBody: 'Your income and expense entries will appear here.',
    phaseNote: 'Adding entries will be available in the next development phase.',
    reportsTitle: 'Understand your spending', reportsBody: 'Once you add transactions, period summaries and category breakdowns will appear here.',
    assistantTitle: 'A helper for your budget', assistantBody: 'AI is not connected yet. When it is available, you will decide which information to share.',
    language: 'Language', appearance: 'Appearance', system: 'System', light: 'Light', dark: 'Dark',
    privacy: 'Your data stays on your device', privacyBody: 'This version does not send any financial data outside your device.',
    saveError: 'Could not save preferences. Try again.', loading: 'Loading preferences', retry: 'Try again',
    loadError: 'Could not load preferences.',
  },
} as const;
export type Language = keyof typeof messages;
export type MessageKey = keyof typeof messages.en;
export function resolveLanguage(languageCode?: string | null): Language {
  return languageCode?.toLowerCase().split(/[-_]/)[0] === 'tr' ? 'tr' : 'en';
}
