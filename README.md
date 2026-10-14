# Spendo

React Native + Expo SDK 57 / TypeScript. Android ve iOS için kişisel finans uygulaması.

## Yerel geliştirme
Node 24.14.1 ve npm 11.11.0 ile doğrulandı. İlk kurulum: `npm ci`.

- `npm start`: Metro ve Expo Go QR kodu. Telefon ve bilgisayar aynı ağda olmalı; iPhone kamerasıyla QR kodunu oku.
- `npm run check`: typecheck, lint ve davranış testleri.
- `npx expo export --platform ios --platform android`: her iki platform için JS/Hermes paketleme kontrolü; imzalı uygulama build'i değildir.

SDK 57 destekleyen Expo Go gerekir. SDK uyuşmazlığında kodu rastgele eski sürüme düşürme; güncel Expo Go desteğini doğrula. Siri/özel native modüller eklendiğinde development build gerekir. Windows'ta iOS Simulator/local iOS build çalışmaz.

## Mevcut kapsam
Temel dört sekme, ayarlar, Türkçe/İngilizce, açık/koyu/sistem tema ve cihazda kalıcı tercihler. Para domain ve SQLite migration/repository katmanı testlerle hazır; henüz ekranlara bağlı değil. Başlangıç ekranları boş veri durumunu gösterir. Hızlı kayıt formu, AI, yedek ve tutorial henüz uygulanmadı.

`npm run check`, Node 24 yerleşik `node:sqlite` ile gerçek veritabanı entegrasyon testlerini de çalıştırır. SQLite experimental uyarısı beklenir. Testler geçici test verisi kullanır; Expo native sürücüsünün cihaz kabulü ayrıca yapılır.

## Devam etme
Önce `AGENTS.md`, `PROJECT_SPEC.md`, `docs/DESIGN.md`, `docs/SKILLS.md`, `docs/PROGRESS.md` oku. Gerçek cihaz kabul listesi `docs/PHASE_0_QA.md` içinde.
