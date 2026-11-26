// Kullanıcılar. Şifre bcrypt ile hash'lenmiş olarak saklanır, asla düz metin değil.
// Her üye hem alıcı hem satıcı olabilir.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Kullanici = db.define("kullanici", {
  kullaniciAdi: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  sifre:        { type: DataTypes.STRING(200), allowNull: false },

  // Teslimat bilgileri: üye bunları bir kere kaydeder, her alışverişte tekrar yazmaz
  adSoyad: { type: DataTypes.STRING(80) },
  telefon: { type: DataTypes.STRING(20) },
  eposta:  { type: DataTypes.STRING(100) },
  adres:   { type: DataTypes.TEXT },

  // Mağaza bilgileri (satıcı olarak, isteğe bağlı)
  magazaAdi: { type: DataTypes.STRING(60) },
  hakkinda:  { type: DataTypes.TEXT },
  sehir:     { type: DataTypes.STRING(40) },
}, { timestamps: true }); // createdAt = üyelik tarihi

module.exports = Kullanici;
