// Kullanıcılar. Şifre bcrypt ile hash'lenmiş olarak saklanır, asla düz metin değil.
// Her üye hem alıcı hem satıcı olabilir. Mağaza bilgileri (magazaAdi, hakkinda, sehir) isteğe bağlı.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Kullanici = db.define("kullanici", {
  kullaniciAdi: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  sifre:        { type: DataTypes.STRING(200), allowNull: false },
  magazaAdi:    { type: DataTypes.STRING(60) },   // "Nine'nin Şişleri"
  hakkinda:     { type: DataTypes.TEXT },         // mağaza açıklaması
  sehir:        { type: DataTypes.STRING(40) },
}, { timestamps: true }); // createdAt = üyelik tarihi

module.exports = Kullanici;
