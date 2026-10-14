# Kategori ve transfer cihaz kontrolü

14 Ekim 2026. Kategori liste/oluşturma/ad değiştirme ve transfer oluşturma/son kaydı geri alma uygulandı. Native cihaz kabulü aşağıda açık; otomatik testler ve Hermes export cihaz çalıştırması değildir. Örnekler geliştirme DB'sindedir. Test öncesi gelir/gider toplamlarını ve ilgili hesap bakiyelerini not et; daha önce değiştirilen örnek setin sabit başlangıç toplamları beklenmez.

## Kategoriler

1. Reload → Ana Sayfa → Kategoriler. Gider seçili gelir; Genel/Yemek/Ulaşım/Faturalar görünür (daha önce ad değiştirdiysen yeni adları). Gelir seç: Maaş/Diğer gelir görünür; giderler görünmez. Tekrar Gider'e dön.
2. Kategori ekle → ad `Sağlık`, tür Gider → Kaydet'e art arda iki kez dokun. Tek Sağlık kategorisi oluşmalı; gelir/gider toplamı ve hesap bakiyesi değişmemeli. Geri kategori listesinde Sağlık yalnız Gider'de görünmeli.
3. + → Gider → kategori Sağlık → Nakit TRY → `25,00`, bugün → Kaydet. Liste Sağlık adını göstermeli; bu ay TRY gideri 25 artmalı, Nakit bakiyesi 25 azalmalı. Geri al: iki etki de kalkmalı. + → Gelir seçince Sağlık seçeneği görünmemeli.
4. Sağlık satırına dokun → ad `Kişisel bakım` → Kaydet. Türü değiştirme kontrolü gösterilmemeli. Yeni ad kategori listesi, işlem picker'ı ve varsa eski kayıtların kategori bilgisinde görünmeli; toplam/bakiye değişmemeli. Yerleşik Yemek adını da değiştirebilirsin; uygulamayı kapatıp açınca bootstrap eski adı geri getirmemeli. Özel kullanıcı adı dil değişince otomatik çevrilmez.
5. Yeni gelir kategorisi `Ek iş` oluştur. + → Gelir'de Ek iş görünmeli; Gider'de görünmemeli. Boş/yalnız boşluk ad Kaydet: alan hatası ve kategori oluşmaması. Dolu taslakta geri: Düzenlemeye devam et taslağı korumalı, Kaydetmeden çık oluşturmamalı.
6. English/koyu tema, büyük sistem yazısı ve yatay görünüm: etiketler/adlar ve Kaydet erişilebilir olmalı. VoiceOver/TalkBack liste satırlarını ve segmentin seçili durumunu okumalı. Yeniden açılışta kategori ve yeni adı korunmalı. Paket yüklüyken offline oluşturma/düzeltme çalışmalı.

## Transfer

1. Ana Sayfa → Hesaplar → Transfer. Gönderen/Alan hesap seçicileri ve para birimi etiketleri görünmeli. Üretimde yalnız Nakit varsa en az iki hesap oluştur mesajı ve Hesaplar eylemi görünmeli; boş form kaydedilememeli.
2. Örnek Banka TRY → Nakit TRY, gönderilen `200,25`, bugün, açıklama `Test transfer`. Aynı para biriminde Alınan tutar girişi yoktur; iki taraf eşittir. Kaydet'e art arda bas: tek transfer, Banka bakiyesi 200,25 azalır, Nakit 200,25 artar. Ana ekran gelir/gider/farkı değişmez.
3. İşlemler Tümü: `200,25 TRY → 200,25 TRY` ve Banka → Nakit görünmeli. Gelir/Gider filtrelerinde transfer görünmemeli. Geri al son transferi: iki bakiye ilk değerine dönmeli ve satır kalkmalı. Geri alma mevcut oturumdaki son yeni kayıt içindir.
4. Örnek Banka TRY → Örnek Dolar Hesabı USD, gönderilen `1000,25`, alınan `25,50`. Kaydet: banka -1000,25 TRY, dolar +25,50 USD; TRY gideri ve USD geliri değişmez. Liste iki para birimini/tutarı ve iki hesabı ayrı göstermeli. Otomatik kur tahmini yoktur. Geri al iki tarafı birlikte kaldırmalı.
5. Gönderen ve Alan aynı hesabı seç → `10` → Kaydet: farklı hesap hatası, kayıt/bakiye değişimi yok. Ayrı hesaplarda boş/0/negatif/aşırı ondalık tutarı dene: kaydedilmemeli. Döviz transferinde Alınan tutar boşsa Kaydet hata vermeli; eksik karşılık tahmin edilmemeli. TRY/JPY/KWD hassasiyet kuralları korunmalı.
6. Transfer tarihine dokun, önceki aydan bir gün seç. İptal mevcut tarihi korumalı; onay seçili günü göstermeli. Açıklama gir, geri çık: taslak uyarısı ve devam seçeneği çalışmalı. Kaydetmeden çık iki hesabı da değiştirmemeli. Tarih kontrolü native'de henüz doğrulanmadı.
7. Banka TRY → Kredi Kartı TRY `50,00` transferi yap: banka -50, kart +50. Kart borç ödemesi yeni gider/gelir sayılmamalı. Geri al iki bakiyeyi eski haline getirmeli.
8. Son transferi geri almadan uygulamayı kapatıp aç: kayıt ve iki bakiye etkisi korunmalı, çift kayıt oluşmamalı. Son kaydı Geri al yeni oturumda gösterilmez. Geçmiş satıra dokunarak özel transfer formunda düzenleme/silme yapılabilir; TRANSFER_EDIT_QA.md adımlarını uygula.
9. English/koyu tema: `1000.25` / `25.50` ile dene. Büyük yazı/yatay görünümde iki tutar, tarih ve uzun hesap adları okunmalı; klavye açıkken Kaydet'e kaydırarak ulaşılmalı. VoiceOver/TalkBack gönderen, alan, gönderilen/alınan tutar, tarih, açıklama ve Kaydet sırasını incele. Paket yüklüyken offline transfer ve geri alma çalışmalı.

Otomatik testler gerçek SQLite'ta transfer/rollback/taşma/idempotency/iki taraf geri alma ve kategori referanslarını doğrular. UI testlerinde native seçici/tarih ve navigasyon mock'tur. Native yazma hatası cihazda enjekte edilmedi; hata halinde taslak/retry ve commit sonrası refresh hatası otomatik sınandı. Hesap/kategori arşivleme-geri açma ve geçmiş transfer düzenleme/silme artık var; ARCHIVE_MONEY_QA.md ve TRANSFER_EDIT_QA.md güncel kabul listeleridir. Başlangıç düzeltmesi de var; OPENING_QA.md ile doğrula. Transfer komisyonu da var; TRANSFER_FEE_QA.md ile doğrula. İade ve fiziksel hesap/kategori silme henüz yok.
