// Sipariş talepleri. Gerçek ödeme yok: alıcı talep gönderir, satıcı kabul edip durumu günceller.
// Durumlar sırayla: beklemede -> hazirlaniyor -> kargoda -> teslim   (ya da: reddedildi / iptal)
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Siparis = db.define("siparis", {
  adet:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  toplam: { type: DataTypes.INTEGER, allowNull: false },   // adet x fiyat (sipariş anındaki fiyat)
  aliciNotu: { type: DataTypes.TEXT },                     // alıcının satıcıya notu (renk, isim yazısı ...)
  adres:  { type: DataTypes.TEXT, allowNull: false },
  durum:  { type: DataTypes.STRING(20), allowNull: false, defaultValue: "beklemede" },
}, { timestamps: true, name: { singular: "siparis", plural: "siparisler" } });

// Durumların sayfada görünen adları ve renkleri (EJS'te kullanılır)
Siparis.DURUMLAR = {
  beklemede:    { ad: "Onay bekliyor",  renk: "sari" },
  hazirlaniyor: { ad: "Hazırlanıyor",   renk: "mavi" },
  kargoda:      { ad: "Kargoda",        renk: "mavi" },
  teslim:       { ad: "Teslim edildi",  renk: "yesil" },
  reddedildi:   { ad: "Reddedildi",     renk: "kirmizi" },
  iptal:        { ad: "İptal edildi",   renk: "kirmizi" },
};

// Satıcının bir durumdan hangi durumlara geçebileceği
Siparis.SONRAKI = {
  beklemede:    ["hazirlaniyor", "reddedildi"],
  hazirlaniyor: ["kargoda"],
  kargoda:      ["teslim"],
};

module.exports = Siparis;
