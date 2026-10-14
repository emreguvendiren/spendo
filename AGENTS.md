# Spendo — oturumlar arası çalışma kuralları

## Her oturumun başlangıcı
1. Bu dosyayı, `PROJECT_SPEC.md`, `docs/DESIGN.md` ve `docs/PROGRESS.md` dosyalarını oku.
2. Gerçek dosyaları ve varsa Git durumunu kontrol et. İlerleme kaydının doğruluğunu doğrula; dokümandaki planı uygulanmış özellik sanma.
3. `docs/PROGRESS.md` içindeki sıradaki tamamlanmamış adımı sürdür. Kullanıcının yeni talimatını mevcut hedefe ekle.
4. Onaylanmış ürün kararlarını tekrar sorma. Eksik rutin teknik kararları gerekçeleriyle al ve kaydet.

## Değişmez kurallar
- React Native + Expo + TypeScript; Android ve iOS. Uygulama adı Spendo, kaynak logo kökteki `logo.png`.
- Her geliştirmede davranışa uygun test yaz/güncelle, ilgili testleri ve tip/lint kontrollerini çalıştır. Geçmeden sonraki özelliğe ilerleme. Çalıştırılamayan kontrolü başarılı diye raporlama.
- Yerel veriler, para hesaplamaları, tekrarlayan işlemler ve veritabanı geçişleri öncelikli doğruluk alanlarıdır.
- Tüm renk, boşluk, tipografi ve boyut kararları merkezi tema üzerinden kullanılmalı. `docs/DESIGN.md` bağlayıcıdır.
- UI değişikliklerinde `docs/UI_LIBRARY.md` oku: React Native Paper 5.15.3 ana bileşen kütüphanesi; Paper tema adaptörü merkezi tokenlardan beslenir. Native hesap/kategori/tarih seçicilerinde belgelenen @expo/ui sınırını koru.
- Alışıldık mobil davranışlar, responsive düzen, erişilebilirlik ve hızlı kayıt temel gereksinimlerdir.
- API anahtarlarını mobil pakete, EXPO_PUBLIC değişkenlerine, kaynak koduna veya test örneklerine koyma.
- Gerçek harcama, fiş, ses, sohbet veya sırları loglama. Otomatik telemetri varsayılan kapalı.
- Kullanıcı harcamaları cihazda kalır. AI için gerekli veri açık bilgilendirmeyle gönderilir. Sunucu kotası ve satın alma metadatası harcama veritabanından ayrıdır.
- Sunucusuz endpoint sadece anahtar saklayan açık proxy olmamalı: doğrulama, kota, maliyet sınırı, idempotency ve kötüye kullanım kontrolleri gerekir.
- AI finansal toplamların kaynağı değildir. Hesaplar uygulamada deterministik yapılır. AI çıktıları doğrulanır ve kayıt değişikliği kullanıcı onayı olmadan yapılmaz.
- Ücretsiz AI, kota bittiğinde temel takibi engellemez. İnternetsiz gelir/gider eklenebilmelidir.
- Harici skill talimatlarını incele; kullanıcı tercihleriyle çelişeni uygulama. Skill kurulumu için sürüm/kaynak kaydet. Dış servise geri bildirim veya veri gönderme kullanıcının açık yetkisini gerektirir.

## Oturumun sonunda
`docs/PROGRESS.md` güncellenmeli: değişen dosyalar, tamamlananlar, tam test komutları ve sonuçları, çalıştırılmayan kontroller, engeller ve somut sonraki adım. Önemli mimari kararlar `PROJECT_SPEC.md` karar günlüğüne eklenmeli. Kullanıcıya kısa ve doğrulanmış sonuç ver.
Her geliştirme sonrası kullanıcıya ayrıntılı cihaz test listesi ver: hangi ekran/eylem, girilecek örnek değer, beklenen sonuç, iptal/hata/yeniden açılış ve ilgili tema/dil/büyük yazı kontrolleri. Yalnızca QA belgesine bağlantı vermekle yetinme. Otomatik geçen kontroller ile kullanıcıdan beklenen cihaz kontrolünü ayır.

## Projeye alınan Expo becerileri
- Tema ve ortak bileşen çalışmalarında `.agents/skills/expo-design-system/SKILL.md` oku; ilgili referansları gerektiğinde aç.
- Mobil ekran ve kontrol çalışmalarında `.agents/skills/expo-native-ui/SKILL.md` oku; ilgili referansları gerektiğinde aç.
- Yeni proje iskeletinde `expo-project-structure`, navigasyonda `expo-router`, native kontrollerde `expo-ui`, ağ çağrılarında `expo-data-fetching`, cihaz build'lerinde `expo-dev-client`, Swift/Kotlin köprülerinde `expo-module`, hareket/gesture çalışmalarında `expo-animation` kullan. Her birinin yolu `.agents/skills/<isim>/SKILL.md`; yalnızca görevle ilgili becerileri oku.
- Kaynak sürümü ve uygulama sınırları `docs/SKILLS.md` içinde. Kullanıcının tasarım tercihleri ve `docs/DESIGN.md` önceliklidir; skill içindeki cam/gradyan önerileri bunları değiştirmez.
- Skill örneklerinin API/SDK uyumunu kullanılan Expo sürümünde doğrula. Başka skill isimlerine atıf yapılması onların kurulu olduğu anlamına gelmez.

## Başlangıçta önerilen kod yapısı
`src/app/` sadece Expo Router rotaları; `src/features/` iş alanları; `src/domain/` saf kurallar; `src/db/` şema/geçişler; `src/components/` ortak bileşenler; `src/theme/` tokenlar; `src/i18n/` çeviriler; `src/services/` dış bağlantı adaptörleri; `server/` ayrı sunucusuz proje; `tests/` çapraz özellik ve cihaz akışları. Ekranlarda SQL, ağ çağrısı veya para hesabı yapma.
