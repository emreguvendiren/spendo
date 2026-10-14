# Faz 1 — yerel kayıt cihaz kontrolü

Durum: 14 Ekim 2026, Paper 5.15.3 UI revizyonundan sonra tip/lint ve 124 test geçti; iOS/Android Hermes export başarılı. Tarayıcıda 320/390 genişlikte sınırlı görsel kontrol yapıldı; aşağıdaki kontroller henüz gerçek cihazda yapılmadı. Faz 0'daki iPhone açılış bildirimi yeni akışın kabulü değildir. Kütüphane kuralları `UI_LIBRARY.md` içinde.

1. Expo Go'da yeniden yükle. Ana Sayfa ve İşlemler'de İşlem ekle görünür; ilk açılışta Nakit/TRY ve kategoriler hazır, örnek işlem yok.
2. Türkçe açık temada `12,50` gider gir, kategori ve tarihi seç, açıklama ekle. Kaydet: başarı ve Geri al görünür. İşlemler'e geçince tarih, kategori, hesap ve `12,50 TRY` görünür; aynı ayın ana ekran gideri artar.
3. `100` gelir kaydet. Gelir seçimi gelir kategorisine geçer. Gelir/Gider/Tümü filtreleri gerçekten listeyi daraltır. Geri al son kaydı ve toplam etkisini kaldırır.
4. Boş, `0`, `1,234` ve `1e3` tutarlarını dene. Alan hatası görünür, kayıt oluşmaz. Kaydet'e art arda dokunmak tek kayıt oluşturur.
5. Kayıt yaptıktan sonra uygulamayı tamamen kapatıp yeniden aç: kayıt korunur, hesap/kategoriler çoğalmaz. Son kayıt için Geri al yalnızca mevcut uygulama oturumunda tutulur; genel silme/düzenleme henüz yok.
6. Paket yüklendikten sonra uçak modunda gelir/gider ekle. Kayıt için ağ gerekmez. Expo Go geliştirme paketini ilk kez indirmek için Metro bağlantısı gerekir; soğuk başlangıcın tamamen offline testi imzalı/native paketle ayrıca yapılır.
7. English/koyu tema: `10.25` gir. Seçiciler, etiketler ve tutarlar değişir. Sistem tema ve dil tercihi yeniden açılışta korunur.
8. Küçük ekran, yatay yön ve büyük yazı: tutar/hesap/kategori metinleri kırpılmamalı; klavye açıkken Kaydet kaydırarak erişilebilir olmalı. Decimal klavyeyi kapatma, tarih penceresini vazgeçerek kapatma ve açıklama alanını kontrol et.
9. Geri tuşu/iOS geri gesture: dolu taslağı terk etmeden uyarı çıkar. Düzenlemeye devam et taslağı korur; Kaydetmeden çık bırakır. Kaydet sürerken ekran terk edilmez.
10. VoiceOver/TalkBack: Tutar, tür, kategori, hesap, tarih ve Kaydet sırası; seçili değerlerin okunması, hata ve başarı geri bildirimi. Native picker'ların ekran okuyucu ve dokunma alanı davranışı cihazda incelenmeli.

Otomatik testler disk/açılış/seed/yazma/yenileme/geri alma hatalarını kontrollü olarak sınar; gerçek cihazda hata enjeksiyonu yapılmadı. UI testleri native picker ve navigasyon sınırlarını mock eder; görsel/native etkileşim kabulünün yerine geçmez.

Açık kapsam: işlem düzenleme/genel silme, hesap ve kategori yönetimi, transfer/komisyon/iade ekranları, kurla raporlama, büyük veri için DB sayfalaması ve performans ölçümü.
