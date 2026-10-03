---
theme: default
title: Scamerino Alertinio
info: Cyberpomocnik dla dzieci 9-13 lat · Make No Mistakes Team · HackYeah 2026 Defence
colorSchema: light
aspectRatio: 16/9
htmlAttrs:
  lang: pl
canvasWidth: 980
fonts:
  sans: Nunito
  serif: Baloo 2
  provider: google
transition: slide-left
layout: image-right
image: /scamerino.png
backgroundSize: contain
---

<div class="kicker">HackYeah 2026 · Defence</div>

# Scamerino Alertinio

<p class="text-xl leading-snug" style="color: var(--ink)">
Cyberpomocnik, który uczy dzieci 9-13 lat rozpoznawać oszustwa w grach i pomaga, gdy podejrzana wiadomość pojawi się naprawdę.
</p>

<div class="mt-8 flex gap-2 flex-wrap">
  <span class="pill blue">misja w Roblox</span>
  <span class="pill blue">pomocnik w przeglądarce</span>
  <span class="pill blue">panel opiekuna</span>
</div>

<div class="absolute bottom-8 left-12 text-sm" style="color: var(--muted)">
Make No Mistakes Team
</div>

<!--
Jedno zdanie: kim jesteśmy i co robimy. Pokazujemy Scamerino. Nie czytamy slajdu.
-->

---

<div class="kicker">Problem</div>

# Dzieci grają tam, gdzie są oszuści

<div class="grid grid-cols-3 gap-5 mt-4">
  <div class="card">
    <div class="stat">4,72 mln</div>
    <div class="stat-label">użytkowników Robloxa w Polsce. To lider gier w PL.</div>
    <div class="src">Mediapanel, VIII 2025</div>
  </div>
  <div class="card">
    <div class="stat red">28%</div>
    <div class="stat-label">polskich nastolatków padło ofiarą cyberataku: <b>12%</b> włamanie na konto, <b>8%</b> kradzież przedmiotów w grach.</div>
    <div class="src">NASK „Nastolatki” 2024, N = 3665</div>
  </div>
  <div class="card">
    <div class="stat amber">#2</div>
    <div class="stat-label">Roblox to druga najczęściej podszywana marka w phishingu (12,3% prób), zaraz po Microsofcie.</div>
    <div class="src">NordVPN, Consumer Cybersecurity Report 2026</div>
  </div>
</div>

<div class="card mt-5 flex items-center gap-4">
  <div class="stat red" style="font-size: 1.8rem">610 tys.</div>
  <div class="stat-label" style="margin: 0">kont Roblox przejętych przez malware udające narzędzia do gry w ciągu 4 miesięcy.<span class="src"> · CERT Orange Polska, 09.2026</span></div>
</div>

<!--
Liczby tylko z pierwotnych źródeł. 51% dzieci 8-14 w UK gra w Roblox (Ofcom 2026), dla PL brak danych o wieku.
-->

---

<div class="kicker">Luka</div>

# Nikt nie stoi obok dziecka w chwili ataku

<div class="grid grid-cols-3 gap-5 mt-4">
  <div class="card">
    <div class="pill amber">Rodzice nie widzą</div>
    <div class="stat mt-3">57% → 21%</div>
    <div class="stat-label">57% rodziców mówi, że monitoruje dziecko w sieci. Potwierdza to 21% nastolatków.</div>
    <div class="src">NASK „Nastolatki” 2024</div>
  </div>
  <div class="card">
    <div class="pill amber">Dzieci milczą</div>
    <div class="stat mt-3">13% vs 28%</div>
    <div class="stat-label">Rodzice wiedzą o cyberataku na dziecko w 13% przypadków, a doświadczyło go 28%.</div>
    <div class="src">NASK „Nastolatki” 2024</div>
  </div>
  <div class="card">
    <div class="pill amber">Szkolenie zanika</div>
    <div class="stat mt-3">4 tygodnie</div>
    <div class="stat-label">Po treningu dzieci były o 14% lepsze. Po miesiącu efekt zniknął.</div>
    <div class="src">Lastdrager i in., SOUPS 2017 (NL)</div>
  </div>
</div>

<p class="mt-6 text-lg">
Lekcja raz w roku nie wystarczy. Pomoc musi być <b>pod ręką wtedy, gdy przychodzi wiadomość</b>, a trening musi wracać.
</p>

<!--
Tylko 5 z 57 badań gier o cyberbezpieczeństwie dla dzieci miało grupę kontrolną (Damenu 2025) - wracamy do tego na slajdzie o pomiarze.
-->

---

<div class="kicker">Rozwiązanie</div>

# Jedna postać, trzy miejsca

<div class="grid grid-cols-[1fr_300px] gap-8 items-start">
  <div class="flex flex-col gap-3">
    <div class="card compact">
      <b>🎮 Trening w Roblox</b>
      <div class="stat-label">Misja ze Scamerino: „darmowe Robuxy”, fałszywy admin, wymiana „ty pierwszy”.</div>
    </div>
    <div class="card compact">
      <b>🦈 Pomoc w realnej sytuacji</b>
      <div class="stat-label">Dziecko wkleja wiadomość z gry, Discorda, SMS-a lub maila. Scamerino pyta i proponuje następny krok.</div>
    </div>
    <div class="card compact">
      <b>🛡️ Opiekun w pętli</b>
      <div class="stat-label">Dziecko przekazuje sprawę rodzicowi i widzi, co udostępnia. Rodzic odpowiada w panelu.</div>
    </div>
  </div>
  <img src="/scamerino.png" loading="eager" class="w-[300px] h-[345px] object-cover object-top rounded-3xl" style="box-shadow: var(--shadow)" />
</div>

<!--
Wyróżnik: ta sama postać w treningu i w codziennej sytuacji. Samo „gra na Robloxie” nie jest nowe (Europol Cyber Defenders).
-->

---

<div class="kicker">Jak działa pomoc</div>

# Od wiadomości do bezpiecznego kroku

<div class="grid grid-cols-[1fr_1.4fr] gap-6 mt-2">
  <div class="card">
    <div class="text-xs mb-2" style="color: var(--muted)">Wiadomość w grze (fikcyjna)</div>
    <div class="msg">Hej! Event <b>10 000 Robux za darmo</b> tylko dziś 🎁 Zaloguj się na <b>robIox-bonus[.]xyz</b> i wpisz kod z SMS!</div>
    <div class="flex gap-2 flex-wrap mt-3">
      <span class="pill red">darmowe + link</span>
      <span class="pill red">pośpiech</span>
      <span class="pill red">I zamiast l</span>
      <span class="pill red">prośba o kod</span>
    </div>
  </div>
  <div class="grid grid-cols-4 gap-2 items-start">
    <div class="step"><div class="num">1</div><b class="text-base">Wklejam</b><div class="text-sm">treść, link albo zrzut ekranu</div></div>
    <div class="step"><div class="num">2</div><b class="text-base">Pytania</b><div class="text-sm">„Znasz tę osobę?” „Prosi o kod?”</div></div>
    <div class="step"><div class="num">3</div><b class="text-base">Sygnały</b><div class="text-sm">co jest podejrzane i dlaczego</div></div>
    <div class="step"><div class="num" style="background: var(--amber)">4</div><b class="text-base">Następny krok</b><div class="text-sm">sprawdź w aplikacji, zakończ, zgłoś, zapytaj opiekuna</div></div>
  </div>
</div>

<div class="card mt-5 flex items-center gap-4" style="border-color: var(--gold)">
  <div class="text-2xl">💡</div>
  <div class="body-text"><b>„Darmowe + link = pytam dorosłego”</b>. Scamerino nie mówi „to jest bezpieczne”. Uczy sprawdzać i prosić o pomoc. Na początku mówi też wprost, że jest AI.</div>
</div>

<!--
Hasło za CERT Orange Polska. AI Act art. 50 - awatar informuje, że jest AI.
-->

---

<div class="kicker">Demo</div>

# Co zbudowaliśmy w 24 godziny

<div class="grid grid-cols-3 gap-5 mt-2">
  <div class="card h-[280px] flex flex-col">
    <b>Misja Roblox</b>
    <div class="flex-1 mt-2 rounded-xl grid place-items-center text-xs" style="background: var(--silver); color: var(--muted)">[zrzut ekranu]</div>
  </div>
  <div class="card h-[280px] flex flex-col">
    <b>Pomocnik: rozszerzenie i strona</b>
    <div class="flex-1 mt-2 rounded-xl grid place-items-center text-xs" style="background: var(--silver); color: var(--muted)">[zrzut ekranu]</div>
  </div>
  <div class="card h-[280px] flex flex-col">
    <b>Panel opiekuna i wyniki klasy</b>
    <div class="flex-1 mt-2 rounded-xl grid place-items-center text-xs" style="background: var(--silver); color: var(--muted)">[zrzut ekranu]</div>
  </div>
</div>

<p class="mt-4 text-sm" style="color: var(--muted)">
W demo używamy wyłącznie fikcyjnych wiadomości i danych. Link do repozytorium i demo: <b>[uzupełnić]</b>
</p>

<!--
TODO: podmienić placeholdery na zrzuty, gdy MVP będzie gotowe.
-->

---

<div class="kicker">Pomiar</div>

# Mierzymy, czy dziecko radzi sobie samo

<div class="grid grid-cols-2 gap-6 mt-2">
  <div class="card">
    <b>Większość gier edukacyjnych nie jest rzetelnie sprawdzana</b>
    <div class="flex items-baseline gap-3 mt-3">
      <div class="stat red">5 z 57</div>
      <div class="stat-label">badań gier o cyberbezpieczeństwie dla dzieci miało grupę kontrolną.</div>
    </div>
    <div class="src">Damenu i in., przegląd systematyczny, 2025</div>
  </div>
  <div class="card">
    <b>Nasz protokół</b>
    <ul class="text-base mt-3 leading-relaxed">
      <li>test <b>przed i po</b> treningu, na nowych przykładach i <b>bez pomocnika</b></li>
      <li>liczymy trafne reakcje <b>i</b> niepotrzebne alarmy (uczciwe oferty też są w teście)</li>
      <li>w pilotażu: <b>grupa kontrolna</b> ze zwykłą lekcją</li>
      <li><b>powtórny test po 2-4 tygodniach</b></li>
    </ul>
  </div>
</div>

<p class="mt-5 text-sm" style="color: var(--muted)">
Demo pokazuje mechanizm pomiaru. Trwałą skuteczność potwierdzi dopiero pilotaż w szkole.
</p>

---

<div class="kicker">Konkurencja</div>

# Inni uczą. Nikt nie pomaga w prawdziwej sytuacji

<div class="card mt-1 p-2">

| Rozwiązanie | Wiek | Roblox | Pomoc w realnej sytuacji | Panel opiekuna | Pomiar z kontrolą |
|---|---|---|---|---|---|
| Sieciaki.pl (FDDS) | 7+ | <span class="no">-</span> | <span class="no">-</span> | <span class="no">-</span> | <span class="no">-</span> |
| Asy Internetu / Interlandia (Google) | kl. 4-8 | <span class="no">-</span> | <span class="no">-</span> | <span class="no">-</span> | RCT w USA |
| Europol Cyber Defenders | 9-12 | <span class="yes">✓</span> | <span class="no">-</span> | <span class="no">-</span> | <span class="no">-</span> |
| Cyberlekcje 3.0 (MC + NASK) | kl. I-VIII | <span class="no">-</span> | <span class="no">-</span> | <span class="no">-</span> | <span class="no">-</span> |
| Telefon 116 111 (FDDS) | dzieci | n/d | <span class="yes">✓</span> człowiek | <span class="no">-</span> | n/d |
| Roblox: kontrola rodzicielska | rodzice | <span class="yes">✓</span> | tylko „Zgłoś” | <span class="yes">✓</span> | n/d |
| <b>Scamerino Alertinio</b> | <b>9-13</b> | <span class="yes">✓</span> | <span class="yes">✓</span> | <span class="yes">✓</span> | <span class="yes">✓</span> |

</div>

<p class="mt-3 text-sm">
FDDS, NASK i Safer Internet traktujemy jako <b>partnerów</b>: kierujemy dzieci do 116 111, a rodziców do 800 100 100 i CERT (SMS 8080).
</p>

---

<div class="kicker">Wdrożenie</div>

# Bezpieczne dla dziecka, opłacalne dla szkoły

<div class="grid grid-cols-2 gap-6 mt-2">
  <div class="card">
    <b>🔒 Prywatność i prawo</b>
    <ul class="text-base mt-3 leading-relaxed">
      <li>Nauczyciel widzi <b>wyniki ćwiczeń</b>, a nie prywatne zgłoszenia dziecka.</li>
      <li>Konto dziecka na <b>zgodę rodzica</b> (RODO art. 8, poniżej 16 lat).</li>
      <li>Awatar mówi, że jest AI (<b>AI Act art. 50</b>).</li>
      <li>Bez presji i dark patterns. Punkty za umiejętności, nie za liczbę zgłoszeń.</li>
    </ul>
  </div>
  <div class="card">
    <b>🏫 Rynek i model</b>
    <div class="flex gap-6 mt-2">
      <div><div class="stat" style="font-size: 1.9rem">14 tys.</div><div class="stat-label">szkół podstawowych</div></div>
      <div><div class="stat" style="font-size: 1.9rem">~2 mln</div><div class="stat-label">uczniów kl. 3-7 (szacunek)</div></div>
    </div>
    <ul class="text-base mt-3 leading-relaxed">
      <li>Szkoły muszą mieć <b>standardy ochrony małoletnich</b> (ustawa „Kamilka”). Trening z pomiarem pomaga je realizować.</li>
      <li>Darmowe dla dziecka i rodzica. Płaci szkoła, samorząd albo sponsor CSR.</li>
    </ul>
  </div>
</div>

<div class="footer-src">GUS 2024/2025; liczba uczniów kl. 3-7 to szacunek: 3,2 mln / 8 roczników × 5.</div>

---
layout: image-right
image: /scamerino.png
backgroundSize: contain
---

<div class="kicker">Dalej</div>

# Pilotaż w jednej szkole

<ol class="text-base leading-relaxed mt-2">
  <li>Ankieta w 1-2 klasach: kto gra w Roblox i na jakich kontach.</li>
  <li>Trening z grupą kontrolną i testem po 2-4 tygodniach.</li>
  <li>Partner: FDDS, NASK albo program CSR telekomu lub banku.</li>
</ol>

<div class="card mt-6" style="border-color: var(--gold)">
  <div class="text-xl font-bold" style="color: var(--shark-dark)">„Darmowe + link = pytam dorosłego”</div>
  <div class="stat-label">Scamerino przypomina o tym w grze i w prawdziwym życiu.</div>
</div>

<div class="absolute bottom-8 left-12 text-sm" style="color: var(--muted)">
Make No Mistakes Team · HackYeah 2026
</div>
