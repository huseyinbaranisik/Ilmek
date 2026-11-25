// ============================================================
//  models/dummy-data.js - Örnek veriler (dersteki dummy-data.js gibi)
//  Sadece veritabanı boşsa (hiç rol yoksa) çalışır.
//  Müzikler bu proje için bir script'le üretildi, telifsizdir.
// ============================================================
const bcrypt = require("bcrypt");
const Rol = require("./rol");
const Kullanici = require("./kullanici");
const Sarki = require("./sarki");
const Inceleme = require("./inceleme");
const Liste = require("./liste");
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

  const admin = await Kullanici.create({ kullaniciAdi: "admin", sifre: await bcrypt.hash("admin123", 10), rolId: 1 });
  const deniz = await Kullanici.create({ kullaniciAdi: "deniz", sifre: await bcrypt.hash("123456", 10), rolId: 2 });
  const ece = await Kullanici.create({ kullaniciAdi: "ece", sifre: await bcrypt.hash("123456", 10), rolId: 2 });

  await Sayac.create({ ad: "ziyaretci", deger: 0 });

  // ---------- Albümler ve şarkılar ----------
  // En son eklenen albüm ana sayfada "Haftanın albümü" olarak görünür.
  const albumler = [
    { album: "Eski Plak",   sanatci: "Gramofon",    renk: "#444441", sarkilar: ["Eski Plak"] },
    { album: "Pembe Neon",  sanatci: "Gece Kulübü", renk: "#72243E", sarkilar: ["Pembe Neon"], kapak: "pembe-neon.png" },
    { album: "Gün Batımı",  sanatci: "Kum Tanesi",  renk: "#854F0B", sarkilar: ["Gün Batımı"] },
    { album: "Orman Yolu",  sanatci: "Yeşil Vadi",  renk: "#0F6E56", sarkilar: ["Orman Yolu", "Sabah Çiyi"] },
    { album: "Kızıl Gün",   sanatci: "Ateş Böceği", renk: "#993C1D", sarkilar: ["Kızıl Gün", "Kor"] },
    { album: "Gece Yarısı", sanatci: "Mavi Gece",   renk: "#185FA5", sarkilar: ["Sessiz Sokaklar", "Yağmur Sonrası", "Neon Işıklar"] },
  ];
  const ornekDinlenme = [412, 1890, 2650, 3120, 980, 2210, 1540, 2930, 1170, 640];
  const sarkilar = {}; // { "Kor": sarkiNesnesi, ... } -> aşağıda inceleme eklerken lazım
  let sira = 0;
  for (const a of albumler) {
    const albumSlug = slugField(a.album);
    // Resimler veritabanına konmaz: dosya public/img/kapaklar/ klasöründe durur, veritabanına sadece adresi (URL) yazılır
    // Kapak dosyası belirtilmediyse albüm adıyla aynı isimli .svg kullanılır
    const kapak = "/img/kapaklar/" + (a.kapak || albumSlug + ".svg");
    for (const baslik of a.sarkilar) {
      const slug = slugField(baslik);
      sarkilar[baslik] = await Sarki.create({
        baslik, slug, sanatci: a.sanatci, album: a.album, albumSlug, kapak,
        dosya: "/muzik/" + slug + ".wav", renk: a.renk, dinlenme: ornekDinlenme[sira++],
        onayli: true, kullaniciId: admin.id,
      });
    }
    await Galeri.create({ resim: kapak, aciklama: a.album + " - " + a.sanatci });
  }

  // ---------- İncelemeler (Letterboxd kısmı) ----------
  const incelemeler = [
    [deniz, "Sessiz Sokaklar", 5, "Gece yürüyüşlerinin şarkısı. Synth girişi tüyleri diken diken ediyor."],
    [deniz, "Yağmur Sonrası", 4, "Albümün en sakin parçası, pencere kenarında dinlenir."],
    [deniz, "Kor", 3, null],
    [ece, "Sessiz Sokaklar", 4, "Güzel ama biraz kısa kalmış, keşke 2 dakika daha sürseydi."],
    [ece, "Orman Yolu", 5, "Sabah işe giderken açıyorum, günü güzel başlatıyor."],
    [ece, "Pembe Neon", 3, "Fena değil, nakarat akılda kalıyor."],
  ];
  for (const [k, baslik, puan, yorum] of incelemeler) {
    await Inceleme.create({ kullaniciId: k.id, sarkiId: sarkilar[baslik].id, puan, yorum });
  }
  for (const baslik in sarkilar) await puanGuncelle(sarkilar[baslik].id);

  // ---------- Listeler ----------
  const liste1 = await Liste.create({ baslik: "Yağmurlu gün şarkıları", slug: "yagmurlu-gun-sarkilari", aciklama: "Cam kenarı, sıcak çay, bu liste.", kullaniciId: deniz.id });
  await liste1.addSarkilar([sarkilar["Yağmur Sonrası"], sarkilar["Sessiz Sokaklar"], sarkilar["Eski Plak"]]);
  const liste2 = await Liste.create({ baslik: "Sabah enerjisi", slug: "sabah-enerjisi", aciklama: "Güne iyi başlamak için.", kullaniciId: ece.id });
  await liste2.addSarkilar([sarkilar["Orman Yolu"], sarkilar["Sabah Çiyi"], sarkilar["Gün Batımı"], sarkilar["Kızıl Gün"]]);

  // ---------- Beğeniler ve takip (Spotify kısmı) ----------
  await deniz.addBegenilenler([sarkilar["Yağmur Sonrası"], sarkilar["Sessiz Sokaklar"], sarkilar["Orman Yolu"]]);
  await ece.addBegenilenler([sarkilar["Kızıl Gün"], sarkilar["Sabah Çiyi"], sarkilar["Pembe Neon"], sarkilar["Gün Batımı"]]);
  await deniz.addTakipEdilen(ece);  // deniz, ece'yi takip ediyor
  await ece.addTakipEdilen(deniz);  // ece, deniz'i takip ediyor

  // ---------- Duyurular ----------
  const duyurular = [
    ["Gramofy yayında!", "Müzik dinleme sitemiz Gramofy açıldı. Albümleri keşfedin, şarkıları dinleyin, sorularınızı S.S.S. sayfasından bize iletin.", "2026-11-10T10:00:00"],
    ["Artık şarkılara puan verebilirsiniz", "Üye olun, dinlediğiniz şarkılara 1-5 yıldız verin, inceleme yazın ve kendi listelerinizi oluşturun. Kendi şarkılarınızı da yükleyebilirsiniz!", "2026-11-18T12:00:00"],
    ["Yeni albüm: Gece Yarısı", "Mavi Gece grubunun yeni albümü Gece Yarısı 3 şarkıyla Gramofy'da! Sessiz Sokaklar, Yağmur Sonrası ve Neon Işıklar şarkılarını hemen dinleyebilirsiniz.", "2026-11-24T09:00:00"],
  ];
  for (const [baslik, icerik, tarih] of duyurular) {
    await Duyuru.create({ baslik, slug: slugField(baslik), icerik, tarih });
  }

  // ---------- S.S.S. ----------
  await Soru.bulkCreate([
    { soru: "Şarkıları dinlemek için üye olmam gerekiyor mu?", cevap: "Hayır, misafir olarak bütün şarkıları dinleyebilirsiniz. Puan vermek, inceleme yazmak, liste oluşturmak ve şarkı yüklemek için üye olmanız gerekir.", yayinda: true },
    { soru: "Yüklediğim şarkı neden hemen görünmüyor?", cevap: "Üyelerin yüklediği şarkılar yönetici onayından sonra yayınlanır. Onay bekleyen şarkılarınızı profil sayfanızda görebilirsiniz.", yayinda: true },
    { soru: "\"Şu an dinliyor\" sayısı nasıl hesaplanıyor?", cevap: "Bir şarkıyı çalan her ziyaretçinin tarayıcısı birkaç saniyede bir sunucuya haber verir. Son 40 saniyede haber veren kişiler sayılır.", yayinda: true },
    { soru: "Mobil uygulamanız var mı?", cevap: null, yayinda: false }, // cevapsız örnek soru
  ]);
}

module.exports = populate;
