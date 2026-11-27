#!/bin/sh
# README görselleri için gerçek ekran görüntüleri alır (Edge'in ekransız modu).
# Önce siteyi çalıştır (npm start), sonra: sh tools/ekran-goruntuleri.sh
# Görüntüler docs/kaynak/ klasörüne yazılır, tools/figurler.html bunları birleştirir.
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
SITE="http://localhost:3000"
HEDEF="$(cd "$(dirname "$0")/.." && pwd)/docs/kaynak"
PROFIL="$(mktemp -d)"   # temiz profil: localStorage'da eski tema seçimi kalmasın
mkdir -p "$HEDEF"

cek() {   # cek <dosya> <adres> <tema: 1=açık 0=koyu> [genişlik,yükseklik]
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PROFIL" \
    --blink-settings=preferredColorScheme=$3 --window-size=${4:-1440,900} \
    --screenshot="$HEDEF/$1" "$SITE$2" 2>/dev/null
  echo "$1"
}

cek ana-sayfa.png        /                           1
cek ana-sayfa-koyu.png   /                           0
cek kategori.png         /kategori/amigurumi         1
cek urun.png             /urun/amigurumi-tavsan      1
cek galeri-koyu.png      "/galeri#resim-24"          0

# Telefon ve tablet görüntüleri (telefon.jpg, telefon-koyu.jpg, admin-koyu.jpg) buradan alınamıyor:
# Edge 500 pikselden dar pencere açmıyor. Onlar tarayıcının telefon (375x812) ve tablet (768x1024)
# görünümünden alındı; admin görüntüsü için önce admin olarak giriş yapmak gerekiyor.
