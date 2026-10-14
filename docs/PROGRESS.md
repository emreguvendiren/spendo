# Spendo — canlı ilerleme ve devralma kaydı

Son güncelleme: 14 Ekim 2026 (Europe/Istanbul).
Aktif faz: Faz 1 — temel kayıt akışı uygulandı; kullanıcı geri bildirimiyle Paper 5.15.3 arayüz revizyonu tamamlandı. Yeni görünümün ve kayıt akışının native cihaz kabulü bekliyor.

## Gerçek mevcut durum
- Başlangıçta klasörde yalnızca `logo.png` vardı. Logo görsel olarak incelendi.
- Oluşturuldu: `AGENTS.md`, `PROJECT_SPEC.md`, `docs/DESIGN.md`, bu dosya.
- Expo SDK 57 / React Native 0.86.3 / React 19.2.3 projesi kökte oluşturuldu; package-lock.json mevcut. src/app yalnızca rota dosyaları; ortak tema/i18n/components ve preferences/overview feature alanları var.
- Dört sekme + Ayarlar; TR/EN, açık/koyu/sistem tema ve kalıcı tercihler var. Kök LedgerProvider finansal SQLite DB'yi açar; atomik ilk Nakit/kategori kurulumu, gelir/gider formu, liste/filtre, aylık toplam ve son kaydı geri alma ekranlara bağlı. Yeni akış henüz gerçek cihazda doğrulanmadı. Hesap/transfer yönetimi, işlem düzenleme, AI/sunucusuz servis yok. Git deposu ve imzalı native build oluşturulmadı.
- Geçici şablon klasörü kontrollü şekilde kaldırıldı; logo ve belgeler korundu. Kök logo uygulama ikonu olarak bağlı, mağazaya hazır ikon işlemesi henüz yapılmadı.
- `expo-design-system` ve `expo-native-ui` tam klasörleri `.agents/skills/` içine kuruldu. Kaynak commit, sürümler ve kullanım sınırları `docs/SKILLS.md` içinde.
- Ek olarak expo-project-structure, expo-router, expo-ui, expo-data-fetching, expo-dev-client, expo-module ve expo-animation kuruldu; toplam 9 beceri. Aynı sabit Expo commit'i kullanıldı.
- Araç kontrolü: Node v24.14.1, npm 11.11.0, Git 2.53.0.windows.2 mevcut.
- Kullanıcı iPhone sahibi; Mac ve Android cihazları arkadaşlardan erişilebilir. EAS/Apple hesapları doğrulanmadı.

## Tamamlanan işler
- Ürün keşfi ve kabul edilen tercihlerin kalıcılaştırılması.
- Finansal doğruluk, yerel veri/AI sınırları, fazlar, kota ve tasarım şartlarının yazılması.
- Yeni oturumda otomatik okunması için kök `AGENTS.md` devralma kuralları.
- İki Expo becerisinin destek dosyalarıyla proje içine kurulması ve AGENTS.md kullanım yollarının eklenmesi.
- Yedi tamamlayıcı Expo becerisinin araştırılması, tam klasörleriyle kurulması, sürüm/lisans ve kaynak kayıtlarının güncellenmesi. Callstack kataloğu test amacıyla araştırıldı; oradan beceri kurulmadı.

## Kontrol sonuçları
- Dosya listesi ve logo incelendi; ortam sürümleri okundu.
- Resmi OpenAI, Expo, Apple ve Android kaynakları araştırıldı; asistan yetenekleri uygulanmış değil.
- `npm run check` — güncel son çalıştırma: typecheck ve lint başarılı, 8 suite / 125 test geçti. Snapshot yok. Önceki artımların sonuçları aşağıdaki tarihsel kayıtlarda.
- `npx expo export --platform ios --platform android` — sandbox ilk denemesinde spawn EPERM; izinli tekrarında Android/iOS Hermes bundle başarılı. dist/ çıktı ignored; imzalı build/cihaz testi değildir.
- `npx expo install --check` — ağ erişimli doğrulamada Dependencies are up to date.
- `npm audit fix` uyumlu düzeltmeler denendi; kalan audit 65 bulgu (49 high, 16 moderate). docs/dependency-audit.json ham rapor. Major yükseltme/downgrade ile rastgele çözüm uygulanmadı. test-renderer React peer uyarısı da mevcut, testler geçti; üretim öncesi değerlendirme açık.
- Kurulum komutu: `python C:\Users\guven\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py --repo expo/skills --ref d4f484024fec15196bfd3c272e953e3f983972cf --path plugins/expo/skills/expo-design-system plugins/expo/skills/expo-native-ui --dest .agents/skills` — başarılı.
- `rg --files .agents/skills` ve iki SKILL.md okuması — 13 dosya; 9 yerel referans mevcut, sürüm/lisans alanları incelendi.
- Ek kurulum: aynı installer/commit/dest ile `--path plugins/expo/skills/expo-project-structure plugins/expo/skills/expo-router plugins/expo/skills/expo-ui plugins/expo/skills/expo-data-fetching plugins/expo/skills/expo-dev-client plugins/expo/skills/expo-module plugins/expo/skills/expo-animation` — başarılı. Toplam 9 beceri / 48 dosya; yeni becerilerin 20 yerel destek yolu Test-Path ile doğrulandı. Skill içindeki yardımcı scriptler çalıştırılmadı; uygulama testi değildir.

## Somut sonraki adım
1. `docs/UI_LIBRARY.md` ve `docs/PHASE_1_QA.md` ile iPhone'da Paper tasarım revizyonunu ve kayıt/liste/geri alma/yeniden açılış akışını dene; gözlenen hataları düzelt. Expo Go'da Reload ile mevcut 8083 sunucusundan yeni kod alınabilir. Kullanıcının tasarım geri bildirimini önceliklendir.
2. Faz 1'i tamamlamak için kayıt düzenleme/genel silme, hesap/kategori yönetimi ve atomik transfer ekranlarını davranış testleriyle ekle. Repository transferi var, UI henüz yok. Çoklu para birimi toplamlarını birbirine ekleme. Büyük kayıt sayısında snapshot'ın tüm kayıtları belleğe aldığı sınırlamayı sayfalama/perf çalışmasında ele al.
3. `docs/PHASE_0_QA.md` ayrıntılı dil/tema/erişilebilirlik/büyük yazı kontrollerini iPhone'da, erişildiğinde Android'de tamamla. Genel çalışıyor bildirimi tüm test matrisinin kabulü sayılmadı.
4. Her artımda ilgili testleri ve tip/lint kontrolünü geçir; yerel kayıtları cihazda yeniden açılış ve offline akışla doğrula.
5. Bağımlılık güvenlik raporunu SDK uyumunu bozmadan ele al; üretim yayınına taşımadan önce açık riskleri çöz/değerlendir.

## Devam oturumu — 14 Ekim 2026
- AGENTS.md, ürün sözleşmesi, tasarım ve ilerleme kayıtları gerçek kaynak dosyalarıyla karşılaştırıldı. Git deposu hâlâ yok; finansal DB/kayıt henüz uygulanmamış. Uygulama kaynakları değiştirilmedi.
- `npm run check` yeniden çalıştırıldı: TypeScript ve ESLint başarılı; 3 suite / 15 test başarılı.
- `npm start -- --go --lan` mevcut 8081 portu dolu olduğu için başlamadı. Başka sürece müdahale edilmedi; 8083 seçildi.
- Normal başlangıçta manifest isteği ortamın ağ kısıtlaması nedeniyle `ECONNREFUSED 127.0.0.1:9` verdi. Çalışan PowerShell komutu: `$env:EXPO_OFFLINE='1'; $env:REACT_NATIVE_PACKAGER_HOSTNAME='192.168.1.26'; npm start -- --go --lan --port 8083`. Bu ayarlar yalnızca başlatılan süreç için geçerli; IP ağ değişince yeniden belirlenmeli.
- iOS manifesti HTTP üzerinden doğrulandı: Spendo / SDK 57.0.0 / host `192.168.1.26:8083`. `Invoke-WebRequest -Uri 'http://127.0.0.1:8083/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false' -UseBasicParsing -TimeoutSec 60` başarılı: HTTP 200, 5.918.443 bayt. Bu kontrol cihazda çalıştırma değildir.
- Expo'nun mevcut `toqr` ve `pngjs` bağımlılıklarıyla `.expo/spendo-qr.png` yerel QR görseli üretildi: `exp://192.168.1.26:8083`. Yeni paket kurulmadı. Değişen kalıcı dosya bu ilerleme kaydı; QR geçici `.expo` çıktısıdır.
- React Native DevTools kurulumu `spawn EPERM` uyarısı verdi; Metro manifesti ve iOS JS paketi buna rağmen başarıyla sunuldu. DevTools doğrulanmadı.
- Bu oturumda native build, Android export, bağımlılık audit/uyum taraması ve gerçek iPhone/Android kontrolleri yeniden çalıştırılmadı. Önceki sonuçlar güncel cihaz kabulü sayılmaz.
- Somut sonraki adım: aynı Wi-Fi üzerindeki iPhone'da SDK 57 uyumlu Expo Go ile QR'ı açıp `docs/PHASE_0_QA.md` listesini uygulamak; gözlenen hataları düzeltmek. Cihaza erişim bu oturumda yok; Faz 0 kabulü açık bırakıldı. Metro oturum sonunda çalışır durumda bırakıldı, daha sonra durmuşsa yukarıdaki komutla yeniden başlatılabilir.

## Açık işler / engeller

### Faz 1 para temeli — 14 Ekim 2026
- Kullanıcı iPhone'da uygulamanın çalıştığını bildirdi ve devam edilmesini istedi. Faz 1'e geçildi; ayrıntılı Faz 0 cihaz matrisi açık tutuldu.
- Eklendi: `src/domain/money.ts`, `src/domain/money.test.ts`. Pozitif tutar ayrıştırma, seçili dile göre sıkı ayırıcı doğrulama, para birimi hassasiyeti, güvenli tamsayı sınırı, kesin toplam/çıkarma, negatif bakiye ve kayıpsız düzenleme metni var. Yeni bağımlılık yok; kullanıcı tutarları hatalara/loglara eklenmez.
- Para domain için 60 yeni test: Türkçe/İngilizce biçimler, 0/2/3 ondalık basamak, aşırı hassasiyet, sıfır/negatif/geçersiz giriş, taşma, farklı para birimini toplama reddi, sınır değerlerinde metin round-trip ve toplamda kesin ara hesaplar.
- `npm run check` — TypeScript ve ESLint başarılı, 4 suite / 75 test geçti.
- `npx expo export --platform ios --platform android` — sandbox içinde Hermes `spawn EPERM`; izinli tekrarda iki platform da başarılı, `dist` üretildi. Metro eski önbelleği okuyamayınca tam taramaya döndü ve tamamladı. Bu export mevcut uygulama paketini doğrular; henüz ekranlardan import edilmeyen para modülünün cihazda yürütüldüğünü kanıtlamaz.
- Güncellendi: `PROJECT_SPEC.md` karar günlüğü ve durum, `docs/PHASE_0_QA.md` kullanıcı açılış doğrulaması, `docs/PROGRESS.md` durum/sonraki adım. Uygulama ekranında görsel değişiklik yok.
- Çalıştırılmayanlar: yeni domain kodunun native cihaz testi, SQLite entegrasyonu (henüz uygulanmadı), detaylı erişilebilirlik/Android cihaz matrisi ve yeni audit. Sonraki somut iş: SQLite migration/repository katmanı ve atomik kayıt testleri; ardından hızlı kayıt ekranı.

### SQLite temeli — 14 Ekim 2026
- Eklendi: `src/db/connection.ts` (tek bağlantı sahibi, sıralı transaction, foreign key/WAL ayarı), `src/db/migrations.ts` (atomik v1 şema), `src/db/ledger.ts` (hesap/kategori, gelir/gider/başlangıç/transfer, idempotency, geri alma, bakiye ve para birimi bazlı toplam), `src/db/open.ts` (Expo native açılış adaptörü), `tests/ledger.test.ts` (gerçek SQLite entegrasyonu).
- Repository girişleri parametreli SQL kullanır; hatalarda kullanıcı verisi taşımayan kodlar döner. Yerel işlem günü oluşturulma zamanından ayrıdır. Tutar/toplam güvenli sınırları domain katmanıyla doğrulanır. Transfer ve geri alma atomiktir; SQL kısıtları hesap-para birimi ve kategori-tür eşleşmesini de korur.
- `npm run check` — son çalıştırma başarılı: TypeScript, ESLint, 5 suite / 105 test. 30 yeni SQLite testi; migration tekrar/future-version/rollback, eşzamanlı istek, duplicate/conflict, referanslar, döviz transferi, kredi kartı ödemesinde çift saymama, taşmada kayıt/geri alma rollback, yerel tarih, SQL injection girdisi ve dosyayı kapatıp yeniden açma test edildi.
- Test ortamı Node 24 yerleşik SQLite 3.51.2; `node:sqlite` experimental uyarısı veriyor, testler geçti. İlk typecheck denemesinde test dosyasının Node tip referansı eksikti; dosyaya referans eklenerek düzeltildi. Yeni paket kurulmadı.
- Güncellenen belgeler: `PROJECT_SPEC.md`, `docs/PROGRESS.md`, `README.md`. Resmi SDK 57 SQLite dokümanı ile kurulu 57.0.4 tip/kaynakları karşılaştırıldı. `withExclusiveTransactionAsync` yeni bağlantı açtığı için özel bağlantı+sıralama ve aynı bağlantıda transaction seçildi; ayrıntı karar günlüğünde.
- Çalıştırılmayan kontroller: bu artımda native export/build ve iPhone/Android SQLite sürücü testi (modül henüz uygulamaya bağlı değil), ağ/audit taraması. Ekran değişmedi; gerçek cihazda finansal kayıt yapılabildiği iddia edilmiyor.
- Sonraki adım: tek ledger sahibi/provider, idempotent ilk hesap/kategori kurulumu, ardından gelir/gider formu ve liste. Eksik kapsam: kayıt düzenleme/iade, komisyon bağlantısı, kurla raporlama ve native kalıcılık kabulü.

### Ortam notları

### Hızlı kayıt ve ekran bağlantısı — 14 Ekim 2026
- `src/db/ledger.ts`: atomik/idempotent `bootstrap` ve tutarlı `snapshot` eklendi. `tests/ledger.test.ts`: ilk kurulumun tekrarı ve yarıda hata halinde rollback/retry testleri.
- Yeni `src/features/ledger/`: `provider.tsx` (bağlantı yaşam döngüsü, açılış/yenileme/commit/undo), `model.ts` (yerel gün, kesin gösterim, aylık özet, yerleşik adlar, son hesap), `entry-screen.tsx`, `transactions-screen.tsx`, `home-screen.tsx`, `record-item.tsx`, `status.tsx`.
- `src/components/action-button.tsx` ortak erişilebilir eylem; `src/theme/tokens.ts` kontrol tokenları; `src/i18n/messages.ts` TR/EN kayıt/hata/geri alma metinleri. `src/app/_layout.tsx`, `(tabs)/index.tsx`, `(tabs)/transactions.tsx` güncellendi; `src/app/entry.tsx` eklendi. Eski `src/features/overview/home-screen.tsx` kaldırılarak ledger alanına taşındı.
- `tests/entry.test.tsx`: 14 davranış testi. Geçerli/geçersiz tutar, gelir kategorisi, hata sonrası taslak/aynı requestId ile retry, çift dokunma, commit sonrası okuma hatası, geri alma/retry, filtre, EN/koyu tema, açılış/seed retry, unmount sonrası bağlantı kapanışı, stale snapshot ve ay/para birimi bazlı özet test edildi. Native seçiciler/navigasyon mock; gerçek SQLite testleri ayrı suite.
- `npm run check` — son sonuç: tip/lint uyarısız başarılı, 6 suite / 121 test geçti. Node SQLite experimental uyarısı bekleniyor. İlk denemelerde effect içi setState lint hatası ve skill örneğindeki yanlış datetimepicker modül yolu düzeltildi; tüm kontroller yeniden geçti.
- `npx expo export --platform ios --platform android` — sandbox Hermes spawn EPERM; izinli tekrarda iki platformun Hermes çıktısı başarılı. Artık yeni SQLite/UI modülleri uygulama paketinde yer alıyor; native çalıştırma kabulü değildir.
- Metro yeniden başlatıldı: `$env:EXPO_OFFLINE='1'; $env:REACT_NATIVE_PACKAGER_HOSTNAME='192.168.1.26'; npm start -- --go --lan --port 8083 --clear`. DevTools spawn EPERM uyarısı devam ediyor; Metro çalışıyor.
- `Invoke-WebRequest -Uri 'http://127.0.0.1:8083/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false&transform.routerRoot=src%2Fapp' -UseBasicParsing -TimeoutSec 60` — HTTP 200, 7.244.236 bayt; `spendo.db` ve `entry-screen` işaretleri var. Önceki routerRoot içermeyen elle paket isteği uygulama rotalarını doğrulamıyormuş; yeni kontrolde düzeltildi. Manifestin tam iOS launchAsset parametreleriyle (`hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=src%2Fapp&unstable_transformProfile=hermes-stable`) istek de HTTP 200 / 6.655.920 bayt.
- Belgeler: `PROJECT_SPEC.md` kararları, `README.md` mevcut kapsam, `docs/PROGRESS.md` güncel durum; yeni `docs/PHASE_1_QA.md` cihaz kabul listesi. Skill/API doğrulaması: expo-native-ui, expo-design-system, expo-ui, expo-router; veri loading/error/draft davranışları için expo-data-fetching yönergeleri okundu. Kurulu .d.ts ve native implementasyonlar kontrol edildi. Yeni paket/harici servis yok.
- Yapılmayan kontroller: yeni native picker/SQLite akışının iPhone/Android'de çalıştırılması, görsel ekran görüntüsü incelemesi, klavye/büyük yazı/VoiceOver/TalkBack, imzalı build ve yeni audit. Faz 1 tamamlandı sayılmadı. Sıradaki adım cihaz kabulü; ardından düzenleme ve hesap/transfer yönetimi.

### Genel ortam engelleri

### Paper ile UI revizyonu — 14 Ekim 2026
- Kullanıcı UI'ı yetersiz buldu, modern bir kütüphane eklemeyi ve MD'ye kaydetmeyi istedi. React Native Paper **5.15.3** seçildi ve gerçek ekranlarda kullanıldı. `package.json` tam sürüm, `package-lock.json` güncel. Kurulum sandbox'ta ENOTCACHED; `npm install react-native-paper --save-exact --loglevel=error` izinli ortamda başarılı (6 paket). npm yine 65 bulgu bildirdi; güvenlik incelemesi kapanmadı.
- Ana ekran slogan yerine aylık gider/gelir/fark hiyerarşisi ve tek nötr özet paneli kullanır. Tutarın para birimi küçük gösterilir. İşlem satırları ikon, açıklama, kategori/hesap ve tutarı ayırır; küçük ekranda satır/özet kolonları alta geçer. Form Paper TextInput/SegmentedButtons ile kompakt; native hesap/kategori/tarih kontrolleri aynı bölümde. Liste filtresi görünür segmentlerdir. Ayarlar Paper radio satırları; sekme ikonları Material Community Icons; native navigasyon korunur. Geri alma bildirimi kompakt satıra taşındı.
- Değişen kod: `src/theme/tokens.ts`, yeni `src/theme/paper.ts`, `src/features/preferences/{provider,settings-screen}.tsx`, `src/components/{action-button,screen}.tsx`, `src/features/ledger/{home-screen,entry-screen,transactions-screen,record-item,status}.tsx`, `src/features/ledger/model.ts`, `src/i18n/messages.ts`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`.
- Testler: yeni `src/theme/paper.test.ts`; `src/theme/tokens.test.ts` gelir/gider kontrastları; `tests/entry.test.tsx` gerçek Paper segment etkileşimi ve ana ekran aylık fark; `tests/preferences.test.tsx` checked durumları; `tests/setup.ts` resmi safe-area Jest mock'u. İlk Paper testleri eski eksik safe-area mock'u nedeniyle başarısızdı, resmi mock ile düzeltildi. Tab ikon renk tipi de merkezi string palette kullanılarak düzeltildi.
- `npm run check` — son sonuç: TypeScript/ESLint başarılı, **7 suite / 124 test geçti**. Paper bileşenleri mock edilmedi; native seçiciler/navigasyon sınırları önceki gibi mock.
- `npx expo export --platform ios --platform android` — ilk sandbox denemesinde Hermes spawn EPERM; izinli son çalıştırmada Android/iOS Hermes export başarılı. Yeni MaterialCommunityIcons fontu dahil edildi. İmzalı/native çalışma testi değildir.
- Görsel QA: CUA tarayıcıyla yalnız geçici bellekte örnek veri kullanan gerçek RN Web bileşen önizlemesi incelendi. 390 genişlikte açık/koyu ana ekran ve form; 320 genişlikte açık ana ekran/form kontrol edildi. Kolonların ve işlem tutarlarının alta geçişi görüldü. `src/app/design-preview.tsx` testten sonra silindi; son test/export bu rota olmadan geçti. Finansal DB'ye örnek kayıt yazılmadı. Tarayıcı native menü/klavye testinin yerine geçmez.
- Belgeler: yeni **`docs/UI_LIBRARY.md`** (sürüm, resmi kaynak, kurulum, tema/bileşen/ikon sınırları), `docs/DESIGN.md`, `AGENTS.md`, `PROJECT_SPEC.md`, `README.md`, bu kayıt ve `docs/PHASE_1_QA.md` güncellendi.
- Çalıştırılmayanlar: yeni UI'ın gerçek iPhone/Android ekran görüntüsü, native klavye/seçiciler/ekran okuyucu, 430 genişlik ve büyük sistem yazısı, yeni bağımlılık audit analizi. Sonraki adım kullanıcının iPhone Reload sonrası görsel/işlevsel kabulü; ardından kalan Faz 1 işleri.

### Ana ekran logo ve sürüm — 14 Ekim 2026
- Kullanıcı isteğiyle ana ekranın metin başlığı kaldırıldı. Sol üstte kaynak `logo.png` ve yanında soluk, küçük `v0.1.0` etiketi var. Sürüm `app.json` üzerinden okunur. Logo dosyası değiştirilmeden merkezindeki wordmark gösterilir; ölçüler merkezi temada.
- Değişen dosyalar: yeni `src/components/header-brand.tsx`, `tests/header-brand.test.tsx`; `src/app/(tabs)/_layout.tsx`, `src/theme/tokens.ts`, `docs/DESIGN.md`, bu kayıt.
- `npm run check` — TypeScript ve ESLint başarılı; 8 suite / 125 test geçti. Yeni test erişilebilir logo, uygulama sürümü, muted tipografi ve ayrı Spendo metninin yokluğunu doğrular. İlk test denemesindeki asenkron render beklemesi düzeltilip tüm kontroller tekrar çalıştırıldı.
- Bu küçük değişiklikte native export ve gerçek cihaz görsel testi çalıştırılmadı. Sonraki adım iPhone Reload sonrası header ve mevcut kayıt akışının kabulü; ardından kalan Faz 1 işleri.

### Header sadeleştirme — 14 Ekim 2026
- Son kullanıcı isteğiyle sürüm etiketi kaldırıldı; ana ekranın sol üstünde yalnızca logo kaldı. Önceki logo+sürüm kararı bu değişiklikle güncellendi.
- Değişen dosyalar: `src/components/header-brand.tsx`, `tests/header-brand.test.tsx`, `docs/DESIGN.md`, `docs/PROGRESS.md`.
- `npm run check` başarılı: TypeScript, ESLint ve 8 suite / 125 test geçti. Header testi logo bulunmasını, metin başlığı ve sürümün gösterilmemesini doğrular.
- Çalıştırılmayanlar: native export ve cihaz görsel testi. Sonraki adım iPhone Reload sonrası görsel kabul ve kalan Faz 1 işleri.

### Ortam kısıtları
- Paket kurulumu ağ erişimi gerektirebilir; sandbox hatası olursa uygun komut için escalation kullan.
- Global kurulum ve harici skill dosyalarının workspace dışına yazılması izin gerektirebilir. Kullanıcıya gerekçeyi açıkla; güvenlik sınırlarını aşma.
- Üretim AI bütçe tavanı ve mağaza imzalama bilgileri dağıtım öncesi lazım; şu an yerel Faz 0 işlerini engellemez.
- Model/kur/kripto/voice/OCR seçimleri ilgili fazlarda yapılacak.

## Sonraki oturum için kısa başlangıç istemi
“Spendo'ya devam edelim. Önce AGENTS.md, PROJECT_SPEC.md, docs/DESIGN.md ve docs/PROGRESS.md dosyalarını oku; gerçek durumu kontrol et ve ilerleme kaydındaki sıradaki adımdan devam et. Onaylanmış kararları yeniden sorma. Her geliştirmede ilgili testleri geçir ve oturum sonunda ilerleme kaydını güncelle.”
