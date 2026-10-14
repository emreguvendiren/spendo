# Projeye alınan beceriler

Kurulum tarihi: 14 Ekim 2026. Kaynak: https://github.com/expo/skills
Sabit kaynak commit: `d4f484024fec15196bfd3c272e953e3f983972cf`.
Hedef: proje içindeki `.agents/skills/`; global Codex kurulumu yapılmadı.

| Beceri | Bildirilen sürüm / lisans | Yerel dosya |
|---|---|---|
| expo-design-system | 1.0.0 / MIT | `.agents/skills/expo-design-system/SKILL.md` |
| expo-native-ui | 1.1.1 / MIT | `.agents/skills/expo-native-ui/SKILL.md` |
| expo-project-structure | 1.0.0 / MIT | `.agents/skills/expo-project-structure/SKILL.md` |
| expo-router | 1.0.1 / MIT | `.agents/skills/expo-router/SKILL.md` |
| expo-ui | 1.0.0 / MIT | `.agents/skills/expo-ui/SKILL.md` |
| expo-data-fetching | 1.0.0 / MIT | `.agents/skills/expo-data-fetching/SKILL.md` |
| expo-dev-client | 1.1.0 / MIT | `.agents/skills/expo-dev-client/SKILL.md` |
| expo-module | 1.0.0 / MIT | `.agents/skills/expo-module/SKILL.md` |
| expo-animation | 1.0.0 / MIT | `.agents/skills/expo-animation/SKILL.md` |

Skill Installer'ın `install-skill-from-github.py` betiği kullanıldı. İki becerinin tam klasörü indirildi: toplam 13 dosya; 2 SKILL.md, 9 referans ve 2 agents/openai.yaml. Kaynak içerik değiştirilmedi. SKILL.md içindeki sürüm/lisans alanları ve yerel referansların varlığı kontrol edildi.

Yedi ek beceriyle güncel toplam 9 beceri ve 48 dosya. Yeni becerilerin 20 yerel destek yolu (referanslar, RECIPES.md ve list-components.js dahil) doğrulandı. Yardımcı scriptler veya dış geri bildirim komutları çalıştırılmadı.

## Kullanım sınırları
- Bunlar geliştirme rehberidir, uygulamanın çalışması için gereken npm paketleri değildir. Sonraki kullanıcı turunda keşfedilebilir; yeni oturumda AGENTS.md ayrıca açık dosya yollarını gösterir.
- Spendo'nun kullanıcı tarafından belirlenen tasarım kuralları önceliklidir. Cam efektleri, gradyanlar ve marka dışı dinamik vurgu renkleri otomatik uygulanmaz.
- Expo Go'nun yeterli olduğu özellikler orada denenebilir; Siri/özel native kod ve üretim doğrulaması development build gerektirir.
- SDK 56+, Color API ve @expo/ui gibi sürüme bağlı tavsiyeler kurulumdaki gerçek SDK ile doğrulanır; örnek kod sorgusuz kopyalanmaz.
- 14 Ekim 2026 ek araştırmasıyla yedi beceri daha aynı sabit commit'ten tam klasörleriyle kuruldu. expo-overview, expo-skill-feedback ve ücretli EAS servis becerileri kurulu değildir. İlgili skill'e atıf yapılması kurulu olduğu anlamına gelmez.
- Rehberlerdeki dış geri bildirim komutları kullanıcı açıkça yetkilendirmedikçe çalıştırılmaz.
- Güncelleme otomatik yapılmaz. Yeni commit incelenir ve bu kayıt güncellenir; kaynak sürümü sessizce değişmez.

## Ek beceriler neden seçildi?
- project-structure: yeni proje iskeleti; mevcut Spendo domain/features/server ayrımı önceliklidir, otomatik yeniden yapılandırma yapılmaz.
- router: standart sekme/stack/sheet, geri gitme ve deep link davranışları.
- ui: gerçek native form ve ayar kontrolleri; uzun harcama listelerinde virtualized liste kullanılır.
- data-fetching: AI/kur istekleri, offline, iptal ve hata sonrası taslağın korunması. Retry örnekleri finansal POST veya AI çağrısına idempotency olmadan uygulanmaz; her HTTP hatası yeniden denenmez.
- dev-client: gerçek iPhone/Android native test build'leri. Rehberdeki EAS fiyat ve CLI örnekleri güncel dokümanla doğrulanmalı; skill kurulumu build, publish veya ücretli servis başlatmaz. Windows'ta iOS local build yapılmaz.
- module: ileride Siri/Android adaptörleri için Swift/Kotlin köprüsü; tek başına asistan entegrasyonu sağlamaz.
- animation: yalnızca amaçlı geri bildirim, klavye ve gesture davranışları; reduced motion ve gerçek cihaz doğrulaması. Dekoratif animasyon ekleme talimatı değildir.

Test araştırmasında Callstack'in resmi agent-skills kataloğu da incelendi; bu turda doğrudan uygun bağımsız test skill'i doğrulanmadığından alınmadı. Zorunlu test sözleşmesi AGENTS.md ve PROJECT_SPEC.md içinde geçerlidir. Yerel SQLite bilgisi mevcut expo-native-ui/references/storage.md içinde; ayrıca bir SQLite skill'i kurulmuş değildir.
