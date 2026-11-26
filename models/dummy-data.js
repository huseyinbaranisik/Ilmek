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
    hakkinda: "30 yıldır örgü örüyorum. Bereler, atkılar ve amigurumi oyuncaklar; hepsi doğal yünden, sipariş üzerine." });
  const mehmet = await Kullanici.create({ kullaniciAdi: "mehmet", sifre, rolId: 2, magazaAdi: "Bolu Ahşap Atölyesi", sehir: "Bolu",
    hakkinda: "Ceviz ve gürgen ağacından mutfak eşyaları. Her parça elde oyulup zeytinyağıyla cilalanır." });
  const zeynep = await Kullanici.create({ kullaniciAdi: "zeynep", sifre, rolId: 2, magazaAdi: "Toprak & Fitil", sehir: "Eskişehir",
    hakkinda: "Çarkta şekillendirilmiş seramikler, soya mumları ve soğuk yöntemle yapılmış sabunlar." });
  const elif = await Kullanici.create({ kullaniciAdi: "elif", sifre, rolId: 2, magazaAdi: "Elif Takı & Bez", sehir: "İstanbul",
    hakkinda: "Doğal taşlı takılar ve kendi desenlerimle boyadığım bez çantalar." });
  const can = await Kullanici.create({ kullaniciAdi: "can", sifre, rolId: 2 }); // sadece alıcı

  await Sayac.create({ ad: "ziyaretci", deger: 0 });

  // ---------- Kategoriler ----------
  const kategoriler = {};
  for (const [ad, ikon] of [["Örgü", "basket"], ["Takı", "gem"], ["Seramik", "cup-hot"], ["Ahşap", "tree"], ["Mum & Sabun", "fire"], ["Dikiş & Kumaş", "bag-heart"]]) {
    kategoriler[ad] = await Kategori.create({ ad, ikon, slug: slugField(ad) });
  }

  // ---------- Ürünler ----------
  // Resimler public/img/urunler/ klasöründe, veritabanına sadece adresleri yazılır
  const urunler = {};
  const liste = [
    ["El Örgüsü Bere", "Örgü", ayse, 350, 5, "bere.jpg", "Yüzde yüz yün, içi astarlı. Kış için sıcacık. Renk seçeneği için sipariş notuna yazabilirsiniz."],
    ["Yün Atkı", "Örgü", ayse, 480, 3, "atki.jpg", "180 cm uzunluğunda, kırmızı-siyah çizgili, yumuşacık yün atkı."],
    ["Amigurumi Ayıcık", "Örgü", ayse, 290, 8, "ayicik.jpg", "Pamuk iplikten, 20 cm boyunda. Göz ve burun işlemedir, küçük çocuklar için güvenlidir."],
    ["Doğal Taşlı Kolye", "Takı", elif, 420, 4, "kolye.jpg", "Mavi doğal taşlı, gümüş kaplama zincirli kolye. Taşlar elle seçilip kesilir."],
    ["Gümüş Halka Küpe", "Takı", elif, 260, 6, "kupe.jpg", "925 ayar gümüş, el dövmesi örgü desenli halka küpe."],
    ["Sırlı Seramik Kupa", "Seramik", zeynep, 220, 10, "kupa.jpg", "Çarkta şekillendirilmiş, 350 ml. Bulaşık makinesinde yıkanabilir."],
    ["El Yapımı Vazo", "Seramik", zeynep, 540, 2, "vazo.jpg", "Pişmiş topraktan, sırsız, doğal dokulu vazo. Her biri birbirinden biraz farklıdır."],
    ["Ahşap Kaşık Seti", "Ahşap", mehmet, 310, 7, "kasik.jpg", "Gürgen ve ceviz, iki kaşıklık set. Zeytinyağı ile cilalanmıştır."],
    ["Ceviz Kesme Tahtası", "Ahşap", mehmet, 650, 3, "tahta.jpg", "Tek parça ceviz, 30 cm çapında. Ömürlük bir mutfak dostu."],
    ["Soya Mumu", "Mum & Sabun", zeynep, 180, 15, "mum.jpg", "Cam kavanozda, pamuk fitilli. Lavanta ve portakal kokulu, yaklaşık 40 saat yanar."],
    ["Zeytinyağlı Sabun", "Mum & Sabun", zeynep, 90, 30, "sabun.jpg", "Soğuk yöntemle, saf zeytinyağından. Katkısız ve kokusuz."],
    ["Kanvas Bez Çanta", "Dikiş & Kumaş", elif, 240, 9, "canta.jpg", "Kalın pamuklu kanvas, sağlam dikişli. İç cepli, alışverişe ve okula."],
  ];
  for (const [baslik, kategori, satici, fiyat, stok, resim, aciklama] of liste) {
    urunler[baslik] = await Urun.create({
      baslik, slug: slugField(baslik), aciklama, fiyat, stok, onayli: true,
      resim: "/img/urunler/" + resim,
      goruntulenme: Math.floor(Math.random() * 900) + 100,
      kategoriId: kategoriler[kategori].id, kullaniciId: satici.id,
    });
  }
  // Onay bekleyen örnek ürün (admin panelinde görünür)
  await Urun.create({ baslik: "Örgü Yastık Kılıfı", slug: "orgu-yastik-kilifi", aciklama: "40x40 cm, düğmeli.", fiyat: 390, stok: 2,
    resim: "/img/urunler/yastik.jpg", onayli: false, kategoriId: kategoriler["Örgü"].id, kullaniciId: ayse.id });

  // ---------- Siparişler ve yorumlar ----------
  // can birkaç şey sipariş etmiş: bazıları teslim edilmiş (yorum yazabilir), biri yolda, biri onay bekliyor
  const siparisler = [
    [can, "El Örgüsü Bere", 1, "teslim", "Hardal renk olursa çok sevinirim."],
    [can, "Sırlı Seramik Kupa", 2, "teslim", null],
    [can, "Ahşap Kaşık Seti", 1, "kargoda", null],
    [can, "Doğal Taşlı Kolye", 1, "beklemede", "Hediye paketi yapabilir misiniz?"],
    [elif, "Soya Mumu", 3, "teslim", null],
    [mehmet, "El Örgüsü Bere", 1, "teslim", null],
  ];
  for (const [alici, baslik, adet, durum, aliciNotu] of siparisler) {
    const u = urunler[baslik];
    await Siparis.create({ adet, toplam: adet * u.fiyat, durum, aliciNotu, adres: "Örnek Mah. Deneme Sok. No:1, " + (alici.sehir || "Ankara"),
      urunId: u.id, aliciId: alici.id, saticiId: u.kullaniciId });
  }
  const yorumlar = [
    [can, "El Örgüsü Bere", 5, "Tam istediğim renk, çok sıcak tutuyor. Ayşe Hanım'a teşekkürler!"],
    [can, "Sırlı Seramik Kupa", 4, "Çok güzel ama biraz küçük, yine de her sabah bununla içiyorum."],
    [elif, "Soya Mumu", 5, "Lavanta kokusu odayı sarıyor, tekrar alacağım."],
    [mehmet, "El Örgüsü Bere", 4, "Kızıma aldım, çok beğendi."],
  ];
  for (const [k, baslik, puan, metin] of yorumlar) await Yorum.create({ puan, metin, kullaniciId: k.id, urunId: urunler[baslik].id });
  for (const baslik in urunler) await puanGuncelle(urunler[baslik].id);

  // ---------- Favoriler ve takip ----------
  await can.addFavoriler([urunler["Ceviz Kesme Tahtası"], urunler["El Yapımı Vazo"], urunler["Gümüş Halka Küpe"]]);
  await elif.addFavoriler([urunler["Yün Atkı"]]);
  await can.addTakipEdilenler([ayse, zeynep]); // can bu mağazaları takip ediyor
  await elif.addTakipEdilen(zeynep);

  // ---------- Galeri: atölyelerden kareler ----------
  for (const [resim, aciklama] of [["kupa.jpg", "Zeynep'in atölyesinde sırlama günü"], ["bere.jpg", "Ayşe'nin kış koleksiyonu"],
    ["tahta.jpg", "Bolu'dan ceviz tahtalar"], ["kolye.jpg", "Elif'in taş seçimi"], ["mum.jpg", "Mum dökme günü"], ["canta.jpg", "Elif'in dikiş masası"]]) {
    await Galeri.create({ resim: "/img/urunler/" + resim, aciklama });
  }

  // ---------- Duyurular ----------
  const duyurular = [
    ["İlmek açıldı!", "El emeği ürünlerin buluşma yeri İlmek yayında. Ürünlere göz atın, beğendiklerinizi favorilere ekleyin, satıcılara sipariş talebi gönderin.", "2026-11-10T10:00:00"],
    ["Sen de mağaza aç", "Üye olan herkes kendi el yapımı ürünlerini ekleyebilir. Ürünleriniz yönetici onayından sonra yayınlanır.", "2026-11-18T12:00:00"],
    ["Yılbaşı hediyeleri için son sipariş tarihi", "El yapımı ürünler hazırlanmak için zaman ister. Yılbaşına yetişmesi için siparişlerinizi 20 Aralık'a kadar verin.", "2026-11-24T09:00:00"],
  ];
  for (const [baslik, icerik, tarih] of duyurular) {
    await Duyuru.create({ baslik, slug: slugField(baslik), icerik, tarih });
  }

  // ---------- S.S.S. ----------
  await Soru.bulkCreate([
    { soru: "Ödemeyi nasıl yapıyorum?", cevap: "İlmek'te online ödeme yok. Sipariş talebinizi satıcı kabul ettikten sonra ödeme ve kargo detaylarını satıcıyla kararlaştırırsınız.", yayinda: true },
    { soru: "Ürün eklediğim halde neden görünmüyor?", cevap: "Eklenen ürünler yönetici onayından sonra yayınlanır. Onay bekleyen ürünlerinizi 'Ürünlerim' sayfasında görebilirsiniz.", yayinda: true },
    { soru: "Her ürüne yorum yazabilir miyim?", cevap: "Hayır, sadece satın alıp teslim aldığınız ürünlere yorum yazabilirsiniz. Böylece yorumlar gerçek alıcılardan gelir.", yayinda: true },
    { soru: "Yurt dışına gönderim var mı?", cevap: null, yayinda: false }, // cevapsız örnek soru
  ]);
}

module.exports = populate;
