# Spendo arayüz kütüphanesi

Karar tarihi: 14 Ekim 2026. Kullanıcı mevcut UI'ı yetersiz buldu ve modern bir bileşen kütüphanesi eklenmesini istedi.

## Seçim ve sürüm

- **React Native Paper 5.15.3**: `package.json` içinde tam sürümle sabit; transitive bağımlılıklar `package-lock.json` içinde.
- Kurulum: `npm install react-native-paper --save-exact --loglevel=error`.
- Resmi kaynak: https://github.com/callstack/react-native-paper
- Kurulum: https://oss.callstack.com/react-native-paper/docs/guides/getting-started
- Tema: https://oss.callstack.com/react-native-paper/docs/guides/theming
- Gerekçe: mevcut React Native/Expo yapısına kapsamlı stil altyapısı değişikliği gerektirmeden düğme, metin girişi, bölüm seçimi, liste ve ayar kontrolleri sağlar. Tam uygulama tasarımının yerine geçmez; ekran hiyerarşisini Spendo belirler.

## Projedeki kullanım sözleşmesi

1. Tek görsel kaynak `src/theme/tokens.ts`. Paper uyarlaması `src/theme/paper.ts` üzerinden yapılır. `PreferencesProvider` içindeki `PaperProvider`, seçili açık/koyu temayı kullanır. Ekran içinde ikinci palette veya bağımsız PaperProvider oluşturma.
2. Ortak eylemler `ActionButton` üzerinden Paper `Button`; tutar/açıklama Paper `TextInput`; gelir/gider ve liste filtresi `SegmentedButtons`; ayarlar `RadioButton.Item`; bölümler `Surface`/`Divider`/`List.Item` kullanır.
3. Material Community Icons, mevcut `@expo/vector-icons` üzerinden kullanılır. Yeni bir native ikon paketi eklenmedi. Sekmeler ve içerik aynı ikon ailesini kullanır; etiketlerin yerine yalnız ikon koyma.
4. Bu sürüm için bilinçli platformlar arası görsel tercih: Paper düğmeleri, segmentler ve ayar satırları iki platformda ortak görünür. Expo Router'ın native stack/geri davranışı ve standart alt sekme yerleşimi korunur. iOS'a Android FAB eklenmez.
5. Hesap/kategori menüleri ve tarih seçimi `@expo/ui` olarak kalır; Host'a uygulama teması ve marka rengi aktarılır. Yeni native kontrollerde kurulu SDK tiplerini doğrula. Paper ve Expo bileşenlerinin sorumluluklarını aynı ekranda tekrar eden alternatiflerle çoğaltma.
6. Ana ekranın odağı bu ayki gider, gelir ve **aylık farktır**. Aylık fark gelir−giderdir; hesap bakiyesi değildir. Fark saf para domain üzerinden hesaplanır. Para birimleri ayrı gösterilir.
7. Nötr zemin, düz yüzey, sınırlı mor vurgu. Özet tek paneldir; işlem satırları ayrı kartlar değildir. Büyük tutar yanında para birimi küçük gösterilir. Küçük ekranda özet kolonları ve satır tutarları alta geçebilir; veriyi kırpma.
8. Paper varsayılan görünümünü ekran başına yeniden renklendirme; ihtiyaç varsa merkezi adaptörü genişlet. Düğme loading/disabled/erişilebilirlik etiketleri korunmalı; sistem yazı ölçeği kapatılmamalı.
9. Kullanıcının 14 Ekim isteği: alt barda İşlemler'den sonra hafif yükseltilmiş yuvarlak `+` kayıt eylemi. Mevcut Expo Router JS Tabs üzerinde özel bar, RN Pressable ve aynı aileden Paper Icon kullanır. Dört gerçek sekme korunur; ekle eylemi `/entry` Stack ekranını açar. Ölçüler `bottomBar` tokenlarında, renkler mevcut palette. İkon tek başına gösterilir, erişilebilir TR/EN eylem adı zorunludur.
10. Tipografi Inter Regular/Medium/SemiBold statik dosyalarından beslenir. Paper adaptörü tüm MD3 font rollerini merkezi face'lere bağlar; fontWeight normaldir, ağırlık gerçek dosyayla seçilir. FontsProvider yükleme hatasında ortak sistem fallback'ini Paper'a da aktarır. Ekranlarda bağımsız fontFamily/fontWeight tanımlama; AppText weight veya ortak face'leri kullan. Ayrıntı `docs/TYPOGRAPHY.md`.

## Doğrulama ve sınırlar

- Davranış testleri gerçek Paper bileşenleriyle çalışır; Paper mock edilmez. Safe area için paketin resmi Jest mock'u kullanılır.
- İki temada renk kontrast testleri genişletildi; tema adaptörü ve yeni aylık fark görünümü test edildi.
- Geçici, yalnız bellekte örnek veri kullanan önizleme ile tarayıcıda 390 genişlikte açık/koyu ana ekran ve form; 320 genişlikte açık ana ekran/form görsel olarak incelendi. Önizleme rotası teslimden önce kaldırıldı; örnek veriler gerçek DB'ye yazılmadı.
- Tarayıcı incelemesi native cihaz kabulü değildir. iPhone/Android seçici, klavye, büyük sistem yazısı ve ekran okuyucu kontrolleri `docs/PHASE_1_QA.md` üzerinden devam eder.
- Paket eklenirken npm 65 mevcut güvenlik bulgusu bildirdi (49 high, 16 moderate); bu çalışma bağımlılık güvenlik incelemesini kapatmaz.
