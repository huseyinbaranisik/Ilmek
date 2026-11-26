// ============================================================
//  controller/hesap.js - Üyelerin işlemleri
//  (ürün ekleme, sipariş, yorum, favori, mağaza takibi, mağaza ayarları)
//  Bu fonksiyonlara sadece giriş yapmış kullanıcılar ulaşabilir (routes/hesap.js -> isAuth)
// ============================================================
const Urun = require("../models/urun");
const Kategori = require("../models/kategori");
const Kullanici = require("../models/kullanici");
const Siparis = require("../models/siparis");
const Yorum = require("../models/yorum");
const { benzersizSlug } = require("../helpers/slugfield");
const puanGuncelle = require("../helpers/puan");

// İşlem bitince kullanıcıyı geldiği sayfaya geri gönderir
function geriDon(req, res) {
  res.redirect(req.get("Referer") || "/");
}
const benimId = req => req.session.kullanici.id;
const mesaj = (req, tur, metin) => { req.session.mesaj = { tur, metin }; };

// ================= SATICI: ÜRÜNLER =================
exports.urunlerim = async (req, res, next) => {
  try {
    const urunler = await Urun.findAll({ where: { kullaniciId: benimId(req) }, include: Kategori, order: [["createdAt", "DESC"]] });
    res.render("hesap/urunlerim", { urunler });
  } catch (err) {
    next(err);
  }
};

// Hem "yeni ürün" hem "düzenle" aynı formu kullanır. Adreste :id varsa düzenleme.
exports.urunFormu = async (req, res, next) => {
  try {
    let urun = null;
    if (req.params.id) {
      urun = await Urun.findByPk(req.params.id);
      if (!urun || urun.kullaniciId !== benimId(req)) return next(); // başkasının ürünü -> 404
    }
    const kategoriler = await Kategori.findAll({ order: [["ad", "ASC"]] });
    res.render("hesap/urun-formu", { urun, kategoriler, IPLIKLER: Urun.IPLIKLER });
  } catch (err) {
    next(err);
  }
};

// Not: Dosya yüklenen formlarda (multipart) CSRF anahtarı adreste gelir: action="...?_csrf=..."
// Çünkü csurf, multer formu okumadan önce çalışır ve req.body henüz boştur.
exports.urunKaydet = async (req, res, next) => {
  try {
    const { baslik, aciklama, kategoriId } = req.body;
    const fiyat = parseInt(req.body.fiyat), stok = parseInt(req.body.stok);
    const hazirlikGunu = parseInt(req.body.hazirlikGunu) || 3;
    const iplik = Urun.IPLIKLER.includes(req.body.iplik) ? req.body.iplik : "Yün"; // sadece listedeki iplikler
    let urun = null;
    if (req.params.id) {
      urun = await Urun.findByPk(req.params.id);
      if (!urun || urun.kullaniciId !== benimId(req)) return next();
    }
    const formAdresi = urun ? "/hesap/urun/" + urun.id + "/duzenle" : "/hesap/urun/yeni";

    // Kontroller
    if (!baslik || !baslik.trim() || !(fiyat > 0) || !(stok >= 0) || !(await Kategori.findByPk(kategoriId))) {
      mesaj(req, "hata", "Ürün adı, kategori, 0'dan büyük fiyat ve stok zorunlu.");
      return res.redirect(formAdresi);
    }
    if (!urun && !req.file) {
      mesaj(req, "hata", "Yeni ürün için bir resim seçmelisiniz (jpg, png, webp, gif, en fazla 5 MB).");
      return res.redirect(formAdresi);
    }

    const veri = { baslik: baslik.trim().slice(0, 100), aciklama: (aciklama || "").slice(0, 3000), fiyat, stok, kategoriId,
      iplik, hazirlikGunu: Math.min(Math.max(hazirlikGunu, 1), 60) };   // 1-60 gün arası
    if (req.file) veri.resim = "/img/yuklenen/" + req.file.filename; // resim dosyası klasörde, veritabanında adresi

    const admin = req.session.kullanici.admin;
    if (urun) {
      // Düzenlenen ürün admin değilse tekrar onaya düşer
      await urun.update({ ...veri, onayli: admin ? urun.onayli : false });
      mesaj(req, "basari", admin ? "Ürün güncellendi." : "Ürün güncellendi. Yönetici tekrar onaylayınca yayına girecek.");
    } else {
      urun = await Urun.create({ ...veri, slug: await benzersizSlug(Urun, baslik), onayli: admin, kullaniciId: benimId(req) });
      mesaj(req, "basari", admin ? "Ürün yayınlandı." : "Ürün eklendi. Yönetici onaylayınca mağazanda görünecek.");
    }
    res.redirect("/hesap/urunlerim");
  } catch (err) {
    next(err);
  }
};

exports.urunSil = async (req, res, next) => {
  try {
    const urun = await Urun.findByPk(req.params.id);
    if (urun && urun.kullaniciId === benimId(req)) {
      await urun.destroy();
      mesaj(req, "basari", "Ürün silindi.");
    }
    res.redirect("/hesap/urunlerim");
  } catch (err) {
    next(err);
  }
};

// ================= SİPARİŞ =================
// Alıcı ürün sayfasındaki formdan sipariş talebi gönderir
exports.siparisVer = async (req, res, next) => {
  try {
    const urun = await Urun.findOne({ where: { id: req.params.urunId, onayli: true } });
    const adet = parseInt(req.body.adet);
    const adres = (req.body.adres || "").trim();
    if (!urun) return next();
    const geri = "/urun/" + urun.slug;
    if (urun.kullaniciId === benimId(req)) { mesaj(req, "hata", "Kendi ürününüze sipariş veremezsiniz."); return res.redirect(geri); }
    if (!(adet >= 1 && adet <= urun.stok)) { mesaj(req, "hata", "Adet 1 ile " + urun.stok + " arasında olmalı."); return res.redirect(geri); }
    if (adres.length < 10) { mesaj(req, "hata", "Lütfen teslimat adresini yazın."); return res.redirect(geri); }

    await Siparis.create({
      adet, adres: adres.slice(0, 500), toplam: adet * urun.fiyat, // fiyat sipariş anındaki fiyattır
      aliciNotu: (req.body.aliciNotu || "").trim().slice(0, 500) || null,
      urunId: urun.id, aliciId: benimId(req), saticiId: urun.kullaniciId,
    });
    mesaj(req, "basari", "Sipariş talebin satıcıya iletildi. Satıcı onaylayınca burada görebilirsin.");
    res.redirect("/hesap/siparislerim");
  } catch (err) {
    next(err);
  }
};

exports.siparislerim = async (req, res, next) => {
  try {
    const siparisler = await Siparis.findAll({
      where: { aliciId: benimId(req) },
      include: [Urun, { model: Kullanici, as: "satici" }],
      order: [["createdAt", "DESC"]],
    });
    // Hangi ürünlere zaten yorum yazmış (teslim edilenlerde "Yorum yaz" düğmesi için)
    const yorumlananlar = (await Yorum.findAll({ where: { kullaniciId: benimId(req) }, raw: true })).map(y => y.urunId);
    res.render("hesap/siparislerim", { siparisler, yorumlananlar });
  } catch (err) {
    next(err);
  }
};

exports.gelenSiparisler = async (req, res, next) => {
  try {
    const siparisler = await Siparis.findAll({
      where: { saticiId: benimId(req) },
      include: [Urun, { model: Kullanici, as: "alici" }],
      order: [["createdAt", "DESC"]],
    });
    res.render("hesap/gelen-siparisler", { siparisler, SONRAKI: Siparis.SONRAKI });
  } catch (err) {
    next(err);
  }
};

// Satıcı sipariş durumunu ilerletir. Sadece izin verilen geçişler yapılabilir (Siparis.SONRAKI)
exports.siparisDurum = async (req, res, next) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id, { include: Urun });
    const yeni = req.body.durum;
    if (!siparis || siparis.saticiId !== benimId(req)) return next();
    if (!(Siparis.SONRAKI[siparis.durum] || []).includes(yeni)) {
      mesaj(req, "hata", "Bu sipariş bu duruma geçirilemez.");
      return res.redirect("/hesap/gelen-siparisler");
    }
    // Kabul edilince (hazırlanıyor) stoktan düşülür
    if (yeni === "hazirlaniyor") {
      if (siparis.urun.stok < siparis.adet) {
        mesaj(req, "hata", "Stok yetersiz. Önce ürünün stoğunu güncelleyin.");
        return res.redirect("/hesap/gelen-siparisler");
      }
      await siparis.urun.decrement("stok", { by: siparis.adet });
    }
    await siparis.update({ durum: yeni });
    mesaj(req, "basari", "Sipariş durumu: " + Siparis.DURUMLAR[yeni].ad);
    res.redirect("/hesap/gelen-siparisler");
  } catch (err) {
    next(err);
  }
};

// Alıcı, satıcı onaylamadan önce siparişini iptal edebilir
exports.siparisIptal = async (req, res, next) => {
  try {
    const siparis = await Siparis.findByPk(req.params.id);
    if (siparis && siparis.aliciId === benimId(req) && siparis.durum === "beklemede") {
      await siparis.update({ durum: "iptal" });
      mesaj(req, "basari", "Sipariş iptal edildi.");
    }
    res.redirect("/hesap/siparislerim");
  } catch (err) {
    next(err);
  }
};

// ================= YORUM =================
// Sadece ürünü teslim almış üye yorum yazabilir. Daha önce yazdıysa güncellenir.
exports.yorumKaydet = async (req, res, next) => {
  try {
    const urun = await Urun.findByPk(req.params.urunId);
    const puan = Number(req.body.puan);
    if (!urun) return next();
    const teslimAldi = await Siparis.findOne({ where: { urunId: urun.id, aliciId: benimId(req), durum: "teslim" } });
    if (!teslimAldi) {
      mesaj(req, "hata", "Sadece teslim aldığınız ürünlere yorum yazabilirsiniz.");
      return res.redirect("/urun/" + urun.slug);
    }
    if (!(puan >= 1 && puan <= 5)) {
      mesaj(req, "hata", "Lütfen 1 ile 5 arasında bir puan seçin.");
      return res.redirect("/urun/" + urun.slug);
    }
    const metin = (req.body.metin || "").trim().slice(0, 2000) || null;
    const eski = await Yorum.findOne({ where: { urunId: urun.id, kullaniciId: benimId(req) } });
    if (eski) await eski.update({ puan, metin });
    else await Yorum.create({ puan, metin, urunId: urun.id, kullaniciId: benimId(req) });
    await puanGuncelle(urun.id); // ortalama puanı yeniden hesapla
    mesaj(req, "basari", "Yorumun kaydedildi, teşekkürler!");
    res.redirect("/urun/" + urun.slug + "#yorumlar");
  } catch (err) {
    next(err);
  }
};

// Yorumu sadece yazan kişi ya da admin silebilir
exports.yorumSil = async (req, res, next) => {
  try {
    const yorum = await Yorum.findByPk(req.params.id);
    if (yorum && (yorum.kullaniciId === benimId(req) || req.session.kullanici.admin)) {
      await yorum.destroy();
      await puanGuncelle(yorum.urunId);
      mesaj(req, "basari", "Yorum silindi.");
    }
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

// ================= FAVORİ VE TAKİP =================
// Kalp düğmesi fetch ile buraya POST atar (public/js/site.js), cevap JSON'dur.
exports.favori = async (req, res, next) => {
  try {
    const urun = await Urun.findOne({ where: { id: req.params.urunId, onayli: true } });
    if (!urun) return res.status(404).json({ hata: "Ürün bulunamadı" });
    const ben = await Kullanici.findByPk(benimId(req));
    const favorideMi = await ben.hasFavori(urun);   // ara tabloda (favori) satır var mı?
    if (favorideMi) await ben.removeFavori(urun);   // varsa sil
    else await ben.addFavori(urun);                 // yoksa ekle
    res.json({ favori: !favorideMi });
  } catch (err) {
    next(err);
  }
};

exports.favorilerim = async (req, res, next) => {
  try {
    const ben = await Kullanici.findByPk(benimId(req));
    const urunler = await ben.getFavoriler({ where: { onayli: true }, include: [Kullanici] }); // get... içinde include dizi olmalı
    res.render("hesap/favorilerim", { urunler });
  } catch (err) {
    next(err);
  }
};

exports.takip = async (req, res, next) => {
  try {
    const satici = await Kullanici.findOne({ where: { kullaniciAdi: req.params.kullaniciAdi } });
    const ben = await Kullanici.findByPk(benimId(req));
    if (satici && satici.id !== ben.id) {   // kendini takip edemezsin
      if (await ben.hasTakipEdilen(satici)) {
        await ben.removeTakipEdilen(satici);
        mesaj(req, "basari", "Mağaza takipten çıkarıldı.");
      } else {
        await ben.addTakipEdilen(satici);
        mesaj(req, "basari", "Mağaza takip ediliyor. Yeni ürünleri ana sayfanda göreceksin.");
      }
    }
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

// ================= MAĞAZA AYARLARI =================
exports.magazaAyarlari = async (req, res, next) => {
  try {
    res.render("hesap/magaza", { ben: await Kullanici.findByPk(benimId(req)) });
  } catch (err) {
    next(err);
  }
};

exports.magazaKaydet = async (req, res, next) => {
  try {
    const temiz = (deger, uzunluk) => (deger || "").trim().slice(0, uzunluk) || null;
    await Kullanici.update(
      { magazaAdi: temiz(req.body.magazaAdi, 60), sehir: temiz(req.body.sehir, 40), hakkinda: temiz(req.body.hakkinda, 1000) },
      { where: { id: benimId(req) } }
    );
    mesaj(req, "basari", "Mağaza bilgilerin kaydedildi.");
    res.redirect("/magaza/" + req.session.kullanici.ad);
  } catch (err) {
    next(err);
  }
};
