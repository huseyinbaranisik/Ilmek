// Siparişler. Sepetteki her ürün için bir satır oluşur.
// Aynı alışverişteki satırların siparisNo'su aynıdır (örnek: "IL-1732612345678").
// Ödeme sahte: kart bilgisi kontrol edilir ama sadece son 4 hanesi kaydedilir.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Siparis = db.define("siparis", {
  siparisNo: { type: DataTypes.STRING(30), allowNull: false },
  adet:      { type: DataTypes.INTEGER, allowNull: false },
  toplam:    { type: DataTypes.INTEGER, allowNull: false },  // adet x fiyat (sipariş anındaki fiyat)
  durum:     { type: DataTypes.STRING(20), allowNull: false, defaultValue: "hazirlaniyor" },

  // Teslimat bilgileri: misafir formda yazar, üyede hesabından gelir
  adSoyad: { type: DataTypes.STRING(80), allowNull: false },
  telefon: { type: DataTypes.STRING(20), allowNull: false },
  eposta:  { type: DataTypes.STRING(100), allowNull: false },
  adres:   { type: DataTypes.TEXT, allowNull: false },
  aliciNotu: { type: DataTypes.TEXT },

  // Kartın sadece son 4 hanesi. Kart numarasının tamamı ve CVV ASLA kaydedilmez.
  kartSon4: { type: DataTypes.STRING(4), allowNull: false },
}, { timestamps: true, name: { singular: "siparis", plural: "siparisler" } });

// Durumların sayfada görünen adları ve renkleri
// Ödeme yapıldığı için sipariş "hazırlanıyor" diye başlar, satıcı kargoya verir, sonra teslim olur.
Siparis.DURUMLAR = {
  hazirlaniyor: { ad: "Hazırlanıyor", renk: "sari" },
  kargoda:      { ad: "Kargoda",      renk: "mavi" },
  teslim:       { ad: "Teslim edildi", renk: "yesil" },
};

module.exports = Siparis;
