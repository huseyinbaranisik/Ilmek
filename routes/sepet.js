// Sepet, ödeme ve sipariş sorgulama. Misafir de kullanabildiği için isAuth YOK.
const express = require("express");
const router = express.Router();
const sepetController = require("../controller/sepet");

router.get("/sepet", sepetController.sepet);
router.get("/api/sepet", sepetController.sepetBilgisi);          // site.js sepetteki ürünlerin bilgisini buradan alır
router.get("/odeme", sepetController.odemeSayfasi);
router.post("/odeme", sepetController.odemeYap);
router.get("/siparis/:siparisNo", sepetController.siparisDetay);  // /siparis/IL-1732612345678
router.get("/siparis-sorgula", sepetController.siparisSorgula);   // ?no=...&eposta=...

module.exports = router;
