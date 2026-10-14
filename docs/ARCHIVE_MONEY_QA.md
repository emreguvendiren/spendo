# Binlik ayırıcı ve arşiv cihaz testleri

14 Ekim 2026. SQLite şeması v2. Önceki v1 kayıtlar geçişte korunur; hesap/kategorilere archived=0 eklenir. Arşivleme fiziksel silme değildir; bütün eski kayıtlar, bakiyeler, transfer bağlantıları ve dönem toplamları korunur.

## Para gösterimi

1. Reload → Ana Sayfa: değiştirilmemiş ilk örnek ayda TRY gelir `35.000,00`, gider `2.188,25`, fark `32.811,75`. Daha önce kayıt ekleyip/sildiysen mevcut toplamları bekle; bu değişiklik tutarı değiştirmez. İşlemler, Hesaplar ve transfer satırları da binlik ayırıcı kullanmalı.
2. Türkçe + → gider → `1234,56` kaydet: satır `1.234,56 TRY` olmalı. Satıra dokunup düzenle: `1234,56` kayıpsız giriş olarak gelmeli. Aynen kaydet: tutar değişmemeli. Test kaydı artık düzenlendiği için genel silmeyle temizle; birden fazla tutar oluşmamalı.
3. English/koyu tema: aynı tutarın gösterimi `1,234.56 TRY`, düzenleme metni `1234.56`. Girişte elle yapıştırılmış doğru binlik ayırıcı da kabul edilir; TR `1.234,56`, EN `1,234.56`. Yanlış ayırıcı/hassasiyet eski doğrulama kurallarıyla reddedilir.
4. Hesaplar'da negatif bakiye `-1.250,50 TRY` / `-1,250.50 TRY` şeklinde olmalı. JPY'de sıfır, KWD'de üç ondalık basamak korunmalı. Gösterim rakamları eş genişlikli kalmalı; küçük ekran/büyük yazıda daha uzun toplamlar kırpılmadan alt satıra geçebilmeli.

## Hesap arşivleme

1. Ana Sayfa → Hesaplar → Örnek Banka: mevcut bakiyeyi ve aylık toplamları not et. Arşivle → Vazgeç: hesap aktif kalmalı. Tekrar arşivleyip onayla: hesabın Aktif listeden çıkması, Arşiv listesinde aynı bakiye ile bulunması gerekir.
2. + ve Transfer hesap picker'larında Örnek Banka artık seçilememeli. Daha önce Banka'ya yazılmış gider/gelir/transfer satırları listede kalmalı; aylık gelir/gider/fark ve diğer hesap bakiyeleri değişmemeli. Eski kaydı düzenleyince kendi Banka hesabı Arşiv etiketiyle korunmalı, açıklama/tutar düzeltmesi yapılabilmeli.
3. Arşiv → Örnek Banka → Arşivden çıkar: Aktif'e dönmeli, + ve Transfer'de yeniden seçilebilmeli; aynı bakiye/kayıt kimlikleri korunmalı. Arşiv/geri açma finansal işlem üretmemeli.
4. Son bir aktif hesap kaldığında onu arşivlemeyi dene: `En az bir aktif hesap kalmalı.` hatası, mevcut formun korunması ve hesabın aktif kalması beklenir. Test için başka hesapları arşivlediysen sonrasında geri aç. Fiziksel veri silinmez.

## Kategori arşivleme

1. Ana Sayfa → Kategoriler → Gider → Yemek (veya değiştirdiğin adı) → Arşivle. İptal değişiklik yapmamalı; onay sonrası Aktif'ten kalkmalı, Gider/Arşiv altında görünmeli. Eski yemek giderleri ve toplamları korunmalı.
2. Yeni gider formunda arşivlenmiş Yemek seçilememeli. Eski Yemek kaydı düzenlenirken kendi kategorisi Arşiv etiketiyle korunmalı; tutar/açıklama değişikliği yapılabilmeli. Arşivden çıkar sonrası yeni gider picker'ına geri dönmeli.
3. Her türde son bir aktif kategori kalmalı. Son gider veya son gelir kategorisini arşivlemeyi dene: `Bu türde en az bir aktif kategori kalmalı.` hatası ve aktif durumun korunması beklenir. Varsayılan Genel/Maaş arşivlenmişse yeni form aynı türün kalan aktif kategorisini seçmeli.
4. Adını değiştirdiğin dolu taslakta Arşivle/Arşivden çıkar devre dışı olmalı; önce Kaydet veya taslaktan vazgeçip tekrar aç. Böylece isim taslağı arşivleme sırasında sessizce kaybolmaz.

## Kalıcılık ve erişilebilirlik

Uygulamayı tamamen kapatıp aç: arşiv durumu ve geçmiş kayıt/bakiyeler korunmalı; bootstrap veya demo yükleme arşivlenen öğeyi canlandırmamalı. English/koyu tema: Active/Archive/Restore ve onay metinleri çalışmalı. Büyük yazı/yatay ekranda iki kategori filtre sırası ve eylemler okunmalı; VoiceOver/TalkBack seçili/devre dışı durumlarını okumalı. Paket yüklüyken uçak modunda arşiv/geri açma çalışmalı.

Arşiv sonrası açık kalmış eski yeni-kayıt taslağı arşivli öğeyle kayıt oluşturmaya çalışırsa repository bunu reddeder; taslak korunur. Hesap/kategori aktif hale getirilmeli veya güncel aktif seçim yapılmalı. Gerçek native hata enjeksiyonu/görsel kabul henüz yapılmadı. Otomatik testler migration rollback/retry, son-aktif yarışları, yeni referans reddi, eski kayıt düzenleme/geri alma ve dosyalı yeniden açılışı sınar. Geçmiş transfer düzenleme/silme artık var; TRANSFER_EDIT_QA.md adımlarını uygula. Başlangıç düzeltmesi de var; OPENING_QA.md ile doğrula. Transfer komisyonu da var; TRANSFER_FEE_QA.md ile doğrula. Fiziksel hesap/kategori silme ve iade hâlâ sonraki kapsamdır.
