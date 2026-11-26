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
const { bakanlar, onlineSayisi, bakanSayisi } = require("../helpers/canli");

// Ürün listelerinde sıralama seçenekleri (?sirala=...)
const SIRALAMALAR = {
  yeni:   { ad: "En yeni",        order: [["createdAt", "DESC"]] },
  ucuz:   { ad: "Fiyat (artan)",  order: [["fiyat", "ASC"]] },
  pahali: { ad: "Fiyat (azalan)", order: [["fiyat", "DESC"]] },
  puan:   { ad: "En beğenilen",   order: [["ortPuan", "DESC"], ["yorumSayisi", "DESC"]] },
};

// ---------- Ana sayfa (+ arama) ----------
exports.anaSayfa = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (q) {
      const ara = { [Op.like]: "%" + q + "%" };
      // Ürün adında, açıklamasında ya da iplik türünde geçenler + mağaza adında ya da kullanıcı adında geçenler
      const urunler = await Urun.findAll({ where: { onayli: true, [Op.or]: [{ baslik: ara }, { aciklama: ara }, { iplik: ara }] }, include: Kullanici, order: [["baslik", "ASC"]] });
      const magazalar = await Kullanici.findAll({ where: { [Op.or]: [{ magazaAdi: ara }, { kullaniciAdi: ara }] }, limit: 8 });
      return res.render("arama", { q, urunler, magazalar });
    }

    // Kategoriler ve her birinde kaç ürün olduğu
    const kategoriler = await Kategori.findAll({ order: [["id", "ASC"]] });
    for (const k of kategoriler) k.urunSayisi = await Urun.count({ where: { kategoriId: k.id, onayli: true } });

    const yeniUrunler = await Urun.findAll({ where: { onayli: true }, include: Kullanici, order: [["createdAt", "DESC"]], limit: 8 });
    const sevilenler = await Urun.findAll({ where: { onayli: true, yorumSayisi: { [Op.gt]: 0 } }, include: Kullanici, order: [["ortPuan", "DESC"], ["yorumSayisi", "DESC"]], limit: 4 });
    const sonYorumlar = await Yorum.findAll({ include: [Kullanici, Urun], order: [["updatedAt", "DESC"]], limit: 3 });
    const sonDuyuru = await Duyuru.findOne({ order: [["tarih", "DESC"]] });

    // Giriş yaptıysa: takip ettiği mağazaların ürünleri
    let takipUrunleri = [];
    if (req.session.isAuth) {
      const ben = await Kullanici.findByPk(req.session.kullanici.id);
      const takipIdler = (await ben.getTakipEdilenler()).map(k => k.id);
      takipUrunleri = await Urun.findAll({ where: { onayli: true, kullaniciId: takipIdler }, include: Kullanici, order: [["createdAt", "DESC"]], limit: 4 });
    }
    res.render("index", { kategoriler, yeniUrunler, sevilenler, sonYorumlar, sonDuyuru, takipUrunleri });
  } catch (err) {
    next(err);
  }
};

// ---------- Ürün listesi: bütün ürünler ya da bir kategori ----------
exports.urunler = async (req, res, next) => {
  try {
    let kategori = null;
    const where = { onayli: true };
    if (req.params.slug) {
      kategori = await Kategori.findOne({ where: { slug: req.params.slug } });
      if (!kategori) return next();   // böyle kategori yok -> 404
      where.kategoriId = kategori.id;
    }
    // Fiyat aralığı (?min=100&max=500)
    const min = Number(req.query.min), max = Number(req.query.max);
    if (min || max) where.fiyat = { ...(min && { [Op.gte]: min }), ...(max && { [Op.lte]: max }) };
    // İplik türü (?iplik=Alpaka). Sadece listedeki değerler kabul edilir.
    const iplik = Urun.IPLIKLER.includes(req.query.iplik) ? req.query.iplik : "";
    if (iplik) where.iplik = iplik;

    const sirala = SIRALAMALAR[req.query.sirala] ? req.query.sirala : "yeni";
    const urunler = await Urun.findAll({ where, include: Kullanici, order: SIRALAMALAR[sirala].order });
    res.render("urunler", { kategori, urunler, sirala, SIRALAMALAR, min: min || "", max: max || "", iplik, IPLIKLER: Urun.IPLIKLER });
  } catch (err) {
    next(err);
  }
};

// ---------- Ürün sayfası ----------
exports.urun = async (req, res, next) => {
  try {
    const urun = await Urun.findOne({ where: { slug: req.params.slug }, include: [Kullanici, Kategori] });
    // Onaysız ürünü sadece satıcısı ve admin görebilir
    const ben = req.session.kullanici;
    if (!urun || (!urun.onayli && !(ben && (ben.id === urun.kullaniciId || ben.admin)))) return next();

    await urun.increment("goruntulenme"); // görüntülenme sayısı +1
    const yorumlar = await Yorum.findAll({ where: { urunId: urun.id }, include: Kullanici, order: [["updatedAt", "DESC"]] });
    const saticininDigerleri = await Urun.findAll({ where: { onayli: true, kullaniciId: urun.kullaniciId, id: { [Op.ne]: urun.id } }, include: Kullanici, limit: 4 });
    const benzerler = await Urun.findAll({ where: { onayli: true, kategoriId: urun.kategoriId, id: { [Op.ne]: urun.id } }, include: Kullanici, limit: 4 });
    const favoriSayisi = await urun.countFavorileyenler();

    // Giriş yapan üye bu ürünü teslim aldıysa yorum yazabilir
    let yorumYazabilir = false, benimYorum = null;
    if (ben) {
      yorumYazabilir = !!(await Siparis.findOne({ where: { urunId: urun.id, aliciId: ben.id, durum: "teslim" } }));
      benimYorum = yorumlar.find(y => y.kullaniciId === ben.id) || null;
    }
    res.render("urun", { urun, yorumlar, saticininDigerleri, benzerler, favoriSayisi, yorumYazabilir, benimYorum, bakan: bakanSayisi(urun.id) });
  } catch (err) {
    next(err);
  }
};

// ---------- Mağazalar ----------
exports.magazalar = async (req, res, next) => {
  try {
    // En az bir onaylı ürünü olan üyeler mağaza sayılır (include + required: true -> INNER JOIN)
    const magazalar = await Kullanici.findAll({
      include: { model: Urun, where: { onayli: true }, required: true },
      order: [["kullaniciAdi", "ASC"]],
    });
    for (const m of magazalar) m.takipciSayisi = await m.countTakipciler();
    res.render("magazalar", { magazalar });
  } catch (err) {
    next(err);
  }
};

exports.magaza = async (req, res, next) => {
  try {
    const satici = await Kullanici.findOne({ where: { kullaniciAdi: req.params.kullaniciAdi } });
    if (!satici) return next();
    const kendisiMi = req.session.isAuth && req.session.kullanici.id === satici.id;
    // Onay bekleyen ürünleri sadece mağaza sahibi görür
    const urunler = await Urun.findAll({ where: kendisiMi ? { kullaniciId: satici.id } : { kullaniciId: satici.id, onayli: true }, include: Kullanici, order: [["createdAt", "DESC"]] });
    // Mağazanın ürünlerine yazılmış yorumlar (Yorum -> Urun JOIN, ürünün satıcısı bu kişi)
    const yorumlar = await Yorum.findAll({ include: [Kullanici, { model: Urun, where: { kullaniciId: satici.id } }], order: [["updatedAt", "DESC"]] });
    const ortalama = yorumlar.length ? yorumlar.reduce((t, y) => t + y.puan, 0) / yorumlar.length : 0;
    const satisSayisi = await Siparis.count({ where: { saticiId: satici.id, durum: "teslim" } });
    const takipciSayisi = await satici.countTakipciler();
    const takipEdiyorum = req.session.isAuth && !kendisiMi ? await satici.hasTakipci(req.session.kullanici.id) : false;
    res.render("magaza", { satici, urunler, yorumlar, ortalama, satisSayisi, takipciSayisi, takipEdiyorum, kendisiMi });
  } catch (err) {
    next(err);
  }
};

// ---------- Galeri, duyurular ----------
exports.galeri = async (req, res, next) => {
  try {
    const resimler = await Galeri.findAll({ order: [["id", "DESC"]] });
    res.render("galeri", { resimler });
  } catch (err) {
    next(err);
  }
};

exports.duyurular = async (req, res, next) => {
  try {
    const duyurular = await Duyuru.findAll({ order: [["tarih", "DESC"]] });
    res.render("duyurular", { duyurular });
  } catch (err) {
    next(err);
  }
};

exports.duyuru = async (req, res, next) => {
  try {
    const duyuru = await Duyuru.findOne({ where: { slug: req.params.slug } });
    if (!duyuru) return next();
    res.render("duyuru", { duyuru });
  } catch (err) {
    next(err);
  }
};

// ---------- S.S.S. ----------
exports.sss = async (req, res, next) => {
  try {
    const sorular = await Soru.findAll({ where: { yayinda: true }, order: [["id", "ASC"]] });
    res.render("sss", { sorular });
  } catch (err) {
    next(err);
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
  } catch (err) {
    next(err);
  }
};

// ---------- Site haritası ----------
exports.siteHaritasi = async (req, res, next) => {
  try {
    const kategoriler = await Kategori.findAll({ include: { model: Urun, where: { onayli: true }, required: false }, order: [["id", "ASC"]] });
    const magazalar = await Kullanici.findAll({ include: { model: Urun, where: { onayli: true }, required: true }, order: [["kullaniciAdi", "ASC"]] });
    const duyurular = await Duyuru.findAll({ order: [["tarih", "DESC"]], raw: true });
    res.render("site-haritasi", { kategoriler, magazalar, duyurular });
  } catch (err) {
    next(err);
  }
};

// Arama motorları için XML site haritası
exports.sitemapXml = async (req, res, next) => {
  try {
    const site = req.protocol + "://" + req.get("host");
    const adresler = ["/", "/urunler", "/magazalar", "/galeri", "/duyurular", "/sss", "/site-haritasi"];
    (await Kategori.findAll({ raw: true })).forEach(k => adresler.push("/kategori/" + k.slug));
    (await Urun.findAll({ where: { onayli: true }, raw: true })).forEach(u => adresler.push("/urun/" + u.slug));
    (await Kullanici.findAll({ include: { model: Urun, where: { onayli: true }, required: true } })).forEach(k => adresler.push("/magaza/" + k.kullaniciAdi));
    (await Duyuru.findAll({ raw: true })).forEach(d => adresler.push("/duyuru/" + d.slug));

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + adresler.map(a => `  <url><loc>${site}${a}</loc></url>`).join("\n")
      + "\n</urlset>";
    res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
};

// ---------- API: nabız (public/js/site.js 15 saniyede bir çağırır) ----------
// "Ben buradayım (ve şu ürüne bakıyorum)". Cevapta güncel online sayısı ve bu ürüne bakan sayısı döner.
exports.nabiz = (req, res) => {
  const urunId = Number(req.body.urunId);
  if (urunId) bakanlar[req.sessionID] = { urunId, zaman: Date.now() };
  else delete bakanlar[req.sessionID];
  res.json({ online: onlineSayisi(), bakan: urunId ? bakanSayisi(urunId) : 0 });
};
