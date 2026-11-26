// Duyurular (dersteki anc modeli gibi)
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Duyuru = db.define("duyuru", {
  baslik: { type: DataTypes.STRING, allowNull: false },
  slug:   { type: DataTypes.STRING, allowNull: false, unique: true }, // /duyuru/kis-koleksiyonu-yayinda
  icerik: { type: DataTypes.TEXT, allowNull: false },
  tarih:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Duyuru;
