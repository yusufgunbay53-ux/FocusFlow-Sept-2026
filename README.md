# FocusFlow

AI destekli görev ve odaklanma asistanı.

## Özellikler

- Karanlık neon tema (`#0b111e`, `#00d2ff`) ve glassmorphism
- Sürükle-bırak Kanban: Yapılacaklar / Yapılıyor / Tamamlandı
- Öncelik etiketleri, düzenleme, tamamlama
- 25/5 Pomodoro, tarayıcı bildirimi ve ses uyarısı
- Lo-Fi / yağmur ortam sesi (yerleşik gürültü üretici)
- Mock AI performans koçu (istatistiklere göre mesaj)
- `localStorage` ile kalıcılık
- PWA manifest (Vite PWA)

## Çalıştırma

```bash
npm install
npm run dev
```

## Veri modeli

`src/types.ts` içinde `Task`, `PomodoroSession` ve `AppStats` tanımlıdır. Supabase / Firebase geçişi için alanlar düz JSON olarak tutulur.
