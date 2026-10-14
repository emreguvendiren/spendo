# Birikim hedefleri — cihaz kontrolü

14 Ekim 2026: tip/lint ve 15 suite / 292 test geçti; iOS/Android Hermes export başarılı. Gerçek iPhone/Android kabulü henüz yapılmadı. Hedef katkısı ayırdığın paranın takip kaydıdır; banka transferi yapmaz, hesap bakiyesini veya gelir/gider toplamlarını değiştirmez.

1. Reload ve tam kapat/aç → Ana Sayfa → Birikim hedefleri. SQLite v5 geçişi kayıt/bütçeleri korumalı. Demo iki hedef yükler: acil durum TRY `10.000,00` hedef / `2.500,00` biriken / `7.500,00` kalan; tatil USD `1.000,00` hedef / `250,00` biriken / `750,00` kalan. Önceden değiştirdiysen güncel katkılarını dikkate al.
2. Hedef ekle: Test tatil, TRY, `1000,00`, Kaydet. Listede yeni hedef, sıfır biriken ve `1.000,00` kalan görünmeli. Satıra dokun: ad/target dolu, para birimi sabit gelmeli. Ad ve hedef tutarı düzenlenebilir; katkılar korunmalı.
3. Katkı tutarı `250,00` → Katkı ekle. Biriken `250,00`, kalan `750,00`; son katkı bugünkü yerel tarihle görünmeli. İkinci `750,00` katkı → biriken `1.000,00`, Hedef tamamlandı. Hedefi aşan katkı kabul edilir; biriken gerçek tutarı korur, görsel çubuk tam doluyla sınırlı kalır.
4. Katkı eklemeden önce hesap bakiyelerini/aylık gelir-gideri not al; ekledikten sonra değişmemeli. Bu akış hesaplar arasında para taşımaz ve bankadaki tasarrufu otomatik doğrulamaz.
5. Katkıyı kaldır → Vazgeç: ilerleme korunmalı. Onayla: yalnız o katkı kalkmalı ve kalan yeniden hesaplanmalı. Hedefi kaldır onayı hedefi/katkıları takip listesinden kaldırmalı; hesap/kayıt/bütçelere dokunmamalı. Demo seed tekrar canlandırmamalı.
6. Boş ad, sıfır/negatif/fazla ondalık hedef veya katkı kaydedilmemeli. Geçerli değerle tekrar dene; çift dokunma tek katkı oluşturmalı. Ad/target taslağı değiştirilmişken katkı ekleme kapalı olmalı; önce metadata kaydet veya taslaktan çıkıp güncel hedefi aç.
7. Hedef veya katkı taslağıyla geri tuşu/iOS gesture: Düzenlemeye devam et taslağı korumalı, Kaydetmeden çık kaydı değiştirmemeli. Son 5 katkı gösterilir; eski katkılar toplamda korunur. Ayrıntılı eski katkı geçmişi bu artımda yok.
8. Tamamen kapat/aç ve Reload: hedef/katkı/metadata düzeltme/kaldırma korunmalı. Paket yüklüyken offline aynı akışlar. Expo Go ilk paket indirmesi Metro gerektirir; offline soğuk açılış native build ile ayrıca doğrulanır.
9. English/koyu tema: Savings goals, `1,000.50` hedef ve `250.50` katkı; listede yerel binlik ayırma. Küçük/yatay ekran/büyük yazı, uzun adlar ve klavyede Kaydet/Katkı ekle erişimi. VoiceOver/TalkBack hedef eylemi ve detayda biriken/kalan/başarı/onay metinlerini okumalı.

Otomatik testler metadata CRUD/stale/currency, katkı idempotency/taşma/void/no-resurrection, finansal kayıt değişmezliği, v5 migration rollback/retry, demo edit/delete koruma ve gerçek dosyalı SQLite yeniden açılışı kapsar. UI testleri validation/başarısız taslak/retry, katkı ilerlemesi/tamamlanma, kaldırma onayı, liste navigasyonu/missing edit ve EN-dark pending/refresh failure kullanır. Native picker/klavye/gesture mock testlerle doğrulanmaz.
