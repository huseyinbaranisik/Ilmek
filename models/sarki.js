// Şarkılar. Üyelerin yüklediği şarkılar admin onaylayana kadar (onayli=false) yayınlanmaz.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Sarki = db.define("sarki", {
  baslik:    { type: DataTypes.STRING, allowNull: false },
  slug:      { type: DataTypes.STRING, allowNull: false, unique: true }, // /sarki/sessiz-sokaklar
  sanatci:   { type: DataTypes.STRING, allowNull: false },
  album:     { type: DataTypes.STRING, allowNull: false },
  albumSlug: { type: DataTypes.STRING, allowNull: false },               // /album/gece-yarisi
  kapak:     { type: DataTypes.STRING, allowNull: false },               // kapak resminin yolu
  dosya:     { type: DataTypes.STRING, allowNull: false },               // ses dosyasının yolu
  renk:      { type: DataTypes.STRING(7), defaultValue: "#3C3489" },     // sayfa arka plan rengi
  dinlenme:  { type: DataTypes.INTEGER, defaultValue: 0 },
  onayli:    { type: DataTypes.BOOLEAN, defaultValue: false },
  // İncelemelerden hesaplanan ortalama puan (her inceleme eklenince/silinince güncellenir)
  ortPuan:        { type: DataTypes.FLOAT, defaultValue: 0 },
  incelemeSayisi: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: true, name: { singular: "sarki", plural: "sarkilar" } });

module.exports = Sarki;
