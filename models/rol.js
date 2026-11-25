// Kullanıcı rolleri (dersteki usercategory tablosu gibi): "Admin" ve "Üye"
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Rol = db.define("rol", {
  ad: { type: DataTypes.STRING(50), allowNull: false },
}, { timestamps: false });

module.exports = Rol;
