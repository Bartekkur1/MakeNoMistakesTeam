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

<p class="text-xl leading-snug lead" style="color: var(--ink)">
Cyberpomocnik, który uczy dzieci w&nbsp;wieku <span class="whitespace-nowrap">9-13 lat</span> rozpoznawać oszustwa w&nbsp;grach i&nbsp;pomaga, gdy podejrzana wiadomość przyjdzie naprawdę.
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
  <div class="card flex flex-col">
    <div class="stat">4,72 mln</div>
    <div class="stat-label">użytkowników Robloxa w&nbsp;Polsce. To&nbsp;lider wśród gier.</div>
    <div class="src">Mediapanel, VIII 2025</div>
  </div>
  <div class="card flex flex-col">
    <div class="stat red">28%</div>
    <div class="stat-label">polskich nastolatków padło ofiarą cyberataku. <b>12%</b> doświadczyło włamania na konto, <b>8%</b> kradzieży przedmiotów w&nbsp;grach.</div>
    <div class="src">NASK „Nastolatki” 2024, N = 3665</div>
  </div>
  <div class="card flex flex-col">
    <div class="stat amber">#2</div>
    <div class="stat-label">Pod Robloxa oszuści podszywają się najczęściej zaraz po Microsofcie (12,3% prób phishingu).</div>
    <div class="src">NordVPN, Consumer Cybersecurity Report 2026</div>
  </div>
</div>

<div class="card compact mt-4 flex flex-col">
  <div class="flex items-center gap-4">
    <div class="stat red" style="font-size: 1.8rem">610 tys.</div>
    <div class="stat-label" style="margin: 0">kont Roblox przejętych w&nbsp;ciągu 4 miesięcy przez malware udające narzędzia do gry.</div>
  </div>
  <div class="src">CERT Orange Polska, 09.2026</div>
</div>

<!--
Liczby tylko z pierwotnych źródeł. W UK w Roblox gra 51% dzieci w wieku 8-14 lat (Ofcom 2026), dla Polski brak danych o wieku graczy.
-->

---

<div class="kicker">Luka</div>

# Nikt nie stoi obok dziecka w chwili ataku

<div class="grid grid-cols-3 gap-5 mt-4">
  <div class="card flex flex-col">
    <div class="pill amber self-start">Rodzice nie widzą</div>
    <div class="stat mt-3">57% → 21%</div>
    <div class="stat-label">57% rodziców twierdzi, że monitoruje dziecko w&nbsp;sieci. Potwierdza to 21% nastolatków.</div>
    <div class="src">NASK „Nastolatki” 2024</div>
  </div>
  <div class="card flex flex-col">
    <div class="pill amber self-start">Dzieci milczą</div>
    <div class="stat mt-3">13% vs 28%</div>
    <div class="stat-label">Rodzice wiedzą o&nbsp;cyberataku na dziecko w&nbsp;13% przypadków, a&nbsp;doświadczyło go 28% nastolatków.</div>
    <div class="src">NASK „Nastolatki” 2024</div>
  </div>
  <div class="card flex flex-col">
    <div class="pill amber self-start">Efekt szybko mija</div>
    <div class="stat mt-3">4 tygodnie</div>
    <div class="stat-label">Po treningu dzieci radziły sobie o&nbsp;14% lepiej. Po miesiącu efekt zniknął.</div>
    <div class="src">Lastdrager i in., SOUPS 2017 (NL)</div>
  </div>
</div>

<p class="mt-6 text-lg">
Lekcja raz w&nbsp;roku nie wystarczy. Pomoc musi być <b>pod ręką wtedy, gdy przychodzi wiadomość</b>, a&nbsp;trening trzeba powtarzać.
</p>

<!--
Tylko 5 z 57 badań nad grami o cyberbezpieczeństwie dla dzieci miało grupę kontrolną (Damenu 2025). Wracamy do tego na slajdzie o pomiarze.
-->

---

<div class="kicker">Rozwiązanie</div>

# Jedna postać, trzy miejsca

<div class="grid grid-cols-[1fr_300px] gap-8 items-start">
  <div class="flex flex-col gap-3">
    <div class="card compact">
      <b>🎮 Trening w Roblox</b>
      <div class="stat-label">Misja ze Scamerino: „darmowe Robuxy”, fałszywy admin i&nbsp;wymiana „ty pierwszy”.</div>
    </div>
    <div class="card compact">
      <b>🦈 Pomoc w prawdziwej sytuacji</b>
      <div class="stat-label">Dziecko wkleja wiadomość z&nbsp;gry, Discorda, SMS-a lub maila. Scamerino zadaje pytania i&nbsp;podpowiada, co zrobić dalej.</div>
    </div>
    <div class="card compact">
      <b>🛡️ Wsparcie opiekuna</b>
      <div class="stat-label">Dziecko przekazuje sprawę rodzicowi i&nbsp;widzi, co mu udostępnia. Rodzic odpowiada w&nbsp;panelu.</div>
    </div>
  </div>
  <img src="/scamerino.png" loading="eager" class="w-[300px] h-[345px] object-cover object-top rounded-3xl" style="box-shadow: var(--shadow)" />
</div>

<!--
Wyróżnik: ta sama postać w treningu i w codziennej sytuacji. Sama gra na Robloxie nie jest nowością (Europol Cyber Defenders).
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
    <div class="step"><div class="num">1</div><b class="text-base">Wiadomość</b><div class="text-sm">treść, link albo zrzut ekranu</div></div>
    <div class="step"><div class="num">2</div><b class="text-base">Pytania</b><div class="text-sm">„Znasz tę osobę?” „Prosi o kod?”</div></div>
    <div class="step"><div class="num">3</div><b class="text-base">Sygnały</b><div class="text-sm">co jest podejrzane i dlaczego</div></div>
    <div class="step"><div class="num" style="background: var(--amber)">4</div><b class="text-base">Następny krok</b><div class="text-sm">sprawdź w&nbsp;aplikacji, przerwij rozmowę, zgłoś, zapytaj opiekuna</div></div>
  </div>
</div>

<div class="card mt-5 flex items-center gap-4" style="border-color: var(--gold)">
  <div class="text-2xl">💡</div>
  <div class="body-text"><b>„Darmowe + link = pytam dorosłego”.</b> Scamerino nie mówi, że coś jest bezpieczne. Uczy sprawdzać i&nbsp;prosić o&nbsp;pomoc, a&nbsp;od początku mówi wprost, że jest AI.</div>
</div>

<!--
Hasło zapożyczone od CERT Orange Polska. AI Act, art. 50: awatar informuje, że jest AI.
-->

---

<div class="kicker">Demo</div>

# Co zbudowaliśmy w 24 godziny

<div class="grid grid-cols-3 gap-5 mt-2">
  <div class="card compact">
    <div class="video-ph">
      <div class="play">▶&#xFE0E;</div>
      <div>[film - wkrótce]</div>
    </div>
    <div class="demo-title">Misja w Roblox</div>
  </div>
  <div class="card compact">
    <div class="video-ph">
      <div class="play">▶&#xFE0E;</div>
      <div>[film - wkrótce]</div>
    </div>
    <div class="demo-title">Pomocnik: rozszerzenie i&nbsp;strona</div>
  </div>
  <div class="card compact">
    <div class="video-ph">
      <div class="play">▶&#xFE0E;</div>
      <div>[film - wkrótce]</div>
    </div>
    <div class="demo-title">Panel opiekuna i&nbsp;wyniki klasy</div>
  </div>
</div>

<p class="mt-4 text-sm" style="color: var(--muted)">
W&nbsp;demo używamy wyłącznie fikcyjnych wiadomości i&nbsp;danych. Link do repozytorium i&nbsp;demo: <b>[uzupełnić]</b>
</p>

<!--
TODO: podmienić placeholdery na filmy (element video wewnątrz .video-ph, w-full h-full object-cover rounded-xl), gdy będą nagrane.
-->

---

<div class="kicker">Pomiar</div>

# Mało kto sprawdza, czy to działa

<div class="grid grid-cols-2 gap-6 mt-2">
  <div class="card flex flex-col">
    <div class="stat red" style="font-size: 4.2rem">5 z 57</div>
    <div class="stat-label text-lg">badań nad grami o&nbsp;cyberbezpieczeństwie dla dzieci miało grupę kontrolną.</div>
    <p class="text-sm mt-3">Z&nbsp;porównywanych programów badanie z&nbsp;grupą kontrolną ma tylko Interlandia (Google), i&nbsp;to w&nbsp;USA. Polskie programy nie publikują takich wyników.</p>
    <div class="src">Damenu i in., przegląd systematyczny, 2025</div>
  </div>
  <div class="card" style="border-color: var(--gold)">
    <b>Nasz protokół</b>
    <div class="text-sm" style="color: var(--muted)">mierzymy, czy dziecko radzi sobie samo</div>
    <ul class="text-base mt-3 leading-relaxed">
      <li>porównanie z&nbsp;<span class="hl">grupą kontrolną</span> (zwykła lekcja)</li>
      <li>test <b>przed i&nbsp;po</b> treningu, na nowych przykładach i&nbsp;<b>bez pomocnika</b></li>
      <li>liczymy trafne reakcje <b>i</b>&nbsp;fałszywe alarmy (w&nbsp;teście są też uczciwe oferty)</li>
      <li><b>powtórny test po <span class="whitespace-nowrap">2-4 tygodniach</span></b></li>
    </ul>
  </div>
</div>

<p class="mt-5 text-sm" style="color: var(--muted)">
Demo pokazuje, jak mierzymy efekt. Trwałą skuteczność potwierdzi dopiero pilotaż w&nbsp;szkole.
</p>

---

<div class="kicker">Pozycjonowanie</div>

# Uzupełniamy to, co już istnieje

<div class="grid grid-cols-3 gap-4 mt-2">
  <div class="card flex flex-col">
    <div class="pill self-start">Przed: edukacja</div>
    <ul class="labels text-sm mt-3">
      <li>Sieciaki.pl (FDDS), 7+</li>
      <li>Interlandia / Asy Internetu (Google), <span class="whitespace-nowrap">kl. 4-8</span></li>
      <li>Europol Cyber Defenders, <span class="whitespace-nowrap">9-12 lat</span>, w&nbsp;Roblox</li>
      <li>Cyberlekcje 3.0 (MC&nbsp;+&nbsp;NASK), <span class="whitespace-nowrap">kl. I-VIII</span></li>
    </ul>
    <div class="text-xs mt-auto pt-3" style="color: var(--muted)">Po lekcji dziecko zostaje z&nbsp;wiadomością samo.</div>
  </div>
  <div class="card flex flex-col" style="border: 2px solid var(--shark); background: rgba(15, 98, 219, 0.05)">
    <div class="pill blue self-start">W chwili wiadomości</div>
    <div class="font-bold mt-2" style="color: var(--shark-dark)">Scamerino Alertinio, 9-13 lat</div>
    <div class="text-xs" style="color: var(--muted)">Tylko my łączymy:</div>
    <ul class="labels checks text-sm mt-2">
      <li><span class="yes">✓</span> trening w&nbsp;Roblox</li>
      <li><span class="yes">✓</span> pomoc przy prawdziwej wiadomości</li>
      <li><span class="yes">✓</span> wsparcie opiekuna</li>
      <li><span class="yes">✓</span> pomiar z&nbsp;grupą kontrolną</li>
    </ul>
  </div>
  <div class="card flex flex-col">
    <div class="pill self-start">Po fakcie: zgłoszenie</div>
    <ul class="labels text-sm mt-3">
      <li>Telefon 116&nbsp;111 (FDDS): rozmowa z&nbsp;człowiekiem</li>
      <li>CERT: SMS 8080</li>
      <li>przycisk „Zgłoś” w&nbsp;Roblox</li>
    </ul>
    <div class="text-xs mt-auto pt-3" style="color: var(--muted)">Działa, gdy dziecko samo rozpozna problem i&nbsp;poprosi o&nbsp;pomoc.</div>
  </div>
</div>

<p class="mt-4 text-sm">
Nie zastępujemy tych służb, tylko do nich kierujemy: dzieci do 116&nbsp;111, rodziców do 800&nbsp;100&nbsp;100 i&nbsp;do CERT (SMS 8080). <b>Celem pilotażu jest partnerstwo z&nbsp;FDDS lub NASK.</b>
</p>

---

<div class="kicker">Wdrożenie</div>

# Bezpieczne dla dziecka, opłacalne dla szkoły

<div class="grid grid-cols-2 gap-6 mt-2">
  <div class="card">
    <b>🔒 Prywatność i prawo</b>
    <ul class="text-base mt-3 leading-relaxed">
      <li>Nauczyciel widzi <b>wyniki ćwiczeń</b>, a&nbsp;nie prywatne zgłoszenia dziecka.</li>
      <li>Konto dziecka poniżej 16 lat wymaga <b>zgody rodzica</b> (art. 8 RODO).</li>
      <li>Awatar informuje, że jest AI (<b>art. 50 AI Act</b>).</li>
      <li>Bez presji i&nbsp;dark patterns. Punkty za umiejętności, a&nbsp;nie za liczbę zgłoszeń.</li>
    </ul>
  </div>
  <div class="card">
    <b>🏫 Rynek i model</b>
    <div class="flex gap-6 mt-2">
      <div><div class="stat" style="font-size: 1.9rem">14 tys.</div><div class="stat-label">szkół podstawowych</div></div>
      <div><div class="stat" style="font-size: 1.9rem">~2 mln</div><div class="stat-label">uczniów kl. 3-7 (szacunek)</div></div>
    </div>
    <ul class="text-base mt-3 leading-relaxed">
      <li>Ustawa „Kamilka” wymaga od szkół <b>standardów ochrony małoletnich</b>. Trening z&nbsp;pomiarem pomaga je wdrażać.</li>
      <li>Bezpłatne dla dziecka i&nbsp;rodzica. Koszt pokrywa szkoła, samorząd albo sponsor w&nbsp;ramach CSR.</li>
    </ul>
  </div>
</div>

<div class="footer-src">GUS 2024/2025. Liczba uczniów kl. 3-7 to szacunek: 3,2 mln / 8 roczników × 5.</div>

---
layout: image-right
image: /scamerino.png
backgroundSize: contain
---

<div class="kicker">Dalej</div>

# Pilotaż w jednej szkole

<ol class="labels text-base leading-relaxed mt-2">
  <li>Ankieta w&nbsp;<span class="whitespace-nowrap">1-2 klasach</span>: kto gra w&nbsp;Roblox i&nbsp;na jakich kontach.</li>
  <li>Trening z&nbsp;grupą kontrolną i&nbsp;powtórnym testem po <span class="whitespace-nowrap">2-4 tygodniach</span>.</li>
  <li>Szukamy partnera: FDDS, NASK albo program CSR operatora lub banku.</li>
</ol>

<div class="card mt-6" style="border-color: var(--gold)">
  <div class="text-xl font-bold" style="color: var(--shark-dark)">„Darmowe + link = pytam dorosłego”</div>
  <div class="stat-label">Scamerino przypomina o&nbsp;tym w&nbsp;grze i&nbsp;poza nią.</div>
</div>

<div class="absolute bottom-8 left-12 text-sm" style="color: var(--muted)">
Make No Mistakes Team · HackYeah 2026
</div>
