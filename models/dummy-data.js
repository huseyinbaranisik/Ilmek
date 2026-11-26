// ============================================================
//  models/dummy-data.js - Örnek veriler (dersteki dummy-data.js gibi)
//  Sadece veritabanı boşsa (hiç rol yoksa) çalışır.
// ============================================================
const bcrypt = require("bcrypt");
const Rol = require("./rol");
const Kullanici = require("./kullanici");
const Kategori = require("./kategori");
const Urun = require("./urun");
const Siparis = require("./siparis");
const Yorum = require("./yorum");
const Duyuru = require("./duyuru");
const Soru = require("./soru");
const Galeri = require("./galeri");
const Sayac = require("./sayac");
const { slugField } = require("../helpers/slugfield");
const puanGuncelle = require("../helpers/puan");

async function populate() {
  const rolSayisi = await Rol.count();
  if (rolSayisi > 0) return; // veriler zaten var
  console.log("Veritabanı boş, örnek veriler ekleniyor...");

  // ---------- Roller ve kullanıcılar ----------
  await Rol.bulkCreate([{ ad: "Admin" }, { ad: "Üye" }]); // id: 1 = Admin, 2 = Üye
  const sifre = await bcrypt.hash("123456", 10);
  await Kullanici.create({ kullaniciAdi: "admin", sifre: await bcrypt.hash("admin123", 10), rolId: 1 });
  const ayse = await Kullanici.create({ kullaniciAdi: "ayse", sifre, rolId: 2, magazaAdi: "Ayşe'nin İlmekleri", sehir: "İzmir",
    hakkinda: "30 yıldır şiş örüyorum. Kazaklar, hırkalar, bereler ve atkılar; hepsi doğal yünden, sipariş üzerine." });
  const mehmet = await Kullanici.create({ kullaniciAdi: "mehmet", sifre, rolId: 2, magazaAdi: "Tığ Atölyesi", sehir: "Bolu",
    hakkinda: "Tığla amigurumi oyuncaklar ve solmayan örgü çiçekler yapıyorum. Her biri tek tek elde örülür." });
  const zeynep = await Kullanici.create({ kullaniciAdi: "zeynep", sifre, rolId: 2, magazaAdi: "Minik İlmek", sehir: "Eskişehir",
    hakkinda: "Bebekler için yumuşacık örgüler: patikler, kazaklar, battaniyeler. Bebek dostu pamuk ve merinos iplik." });
  const elif = await Kullanici.create({ kullaniciAdi: "elif", sifre, rolId: 2, magazaAdi: "Elif Örgü Evi", sehir: "İstanbul",
    hakkinda: "Çoraplar, eldivenler, şallar ve tığ işi çantalar. Renkli ve neşeli örgüler seviyorum." });
  const can = await Kullanici.create({ kullaniciAdi: "can", sifre, rolId: 2 }); // sadece alıcı

  await Sayac.create({ ad: "ziyaretci", deger: 0 });

  // ---------- Kategoriler ----------
  const kategoriler = {};
  for (const [ad, ikon] of [["Bere & Şapka", "snow"], ["Atkı & Şal", "wind"], ["Kazak & Hırka", "person-standing-dress"], ["Bebek Örgüleri", "balloon-heart"],
    ["Amigurumi", "emoji-smile"], ["Ev & Dekor", "house-heart"], ["Çorap & Eldiven", "snow2"], ["Çanta & Aksesuar", "bag-heart"]]) {
    kategoriler[ad] = await Kategori.create({ ad, ikon, slug: slugField(ad) }); // "Bere & Şapka" -> /kategori/bere-ve-sapka
  }

  // ---------- Ürünler ----------
  // Resimler public/img/urunler/ klasöründe, veritabanına sadece adresleri yazılır
  const urunler = {};
  const liste = [
    // [ad, kategori, satıcı, fiyat, stok, iplik, hazırlanma günü, resim, açıklama]
    ["El Örgüsü Bere", "Bere & Şapka", ayse, 350, 5, "Yün", 3, "bere.jpg", "İçi astarlı, kıvrık kenarlı yün bere. Kış için sıcacık. Renk seçeneği için sipariş notuna yazabilirsiniz."],
    ["Çizgili Yün Atkı", "Atkı & Şal", ayse, 480, 3, "Yün", 5, "atki.jpg", "180 cm uzunluğunda, kırmızı-siyah çizgili, yumuşacık yün atkı."],
    ["Saç Örgülü Kazak", "Kazak & Hırka", ayse, 1450, 2, "Merinos", 12, "kazak.jpg", "Önü saç örgüsü desenli, bol kesim kazak. S, M ve L bedenleri sipariş üzerine örülür; bedeninizi nota yazın."],
    ["Pembe Motifli Hırka", "Kazak & Hırka", ayse, 1250, 1, "Alpaka", 10, "hirka.jpg", "Yaka kısmı beyaz motifli, düğmeli alpaka hırka. Hafif ve çok sıcak tutar."],
    ["Bebek Patiği", "Bebek Örgüleri", zeynep, 220, 8, "Pamuk", 2, "patik.jpg", "0-6 ay için, bebek dostu pamuk iplikten. Kaymaz tabanlı, bileği bağcıklı."],
    ["Bebek Kazağı", "Bebek Örgüleri", zeynep, 520, 4, "Merinos", 6, "bebek.jpg", "Kaşınmayan merinos iplikten, omzu düğmeli bebek kazağı. İsim işlemesi yapılabilir."],
    ["Kalın Örgü Battaniye", "Ev & Dekor", zeynep, 1890, 2, "Merinos", 7, "battaniye.jpg", "Kalın merinos iplikle elde örülmüş, 120x150 cm battaniye. Koltukta ve yatakta çok şık durur."],
    ["Amigurumi Ayıcık", "Amigurumi", mehmet, 290, 8, "Pamuk", 4, "ayicik.jpg", "20 cm boyunda. Göz ve burun işlemedir, küçük çocuklar için güvenlidir."],
    ["Amigurumi Tavşan", "Amigurumi", mehmet, 320, 6, "Pamuk", 4, "tavsan.jpg", "Elinde havuçla 25 cm boyunda tavşan. İçi antialerjik elyaf dolgulu."],
    ["Tığ İşi Çiçek Buketi", "Ev & Dekor", mehmet, 380, 5, "Pamuk", 3, "cicek.jpg", "Solmayan, sulanmayan çiçekler! 7 dallı buket, renkler isteğe göre değişebilir."],
    ["Çizgili Yün Çorap", "Çorap & Eldiven", elif, 240, 10, "Yün", 3, "corap.jpg", "Kalın yün ev çorabı. 36-40 numara arası, kışın ayaklar hiç üşümez."],
    ["Motifli Yün Eldiven", "Çorap & Eldiven", elif, 330, 6, "Yün", 4, "eldiven.jpg", "Kar tanesi motifli, çift kat örülmüş parmaksız eldiven."],
    ["Kare Motifli Şal", "Atkı & Şal", elif, 690, 3, "Akrilik", 8, "sal.jpg", "Renkli kare motiflerin birleştirilmesiyle yapılmış şal. Omuza da dizlere de olur."],
    ["Tığ İşi File Çanta", "Çanta & Aksesuar", elif, 360, 5, "Pamuk", 3, "canta.jpg", "Pazar ve plaj için tığ işi file çanta. Uzun saplı, yıkanabilir pamuk."],
  ];
  for (const [baslik, kategori, satici, fiyat, stok, iplik, hazirlikGunu, resim, aciklama] of liste) {
    urunler[baslik] = await Urun.create({
      baslik, slug: slugField(baslik), aciklama, fiyat, stok, iplik, hazirlikGunu, onayli: true,
      resim: "/img/urunler/" + resim,
      goruntulenme: Math.floor(Math.random() * 900) + 100,
      kategoriId: kategoriler[kategori].id, kullaniciId: satici.id,
    });
  }
  // Onay bekleyen örnek ürün (admin panelinde görünür)
  await Urun.create({ baslik: "Örgü Yastık Kılıfı", slug: "orgu-yastik-kilifi", aciklama: "40x40 cm, düğmeli, pirinç örgüsü desenli.", fiyat: 390, stok: 2,
    iplik: "Pamuk", hazirlikGunu: 5, resim: "/img/urunler/yastik.jpg", onayli: false, kategoriId: kategoriler["Ev & Dekor"].id, kullaniciId: ayse.id });

  // ---------- Siparişler ve yorumlar ----------
  // can birkaç şey sipariş etmiş: bazıları teslim edilmiş (yorum yazabilir), biri yolda, biri onay bekliyor
  const siparisler = [
    [can, "El Örgüsü Bere", 1, "teslim", "Hardal renk olursa çok sevinirim."],
    [can, "Bebek Patiği", 2, "teslim", "Yeğenim için, mavi olsun lütfen."],
    [can, "Amigurumi Ayıcık", 1, "kargoda", null],
    [can, "Pembe Motifli Hırka", 1, "beklemede", "M beden. Hediye paketi yapabilir misiniz?"],
    [elif, "Amigurumi Tavşan", 1, "teslim", null],
    [mehmet, "El Örgüsü Bere", 1, "teslim", null],
  ];
  for (const [alici, baslik, adet, durum, aliciNotu] of siparisler) {
    const u = urunler[baslik];
    await Siparis.create({ adet, toplam: adet * u.fiyat, durum, aliciNotu, adres: "Örnek Mah. Deneme Sok. No:1, " + (alici.sehir || "Ankara"),
      urunId: u.id, aliciId: alici.id, saticiId: u.kullaniciId });
  }
  const yorumlar = [
    [can, "El Örgüsü Bere", 5, "Tam istediğim renk, çok sıcak tutuyor. Ayşe Hanım'a teşekkürler!"],
    [can, "Bebek Patiği", 5, "Minicik ve çok yumuşak, yeğenim bayıldı."],
    [elif, "Amigurumi Tavşan", 5, "İlmekler o kadar düzgün ki! Tam bir sanat eseri."],
    [mehmet, "El Örgüsü Bere", 4, "Kızıma aldım, çok beğendi."],
  ];
  for (const [k, baslik, puan, metin] of yorumlar) await Yorum.create({ puan, metin, kullaniciId: k.id, urunId: urunler[baslik].id });
  for (const baslik in urunler) await puanGuncelle(urunler[baslik].id);

  // ---------- Favoriler ve takip ----------
  await can.addFavoriler([urunler["Kalın Örgü Battaniye"], urunler["Saç Örgülü Kazak"], urunler["Tığ İşi Çiçek Buketi"]]);
  await elif.addFavoriler([urunler["Çizgili Yün Atkı"]]);
  await can.addTakipEdilenler([ayse, zeynep]); // can bu mağazaları takip ediyor
  await elif.addTakipEdilen(zeynep);

  // ---------- Galeri: atölyelerden kareler ----------
  for (const [resim, aciklama] of [["orgu_eller.jpg", "Akşam örgüsü"], ["yumak.jpg", "Yeni gelen yumaklar"], ["ip_rafi.jpg", "Elif'in ip rafı"],
    ["kazak.jpg", "Ayşe'nin kış koleksiyonu"], ["tavsan.jpg", "Tığ Atölyesi'nin yeni üyesi"], ["battaniye.jpg", "Minik İlmek'ten kalın örgü"]]) {
    await Galeri.create({ resim: "/img/urunler/" + resim, aciklama });
  }

  // ---------- Duyurular ----------
  const duyurular = [
    ["İlmek açıldı!", "El örgüsü ürünlerin buluşma yeri İlmek yayında. Kazaklardan amigurumilere, örgücülerin elinden çıkan her şey burada. Beğendiklerinizi favorilere ekleyin, örgücülere sipariş talebi gönderin.", "2026-11-10T10:00:00"],
    ["Sen de örgülerini sat", "Örgü ören herkes üye olup kendi mağazasını açabilir. Ürünlerinizi iplik türü ve hazırlanma süresiyle ekleyin, yönetici onayından sonra yayınlanır.", "2026-11-18T12:00:00"],
    ["Yılbaşı örgüleri için son sipariş tarihi", "Bir kazağın örülmesi iki haftayı bulabilir. Yılbaşına yetişmesi için siparişlerinizi 10 Aralık'a kadar verin.", "2026-11-24T09:00:00"],
  ];
  for (const [baslik, icerik, tarih] of duyurular) {
    await Duyuru.create({ baslik, slug: slugField(baslik), icerik, tarih });
  }

  // ---------- S.S.S. ----------
  await Soru.bulkCreate([
    { soru: "Ödemeyi nasıl yapıyorum?", cevap: "İlmek'te online ödeme yok. Sipariş talebinizi satıcı kabul ettikten sonra ödeme ve kargo detaylarını satıcıyla kararlaştırırsınız.", yayinda: true },
    { soru: "Ürün eklediğim halde neden görünmüyor?", cevap: "Eklenen ürünler yönetici onayından sonra yayınlanır. Onay bekleyen ürünlerinizi 'Ürünlerim' sayfasında görebilirsiniz.", yayinda: true },
    { soru: "Her ürüne yorum yazabilir miyim?", cevap: "Hayır, sadece satın alıp teslim aldığınız ürünlere yorum yazabilirsiniz. Böylece yorumlar gerçek alıcılardan gelir.", yayinda: true },
    { soru: "Örgüler neden hemen gönderilmiyor?", cevap: "Ürünlerin çoğu sipariş üzerine elde örülüyor. Her ürünün sayfasında 'Hazırlanma' süresi yazıyor; satıcı onayladıktan sonra o kadar günde örülüp kargoya verilir.", yayinda: true },
    { soru: "Yün ürünleri nasıl yıkamalıyım?", cevap: "Yün, merinos ve alpaka ürünleri 30 derecede elde, yün şampuanıyla yıkayın, sıkmadan düz bir yüzeyde kurutun. Pamuklu ürünler makinede hassas programda yıkanabilir.", yayinda: true },
    { soru: "Kendi rengimi seçebilir miyim?", cevap: null, yayinda: false }, // cevapsız örnek soru
  ]);
}

module.exports = populate;
