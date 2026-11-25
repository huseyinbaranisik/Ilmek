// Sayaçlar. Şimdilik tek satır var: ad="ziyaretci"
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Sayac = db.define("sayac", {
  ad:    { type: DataTypes.STRING, primaryKey: true },
  deger: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: false });

module.exports = Sayac;
