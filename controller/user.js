// ============================================================
//  controller/user.js - Herkesin (misafirlerin de) görebildiği sayfalar
//  Not: Sadece onaylı (onayli: true) ürünler gösterilir.
// ============================================================
const { Op } = require("sequelize");
const Urun = require("../models/urun");
const Kategori = require("../models/kategori");
const Kullanici = require("../models/kullanici");
const Yorum = require("../models/yorum");
const Siparis = require("../models/siparis");
const Duyuru = require("../models/duyuru");
const Soru = require("../models/soru");
const Galeri = require("../models/galeri");
const { onlineSayisi } = require("../helpers/canli");

// Ürün listelerinde sıralama seçenekleri (?sirala=...)
const SIRALAMALAR = {
  yeni:   { ad: "En yeni",        sira: [["createdAt", "DESC"]] },
  ucuz:   { ad: "Fiyat (artan)",  sira: [["fiyat", "ASC"]] },
  pahali: { ad: "Fiyat (azalan)", sira: [["fiyat", "DESC"]] },
  puan:   { ad: "En beğenilen",   sira: [["ortPuan", "DESC"], ["yorumSayisi", "DESC"]] },
};

// ---------- Ana sayfa (+ arama) ----------
exports.anaSayfa = async (req, res, next) => {
  try {
    // Arama kutusundan geldiyse (?q=kazak) arama sonuçlarını göster
    const q = (req.query.q || "").trim();
    if (q != "") {
      const aranan = { [Op.like]: "%" + q + "%" };
      // Ürün adında, açıklamasında ya da iplik türünde geçenler
      const urunler = await Urun.findAll({
        where: { onayli: true, [Op.or]: [{ baslik: aranan }, { aciklama: aranan }, { iplik: aranan }] },
        include: Kullanici,
        order: [["baslik", "ASC"]],
      });
      // Mağaza adında ya da kullanıcı adında geçenler
      const magazalar = await Kullanici.findAll({
        where: { [Op.or]: [{ magazaAdi: aranan }, { kullaniciAdi: aranan }] },
        limit: 8,
      });
      return res.render("arama", { q: q, urunler: urunler, magazalar: magazalar });
    }

    // Kategoriler ve her birinde kaç ürün olduğu
    const kategoriler = await Kategori.findAll({ order: [["id", "ASC"]] });
    for (const kategori of kategoriler) {
      kategori.urunSayisi = await Urun.count({ where: { kategoriId: kategori.id, onayli: true } });
    }

    const yeniUrunler = await Urun.findAll({ where: { onayli: true }, include: Kullanici, order: [["createdAt", "DESC"]], limit: 8 });
    const sevilenler = await Urun.findAll({
      where: { onayli: true, yorumSayisi: { [Op.gt]: 0 } },
      include: Kullanici,
      order: [["ortPuan", "DESC"], ["yorumSayisi", "DESC"]],
      limit: 4,
    });
    const sonYorumlar = await Yorum.findAll({ include: [Kullanici, Urun], order: [["updatedAt", "DESC"]], limit: 3 });
    const sonDuyuru = await Duyuru.findOne({ order: [["tarih", "DESC"]] });

    res.render("index", {
      kategoriler: kategoriler,
      yeniUrunler: yeniUrunler,
      sevilenler: sevilenler,
      sonYorumlar: sonYorumlar,
      sonDuyuru: sonDuyuru,
    });
  } catch (hata) {
    next(hata);
  }
};

// ---------- Ürün listesi: bütün ürünler ya da bir kategori ----------
exports.urunler = async (req, res, next) => {
  try {
    const kosul = { onayli: true };

    // Kategori sayfasıysa (/kategori/bere-ve-sapka)
    let kategori = null;
    if (req.params.slug) {
      kategori = await Kategori.findOne({ where: { slug: req.params.slug } });
      if (!kategori) return next();   // böyle kategori yok -> 404
      kosul.kategoriId = kategori.id;
    }

    // Fiyat aralığı (?min=100&max=500)
    const min = parseInt(req.query.min);
    const max = parseInt(req.query.max);
    if (min > 0 && max > 0) {
      kosul.fiyat = { [Op.between]: [min, max] };
    } else if (min > 0) {
      kosul.fiyat = { [Op.gte]: min };   // büyük eşit
    } else if (max > 0) {
      kosul.fiyat = { [Op.lte]: max };   // küçük eşit
    }

    // İplik türü (?iplik=Alpaka). Sadece listedeki değerler kabul edilir.
    let iplik = "";
    if (Urun.IPLIKLER.includes(req.query.iplik)) {
      iplik = req.query.iplik;
      kosul.iplik = iplik;
    }

    // Sıralama (?sirala=ucuz)
    let sirala = "yeni";
    if (SIRALAMALAR[req.query.sirala]) sirala = req.query.sirala;

    const urunler = await Urun.findAll({ where: kosul, include: Kullanici, order: SIRALAMALAR[sirala].sira });
    res.render("urunler", {
      kategori: kategori,
      urunler: urunler,
      sirala: sirala,
      SIRALAMALAR: SIRALAMALAR,
      min: min > 0 ? min : "",
      max: max > 0 ? max : "",
      iplik: iplik,
      IPLIKLER: Urun.IPLIKLER,
    });
  } catch (hata) {
    next(hata);
  }
};

// ---------- Ürün sayfası ----------
exports.urun = async (req, res, next) => {
  try {
    const urun = await Urun.findOne({ where: { slug: req.params.slug }, include: [Kullanici, Kategori] });
    if (!urun) return next();

    // Onaysız ürünü sadece satıcısı ve admin görebilir
    const ben = req.session.kullanici;
    if (!urun.onayli) {
      if (!ben) return next();
      if (ben.id != urun.kullaniciId && !ben.admin) return next();
    }

    await urun.increment("goruntulenme"); // görüntülenme sayısı +1
    const yorumlar = await Yorum.findAll({ where: { urunId: urun.id }, include: Kullanici, order: [["updatedAt", "DESC"]] });
    const saticininDigerleri = await Urun.findAll({
      where: { onayli: true, kullaniciId: urun.kullaniciId, id: { [Op.ne]: urun.id } },   // ne = eşit değil
      include: Kullanici,
      limit: 4,
    });
    const benzerler = await Urun.findAll({
      where: { onayli: true, kategoriId: urun.kategoriId, id: { [Op.ne]: urun.id } },
      include: Kullanici,
      limit: 4,
    });
    const favoriSayisi = await urun.countFavorileyenler();

    // Giriş yapan üye bu ürünü teslim aldıysa yorum yazabilir
    let yorumYazabilir = false;
    let benimYorum = null;
    if (ben) {
      const teslimAldi = await Siparis.findOne({ where: { urunId: urun.id, aliciId: ben.id, durum: "teslim" } });
      if (teslimAldi) yorumYazabilir = true;
      for (const yorum of yorumlar) {
        if (yorum.kullaniciId == ben.id) benimYorum = yorum;
      }
    }

    res.render("urun", {
      urun: urun,
      yorumlar: yorumlar,
      saticininDigerleri: saticininDigerleri,
      benzerler: benzerler,
      favoriSayisi: favoriSayisi,
      yorumYazabilir: yorumYazabilir,
      benimYorum: benimYorum,
    });
  } catch (hata) {
    next(hata);
  }
};

// ---------- Örgücüler (mağazalar) ----------
exports.magazalar = async (req, res, next) => {
  try {
    // En az bir onaylı ürünü olan üyeler mağaza sayılır (include + required: true -> INNER JOIN)
    const magazalar = await Kullanici.findAll({
      include: { model: Urun, where: { onayli: true }, required: true },
      order: [["kullaniciAdi", "ASC"]],
    });
    res.render("magazalar", { magazalar: magazalar });
  } catch (hata) {
    next(hata);
  }
};

exports.magaza = async (req, res, next) => {
  try {
    const satici = await Kullanici.findOne({ where: { kullaniciAdi: req.params.kullaniciAdi } });
    if (!satici) return next();

    // Onay bekleyen ürünleri sadece mağaza sahibi görür
    let kendisiMi = false;
    if (req.session.isAuth && req.session.kullanici.id == satici.id) kendisiMi = true;
    const kosul = { kullaniciId: satici.id };
    if (!kendisiMi) kosul.onayli = true;
    const urunler = await Urun.findAll({ where: kosul, include: Kullanici, order: [["createdAt", "DESC"]] });

    // Mağazanın ürünlerine yazılmış yorumlar (Yorum -> Urun JOIN, ürünün satıcısı bu kişi)
    const yorumlar = await Yorum.findAll({
      include: [Kullanici, { model: Urun, where: { kullaniciId: satici.id } }],
      order: [["updatedAt", "DESC"]],
    });
    let toplamPuan = 0;
    for (const yorum of yorumlar) toplamPuan = toplamPuan + yorum.puan;
    let ortalama = 0;
    if (yorumlar.length > 0) ortalama = toplamPuan / yorumlar.length;

    const satisSayisi = await Siparis.count({ where: { saticiId: satici.id, durum: "teslim" } });

    res.render("magaza", {
      satici: satici,
      urunler: urunler,
      yorumlar: yorumlar,
      ortalama: ortalama,
      satisSayisi: satisSayisi,
      kendisiMi: kendisiMi,
    });
  } catch (hata) {
    next(hata);
  }
};

// ---------- Galeri, duyurular ----------
exports.galeri = async (req, res, next) => {
  try {
    const resimler = await Galeri.findAll({ order: [["id", "DESC"]] });
    res.render("galeri", { resimler: resimler });
  } catch (hata) {
    next(hata);
  }
};

exports.duyurular = async (req, res, next) => {
  try {
    const duyurular = await Duyuru.findAll({ order: [["tarih", "DESC"]] });
    res.render("duyurular", { duyurular: duyurular });
  } catch (hata) {
    next(hata);
  }
};

exports.duyuru = async (req, res, next) => {
  try {
    const duyuru = await Duyuru.findOne({ where: { slug: req.params.slug } });
    if (!duyuru) return next();
    res.render("duyuru", { duyuru: duyuru });
  } catch (hata) {
    next(hata);
  }
};

// ---------- S.S.S. ----------
exports.sss = async (req, res, next) => {
  try {
    const sorular = await Soru.findAll({ where: { yayinda: true }, order: [["id", "ASC"]] });
    res.render("sss", { sorular: sorular });
  } catch (hata) {
    next(hata);
  }
};

// Ziyaretçi soru gönderir -> admin cevaplayana kadar yayınlanmaz
exports.soruGonder = async (req, res, next) => {
  try {
    const soru = (req.body.soru || "").trim();
    if (soru.length < 5) {
      req.session.mesaj = { tur: "hata", metin: "Soru en az 5 karakter olmalı." };
    } else {
      await Soru.create({ soru: soru.slice(0, 500) });
      req.session.mesaj = { tur: "basari", metin: "Sorunuz gönderildi. Cevaplanınca bu sayfada yayınlanacak." };
    }
    res.redirect("/sss");
  } catch (hata) {
    next(hata);
  }
};

// ---------- Site haritası ----------
exports.siteHaritasi = async (req, res, next) => {
  try {
    const kategoriler = await Kategori.findAll({
      include: { model: Urun, where: { onayli: true }, required: false },
      order: [["id", "ASC"]],
    });
    const magazalar = await Kullanici.findAll({
      include: { model: Urun, where: { onayli: true }, required: true },
      order: [["kullaniciAdi", "ASC"]],
    });
    const duyurular = await Duyuru.findAll({ order: [["tarih", "DESC"]] });
    res.render("site-haritasi", { kategoriler: kategoriler, magazalar: magazalar, duyurular: duyurular });
  } catch (hata) {
    next(hata);
  }
};

// Arama motorları için XML site haritası
exports.sitemapXml = async (req, res, next) => {
  try {
    const site = req.protocol + "://" + req.get("host");
    const adresler = ["/", "/urunler", "/magazalar", "/galeri", "/duyurular", "/sss", "/site-haritasi", "/siparis-sorgula"];

    const kategoriler = await Kategori.findAll();
    for (const k of kategoriler) adresler.push("/kategori/" + k.slug);

    const urunler = await Urun.findAll({ where: { onayli: true } });
    for (const u of urunler) adresler.push("/urun/" + u.slug);

    const magazalar = await Kullanici.findAll({ include: { model: Urun, where: { onayli: true }, required: true } });
    for (const m of magazalar) adresler.push("/magaza/" + m.kullaniciAdi);

    const duyurular = await Duyuru.findAll();
    for (const d of duyurular) adresler.push("/duyuru/" + d.slug);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml = xml + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const adres of adresler) {
      xml = xml + "  <url><loc>" + site + adres + "</loc></url>\n";
    }
    xml = xml + "</urlset>";
    res.type("application/xml").send(xml);
  } catch (hata) {
    next(hata);
  }
};

// ---------- Nabız: public/js/site.js 15 saniyede bir çağırır ----------
// Ziyaretçi sayfada durduğu sürece "çevrimiçi" sayılsın diye. Cevapta güncel online sayısı döner.
exports.nabiz = (req, res) => {
  res.json({ online: onlineSayisi() });
};
