// ============================================================
//  controller/auth.js - Giriş, kayıt, çıkış (dersteki controller/auth.js gibi)
//  Şifreler bcrypt ile hash'lenir: bcrypt.hash() kaydederken, bcrypt.compare() girişte.
// ============================================================
const bcrypt = require("bcrypt");
const Kullanici = require("../models/kullanici");
const Rol = require("../models/rol");

// Giriş başarılı olunca oturuma kullanıcı bilgisini yazar
function oturumAc(req, kullanici) {
  req.session.isAuth = 1;
  req.session.kullanici = {
    id: kullanici.id,
    ad: kullanici.kullaniciAdi,
    admin: kullanici.rol.ad === "Admin",
  };
}

// Sadece site içi adreslere geri dön (başka siteye yönlendirmeyi engeller)
function donusAdresi(req, varsayilan) {
  const url = req.query.url || "";
  return url.startsWith("/") && !url.startsWith("//") ? url : varsayilan;
}

exports.getGiris = (req, res) => {
  res.render("giris", { hata: null, url: req.query.url || "" });
};

exports.postGiris = async (req, res, next) => {
  try {
    const kullanici = await Kullanici.findOne({
      where: { kullaniciAdi: req.body.kullaniciAdi || "" },
      include: Rol,
    });
    // Kullanıcı yoksa ya da şifre uyuşmuyorsa
    if (!kullanici || !(await bcrypt.compare(req.body.sifre || "", kullanici.sifre))) {
      return res.render("giris", { hata: "Kullanıcı adı veya şifre hatalı.", url: req.query.url || "" });
    }
    oturumAc(req, kullanici);
    res.redirect(donusAdresi(req, kullanici.rol.ad === "Admin" ? "/admin" : "/"));
  } catch (err) {
    next(err);
  }
};

exports.getKayit = (req, res) => {
  res.render("kayit", { hata: null });
};

exports.postKayit = async (req, res, next) => {
  try {
    const kullaniciAdi = (req.body.kullaniciAdi || "").trim();
    const sifre = req.body.sifre || "";
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(kullaniciAdi) || sifre.length < 6) {
      return res.render("kayit", { hata: "Kullanıcı adı 3-20 karakter (harf, rakam, _) ve şifre en az 6 karakter olmalı." });
    }
    if (await Kullanici.findOne({ where: { kullaniciAdi } })) {
      return res.render("kayit", { hata: "Bu kullanıcı adı alınmış." });
    }
    const yeni = await Kullanici.create({
      kullaniciAdi,
      sifre: await bcrypt.hash(sifre, 10), // 10 = hash'leme turu (salt rounds)
      rolId: 2,                            // yeni kayıtlar "Üye" olur
    });
    oturumAc(req, await Kullanici.findByPk(yeni.id, { include: Rol }));
    req.session.mesaj = { tur: "basari", metin: "Hoş geldin " + kullaniciAdi + "! Artık sipariş verebilir, ürünleri favorilerine ekleyebilir ve kendi mağazanı açabilirsin." };
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};

exports.cikis = async (req, res) => {
  delete req.session.isAuth;
  delete req.session.kullanici;
  res.redirect("/");
};
