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
Cyberpomocnik, który uczy dzieci 9-13 lat rozpoznawać oszustwa w grach i pomaga, gdy podejrzana wiadomość pojawi się na&shy;prawdę.
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
    <div class="stat-label">użytkowników Robloxa w Pol&shy;sce. To lider gier w PL.</div>
    <div class="src">Mediapanel, VIII 2025</div>
  </div>
  <div class="card flex flex-col">
    <div class="stat red">28%</div>
    <div class="stat-label">polskich nastolatków padło ofia&shy;rą cyber&shy;ataku: <b>12%</b> wła&shy;manie na konto, <b>8%</b> kra&shy;dzież przed&shy;miotów w grach.</div>
    <div class="src">NASK „Nastolatki” 2024, N = 3665</div>
  </div>
  <div class="card flex flex-col">
    <div class="stat amber">#2</div>
    <div class="stat-label">Roblox to druga najczęściej pod&shy;szy&shy;wana marka w phi&shy;shingu (12,3% prób), zaraz po Micro&shy;sofcie.</div>
    <div class="src">NordVPN, Consumer Cybersecurity Report 2026</div>
  </div>
</div>

<div class="card compact mt-4 flex flex-col">
  <div class="flex items-center gap-4">
    <div class="stat red" style="font-size: 1.8rem">610 tys.</div>
    <div class="stat-label" style="margin: 0">kont Roblox przejętych przez malware udające narzędzia do gry w ciągu 4 miesięcy.</div>
  </div>
  <div class="src">CERT Orange Polska, 09.2026</div>
</div>

<!--
Liczby tylko z pierwotnych źródeł. 51% dzieci 8-14 w UK gra w Roblox (Ofcom 2026), dla PL brak danych o wieku.
-->

---

<div class="kicker">Luka</div>

# Nikt nie stoi obok dziecka w chwili ataku

<div class="grid grid-cols-3 gap-5 mt-4">
  <div class="card flex flex-col">
    <div class="pill amber self-start">Rodzice nie widzą</div>
    <div class="stat mt-3">57% → 21%</div>
    <div class="stat-label">57% rodziców mówi, że moni&shy;toruje dziecko w sieci. Potwier&shy;dza to 21% nasto&shy;latków.</div>
    <div class="src">NASK „Nastolatki” 2024</div>
  </div>
  <div class="card flex flex-col">
    <div class="pill amber self-start">Dzieci milczą</div>
    <div class="stat mt-3">13% vs 28%</div>
    <div class="stat-label">Rodzice wiedzą o cyberataku na dziecko w 13% przypadków, a doświadczyło go 28%.</div>
    <div class="src">NASK „Nastolatki” 2024</div>
  </div>
  <div class="card flex flex-col">
    <div class="pill amber self-start">Szkolenie zanika</div>
    <div class="stat mt-3">4 tygodnie</div>
    <div class="stat-label">Po treningu dzieci były o 14% lep&shy;sze. Po mie&shy;siącu efekt znik&shy;nął.</div>
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
      <div class="stat-label">Misja ze Scamerino: „darmowe Robuxy”, fałszywy admin, wymiana „ty pierw&shy;szy”.</div>
    </div>
    <div class="card compact">
      <b>🦈 Pomoc w realnej sytuacji</b>
      <div class="stat-label">Dziecko wkleja wiadomość z gry, Discorda, SMS-a lub maila. Scamerino pyta i proponuje następny krok.</div>
    </div>
    <div class="card compact">
      <b>🛡️ Opiekun w pętli</b>
      <div class="stat-label">Dziecko przekazuje sprawę rodzicowi i widzi, co udo&shy;stępnia. Rodzic odpo&shy;wiada w panelu.</div>
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
  <div class="body-text"><b>„Darmowe + link = pytam dorosłego”</b>. Scamerino nie mówi „to jest bezpieczne”. Uczy spraw&shy;dzać i pro&shy;sić o pomoc. Na początku mówi też wprost, że jest AI.</div>
</div>

<!--
Hasło za CERT Orange Polska. AI Act art. 50 - awatar informuje, że jest AI.
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
    <div class="demo-title">Misja Roblox</div>
  </div>
  <div class="card compact">
    <div class="video-ph">
      <div class="play">▶&#xFE0E;</div>
      <div>[film - wkrótce]</div>
    </div>
    <div class="demo-title">Pomocnik: rozszerzenie i strona</div>
  </div>
  <div class="card compact">
    <div class="video-ph">
      <div class="play">▶&#xFE0E;</div>
      <div>[film - wkrótce]</div>
    </div>
    <div class="demo-title">Panel opiekuna i wyniki klasy</div>
  </div>
</div>

<p class="mt-4 text-sm" style="color: var(--muted)">
W demo używamy wyłącznie fikcyjnych wiadomości i danych. Link do repozytorium i demo: <b>[uzupełnić]</b>
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
    <div class="stat-label text-lg">badań gier o cyberbezpieczeństwie dla dzieci miało grupę kontrolną.</div>
    <p class="text-sm mt-3">Z porównywanych programów tylko Interlandia (Google) ma badanie z grupą kontrolną, w USA. Polskie programy nie publikują takich wyników.</p>
    <div class="src">Damenu i in., przegląd systematyczny, 2025</div>
  </div>
  <div class="card" style="border-color: var(--gold)">
    <b>Nasz protokół</b>
    <div class="text-sm" style="color: var(--muted)">mierzymy, czy dziecko radzi sobie samo</div>
    <ul class="text-base mt-3 leading-relaxed">
      <li><span class="hl">grupa kontrolna</span> w pilotażu: porównujemy ze zwy&shy;kłą lekcją</li>
      <li>test <b>przed i po</b> treningu, na nowych przykładach i <b>bez pomocnika</b></li>
      <li>liczymy trafne reakcje <b>i</b> niepotrzebne alarmy (ucz&shy;ciwe oferty też są w teście)</li>
      <li><b>powtórny test po 2-4 tygodniach</b></li>
    </ul>
  </div>
</div>

<p class="mt-5 text-sm" style="color: var(--muted)">
Demo pokazuje mechanizm pomiaru. Trwałą skuteczność potwierdzi dopiero pilotaż w szkole.
</p>

---

<div class="kicker">Pozycjonowanie</div>

# Uzupełniamy to, co już istnieje

<div class="grid grid-cols-3 gap-4 mt-2">
  <div class="card flex flex-col">
    <div class="pill self-start">Przed: uczą</div>
    <ul class="labels text-sm mt-3">
      <li>Sieciaki.pl (FDDS), 7+</li>
      <li>Interlandia / Asy Internetu (Google), kl. 4-8</li>
      <li>Europol Cyber Defenders, 9-12, w Roblox</li>
      <li>Cyberlekcje 3.0 (MC + NASK), <span class="whitespace-nowrap">kl. I-VIII</span></li>
    </ul>
    <div class="text-xs mt-auto pt-3" style="color: var(--muted)">Lekcja, a potem dziecko zostaje samo z wiadomością.</div>
  </div>
  <div class="card flex flex-col" style="border: 2px solid var(--shark); background: rgba(15, 98, 219, 0.05)">
    <div class="pill blue self-start">W chwili wiadomości</div>
    <div class="font-bold mt-2" style="color: var(--shark-dark)">Scamerino Alertinio, 9-13 lat</div>
    <div class="text-xs" style="color: var(--muted)">Tylko my łączymy:</div>
    <ul class="labels checks text-sm mt-2">
      <li><span class="yes">✓</span> trening w Roblox</li>
      <li><span class="yes">✓</span> pomoc przy prawdziwej wiadomości</li>
      <li><span class="yes">✓</span> opiekun w pętli</li>
      <li><span class="yes">✓</span> pomiar z grupą kontrolną</li>
    </ul>
  </div>
  <div class="card flex flex-col">
    <div class="pill self-start">Po fakcie: zgłoszenie</div>
    <ul class="labels text-sm mt-3">
      <li>Telefon 116 111 (FDDS): rozmowa z człowiekiem</li>
      <li>CERT: SMS 8080</li>
      <li>przycisk „Zgłoś” w Roblox</li>
    </ul>
    <div class="text-xs mt-auto pt-3" style="color: var(--muted)">Działa, gdy dziecko samo rozpozna problem i się zgłosi.</div>
  </div>
</div>

<p class="mt-4 text-sm">
Nie zastępujemy ich - kierujemy do nich: dzieci do 116 111, rodziców do 800 100 100 i CERT (SMS 8080). <b>Partnerstwo z FDDS / NASK to cel pilotażu.</b>
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
      <li>Szkoły muszą mieć <b>standardy ochrony mało&shy;letnich</b> (ustawa „Kamilka”). Trening z po&shy;miarem pomaga je realizować.</li>
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
  <li>Trening z grupą kontrolną i testem po 2-4 tygo&shy;dniach.</li>
  <li>Partner (cel): FDDS, NASK albo program CSR tele&shy;komu lub banku.</li>
</ol>

<div class="card mt-6" style="border-color: var(--gold)">
  <div class="text-xl font-bold" style="color: var(--shark-dark)">„Darmowe + link = pytam dorosłego”</div>
  <div class="stat-label">Scamerino przypomina o tym w grze i w praw&shy;dziwym życiu.</div>
</div>

<div class="absolute bottom-8 left-12 text-sm" style="color: var(--muted)">
Make No Mistakes Team · HackYeah 2026
</div>
