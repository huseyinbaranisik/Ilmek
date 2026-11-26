// ============================================================
//  helpers/canli.js - Online kullanıcı sayısı ve "şu an bu ürüne bakanlar"
//
//  Veritabanına yazmıyoruz, sunucunun hafızasında (RAM) tutuyoruz:
//  - sonGorulme: her oturumun en son ne zaman istek attığı
//  - bakanlar:   her oturumun şu an hangi ürün sayfasında olduğu
//  Sayfa açık kaldıkça tarayıcı 15 saniyede bir /api/nabiz adresine haber verir (public/js/site.js).
// ============================================================
const sonGorulme = {};   // { oturumId: zaman }
const bakanlar = {};     // { oturumId: { urunId, zaman } }

// Son 60 saniyede görülenler "çevrimiçi" sayılır
function onlineSayisi() {
  const sinir = Date.now() - 60 * 1000;
  for (const id in sonGorulme) if (sonGorulme[id] < sinir) delete sonGorulme[id];
  return Object.keys(sonGorulme).length;
}

// Son 40 saniyede bu ürünün sayfasında olanların sayısı
function bakanSayisi(urunId) {
  const sinir = Date.now() - 40 * 1000;
  let sayi = 0;
  for (const id in bakanlar) {
    if (bakanlar[id].zaman < sinir) { delete bakanlar[id]; continue; }
    if (bakanlar[id].urunId === urunId) sayi++;
  }
  return sayi;
}

module.exports = { sonGorulme, bakanlar, onlineSayisi, bakanSayisi };
