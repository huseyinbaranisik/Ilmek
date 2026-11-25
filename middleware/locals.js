// ============================================================
//  middleware/locals.js - Her istekte çalışır
//  1) Ziyaretçi sayacı  2) Online işareti  3) Bütün sayfalarda kullanılan değişkenler
// ============================================================
const Sayac = require("../models/sayac");
const Liste = require("../models/liste");
const Kullanici = require("../models/kullanici");
const { sonGorulme, onlineSayisi, dinleyiciSayilari } = require("../helpers/canli");

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
    res.locals.kullanici = req.session.kullanici || null; // misafirse null
    // Sol menüdeki "Listelerin" bölümü için giriş yapan üyenin listeleri
    res.locals.menuListeler = [];
    res.locals.begenilenIdler = []; // beğendiği şarkıların id'leri (kalpleri dolu göstermek için)
    const ben = req.session.isAuth ? await Kullanici.findByPk(req.session.kullanici.id) : null;
    if (ben) {
      res.locals.menuListeler = await Liste.findAll({ where: { kullaniciId: ben.id }, order: [["updatedAt", "DESC"]], raw: true });
      const begenilenler = await ben.getBegenilenler({ attributes: ["id"] });
      res.locals.begenilenIdler = begenilenler.map(s => s.id);
    }
    res.locals.ziyaretci = sayac ? sayac.deger : 0;
    res.locals.online = onlineSayisi();
    res.locals.dinleyici = dinleyiciSayilari();
    res.locals.yol = req.path;
    res.locals.tarihYaz = t => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    // Büyük sayıları kısaltır: 845 -> "845", 2652 -> "2.6k", 1250000 -> "1.2M" (yer kazanmak için)
    res.locals.kisaSayi = n => {
      if (n < 1000) return String(n);
      const [bolen, harf] = n < 1e6 ? [1e3, "k"] : [1e6, "M"];
      return (Math.floor(n / bolen * 10) / 10) + harf;   // aşağı yuvarla: 2.69k değil 2.6k
    };
    res.locals.yildiz =p => "★".repeat(Math.round(p)) + "☆".repeat(5 - Math.round(p)); // 4 -> ★★★★☆
    // Şarkı bilgisini oynatıcının okuyacağı JSON'a çevirir (data-sarki="..." özelliğinde)
    res.locals.sarkiJson = s => JSON.stringify({ id: s.id, baslik: s.baslik, sanatci: s.sanatci, slug: s.slug, dosya: s.dosya, kapak: s.kapak, renk: s.renk });

    // Tek seferlik bilgi mesajı (dersteki req.session.message gibi)
    res.locals.mesaj = req.session.mesaj || null;
    delete req.session.mesaj;
    next();
  } catch (err) {
    next(err);
  }
};
