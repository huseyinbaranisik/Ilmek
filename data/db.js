// ============================================================
//  data/db.js - Veritabanı bağlantısı (Sequelize)
//
//  Derste:  new Sequelize("veritabani", "root", "sifre", { host: "localhost", dialect: "mysql" })
//  Burada MySQL yerine SQLite kullanıyoruz: kurulum gerektirmez,
//  veritabanı tek bir dosyadır (ilmek.db). Geri kalan Sequelize kodu derstekiyle aynı.
// ============================================================
const { Sequelize } = require("sequelize");
const path = require("path");

const db = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../ilmek.db"),
  logging: false,                         // SQL sorgularını konsola yazma
  define: { freezeTableName: true },      // tablo adı model adıyla aynı olsun (çoğul yapma)
});

async function connect() {
  try {
    await db.authenticate();
    console.log("Veri tabanına bağlandı");
  } catch (error) {
    console.error("Veri tabanına bağlanılamadı:", error);
  }
}
connect();

module.exports = db;
