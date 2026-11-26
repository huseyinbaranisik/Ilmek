// ============================================================
//  oynatici.js - Alttaki müzik oynatıcısı
//  - Şarkı çalma / durdurma / ileri / geri
//  - Sayfa değişince kaldığı yerden devam (localStorage)
//  - 15 saniyede bir sunucuya "nabız" gönderip canlı sayıları günceller
// ============================================================
const ses = document.getElementById('ses');                                  // <audio> etiketi
const csrf = document.querySelector('meta[name="csrf-token"]').content;      // CSRF anahtarı
const $ = id => document.getElementById(id);

let sira = [];     // çalma listesi (şarkı nesneleri)
let index = -1;    // listede kaçıncı şarkı çalıyor
let bekleyenZaman = 0;
let karisik = false;   // karıştır açık mı
let tekrar = 'yok';    // 'yok' -> 'liste' (liste bitince başa dön) -> 'sarki' (aynı şarkıyı tekrarla)

// Sayfadaki bütün şarkıları (data-sarki özelliği olanlar) sırayla toplar
function sayfadakiSarkilar() {
  const liste = [];
  document.querySelectorAll('[data-sarki]').forEach(el => {
    const s = JSON.parse(el.dataset.sarki);
    if (!liste.some(x => x.id === s.id)) liste.push(s);
  });
  return liste;
}

const simdiki = () => sira[index];

// Sunucuya POST isteği (CSRF anahtarı başlıkta gönderilir)
function gonder(adres, veri) {
  return fetch(adres, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
    body: JSON.stringify(veri || {}),
  }).then(r => r.json());
}

// Bir şarkıyı çalmaya başla
function cal(liste, i, baslangic = 0, yeniDinleme = true) {
  sira = liste;
  index = i;
  const s = simdiki();
  bekleyenZaman = baslangic;
  ses.src = s.dosya;
  arayuzuGuncelle();
  if (yeniDinleme) {
    ses.play().catch(() => {});
    gonder('/api/dinlendi/' + s.id);   // dinlenme sayısı +1
    sonDinlenenlereEkle(s);
  }
  kilitEkrani(s);
}

// ---------- Son dinlenenler (tarayıcıda, localStorage'da en fazla 6 şarkı) ----------
function sonDinlenenlereEkle(s) {
  let liste = JSON.parse(localStorage.getItem('sonDinlenenler') || '[]');
  liste = [s, ...liste.filter(x => x.id !== s.id)].slice(0, 6);   // en başa koy, tekrarı sil
  localStorage.setItem('sonDinlenenler', JSON.stringify(liste));
}

// Ana sayfadaki "Son dinlediklerin" bölümünü doldurur (sadece ana sayfada bu bölüm var)
function sonDinlenenleriGoster() {
  const kutu = document.getElementById('son-dinlenenler-liste');
  if (!kutu) return;
  const liste = JSON.parse(localStorage.getItem('sonDinlenenler') || '[]');
  if (liste.length === 0) return;
  liste.forEach(s => {
    // Her şarkı için küçük bir kutucuk: kapak + ad. Yazıları textContent ile koyuyoruz (XSS olmasın diye innerHTML değil)
    const el = document.createElement('div');
    el.className = 'hizli-kart';
    el.dataset.sarki = JSON.stringify(s);   // tıklayınca çalsın (aşağıdaki tıklama dinleyicisi)
    const img = document.createElement('img');
    img.src = s.kapak; img.alt = '';
    const ad = document.createElement('span');
    ad.textContent = s.baslik;
    el.append(img, ad);
    kutu.append(el);
  });
  document.getElementById('son-dinlenenler').hidden = false;
}
sonDinlenenleriGoster();

// ---------- Telefonun kilit ekranı / klavyenin medya tuşları (Media Session API) ----------
function kilitEkrani(s) {
  if (!('mediaSession' in navigator)) return;   // tarayıcı desteklemiyorsa geç
  navigator.mediaSession.metadata = new MediaMetadata({
    title: s.baslik, artist: s.sanatci, album: 'Gramofy',
    artwork: [{ src: location.origin + s.kapak }],
  });
}
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => ses.play());
  navigator.mediaSession.setActionHandler('pause', () => ses.pause());
  navigator.mediaSession.setActionHandler('nexttrack', () => $('o-sonraki').click());
  navigator.mediaSession.setActionHandler('previoustrack', () => $('o-onceki').click());
}

// Ses dosyası yüklenince kaldığı saniyeye git
ses.addEventListener('loadedmetadata', () => {
  if (bekleyenZaman) { ses.currentTime = bekleyenZaman; bekleyenZaman = 0; }
  $('o-toplam').textContent = sure(ses.duration);
});

// Saniyeyi "1:05" biçimine çevirir
function sure(sn) {
  if (!isFinite(sn)) return '0:00';
  return Math.floor(sn / 60) + ':' + String(Math.floor(sn % 60)).padStart(2, '0');
}

// Oynatıcı ve sayfadaki görünümü güncelle (başlık, kapak, dönen plak...)
function arayuzuGuncelle() {
  const s = simdiki();
  const caliyor = s && !ses.paused;
  if (s) {
    $('o-baslik').textContent = s.baslik;
    $('o-sanatci').textContent = s.sanatci;
    $('o-kapak').src = s.kapak;
    $('o-link').href = '/sarki/' + s.slug;
    if ($('o-begen')) { $('o-begen').dataset.begen = s.id; $('o-begen').hidden = false; }
  }
  kalpleriGuncelle();
  $('o-cal').innerHTML = caliyor ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
  $('o-plak').classList.toggle('doner', caliyor);

  // Şarkı sayfasındaki büyük plak ve iğne
  document.querySelectorAll('[data-plak]').forEach(el => el.classList.toggle('doner', caliyor && s.id == el.dataset.plak));
  document.querySelectorAll('[data-igne]').forEach(el => el.classList.toggle('inik', caliyor && s.id == el.dataset.igne));

  // Listede çalan satırı ve butonları işaretle
  document.querySelectorAll('[data-sarki]').forEach(el => {
    const buMu = s && JSON.parse(el.dataset.sarki).id === s.id;
    el.classList.toggle('caliyor', buMu);
    const ikon = el.matches('button') ? el : el.querySelector('.satir-cal');
    if (ikon) ikon.innerHTML = buMu && caliyor ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
  });
}

// Tıklamalar: kart butonu, satır, büyük çal butonu
document.addEventListener('click', e => {
  const kalp = e.target.closest('[data-begen]');
  if (kalp) return begen(Number(kalp.dataset.begen));   // kalbe tıklandı: şarkıyı çalma, sadece beğen
  if (e.target.closest('#hepsini-cal')) return cal(sayfadakiSarkilar(), 0);

  const el = e.target.closest('[data-sarki]');
  if (!el || e.target.closest('a')) return;          // linke tıklandıysa sayfaya gitsin
  sarkiyiCal(JSON.parse(el.dataset.sarki), sayfadakiSarkilar());
});

// Şarkıyı çal. Zaten bu şarkı çalıyorsa çal / durdur yapar.
// Kitaplık sayfası (kitaplik.js) da bu fonksiyonu kullanır.
function sarkiyiCal(s, liste) {
  if (simdiki() && simdiki().id === s.id) {
    ses.paused ? ses.play() : ses.pause();
    return;
  }
  cal(liste, liste.findIndex(x => x.id === s.id));
}
window.sarkiyiCal = sarkiyiCal;

// Oynatıcı butonları
$('o-cal').onclick = () => {
  if (!simdiki()) { const l = sayfadakiSarkilar(); if (l.length) cal(l, 0); return; }
  ses.paused ? ses.play() : ses.pause();
};
// Sıradaki şarkının numarası. Karıştır açıksa rastgele, liste bittiyse -1 (tekrar açıksa başa döner).
function sonrakiIndex() {
  if (karisik && sira.length > 1) {
    let i;
    do { i = Math.floor(Math.random() * sira.length); } while (i === index);
    return i;
  }
  if (index < sira.length - 1) return index + 1;
  return tekrar === 'liste' ? 0 : -1;
}
$('o-sonraki').onclick = () => { const i = sonrakiIndex(); if (i >= 0) cal(sira, i); };
$('o-onceki').onclick = () => {
  if (ses.currentTime > 3 || index === 0) ses.currentTime = 0;   // başa sar
  else if (index > 0) cal(sira, index - 1);
};
// ---------- Klavye kısayolları ----------
// Boşluk: çal / durdur, ← →: 5 saniye geri / ileri, Shift + ← →: önceki / sonraki şarkı
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;   // yazı yazarken karışmasın
  if (e.code === 'Space' && !e.target.closest('button, a, .kilif')) { e.preventDefault(); $('o-cal').click(); }
  else if (e.key === 'ArrowRight' && e.shiftKey) $('o-sonraki').click();
  else if (e.key === 'ArrowLeft' && e.shiftKey) $('o-onceki').click();
  else if (e.key === 'ArrowRight' && ses.duration) ses.currentTime = Math.min(ses.duration, ses.currentTime + 5);
  else if (e.key === 'ArrowLeft') ses.currentTime = Math.max(0, ses.currentTime - 5);
});

$('o-ilerleme').oninput =e => { if (ses.duration) ses.currentTime = ses.duration * e.target.value / 100; };
$('o-ses').oninput = e => { ses.volume = e.target.value; };

ses.addEventListener('play', () => { arayuzuGuncelle(); nabiz(); });
ses.addEventListener('pause', () => { arayuzuGuncelle(); kaydet(); nabiz(); });
ses.addEventListener('ended', () => {
  if (tekrar === 'sarki') { ses.currentTime = 0; ses.play(); return; }  // aynı şarkı baştan
  const i = sonrakiIndex();
  if (i >= 0) cal(sira, i);
});

// ---------- Karıştır ve tekrarla düğmeleri ----------
function modlariGoster() {
  $('o-karistir').classList.toggle('acik', karisik);
  $('o-tekrar').classList.toggle('acik', tekrar !== 'yok');
  $('o-tekrar').innerHTML = tekrar === 'sarki' ? '<i class="bi bi-repeat-1"></i>' : '<i class="bi bi-repeat"></i>';
  $('o-tekrar').title = { yok: 'Tekrarla', liste: 'Listeyi tekrarlıyor', sarki: 'Şarkıyı tekrarlıyor' }[tekrar];
}
$('o-karistir').onclick = () => { karisik = !karisik; modlariGoster(); kaydet(); };
$('o-tekrar').onclick = () => {
  tekrar = { yok: 'liste', liste: 'sarki', sarki: 'yok' }[tekrar];   // sırayla değişir
  modlariGoster(); kaydet();
};

// ---------- Beğen (kalp) ----------
const begenilenler = new Set(window.begenilenIdler || []);   // sayfa açılırken sunucudan gelen id'ler

// Sayfadaki bütün kalpleri (data-begen) dolu ya da boş göster
function kalpleriGuncelle() {
  document.querySelectorAll('[data-begen]').forEach(el => {
    const begendim = begenilenler.has(Number(el.dataset.begen));
    el.classList.toggle('begenildi', begendim);
    el.innerHTML = begendim ? '<i class="bi bi-heart-fill"></i>' : '<i class="bi bi-heart"></i>';
    el.title = begendim ? 'Beğenilenlerden çıkar' : 'Beğenilen Şarkılar\'a ekle';
  });
}

// Sunucuya "beğen / beğenmekten vazgeç" gönder (routes/hesap.js -> /hesap/begen/:id)
function begen(id) {
  gonder('/hesap/begen/' + id).then(veri => {
    if (veri.begendi) begenilenler.add(id); else begenilenler.delete(id);
    kalpleriGuncelle();
  }).catch(() => {});
}
kalpleriGuncelle();
ses.addEventListener('timeupdate', () => {
  $('o-simdi').textContent = sure(ses.currentTime);
  if (ses.duration) $('o-ilerleme').value = ses.currentTime / ses.duration * 100;
  kaydet();
});

// ---------- Sayfa değişince kaldığı yerden devam ----------
function kaydet() {
  if (!simdiki()) return;
  localStorage.setItem('plak', JSON.stringify({ sira, index, zaman: ses.currentTime, caliyordu: !ses.paused, ses: ses.volume, karisik, tekrar }));
}

let kayit = JSON.parse(localStorage.getItem('plak') || 'null');
if (kayit && JSON.stringify(kayit).includes('/ornek/')) kayit = null;   // dosyalar taşınmadan önceki eski kayıt
if (kayit) { karisik = !!kayit.karisik; tekrar = kayit.tekrar || 'yok'; }
modlariGoster();
if (kayit && kayit.sira && kayit.sira[kayit.index]) {
  ses.volume = kayit.ses ?? 0.8;
  $('o-ses').value = ses.volume;
  cal(kayit.sira, kayit.index, kayit.zaman, false);
  if (kayit.caliyordu) ses.play().catch(() => arayuzuGuncelle());   // tarayıcı izin vermezse duraklatılmış kalır
}

// ---------- Nabız: canlı sayıları güncelle ----------
function nabiz() {
  const sarkiId = simdiki() && !ses.paused ? simdiki().id : null;
  gonder('/api/nabiz', { sarkiId }).then(veri => {
    $('online-sayi').textContent = veri.online;
    document.querySelectorAll('[data-canli]').forEach(el => {
      const n = veri.dinleyici[el.dataset.canli] || 0;
      el.querySelector('b').textContent = n;
      el.classList.toggle('var', n > 0);
    });
    document.querySelectorAll('[data-canli-sayi]').forEach(el => {
      el.textContent = veri.dinleyici[el.dataset.canliSayi] || 0;
    });
  }).catch(() => {});
}
nabiz();
setInterval(nabiz, 15000);
