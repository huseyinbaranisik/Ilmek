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
  const burak = await Kullanici.create({ kullaniciAdi: "burak", sifre, rolId: 2, magazaAdi: "Kuzey Örgü", sehir: "Erzurum",
    hakkinda: "Erzurum kışına dayanıklı kalın örgüler: yelekler, boyunluklar, tozluklar. Örgüyü babaannemden öğrendim." });
  const gul = await Kullanici.create({ kullaniciAdi: "gul", sifre, rolId: 2, magazaAdi: "Gül'ün Tığı", sehir: "Trabzon",
    hakkinda: "Tığ işi her şey: dantel şallar, battaniyeler, sepetler, plaj çantaları. Ev için örgüler en sevdiğim." });
  // can sadece alıcı. Teslimat bilgileri kayıtlı olduğu için ödemede adres sorulmaz.
  const can = await Kullanici.create({ kullaniciAdi: "can", sifre, rolId: 2, adSoyad: "Can Yılmaz", telefon: "05321234567",
    eposta: "can@ornek.com", adres: "Atatürk Mah. Çınar Sok. No:12 D:3, Çankaya / Ankara" });

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

    // Ayşe'nin İlmekleri
    ["Ponponlu Kış Beresi", "Bere & Şapka", ayse, 390, 6, "Yün", 3, "ponponlu_bere.jpg", "Saç örgüsü desenli, kocaman ponponlu bere. Kıvrık kenarı kulakları tamamen kapatır."],
    ["Balıkçı Yaka Kazak", "Kazak & Hırka", ayse, 1650, 2, "Merinos", 14, "balikci_kazak.jpg", "Boğazlı, kalın merinos kazak. Hardal, krem ve bej renkleri var, rengi sipariş notuna yazın."],
    // Kuzey Örgü
    ["Tığ İşi Boyunluk", "Atkı & Şal", burak, 420, 5, "Yün", 4, "tig_sapka.jpg", "Tarçın rengi, kalın dokulu boyunluk. Atkı gibi uçları sarkmaz, rüzgarda boyun açıkta kalmaz."],
    ["Lacivert Örgü Yelek", "Kazak & Hırka", burak, 980, 3, "Yün", 9, "yelek.jpg", "V yaka, lacivert yün yelek. Gömleğin üstüne de tişörtün üstüne de olur."],
    ["Gökkuşağı Atkı", "Atkı & Şal", burak, 450, 4, "Akrilik", 5, "renkli_atki.jpg", "Rengarenk çizgili, uzun ve yumuşak atkı. Kışın gri günlerine renk katar."],
    ["Yün Tozluk", "Çorap & Eldiven", burak, 260, 8, "Yün", 3, "tozluk.jpg", "Dizden bileğe, lastik örgülü tozluk. Bot içinde de, evde de sıcak tutar."],
    // Minik İlmek
    ["Bebek Beresi", "Bebek Örgüleri", zeynep, 180, 10, "Pamuk", 2, "bebek_bere.jpg", "Tavşan kulaklı yenidoğan beresi. 0-3 ay, kaşındırmayan pamuk iplik."],
    ["Bebek Battaniyesi", "Bebek Örgüleri", zeynep, 890, 3, "Pamuk", 6, "bebek_battaniye.jpg", "80x100 cm, puset ve beşik için yumuşacık battaniye. Makinede yıkanabilir."],
    ["Bebek Hırkası", "Bebek Örgüleri", zeynep, 640, 4, "Merinos", 7, "bebek_hirka.jpg", "Düğmeli, motifli bebek hırkası. 6-12 ay ve 1-2 yaş bedenleri var."],
    // Tığ Atölyesi
    ["Mantar Amigurumi", "Amigurumi", mehmet, 250, 7, "Pamuk", 3, "mantar.jpg", "Kırmızı şapkalı, beyaz benekli mantar. Raf süsü ya da çocuk odası için."],
    ["Örgü Bez Bebek", "Amigurumi", mehmet, 340, 5, "Pamuk", 4, "bebek_oyuncak.jpg", "Turuncu elbiseli, 28 cm boyunda örgü bebek. Kıyafeti çıkarılabilir."],
    ["Ahtapot Amigurumi", "Amigurumi", mehmet, 270, 9, "Pamuk", 3, "ahtapot.jpg", "Sekiz kollu, gülen yüzlü ahtapot. Prematüre bebekler için de güvenli."],
    ["Ayıcık Anahtarlık", "Çanta & Aksesuar", mehmet, 120, 15, "Akrilik", 1, "anahtarlik.jpg", "Avuç içi kadar minik ayıcık. Anahtarlık ya da çanta süsü olarak kullanılır."],
    // Elif Örgü Evi
    ["Burgulu Saç Bandı", "Bere & Şapka", elif, 190, 9, "Yün", 2, "sac_bandi.jpg", "Önü burgulu, yeşil yün saç bandı. Kulakları sıcak tutar, saçı bozmaz."],
    ["Örgü Ev Terliği", "Çorap & Eldiven", elif, 310, 6, "Yün", 3, "terlik.jpg", "Keçe tabanlı, kaymaz örgü terlik. 36'dan 41'e kadar numara seçin."],
    ["Püsküllü Panço", "Kazak & Hırka", elif, 1150, 2, "Alpaka", 10, "panco.jpg", "Krem rengi, püsküllü alpaka panço. Tek beden, her mevsim omuza alınır."],
    // Gül'ün Tığı
    ["Granny Kare Battaniye", "Ev & Dekor", gul, 1350, 2, "Akrilik", 12, "motifli_battaniye.jpg", "Yüzlerce renkli granny karenin birleştirilmesiyle yapıldı. 130x160 cm."],
    ["Fil Desenli Çocuk Halısı", "Ev & Dekor", gul, 1290, 1, "Pamuk", 14, "fil.jpg", "Kalın penye ipten tığla örülmüş fil halı. Çocuk odasına neşe katar, 90 cm."],
    ["Bardak Altlığı Seti", "Ev & Dekor", gul, 160, 12, "Pamuk", 2, "altlik.jpg", "Renkli, yuvarlak 4'lü bardak altlığı. Sıcak kupalar masayı lekelemez."],
    ["Örgü Sepet", "Ev & Dekor", gul, 420, 6, "Pamuk", 4, "sepet.jpg", "Penye iple örülmüş, sağlam duran düzenleme sepeti. Banyo ve çocuk odası için."],
    ["Örgü Kırlent", "Ev & Dekor", gul, 450, 5, "Pamuk", 4, "kirlent.jpg", "Krem rengi, kabartma desenli 45x45 cm kırlent. Kılıfı fermuarlı, iç yastık dahil."],
    ["Tığ İşi Plaj Çantası", "Çanta & Aksesuar", gul, 380, 4, "Pamuk", 3, "plaj_canta.jpg", "Kiremit rengi, geniş tığ işi çanta. Havlu ve şişe rahatça sığar."],
    ["Dantel Örgü Şal", "Atkı & Şal", gul, 870, 2, "Moher", 12, "dantel_sal.jpg", "İnce moher iplikle şişte örülmüş dantel şal. Düğün ve davetlere çok yakışır."],
    ["Tığ İşi Yazlık Bluz", "Kazak & Hırka", gul, 560, 3, "Bambu", 6, "bustiyer.jpg", "Mavi tonlarında, askılı tığ işi yazlık bluz. Bambu iplik terletmez."],
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
  // can birkaç şey almış: bazıları teslim edilmiş (yorum yazabilir), biri kargoda, biri hazırlanıyor.
  // Bir de misafir (üye olmayan) alışverişi var.
  const misafir = { adSoyad: "Selin Kaya", telefon: "05559876543", eposta: "selin@ornek.com", adres: "Cumhuriyet Cad. No:45, Konak / İzmir" };
  const siparisler = [
    // [alıcı (null = misafir), ürün, adet, durum, not, sipariş no]
    [can, "El Örgüsü Bere", 1, "teslim", "Hardal renk olursa çok sevinirim.", "IL-1001"],
    [can, "Bebek Patiği", 2, "teslim", "Yeğenim için, mavi olsun lütfen.", "IL-1002"],
    [can, "Amigurumi Ayıcık", 1, "kargoda", null, "IL-1003"],
    [can, "Pembe Motifli Hırka", 1, "hazirlaniyor", "M beden. Hediye paketi yapabilir misiniz?", "IL-1004"],
    [elif, "Amigurumi Tavşan", 1, "teslim", null, "IL-1005"],
    [mehmet, "El Örgüsü Bere", 1, "teslim", null, "IL-1006"],
    [null, "Çizgili Yün Çorap", 2, "hazirlaniyor", null, "IL-1007"],      // misafir
    [null, "Tığ İşi Çiçek Buketi", 1, "hazirlaniyor", null, "IL-1007"],   // aynı misafir, aynı sepet
  ];
  for (const [alici, baslik, adet, durum, aliciNotu, siparisNo] of siparisler) {
    const urun = urunler[baslik];
    // Üyeyse bilgileri hesabından, misafirse yukarıdaki misafir bilgilerinden
    let kisi = misafir;
    if (alici) kisi = { adSoyad: alici.adSoyad || alici.kullaniciAdi, telefon: alici.telefon || "05000000000", eposta: alici.eposta || alici.kullaniciAdi + "@ornek.com", adres: alici.adres || "Örnek Mah. No:1, " + alici.sehir };
    await Siparis.create({
      siparisNo, adet, toplam: adet * urun.fiyat, durum, aliciNotu, kartSon4: "4242",
      adSoyad: kisi.adSoyad, telefon: kisi.telefon, eposta: kisi.eposta, adres: kisi.adres,
      urunId: urun.id, aliciId: alici ? alici.id : null, saticiId: urun.kullaniciId,
    });
  }
  const yorumlar = [
    [can, "El Örgüsü Bere", 5, "Tam istediğim renk, çok sıcak tutuyor. Ayşe Hanım'a teşekkürler!"],
    [can, "Bebek Patiği", 5, "Minicik ve çok yumuşak, yeğenim bayıldı."],
    [elif, "Amigurumi Tavşan", 5, "İlmekler o kadar düzgün ki! Tam bir sanat eseri."],
    [mehmet, "El Örgüsü Bere", 4, "Kızıma aldım, çok beğendi."],
  ];
  for (const [k, baslik, puan, metin] of yorumlar) await Yorum.create({ puan, metin, kullaniciId: k.id, urunId: urunler[baslik].id });
  for (const baslik in urunler) await puanGuncelle(urunler[baslik].id);

  // ---------- Favoriler ----------
  await can.addFavoriler([urunler["Kalın Örgü Battaniye"], urunler["Saç Örgülü Kazak"], urunler["Tığ İşi Çiçek Buketi"]]);
  await elif.addFavoriler([urunler["Çizgili Yün Atkı"]]);

  // ---------- Galeri: atölyelerden kareler ----------
  for (const [resim, aciklama] of [["orgu_eller.jpg", "Akşam örgüsü"], ["yumak.jpg", "Yeni gelen yumaklar"], ["ip_rafi.jpg", "Elif'in ip rafı"],
    ["kazak.jpg", "Ayşe'nin kış koleksiyonu"], ["tavsan.jpg", "Tığ Atölyesi'nin yeni üyesi"], ["battaniye.jpg", "Minik İlmek'ten kalın örgü"],
    ["dantel_sal.jpg", "Gül'ün dantel şalı şişte"], ["motifli_battaniye.jpg", "Yüzlerce granny kare"], ["mantar.jpg", "Mantar yumağın üstünde"]]) {
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
    { soru: "Üye olmadan alışveriş yapabilir miyim?", cevap: "Evet. Sepete ekleyip ödeme sayfasında adres ve kart bilgilerini yazmanız yeterli. Siparişinizi daha sonra 'Sipariş sorgula' sayfasından numara ve e-posta adresinizle görebilirsiniz. Üye olursanız adresiniz kayıtlı kalır, her seferinde yazmazsınız.", yayinda: true },
    { soru: "Kart bilgilerim saklanıyor mu?", cevap: "Hayır. Kart numaranızın sadece son 4 hanesi siparişte görünsün diye kaydedilir. Kartın tamamı ve CVV hiçbir yere yazılmaz. (Bu bir ders projesidir, gerçek ödeme alınmaz.)", yayinda: true },
    { soru: "Ürün eklediğim halde neden görünmüyor?", cevap: "Eklenen ürünler yönetici onayından sonra yayınlanır. Onay bekleyen ürünlerinizi 'Ürünlerim' sayfasında görebilirsiniz.", yayinda: true },
    { soru: "Her ürüne yorum yazabilir miyim?", cevap: "Hayır, sadece satın alıp teslim aldığınız ürünlere yorum yazabilirsiniz. Böylece yorumlar gerçek alıcılardan gelir.", yayinda: true },
    { soru: "Örgüler neden hemen gönderilmiyor?", cevap: "Ürünlerin çoğu sipariş üzerine elde örülüyor. Her ürünün sayfasında 'Hazırlanma' süresi yazıyor; ödemeden sonra o kadar günde örülüp kargoya verilir.", yayinda: true },
    { soru: "Yün ürünleri nasıl yıkamalıyım?", cevap: "Yün, merinos ve alpaka ürünleri 30 derecede elde, yün şampuanıyla yıkayın, sıkmadan düz bir yüzeyde kurutun. Pamuklu ürünler makinede hassas programda yıkanabilir.", yayinda: true },
    { soru: "Kendi rengimi seçebilir miyim?", cevap: null, yayinda: false }, // cevapsız örnek soru
  ]);
}

module.exports = populate;
