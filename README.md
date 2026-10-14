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

Temel dört sekme, ayarlar, Türkçe/İngilizce ve açık/koyu/sistem tema. SQLite v2 ile gelir/gider, liste/filtre/aylık toplamlar, geri alma ve gelir/gider düzenleme/silme bağlı. Hesap/kategori oluşturma/ad değiştirme/arşiv-geri açma; TRY ve döviz transfer oluşturma/geçmiş transfer düzenleme-silme/son transferi geri alma var. Para gösterimleri yerel binlik ayırıcı kullanır. Cihaz kabulü `docs/PHASE_1_QA.md`, `docs/CATEGORY_TRANSFER_QA.md`, `docs/ARCHIVE_MONEY_QA.md`, `docs/TRANSFER_EDIT_QA.md`, `docs/OPENING_QA.md` içinde açık. Başlangıç düzeltmesi hesap detayından erişilir; cihaz adımları docs/OPENING_QA.md içinde. Fiziksel hesap/kategori silme, komisyon/iade, AI, yedek ve tutorial henüz yok.

`npm run check`, Node 24 yerleşik `node:sqlite` ile gerçek veritabanı entegrasyon testlerini de çalıştırır. SQLite experimental uyarısı beklenir. Testler geçici test verisi kullanır; Expo native sürücüsünün cihaz kabulü ayrıca yapılır.

Expo Go/Metro geliştirme açılışında ayrı `spendo-demo.db` içinde 4 hesap ve 6 aya yayılan 36 örnek kayıt sürümlü yüklenir. İlk 11 kaydın üzerine v2 geçmiş kayıtlarını ekler; düzenleme/silme Reload sonrasında korunur. Üretim `spendo.db` kullanır ve örnek yüklemez; eski gerçek kayıtlar korunur. Ana Sayfa → Hesaplar/Kategoriler üzerinden yönetim; Hesaplar → Transfer üzerinden transfer açılır. Örnek içerik ve ayrıntılı telefon test adımları: `docs/DEVELOPMENT_DATA.md`, `docs/CATEGORY_TRANSFER_QA.md`.

## Devam etme
Önce `AGENTS.md`, `PROJECT_SPEC.md`, `docs/DESIGN.md`, `docs/SKILLS.md`, `docs/PROGRESS.md` oku. Gerçek cihaz kabul listesi `docs/PHASE_0_QA.md` içinde.
