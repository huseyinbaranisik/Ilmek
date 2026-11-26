// Üyelerin işlemleri. router.use(isAuth) sayesinde bu dosyadaki BÜTÜN adresler korunur:
// misafir buraya giremez, giriş sayfasına yönlenir.
const express = require("express");
const router = express.Router();
const hesapController = require("../controller/hesap");
const isAuth = require("../middleware/isAuth");
const yukle = require("../helpers/yukle");

router.use(isAuth);

// Satıcı: ürünlerim, ürün ekle / düzenle / sil (resim yüklendiği için multer: yukle.single)
router.get("/urunlerim", hesapController.urunlerim);
router.get("/urun/yeni", hesapController.urunFormu);
router.post("/urun/yeni", yukle.single("resim"), hesapController.urunKaydet);
router.get("/urun/:id/duzenle", hesapController.urunFormu);
router.post("/urun/:id/duzenle", yukle.single("resim"), hesapController.urunKaydet);
router.post("/urun/:id/sil", hesapController.urunSil);

// Sipariş: alıcı talep gönderir ve iptal eder, satıcı durumu günceller
router.post("/siparis/:urunId", hesapController.siparisVer);
router.get("/siparislerim", hesapController.siparislerim);          // alıcı olarak verdiklerim
router.get("/gelen-siparisler", hesapController.gelenSiparisler);   // satıcı olarak bana gelenler
router.post("/siparis/:id/durum", hesapController.siparisDurum);    // satıcı: kabul, kargo, teslim, ret
router.post("/siparis/:id/iptal", hesapController.siparisIptal);    // alıcı: onaylanmadan önce iptal

// Yorum (sadece teslim alınan ürüne)
router.post("/yorum/:urunId", hesapController.yorumKaydet);
router.post("/yorum/:id/sil", hesapController.yorumSil);

// Favori ve mağaza takibi. İkisi de "aç / kapa" gibi çalışır: varsa kaldırır, yoksa ekler.
router.post("/favori/:urunId", hesapController.favori);
router.get("/favorilerim", hesapController.favorilerim);
router.post("/takip/:kullaniciAdi", hesapController.takip);

// Mağaza ayarları (mağaza adı, şehir, hakkında)
router.get("/magaza", hesapController.magazaAyarlari);
router.post("/magaza", hesapController.magazaKaydet);

module.exports = router;
