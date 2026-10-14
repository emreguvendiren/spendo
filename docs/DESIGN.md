# Spendo — tasarım sözleşmesi

## Kimlik ve yön
Logo: kökteki `logo.png`, mor yazı ve açık lavanta zemin. Marka vurgusu mor; her ekranı mor yapmak gerekmiyor. Finans verisi ve eylemler öncelikli. AI özelliği ayrı bir görsel evren oluşturmaz.

İstenmeyenler: yoğun mor/mavi gradyanlar, cam kartlar, neon/parlayan sınırlar, sürekli sparkle/yıldız ikonları, robot avatarı, büyük AI kahraman banner'ları, her satırın ayrı karta konması, gereksiz animasyon ve aşırı yuvarlatılmış kontroller. Kullanıcı açıkça bu yaygın AI görünümünü istemiyor.

## Görsel temel
- Sistem fontu; tutarlarda hizalı rakamlar ve okunaklı hiyerarşi. Başlık, toplam ve işlem satırı ayrımı boşluk/tipografiyle yapılır.
- Nötr yüzeyler, ince ayırıcılar, sınırlı gölge; lavanta yalnızca küçük vurgu alanlarında.
- Mor yalnızca ana eylem, seçili durum ve marka için. Gelir/gider renkleri semantik; renk yanında metin/ikon kullan.
- Tek bir ortak ikon ailesi; platform sistem kontrolleri uygun olduğunda tercih edilir. Özel icat edilmiş hareketlerle temel işlemler gizlenmez.
- Tokenlar: semantic color, spacing, radius, typography, elevation ve motion. Renk/ölçü ekran içinde rastgele tanımlanmaz.
- Logo piksel örnekleri: mor alan #8C4CD1, açık alanlar #F4E8FE / #F3E7FD. Okunabilir vurgu için #6817CD, koyu temada #BB91F2 seçildi; bunlar logodan birebir alınmış piksel değil, marka uyumlu kontrast seçimleridir. Tam tokenlar src/theme/tokens.ts içinde; normal metin çiftleri iki temada en az 4.5:1 kontrast testinden geçti.

## Ekran davranışları
Ana Sayfa: dönem harcaması/geliri, kalan bütçe, son işlemler ve kolay Ekle. Uzun reklam/tanıtım banner'ı yok. İşlemler: tarih gruplu standart liste, tutar sağda, kategori/açıklama solda, görünür filtre. Düzenleme satıra dokunarak; swipe yardımcı olabilir ama tek yol değildir.

Kayıt: tutar öncelikli sheet veya ekran; gelir/gider seçimi açık. Sayısal klavye, yerel ayırıcı desteği, yeterli dokunma alanı. Kaydet klavye altında kaybolmaz. İsteğe bağlı ayrıntılar formu şişirmeden açılır.

Raporlar: anlaşılır dönem seçimi, sınırlı grafik, görünür toplamlar. Grafiğin erişilebilir metin/tablo karşılığı vardır; renk tek bilgi kanalı değildir. Asistan: alışılmış sohbet, kalan kota ve gönderilen veri bilgisine kolay erişim. AI sonuçları süslü sloganlar yerine kısa somut öneriler sunar.

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
Her ekran için iki tema/dil, küçük telefon/büyük yazı, klavye, ekran okuyucu ve gerçek içerik değerlendirilir. Örnek başarı: sık kullanılan bir gider kullanıcıdan yalnızca tutar ve Kaydet ister; diğer alanlar görünür ve değiştirilebilir. Tutorial kötü navigasyonu telafi etmek için kullanılmaz.
