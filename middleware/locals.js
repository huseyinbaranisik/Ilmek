// ============================================================
//  middleware/locals.js - Her istekte çalışır
//  1) Ziyaretçi sayacı  2) Online işareti  3) Bütün sayfalarda kullanılan değişkenler
// ============================================================
const Sayac = require("../models/sayac");
const Kullanici = require("../models/kullanici");
const Kategori = require("../models/kategori");
const Siparis = require("../models/siparis");
const { sonGorulme, onlineSayisi } = require("../helpers/canli");

module.exports = async (req, res, next) => {
  try {
    // 1) Ziyaretçi sayacı: bu oturum daha önce sayılmadıysa 1 artır
    if (!req.session.sayildi) {
      await Sayac.increment("deger", { where: { ad: "ziyaretci" } });
      req.session.sayildi = true;
    }
    const sayac = await Sayac.findByPk("ziyaretci");

    // 2) Online: bu ziyaretçiyi "şu an burada" olarak işaretle
    sonGorulme[req.sessionID] = Date.now();

    // 3) Bütün EJS sayfalarında kullanılabilecek değişkenler
    res.locals.kullanici = req.session.kullanici || null;   // misafirse null
    res.locals.menuKategoriler = await Kategori.findAll({ order: [["id", "ASC"]], raw: true }); // üst menü
    res.locals.favoriIdler = [];     // favorilediği ürünlerin id'leri (kalpleri dolu göstermek için)
    res.locals.yeniSiparis = 0;      // satıcıya gelen, onay bekleyen sipariş sayısı (menüde rozet)
    const ben = req.session.isAuth ? await Kullanici.findByPk(req.session.kullanici.id) : null;
    if (ben) {
      res.locals.favoriIdler = (await ben.getFavoriler({ attributes: ["id"] })).map(u => u.id);
      res.locals.yeniSiparis = await Siparis.count({ where: { saticiId: ben.id, durum: "beklemede" } });
    }
    res.locals.ziyaretci = sayac ? sayac.deger : 0;
    res.locals.online = onlineSayisi();
    res.locals.yol = req.path;
    res.locals.DURUMLAR = Siparis.DURUMLAR;
    res.locals.tarihYaz = t => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    res.locals.tl = n => n.toLocaleString("tr-TR") + " ₺";                              // 1250 -> "1.250 ₺"
    res.locals.yildiz = p => "★".repeat(Math.round(p)) + "☆".repeat(5 - Math.round(p)); // 4 -> ★★★★☆

    // Tek seferlik bilgi mesajı (dersteki req.session.message gibi)
    res.locals.mesaj = req.session.mesaj || null;
    delete req.session.mesaj;
    next();
  } catch (err) {
    next(err);
  }
};
