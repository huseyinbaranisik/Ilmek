// ============================================================
//  helpers/canli.js - Online kullanıcı ve şarkı başına dinleyici sayısı
//
//  Veritabanına yazmıyoruz, sunucunun hafızasında (RAM) tutuyoruz:
//  - sonGorulme:  her oturumun en son ne zaman istek attığı
//  - dinleyenler: her oturumun şu an hangi şarkıyı çaldığı (giriş yaptıysa kullanıcı adıyla)
//  Şarkı çalarken tarayıcı 15 saniyede bir /api/nabiz adresine haber verir.
// ============================================================
const sonGorulme = {};   // { oturumId: zaman }
const dinleyenler = {};  // { oturumId: { sarkiId, zaman, kullaniciAdi } }

// Son 60 saniyede görülenler "çevrimiçi" sayılır
function onlineSayisi() {
  const sinir = Date.now() - 60 * 1000;
  for (const id in sonGorulme) if (sonGorulme[id] < sinir) delete sonGorulme[id];
  return Object.keys(sonGorulme).length;
}

// Son 40 saniyede "bu şarkıyı dinliyorum" diyenler sayılır -> { sarkiId: kişi sayısı }
function dinleyiciSayilari() {
  const sinir = Date.now() - 40 * 1000;
  const sayilar = {};
  for (const id in dinleyenler) {
    const d = dinleyenler[id];
    if (d.zaman < sinir) { delete dinleyenler[id]; continue; }
    sayilar[d.sarkiId] = (sayilar[d.sarkiId] || 0) + 1;
  }
  return sayilar;
}

// Bir üye şu an bir şarkı dinliyorsa o şarkının id'sini döner, dinlemiyorsa null
// (profildeki "Şu an dinliyor" için, Spotify'daki arkadaş etkinliği gibi)
function neDinliyor(kullaniciAdi) {
  dinleyiciSayilari(); // eskimiş kayıtları temizler
  for (const id in dinleyenler) {
    if (dinleyenler[id].kullaniciAdi === kullaniciAdi) return dinleyenler[id].sarkiId;
  }
  return null;
}

module.exports = { sonGorulme, dinleyenler, onlineSayisi, dinleyiciSayilari, neDinliyor };
