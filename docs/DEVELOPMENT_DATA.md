# Geliştirme örnek verileri ve cihaz testleri

14 Ekim 2026. Expo Go/Metro geliştirme modunda açılış, `spendo-demo.db` içinde sürümlü örnek veri hazırlar. v1 11 temel kayıt; v2 ilk yükleme ayından önceki 5 aya 25 ek kayıt ekler. Dokunulmamış yeni sette toplam 36 kayıt/6 ay vardır. Üretim modu `spendo.db` kullanır ve örnek yüklemez. Önceden `spendo.db` içine girilen veriler korunur; geliştirme ekranlarında ayrı örnek DB gösterildiği için eski kayıtlar burada görünmez. Geliştirme sırasında yeni eklediğin kayıtlar da bu örnek DB'de kalır.

Her örnek sürümün kurulumu atomiktir ve ayrı kalıcı yükleme işareti taşır. Reload v1 değişikliklerini koruyarak eksik v2'yi ekler. Sonraki Reload, uygulamayı kapatıp açma veya ay değişmesi örnekleri çoğaltmaz; tarihler v1 nakit başlangıç kaydındaki ilk yükleme gününe bağlı kalır. Düzenlenen/silinen örnekler tekrar yüklenmez. `spendo-demo.db` temizlenmedikçe set sıfırlanmaz; henüz uygulama içi örnek sıfırlama kontrolü yok. Gerçek veri dosyasını silmek veya uygulamayı kaldırmak test için gerekli değildir.

## İlk kurulumdaki içerik

4 hesap: Nakit TRY, Örnek Banka TRY, Örnek Kredi Kartı TRY, Örnek Dolar Hesabı USD. Altı mevcut kategori kullanılır. Temel v1 seti aşağıdaki 11 kayıttır; v2 geçmiş kayıtlarıyla toplam 36 olur:

| Kayıt | Tür | Hesap | Tutar |
|---|---|---|---|
| Örnek nakit başlangıcı | Başlangıç | Nakit | 1.000,00 TRY |
| Örnek banka başlangıcı | Başlangıç | Banka | 10.000,00 TRY |
| Örnek dolar başlangıcı | Başlangıç | Dolar | 100,00 USD |
| Örnek maaş | Gelir | Banka | 35.000,00 TRY |
| Örnek market alışverişi | Gider / Yemek | Kredi Kartı | 850,75 TRY |
| Örnek kahve | Gider / Yemek | Nakit | 95,50 TRY |
| Örnek toplu taşıma | Gider / Ulaşım | Nakit | 42,00 TRY |
| Örnek elektrik ve internet faturası — uzun açıklama denemesi | Gider / Faturalar | Banka | 1.200,00 TRY |
| Örnek dijital abonelik | Gider / Genel | Dolar | 15,99 USD |
| Örnek nakit çekimi | Transfer | Banka → Nakit | 2.000,00 TRY |
| Örnek geçen ay alışverişi | Önceki ay gideri / Yemek | Banka | 620,00 TRY |

İlk yükleme ayı için ana ekran: **gider 2.188,25 TRY, gelir 35.000,00 TRY, aylık fark 32.811,75 TRY**. USD ayrı gösterilir: gider 15,99 USD, gelir 0,00 USD, fark -15,99 USD. Başlangıç ve transfer bu gelir/gider rakamlarına girmez; önceki ayın 620 TRY gideri bu ayda sayılmaz. Aşağıdaki sabit toplam kontrolleri ilk set değiştirilmeden ve ilk yükleme ayında geçerlidir.

## Telefonda uygulanacak sıra

Güncel v2 setinde aşağıdaki eski v1 sayımları değişir: Tümü **36**, Gelir **6**, Gider **21**; 6 transfer ve 3 başlangıç Tümü'de bulunur. v1 üzerinde daha önce sildiğin/eklediğin kayıtlar bu sayıları değiştirir. Güncel ayın v1 gelir/gider/farkları değişmez. Kahve düzenlemesi satır sayısını değiştirmez; toplu taşıma silinince dokunulmamış set 35'e düşer.

1. **Açılış ve toplamlar:** Expo Go'da Reload yap. Ana Sayfa'da örnek veri modu yazısını, dolu son işlemleri ve yukarıdaki TRY/USD toplamlarını gör. Eski gerçek kayıtların görünmemesi ayrı geliştirme DB'sinden kaynaklanır. Gelir/giderleri elle hesapla; transfer/başlangıç ve önceki ay bu ayın toplamına katılmamalı.
2. **Liste ve filtre:** İşlemler → Tümü: 36 kayıt. Gelir: 6 maaş. Gider: 21 kayıt; transfer ve üç başlangıç bu filtrede görünmez. Tümü'ne dön. Uzun fatura açıklaması ve 850,75 TRY tutarı taşmadan okunmalı.
3. **Alt bar + ve iptal:** Her sekmeden ortadaki + düğmesinin merkezine ve yükselen üst kenarına dokun. Boş kayıt formu açılmalı. Hiçbir şey girmeden geri dön: önceki sekme kalmalı. Tekrar aç, 12,50 yazıp geri git: değişiklik uyarısında Düzenlemeye devam et tutarı korumalı; Kaydetmeden çık yeni kayıt oluşturmamalı.
4. **Kayıt ve geri alma:** + → Gider, Nakit TRY, Yemek, bugün, tutar 12,50, açıklama Test kaydı. Kaydet'e art arda iki kez dokun: tek kayıt. Bu ay TRY gideri 2.200,75, fark 32.799,25 olmalı. Geri al: test kaydı kalkmalı, ilk toplamlar dönmeli. Boş / 0 / 1,234 / 1e3 girişlerinde hata görünmeli, kayıt oluşmamalı.
5. **Düzenleme:** İşlemler → Örnek kahve: 95,50, Yemek, Nakit ve tarih dolu gelmeli. Tutarı 100,00 yapıp kaydet. Aynı satır güncellenmeli; 36 kayıt kalmalı. Bu ay gider 2.192,75 TRY, fark 32.807,25 TRY. Sonra aynı kaydı yeniden açıp 95,50 yaparak başlangıç toplamlarına dön.
6. **Kalıcı düzenleme/silme:** Örnek toplu taşıma → İşlemi sil → Vazgeç: satır ve toplamlar kalmalı. Tekrar silip onayla: satır kalkmalı, 35 kayıt kalmalı. Başlangıç toplamlarına dönmüşsen gider 2.146,25 TRY, fark 32.853,75 TRY olmalı. Uygulamayı tamamen kapatıp aç ve Reload yap: bu satır geri gelmemeli, diğer örnekler çoğalmamalı. Bu test örnek setini kalıcı değiştirir; sonrası dokunulmamış setin sayı/toplamı beklenmez.
7. **Hesap/para birimi:** + formunda dört hesabı sırayla seç; para birimi etiketinin doğru değiştiğini gör. Dolar hesabında Türkçe 10,25 gider kaydet: USD gideri 26,24 olmalı; TRY toplamı değişmemeli. Geri al: USD 15,99'a dönmeli. Transfer ve başlangıç satırlarına dokunmak gelir/gider düzenleme formunu açmamalı; bu ekranlar henüz uygulanmadı.
8. **Dil/tema/erişilebilirlik:** Ayarlar → English ve Dark. Örnek veri modu bildirimi ve düğmeler İngilizce, tutar ayracı nokta olmalı. + → Dolar hesabı → 10.25 geçerli olmalı; kaydedip geri al. Sonra Türkçe/açık temaya dön. Sistem yazısını büyüt ve telefonu yatay çevir: alt bar etiketleri/tutarlar kırpılmamalı, klavye açıkken Kaydet'e kaydırarak ulaşılmalı. VoiceOver'da + “İşlem ekle”/“Add transaction” olarak okunmalı.
9. **Offline:** Paket yüklüyken uçak moduna geç, + ile test gideri kaydet ve geri al. İşlem ağ gerektirmemeli. Expo Go'nun geliştirme paketini ilk indirişi veya soğuk yüklemesi Metro gerektirebilir; tam offline açılış üretim/native build'de ayrıca doğrulanır.

Gerçek cihazda bu kontroller henüz çalıştırılmadı. Raporlar, Asistan ve hesap/kategori silme-arşivleme uygulanmadı. Kategori liste/oluşturma/ad değiştirme ve transfer oluşturma/son kaydı geri alma artık var; güncel cihaz testleri `CATEGORY_TRANSFER_QA.md` içinde.

## Çok aylı v2 seti

İlk yükleme Ekim 2026 ise Mayıs–Ekim 2026 görünür; başka ayda yüklenmişse aşağıdaki aylar ilk yükleme ayına göre kayar. Geçmiş ay başına maaş, kira, market, USD abonelik ve TRY transfer eklenir. Mevcut önceki ay 620 TRY gideri de korunur. Dokunulmamış set için:

| İlk yükleme ayına göre | Gelir TRY | Gider TRY | Gider USD |
|---|---:|---:|---:|
| Bu ay | 35.000,00 | 2.188,25 | 15,99 |
| 1 ay önce | 34.000,00 | 12.370,00 | 13,99 |
| 2 ay önce | 33.000,00 | 12.000,00 | 14,99 |
| 3 ay önce | 32.000,00 | 12.250,00 | 15,99 |
| 4 ay önce | 31.000,00 | 12.500,00 | 16,99 |
| 5 ay önce | 30.000,00 | 12.750,00 | 17,99 |

Reload sonrası İşlemler'de aşağı kaydırıp her ayın maaş/kira/market/abonelik/transfer satırlarını gör. Liste tarihi azalan sırada olmalı. Güncel ay özeti geçmiş maaşları/giderleri eklememeli. İkinci Reload sayıları değiştirmemeli; daha önce silinen kahve/toplu taşıma geri dönmemeli. Henüz geçmiş ay özetini seçme kontrolü yok; tablodaki tarih aralıkları otomatik repository testleriyle doğrulandı.

## Hesap ekranları için güncel cihaz testi

1. Ana Sayfa → Hesaplar: 4 örnek hesap ve ayrı para birimli bakiyeler görünmeli. Bakiye tüm kayıtları kapsar; aylık gelir−gider farkıyla aynı değer değildir. Uzun isim/bakiye büyük yazıda kırpılmamalı.
2. Hesap ekle → ad `Test kartı`, tür Kredi kartı, para TRY, başlangıç `-1250,50`. Kaydet'e art arda dokun: tek hesap ve tek başlangıç kaydı oluşmalı. Hesaplar'a dön: bakiye `-1.250,50 TRY` değerine eşit olmalı (gösterim gruplama yapmadan -1250,50 olabilir). Bu ay gelir/gider toplamı değişmemeli.
3. Test kartı satırına dokun → adı `Yedek kart` yapıp kaydet: aynı hesap adı değişmeli. Tür/para birimi/bakiye düzenleme seçicileri gösterilmemeli; mevcut kayıtlar ve bakiye korunmalı. + işlem formunda yeni isim seçilebilmeli. Bu artımda hesap silme/para birimi değiştirme yok.
4. + → Yedek kart → Gider → `50,00` kaydet: hesap bakiyesi -1300,50 TRY olmalı; gider toplamı 50 TRY artmalı. Geri al: bakiye -1250,50 ve toplam önceki değerine dönmeli.
5. Hesap ekle → boş/boşluk adla Kaydet: hata, hesap yok. Geçerli ad ve `1,234` bakiye ile Kaydet: hassasiyet hatası, yarım hesap yok. `0` bakiye geçerli. Formu doluyken geri git: uyarıda Düzenlemeye devam et taslağı korumalı, Kaydetmeden çık hesap oluşturmamalı.
6. English/koyu tema → yeni USD hesabı → bakiye `10.25`: 10.25 USD görünmeli. Türkçede `10,25` kullan. JPY için ondalık tutar, KWD için 3 basamaktan fazlası reddedilmeli. Sistem yazısını büyüt, yatay çevir, klavye açıkken kaydırarak Kaydet'e ulaş; VoiceOver/TalkBack'te ad/tür/para/bakiye/Kaydet kontrollerini incele.
7. Uygulamayı tamamen kapatıp aç: yeni hesap/ad/bakiye korunmalı, örnekler çoğalmamalı. Paket yüklüyken uçak modunda hesap oluşturmayı dene. Native sürücüde depolama hata enjeksiyonu yapılmadı; hata/retry/rollback otomatik testlerle sınandı.
