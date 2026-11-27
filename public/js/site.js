// ============================================================
//  site.js - Bütün sayfalarda çalışan script
//  1) Sepet (tarayıcıda, localStorage)   2) Favori (kalp)   3) Nabız: online sayısı
//  4) Ürün sayfasında adet x fiyat       5) Ürün formunda resim önizleme
// ============================================================
const csrf = document.querySelector('meta[name="csrf-token"]').content;   // CSRF anahtarı

// Para yazdırma: 1250 -> "1.250 ₺"
function tl(sayi) {
  return sayi.toLocaleString('tr-TR') + ' ₺';
}

// Altta birkaç saniye görünüp kaybolan küçük bildirim
function bildirim(metin) {
  const eski = document.querySelector('.bildirim');
  if (eski) eski.remove();
  const kutu = document.createElement('div');
  kutu.className = 'bildirim';
  kutu.textContent = metin;   // textContent: metin HTML olarak çalışmaz (XSS olmasın)
  document.body.append(kutu);
  setTimeout(function () { kutu.remove(); }, 4000);
}

// ============================================================
//  0) KOYU TEMA
//  Sayfa açılırken tema ust.ejs içindeki küçük script ile zaten uygulandı.
//  Burada sadece düğmeye basınca değiştirip tarayıcıya kaydediyoruz.
// ============================================================
const temaDugme = document.getElementById('tema-dugme');
if (temaDugme) {
  temaDugme.addEventListener('click', function () {
    const html = document.documentElement;
    if (html.getAttribute('data-tema') === 'koyu') {
      html.removeAttribute('data-tema');
      html.removeAttribute('data-bs-theme');
      localStorage.setItem('tema', 'acik');
    } else {
      html.setAttribute('data-tema', 'koyu');
      html.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('tema', 'koyu');
    }
  });
}

// ============================================================
//  1) SEPET
//  Sepet tarayıcının localStorage'ında "sepet" adıyla tutulur:  [{ "id": 3, "adet": 2 }, ...]
//  Sunucuya hiç gitmez, bu yüzden misafir de sepet oluşturabilir.
//  Fiyat burada tutulmaz, ödeme sırasında sunucu fiyatı veritabanından alır.
// ============================================================
function sepetiOku() {
  const yazi = localStorage.getItem('sepet');
  if (!yazi) return [];
  try {
    return JSON.parse(yazi);
  } catch (e) {
    return [];
  }
}

function sepetiKaydet(sepet) {
  localStorage.setItem('sepet', JSON.stringify(sepet));
  sepetSayisiniGoster();
}

// Üst menüdeki sepet rozetine toplam adet yazılır
function sepetSayisiniGoster() {
  const rozet = document.getElementById('sepet-sayi');
  if (!rozet) return;
  let toplamAdet = 0;
  for (const parca of sepetiOku()) toplamAdet = toplamAdet + parca.adet;
  rozet.textContent = toplamAdet;
  rozet.hidden = toplamAdet == 0;
}
sepetSayisiniGoster();

// Ürün sayfasındaki "Sepete ekle" düğmesi
const sepeteEkleDugmesi = document.querySelector('[data-sepete-ekle]');
if (sepeteEkleDugmesi) {
  sepeteEkleDugmesi.addEventListener('click', function () {
    const id = parseInt(sepeteEkleDugmesi.dataset.sepeteEkle);
    const stok = parseInt(sepeteEkleDugmesi.dataset.stok);
    const adet = parseInt(document.getElementById('adet').value) || 1;

    const sepet = sepetiOku();
    let bulundu = false;
    for (const parca of sepet) {
      if (parca.id == id) {          // ürün zaten sepetteyse adedini artır
        parca.adet = parca.adet + adet;
        if (parca.adet > stok) parca.adet = stok;
        bulundu = true;
      }
    }
    if (!bulundu) sepet.push({ id: id, adet: Math.min(adet, stok) });
    sepetiKaydet(sepet);
    bildirim('Sepete eklendi 🧶');
  });
}

// Sepetteki ürünlerin adı, fiyatı, resmi sunucudan alınır: /api/sepet?idler=3,5
async function sepetUrunleriniGetir() {
  const sepet = sepetiOku();
  if (sepet.length == 0) return [];
  const idler = sepet.map(function (p) { return p.id; }).join(',');
  const cevap = await fetch('/api/sepet?idler=' + idler);
  const urunler = await cevap.json();

  // Sepetteki adetle sunucudan gelen bilgiyi birleştir
  const liste = [];
  for (const parca of sepet) {
    const urun = urunler.find(function (u) { return u.id == parca.id; });
    if (urun) {
      urun.adet = Math.min(parca.adet, urun.stok);
      liste.push(urun);
    }
  }
  return liste;
}

// ---------- Sepet sayfası (/sepet) ----------
async function sepetSayfasiniDoldur() {
  const listeKutusu = document.getElementById('sepet-listesi');
  if (!listeKutusu) return;

  const urunler = await sepetUrunleriniGetir();
  if (urunler.length == 0) {
    document.getElementById('sepet-sayfasi').hidden = true;
    document.getElementById('sepet-bos').hidden = false;
    return;
  }

  listeKutusu.innerHTML = '';
  let toplam = 0;
  for (const urun of urunler) {
    toplam = toplam + urun.fiyat * urun.adet;
    // Satırı elle oluşturuyoruz. Ürün adı gibi yazıları textContent ile koyuyoruz (XSS olmasın).
    const satir = document.createElement('div');
    satir.className = 'satir';
    satir.innerHTML =
      '<img class="mini-resim" alt="">' +
      '<div class="flex-grow-1 min-w-0"><a class="satir-baslik"></a><div class="soluk kucuk"></div></div>' +
      '<div class="adet-kontrol"><button type="button" data-azalt aria-label="Azalt">−</button><span></span><button type="button" data-arttir aria-label="Arttır">+</button></div>' +
      '<b class="satir-tutar"></b>' +
      '<button type="button" class="btn-sil" data-cikar aria-label="Sepetten çıkar"><i class="bi bi-trash"></i></button>';
    satir.querySelector('img').src = urun.resim;
    satir.querySelector('a').href = '/urun/' + urun.slug;
    satir.querySelector('a').textContent = urun.baslik;
    satir.querySelector('.soluk').textContent = urun.satici + ' · ' + tl(urun.fiyat);
    satir.querySelector('.adet-kontrol span').textContent = urun.adet;
    satir.querySelector('.satir-tutar').textContent = tl(urun.fiyat * urun.adet);

    // + / − / çıkar düğmeleri
    satir.querySelector('[data-arttir]').onclick = function () { adetDegistir(urun.id, 1, urun.stok); };
    satir.querySelector('[data-azalt]').onclick = function () { adetDegistir(urun.id, -1, urun.stok); };
    satir.querySelector('[data-cikar]').onclick = function () { adetDegistir(urun.id, -1000, urun.stok); };
    listeKutusu.append(satir);
  }
  document.getElementById('sepet-ara-toplam').textContent = tl(toplam);
  document.getElementById('sepet-toplam').textContent = tl(toplam);
}

function adetDegistir(id, fark, stok) {
  let sepet = sepetiOku();
  for (const parca of sepet) {
    if (parca.id == id) {
      parca.adet = parca.adet + fark;
      if (parca.adet > stok) {
        parca.adet = stok;
        bildirim('Stokta sadece ' + stok + ' adet var');
      }
    }
  }
  // Adedi 0 olanları sepetten çıkar
  sepet = sepet.filter(function (p) { return p.adet > 0; });
  sepetiKaydet(sepet);
  sepetSayfasiniDoldur();
}
sepetSayfasiniDoldur();

// ---------- Ödeme sayfası (/odeme) ----------
async function odemeSayfasiniDoldur() {
  const ozet = document.getElementById('odeme-ozet');
  if (!ozet) return;

  const urunler = await sepetUrunleriniGetir();
  if (urunler.length == 0) {
    location.href = '/sepet';   // sepet boşsa ödeme sayfasında işi yok
    return;
  }
  ozet.innerHTML = '';
  let toplam = 0;
  for (const urun of urunler) {
    toplam = toplam + urun.fiyat * urun.adet;
    const satir = document.createElement('div');
    satir.className = 'd-flex justify-content-between gap-2 kucuk';
    const ad = document.createElement('span');
    ad.textContent = urun.adet + ' x ' + urun.baslik;
    const tutar = document.createElement('b');
    tutar.textContent = tl(urun.fiyat * urun.adet);
    satir.append(ad, tutar);
    ozet.append(satir);
  }
  document.getElementById('sepet-toplam').textContent = tl(toplam);
}
odemeSayfasiniDoldur();

// Ödeme formu gönderilirken sepeti gizli alana JSON olarak koy
const odemeFormu = document.getElementById('odeme-formu');
if (odemeFormu) {
  odemeFormu.addEventListener('submit', function () {
    document.getElementById('sepet-alani').value = JSON.stringify(sepetiOku());
  });
  // Kart numarasını 4'erli grupla yaz: 1234 5678 ...
  const kartNo = document.getElementById('kartNo');
  kartNo.addEventListener('input', function () {
    const rakamlar = kartNo.value.replace(/\D/g, '').slice(0, 16);
    kartNo.value = rakamlar.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  // Son kullanma: 0828 -> 08/28
  const sonKullanma = document.getElementById('sonKullanma');
  sonKullanma.addEventListener('input', function () {
    const rakamlar = sonKullanma.value.replace(/\D/g, '').slice(0, 4);
    if (rakamlar.length > 2) sonKullanma.value = rakamlar.slice(0, 2) + '/' + rakamlar.slice(2);
    else sonKullanma.value = rakamlar;
  });
}

// ============================================================
//  2) FAVORİ (kalp) - sadece üyeler
// ============================================================
const favoriler = window.favoriIdler || [];

function kalpleriGuncelle() {
  document.querySelectorAll('[data-favori]').forEach(function (kalp) {
    const favorideMi = favoriler.includes(parseInt(kalp.dataset.favori));
    kalp.classList.toggle('dolu', favorideMi);
    if (favorideMi) {
      kalp.innerHTML = '<i class="bi bi-heart-fill"></i>';
      kalp.title = 'Favorilerden çıkar';
    } else {
      kalp.innerHTML = '<i class="bi bi-heart"></i>';
      kalp.title = 'Favorilere ekle';
    }
  });
}
kalpleriGuncelle();

document.addEventListener('click', async function (olay) {
  const kalp = olay.target.closest('[data-favori]');
  if (!kalp) return;
  olay.preventDefault();
  const id = parseInt(kalp.dataset.favori);
  try {
    // CSRF anahtarı başlıkta gönderilir
    const cevap = await fetch('/hesap/favori/' + id, { method: 'POST', headers: { 'x-csrf-token': csrf } });
    const veri = await cevap.json();
    if (veri.favori) {
      favoriler.push(id);
      bildirim('Favorilere eklendi');
    } else {
      favoriler.splice(favoriler.indexOf(id), 1);
      bildirim('Favorilerden çıkarıldı');
    }
    kalpleriGuncelle();
  } catch (e) {
    bildirim('Bir hata oldu, sayfayı yenileyin.');
  }
});

// ============================================================
//  3) NABIZ: 15 saniyede bir "buradayım" (online sayısı için)
// ============================================================
async function nabiz() {
  try {
    const cevap = await fetch('/api/nabiz', { method: 'POST', headers: { 'x-csrf-token': csrf } });
    const veri = await cevap.json();
    document.getElementById('online-sayi').textContent = veri.online;
  } catch (e) {
    // internet giderse sessizce geç
  }
}
nabiz();
setInterval(nabiz, 15000);

// ============================================================
//  4) Ürün sayfası: adet değişince toplam
// ============================================================
const adetKutusu = document.getElementById('adet');
if (adetKutusu) {
  adetKutusu.addEventListener('input', function () {
    const toplam = parseInt(adetKutusu.dataset.fiyat) * (parseInt(adetKutusu.value) || 1);
    document.getElementById('toplam').textContent = tl(toplam);
  });
}

// ============================================================
//  5) Ürün formu: seçilen resmi hemen göster
// ============================================================
const resimSec = document.getElementById('resim-sec');
if (resimSec) {
  resimSec.addEventListener('change', function () {
    const dosya = resimSec.files[0];
    if (dosya) document.getElementById('resim-onizleme').src = URL.createObjectURL(dosya);
  });
}
