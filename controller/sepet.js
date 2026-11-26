// ============================================================
//  controller/sepet.js - Sepet, ödeme ve sipariş sorgulama
//
//  Sepet sunucuda DEĞİL, tarayıcıda (localStorage) tutulur. Bu yüzden misafir de sepet oluşturabilir.
//  Sepetin içinde sadece ürün id'si ve adet var: [{ id: 3, adet: 2 }, ...]
//  Fiyatı her zaman veritabanından alıyoruz, tarayıcıdan gelen fiyata güvenmiyoruz.
//
//  Ödeme sahte: kart bilgileri kontrol edilir ama kartın sadece son 4 hanesi kaydedilir.
// ============================================================
const Urun = require("../models/urun");
const Kullanici = require("../models/kullanici");
const Siparis = require("../models/siparis");

// ---------- Sepet sayfası ----------
// Sayfanın içini public/js/site.js dolduruyor (sepet tarayıcıda olduğu için)
exports.sepet = (req, res) => {
  res.render("sepet");
};

// ---------- Sepetteki ürünlerin bilgileri (site.js çağırır) ----------
// Örnek: /api/sepet?idler=3,5,8  ->  [{ id, baslik, fiyat, stok, resim, slug, satici }, ...]
exports.sepetBilgisi = async (req, res, next) => {
  try {
    const idler = (req.query.idler || "").split(",").map(Number).filter(id => id > 0);
    const urunler = await Urun.findAll({ where: { id: idler, onayli: true }, include: Kullanici });
    const liste = [];
    for (const urun of urunler) {
      liste.push({
        id: urun.id,
        baslik: urun.baslik,
        fiyat: urun.fiyat,
        stok: urun.stok,
        resim: urun.resim,
        slug: urun.slug,
        satici: urun.kullanici.magazaAdi || urun.kullanici.kullaniciAdi,
      });
    }
    res.json(liste);
  } catch (hata) {
    next(hata);
  }
};

// ---------- Ödeme sayfası ----------
exports.odemeSayfasi = async (req, res, next) => {
  try {
    let ben = null;
    if (req.session.isAuth) {
      ben = await Kullanici.findByPk(req.session.kullanici.id);
    }
    res.render("odeme", { ben: ben, hatalar: [], form: {} });
  } catch (hata) {
    next(hata);
  }
};

// Üyenin teslimat bilgileri tam mı? (ad soyad, telefon, e-posta, adres)
function bilgileriTamMi(kisi) {
  return kisi && kisi.adSoyad && kisi.telefon && kisi.eposta && kisi.adres;
}

// ---------- Ödeme yap: siparişleri oluştur ----------
exports.odemeYap = async (req, res, next) => {
  try {
    const hatalar = [];
    const form = req.body;

    // Giriş yapmış üye mi?
    let ben = null;
    if (req.session.isAuth) {
      ben = await Kullanici.findByPk(req.session.kullanici.id);
    }

    // 1) Sepet: formdaki gizli alanda JSON olarak geliyor
    let sepet = [];
    try {
      sepet = JSON.parse(form.sepet || "[]");
    } catch (e) {
      sepet = [];
    }
    if (!Array.isArray(sepet) || sepet.length == 0) {
      hatalar.push("Sepetiniz boş.");
    }

    // Sepetteki her ürünü veritabanından kontrol et
    const kalemler = [];
    for (const parca of sepet) {
      const urun = await Urun.findOne({ where: { id: parca.id, onayli: true } });
      const adet = parseInt(parca.adet);
      if (!urun) {
        hatalar.push("Sepetinizdeki bir ürün artık satışta değil, sepetten çıkarın.");
      } else if (!(adet >= 1)) {
        hatalar.push(urun.baslik + " için adet geçersiz.");
      } else if (adet > urun.stok) {
        hatalar.push(urun.baslik + " için stokta sadece " + urun.stok + " adet var.");
      } else if (ben && urun.kullaniciId == ben.id) {
        hatalar.push(urun.baslik + " sizin ürününüz, kendi ürününüzü alamazsınız.");
      } else {
        kalemler.push({ urun: urun, adet: adet });
      }
    }

    // 2) Teslimat bilgileri
    // Üyenin bilgileri hesabında kayıtlıysa onları kullan, yoksa formdan al.
    let teslimat;
    if (ben && bilgileriTamMi(ben)) {
      teslimat = { adSoyad: ben.adSoyad, telefon: ben.telefon, eposta: ben.eposta, adres: ben.adres };
    } else {
      teslimat = {
        adSoyad: (form.adSoyad || "").trim(),
        telefon: (form.telefon || "").replace(/\s/g, ""),
        eposta: (form.eposta || "").trim(),
        adres: (form.adres || "").trim(),
      };
      if (teslimat.adSoyad.length < 3) hatalar.push("Ad soyad yazın.");
      if (!/^0?5\d{9}$/.test(teslimat.telefon)) hatalar.push("Telefon numarası 05xx xxx xx xx şeklinde olmalı.");
      if (!teslimat.eposta.includes("@")) hatalar.push("Geçerli bir e-posta adresi yazın.");
      if (teslimat.adres.length < 10) hatalar.push("Teslimat adresini açık yazın.");
    }

    // 3) Kart bilgileri (her alışverişte girilir, üye de misafir de)
    const kartSahibi = (form.kartSahibi || "").trim();
    const kartNo = (form.kartNo || "").replace(/\s/g, "");   // boşlukları sil
    const sonKullanma = (form.sonKullanma || "").trim();      // "AA/YY"
    const cvv = (form.cvv || "").trim();

    if (kartSahibi.length < 3) hatalar.push("Kart üzerindeki ismi yazın.");
    if (!/^\d{16}$/.test(kartNo)) hatalar.push("Kart numarası 16 haneli olmalı.");
    if (!/^\d{3}$/.test(cvv)) hatalar.push("CVV 3 haneli olmalı.");

    // Son kullanma tarihi: ay 1-12 arası olmalı ve tarih geçmemiş olmalı
    const parcalar = sonKullanma.split("/");
    const ay = parseInt(parcalar[0]);
    const yil = 2000 + parseInt(parcalar[1]);
    const bugun = new Date();
    if (!(ay >= 1 && ay <= 12) || !(yil >= 2000)) {
      hatalar.push("Son kullanma tarihi AA/YY şeklinde olmalı (örnek: 08/28).");
    } else if (yil < bugun.getFullYear() || (yil == bugun.getFullYear() && ay < bugun.getMonth() + 1)) {
      hatalar.push("Kartın son kullanma tarihi geçmiş.");
    }

    // Hata varsa formu tekrar göster (kart numarası ve CVV'yi geri doldurmuyoruz)
    if (hatalar.length > 0) {
      delete form.kartNo;
      delete form.cvv;
      return res.render("odeme", { ben: ben, hatalar: hatalar, form: form });
    }

    // 4) Üye bilgilerini ilk kez yazdıysa hesabına kaydet, bir dahakine sormayalım
    if (ben && !bilgileriTamMi(ben)) {
      await ben.update(teslimat);
    }

    // 5) Siparişleri oluştur. Sepetteki her ürün bir satır, hepsinin numarası aynı.
    const siparisNo = "IL-" + Date.now();
    for (const kalem of kalemler) {
      await Siparis.create({
        siparisNo: siparisNo,
        adet: kalem.adet,
        toplam: kalem.adet * kalem.urun.fiyat,   // fiyat veritabanından
        adSoyad: teslimat.adSoyad,
        telefon: teslimat.telefon,
        eposta: teslimat.eposta,
        adres: teslimat.adres,
        aliciNotu: (form.aliciNotu || "").trim() || null,
        kartSon4: kartNo.slice(-4),             // sadece son 4 hane!
        urunId: kalem.urun.id,
        aliciId: ben ? ben.id : null,           // misafirse boş
        saticiId: kalem.urun.kullaniciId,
      });
      // Satıldığı için stoktan düş
      await kalem.urun.decrement("stok", { by: kalem.adet });
    }

    // Misafir de bu oturumda siparişini görebilsin diye numarayı oturuma yaz
    if (!req.session.siparisNolari) req.session.siparisNolari = [];
    req.session.siparisNolari.push(siparisNo);

    res.redirect("/siparis/" + siparisNo + "?yeni=1");
  } catch (hata) {
    next(hata);
  }
};

// ---------- Sipariş detayı ----------
// Kim görebilir: siparişi veren üye, bu oturumda sipariş veren misafir, admin
exports.siparisDetay = async (req, res, next) => {
  try {
    const satirlar = await Siparis.findAll({
      where: { siparisNo: req.params.siparisNo },
      include: [Urun, { model: Kullanici, as: "satici" }],
    });
    if (satirlar.length == 0) return next(); // böyle sipariş yok -> 404

    let gorebilir = false;
    const ben = req.session.kullanici;
    if (ben && (ben.admin || satirlar[0].aliciId == ben.id)) gorebilir = true;
    if (req.session.siparisNolari && req.session.siparisNolari.includes(req.params.siparisNo)) gorebilir = true;
    if (!gorebilir) return next();

    res.render("siparis", { satirlar: satirlar, yeni: req.query.yeni == "1" });
  } catch (hata) {
    next(hata);
  }
};

// ---------- Sipariş sorgulama (misafirler için) ----------
// Sipariş numarası ve e-posta doğruysa siparişi gösterir
exports.siparisSorgula = async (req, res, next) => {
  try {
    const no = (req.query.no || "").trim();
    const eposta = (req.query.eposta || "").trim();
    let hata = null;

    if (no && eposta) {
      const satir = await Siparis.findOne({ where: { siparisNo: no, eposta: eposta } });
      if (satir) {
        // Doğru: bu oturumda görebilsin, detay sayfasına gönder
        if (!req.session.siparisNolari) req.session.siparisNolari = [];
        req.session.siparisNolari.push(no);
        return res.redirect("/siparis/" + no);
      }
      hata = "Bu numara ve e-posta ile bir sipariş bulunamadı.";
    }
    res.render("siparis-sorgula", { no: no, eposta: eposta, hata: hata });
  } catch (hata) {
    next(hata);
  }
};
