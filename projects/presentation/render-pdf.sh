#!/usr/bin/env bash
# Render HTML -> PDF (A4) przez Microsoft Edge w trybie headless.
# Użycie (z katalogu głównego repozytorium):
#   bash projects/presentation/render-pdf.sh <wejście.html> <wyjście.pdf>
# Ścieżki mogą być względne wobec bieżącego katalogu albo absolutne.
# Uwaga: Edge wołamy wyłącznie z flagami do druku headless (nie z flagą wersji,
# która na Windows otwiera okno przeglądarki i blokuje terminal).
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Użycie: bash projects/presentation/render-pdf.sh <wejście.html> <wyjście.pdf>" >&2
  exit 2
fi

IN="$1"
OUT="$2"

if [ ! -f "$IN" ]; then
  echo "Brak pliku wejściowego: $IN" >&2
  exit 1
fi

EDGE=""
for cand in \
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  "/c/Program Files/Microsoft/Edge/Application/msedge.exe"; do
  if [ -x "$cand" ] || [ -f "$cand" ]; then
    EDGE="$cand"
    break
  fi
done
if [ -z "$EDGE" ]; then
  echo "Nie znaleziono Microsoft Edge (msedge.exe) w Program Files." >&2
  exit 1
fi

# Usuń stary PDF, żeby nieudany render nie zostawił nieaktualnego pliku.
rm -f "$OUT"

PROFILE_DIR="$(mktemp -d)"
cleanup() { rm -rf "$PROFILE_DIR"; }
trap cleanup EXIT

IN_URL="file:///$(cygpath -m "$(realpath "$IN")")"
OUT_WIN="$(cygpath -w "$(realpath -m "$OUT")")"
PROFILE_WIN="$(cygpath -w "$PROFILE_DIR")"

"$EDGE" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --allow-file-access-from-files \
  --virtual-time-budget=10000 \
  --user-data-dir="$PROFILE_WIN" \
  --print-to-pdf="$OUT_WIN" \
  "$IN_URL" >/dev/null 2>&1 || true

if [ ! -s "$OUT" ]; then
  echo "Render nie powiódł się: brak lub pusty plik $OUT" >&2
  exit 1
fi

echo "PDF: $OUT"
