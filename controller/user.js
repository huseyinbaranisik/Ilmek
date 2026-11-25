// ============================================================
//  controller/user.js - Herkesin görebildiği sayfalar
//  Not: Sadece onaylı (onayli: true) şarkılar gösterilir.
// ============================================================
const { Op, fn, col } = require("sequelize");
const Sarki = require("../models/sarki");
const Inceleme = require("../models/inceleme");
const Kullanici = require("../models/kullanici");
const Liste = require("../models/liste");
const Duyuru = require("../models/duyuru");
const Soru = require("../models/soru");
const Galeri = require("../models/galeri");
const { dinleyenler, onlineSayisi, dinleyiciSayilari, neDinliyor } = require("../helpers/canli");

// Albümleri gruplayarak getirir: her albümün adı, kapağı ve şarkı sayısı
function albumleriGetir(siralama, limit) {
  return Sarki.findAll({
    attributes: ["album", "albumSlug", "sanatci", "kapak", "renk", [fn("COUNT", col("id")), "sarkiSayisi"]],
    where: { onayli: true },
    group: ["albumSlug"],
    order: siralama,
    limit: limit,
    raw: true,
  });
}

// ---------- Ana sayfa (+ arama) ----------
exports.anaSayfa = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (q) {
      const ara = { [Op.like]: "%" + q + "%" };
      const sonuclar = await Sarki.findAll({
        where: { onayli: true, [Op.or]: [{ baslik: ara }, { sanatci: ara }, { album: ara }] },
        order: [["baslik", "ASC"]],
      });
      return res.render("arama", { q, sonuclar });
    }
    // Haftanın albümü = en son eklenen albüm
    const [haftaninAlbumu] = await albumleriGetir([[fn("MAX", col("id")), "DESC"]], 1);
    const enCokDinlenen = await Sarki.findAll({ where: { onayli: true }, order: [["dinlenme", "DESC"]], limit: 10 });
    const enYuksekPuan = await Sarki.findAll({
      where: { onayli: true, incelemeSayisi: { [Op.gt]: 0 } },
      order: [["ortPuan", "DESC"], ["incelemeSayisi", "DESC"]],
      limit: 5,
    });
    const sonIncelemeler = await Inceleme.findAll({
      include: [Kullanici, Sarki],     // incelemeyi yazan kişi ve şarkı da gelsin (JOIN)
      order: [["updatedAt", "DESC"]],
      limit: 4,
    });
    const sonDuyuru = await Duyuru.findOne({ order: [["tarih", "DESC"]] });
    res.render("index", { haftaninAlbumu, enCokDinlenen, enYuksekPuan, sonIncelemeler, sonDuyuru });
  } catch (err) {
    next(err);
  }
};

// ---------- Albümler ----------
exports.albumler = async (req, res, next) => {
  try {
    const albumler = await albumleriGetir([["album", "ASC"]]);
    res.render("albumler", { albumler });
  } catch (err) {
    next(err);
  }
};

exports.album = async (req, res, next) => {
  try {
    const sarkilar = await Sarki.findAll({ where: { albumSlug: req.params.slug, onayli: true }, order: [["id", "ASC"]] });
    if (sarkilar.length === 0) return next(); // bulunamadı -> 404
    res.render("album", { sarkilar, album: sarkilar[0] });
  } catch (err) {
    next(err);
  }
};

// ---------- Şarkı sayfası: dönen plak + puan + incelemeler ----------
exports.sarki = async (req, res, next) => {
  try {
    const sarki = await Sarki.findOne({ where: { slug: req.params.slug, onayli: true } });
    if (!sarki) return next();
    const albumdekiler = await Sarki.findAll({ where: { albumSlug: sarki.albumSlug, onayli: true }, order: [["id", "ASC"]] });
    const incelemeler = await Inceleme.findAll({
      where: { sarkiId: sarki.id },
      include: Kullanici,
      order: [["updatedAt", "DESC"]],
    });

    // Giriş yapmış üyenin kendi incelemesi ve listeleri (formları doldurmak için)
    let benimInceleme = null, listelerim = [];
    if (req.session.isAuth) {
      const benimId = req.session.kullanici.id;
      benimInceleme = incelemeler.find(i => i.kullaniciId === benimId) || null;
      listelerim = await Liste.findAll({ where: { kullaniciId: benimId }, order: [["baslik", "ASC"]] });
    }
    const begeniSayisi = await sarki.countBegenenler(); // kaç üye beğendi
    res.render("sarki", { sarki, albumdekiler, incelemeler, benimInceleme, listelerim, begeniSayisi });
  } catch (err) {
    next(err);
  }
};

// ---------- Kitaplık: bütün şarkılar plak kılıfı olarak rafta ----------
exports.kitaplik = async (req, res, next) => {
  try {
    const sarkilar = await Sarki.findAll({ where: { onayli: true }, order: [["album", "ASC"], ["id", "ASC"]] });
    res.render("kitaplik", { sarkilar });
  } catch (err) {
    next(err);
  }
};

// ---------- Listeler ----------
exports.listeler = async (req, res, next) => {
  try {
    const listeler = await Liste.findAll({
      include: [Kullanici, Sarki],  // listenin sahibi ve içindeki şarkılar
      order: [["updatedAt", "DESC"]],
    });
    res.render("listeler", { listeler });
  } catch (err) {
    next(err);
  }
};

exports.liste = async (req, res, next) => {
  try {
    const liste = await Liste.findOne({ where: { slug: req.params.slug }, include: [Kullanici, Sarki] });
    if (!liste) return next();
    res.render("liste", { liste });
  } catch (err) {
    next(err);
  }
};

// ---------- Üye profili: incelemeleri, listeleri, yüklediği şarkılar ----------
exports.profil = async (req, res, next) => {
  try {
    const uye = await Kullanici.findOne({ where: { kullaniciAdi: req.params.kullaniciAdi } });
    if (!uye) return next();
    const incelemeler = await Inceleme.findAll({ where: { kullaniciId: uye.id }, include: Sarki, order: [["updatedAt", "DESC"]] });
    const listeler = await Liste.findAll({ where: { kullaniciId: uye.id }, include: Sarki, order: [["updatedAt", "DESC"]] });

    // Onay bekleyen şarkıları sadece sahibi görür
    const kendisiMi = req.session.isAuth && req.session.kullanici.id === uye.id;
    const yuklemeFiltre = kendisiMi ? { kullaniciId: uye.id } : { kullaniciId: uye.id, onayli: true };
    const yuklemeler = await Sarki.findAll({ where: yuklemeFiltre, order: [["id", "DESC"]] });

    // Beğendiği şarkılar ve takip bilgileri (belongsToMany ilişkilerinin get... fonksiyonları)
    const begenilenler = await uye.getBegenilenler({ where: { onayli: true }, order: [["baslik", "ASC"]] });
    const takipciler = await uye.getTakipciler();
    const takipEdilenler = await uye.getTakipEdilenler();
    // Ben bu üyeyi takip ediyor muyum? (takip et / takibi bırak düğmesi için)
    const takipEdiyorum = req.session.isAuth && takipciler.some(t => t.id === req.session.kullanici.id);

    // Şu an bir şarkı dinliyorsa (oynatıcının nabzından)
    const dinlenenId = neDinliyor(uye.kullaniciAdi);
    const simdiDinliyor = dinlenenId ? await Sarki.findByPk(dinlenenId) : null;

    res.render("profil", {
      uye, incelemeler, listeler, yuklemeler, kendisiMi,
      begenilenler, takipciler, takipEdilenler, takipEdiyorum, simdiDinliyor,
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Üyeler: herkesin profiline buradan gidilir ----------
exports.uyeler = async (req, res, next) => {
  try {
    const uyeler = await Kullanici.findAll({ order: [["kullaniciAdi", "ASC"]] });
    // Her üye için inceleme, liste, beğeni ve takipçi sayıları
    for (const u of uyeler) {
      u.sayilar = {
        inceleme: await u.countIncelemeler(),
        liste: await u.countListeler(),
        begeni: await u.countBegenilenler(),
        takipci: await u.countTakipciler(),
      };
      u.dinliyor = neDinliyor(u.kullaniciAdi) !== null;
    }
    res.render("uyeler", { uyeler });
  } catch (err) {
    next(err);
  }
};

// ---------- Bir üyenin beğendiği şarkılar (Spotify'daki "Beğenilen Şarkılar") ----------
exports.begeniler = async (req, res, next) => {
  try {
    const uye = await Kullanici.findOne({ where: { kullaniciAdi: req.params.kullaniciAdi } });
    if (!uye) return next();
    const sarkilar = await uye.getBegenilenler({ where: { onayli: true }, order: [["baslik", "ASC"]] });
    res.render("begeniler", { uye, sarkilar });
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
    const albumler = await albumleriGetir([["album", "ASC"]]);
    const sarkilar = await Sarki.findAll({ where: { onayli: true }, order: [["id", "ASC"]], raw: true });
    const listeler = await Liste.findAll({ order: [["baslik", "ASC"]], raw: true });
    const duyurular = await Duyuru.findAll({ order: [["tarih", "DESC"]], raw: true });
    res.render("site-haritasi", { albumler, sarkilar, listeler, duyurular });
  } catch (err) {
    next(err);
  }
};

// Arama motorları için XML site haritası
exports.sitemapXml = async (req, res, next) => {
  try {
    const site = req.protocol + "://" + req.get("host");
    const adresler = ["/", "/kitaplik", "/albumler", "/listeler", "/uyeler", "/galeri", "/duyurular", "/sss", "/site-haritasi"];
    (await Kullanici.findAll({ raw: true })).forEach(u => adresler.push("/uye/" + u.kullaniciAdi));
    const sarkilar = await Sarki.findAll({ where: { onayli: true }, raw: true });
    new Set(sarkilar.map(s => s.albumSlug)).forEach(a => adresler.push("/album/" + a));
    sarkilar.forEach(s => adresler.push("/sarki/" + s.slug));
    (await Liste.findAll({ raw: true })).forEach(l => adresler.push("/liste/" + l.slug));
    (await Duyuru.findAll({ raw: true })).forEach(d => adresler.push("/duyuru/" + d.slug));

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + adresler.map(a => `  <url><loc>${site}${a}</loc></url>`).join("\n")
      + "\n</urlset>";
    res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
};

// ---------- API (oynatıcı çağırır) ----------
// Nabız: "Ben buradayım (ve şu şarkıyı dinliyorum)". Cevapta güncel sayılar döner.
exports.nabiz = (req, res) => {
  const sarkiId = Number(req.body.sarkiId);
  const kullaniciAdi = req.session.kullanici ? req.session.kullanici.ad : null; // misafirse null
  if (sarkiId) dinleyenler[req.sessionID] = { sarkiId, zaman: Date.now(), kullaniciAdi };
  else delete dinleyenler[req.sessionID];
  res.json({ online: onlineSayisi(), dinleyici: dinleyiciSayilari() });
};

// Şarkı çalmaya başlayınca dinlenme sayısı 1 artar
exports.dinlendi = async (req, res, next) => {
  try {
    await Sarki.increment("dinlenme", { where: { id: req.params.id } });
    res.json({ tamam: true });
  } catch (err) {
    next(err);
  }
};
