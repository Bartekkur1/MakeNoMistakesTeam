#!/usr/bin/env python3
"""Kontrola pakietu warsztatowego BezpiecznaAura (warsztaty.html + PDF).

Użycie (z katalogu głównego repozytorium):
    python projects/presentation/warsztaty/check_pakiet.py [--lessons N] [--full]

Każdy błąd: linia "FAIL: <id> <opis>". Bez błędów ostatnia linia:
"OK: <strony> stron, <sekcje> sekcji, lekcje: <N>". Kod wyjścia 1 przy błędzie.
Zależności: biblioteka standardowa + pypdf.
"""
import argparse
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

from pypdf import PdfReader

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # pragma: no cover
    pass

HERE = Path(__file__).resolve().parent
VOID = {"img", "br", "meta", "link", "input", "hr", "source", "wbr", "col", "area", "base", "embed", "param", "track"}
SKIP_TEXT = {"style", "script", "head", "title"}


# ---------------------------------------------------------------- normalizacja
def norm(s):
    """NFKC + usunięcie wszystkich białych znaków (do porównań z tekstem PDF)."""
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", s or ""))


def normcf(s):
    return norm(s).casefold()


def htxt(s):
    """Tekst HTML do porównań fraz: NFKC, zwinięte spacje, casefold."""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", s or "")).strip().casefold()


# ---------------------------------------------------------------- drzewo HTML
class Node:
    __slots__ = ("tag", "attrs", "classes", "children", "parent", "texts")

    def __init__(self, tag, attrs, parent):
        self.tag = tag
        self.attrs = dict(attrs)
        self.classes = (self.attrs.get("class") or "").split()
        self.children = []
        self.parent = parent
        self.texts = []  # list of str and Node in document order

    def has(self, cls):
        return cls in self.classes

    def iter(self):
        yield self
        for c in self.children:
            yield from c.iter()

    def find_all(self, tag=None, cls=None):
        out = []
        for n in self.iter():
            if n is self:
                continue
            if tag is not None and n.tag != tag:
                continue
            if cls is not None and cls not in n.classes:
                continue
            out.append(n)
        return out

    def text(self):
        if self.tag in SKIP_TEXT:
            return ""
        parts = []
        for t in self.texts:
            parts.append(t if isinstance(t, str) else t.text())
        return " ".join(parts)

    def ancestor(self, pred):
        p = self.parent
        while p is not None:
            if pred(p):
                return p
            p = p.parent
        return None


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [], None)
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        parent = self.stack[-1]
        node = Node(tag, attrs, parent)
        parent.children.append(node)
        parent.texts.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        parent = self.stack[-1]
        node = Node(tag, attrs, parent)
        parent.children.append(node)
        parent.texts.append(node)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].texts.append(data)


# ---------------------------------------------------------------- PDF helpers
def page_dims(page):
    mb = page.mediabox
    w, h = float(mb.width), float(mb.height)
    rot = int(page.get("/Rotate", 0) or 0) % 180
    if rot == 90:
        w, h = h, w
    return w, h


def font_names(resources, seen=None):
    names = []
    if resources is None:
        return names
    if seen is None:
        seen = set()
    try:
        resources = resources.get_object()
    except Exception:
        pass
    fonts = resources.get("/Font") if hasattr(resources, "get") else None
    if fonts is not None:
        fonts = fonts.get_object()
        for _, ref in fonts.items():
            f = ref.get_object()
            bf = f.get("/BaseFont")
            if bf:
                names.append(str(bf))
            fd = f.get("/FontDescriptor")
            if fd is not None:
                fn = fd.get_object().get("/FontName")
                if fn:
                    names.append(str(fn))
            # Type3: zasoby glifów
            r3 = f.get("/Resources")
            if r3 is not None and id(r3) not in seen:
                seen.add(id(r3))
                names.extend(font_names(r3, seen))
    xo = resources.get("/XObject") if hasattr(resources, "get") else None
    if xo is not None:
        for _, ref in xo.get_object().items():
            x = ref.get_object()
            r = x.get("/Resources")
            if r is not None and id(x) not in seen:
                seen.add(id(x))
                names.extend(font_names(r, seen))
    return names


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Kontrola pakietu warsztatowego")
    ap.add_argument("--lessons", type=int, default=0)
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--html", default=str(HERE / "warsztaty.html"))
    ap.add_argument("--pdf", default=str(HERE / "warsztaty-bezpieczna-aura.pdf"))
    args = ap.parse_args()

    html_path = Path(args.html).resolve()
    pdf_path = Path(args.pdf).resolve()
    fails = []

    def fail(tid, msg):
        fails.append(f"FAIL: {tid} {msg}")

    if not html_path.is_file():
        print(f"FAIL: S0 brak pliku HTML {html_path}")
        return 1

    tb = TreeBuilder()
    tb.feed(html_path.read_text(encoding="utf-8"))
    tb.close()
    root = tb.root

    sections = [n for n in root.find_all("section") if n.has("page")]
    nsec = len(sections)

    # S1
    if not pdf_path.is_file():
        fail("S1", f"brak pliku PDF {pdf_path}")
        for line in fails:
            print(line)
        return 1
    if pdf_path.stat().st_mtime + 1e-6 < html_path.stat().st_mtime:
        fail("S1", "PDF jest starszy niż HTML (uruchom render-pdf.sh)")

    reader = PdfReader(str(pdf_path))
    npages = len(reader.pages)
    page_text = [(p.extract_text() or "") for p in reader.pages]
    page_n = [norm(t) for t in page_text]
    page_ncf = [normcf(t) for t in page_text]
    all_ncf = "".join(page_ncf)

    # S2
    if npages != nsec:
        fail("S2", f"liczba stron PDF ({npages}) != liczba section.page ({nsec}); coś się przelewa albo brakuje strony")

    # S3
    planszas = [s for s in sections if s.has("plansza")]
    pl_pages = [i for i, t in enumerate(page_n) if re.search(r"PLANSZA\d\.\d", t)]
    if len(planszas) < 1:
        fail("S3", "brak section.plansza")
    if len(pl_pages) != len(planszas):
        fail("S3", f"stron z 'PLANSZA N.M' w PDF: {len(pl_pages)} ({[i + 1 for i in pl_pages]}), section.plansza: {len(planszas)}")
    for i, p in enumerate(reader.pages):
        w, h = page_dims(p)
        if i in pl_pages and not w > h:
            fail("S3", f"strona {i + 1} (plansza) nie jest pozioma ({w:.0f}x{h:.0f})")
        if i not in pl_pages and not h > w:
            fail("S3", f"strona {i + 1} nie jest pionowa ({w:.0f}x{h:.0f})")

    # S4
    for img in root.find_all("img"):
        src = img.attrs.get("src") or ""
        if not src or not (html_path.parent / src).resolve().is_file():
            fail("S4", f"img src nie istnieje: {src!r}")
    mocks = root.find_all(cls="mock")
    for m in mocks:
        if m.find_all("img"):
            fail("S4", "img wewnątrz .mock (makiety rysujemy w CSS)")

    # S5
    if root.find_all("a"):
        fail("S5", f"znaleziono {len(root.find_all('a'))} element(y) a (pakiet nie może mieć linków)")

    # S6
    def section_of(n):
        return n.ancestor(lambda p: p.tag == "section" and p.has("page"))

    for m in mocks:
        dl, de = m.attrs.get("data-lesson"), m.attrs.get("data-example")
        t = htxt(m.text())
        label = (m.attrs.get("class") or "") + " " + t[:40]
        if not dl or de not in ("scam", "honest"):
            fail("S6", f".mock bez data-lesson albo z błędnym data-example: {label!r}")
        if "przykład fikcyjny" not in t:
            fail("S6", f".mock bez etykiety 'przykład fikcyjny': {label!r}")
        if "http" in t or "www." in t:
            fail("S6", f".mock zawiera http lub www.: {label!r}")
        sec = section_of(m)
        if sec is None or sec.attrs.get("data-lesson") != dl:
            fail("S6", f".mock data-lesson={dl} nie pasuje do sekcji ({sec.attrs.get('data-lesson') if sec else None}): {label!r}")
    for d in root.find_all(cls="dcard"):
        if not d.attrs.get("data-lesson") or d.attrs.get("data-example") not in ("scam", "honest"):
            fail("S6", f".dcard bez data-lesson albo z błędnym data-example: {htxt(d.text())[:40]!r}")

    # S7
    dom_re = re.compile(r"^(?:[A-Za-z0-9._-]+@)?(?:[A-Za-z0-9-]+\[\.\])+example(?:/[^\s]*)?$")
    for d in root.find_all("span", cls="dom"):
        t = unicodedata.normalize("NFKC", d.text()).strip()
        if not dom_re.match(t):
            fail("S7", f"span.dom nie pasuje do wzorca etykieta[.]example: {t!r}")

    # S8
    for ul in root.find_all("ul", cls="toc"):
        for li in [c for c in ul.children if c.tag == "li"]:
            find = li.attrs.get("data-find")
            pgs = li.find_all("span", cls="pg")
            if not find or not pgs:
                fail("S8", f"wpis spisu bez data-find albo span.pg: {htxt(li.text())!r}")
                continue
            m_ = re.search(r"\d+", pgs[0].text())
            if not m_:
                fail("S8", f"span.pg bez liczby: {find!r}")
                continue
            pg = int(m_.group())
            needle = normcf(find)
            where = [i + 1 for i, t in enumerate(page_ncf) if needle in t]
            if not (1 <= pg <= npages) or needle not in page_ncf[pg - 1]:
                fail("S8", f"spis: {find!r} -> str. {pg}, ale tekst jest na stronach: {where}")

    # S9
    names = font_names(reader.pages[0].get("/Resources")) if npages else []
    if not any("nunito" in n.casefold() for n in names):
        fail("S9", f"na stronie 1 brak osadzonego fontu Nunito (fonty: {sorted(set(names))[:6]})")

    # S10
    p1 = page_ncf[0] if npages else ""
    for needle in ("klasy4-8", "oszustwoczynie?"):
        if needle not in p1:
            fail("S10", f"strona 1 nie zawiera {needle!r}")

    # S11: brak globalnego zmniejszenia przez Edge. Gdy jakaś strona przelewa się
    # (np. za wysoka plansza), Edge skaluje CAŁY dokument w dół, a S2 tego nie widzi.
    # Edge zaczyna strumień od dwóch macierzy cm; ich iloczyn skali to 0.75 (1 px CSS = 0.75 pt).
    cm_re = re.compile(rb"([-\d.]+) [-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ cm")
    for i, p in enumerate(reader.pages):
        try:
            data = p.get_contents().get_data()[:400]
        except Exception:
            continue
        scales = [abs(float(x)) for x in cm_re.findall(data)[:2]]
        if len(scales) == 2:
            prod = scales[0] * scales[1]
            if abs(prod - 0.75) > 0.01:
                fail("S11", f"strona {i + 1}: Edge zmniejszył treść (skala {prod / 0.75:.2f}); coś jest za szerokie albo za wysokie")
                break

    # ---------------------------------------------------------- lekcje
    N = args.lessons
    if N > 0:
        for n in root.iter():
            dl = n.attrs.get("data-lesson")
            if dl is not None:
                try:
                    if int(dl) > N:
                        fail("L0", f"element <{n.tag} class={n.attrs.get('class')!r}> ma data-lesson={dl} > {N}")
                except ValueError:
                    fail("L0", f"nieliczbowe data-lesson={dl!r}")

    for L in range(1, N + 1):
        ls = [s for s in sections if s.attrs.get("data-lesson") == str(L)]

        def cnt(*classes):
            return sum(1 for s in ls if all(s.has(c) for c in classes))

        # L1
        want = {("konspekt",): 2, ("klucz",): 1, ("plansza",): 4, ("ws", "ws--detektyw"): 1,
                ("ws", "ws--karty"): 1, ("ws", "ws--quiz"): 1, ("ws", "ws--do-domu"): 1}
        if L >= 2:
            want[("ws", "ws--scenka")] = 1
        for k, v in want.items():
            if cnt(*k) != v:
                fail("L1", f"lekcja {L}: sekcji {'.'.join(k)} jest {cnt(*k)}, oczekiwano {v}")

        # L2
        pls = [s for s in ls if s.has("plansza")]
        with2 = [s for s in pls if len(s.find_all(cls="mock")) == 2]
        with0 = [s for s in pls if len(s.find_all(cls="mock")) == 0]
        if len(with2) != 3 or len(with0) != 1:
            fail("L2", f"lekcja {L}: plansze z 2 makietami: {len(with2)} (oczekiwano 3), bez makiet: {len(with0)} (oczekiwano 1)")
        for s in with2:
            h = sum(1 for m in s.find_all(cls="mock") if m.attrs.get("data-example") == "honest")
            if h > 1:
                fail("L2", f"lekcja {L}: plansza ma {h} uczciwe makiety (max 1)")

        # L3
        for s in ls:
            if s.has("ws--detektyw") and len(s.find_all(cls="mock")) != 6:
                fail("L3", f"lekcja {L}: ws--detektyw ma {len(s.find_all(cls='mock'))} makiet (oczekiwano 6)")
            if s.has("ws--karty") and len(s.find_all(cls="dcard")) != 6:
                fail("L3", f"lekcja {L}: ws--karty ma {len(s.find_all(cls='dcard'))} kart (oczekiwano 6)")
            if s.has("ws--quiz"):
                nq = len(s.find_all(cls="q"))
                if not 3 <= nq <= 5:
                    fail("L3", f"lekcja {L}: quiz ma {nq} pytań (oczekiwano 3-5)")
                if "bez ocen" not in htxt(s.text()):
                    fail("L3", f"lekcja {L}: quiz bez napisu 'bez ocen'")

        # L4
        ex = []
        for s in ls:
            ex += s.find_all(cls="mock") + s.find_all(cls="dcard")
        hon = sum(1 for e in ex if e.attrs.get("data-example") == "honest")
        share = hon / len(ex) if ex else 0
        if not (0.25 <= share <= 0.42) or hon < 3:
            fail("L4", f"lekcja {L}: uczciwych {hon}/{len(ex)} = {share:.2f} (oczekiwano 0,25-0,42 i >= 3)")

        # L5
        ks = [s for s in ls if s.has("konspekt")]
        for c in ("lesson-head", "warto-wiedziec", "cele", "cele-ucznia", "umowa", "materialy",
                  "przebieg", "ramka-ujawnienie", "uwagi-spe", "do-domu-ref"):
            if c == "przebieg":
                k = sum(len(s.find_all("table", cls="przebieg")) for s in ks)
            else:
                k = sum(len(s.find_all(cls=c)) for s in ks)
            if k != 1:
                fail("L5", f"lekcja {L}: konspekt ma {k} elementów .{c} (oczekiwano 1)")

        # L6
        tot = 0
        for s in ks:
            for t in s.find_all("table", cls="przebieg"):
                for td in t.find_all("td", cls="min"):
                    m_ = re.search(r"\d+", td.text())
                    if m_:
                        tot += int(m_.group())
                    else:
                        fail("L6", f"lekcja {L}: td.min bez liczby")
        if tot != 45:
            fail("L6", f"lekcja {L}: suma minut w przebiegu = {tot} (oczekiwano 45)")

        # L7
        rj = " ".join(htxt(n.text()) for s in ks for n in s.find_all(cls="ramka-ujawnienie"))
        for needle in ("po lekcji", "rozdział dla nauczyciela"):
            if needle not in rj:
                fail("L7", f"lekcja {L}: ramka ujawnienia nie zawiera {needle!r}")
        mat = " ".join(htxt(n.text()) for s in ks for n in s.find_all(cls="materialy"))
        if "bez komputerów" not in mat:
            fail("L7", f"lekcja {L}: materiały nie zawierają 'bez komputerów'")
        ktxt = " ".join(htxt(s.text()) for s in ks)
        for bad in ("bezpiecznaaur", "roblox studio"):
            if bad in ktxt:
                fail("L7", f"lekcja {L}: konspekt zawiera {bad!r}")

        # L8
        for s in ls:
            if s.has("ws--do-domu"):
                nh = len(s.find_all(cls="do-domu-half"))
                if nh != 2:
                    fail("L8", f"lekcja {L}: karta do domu ma {nh} połówek (oczekiwano 2)")
                t = htxt(s.text())
                for needle in ("116 111", "umowa rodzinna", "poradnik"):
                    if needle not in t:
                        fail("L8", f"lekcja {L}: karta do domu nie zawiera {needle!r}")

        # L9
        if f"lekcja{L}:" not in all_ncf:
            fail("L9", f"PDF nie zawiera 'Lekcja {L}:'")

    # ---------------------------------------------------------- pełny pakiet
    if args.full:
        hw = [s for s in sections if s.has("howto")]
        if len(hw) != 1:
            fail("F1", f"section.howto: {len(hw)} (oczekiwano 1)")
        else:
            t = htxt(hw[0].text())
            for needle in ("uczciw", "bez komputerów"):
                if needle not in t:
                    fail("F1", f"strona 'Jak korzystać' nie zawiera {needle!r}")
        zr = [s for s in sections if s.has("zrodla")]
        if len(zr) != 1:
            fail("F2", f"section.zrodla: {len(zr)} (oczekiwano 1)")
        else:
            ols = zr[0].find_all("ol", cls="zrodla")
            nli = len([c for c in ols[0].children if c.tag == "li"]) if ols else 0
            if len(ols) != 1 or nli != 11:
                fail("F2", f"ol.zrodla: {len(ols)} list, {nli} pozycji (oczekiwano 1 lista, 11 pozycji)")
        if "3.10.2026" not in all_ncf:
            fail("F2", "PDF nie zawiera daty dostępu 3.10.2026")
        finds = [normcf(li.attrs.get("data-find", "")) for li in root.find_all("li") if "data-find" in li.attrs]
        for need in ("Jak korzystać z pakietu", "Źródła"):
            if normcf(need) not in finds:
                fail("F3", f"spis treści nie ma wpisu z data-find {need!r}")

    for line in fails:
        print(line)
    if fails:
        return 1
    print(f"OK: {npages} stron, {nsec} sekcji, lekcje: {N}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
