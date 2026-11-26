// ============================================================
//  helpers/yukle.js - Resim yükleme (multer)
//  Ürün ve galeri resimleri public/img/yuklenen/ klasörüne kaydedilir.
//  Veritabanına dosyanın kendisi değil, sadece adresi (URL) yazılır: "/img/yuklenen/123.jpg"
// ============================================================
const multer = require("multer");
const path = require("path");

const resimUzantilari = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const yukle = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "../public/img/yuklenen"),
    // Dosya adı çakışmasın diye: zaman + rastgele sayı + uzantı
    filename: (req, dosya, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + path.extname(dosya.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // en fazla 5 MB
  fileFilter: (req, dosya, cb) => {       // sadece resim uzantıları kabul edilir
    cb(null, resimUzantilari.includes(path.extname(dosya.originalname).toLowerCase()));
  },
});

module.exports = yukle;
