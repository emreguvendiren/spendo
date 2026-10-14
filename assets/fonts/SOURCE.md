# Inter font varlıkları

14 Ekim 2026. Font ailesi: Inter. Tasarımcı/proje: Rasmus Andersson / Inter Project Authors.

- Resmi proje: https://github.com/rsms/inter
- Dağıtım kaynağı: `@expo-google-fonts/inter@0.4.2` (npm, Expo Google Fonts).
- İndirme: `npm view @expo-google-fonts/inter version --json`, ardından `npm pack @expo-google-fonts/inter@0.4.2 --pack-destination .expo --json`.
- Paket shasum: `2d37ffb1cb16600cff616b6c4c0efee9b6c47c28`.
- Paket integrity: `sha512-syfiImMaDmq7cFi0of+waE2M4uSCyd16zgyWxdPOY7fN2VBmSLKEzkfbZgeOjJq61kSqPBNNtXjggiQiSD6gMQ==`.
- Yalnız 400Regular, 500Medium, 600SemiBold TTF dosyaları ve LICENSE_FONT alındı. Font içeriği değiştirilmedi; dosya adları uygulamanın runtime adlarına göre Inter-Regular/Medium/SemiBold.ttf yapıldı.
- Font lisansı SIL Open Font License 1.1; tam metin `OFL-Inter.txt`. Fontlar uygulamada yerel varlıklardır, runtime CDN/Google Fonts isteği yok. npm paketi uygulama bağımlılığına eklenmedi.

| Dosya | Bayt | SHA-256 |
|---|---:|---|
| Inter-Regular.ttf | 342408 | A414B48AA577EF2C62EBB135341DDEEF33EE26A4F5DC9F787F93C1AAB08EBB50 |
| Inter-Medium.ttf | 342892 | F1738576525E86DB1D5CF63A6C1B56E0A7E2A2898B499AC93DB95F2E7A9F9CD5 |
| Inter-SemiBold.ttf | 343632 | F30E9D2574C3BEC5144347FF965F9841C8F06857F0B7383000F8C9489A161841 |

Toplam TTF boyutu 1.028.932 bayt. Fontların OS/2 weight değerleri, cmap Türkçe/para/rakam karakterleri ve GSUB tnum özelliği `tests/font-assets.test.ts` ile gerçek dosyalar üzerinden doğrulanır. Bu kontrol native rendering kabulü değildir.
