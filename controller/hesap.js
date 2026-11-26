// ============================================================
//  controller/hesap.js - Üyelerin işlemleri
//  Ürünlerim, gelen siparişler, siparişlerim, yorum, favori, hesap bilgileri
//  Bu fonksiyonlara sadece giriş yapmış kullanıcılar ulaşabilir (routes/hesap.js -> isAuth)
// ============================================================
const Urun = require("../models/urun");
const Kategori = require("../models/kategori");
const Kullanici = require("../models/kullanici");
const Siparis = require("../models/siparis");
const Yorum = require("../models/yorum");
const { benzersizSlug } = require("../helpers/slugfield");
const puanGuncelle = require("../helpers/puan");

// ================= ÜRÜNLERİM (satıcı) =================
exports.urunlerim = async (req, res, next) => {
  try {
    const urunler = await Urun.findAll({
      where: { kullaniciId: req.session.kullanici.id },
      include: Kategori,
      order: [["createdAt", "DESC"]],
    });
    res.render("hesap/urunlerim", { urunler: urunler });
  } catch (hata) {
    next(hata);
  }
};

// Hem "yeni ürün" hem "düzenle" aynı formu kullanır. Adreste :id varsa düzenleme.
exports.urunFormu = async (req, res, next) => {
  try {
    let urun = null;
    if (req.params.id) {
      urun = await Urun.findByPk(req.params.id);
      // Başkasının ürünüyse 404
      if (!urun || urun.kullaniciId != req.session.kullanici.id) return next();
    }
    const kategoriler = await Kategori.findAll({ order: [["ad", "ASC"]] });
    res.render("hesap/urun-formu", { urun: urun, kategoriler: kategoriler, IPLIKLER: Urun.IPLIKLER });
  } catch (hata) {
    next(hata);
  }
};

// Not: Dosya yüklenen formlarda (multipart) CSRF anahtarı adreste gelir: action="...?_csrf=..."
// Çünkü csurf, multer formu okumadan önce çalışır ve req.body henüz boştur.
exports.urunKaydet = async (req, res, next) => {
  try {
    const baslik = (req.body.baslik || "").trim();
    const aciklama = req.body.aciklama || "";
    const kategoriId = req.body.kategoriId;
    const fiyat = parseInt(req.body.fiyat);
    const stok = parseInt(req.body.stok);

    // İplik sadece listedekilerden biri olabilir
    let iplik = req.body.iplik;
    if (!Urun.IPLIKLER.includes(iplik)) iplik = "Yün";

    // Hazırlanma süresi 1-60 gün arası
    let hazirlikGunu = parseInt(req.body.hazirlikGunu);
    if (!(hazirlikGunu >= 1)) hazirlikGunu = 3;
    if (hazirlikGunu > 60) hazirlikGunu = 60;

    // Düzenleme mi?
    let urun = null;
    if (req.params.id) {
      urun = await Urun.findByPk(req.params.id);
      if (!urun || urun.kullaniciId != req.session.kullanici.id) return next();
    }
    let formAdresi = "/hesap/urun/yeni";
    if (urun) formAdresi = "/hesap/urun/" + urun.id + "/duzenle";

    // Kontroller
    const kategori = await Kategori.findByPk(kategoriId);
    if (baslik == "" || !(fiyat > 0) || !(stok >= 0) || !kategori) {
      req.session.mesaj = { tur: "hata", metin: "Ürün adı, kategori, 0'dan büyük fiyat ve stok zorunlu." };
      return res.redirect(formAdresi);
    }
    if (!urun && !req.file) {
      req.session.mesaj = { tur: "hata", metin: "Yeni ürün için bir resim seçmelisiniz (jpg, png, webp, gif, en fazla 5 MB)." };
      return res.redirect(formAdresi);
    }

    const veri = {
      baslik: baslik.slice(0, 100),
      aciklama: aciklama.slice(0, 3000),
      fiyat: fiyat,
      stok: stok,
      kategoriId: kategoriId,
      iplik: iplik,
      hazirlikGunu: hazirlikGunu,
    };
    // Resim dosyası klasöre kaydedildi (multer), veritabanına sadece adresini yazıyoruz
    if (req.file) veri.resim = "/img/yuklenen/" + req.file.filename;

    const admin = req.session.kullanici.admin;
    if (urun) {
      // Düzenlenen ürün admin değilse tekrar onaya düşer
      if (!admin) veri.onayli = false;
      await urun.update(veri);
      req.session.mesaj = { tur: "basari", metin: "Ürün güncellendi." };
    } else {
      veri.slug = await benzersizSlug(Urun, baslik);
      veri.onayli = admin;   // admin eklerse hemen yayında, üye eklerse onay bekler
      veri.kullaniciId = req.session.kullanici.id;
      await Urun.create(veri);
      if (admin) {
        req.session.mesaj = { tur: "basari", metin: "Ürün yayınlandı." };
      } else {
        req.session.mesaj = { tur: "basari", metin: "Ürün eklendi. Yönetici onaylayınca mağazanda görünecek." };
      }
    }
    res.redirect("/hesap/urunlerim");
  } catch (hata) {
    next(hata);
  }
};

exports.urunSil = async (req, res, next) => {
  try {
    const urun = await Urun.findByPk(req.params.id);
    if (urun && urun.kullaniciId == req.session.kullanici.id) {
      await urun.destroy();
      req.session.mesaj = { tur: "basari", metin: "Ürün silindi." };
    }
    res.redirect("/hesap/urunlerim");
  } catch (hata) {
    next(hata);
  }
};

// ================= SİPARİŞLER =================
// Alıcı olarak verdiğim siparişler
exports.siparislerim = async (req, res, next) => {
  try {
    const siparisler = await Siparis.findAll({
      where: { aliciId: req.session.kullanici.id },
      include: [Urun, { model: Kullanici, as: "satici" }],
      order: [["createdAt", "DESC"]],
    });
    // Hangi ürünlere zaten yorum yazmış ("Yorum yaz" / "Yorumunu düzenle" düğmesi için)
    const yorumlar = await Yorum.findAll({ where: { kullaniciId: req.session.kullanici.id } });
    const yorumlananlar = [];
    for (const y of yorumlar) yorumlananlar.push(y.urunId);
    res.render("hesap/siparislerim", { siparisler: siparisler, yorumlananlar: yorumlananlar });
  } catch (hata) {
    next(hata);
  }
};

// Satıcı olarak bana gelen siparişler
exports.gelenSiparisler = async (req, res, next) => {
  try {
    const siparisler = await Siparis.findAll({
      where: { saticiId: req.session.kullanici.id },
      include: Urun,
      order: [["createdAt", "DESC"]],
    });
    res.render("hesap/gelen-siparisler", { siparisler: siparisler });
  } catch (hata) {
    next(hata);
  }
};

// Satıcı sipariş durumunu ilerletir: hazırlanıyor -> kargoda -> teslim
exports.siparisDurum = async (req, res, next) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id);
    if (!siparis || siparis.saticiId != req.session.kullanici.id) return next();

    const yeniDurum = req.body.durum;
    // Sadece sıradaki duruma geçilebilir
    let dogruMu = false;
    if (siparis.durum == "hazirlaniyor" && yeniDurum == "kargoda") dogruMu = true;
    if (siparis.durum == "kargoda" && yeniDurum == "teslim") dogruMu = true;

    if (!dogruMu) {
      req.session.mesaj = { tur: "hata", metin: "Bu sipariş bu duruma geçirilemez." };
    } else {
      await siparis.update({ durum: yeniDurum });
      req.session.mesaj = { tur: "basari", metin: "Sipariş durumu: " + Siparis.DURUMLAR[yeniDurum].ad };
    }
    res.redirect("/hesap/gelen-siparisler");
  } catch (hata) {
    next(hata);
  }
};

// ================= YORUM =================
// Sadece ürünü teslim almış üye yorum yazabilir. Daha önce yazdıysa güncellenir.
exports.yorumKaydet = async (req, res, next) => {
  try {
    const urun = await Urun.findByPk(req.params.urunId);
    if (!urun) return next();
    const benimId = req.session.kullanici.id;

    const teslimAldi = await Siparis.findOne({ where: { urunId: urun.id, aliciId: benimId, durum: "teslim" } });
    if (!teslimAldi) {
      req.session.mesaj = { tur: "hata", metin: "Sadece teslim aldığınız ürünlere yorum yazabilirsiniz." };
      return res.redirect("/urun/" + urun.slug);
    }
    const puan = parseInt(req.body.puan);
    if (!(puan >= 1 && puan <= 5)) {
      req.session.mesaj = { tur: "hata", metin: "Lütfen 1 ile 5 arasında bir puan seçin." };
      return res.redirect("/urun/" + urun.slug);
    }
    const metin = (req.body.metin || "").trim().slice(0, 2000);

    const eskiYorum = await Yorum.findOne({ where: { urunId: urun.id, kullaniciId: benimId } });
    if (eskiYorum) {
      await eskiYorum.update({ puan: puan, metin: metin });
    } else {
      await Yorum.create({ puan: puan, metin: metin, urunId: urun.id, kullaniciId: benimId });
    }
    await puanGuncelle(urun.id); // ortalama puanı yeniden hesapla
    req.session.mesaj = { tur: "basari", metin: "Yorumun kaydedildi, teşekkürler!" };
    res.redirect("/urun/" + urun.slug + "#yorumlar");
  } catch (hata) {
    next(hata);
  }
};

// Yorumu sadece yazan kişi ya da admin silebilir
exports.yorumSil = async (req, res, next) => {
  try {
    const yorum = await Yorum.findByPk(req.params.id, { include: Urun });
    const ben = req.session.kullanici;
    if (yorum && (yorum.kullaniciId == ben.id || ben.admin)) {
      await yorum.destroy();
      await puanGuncelle(yorum.urunId);
      req.session.mesaj = { tur: "basari", metin: "Yorum silindi." };
      return res.redirect("/urun/" + yorum.urun.slug);
    }
    res.redirect("/");
  } catch (hata) {
    next(hata);
  }
};

// ================= FAVORİ =================
// Kalp düğmesi fetch ile buraya POST atar (public/js/site.js), cevap JSON'dur.
exports.favori = async (req, res, next) => {
  try {
    const urun = await Urun.findOne({ where: { id: req.params.urunId, onayli: true } });
    if (!urun) return res.status(404).json({ hata: "Ürün bulunamadı" });
    const ben = await Kullanici.findByPk(req.session.kullanici.id);
    const favorideMi = await ben.hasFavori(urun);   // ara tabloda (favori) satır var mı?
    if (favorideMi) {
      await ben.removeFavori(urun);   // varsa sil
    } else {
      await ben.addFavori(urun);      // yoksa ekle
    }
    res.json({ favori: !favorideMi });
  } catch (hata) {
    next(hata);
  }
};

exports.favorilerim = async (req, res, next) => {
  try {
    const ben = await Kullanici.findByPk(req.session.kullanici.id);
    const urunler = await ben.getFavoriler({ where: { onayli: true }, include: [Kullanici] });
    res.render("hesap/favorilerim", { urunler: urunler });
  } catch (hata) {
    next(hata);
  }
};

// ================= HESAP BİLGİLERİM =================
// Teslimat bilgileri (alışverişte tekrar sorulmaz) ve mağaza bilgileri
exports.bilgilerim = async (req, res, next) => {
  try {
    const ben = await Kullanici.findByPk(req.session.kullanici.id);
    res.render("hesap/bilgilerim", { ben: ben });
  } catch (hata) {
    next(hata);
  }
};

exports.bilgilerimKaydet = async (req, res, next) => {
  try {
    const ben = await Kullanici.findByPk(req.session.kullanici.id);
    const telefon = (req.body.telefon || "").replace(/\s/g, "");
    if (telefon != "" && !/^0?5\d{9}$/.test(telefon)) {
      req.session.mesaj = { tur: "hata", metin: "Telefon numarası 05xx xxx xx xx şeklinde olmalı." };
      return res.redirect("/hesap/bilgilerim");
    }
    await ben.update({
      adSoyad: (req.body.adSoyad || "").trim().slice(0, 80),
      telefon: telefon,
      eposta: (req.body.eposta || "").trim().slice(0, 100),
      adres: (req.body.adres || "").trim().slice(0, 500),
      magazaAdi: (req.body.magazaAdi || "").trim().slice(0, 60),
      sehir: (req.body.sehir || "").trim().slice(0, 40),
      hakkinda: (req.body.hakkinda || "").trim().slice(0, 1000),
    });
    req.session.mesaj = { tur: "basari", metin: "Bilgilerin kaydedildi." };
    res.redirect("/hesap/bilgilerim");
  } catch (hata) {
    next(hata);
  }
};
