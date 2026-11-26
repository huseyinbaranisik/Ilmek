// El yapımı ürünler. Satıcı (üye) ekler, admin onaylayınca (onayli: true) sitede görünür.
// Resim veritabanına konmaz: dosya public/img/ altında durur, burada sadece adresi (URL) tutulur.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Urun = db.define("urun", {
  baslik:      { type: DataTypes.STRING(100), allowNull: false },
  slug:        { type: DataTypes.STRING(120), allowNull: false, unique: true }, // /urun/el-orgusu-bere
  aciklama:    { type: DataTypes.TEXT },
  fiyat:       { type: DataTypes.INTEGER, allowNull: false },  // TL, tam sayı
  stok:        { type: DataTypes.INTEGER, defaultValue: 1 },
  resim:       { type: DataTypes.STRING, allowNull: false },   // "/img/urunler/bere.jpg"
  onayli:      { type: DataTypes.BOOLEAN, defaultValue: false },
  goruntulenme:{ type: DataTypes.INTEGER, defaultValue: 0 },
  ortPuan:     { type: DataTypes.FLOAT, defaultValue: 0 },     // yorumların ortalaması (helpers/puan.js)
  yorumSayisi: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true, name: { singular: "urun", plural: "urunler" } });

module.exports = Urun;
