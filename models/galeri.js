// Resim galerisi. Resimler albümlere ayrılır (Örerken, İplikler, Atölyeden, Desenler).
// Resim dosyası klasörde durur, burada sadece adresi (URL) tutulur: "/img/galeri/pastel_yumaklar.jpg"
// İsteğe bağlı olarak bir örgücüye (mağazaya) bağlanabilir: kullaniciId (boş olabilir)
const { DataTypes } = require("sequelize");
const db = require("../data/db");

const Galeri = db.define("galeri", {
  resim:    { type: DataTypes.STRING, allowNull: false },
  aciklama: { type: DataTypes.STRING },
  album:    { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Atölyeden" },
}, { timestamps: false });

// Seçilebilecek albümler (admin formunda ve galeri sayfasındaki düğmelerde kullanılır)
Galeri.ALBUMLER = ["Örerken", "İplikler", "Atölyeden", "Desenler"];

module.exports = Galeri;
