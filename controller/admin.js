// ============================================================
//  controller/admin.js - Admin paneli
//  Bu fonksiyonlara sadece adminler ulaşabilir (routes/admin.js -> isAdmin)
// ============================================================
const Sarki = require("../models/sarki");
const Kullanici = require("../models/kullanici");
const Rol = require("../models/rol");
const Inceleme = require("../models/inceleme");
const Duyuru = require("../models/duyuru");
const Soru = require("../models/soru");
const Galeri = require("../models/galeri");
const { benzersizSlug } = require("../helpers/slugfield");

// ---------- Özet ----------
exports.panel = async (req, res, next) => {
  try {
    const sayilar = {
      sarki: await Sarki.count({ where: { onayli: true } }),
      bekleyen: await Sarki.count({ where: { onayli: false } }),
      kullanici: await Kullanici.count(),
      inceleme: await Inceleme.count(),
      cevapsiz: await Soru.count({ where: { cevap: null } }),
    };
    const populer = await Sarki.findAll({ where: { onayli: true }, order: [["dinlenme", "DESC"]], limit: 5 });
    res.render("admin/panel", { sayilar, populer });
  } catch (err) {
    next(err);
  }
};

// ---------- Şarkılar: onay bekleyenler + yayındakiler ----------
exports.sarkilar = async (req, res, next) => {
  try {
    const bekleyenler = await Sarki.findAll({ where: { onayli: false }, include: Kullanici, order: [["id", "ASC"]] });
    const sarkilar = await Sarki.findAll({ where: { onayli: true }, include: Kullanici, order: [["id", "DESC"]] });
    res.render("admin/sarkilar", { bekleyenler, sarkilar });
  } catch (err) {
    next(err);
  }
};

exports.sarkiOnayla = async (req, res, next) => {
  try {
    await Sarki.update({ onayli: true }, { where: { id: req.params.id } });
    req.session.mesaj = { tur: "basari", metin: "Şarkı onaylandı ve yayınlandı." };
    res.redirect("/admin/sarkilar");
  } catch (err) {
    next(err);
  }
};

exports.sarkiSil = async (req, res, next) => {
  try {
    await Sarki.destroy({ where: { id: req.params.id } }); // incelemeleri de silinir (CASCADE)
    req.session.mesaj = { tur: "basari", metin: "Şarkı silindi." };
    res.redirect("/admin/sarkilar");
  } catch (err) {
    next(err);
  }
};

// ---------- Duyurular ----------
exports.duyurular = async (req, res, next) => {
  try {
    const duyurular = await Duyuru.findAll({ order: [["tarih", "DESC"]] });
    res.render("admin/duyurular", { duyurular });
  } catch (err) {
    next(err);
  }
};

exports.duyuruEkle = async (req, res, next) => {
  try {
    const { baslik, icerik } = req.body;
    if (!baslik || !icerik) {
      req.session.mesaj = { tur: "hata", metin: "Başlık ve içerik zorunlu." };
    } else {
      await Duyuru.create({ baslik, icerik, slug: await benzersizSlug(Duyuru, baslik) });
      req.session.mesaj = { tur: "basari", metin: "Duyuru yayınlandı." };
    }
    res.redirect("/admin/duyurular");
  } catch (err) {
    next(err);
  }
};

exports.duyuruSil = async (req, res, next) => {
  try {
    await Duyuru.destroy({ where: { id: req.params.id } });
    res.redirect("/admin/duyurular");
  } catch (err) {
    next(err);
  }
};

// ---------- S.S.S. ----------
exports.sss = async (req, res, next) => {
  try {
    // Önce cevapsızlar, sonra yenileri
    const sorular = await Soru.findAll({ order: [["yayinda", "ASC"], ["id", "DESC"]] });
    res.render("admin/sss", { sorular });
  } catch (err) {
    next(err);
  }
};

exports.soruCevapla = async (req, res, next) => {
  try {
    const cevap = (req.body.cevap || "").trim();
    if (cevap) await Soru.update({ cevap, yayinda: true }, { where: { id: req.params.id } });
    res.redirect("/admin/sss");
  } catch (err) {
    next(err);
  }
};

exports.soruSil = async (req, res, next) => {
  try {
    await Soru.destroy({ where: { id: req.params.id } });
    res.redirect("/admin/sss");
  } catch (err) {
    next(err);
  }
};

// ---------- Galeri ----------
exports.galeri = async (req, res, next) => {
  try {
    const resimler = await Galeri.findAll({ order: [["id", "DESC"]] });
    res.render("admin/galeri", { resimler });
  } catch (err) {
    next(err);
  }
};

exports.galeriEkle = async (req, res, next) => {
  try {
    if (!req.file) {
      req.session.mesaj = { tur: "hata", metin: "Geçerli bir resim seçin (jpg, png, webp, gif)." };
    } else {
      await Galeri.create({ resim: "/img/yuklenen/" + req.file.filename, aciklama: req.body.aciklama || "" });
      req.session.mesaj = { tur: "basari", metin: "Resim galeriye eklendi." };
    }
    res.redirect("/admin/galeri");
  } catch (err) {
    next(err);
  }
};

exports.galeriSil = async (req, res, next) => {
  try {
    await Galeri.destroy({ where: { id: req.params.id } });
    res.redirect("/admin/galeri");
  } catch (err) {
    next(err);
  }
};

// ---------- Kullanıcılar ----------
exports.kullanicilar = async (req, res, next) => {
  try {
    const kullanicilar = await Kullanici.findAll({ include: [Rol, Inceleme], order: [["id", "ASC"]] });
    res.render("admin/kullanicilar", { kullanicilar });
  } catch (err) {
    next(err);
  }
};
