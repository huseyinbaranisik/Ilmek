// S.S.S. soruları. Ziyaretçi gönderir, admin cevaplayınca yayinda=true olur.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Soru = db.define("soru", {
  soru:    { type: DataTypes.TEXT, allowNull: false },
  cevap:   { type: DataTypes.TEXT },
  yayinda: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });

module.exports = Soru;
