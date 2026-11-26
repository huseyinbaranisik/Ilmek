// Admin paneli. router.use(isAdmin) sayesinde bu dosyadaki BÜTÜN adresler korunur.
const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin");
const isAdmin = require("../middleware/isAdmin");
const yukle = require("../helpers/yukle");

router.use(isAdmin);

router.get("/", adminController.panel);

router.get("/urunler", adminController.urunler);
router.post("/urunler/:id/onayla", adminController.urunOnayla);
router.post("/urunler/:id/sil", adminController.urunSil);

router.get("/kategoriler", adminController.kategoriler);
router.post("/kategoriler", adminController.kategoriEkle);
router.post("/kategoriler/:id/sil", adminController.kategoriSil);

router.get("/siparisler", adminController.siparisler);

router.get("/duyurular", adminController.duyurular);
router.post("/duyurular", adminController.duyuruEkle);
router.post("/duyurular/:id/sil", adminController.duyuruSil);

router.get("/sss", adminController.sss);
router.post("/sss/:id/cevapla", adminController.soruCevapla);
router.post("/sss/:id/sil", adminController.soruSil);

router.get("/galeri", adminController.galeri);
router.post("/galeri", yukle.single("resim"), adminController.galeriEkle);
router.post("/galeri/:id/sil", adminController.galeriSil);

router.get("/kullanicilar", adminController.kullanicilar);

module.exports = router;
