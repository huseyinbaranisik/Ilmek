// Kullanıcılar. Şifre bcrypt ile hash'lenmiş olarak saklanır, asla düz metin değil.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Kullanici = db.define("kullanici", {
  kullaniciAdi: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  sifre:        { type: DataTypes.STRING(200), allowNull: false },
}, { timestamps: true }); // createdAt = üyelik tarihi

module.exports = Kullanici;
