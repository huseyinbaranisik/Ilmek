// Bir şarkının ortalama puanını ve inceleme sayısını yeniden hesaplar.
// İnceleme eklenince, güncellenince ya da silinince çağrılır.
const Sarki = require("../models/sarki");
const Inceleme = require("../models/inceleme");

async function puanGuncelle(sarkiId) {
  const incelemeler = await Inceleme.findAll({ where: { sarkiId }, raw: true });
  const toplam = incelemeler.reduce((t, i) => t + i.puan, 0);
  await Sarki.update(
    { ortPuan: incelemeler.length ? toplam / incelemeler.length : 0, incelemeSayisi: incelemeler.length },
    { where: { id: sarkiId } }
  );
}

module.exports = puanGuncelle;
