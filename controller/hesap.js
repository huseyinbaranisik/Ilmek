// ============================================================
//  controller/hesap.js - Üyelerin işlemleri
//  (inceleme yazma, liste oluşturma, şarkı yükleme)
//  Bu fonksiyonlara sadece giriş yapmış kullanıcılar ulaşabilir (routes/hesap.js -> isAuth)
// ============================================================
const Sarki = require("../models/sarki");
const Inceleme = require("../models/inceleme");
const Liste = require("../models/liste");
const Kullanici = require("../models/kullanici");
const { slugField, benzersizSlug } = require("../helpers/slugfield");
const puanGuncelle = require("../helpers/puan");

// İşlem bitince kullanıcıyı geldiği sayfaya geri gönderir
function geriDon(req, res) {
  res.redirect(req.get("Referer") || "/");
}

// ---------- İnceleme ----------
// Üyenin bu şarkı için incelemesi varsa güncellenir, yoksa yenisi oluşturulur.
exports.incelemeKaydet = async (req, res, next) => {
  try {
    const sarki = await Sarki.findOne({ where: { id: req.params.sarkiId, onayli: true } });
    const puan = Number(req.body.puan);
    if (!sarki || !(puan >= 1 && puan <= 5)) {
      req.session.mesaj = { tur: "hata", metin: "Lütfen 1 ile 5 arasında bir puan seçin." };
      return geriDon(req, res);
    }
    const yorum = (req.body.yorum || "").trim().slice(0, 2000) || null;
    const kullaniciId = req.session.kullanici.id;

    const eski = await Inceleme.findOne({ where: { kullaniciId, sarkiId: sarki.id } });
    if (eski) {
      eski.puan = puan;
      eski.yorum = yorum;
      await eski.save();
    } else {
      await Inceleme.create({ kullaniciId, sarkiId: sarki.id, puan, yorum });
    }
    await puanGuncelle(sarki.id); // ortalama puanı yeniden hesapla
    req.session.mesaj = { tur: "basari", metin: "İncelemen kaydedildi." };
    res.redirect("/sarki/" + sarki.slug);
  } catch (err) {
    next(err);
  }
};

// İncelemeyi sadece yazan kişi ya da admin silebilir
exports.incelemeSil = async (req, res, next) => {
  try {
    const inceleme = await Inceleme.findByPk(req.params.id);
    const ben = req.session.kullanici;
    if (inceleme && (inceleme.kullaniciId === ben.id || ben.admin)) {
      await inceleme.destroy();
      await puanGuncelle(inceleme.sarkiId);
      req.session.mesaj = { tur: "basari", metin: "İnceleme silindi." };
    }
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

// ---------- Listeler ----------
exports.listeOlustur = async (req, res, next) => {
  try {
    const baslik = (req.body.baslik || "").trim();
    if (!baslik) {
      req.session.mesaj = { tur: "hata", metin: "Liste adı boş olamaz." };
      return geriDon(req, res);
    }
    const liste = await Liste.create({
      baslik: baslik.slice(0, 100),
      slug: await benzersizSlug(Liste, baslik),
      aciklama: (req.body.aciklama || "").trim().slice(0, 500),
      kullaniciId: req.session.kullanici.id,
    });
    // Şarkı sayfasından oluşturulduysa o şarkıyı hemen listeye ekle
    if (req.body.sarkiId) {
      const sarki = await Sarki.findOne({ where: { id: req.body.sarkiId, onayli: true } });
      if (sarki) await liste.addSarki(sarki);
    }
    req.session.mesaj = { tur: "basari", metin: '"' + liste.baslik + '" listesi oluşturuldu.' };
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

// Listeyi bulur, ama sadece sahibi değiştirebilir
async function benimListem(req) {
  const liste = await Liste.findByPk(req.params.id);
  if (!liste || liste.kullaniciId !== req.session.kullanici.id) return null;
  return liste;
}

exports.listeyeEkle = async (req, res, next) => {
  try {
    const liste = await benimListem(req);
    const sarki = await Sarki.findOne({ where: { id: req.body.sarkiId, onayli: true } });
    if (liste && sarki) {
      await liste.addSarki(sarki); // ara tabloya (listeSarki) satır ekler
      req.session.mesaj = { tur: "basari", metin: '"' + sarki.baslik + '", "' + liste.baslik + '" listesine eklendi.' };
    }
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

exports.listedenCikar = async (req, res, next) => {
  try {
    const liste = await benimListem(req);
    if (liste) await liste.removeSarki(req.params.sarkiId); // ara tablodan satırı siler
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

exports.listeSil = async (req, res, next) => {
  try {
    const liste = await benimListem(req);
    if (liste) {
      await liste.destroy();
      req.session.mesaj = { tur: "basari", metin: "Liste silindi." };
    }
    res.redirect("/uye/" + req.session.kullanici.ad);
  } catch (err) {
    next(err);
  }
};

// ---------- Beğenilen şarkılar (kalp) ----------
// Oynatıcı ve şarkı sayfasındaki kalp düğmesi fetch ile buraya POST atar, cevap JSON'dur.
exports.begen = async (req, res, next) => {
  try {
    const sarki = await Sarki.findOne({ where: { id: req.params.sarkiId, onayli: true } });
    if (!sarki) return res.status(404).json({ hata: "Şarkı bulunamadı" });
    const ben = await Kullanici.findByPk(req.session.kullanici.id);
    const begenmisim = await ben.hasBegenilen(sarki);     // ara tabloda (begeni) satır var mı?
    if (begenmisim) await ben.removeBegenilen(sarki);    // varsa sil
    else await ben.addBegenilen(sarki);                  // yoksa ekle
    res.json({ begendi: !begenmisim });
  } catch (err) {
    next(err);
  }
};

// ---------- Takip et / takibi bırak ----------
exports.takip = async (req, res, next) => {
  try {
    const uye = await Kullanici.findOne({ where: { kullaniciAdi: req.params.kullaniciAdi } });
    const ben = await Kullanici.findByPk(req.session.kullanici.id);
    if (uye && uye.id !== ben.id) {                       // kendini takip edemezsin
      if (await ben.hasTakipEdilen(uye)) {
        await ben.removeTakipEdilen(uye);
        req.session.mesaj = { tur: "basari", metin: uye.kullaniciAdi + " artık takip edilmiyor." };
      } else {
        await ben.addTakipEdilen(uye);
        req.session.mesaj = { tur: "basari", metin: uye.kullaniciAdi + " takip ediliyor." };
      }
    }
    geriDon(req, res);
  } catch (err) {
    next(err);
  }
};

// ---------- Şarkı yükleme ----------
exports.getYukle = async (req, res) => {
  // Kapak seçilmezse kullanılabilecek mevcut albümler
  const albumler = await Sarki.findAll({ attributes: ["album"], where: { onayli: true }, group: ["albumSlug"], raw: true });
  res.render("hesap/yukle", { albumler });
};

// Not: Dosya yüklenen formlarda (multipart) CSRF anahtarı adreste gelir: action="/hesap/yukle?_csrf=..."
// Çünkü csurf, multer formu okumadan önce çalışır ve req.body henüz boştur.
exports.postYukle = async (req, res, next) => {
  try {
    const { baslik, sanatci, album, renk } = req.body;
    const kapakDosya = req.files && req.files.kapak && req.files.kapak[0];
    const sesDosya = req.files && req.files.ses && req.files.ses[0];

    if (!baslik || !sanatci || !album || !sesDosya) {
      req.session.mesaj = { tur: "hata", metin: "Şarkı adı, sanatçı, albüm ve ses dosyası (mp3, wav, ogg) zorunlu." };
      return res.redirect("/hesap/yukle");
    }
    const albumSlug = slugField(album);
    // Kapak yüklenmediyse aynı albümün mevcut kapağını kullan
    const mevcut = await Sarki.findOne({ where: { albumSlug } });
    const kapak = kapakDosya ? "/img/yuklenen/" + kapakDosya.filename : mevcut && mevcut.kapak;
    if (!kapak) {
      req.session.mesaj = { tur: "hata", metin: "Yeni bir albüm için kapak resmi (jpg, png, webp, gif) yüklemelisiniz." };
      return res.redirect("/hesap/yukle");
    }

    const admin = req.session.kullanici.admin;
    const sarki = await Sarki.create({
      baslik, sanatci, album, albumSlug, kapak,
      slug: await benzersizSlug(Sarki, baslik),
      dosya: "/muzik/yuklenen/" + sesDosya.filename,
      renk: /^#[0-9a-fA-F]{6}$/.test(renk) ? renk : "#3C3489",
      onayli: admin,                          // admin yüklerse hemen yayınlanır, üye yüklerse onay bekler
      kullaniciId: req.session.kullanici.id,
    });

    if (admin) {
      req.session.mesaj = { tur: "basari", metin: '"' + baslik + '" yayınlandı.' };
      return res.redirect("/sarki/" + sarki.slug);
    }
    req.session.mesaj = { tur: "basari", metin: '"' + baslik + '" yüklendi. Yönetici onayladıktan sonra yayınlanacak.' };
    res.redirect("/uye/" + req.session.kullanici.ad);
  } catch (err) {
    next(err);
  }
};
