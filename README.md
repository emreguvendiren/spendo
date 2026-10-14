# Spendo

React Native + Expo SDK 57 / TypeScript. Android ve iOS için kişisel finans uygulaması.

## Yerel geliştirme
Node 24.14.1 ve npm 11.11.0 ile doğrulandı. İlk kurulum: `npm ci`.

- `npm start`: Metro ve Expo Go QR kodu. Telefon ve bilgisayar aynı ağda olmalı; iPhone kamerasıyla QR kodunu oku.
- `npm run check`: typecheck, lint ve davranış testleri.
- `npx expo export --platform ios --platform android`: her iki platform için JS/Hermes paketleme kontrolü; imzalı uygulama build'i değildir.

SDK 57 destekleyen Expo Go gerekir. SDK uyuşmazlığında kodu rastgele eski sürüme düşürme; güncel Expo Go desteğini doğrula. Siri/özel native modüller eklendiğinde development build gerekir. Windows'ta iOS Simulator/local iOS build çalışmaz.

## Mevcut kapsam
Arayüz: React Native Paper 5.15.3, merkezi açık/koyu tema ve @expo/ui native seçiciler. Kullanım kuralları ve sürüm kaydı: `docs/UI_LIBRARY.md`.

Temel dört sekme, ayarlar, Türkçe/İngilizce ve açık/koyu/sistem tema. SQLite v6 ile gelir/gider, liste/filtre/aylık toplamlar, geri alma ve gelir/gider düzenleme/silme bağlı. Hesap/kategori oluşturma/ad değiştirme/arşiv-geri açma; TRY ve döviz transfer oluşturma/geçmiş transfer düzenleme-silme/son transferi geri alma var. Raporlar sekmesinde ay/currency seçimi, aylık gelir-gider-fark ve kategori dağılımı çalışır; cihaz adımları docs/REPORTS_QA.md içinde. Raporlar içinde kategori aylık bütçesi ekleme/düzeltme/kaldırma ve harcanan/kalan/aşım var; BUDGET_QA cihaz listesini uygula. Ana Sayfa → Birikim hedefleri: hedef/katkı/ilerleme bağlı, hesaplar/gelir-gider değişmez. GOALS_QA.md cihaz adımlarını uygula. İşlemler: arama + ay/hesap/kategori/tür filtreleri ve temizleme var; TRANSACTION_SEARCH_QA.md cihaz adımları. Hızlı şablonlar da bağlı; Ana Sayfa bütçe/hedef ilerleme ve hızlı kayıt kısayolları da bağlıdır; komisyon/havale/iade ayrıntıları sonraya bırakıldı. Para gösterimleri yerel binlik ayırıcı kullanır. Cihaz kabulü `docs/PHASE_1_QA.md`, `docs/CATEGORY_TRANSFER_QA.md`, `docs/ARCHIVE_MONEY_QA.md`, `docs/TRANSFER_EDIT_QA.md`, `docs/OPENING_QA.md` içinde açık. Başlangıç düzeltmesi hesap detayından erişilir; cihaz adımları docs/OPENING_QA.md içinde. Transfer komisyonu ayrı bağlantılı gider olarak atomik eklenir/düzeltilir/silinir; cihaz adımları docs/TRANSFER_FEE_QA.md içinde. Fiziksel hesap/kategori silme, iade, AI, yedek ve tutorial henüz yok.

`npm run check`, Node 24 yerleşik `node:sqlite` ile gerçek veritabanı entegrasyon testlerini de çalıştırır. SQLite experimental uyarısı beklenir. Testler geçici test verisi kullanır; Expo native sürücüsünün cihaz kabulü ayrıca yapılır.

Expo Go/Metro geliştirme açılışında ayrı `spendo-demo.db` içinde 4 hesap ve 6 aya yayılan 36 örnek kayıt sürümlü yüklenir. İlk 11 kaydın üzerine v2 geçmiş kayıtlarını ekler; düzenleme/silme Reload sonrasında korunur. Üretim `spendo.db` kullanır ve örnek yüklemez; eski gerçek kayıtlar korunur. Ana Sayfa → Hesaplar/Kategoriler üzerinden yönetim; Hesaplar → Transfer üzerinden transfer açılır. Örnek içerik ve ayrıntılı telefon test adımları: `docs/DEVELOPMENT_DATA.md`, `docs/CATEGORY_TRANSFER_QA.md`.

## Devam etme
Önce `AGENTS.md`, `PROJECT_SPEC.md`, `docs/DESIGN.md`, `docs/SKILLS.md`, `docs/PROGRESS.md` oku. Gerçek cihaz kabul listesi `docs/PHASE_0_QA.md` içinde.

Ana Sayfa / Kayıt şablonları üzerinden preset yönetimi ve bugünkü yeni kayıt taslağı açma bağlı. Kaydet gerçek işlemi oluşturur; otomatik tekrar yok. Cihaz adımları docs/TEMPLATES_QA.md içinde. Ana Sayfa özetlerinin cihaz adımları docs/HOME_QA.md içinde. Aktif öncelik UI revizyonunun cihaz kabulüdür; tekrarlayan planlar bekliyor.

UI revizyonu: Ana Sayfa tek currency özeti/kompakt kısayollar, altı aylık sütun grafiği; Raporlar kategori halka grafiği; tarih gruplu İşlemler, hesap/hedef görünümü, gruplu kategori/şablon/settings ve ortak formlar. react-native-svg 15.15.4, Paper ve Inter ile merkezi tema. Cihaz adımları docs/UI_REDESIGN_QA.md.
