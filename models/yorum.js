// Ürün değerlendirmeleri: 1-5 yıldız + yorum.
// Sadece ürünü satın alıp teslim almış üye yorum yazabilir (controller/hesap.js -> yorumKaydet).
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Yorum = db.define("yorum", {
  puan:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  metin: { type: DataTypes.TEXT },
}, { timestamps: true, name: { singular: "yorum", plural: "yorumlar" } });

module.exports = Yorum;
