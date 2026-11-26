// Ürün kategorileri: Örgü, Takı, Seramik ... (admin panelinden eklenip silinir)
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Kategori = db.define("kategori", {
  ad:   { type: DataTypes.STRING(50), allowNull: false },
  slug: { type: DataTypes.STRING(60), allowNull: false, unique: true }, // /kategori/orgu
  ikon: { type: DataTypes.STRING(40), defaultValue: "bag-heart" },     // Bootstrap Icons adı
}, { timestamps: false, name: { singular: "kategori", plural: "kategoriler" } });

module.exports = Kategori;
