#!/bin/sh
# tools/figurler.html içindeki figürleri PNG olarak docs/ klasörüne çizer (Edge'in ekransız modu).
# Kullanım: sh tools/figurler.sh
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
KOK="$(cd "$(dirname "$0")/.." && pwd -W)"   # Windows yolu: C:/Users/... (Git Bash)
SAYFA="file:///$KOK/tools/figurler.html"
PROFIL="$(mktemp -d)"

ciz() {   # ciz <figür> <genişlik,yükseklik>
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFIL" --allow-file-access-from-files \
    --window-size=$2 --screenshot="$KOK/docs/$1.png" "$SAYFA#$1" 2>/dev/null
  echo "docs/$1.png"
}

# Test çıktısını sayfanın okuyabileceği bir .js dosyasına çevir (file:// adresinde fetch çalışmıyor)
node -e 'const fs=require("fs");const k=process.argv[1];fs.writeFileSync(k+"/docs/kaynak/test.js","window.TEST_CIKTISI = "+JSON.stringify(fs.readFileSync(k+"/docs/kaynak/test.txt","utf8"))+";\n")' "$KOK"

ciz hero     1800,900
ciz ekranlar 1600,540
ciz koyu     1600,540
ciz telefon  1600,900
ciz test     1600,560
