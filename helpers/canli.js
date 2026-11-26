// ============================================================
//  helpers/canli.js - Online kullanıcı sayısı
//
//  Veritabanına yazmıyoruz, sunucunun hafızasında (RAM) tutuyoruz.
//  sonGorulme = { oturumId: en son görüldüğü zaman }
//  middleware/locals.js her istekte zamanı günceller,
//  sayfa açık kaldıkça tarayıcı da 15 saniyede bir /api/nabiz adresine haber verir.
// ============================================================
const sonGorulme = {};

// Son 60 saniyede görülenler "çevrimiçi" sayılır, eskiler silinir
function onlineSayisi() {
  const sinir = Date.now() - 60 * 1000;
  let sayi = 0;
  for (const oturumId in sonGorulme) {
    if (sonGorulme[oturumId] < sinir) {
      delete sonGorulme[oturumId];
    } else {
      sayi++;
    }
  }
  return sayi;
}

module.exports = { sonGorulme, onlineSayisi };
