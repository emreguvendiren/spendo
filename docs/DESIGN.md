# Spendo — tasarım sözleşmesi

## Kimlik ve yön
Logo: kökteki `logo.png`, mor yazı ve açık lavanta zemin. Marka vurgusu mor; her ekranı mor yapmak gerekmiyor. Finans verisi ve eylemler öncelikli. AI özelliği ayrı bir görsel evren oluşturmaz.

İstenmeyenler: yoğun mor/mavi gradyanlar, cam kartlar, neon/parlayan sınırlar, sürekli sparkle/yıldız ikonları, robot avatarı, büyük AI kahraman banner'ları, her satırın ayrı karta konması, gereksiz animasyon ve aşırı yuvarlatılmış kontroller. Kullanıcı açıkça bu yaygın AI görünümünü istemiyor.

## Görsel temel
- Bileşen kütüphanesi **React Native Paper 5.15.3**. Tema bağlantısı, hangi kontrolün hangi kütüphaneye ait olduğu ve platformlar arası tercih `docs/UI_LIBRARY.md` içinde bağlayıcı olarak tanımlıdır. Kütüphane varsayılanı bu belgedeki marka/erişilebilirlik kurallarını geçersiz kılmaz.
- Inter Regular/Medium/SemiBold; yerel statik TTF'ler, tutarlarda eş genişlikli rakamlar ve okunaklı hiyerarşi. Başlık, toplam ve işlem satırı ayrımı boşluk/tipografiyle yapılır. Kullanıcının 14 Ekim özel font isteğiyle sistem fontu kararı güncellendi. Ölçek/satır yüksekliği ve kullanım sınırları `docs/TYPOGRAPHY.md` içinde. Native seçiciler platform fontunu korur; yükleme hatasında uygulama sistem fontuyla açılır.
- Nötr yüzeyler, ince ayırıcılar, sınırlı gölge; lavanta yalnızca küçük vurgu alanlarında.
- Mor yalnızca ana eylem, seçili durum ve marka için. Gelir/gider renkleri semantik; renk yanında metin/ikon kullan.
- Tek bir ortak ikon ailesi; platform sistem kontrolleri uygun olduğunda tercih edilir. Özel icat edilmiş hareketlerle temel işlemler gizlenmez.
- Tokenlar: semantic color, spacing, radius, typography, elevation ve motion. Renk/ölçü ekran içinde rastgele tanımlanmaz.
- Logo piksel örnekleri: mor alan #8C4CD1, açık alanlar #F4E8FE / #F3E7FD. Okunabilir vurgu için #6817CD, koyu temada #BB91F2 seçildi; bunlar logodan birebir alınmış piksel değil, marka uyumlu kontrast seçimleridir. Tam tokenlar src/theme/tokens.ts içinde; normal metin çiftleri iki temada en az 4.5:1 kontrast testinden geçti.

## Ekran davranışları
Para gösterimi Türkçede `1.234,56`, İngilizcede `1,234.56`; tutar, bakiye ve transferler ortak kesin para gösterimini kullanır. Düzenleme alanı gruplamasız kayıpsız tutar metniyle açılır; yazarken cursor/ayırıcılar otomatik değiştirilmez. Rakamların eş genişliği korunur.
Alt bar sırası: Ana Sayfa, İşlemler, yuvarlak `+` eylemi, Raporlar, Asistan. Kullanıcının 14 Ekim 2026 isteğiyle `+` düğmesi İşlemler'in hemen sağında, bar yüzeyinden 12 birim yükselir; 56 birim dokunma alanı ve merkezi accent/onAccent renklerini kullanır. Görsel etiket yalnız `+`; ekran okuyucu etiketi TR/EN İşlem ekle/Add transaction. Mevcut kayıt Stack ekranını açar, dört sekmenin seçili durumunu korur. Alt/yan safe area ve büyüyen sekme etiketleri hesaba katılır.
Ana Sayfa: dönem harcaması/geliri, kalan bütçe, son işlemler ve kolay Ekle. Uzun reklam/tanıtım banner'ı yok. İşlemler: tarih gruplu standart liste, tutar sağda, kategori/açıklama solda, görünür filtre. Düzenleme satıra dokunarak; swipe yardımcı olabilir ama tek yol değildir.

Kayıt: tutar öncelikli sheet veya ekran; gelir/gider seçimi açık. Sayısal klavye, yerel ayırıcı desteği, yeterli dokunma alanı. Kaydet klavye altında kaybolmaz. İsteğe bağlı ayrıntılar formu şişirmeden açılır.

Hesaplar: Ana Sayfa'daki Hesaplar eyleminden erişilen standart liste. Ad/tür/tüm dönem bakiyesi ve para birimi gösterilir; farklı para birimleri tek toplam yapılmaz. Hesap ekle formunda ad, native tür/para birimi picker'ları ve bugünkü başlangıç bakiyesi vardır. Başlangıç negatif/sıfır olabilir; kart borcu negatif girilir ve gelir/gider sayılmaz. Satıra dokununca ad düzenlenir; mevcut hesabın tür/para birimi sabittir. Hesap detayında Başlangıç bakiyesini düzelt ayrı Stack formunu açar; gruplamasız kesin ilk tutar, sabit tarih, hesap/para birimi ve bugünkü toplamdan farkını açıklayan yardım görünür. Negatif/sıfır kabul edilir; tarih ve diğer hareketler korunur. Ad taslağı kirliyken düzeltme eylemi kapalıdır. Paper giriş/eylemler, merkezi tokenlar ve native Stack korunur.

Kategoriler: Ana Sayfa'dan erişilir, gelir/gider segmentleri ayrı listeler. Oluşturma/ad düzenleme Paper formu; tür kayıt referanslarını korumak için oluşturulduktan sonra sabit. Özel ad dil değişince çevrilmez. Transfer: Hesaplar ekranından, native gönderen/alan hesap ve tarih seçimi; gönderilen tutar öncelikli, dövizde alınan tutar da açık girilir. Aynı para biriminde alınan tutar eşittir. Gelir/gider dışında olduğu ve kur tahmini yapılmadığı formda belirtilir. Liste tutar/kaynak → karşılık/hedef gösterir; uzun isim ve iki tutar alt satıra geçebilir. Geçmiş satır özel transfer düzenleme ekranını açar; alanlar kayıpsız gruplamasız dolar. Kendi arşivli uçları aynı rolde etiketle korunur. Silme onayı iki hesap etkisinin kalkacağını ve geri alınamayacağını açıklar. Eski kayıt başarı ekranında başka kaydın Geri al bildirimi gösterilmez.

Raporlar: anlaşılır dönem seçimi, sınırlı grafik, görünür toplamlar. Grafiğin erişilebilir metin/tablo karşılığı vardır; renk tek bilgi kanalı değildir. Asistan: alışılmış sohbet, kalan kota ve gönderilen veri bilgisine kolay erişim. AI sonuçları süslü sloganlar yerine kısa somut öneriler sunar.

Hesap/kategori listesinde Aktif/Arşiv segmentleri; satır formundan onayla Arşivle veya Arşivden çıkar. Arşivleme geçmiş/bakiye/toplamları korur ve yeni kayıt seçimlerinden çıkarır. Eski kayıt düzenlemesinde kendi arşivli öğesi etiketle korunur. Son aktif hesap ve her türün son kategorisi için açık hata; kaydedilmemiş ad taslağında arşiv eylemi devre dışıdır.

## Responsive ve erişilebilirlik
- Safe area ve klavye alanını hesaba kat; ekranın tamamını sabit piksel yüksekliğe bağlama.
- Başlangıç kontrol genişlikleri 320, 390 ve 430 mantıksal birim; yatay yön ve büyük yazı da kontrol edilir. Bunlar destek garantisi değil test matrisi başlangıcıdır.
- Android en az 48dp, iOS en az 44pt dokunma alanı. Aralığı görünür ikon boyutu değil dokunma alanı belirler.
- Normal metinde en az 4.5:1, büyük metinde 3:1 kontrast hedefi; grafik/UI öğelerinde 3:1. Açık/koyu tema ayrı doğrulanır.
- VoiceOver/TalkBack etiketleri, seçili/devre dışı durumları, mantıklı odak sırası ve hata anonsları.
- Sistem yazı ölçeğini engelleme. Kritik tutar/eylem kırpılmaz; gerekirse düzen alt alta geçer. Uzun İngilizce metinler ve Türkçe karakterler test edilir.
- Hareket azaltma tercihine uy; haptics yardımcıdır, tek geri bildirim değildir.
- Boş, yükleniyor, hata, offline ve kota bitti durumları aynı tasarım sistemini kullanır.

## Tasarım kabulü
Ana ekran header'ında sol üstte yalnızca kökteki `logo.png` bulunur; ayrı metin başlığı ve sürüm etiketi gösterilmez. Kare logonun orta wordmark alanı görünümde kırpılır; kaynak dosya korunur.
14 Ekim 2026 UI revizyonu: sloganlı giriş kaldırıldı; aylık özet tek nötr yüzeyde, tutar öncelikli. İşlem satırları kategori ikonu, kısa açıklama/hesap bilgisi ve hizalı tutar içerir. Formda açık gelir/gider segmenti ve kompakt hesap/kategori/tarih grubu var; ayarlar standart seçim satırları kullanır. Native tasarım kabulü henüz bekliyor.
Her ekran için iki tema/dil, küçük telefon/büyük yazı, klavye, ekran okuyucu ve gerçek içerik değerlendirilir. Örnek başarı: sık kullanılan bir gider kullanıcıdan yalnızca tutar ve Kaydet ister; diğer alanlar görünür ve değiştirilebilir. Tutorial kötü navigasyonu telafi etmek için kullanılmaz.
