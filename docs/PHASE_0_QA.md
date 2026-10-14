# Faz 0 — gerçek cihaz kabul listesi

Durum: otomatik kontroller geçti. 14 Ekim 2026: kullanıcı iPhone'da uygulamanın çalıştığını bildirdi. Bu, açılış için kullanıcı doğrulamasıdır; aşağıdaki ayrıntılı dil/tema, erişilebilirlik, ekran boyutu ve Android kontrollerinin tümünün geçtiği anlamına gelmez.

1. SDK 57 uyumlu Expo Go ile `npm start` QR kodundan aç. Açılışta yanlış dil/tema ekranının kısa süre görünmediğini doğrula.
2. Dört sekmeye dokun; başlık/ikon/boş durumlar doğru. Ayarlar ve geri dönüş çalışır. Android donanım geri tuşu ve iOS geri gesture kontrolü.
3. Türkçe→English değiştir; sekmeler, başlıklar ve ekran metinleri değişir. Uygulamayı kapatıp aç; tercih korunur.
4. Açık/Koyu/Sistem seç; Ayarlar ve sekmeler dahil tüm yüzeyler değişir. Sistem modunda telefon temasını değiştir; uygulama uyum sağlar. Kapat/aç kontrolü.
5. Küçük ekran (yaklaşık 320), 390 ve 430 genişlik; yatay yön; en büyük sistem yazı boyutu. Tutarlar ve ayar seçenekleri taşmamalı; kaydırarak tüm içerik erişilebilir olmalı. Dört sekmenin uzun İngilizce etiketleri özellikle kontrol edilmeli.
6. VoiceOver/TalkBack: sekmelerin adları, Ayarlar butonu, seçili dil/tema ve okuma sırası. Hataların anonsu cihazda kontrol edilir.
7. Uçak modunda aç ve ayar değiştir: bağlantı gerekmemeli.

Faz 0 form içermediğinden klavye akışı henüz doğrulanacak bir özellik değil. Finans kayıt formu Faz 1'de ayrıca test edilecek. Bu liste tamamlanmadan Faz 0 tümüyle cihazda doğrulandı diye işaretlenmez.

## Otomatik doğrulama
- TypeScript strict ve ESLint: geçti.
- 15 test: dil fallback/parite, bozuk tercih kurtarma, kalıcı dil/tema, depolama hata/yeniden deneme ve iki temada kontrast.
- iOS ve Android Hermes export: geçti.
- `expo install --check`: bağımlılıklar SDK ile uyumlu.
- npm audit: 65 bulgu (49 high, 16 moderate). Uyumlu `npm audit fix` denendi; kalan öneriler major/downgrade gerektiriyor. Ham rapor `dependency-audit.json`. Üretim öncesi bağımlılık risk incelemesi açık; test başarısı güvenlik onayı değildir.
- Test altyapısında test-renderer/react-reconciler React peer sürüm uyarısı var; mevcut testler geçti. Sürüm yükseltme öncesi Expo/jest-expo uyumu yeniden değerlendirilmeli.
