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

Temel dört sekme, ayarlar, Türkçe/İngilizce ve açık/koyu/sistem tema. SQLite ile yerel gelir/gider kaydı, Nakit hesabı ve temel kategoriler, tarih sıralı/gelir-gider filtreli liste, aylık toplamlar ve son kaydı geri alma bağlı. Yeni akışın gerçek cihaz kabulü `docs/PHASE_1_QA.md` içinde bekliyor. Hesap/kategori yönetimi, transfer ekranı, işlem düzenleme, AI, yedek ve tutorial henüz uygulanmadı.

`npm run check`, Node 24 yerleşik `node:sqlite` ile gerçek veritabanı entegrasyon testlerini de çalıştırır. SQLite experimental uyarısı beklenir. Testler geçici test verisi kullanır; Expo native sürücüsünün cihaz kabulü ayrıca yapılır.

## Devam etme
Önce `AGENTS.md`, `PROJECT_SPEC.md`, `docs/DESIGN.md`, `docs/SKILLS.md`, `docs/PROGRESS.md` oku. Gerçek cihaz kabul listesi `docs/PHASE_0_QA.md` içinde.
