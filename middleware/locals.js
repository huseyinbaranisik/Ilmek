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
    res.locals.kullanici = null;     // misafirse null kalır
    res.locals.favoriIdler = [];     // favorilediği ürünlerin id'leri (kalpleri dolu göstermek için)
    res.locals.yeniSiparis = 0;      // satıcının kargoya vermesi gereken sipariş sayısı (menüde rozet)

    if (req.session.isAuth) {
      res.locals.kullanici = req.session.kullanici;
      const ben = await Kullanici.findByPk(req.session.kullanici.id);
      if (ben) {
        const favoriler = await ben.getFavoriler();
        for (const urun of favoriler) res.locals.favoriIdler.push(urun.id);
        res.locals.yeniSiparis = await Siparis.count({ where: { saticiId: ben.id, durum: "hazirlaniyor" } });
      }
    }

    res.locals.menuKategoriler = await Kategori.findAll({ order: [["id", "ASC"]] }); // üst menü
    res.locals.ziyaretci = sayac ? sayac.deger : 0;
    res.locals.online = onlineSayisi();
    res.locals.yol = req.path;   // menüde bulunduğumuz sayfayı işaretlemek için
    res.locals.DURUMLAR = Siparis.DURUMLAR;

    // EJS'te kullanılan küçük yardımcı fonksiyonlar
    res.locals.tarihYaz = function (tarih) {          // "26 Kasım 2026"
      return new Date(tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    };
    res.locals.tl = function (sayi) {                 // 1250 -> "1.250 ₺"
      return sayi.toLocaleString("tr-TR") + " ₺";
    };
    res.locals.yildiz = function (puan) {             // 4 -> "★★★★☆"
      const dolu = Math.round(puan);
      return "★".repeat(dolu) + "☆".repeat(5 - dolu);
    };

    // Tek seferlik bilgi mesajı (dersteki req.session.message gibi)
    res.locals.mesaj = req.session.mesaj || null;
    delete req.session.mesaj;
    next();
  } catch (hata) {
    next(hata);
  }
};
