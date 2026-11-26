// ============================================================
//  site.js - Bütün sayfalarda çalışan küçük script
//  1) Favori (kalp) düğmeleri   2) Nabız: online sayısı ve "şu an bakan" sayısı
//  3) Ürün sayfasında adet değişince toplam fiyat   4) Ürün formunda resim önizleme
// ============================================================
const csrf = document.querySelector('meta[name="csrf-token"]').content;   // CSRF anahtarı

// Sunucuya JSON POST isteği (CSRF anahtarı başlıkta gönderilir)
function gonder(adres, veri) {
  return fetch(adres, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
    body: JSON.stringify(veri || {}),
  }).then(r => r.json());
}

// Altta birkaç saniye görünüp kaybolan küçük bildirim (CSS'teki ".bildirim")
function bildirim(metin) {
  document.querySelectorAll('.bildirim').forEach(el => el.remove());
  const el = document.createElement('div');
  el.className = 'bildirim';
  el.textContent = metin;   // textContent: metin HTML olarak çalıştırılmaz (XSS olmasın)
  document.body.append(el);
  setTimeout(() => el.remove(), 4000);
}

// ---------- 1) Favori (kalp) ----------
const favoriler = new Set(window.favoriIdler || []);

function kalpleriGuncelle() {
  document.querySelectorAll('[data-favori]').forEach(el => {
    const var_ = favoriler.has(Number(el.dataset.favori));
    el.classList.toggle('dolu', var_);
    el.innerHTML = var_ ? '<i class="bi bi-heart-fill"></i>' : '<i class="bi bi-heart"></i>';
    el.title = var_ ? 'Favorilerden çıkar' : 'Favorilere ekle';
  });
}
kalpleriGuncelle();

document.addEventListener('click', e => {
  const kalp = e.target.closest('[data-favori]');
  if (!kalp) return;
  e.preventDefault();   // kalp bir kartın içindeyse karta (ürün sayfasına) gitmesin
  const id = Number(kalp.dataset.favori);
  gonder('/hesap/favori/' + id).then(veri => {
    if (veri.favori) favoriler.add(id); else favoriler.delete(id);
    kalpleriGuncelle();
    bildirim(veri.favori ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
  }).catch(() => bildirim('Bir hata oldu, sayfayı yenileyin.'));
});

// ---------- 2) Nabız: 15 saniyede bir "buradayım" ----------
// Ürün sayfasındaysa hangi ürüne baktığını da gönderir (<main data-urun="5">)
const urunAlani = document.querySelector('[data-urun]');
function nabiz() {
  gonder('/api/nabiz', { urunId: urunAlani ? urunAlani.dataset.urun : null }).then(veri => {
    document.getElementById('online-sayi').textContent = veri.online;
    const bakan = document.getElementById('bakan-sayi');
    if (bakan) bakan.textContent = veri.bakan;
  }).catch(() => {});
}
nabiz();
setInterval(nabiz, 15000);

// ---------- 3) Ürün sayfası: adet değişince toplam ----------
const adet = document.getElementById('adet');
if (adet) {
  const guncelle = () => {
    const toplam = Number(adet.dataset.fiyat) * Number(adet.value || 1);
    document.getElementById('toplam').textContent = toplam.toLocaleString('tr-TR') + ' ₺';
  };
  adet.addEventListener('input', guncelle);
  guncelle();
}

// ---------- 4) Ürün formu: seçilen resmi hemen göster ----------
const resimSec = document.getElementById('resim-sec');
if (resimSec) {
  resimSec.addEventListener('change', () => {
    const dosya = resimSec.files[0];
    if (dosya) document.getElementById('resim-onizleme').src = URL.createObjectURL(dosya);
  });
}
