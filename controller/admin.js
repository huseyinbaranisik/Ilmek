// ============================================================
//  controller/admin.js - Admin paneli
//  Bu fonksiyonlara sadece adminler ulaşabilir (routes/admin.js -> isAdmin)
// ============================================================
const { fn, col } = require("sequelize");
const Urun = require("../models/urun");
const Kategori = require("../models/kategori");
const Kullanici = require("../models/kullanici");
const Rol = require("../models/rol");
const Siparis = require("../models/siparis");
const Yorum = require("../models/yorum");
const Duyuru = require("../models/duyuru");
const Soru = require("../models/soru");
const Galeri = require("../models/galeri");
const { slugField, benzersizSlug } = require("../helpers/slugfield");
const db = require("../data/db");

// ---------- Özet ----------
exports.panel = async (req, res, next) => {
  try {
    const sayilar = {
      urun: await Urun.count({ where: { onayli: true } }),
      bekleyen: await Urun.count({ where: { onayli: false } }),
      kullanici: await Kullanici.count(),
      siparis: await Siparis.count(),
      teslim: await Siparis.count({ where: { durum: "teslim" } }),
      // Teslim edilen siparişlerin toplam tutarı (SUM)
      ciro: (await Siparis.sum("toplam", { where: { durum: "teslim" } })) || 0,
      yorum: await Yorum.count(),
      cevapsiz: await Soru.count({ where: { cevap: null } }),
      // Ara tablo (favori) Sequelize tarafından oluşturuldu, db.models içinden sayılır
      favori: await db.models.favori.count(),
    };
    // Durumlara göre sipariş sayıları: GROUP BY durum
    const durumlar = await Siparis.findAll({ attributes: ["durum", [fn("COUNT", col("id")), "sayi"]], group: ["durum"], raw: true });
    const populer = await Urun.findAll({ where: { onayli: true }, include: Kullanici, order: [["goruntulenme", "DESC"]], limit: 5 });
    res.render("admin/panel", { sayilar, durumlar, populer });
  } catch (err) {
    next(err);
  }
};

// ---------- Ürünler: onay bekleyenler + yayındakiler ----------
exports.urunler = async (req, res, next) => {
  try {
    const bekleyenler = await Urun.findAll({ where: { onayli: false }, include: [Kullanici, Kategori], order: [["id", "ASC"]] });
    const urunler = await Urun.findAll({ where: { onayli: true }, include: [Kullanici, Kategori], order: [["id", "DESC"]] });
    res.render("admin/urunler", { bekleyenler, urunler });
  } catch (err) {
    next(err);
  }
};

exports.urunOnayla = async (req, res, next) => {
  try {
    await Urun.update({ onayli: true }, { where: { id: req.params.id } });
    req.session.mesaj = { tur: "basari", metin: "Ürün onaylandı ve yayınlandı." };
    res.redirect("/admin/urunler");
  } catch (err) {
    next(err);
  }
};

exports.urunSil = async (req, res, next) => {
  try {
    await Urun.destroy({ where: { id: req.params.id } }); // yorumları ve siparişleri de silinir (CASCADE)
    req.session.mesaj = { tur: "basari", metin: "Ürün silindi." };
    res.redirect("/admin/urunler");
  } catch (err) {
    next(err);
  }
};

// ---------- Kategoriler ----------
exports.kategoriler = async (req, res, next) => {
  try {
    const kategoriler = await Kategori.findAll({ order: [["id", "ASC"]] });
    for (const k of kategoriler) k.urunSayisi = await Urun.count({ where: { kategoriId: k.id } });
    res.render("admin/kategoriler", { kategoriler });
  } catch (err) {
    next(err);
  }
};

exports.kategoriEkle = async (req, res, next) => {
  try {
    const ad = (req.body.ad || "").trim();
    const ikon = /^[a-z0-9-]{1,40}$/.test(req.body.ikon || "") ? req.body.ikon : "bag-heart"; // Bootstrap Icons adı
    if (!ad) {
      req.session.mesaj = { tur: "hata", metin: "Kategori adı boş olamaz." };
    } else {
      await Kategori.create({ ad: ad.slice(0, 50), ikon, slug: await benzersizSlug(Kategori, ad) });
      req.session.mesaj = { tur: "basari", metin: '"' + ad + '" kategorisi eklendi: /kategori/' + slugField(ad) };
    }
    res.redirect("/admin/kategoriler");
  } catch (err) {
    next(err);
  }
};

// İçinde ürün olan kategori silinemez (ürünler kategorisiz kalmasın)
exports.kategoriSil = async (req, res, next) => {
  try {
    if (await Urun.count({ where: { kategoriId: req.params.id } })) {
      req.session.mesaj = { tur: "hata", metin: "Bu kategoride ürün var, önce ürünleri başka kategoriye taşıyın." };
    } else {
      await Kategori.destroy({ where: { id: req.params.id } });
      req.session.mesaj = { tur: "basari", metin: "Kategori silindi." };
    }
    res.redirect("/admin/kategoriler");
  } catch (err) {
    next(err);
  }
};

// ---------- Siparişler: bütün siparişlere genel bakış ----------
exports.siparisler = async (req, res, next) => {
  try {
    const siparisler = await Siparis.findAll({
      include: [Urun, { model: Kullanici, as: "alici" }, { model: Kullanici, as: "satici" }],
      order: [["createdAt", "DESC"]],
    });
    res.render("admin/siparisler", { siparisler });
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
    const kullanicilar = await Kullanici.findAll({ include: Rol, order: [["id", "ASC"]] });
    for (const k of kullanicilar) {
      k.urunSayisi = await Urun.count({ where: { kullaniciId: k.id } });
      k.siparisSayisi = await Siparis.count({ where: { aliciId: k.id } });
    }
    res.render("admin/kullanicilar", { kullanicilar });
  } catch (err) {
    next(err);
  }
};
