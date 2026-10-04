# Scamerino Alertinio — awatar rozszerzenia

Nowa kompozycja przedstawia samą głowę rekina z kogutem alarmowym. Powstała za pomocą wbudowanego narzędzia `image_gen` z `assets/Scamerino_Alertinio.png` jako referencją i opcją `transparent_background=true`. Oryginał pozostał bez zmian. Generowanie jest niedeterministyczne: to nowa interpretacja postaci, a nie identyczne wycięcie oryginalnych pikseli.

Prompt: ta sama przyjazna niebieska postać 3D, duże brązowe oczy, kremowy pysk, otwarty uśmiech, płetwa i pomarańczowy kogut na srebrnej podstawie; sama głowa w ujęciu trzy czwarte, kompaktowy kwadrat, bez napisów, tułowia i akcesoriów, przezroczyste tło, czytelna sylwetka i obrys. Kolory referencyjne: #0F62DB, #0A3B8C, #FF8A00. To render z cieniowaniem, więc kolory pikseli nie są ograniczone do tokenów palety.

## Pliki

| Plik | Wymiary | Zastosowanie |
| --- | --- | --- |
| avatar-master.png | 1024 × 1024 | źródło kolejnych eksportów |
| avatar-128.png | 128 × 128 | większy podgląd |
| avatar-64.png | 64 × 64 | widget |
| avatar-48.png | 48 × 48 | widget |
| icon-16.png | 16 × 16 | manifest Chrome |
| icon-32.png | 32 × 32 | manifest Chrome |
| icon-48.png | 48 × 48 | manifest Chrome |
| icon-128.png | 128 × 128 | manifest Chrome |

Wszystkie PNG mają 8-bitowe kanały RGBA, przezroczyste piksele tła i częściową alfę na krawędziach. Ikony i awatary korzystają z tej samej kompozycji głowy. Nie zmieniano manifestu.

## Obróbka i odtwarzanie eksportów

Użyto ImageMagick 7.1.2-31: maska alfa ogranicza drobne artefakty poza sylwetką, a skalowanie Lanczos zapewnia antyaliasing. W poniższych komendach `generated.png` oznacza wynik narzędzia (1254 × 1254 RGBA), a pliki robocze mogą znajdować się w `/tmp`.

```sh
magick generated.png -alpha extract -threshold 50% -morphology Dilate Disk:2 /tmp/scamerino-mask.png
magick generated.png -alpha extract /tmp/scamerino-mask.png -compose Multiply -composite /tmp/scamerino-alpha.png
magick generated.png \( /tmp/scamerino-alpha.png -alpha off \) -compose CopyOpacity -composite /tmp/scamerino-fixed.png
magick /tmp/scamerino-fixed.png -trim +repage -filter Lanczos -resize 944x944 -compose Over -gravity center -background none -extent 1024x1024 -depth 8 PNG32:assets/widget-avatar/avatar-master.png
for size in 128 64 48; do
  magick assets/widget-avatar/avatar-master.png -filter Lanczos -resize "${size}x${size}" -depth 8 "PNG32:assets/widget-avatar/avatar-${size}.png"
done
for size in 16 32 48 128; do
  magick assets/widget-avatar/avatar-master.png -filter Lanczos -resize "${size}x${size}" -depth 8 "PNG32:assets/widget-avatar/icon-${size}.png"
done
magick identify -format '%f %wx%h %[channels] alpha=%[fx:minima.a]..%[fx:maxima.a]\n' assets/widget-avatar/*.png
```

## Kontrola czytelności

Obejrzano pliki 48 px i 16 px oraz ich powiększenia bez wygładzania na jasnym tle. Przy 48 px oczy, uśmiech i kogut pozostają czytelne. Przy 16 px rozpoznawalna jest niebieska głowa z jasnym pyskiem i pomarańczowym sygnałem; pojedyncze zęby, refleksy i faktura zanikają. To ograniczenie rozmiaru — ikonę 16 px należy traktować jako znak postaci. Awatar jest kwadratowym PNG z przezroczystością; dodatkowe ciasne przycięcie CSS do koła może uciąć płetwę.

SHA-256 niezmienionego oryginału: `455482a1da675d074a24baef0ca53f0e893bdef06859b7af8f53cc85cda518bd`.
