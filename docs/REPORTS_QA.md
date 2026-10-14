# Raporlar — temel cihaz kontrolü

14 Ekim 2026: tip/lint ve 13 suite / 267 test geçti; iOS/Android Hermes export başarılı. Gerçek cihaz kontrolleri henüz yapılmadı.

Öncelik: ana fonksiyonları tamamlamak. Raporlar sekmesindeki önceki boş ekran artık mevcut yerel kayıtların aylık özeti ve kategori dağılımını gösterir. Bütçe/hedef sonraki ana iş; transfer/komisyon/iade ayrıntıları sonraya bırakıldı.

1. Reload → Raporlar: bu ayın gelir, gider, aylık fark ve işlem sayısı görünmeli. Ana Sayfa'nın bu ay değerleriyle aynı para biriminde eşleşmeli. Aylık fark hesap bakiyesi değildir.
2. Önceki ay düğmesine birkaç kez dokun: altı aya yayılan mock kayıtların farklı özetleri ve kategorileri görünmeli. Sonraki ay geri dönmeli; Bu ay düğmesi güncel aya dönmeli. Yıl başında önceki ay önceki yılın Aralık ayına geçmeli.
3. Para birimi seçicisinde TRY/USD geçişi: yalnız seçili birimin tutarları gösterilmeli; döviz değerleri tek toplamda birleştirilmemeli. USD gelir olmayan ayda fark negatif olabilir.
4. Seçili bugünkü TRY ayına `100,00` Genel gider ve `300,00` gelir ekle. Raporlar'a dön: gider +100, gelir +300, aylık fark +200, işlem sayısı +2 değişmeli. Genel kategori tutarı +100 artmalı. Gideri `150,00` yapınca yalnız +50 daha değişmeli; silince eski etkisi kalkmalı.
5. Kategori harcamaları yüksek tutardan düşüğe sıralanmalı; ad, tutar, yaklaşık yüzde ve kayıt sayısı okunmalı. Çubuk tek bilgi kaynağı değildir. Kategoriyi arşivlemek geçmiş tutarı rapordan çıkarmamalı. Yüzdeler yuvarlandığından toplamları bazen 100 olmayabilir.
6. Kaydı olmayan bir aya git: sıfır özet, açık boş dönem mesajı ve İşlem ekle düğmesi. Düğme kayıt formunu açmalı; vazgeçip dönünce seçilen ay korunmalı. Yalnız gelir olan ayda gider kategorisi çubuğu yerine Bu dönemde gider kaydı yok görünmeli.
7. Tamamen kapatıp aç: rapor kalıcı kayıtları yeniden hesaplamalı. Ay/para birimi seçimi ekran oturumuna aittir; yeni açılışta bu ay ve varsa TRY ile başlar. Paket yüklüyken offline ay/para birimi geçişi ve rapor çalışmalı; Expo Go ilk paket indirmesi için Metro gerekir.
8. English/koyu tema: Monthly overview, Previous/Next month, binlik `1,234.56` gösterimi ve kategori adları. Küçük telefon/yatay/büyük yazıda ay, toplamlar ve uzun kategori adları kırpılmamalı. VoiceOver/TalkBack ay düğmelerini ve her kategorinin tutar/yüzde/sayısını okumalı.

Otomatik model testleri kesin toplam, dönem/para birimi ayrımı, arşivli geçmiş, transfer/başlangıç/silinmiş kayıt dışlama, yıl geçişi ve taşmayı kapsar. UI testleri ay/currency, boş/yalnız gelir, EN/koyu tema, yeni/düzeltilen/silinen kayıt sonrası yenileme ve okuma hata durumunu sınar. Native picker ve cihaz görünümü bu testlerde doğrulanmaz; gerçek iPhone/Android kabulü henüz açık.
