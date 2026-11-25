// Resim galerisi
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Galeri = db.define("galeri", {
  resim:    { type: DataTypes.STRING, allowNull: false },
  aciklama: { type: DataTypes.STRING },
}, { timestamps: false });

module.exports = Galeri;
