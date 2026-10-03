# 🦈 Scamerino Alertinio – Paleta Kolorów i Design System

> Wyekstrahowano bezpośrednio z oficjalnej grafiki postaci [`assets/Scamerino_Alertinio.png`](./Scamerino_Alertinio.png) dla projektu **Make No Mistakes Team (HackYeah 2026)**.

---

## 🎨 Tokeny kolorystyczne

| Rola w systemie | Nazwa tokenu | Kolor | HEX | RGB | Zastosowanie w interfejsie |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Primary Brand** | `shark-blue` | <img src="https://via.placeholder.com/18/0F62DB/0F62DB.png" width="18" height="18" /> | `#0F62DB` | `15, 98, 219` | Główne przyciski (CTA), pasek nawigacji, motyw przewodni pomocnika |
| **Primary Dark** | `shark-blue-dark` | <img src="https://via.placeholder.com/18/0A3B8C/0A3B8C.png" width="18" height="18" /> | `#0A3B8C` | `10, 59, 140` | Hover stanów przycisków, nagłówki kart, aktywne zakładki |
| **Secondary Metal** | `shield-silver` | <img src="https://via.placeholder.com/18/E2E8F0/E2E8F0.png" width="18" height="18" /> | `#E2E8F0` | `226, 232, 240` | Tło tarczy obronnej, neutralne kontenery, separatory |
| **Secondary Border**| `titanium-border` | <img src="https://via.placeholder.com/18/CBD5E1/CBD5E1.png" width="18" height="18" /> | `#CBD5E1` | `203, 213, 225` | Obramowania pól tekstowych, ramki kart, linie podziału |
| **Warning / Alert** | `siren-amber` | <img src="https://via.placeholder.com/18/FF8A00/FF8A00.png" width="18" height="18" /> | `#FF8A00` | `255, 138, 0` | Świecący kogut alarmowy, ostrzeżenia o podejrzeniu, status oczekiwania |
| **Security / Success** | `padlock-gold` | <img src="https://via.placeholder.com/18/FFB800/FFB800.png" width="18" height="18" /> | `#FFB800` | `255, 184, 0` | Złota kłódka, status bezpieczny/zweryfikowany, punkty tarczy |
| **Danger / Phishing** | `hook-crimson` | <img src="https://via.placeholder.com/18/EA3323/EA3323.png" width="18" height="18" /> | `#EA3323` | `234, 51, 35` | Wykryto phishing / wyłudzenie, przycisk zablokowania, flaga ryzyka |
| **App Surface** | `ice-surface` | <img src="https://via.placeholder.com/18/F8FAFC/F8FAFC.png" width="18" height="18" /> | `#F8FAFC` | `248, 250, 252` | Główne tło aplikacji (jasne, niemęczące wzroku) |
| **Card White** | `clean-white` | <img src="https://via.placeholder.com/18/FFFFFF/FFFFFF.png" width="18" height="18" /> | `#FFFFFF` | `255, 255, 255` | Tła kart, okna dialogowe, inputy, brzuch rekina |
| **Typography Dark** | `navy-slate` | <img src="https://via.placeholder.com/18/0F172A/0F172A.png" width="18" height="18" /> | `#0F172A` | `15, 23, 42` | Nagłówki, czytelny tekst o wysokim kontraście (WCAG AAA) |
| **Typography Muted**| `muted-slate` | <img src="https://via.placeholder.com/18/64748B/64748B.png" width="18" height="18" /> | `#64748B` | `100, 116, 139` | Podtytuły, daty, metadane, wskazówki pomocnicze |

---

## 💻 Integracja techniczna

### 1. Tailwind CSS (`tailwind.config.js`)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'shark-blue': {
          DEFAULT: '#0F62DB',
          dark: '#0A3B8C',
        },
        'shield-silver': {
          DEFAULT: '#E2E8F0',
          border: '#CBD5E1',
        },
        'siren-amber': '#FF8A00',
        'padlock-gold': '#FFB800',
        'hook-crimson': '#EA3323',
        'cyber-surface': '#F8FAFC',
        'cyber-navy': '#0F172A',
      },
      borderRadius: {
        'widget': '1.25rem', // 20px - dla zaokrąglonego interfejsu dziecka
      }
    }
  }
}
```

### 2. Pliki w repozytorium
- Plik JSON (Design Tokens): [`assets/scamerino_palette.json`](./scamerino_palette.json)
- Plik CSS (Zmienne CSS): [`assets/scamerino_palette.css`](./scamerino_palette.css)
