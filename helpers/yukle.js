// ============================================================
//  helpers/yukle.js - Dosya yükleme (multer)
//  Resimler (kapak, galeri) public/img/yuklenen/ klasörüne,
//  müzikler public/muzik/yuklenen/ klasörüne kaydedilir.
//  Veritabanına dosyanın kendisi değil, sadece adresi (URL) yazılır: "/img/yuklenen/123.jpg"
// ============================================================
const multer = require("multer");
const path = require("path");

const resimUzantilari = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const sesUzantilari = [".mp3", ".wav", ".ogg"];

const yukle = multer({
  storage: multer.diskStorage({
    // Formdaki alanın adına göre klasör seçilir: "ses" alanı müzik, diğerleri resim
    destination: (req, dosya, cb) => cb(null, path.join(__dirname, dosya.fieldname === "ses" ? "../public/muzik/yuklenen" : "../public/img/yuklenen")),
    // Dosya adı çakışmasın diye: zaman + rastgele sayı + uzantı
    filename: (req, dosya, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(dosya.originalname).toLowerCase()),
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // en fazla 20 MB
  fileFilter: (req, dosya, cb) => {       // sadece izin verilen uzantılar kabul edilir
    const uzanti = path.extname(dosya.originalname).toLowerCase();
    const izinli = dosya.fieldname === "ses" ? sesUzantilari : resimUzantilari;
    cb(null, izinli.includes(uzanti));
  },
});

module.exports = yukle;
