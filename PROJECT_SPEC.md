# Spendo — ürün ve teknik sözleşme

Durum: Faz 1 temel gelir/gider ekranı, SQLite bağlantısı, işlem listesi ve geri alma uygulandı; otomatik kontroller geçti. Yeni akışın native cihaz kabulü, düzenleme ve hesap/transfer yönetimi açık.
Tarih: 14 Ekim 2026, Europe/Istanbul.
Bu dosya projenin kalıcı kapsamını tanımlar. Gerçek ilerleme `docs/PROGRESS.md`, görsel kurallar `docs/DESIGN.md`, geliştirici talimatları `AGENTS.md` içindedir.

## 1. Amaç
Kullanıcının günlük gelir ve giderlerini en az uğraşla kaydettiği, bütçesini ve birikim hedeflerini takip ettiği, doğrulanmış finansal özetleri AI yardımıyla yorumladığı kişisel finans uygulaması. Android/iOS mağazalarında yayımlanacak. AI, bütçe yönetimine odaklanan yardımcıdır; ilk sürümde yatırım önerileri, alım/satım sinyalleri veya portföy yönetimi kapsam dışıdır.

## 2. Kullanıcının kabul ettiği kararlar
- React Native + Expo; Android ve iOS. Web ve ayrı tablet uygulaması başlangıç hedefi değil; farklı telefon boyutlarına uyum zorunlu.
- Yerel veritabanı; merkezi harcama depolaması ve cihazlar arası otomatik eşitleme başlangıçta yok.
- OpenAI anahtarı küçük sunucusuz katmanda korunacak. Ücretsiz sınırlı AI erişimi; ileride maliyeti karşılayan mağaza paketi.
- Manuel ve tekrarlayan gelir/gider; sabit tutarlar kullanıcı isterse otomatik eklenir, değişken tutarlar onaylanır.
- Çoklu hesap ve para birimi; kur desteği. Yazı, ses, fiş ve sistem asistanları yol haritasında.
- Türkçe ve İngilizce; açık/koyu tema; şifreli dosya yedeği ve isteğe bağlı biyometrik kilit.
- Kullanıcı dostu, alışılmış mobil UI; kısa tutorial. Yaygın AI görsel klişelerinden kaçınma.
- Her geliştirmede test ve başarılı kontrol zorunlu. Responsive yaklaşım sonradan eklenmez.
- Kullanıcının iPhone'u var. Mac ve Android test cihazlarına arkadaşları aracılığıyla erişebilir. Bunlar sürekli erişilebilir altyapı kabul edilmez.

## 3. Proje sahibi adına alınan başlangıç kararları
Kullanıcı bu alanlarda karar vermeyi geliştirmeye bıraktı. Değişiklikler gerekçeleriyle karar günlüğüne yazılır.
- İlk açılışta hesap açma zorunluluğu yok. Harcama özellikleri tamamen yerel.
- İlk diller Türkçe/İngilizce. Cihaz diliyle başla, ayarlardan değiştir; bilinmeyen dilde İngilizceye düş.
- Ücretsiz AI başlangıç politikası: anonim kurulum başına UTC takvim ayında 5 başarılı AI işlemi. Rapor veya sohbet yanıtı bir işlem; hatalı ağ/API yanıtı sayılmaz. Bu sayı ürün deneyi, sunucudan değiştirilebilir. Kullanıcıya kalan hak ve yerel saatle yenilenme zamanı gösterilir.
- Kamuya açık AI açılmadan önce sunucuda global aylık maliyet tavanı ve kurulum başına token/istek sınırı zorunlu. Tutar, sağlayıcı ve model dağıtım öncesi belirlenir; sınırsız açık demo yayımlanmaz.
- Ücretsiz AI kotası ilk olarak rapor/sohbet içindir. Ses ve fiş gibi maliyetli giriş araçlarının ayrı kotası maliyet denemelerinden sonra seçilir. Ücretsiz manuel kayıt hiç kısıtlanmaz.
- Ses, fiş ve asistan yetenekleri temel veri modeli sağlamlaştıktan sonra gelir. Mimari bunları baştan aynı kayıt oluşturma akışına bağlar.

## 4. Temel deneyim
### Navigasyon
Alt sekmeler: Ana Sayfa, İşlemler, Raporlar, Asistan. Ayarlar üst çubuktan; hesaplar, bütçeler ve hedefler ilgili ana ekran bölümlerinden erişilir. Sekme sayısı ve etiketleri gerçek cihaz denemesinden sonra sadeleştirilebilir; gezinme modeli korunur. Ekle eylemi ana ekranda ve işlem listesinde kolay erişilir; kullanıcı normal kayıt için Asistan'a gitmek zorunda kalmaz.

### Hızlı kayıt
Tutar öncelikli; gelir/gider seçimi, önerilen kategori, bugün tarihi, son kullanılan hesap, isteğe bağlı açıklama. Öneri görünür ve düzenlenebilir; kullanıcı adına gizli kategori/havale çıkarımı yapılmaz. Sık kullanılan şablonlar, son kategoriler ve tek dokunuşla tekrar. Kaydet sonrası kısa geri bildirim ve geri alma. Eksik hesap ilk kullanımda basit Nakit hesabıyla çözülebilir. Hatalar alan yanında; form verisi korunur. Boş/geçersiz tutar sessizce düzeltilmez.

### Doğal dil ve ses
"Bugün kahveye 200 TL verdim" girdisi tutar, para birimi, tarih, kategori ve açıklama taslağına dönüşür. Belirsiz/eksik tutar için açıklama istenir; AI tahmini gerçek bilgi sayılmaz. Yerel basit çözümleme önce denenir; AI gerekiyorsa internet/kota durumu gösterilir. Ses, metne dönüşüp aynı akışa girer. Varsayılan kayıt öncesi kısa onay. İşlem kaynağı ve idempotency kimliği mükerrer girişi önler. Kayıt ekranından düzeltme ve geri alma her zaman mümkün.

### Tutorial
Atlanabilir kısa tanıtım: ilk kayıt, bütçe, isteğe bağlı AI ve veri gönderimi. Sonrasında özellik ilk kullanıldığında bağlamsal ipucu. Kamera/mikrofon/bildirim izni açılışta topluca istenmez; ilgili eylem sırasında gerekçesiyle istenir. Ayarlardan tutorial yeniden açılır. Örnek veriler gerçek kayıtlara karışmaz.

## 5. Finansal model ve doğruluk
- Yerel SQLite; sürümlü geçişler ve transaction kullanımı. Uygun Expo SQLite sürümü kurulumda resmi dokümanla doğrulanır. ORM, depolama şifrelemesi ve yedek şifreleme kitaplığı henüz seçilmedi.
- Para tutarı kayan noktalı sayı olarak hesaplanmaz. Para biriminin basamak sayısına göre güvenli tamsayı alt birim veya kesin ondalık yapı kullanılır. Güvenli sınırların dışında giriş reddedilir.
- Gelir/gider pozitif tutar + işlem türü; başlangıç bakiyesi ayrı hareket türü. İade önceki giderle ilişkilendirilip raporu tutarlı azaltır.
- Hesap türleri: nakit, banka, kredi kartı, diğer. Başlangıç bakiyesi ve para birimi. Banka/kart hesabı elle tutulur; banka entegrasyonu yok.
- Transfer iki taraflı tek atomik işlem; gider/gelir toplamına dahil edilmez. Kredi kartı borç ödemesi transferdir; alışveriş tekrar gider sayılmaz. Döviz transferinde kaynak/hedef tutar ayrı saklanır, komisyon ayrı giderdir.
- İşlemlerde orijinal tutar/para birimi, tarih, hesap, kategori, açıklama ve kayıt kaynağı bulunur. İşlem tarihi ile oluşturulma zamanı ayrıdır. Yerel gün ve kullanıcının saat dilimi davranışı açık test edilir.
- İşlem tarihinde kullanılan kur, kaynak ve kur tarihi kayda sabitlenir. Kur güncellemesi eski raporu kendiliğinden değiştirmez. Kur olmayan kayıt yanlış toplam üretmez; eksik dönüşüm açık gösterilir.
- Rapor ana para birimi değişince geçmiş dönüşüm politikası ve kur gereksinimi kullanıcıya açıklanır; yeni kurla sessiz yeniden hesaplama yapılmaz.
- Kategori bazlı aylık bütçe ve birikim hedefi; hedefe ayrılan para gider sayılmaz. Hedef katkısı ve hesap bakiyesi birbirini iki kez saymaz.
- Silme/değiştirme bağlantılı transfer, tekrar ve hedef verileri için tutarlılık kontrolü içerir. Aynı para iki kere sayılmaz.

### Tekrarlayan işlemler
Sıklık: günlük/haftalık/aylık/yıllık; başlangıç, isteğe bağlı bitiş, hesap, kategori, tutar ve işlem türü. Maaş/kira/abonelik gibi şablonlar. Ayın 29–31'i yoksa ayın son günü kuralı; saat dilimi değişimi ve yaz saati geçişleri test edilir. Sabit kayıtların otomatik eklenmesi açık kullanıcı seçimi; değişken kayıtlar bekleyen taslaktır. Gerçek ödeme banka tarafından doğrulanmış gibi sunulmaz. Kural düzenlenmesi geçmiş gerçekleşmiş kayıtları değiştirmez.

Her gerçekleşme için kural kimliği + dönem anahtarı benzersizdir. Açılışta/öne gelişte gecikmiş dönemler atomik ve tekrar çalıştırılabilir şekilde tamamlanır. Bildirim zamanında arka planda çalışmaya bağımlı değildir. Kullanıcıya eklenen geçmiş dönemlerin özeti sunulur. Kaçırılmış kayıtları sırf cihaz saatine güvenerek sınırsız üretme; makul geçmiş aralığı ve kullanıcı kontrolü gerekir.

## 6. AI ve sunucusuz sınır
### Veri akışı
Cihazda deterministik finansal özet → paylaşım önizlemesi/bilgilendirme → doğrulanan sunucusuz istek → OpenAI → şeması doğrulanan yanıt → cihazdaki rapor/sohbet.

Varsayılan gönderim: dönem toplamları, kategori dağılımları, bütçe/hedef farkları ve seçili kısa sohbet bağlamı. Hesap adları, harcama açıklamaları, fişler, ses ve tam geçmiş varsayılan özetin parçası değildir. Ayrıntılı incelemede yalnızca gerekli kayıtlar açık seçimle eklenir. Açıklamalardaki talimatlar güvenilmeyen veri olarak işlenir. Sistem istemini değiştiremez.

AI haftalık/aylık yorum, harcama eğilimleri, uygulanabilir bütçe önerisi, hedef planı ve serbest sohbet sağlar. Veri azsa bunu söyler; olmayan kayıt, gelir, gelecek fiyat veya kesin başarı uydurmaz. Para hesapları hazır girdilerden gelir; çıktı referansları ve tutarlar doğrulanır. AI mevcut işlemleri kendi başına düzenlemez. Raporlar yerelde saklanır, tarih/veri aralığı görünür; değişen kayıtlar için eski rapor işaretlenir. Aynı veri için yeniden rapor istemek zorunlu değildir.

### Güvenlik ve maliyet
- Sunucuda gizli anahtar, allowlist model ve eylem, boyut/token sınırları, zaman aşımı, sınırlı retry, rate limit.
- Anonim kurulum kimliği sır değildir. Sadece bu kimliğe güvenerek sınırsız erişim açılmaz. Cihaz/app doğrulama imkanları değerlendirilir; bunlar da tek başına kusursuz koruma sayılmaz.
- Kota sunucuda atomik tutulur. İstek öncesi rezervasyon, başarılı yanıt sonrası tüketim, hata sonrası bırakma; eşzamanlı istekler ve aynı requestId için iki kere tüketim önlenir. Süresi dolmuş rezervasyonlar temizlenir.
- Sunucuda global maliyet tavanı, dakika/gün sınırı ve acil AI kapatma anahtarı. Tavana ulaşınca açık mesaj; yerel özellikler çalışır.
- Kota yenilenmesi UTC ay başlangıcı, arayüzde yerel zaman; tüm AI işlemleri kota kontrolünden geçer.
- Harcama DB'si sunucuya kopyalanmaz. Sunucu yalnızca kurulum/kota, istek durumu ve ileride satın alma hakkı için sınırlı metadata tutar. Loglar finansal içerik içermez. Saklama/silme süreleri dağıtım öncesi belirlenir.
- Responses API kullanımı ve `store: false` yaklaşımı uygulama sırasında doğrulanır. Bu parametre sıfır veri saklama garantisi değildir; sağlayıcının kötüye kullanım log politikası ayrıca geçerlidir.
- Uygulama kaldırılıp tekrar kurularak ücretsiz kota aşılabilir. Hesapsız modelin sınırı açıkça kabul edilir; sunucu limitleri ve doğrulama ile etkisi azaltılır.
- Model ve sunucusuz sağlayıcı maliyet/latency/gizlilik deneyiyle seçilir. Dokümandaki isimler kurulum yapılmış anlamına gelmez.

### Gelecekte ücretli paket
Temel kayıt ücretsiz kalır. AI hakkı mağaza içi satın alma/abonelikle etkinleşir. Satın alma doğrulaması ve hak sunucuda tutulur; iptal, iade, süre bitimi, geri yükleme ve kota test edilir. Hesapsız mağaza geri yüklemesi ile iOS↔Android hak taşıma aynı şey değildir; platformlar arası taşıma için ileride isteğe bağlı hesap ihtiyacı değerlendirilir. Satın alma kapsamı ve mağaza gereklilikleri o aşamada güncel resmi kaynaklarla doğrulanır.

## 7. Ses, fiş ve sistem asistanları
- Uygulama içi ses iki platformda hedeflenir. Cihazda tanıma mümkünse tercih edilir; cihaz/dil desteği test edilir. Bulut gerekirse maliyet, veri gönderimi ve ayrı kota açıklanır. Varsayılan ham ses saklanmaz.
- Fiş OCR sonucu kullanıcı onayına sunulur. Birden fazla tutar, bahşiş, vergi ve düşük güven test edilir. Fotoğraf tutma isteğe bağlı; varsayılan işlem bitince temizlenir.
- iOS: App Intents/Shortcuts üzerinden gelir/gider ekleme teknik denemesi. Native Swift ve development build gerekir. Türkçe serbest cümle, cihaz kilidi, erişim izinleri, veri paylaşımı ve onay akışı gerçek iPhone'da doğrulanmadan destekleniyor denmez.
- Android: kısayol/deep link/App Actions teknik denemesi. Google Assistant dokümanları Gemini dahil her asistan için eşdeğer desteği garanti etmez. Türkçe komut ve ilgili intent desteği araştırılır. Destek yoksa uygulama içi ses ve hızlı kısayol açık alternatif olur.
- Asistan girişleri de ortak doğrulama ve DB transaction akışına girer. Kilitli cihazdan finansal veriyi ifşa etme; güvensiz deep link otomatik kalıcı kayıt oluşturamaz.

## 8. Yedek, güvenlik, gizlilik
- Kullanıcının seçtiği konuma şifreli yedek: sürümlü format, authenticated encryption, parola türetme ve güvenli rastgele değerler. Kendi kriptografimizi yazmayız. Kitaplık native uyum ve güvenlik bakımından seçilir.
- Parola kaybolursa geri kurtarma hizmeti yok; oluştururken açıklanır. Yedek parola ve anahtarları loglanmaz. Biyometrik kilit DB şifrelemesiyle aynı şey değildir.
- İçe aktarma doğrulaması: sürüm, bütünlük, parola, kayıt referansları, tutar/kur; hata mevcut DB'yi bozmamalı. İlk sürümde mevcut veriyi değiştirme öncesi açık uyarı ve yedek önerisi; otomatik birleştirme kapsam dışı.
- CSV dışa aktarma şifreli değildir; kullanıcıya açıklanır, formül enjeksiyonu riski ele alınır.
- Biyometrik kilit isteğe bağlı; destek yok/reddedildi/arka plandan dönüş akışları tanımlanır. Uygulama değiştiricide hassas ekranı gizleme değerlendirilir.
- Tüm yerel veriyi silme ve AI yetkisini kapatma ayarlarda bulunur. Yerel silme OpenAI loglarını geriye dönük sildiği şeklinde sunulmaz.
- Mağaza gizlilik beyanları, destek ve gizlilik politikası yayımdan önce hazırlanır. İlk sürüm reklam/üçüncü taraf davranış analitiği içermez.

## 9. Teknik yaklaşım
Expo + TypeScript strict; Expo Router; platforma uygun development build. Expo Go temel denemelerde kullanılabilir, Siri/native bütünlüğü doğrulamaz. Uyumlu sürümler kurulum anında doğrulanıp lockfile ile sabitlenir. Gereksiz bağımlılık ve erken kapsamlı framework ekleme.

Saf domain hesapları → repository → kullanım senaryosu → ekran. DB erişimi adaptörde; AI/kur/voice/OCR adaptörleri mock edilebilir. UI state ile kalıcı finansal durum ayrılır. Başlangıçta yerel state ve context yeterli olabilir; global state kitaplığı ihtiyaç oluşmadan eklenmez. Sunucu ayrı build/test sınırına sahiptir.

Windows'ta iOS Simulator çalışmaz. Android emülatör/cihaz yerel; iOS build bulutta veya erişilebilir Mac'te, doğrulama gerçek iPhone'da. EAS hesapları, imzalama ve Apple geliştirici hesabı durumu henüz bilinmiyor. Ücret/hesap gerektiren işlemler somut ihtiyaç oluşunca açıklanır.

## 10. Test ve tamamlanma koşulları
Her artımlı değişiklik için ilgili davranış testleri + typecheck/lint. Finansal domain için birim testler; SQLite migration/repository için entegrasyon testleri; form/onay/hata için bileşen testleri; ana akış için gerçek native build cihaz testleri. Jest/jest-expo ve React Native Testing Library aday; cihaz E2E aracı uyum doğrulanarak seçilir.

Zorunlu senaryolar: yuvarlama/ondalık ve para birimi basamakları; transfer/kart ödemesi çift saymama; döviz kuru yokluğu; gün/ay sınırları; 31 Ocak sonrası tekrar; yinelenen scheduler; atomik geri alma; restore hata ve sürüm uyumu; offline kayıt; AI hata/bozuk çıktı/kota/eşzamanlı istek; Türkçe-İngilizce sayı girişi; büyük yazı/klavye/küçük ekran. Gerçek API çağrıları varsayılan testlerde yapılmaz; maliyetli smoke test ayrı ve kontrollüdür.

Bir özellik tamamlandı sayılmak için: kabul akışı çalışır, ilgili testler geçer, boş/yükleniyor/hata/offline durumları vardır, iki dil/tema desteklenir, erişilebilirlik değerlendirilir, ilerleme dosyası güncellenir. Native cihaz testi yapılmadıysa özellik cihazda doğrulanmış sayılmaz. Responsive ekran testi yalnızca snapshot ile kanıtlanmaz.

## 11. Fazlar ve çıkış ölçütleri
| Faz | Kapsam | Çıkış ölçütü |
|---|---|---|
| 0 | Proje kurulumu, tema/i18n, test altyapısı, temel navigasyon | Tip/lint/test geçer; temel ekran iki tema/dilde küçük ve büyük telefonda doğrulanır |
| 1 | Yerel DB, gelir/gider, hesap, kategori, transfer | Offline kayıt ve para/transfer/migration testleri; kalıcı kayıt cihazda doğrulanır |
| 2 | Bütçe/hedef, deterministik rapor, tekrar/bildirim, yedek/kilit | Tekrar mükerrer üretmez; geri yükleme ve hata senaryoları geçer |
| 3 | Sunucusuz AI, ücretsiz kota, rapor/sohbet, yazıyla giriş | Güvenlik/kota/maliyet sınırları ve hata testleri; sınırlı gerçek API doğrulaması |
| 4 | Uygulama içi ses, fiş, Siri/Android teknik denemeleri | Desteklenen cihaz/dil matrisi, izin/onay ve duplicate testleri; destek kapsamı açık |
| 5 | Tutorial son hali, performans, mağaza hazırlığı | Gerçek iOS/Android beta, gizlilik metinleri, erişilebilirlik ve kritik akış testleri |
| 6 | Ücretli AI paketi | Sunucuda satın alma doğrulaması, geri yükleme/iptal/iade ve hak testleri |

İlk kamu sürümü hedefi Faz 0–3 ve Faz 5; Faz 4'ün cihazda doğrulanan yetenekleri hazır oldukça eklenir. Ses/fiş/asistan destekleri için başarısız teknik deneme saklanmaz veya sahte çalışır gösterilmez.

## 12. Henüz seçilmemiş teknik ayrıntılar
Sunucusuz sağlayıcı/model; üretim bütçe tavanı; kur kaynağı ve lisans/limitleri; depolama şifreleme yaklaşımı; yedek kripto kitaplığı; ses/OCR sağlayıcısı; E2E aracı; native minimum OS sürümleri. Bunlar tüm ürün kapsamını tekrar sormayı gerektirmez. İlgili faz başlamadan resmi kaynaklar ve kısa teknik denemeyle karar verilip kaydedilir. Bütçe tavanı ve mağaza hesabı erişimi gerçek dağıtım öncesi kullanıcı girdisi gerektirir.

## 13. Karar günlüğü
- 2026-10-14: Kullanıcının UI eleştirisi ve kütüphane ekleme yetkisi üzerine React Native Paper 5.15.3 tam sürümle eklendi. Ortak platformlar arası düğme/form/segment/ayar görünümü seçildi; Expo Router navigasyon ve @expo/ui hesap/kategori/tarih kontrolleri korundu. Tek tema kaynağı tokens.ts, Paper adaptörü theme/paper.ts. Ayrıntılı kullanım sözleşmesi docs/UI_LIBRARY.md; aylık fark gelir−gider olarak gösterilir, bakiye olarak adlandırılmaz. Önizleme fixture'ı yalnız bellekte test verisi kullandı ve kaldırıldı.
- 2026-10-14: Uygulama kökünde tek LedgerProvider bağlantıyı açar, idempotent/atomik Nakit TRY hesabı ve 6 kategori kurulumunu yapar; finansal örnek veri eklemez. Yerleşik adlar sabit kimlik üzerinden TR/EN gösterilir. Son manuel kaydın hesabı sonraki formun varsayılanıdır. Tüm okuma sonuçları aynı transaction snapshot'ından alınır; arka plandan dönüşte yenilenir.
- 2026-10-14: Hızlı kayıt ayrı Stack ekranı; @expo/ui native menü picker'ları ve kurulu SDK'nın `@expo/ui/community/datetime-picker` yolu kullanıldı (skill örneğindeki `datetimepicker` yolu bu sürümde yok). Klavye alanı KeyboardAvoidingView ve kaydırılabilir form ile ele alındı; native kabul bekliyor. Başarısız yazma taslağı korur, aynı requestId ile tekrar edilir; başarılı commit sonrası yenileme hatası kaydı başarısız saymaz. Başarılı kayıttan sonra geri alma ve listeye geçiş sunulur. Aylık özetler para birimi bazında ayrıdır, kur dönüşümü yapılmaz. Genel işlem düzenleme ve transfer formu sonraki artımdadır.
- 2026-10-14: ORM eklenmeden Expo SQLite 57.0.4 adaptörü ve sürüm 1 şema eklendi. Ayrı `useNewConnection` bağlantısı tek Database sahibi üzerinden sıraya alınır; tüm okuma/yazmalar `BEGIN IMMEDIATE`/commit/rollback içinde çalışır. Foreign key ayarı transaction başlamadan aynı bağlantıda açılır ve kontrol edilir; böylece ayrı transaction bağlantısında PRAGMA kaybı önlenir. WAL kullanılır. Native API yerel tip/kaynak ve https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/ üzerinden doğrulandı.
- 2026-10-14: Transferin kaynak/hedef hesabı, para birimleri ve tutarları tek kısıtlı satırda tutulur; bakiyeye iki karşılık yansır, gelir/gider raporuna girmez. Başlangıç bakiyesi ayrı kayıt türüdür. İstek kimliği kayıt kimliğidir: aynı içerikle tekrar idempotent, farklı içerikle tekrar çakışma; geri alma kalıcı void işareti bırakır ve yeniden gönderim kaydı canlandırmaz. Transfer komisyonu, iade, düzenleme ve geçmiş kur raporlaması bu artımda uygulanmadı. Para birimi bazlı toplamlar dönüşüm yapmaz.
- 2026-10-14: Repository/migration entegrasyon testleri Node 24'ün yerleşik `node:sqlite` motoruyla gerçek SQL ve dosyaya kalıcılık üzerinde çalışır; mobil pakete Node kodu alınmaz. Bu testler Expo native sürücüsünün cihazda çalıştığını kanıtlamaz. Şema/SQL doğruluğu ve native kabul ayrı izlenir.
- 2026-10-14: Para domain katmanı güvenli tamsayı alt birimleri saklar; metin ayrıştırma ve toplam ara hesapları BigInt ile yapılır, dışarıya yalnızca güvenli number döner (SQLite/JSON sınırı için). İlk açık para birimi listesi TRY/USD/EUR/GBP (2), JPY (0), KWD (3) basamak; bilinmeyen kod reddedilir. Gelir/gider girişi pozitif, bakiye negatif olabilir. Girişte seçili dilin ondalık/binlik ayırıcıları kullanılır; eksik/geçersiz biçim veya fazla hassasiyet sessizce düzeltilmez/yuvarlanmaz. Kur dönüşümü olmadan farklı para birimleri toplanmaz. Bu katman henüz ekran veya DB'ye bağlı değildir.
- 2026-10-14: Resmi varsayılan şablonun Expo SDK 57 / React Native 0.86.3 / React 19.2.3 sürümleri kullanıldı. Node 24.14.1 ile tip/lint/test ve iki native platform export'u doğrulandı. Tema/çeviri context, tercihler AsyncStorage; finansal veri saklamak için AsyncStorage seçilmedi. Henüz JS Tabs ile standart navigasyon; native kontrollerin SDK/test uyumu ilgili kullanımda değerlendirilecek.
- 2026-10-14: Kullanıcı ürün, platform, yerel veri, sunucusuz AI, ücretsiz kota, iki dil/tema ve yedek/kilit kararlarını kabul etti; fazlama ve ilk sürüm kapsamını geliştirmeye bıraktı.
- 2026-10-14: Hesapsız başlangıç; başlangıç AI kotası 5 başarılı işlem/UTC ay; kamuya açılış öncesi maliyet tavanı ve sunucu kota kontrolleri zorunlu. Sayı uygulama deneyi, henüz dağıtılmış politika değil.
- 2026-10-14: Mor marka vurgusu korunacak; AI klişeleri yerine standart mobil navigasyon ve veri odaklı düzen. Harici skill kurulu değil, adaylar aşağıda.

## 14. Resmi kaynaklar ve beceri adayları
Kaynaklar araştırma dayanağıdır; kurulum sırasında güncel sürümler yeniden doğrulanır.
- https://developers.openai.com/api/reference/overview — anahtar güvenliği.
- https://developers.openai.com/api/docs/guides/your-data — veri saklama sınırları.
- https://docs.expo.dev/workflow/customizing/ — özel native kod/development build.
- https://developer.apple.com/documentation/appintents — Siri/Shortcuts.
- https://developer.android.com/develop/devices/assistant/overview — App Actions; Gemini eşdeğerliği kanıtı değil.
- https://docs.expo.dev/skills/ ve https://github.com/expo/skills — Expo'nun beceri kaynağı.
- Kurulu beceriler: `expo-design-system`, `expo-native-ui`; `.agents/skills/` altında tam destek dosyalarıyla alındı. 14 Ekim 2026 kaynak commit'i ve kullanım sınırları `docs/SKILLS.md` içinde. Kullanıcının isteğiyle kuruldu; proje tasarım kurallarının yerine geçmez. Web landing page odaklı beceriler mobil UI temeli olarak kullanılmaz.
- Aynı kaynaktan eklenen tamamlayıcılar: expo-project-structure, expo-router, expo-ui, expo-data-fetching, expo-dev-client, expo-module, expo-animation. Toplam 9 beceri; sürümler ve kullanım sınırları docs/SKILLS.md içinde.
