// Üyelerin işlemleri. router.use(isAuth) sayesinde bu dosyadaki BÜTÜN adresler korunur:
// misafir buraya giremez, giriş sayfasına yönlenir.
const express = require("express");
const router = express.Router();
const hesapController = require("../controller/hesap");
const isAuth = require("../middleware/isAuth");
const yukle = require("../helpers/yukle");

router.use(isAuth);

// Ürünlerim: ekle, düzenle, sil (resim yüklendiği için multer: yukle.single)
router.get("/urunlerim", hesapController.urunlerim);
router.get("/urun/yeni", hesapController.urunFormu);
router.post("/urun/yeni", yukle.single("resim"), hesapController.urunKaydet);
router.get("/urun/:id/duzenle", hesapController.urunFormu);
router.post("/urun/:id/duzenle", yukle.single("resim"), hesapController.urunKaydet);
router.post("/urun/:id/sil", hesapController.urunSil);

// Siparişler
router.get("/siparislerim", hesapController.siparislerim);         // alıcı olarak verdiklerim
router.get("/gelen-siparisler", hesapController.gelenSiparisler);  // satıcı olarak bana gelenler
router.post("/siparis/:id/durum", hesapController.siparisDurum);   // satıcı: kargoda, teslim

// Yorum (sadece teslim alınan ürüne)
router.post("/yorum/:urunId", hesapController.yorumKaydet);
router.post("/yorum/:id/sil", hesapController.yorumSil);

// Favori
router.post("/favori/:urunId", hesapController.favori);
router.get("/favorilerim", hesapController.favorilerim);

// Hesap bilgilerim: adres, telefon (alışverişte tekrar sorulmaz) ve mağaza bilgileri
router.get("/bilgilerim", hesapController.bilgilerim);
router.post("/bilgilerim", hesapController.bilgilerimKaydet);

module.exports = router;
