// ============================================================
//  İLMEK - El örgüsü ürünler pazarı
//  MYAZ470 İnternet ve Web Programlama dönem projesi
//
//  Çalıştırmak için:  npm install   ->   npm start
//  Adres:             http://localhost:3000
//  Yönetici girişi:   admin / admin123      Örnek satıcı: ayse / 123456      Örnek alıcı: can / 123456
//
//  Klasörler (derste kullanılan yapı):
//    data/db.js     -> veritabanı bağlantısı (Sequelize)
//    models/        -> tablolar (Sequelize modelleri)
//    routes/        -> hangi adres hangi fonksiyona gidecek
//    controller/    -> o adreste ne yapılacak
//    middleware/    -> her istekte ya da bazı isteklerde araya giren fonksiyonlar
//    helpers/       -> slugify, resim yükleme, online sayacı gibi yardımcılar
//    views/         -> EJS sayfaları
// ============================================================
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser"); // post edilen form verilerini req.body'ye koyar
const csurf = require("csurf");            // CSRF koruması

const db = require("./data/db");
const configSession = require("./middleware/config_Session");
const csrfToken = require("./middleware/csrf");
const locals = require("./middleware/locals");
const dummydata = require("./models/dummy-data");

const Rol = require("./models/rol");
const Kullanici = require("./models/kullanici");
const Kategori = require("./models/kategori");
const Urun = require("./models/urun");
const Siparis = require("./models/siparis");
const Yorum = require("./models/yorum");

const app = express();

// ---------- Görünüm motoru ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- Statik dosyalar (css, js, resimler) ----------
app.use(express.static(path.join(__dirname, "public")));
app.use("/vendor/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/vendor/icons", express.static(path.join(__dirname, "node_modules/bootstrap-icons/font")));
app.use("/vendor/inter", express.static(path.join(__dirname, "node_modules/@fontsource-variable/inter")));       // yazı tipleri
app.use("/vendor/fraunces", express.static(path.join(__dirname, "node_modules/@fontsource-variable/fraunces")));
app.use("/vendor/caveat", express.static(path.join(__dirname, "node_modules/@fontsource/caveat")));

// ---------- Middleware ----------
app.use(bodyParser.urlencoded({ extended: true })); // form verileri
app.use(bodyParser.json());                         // fetch ile gönderilen JSON (favori, nabız)
app.use(configSession);                             // oturum (session)
app.use(locals);                                    // sayaçlar ve ortak değişkenler
app.use(csurf());                                   // her POST isteğinde CSRF anahtarını kontrol et
app.use(csrfToken);                                 // anahtarı sayfalara gönder

// ---------- Routes ----------
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const hesapRouter = require("./routes/hesap");
const adminRouter = require("./routes/admin");
const sepetRouter = require("./routes/sepet");
app.use("/auth", authRouter);    // giriş, kayıt, çıkış
app.use("/hesap", hesapRouter);  // üyelerin işlemleri (ürün ekleme, gelen siparişler, yorum, favori)
app.use("/admin", adminRouter);  // admin paneli
app.use("/", sepetRouter);       // sepet, ödeme, sipariş sorgulama (misafir de kullanır)
app.use("/", userRouter);        // herkesin (misafirlerin de) görebildiği sayfalar

// ---------- İlişkiler ----------
// Bir rolün çok kullanıcısı olur, her kullanıcının bir rolü vardır (1 = Admin, 2 = Üye)
Rol.hasMany(Kullanici, { foreignKey: { allowNull: false, defaultValue: 2 }, onDelete: "RESTRICT" });
Kullanici.belongsTo(Rol);

// Bir kategoride çok ürün olur
Kategori.hasMany(Urun);
Urun.belongsTo(Kategori);

// Bir üye (satıcı) çok ürün ekleyebilir. urun.kullanici = ürünün satıcısı
Kullanici.hasMany(Urun, { onDelete: "CASCADE" });
Urun.belongsTo(Kullanici);

// Yorumlar: bir ürünün de, bir üyenin de çok yorumu olur
Urun.hasMany(Yorum, { onDelete: "CASCADE" });       // ürün silinince yorumları da silinir
Yorum.belongsTo(Urun);
Kullanici.hasMany(Yorum, { onDelete: "CASCADE" });
Yorum.belongsTo(Kullanici);

// Siparişler: bir siparişin bir ürünü ve bir satıcısı vardır.
// Alıcı üye ise aliciId dolu olur, misafir ise boş (null) kalır.
// Alıcı ve satıcı ikisi de Kullanici tablosunda olduğu için "as" ile isim veriyoruz.
Urun.hasMany(Siparis, { onDelete: "CASCADE" });
Siparis.belongsTo(Urun);
Siparis.belongsTo(Kullanici, { as: "alici", foreignKey: "aliciId" });
Siparis.belongsTo(Kullanici, { as: "satici", foreignKey: "saticiId" });

// Favoriler (çoka çok): bir üye çok ürünü favoriler, bir ürünü çok üye favoriler.
// Sequelize "favori" adında ara tablo oluşturur. "as" sayesinde uye.addFavori(urun),
// uye.hasFavori(urun), uye.getFavoriler() fonksiyonları kendiliğinden oluşur.
Kullanici.belongsToMany(Urun, { through: "favori", as: { singular: "favori", plural: "favoriler" } });
Urun.belongsToMany(Kullanici, { through: "favori", as: { singular: "favorileyen", plural: "favorileyenler" } });

// ---------- Sayfa bulunamadı (404) ----------
app.use((req, res) => {
  res.status(404).render("hata", { baslik: "Sayfa bulunamadı", aciklama: "Aradığınız sayfa yok ya da kaldırılmış." });
});

// ---------- Hata yakalama (dersteki gibi bütün hatalar buraya düşer) ----------
app.use((hata, req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : ""; // hata sayfasındaki formlar için
  if (hata.code === "EBADCSRFTOKEN") { // csurf'ün hatası: form anahtarı yok ya da yanlış
    return res.status(403).render("hata", { baslik: "Güvenlik hatası", aciklama: "Form doğrulanamadı (CSRF). Sayfayı yenileyip tekrar deneyin." });
  }
  console.log("Hata:", hata);
  res.status(500).render("hata", { baslik: "Bir hata oluştu", aciklama: "İşlem sırasında beklenmeyen bir hata oldu." });
});

// ---------- Veritabanını hazırla ve sunucuyu başlat ----------
const PORT = process.env.PORT || 3000;
(async () => {
  await db.sync();     // tablolar yoksa oluştur (derste: db.sync({ alter: true }))
  await dummydata();   // tablolar boşsa örnek verileri ekle
  app.listen(PORT, () => console.log("İlmek çalışıyor: http://localhost:" + PORT));
})();
