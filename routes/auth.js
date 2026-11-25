// Giriş, kayıt, çıkış
const express = require("express");
const router = express.Router();
const authController = require("../controller/auth");

router.get("/giris", authController.getGiris);
router.post("/giris", authController.postGiris);
router.get("/kayit", authController.getKayit);
router.post("/kayit", authController.postKayit);
router.post("/cikis", authController.cikis);

module.exports = router;
