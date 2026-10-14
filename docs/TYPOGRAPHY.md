# Spendo tipografi

14 Ekim 2026: kullanıcının özel font isteğiyle sistem fontu tasarım tercihi Inter ailesiyle güncellendi. Regular 400 metin/açıklama, Medium 500 satır başlığı/etiket, SemiBold 600 başlık/tutar/ana eylem. Logo kaynak görseli korunur. Native @expo/ui seçicilerin sistem tipografisi platform kontrolü sınırında korunur.

## Kaynak ve kullanım

Fontlar `assets/fonts/` içindeki üç statik TTF'dir. Lisans/provenance/hash `assets/fonts/SOURCE.md` ve `OFL-Inter.txt` içinde. Yeni font npm bağımlılığı veya runtime ağ isteği yok. Kaynak [Inter](https://github.com/rsms/inter), uygulama API'si [Expo SDK 57 Font](https://docs.expo.dev/versions/v57.0.0/sdk/font/).

Tek kaynak `src/theme/tokens.ts`: `fontFaces`, `typography`, `textMetrics`. Statik ağırlık için fontFamily seçilir, fontWeight normal kalır; sahte bold üretme veya ekranlarda bağımsız fontWeight ekleme. AppText'te `weight="medium"` / `weight="semibold"` kullan. Tutar ve display tabular-nums kullanır; görüntü formatı para domain'inden gelir.

| Rol | Boyut | Satır yüksekliği | Ağırlık |
|---|---:|---:|---|
| Ana başlık | 28 | 36 | SemiBold |
| Bölüm başlığı | 20 | 28 | SemiBold |
| Gövde | 16 | 24 | Regular |
| İkincil bilgi | 13 | 20 | Regular |
| Tutar | 40 | 48 | SemiBold |
| Ana toplam | 48 | 58 | SemiBold |

Ana toplamda letterSpacing -1. Paper MD3 ölçüleri kendi tip ölçeğiyle korunur; bütün Paper face'leri aynı Inter kaynaklarından beslenir. Body/default Regular, title/label Medium, headline/display SemiBold. Button ana eylem SemiBold. Stack başlığı merkezi heading boyutuyla SemiBold. Sistem yazı büyütmesi kapatılmaz, maksimum font ölçeği eklenmez; büyük tutar gerekirse alt satıra geçer.

## Açılış

FontsProvider yerel varlıkları mevcut expo-font/useFonts ile tek sefer yükler. Splash yükleme bitene kadar korunur; içerik Inter hazır olunca görünür. Hata halinde splash kapanır ve bütün uygulama/Paper sistem fontlarıyla kullanılabilir kalır; kayıt akışı font hatasına bağımlı olmaz. Hatalar kullanıcı verisi veya asset içerikleriyle loglanmaz. Runtime yükleme Expo Go ile native paket için aynı alias'ları sağlar; yeni native plugin/build ayarı gerekmedi.

## Telefonda test

1. Expo Go Reload, sonra tamamen kapatıp yeniden aç: yazılar açılıştan sonra font değiştirmiş gibi sıçramamalı; splash takılı kalmamalı. Logo değişmemeli. Gerçek font yükleme hatası cihazda enjekte edilmedi; sistem fallback otomatik test edildi.
2. Ana Sayfa → İşlemler → Hesaplar → Ayarlar: metin ve Paper kontrol fontları tutarlı, başlık/tutar ağırlıkları ayırt edilir olmalı. Native hesap/kategori/tarih menüsünde platformun sistem fontu normaldir.
3. Hesap ekle ad alanına `İstanbul, Iğdır, Şişli, Çeşme, Ödemiş, Üsküdar` yaz: İ/ı/Ğ/ğ/Ş/ş/Ç/ç/Ö/ö/Ü/ü kesilmemeli veya kutu olarak görünmemeli. Kaydetmeden çık; örnek hesapların değişmesi gerekmez.
4. İşlem formunda `1111,11`, sonra `8888,88` yaz. Rakamlar eş genişlikli ve tutar hizası sabit görünmeli; virgül/nokta ve TRY/USD tutarları okunmalı. Kaydetmeden çık. English'de `1234.50`, Türkçede `1234,50` girişini de incele; font değişimi sayı ayrıştırmasını değiştirmemeli.
5. Açık/koyu ve Türkçe/English: uzun açıklamalar, negatif kredi kartı bakiyesi, Kaydet/Hesap ekle ve alt bar etiketleri okunmalı. Mor/semantik renkler önceki tema tokenlarıdır.
6. Sistem yazı boyutunu büyüt ve yatay çevir: satır yükseklikleri büyümeli, Türkçe aksanlar/düğme etiketleri kırpılmamalı, tutarlar reflow yapabilmeli; klavye açıkken Kaydet'e kaydırarak ulaşılmalı. VoiceOver/TalkBack etiketleri korunmalı.
7. Paket yüklüyken uçak modunda ekranlar arasında gez: font için internet gerekmemeli. Expo Go geliştirme paketini ilk yüklerken Metro gereksinimi devam eder; tam offline soğuk açılış native build'de ayrıca doğrulanır.

Otomatik: font dosyası/ağırlık/cmap/tnum, loading/ready/failure, Paper face'leri, AppText gerçek ağırlık seçimi/tabular ve ölçek kısıtlamasının yokluğu. Native glyph çizimi/metrics, platform header fontu ve büyük yazı cihaz kabulü henüz açık.
