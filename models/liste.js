// Üyelerin oluşturduğu listeler (Letterboxd listeleri / Spotify çalma listeleri)
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Liste = db.define("liste", {
  baslik:   { type: DataTypes.STRING, allowNull: false },
  slug:     { type: DataTypes.STRING, allowNull: false, unique: true }, // /liste/yagmurlu-gunler
  aciklama: { type: DataTypes.TEXT },
}, { timestamps: true, name: { singular: "liste", plural: "listeler" } });

module.exports = Liste;
