# Spendo görsel revizyonu — cihaz kabulü

14 Ekim 2026. Öncelik yeni özellik değil mevcut ekranların tasarımıdır. Tarayıcı görsel kontrolü native kabul değildir. Gerçek cihazda SDK 57 uyumlu Expo Go ile Reload yap. Gerekirse Metro'yu yeniden başlat; SQLite/demo verisini silme.

## Ana Sayfa ve grafikler
1. Ana Sayfa'da logo, dönem, TRY/USD seçimi, büyük gider tutarı ve altında gelir/aylık fark görünmeli. Değiştirilmemiş güncel demo ayında TRY gider 2.188,25; gelir 35.000,00; aylık fark 32.811,75. Bunlar hesap bakiyesi değildir. USD seç: gider 15,99 USD olmalı; TRY ile toplanmamalı. Bütçe/hedefler kendi currency etiketlerini korumalı.
2. Hesaplar/Kategoriler/Hedefler/Şablonlar ikonlu kısayollarını aç ve geri gel. Alt bar + İşlemler'in sağında, hafif yükselmiş kalmalı; formdan geri gelince seçili sekme korunmalı. Seçili sekme ikonu belirgin zeminle görünmeli.
3. Gelir & gider grafiği gerçek son altı ayı gösterir: gelir yeşil, gider mor; metin açıklaması bulunur. Eylül'e dokun: değişmemiş demoda TRY gelir 34.000,00 ve gider 12.370,00 görünmeli. Ana Sayfa'nın büyük tutarı hâlâ güncel ay olmalı. Küçük ekranda grafiği yatay kaydırıp son ayı seç; dikey sayfa kaydırması da çalışmalı.
4. Raporlar'a git: güncel dönemde kategori halka grafiği ve tüm kategori satırları görünmeli. TRY demo Faturalar 1.200,00 (%55), Yemek 946,25 (%43), Ulaşım 42,00 (%2). Yüzdeler yuvarlanır. Beşten fazla gider kategorisiyle halka ilk dört + Diğer kategoriler gösterir; bütün kategoriler aşağıdaki listede kalır. Tek kategoride tam halka; gider olmayan ayda sahte halka olmamalı.
5. Raporlar'da Önceki ay / Sonraki ay / Bu ay ve native para birimi seçimini dene. Üst özet, kategori dağılımı, altı aylık grafik ve bütçe aynı seçili currency/dönemi temel almalı. Grafikte ay seçmek yalnız grafik altındaki ayrıntıyı değiştirir; Raporlar'ın ana dönemini değiştirmez. Yeni gider ekle/düzelt/sil: dönüşte özet, halka ve sütunlar güncellenmeli.

## Liste ve formlar
6. İşlemler: tarih başlıkları okunabilir yerel tarih, aynı günün kayıtları ortak yüzeyde; ikon, açıklama/hesap ve tutar belirgin olmalı. Uzun açıklama tutarı kesmemeli. Arama, tür/ay/hesap/kategori filtreleri, temizleme, pull-to-refresh ve satırdan edit çalışmalı. Hiç sonuç bulunmadığında doğru boş durum görünmeli.
7. + ile gider aç. 1.234,56'nın giriş karşılığı olarak TR'de 1234,56, EN'de 1234.56 gir; hesap/kategori/tarih görünür ve değiştirilebilir olmalı. Açıklamayı aç; klavyeyle alan ve Kaydet erişilebilir kalmalı. Kaydet, edit, sil/undo; boş/geçersiz tutar ve taslaktan geri çık/iptal mevcut davranışı korumalı.
8. Hesaplar: ad, tür/currency, büyük kesin bakiye görünmeli. Nakit/Banka/Kart/Döviz satırlarını aç; ekleme/ad düzeltme/arşiv/restore ve başlangıç düzeltmesi çalışmalı. Başlangıca -1234,56 girip kaydet: negatif bakiye görünmeli, gelir/gider toplamı değişmemeli. Form etiketleri boşken ve doluyken okunmalı.
9. Kategoriler: gelir/gider + aktif/arşiv segmentleri; liste ortak yuvarlatılmış yüzey ve ayırıcılarla görünmeli. Yeni kategori oluştur, adını değiştir, arşivle/geri aç. Şablonlar aynı liste diliyle; Kullan ve Düzenle ayrı. Kahve taslağını kaydetmeden çık: kayıt oluşturulmamalı. Kaydet: tek yeni kayıt; şablon metadata'sı değişmemeli.
10. Bütçe formunda dönem/currency, kategori ve üstte okunur limit etiketi; boş alan 0,00 örneği görünmeli. 1500,00 gir, kaydet, limit aşımını dene. Hedef formunda ad/target ve ayrılmış katkı bölümü; 10000,00 hedef, 2500,00 katkı ile kalan 7500,00 olmalı. Katkı hesap bakiyesini etkilememeli. Uzun katkı etiketi kırpılmamalı.
11. Transfer ekranında gönderen/alan, gönderilen tutar, gerekiyorsa alınan tutar ve açıklamalar okunmalı. Boş tutar/komisyon etiketleri büyük rakam alanının üstünde tam görünmeli. Var olan transfer create/edit/delete davranışını korumalı. Bu revizyon yeni transfer kuralı eklemez.
12. Ayarlar'da Türkçe/English ve Sistem/Açık/Koyu seçimlerini değiştir; tüm ekranlar uyumlu güncellenmeli, yeniden açılışta korunmalı. Asistan mevcut bağlantı yok durumunu açıklamalı; çalışan AI sohbeti gibi görünmemeli.

## Erişilebilirlik ve kalıcılık
13. 320/390/430 genişlik, yatay telefon, büyük sistem yazısı, iki dil ve iki temada kontrol et. Grafik, uzun ad ve parasal metinler taşmamalı; gerektiğinde alt satıra geçmeli. Giriş alanındaki rakamlar okunmalı. Native seçicinin tarayıcı görünümü gerçek cihaz görünümüyle aynı kabul edilmez.
14. VoiceOver/TalkBack: sekme seçimi, + adı, ay düğmesinin dönem/gelir/gider etiketi, kategori adı/yüzde/tutar, hata ve Kaydet okunmalı. Dekoratif grafik ikinci kez gereksiz odak almamalı. Grafik ayları en az 48 dokunma alanını korur; küçük ekranda yatay kayar.
15. İnternetsiz kayıt ekle, uygulamayı kapatıp aç: yeni kayıt, tercihler, bütçe/hedef/şablon korunmalı. Var olan demo edit/delete sıfırlanmamalı. SQLite v6 ve seed değişmez.

Tarayıcı önizlemeleri yalnız sentetik verilerle alındı; geçici route/web DB adaptörü kaldırıldı. Ekran görüntüleri docs/ui-preview içindedir. Native klavye/seçici/erişilebilirlik, büyük sistem yazısı ve imzalı build hâlâ cihaz kabulü gerektirir.
