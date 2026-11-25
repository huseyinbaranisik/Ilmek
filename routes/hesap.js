// Üyelerin işlemleri. Hepsinde isAuth var: misafir buraya giremez, giriş sayfasına yönlenir.
const express = require("express");
const router = express.Router();
const hesapController = require("../controller/hesap");
const isAuth = require("../middleware/isAuth");
const yukle = require("../helpers/yukle");

// İnceleme (puan + yorum)
router.post("/inceleme/:sarkiId", isAuth, hesapController.incelemeKaydet);
router.post("/inceleme/:id/sil", isAuth, hesapController.incelemeSil);

// Listeler
router.post("/liste", isAuth, hesapController.listeOlustur);
router.post("/liste/:id/ekle", isAuth, hesapController.listeyeEkle);
router.post("/liste/:id/cikar/:sarkiId", isAuth, hesapController.listedenCikar);
router.post("/liste/:id/sil", isAuth, hesapController.listeSil);

// Beğen (kalp) ve takip et. İkisi de "aç / kapa" gibi çalışır: varsa kaldırır, yoksa ekler.
router.post("/begen/:sarkiId", isAuth, hesapController.begen);
router.post("/takip/:kullaniciAdi", isAuth, hesapController.takip);

// Şarkı yükleme (dosya yüklendiği için multer: yukle.fields)
router.get("/yukle", isAuth, hesapController.getYukle);
router.post("/yukle", isAuth, yukle.fields([{ name: "kapak" }, { name: "ses" }]), hesapController.postYukle);

module.exports = router;
