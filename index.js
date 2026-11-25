// ============================================================
//  GRAMOFY - Müzik dinleme ve puanlama sitesi (Spotify + Letterboxd)
//  MYAZ470 İnternet ve Web Programlama dönem projesi
//
//  Çalıştırmak için:  npm install   ->   npm start
//  Adres:             http://localhost:3000
//  Yönetici girişi:   admin / admin123      Örnek üye: deniz / 123456
//
//  Klasörler (derste kullanılan yapı):
//    data/db.js     -> veritabanı bağlantısı (Sequelize)
//    models/        -> tablolar (Sequelize modelleri)
//    routes/        -> hangi adres hangi fonksiyona gidecek
//    controller/    -> o adreste ne yapılacak
//    middleware/    -> her istekte ya da bazı isteklerde araya giren fonksiyonlar
//    helpers/       -> slugify, dosya yükleme, online sayacı gibi yardımcılar
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
const Sarki = require("./models/sarki");
const Inceleme = require("./models/inceleme");
const Liste = require("./models/liste");

const app = express();

// ---------- Görünüm motoru ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- Statik dosyalar (css, js, resim, müzik) ----------
app.use(express.static(path.join(__dirname, "public")));
app.use("/vendor/bootstrap", express.static(path.join(__dirname, "node_modules/bootstrap/dist")));
app.use("/vendor/icons", express.static(path.join(__dirname, "node_modules/bootstrap-icons/font")));
app.use("/vendor/inter", express.static(path.join(__dirname, "node_modules/@fontsource-variable/inter"))); // yazı tipi

// ---------- Middleware ----------
app.use(bodyParser.urlencoded({ extended: true })); // form verileri
app.use(bodyParser.json());                         // oynatıcının fetch ile gönderdiği JSON
app.use(configSession);                             // oturum (session)
app.use(locals);                                    // sayaçlar ve ortak değişkenler
app.use(csurf());                                   // her POST isteğinde CSRF anahtarını kontrol et
app.use(csrfToken);                                 // anahtarı sayfalara gönder

// ---------- Routes ----------
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const hesapRouter = require("./routes/hesap");
const adminRouter = require("./routes/admin");
app.use("/auth", authRouter);    // giriş, kayıt, çıkış
app.use("/hesap", hesapRouter);  // üyelerin işlemleri (inceleme, liste, şarkı yükleme)
app.use("/admin", adminRouter);  // admin paneli
app.use("/", userRouter);        // herkesin (misafirlerin de) görebildiği sayfalar

// ---------- İlişkiler ----------
// Bir rolün çok kullanıcısı olur, her kullanıcının bir rolü vardır (1 = Admin, 2 = Üye)
Rol.hasMany(Kullanici, { foreignKey: { allowNull: false, defaultValue: 2 }, onDelete: "RESTRICT" });
Kullanici.belongsTo(Rol);

// Bir kullanıcı çok şarkı yükleyebilir
Kullanici.hasMany(Sarki);
Sarki.belongsTo(Kullanici);

// Bir kullanıcının çok incelemesi olur, bir şarkının çok incelemesi olur
Kullanici.hasMany(Inceleme, { onDelete: "CASCADE" });
Inceleme.belongsTo(Kullanici);
Sarki.hasMany(Inceleme, { onDelete: "CASCADE" }); // şarkı silinince incelemeleri de silinir
Inceleme.belongsTo(Sarki);

// Bir kullanıcının çok listesi olur
Kullanici.hasMany(Liste, { onDelete: "CASCADE" });
Liste.belongsTo(Kullanici);

// Bir listede çok şarkı, bir şarkı da çok listede olabilir (çoka çok).
// Sequelize bunun için "listeSarki" adında ara tablo oluşturur.
Liste.belongsToMany(Sarki, { through: "listeSarki" });
Sarki.belongsToMany(Liste, { through: "listeSarki" });

// Beğenilen şarkılar (Spotify'daki kalp): bir üye çok şarkı beğenir, bir şarkıyı çok üye beğenir.
// "as" ile isim verdik çünkü Kullanici-Sarki arasında "yükledikleri" ilişkisi zaten var.
// Bu sayede uye.addBegenilen(sarki), uye.hasBegenilen(sarki), uye.getBegenilenler() kullanılabilir.
Kullanici.belongsToMany(Sarki, { through: "begeni", as: { singular: "begenilen", plural: "begenilenler" } });
Sarki.belongsToMany(Kullanici, { through: "begeni", as: { singular: "begenen", plural: "begenenler" } });

// Takip: bir üye başka üyeleri takip eder (kullanıcının kendisiyle çoka çok ilişkisi).
// "takip" tablosunda takipciId (takip eden) ve takipEdilenId (takip edilen) sütunları olur.
Kullanici.belongsToMany(Kullanici, { through: "takip", as: { singular: "takipEdilen", plural: "takipEdilenler" }, foreignKey: "takipciId", otherKey: "takipEdilenId" });
Kullanici.belongsToMany(Kullanici, { through: "takip", as: { singular: "takipci", plural: "takipciler" }, foreignKey: "takipEdilenId", otherKey: "takipciId" });

// ---------- Sayfa bulunamadı (404) ----------
app.use((req, res) => {
  res.status(404).render("hata", { baslik: "Sayfa bulunamadı", aciklama: "Aradığınız sayfa yok ya da kaldırılmış." });
});

// ---------- Hata yakalama (dersteki gibi bütün hatalar buraya düşer) ----------
app.use((err, req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : ""; // hata sayfasındaki formlar için
  if (err.code === "EBADCSRFTOKEN") { // csurf'ün hatası: form anahtarı yok ya da yanlış
    return res.status(403).render("hata", { baslik: "Güvenlik hatası", aciklama: "Form doğrulanamadı (CSRF). Sayfayı yenileyip tekrar deneyin." });
  }
  console.log("Hata:", err);
  res.status(500).render("hata", { baslik: "Bir hata oluştu", aciklama: "İşlem sırasında beklenmeyen bir hata oldu." });
});

// ---------- Veritabanını hazırla ve sunucuyu başlat ----------
(async () => {
  await db.sync();     // tablolar yoksa oluştur (derste: db.sync({ alter: true }))
  await dummydata();   // tablolar boşsa örnek verileri ekle
  app.listen(3000, () => console.log("Gramofy çalışıyor: http://localhost:3000"));
})();
