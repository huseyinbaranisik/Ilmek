// Bir ürünün ortalama puanını ve yorum sayısını yeniden hesaplar.
// Yorum eklenince, güncellenince ya da silinince çağrılır.
const Urun = require("../models/urun");
const Yorum = require("../models/yorum");

async function puanGuncelle(urunId) {
  const yorumlar = await Yorum.findAll({ where: { urunId }, raw: true });
  const toplam = yorumlar.reduce((t, y) => t + y.puan, 0);
  await Urun.update(
    { ortPuan: yorumlar.length ? toplam / yorumlar.length : 0, yorumSayisi: yorumlar.length },
    { where: { id: urunId } }
  );
}

module.exports = puanGuncelle;
