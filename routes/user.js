// Herkesin (misafirlerin de) girebildiği sayfalar
const express = require("express");
const router = express.Router();
const controllerUser = require("../controller/user");

router.get("/", controllerUser.anaSayfa);                     // ana sayfa + arama (?q=)
router.get("/urunler", controllerUser.urunler);               // bütün ürünler (?sirala=ucuz&min=100&max=500)
router.get("/kategori/:slug", controllerUser.urunler);        // /kategori/seramik
router.get("/urun/:slug", controllerUser.urun);               // /urun/el-orgusu-bere
router.get("/magazalar", controllerUser.magazalar);
router.get("/magaza/:kullaniciAdi", controllerUser.magaza);   // /magaza/ayse
router.get("/galeri", controllerUser.galeri);
router.get("/duyurular", controllerUser.duyurular);
router.get("/duyuru/:slug", controllerUser.duyuru);
router.get("/sss", controllerUser.sss);
router.post("/sss", controllerUser.soruGonder);
router.get("/site-haritasi", controllerUser.siteHaritasi);
router.get("/sitemap.xml", controllerUser.sitemapXml);

// Sayfadaki script'in (public/js/site.js) fetch ile çağırdığı adres
router.post("/api/nabiz", controllerUser.nabiz);

module.exports = router;
