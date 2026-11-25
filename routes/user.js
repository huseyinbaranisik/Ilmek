// Herkesin (misafirlerin de) girebildiği sayfalar
const express = require("express");
const router = express.Router();
const controllerUser = require("../controller/user");

router.get("/", controllerUser.anaSayfa);                     // ana sayfa + arama (?q=)
router.get("/albumler", controllerUser.albumler);
router.get("/album/:slug", controllerUser.album);             // /album/gece-yarisi
router.get("/sarki/:slug", controllerUser.sarki);             // /sarki/sessiz-sokaklar
router.get("/kitaplik", controllerUser.kitaplik);             // plak kılıfları rafı
router.get("/listeler", controllerUser.listeler);
router.get("/liste/:slug", controllerUser.liste);             // /liste/sabah-enerjisi
router.get("/uyeler", controllerUser.uyeler);                 // bütün üyeler
router.get("/uye/:kullaniciAdi", controllerUser.profil);      // /uye/deniz
router.get("/uye/:kullaniciAdi/begeniler", controllerUser.begeniler); // deniz'in beğendiği şarkılar
router.get("/galeri", controllerUser.galeri);
router.get("/duyurular", controllerUser.duyurular);
router.get("/duyuru/:slug", controllerUser.duyuru);
router.get("/sss", controllerUser.sss);
router.post("/sss", controllerUser.soruGonder);
router.get("/site-haritasi", controllerUser.siteHaritasi);
router.get("/sitemap.xml", controllerUser.sitemapXml);

// Oynatıcının (public/js/oynatici.js) fetch ile çağırdığı adresler
router.post("/api/nabiz", controllerUser.nabiz);
router.post("/api/dinlendi/:id", controllerUser.dinlendi);

module.exports = router;
