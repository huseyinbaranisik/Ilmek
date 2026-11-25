// İncelemeler (Letterboxd kısmı): bir üye bir şarkıya 1-5 yıldız verir, isterse yorum yazar.
// Her üyenin her şarkı için tek incelemesi olur; tekrar gönderirse güncellenir.
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Inceleme = db.define("inceleme", {
  puan:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  yorum: { type: DataTypes.TEXT },
}, { timestamps: true, name: { singular: "inceleme", plural: "incelemeler" } });

module.exports = Inceleme;
