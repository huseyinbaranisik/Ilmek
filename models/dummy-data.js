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

    // Her kategoride en az 20 ürün olsun diye eklenenler
    ["Mavi Kıvrık Kenarlı Bere", "Bere & Şapka", burak, 350, 8, "Merinos", 3, "mavi_kivrik_kenarli_bere.jpg", "Lastik örgüyle örüldüğü için her kafaya oturur, esner ama bollaşmaz."],
    ["Sarı Ponponlu Bere", "Bere & Şapka", elif, 410, 6, "Alpaka", 4, "sari_ponponlu_bere.jpg", "Yumuşacık iplikten, kaşındırmayan kış beresi."],
    ["Yeşil Balıkçı Beresi", "Bere & Şapka", ayse, 300, 4, "Akrilik", 2, "yesil_balikci_beresi.jpg", "Kalın örgüsü sayesinde ayazda bile sıcak tutar."],
    ["Turuncu Lastik Örgü Bere", "Bere & Şapka", burak, 370, 2, "Yün", 3, "turuncu_lastik_orgu_bere.jpg", "Kıvrık kenarlı, kulakları tamamen kapatan sıcak bere."],
    ["Hardal Kalın Bere", "Bere & Şapka", elif, 430, 9, "Merinos", 4, "hardal_kalin_bere.jpg", "Lastik örgüyle örüldüğü için her kafaya oturur, esner ama bollaşmaz."],
    ["Bej Yumuşak Bere", "Bere & Şapka", ayse, 320, 7, "Alpaka", 2, "bej_yumusak_bere.jpg", "Yumuşacık iplikten, kaşındırmayan kış beresi."],
    ["Melanj Mavi Bere", "Bere & Şapka", burak, 390, 5, "Akrilik", 3, "melanj_mavi_bere.jpg", "Kalın örgüsü sayesinde ayazda bile sıcak tutar."],
    ["Krem Kıvrık Bere", "Bere & Şapka", elif, 450, 3, "Yün", 4, "krem_kivrik_bere.jpg", "Kıvrık kenarlı, kulakları tamamen kapatan sıcak bere."],
    ["Buz Mavisi Bere", "Bere & Şapka", ayse, 340, 1, "Merinos", 2, "buz_mavisi_bere.jpg", "Lastik örgüyle örüldüğü için her kafaya oturur, esner ama bollaşmaz."],
    ["Çizgili Renkli Bere", "Bere & Şapka", burak, 410, 8, "Alpaka", 3, "cizgili_renkli_bere.jpg", "Yumuşacık iplikten, kaşındırmayan kış beresi."],
    ["Gri Lastik Örgü Bere", "Bere & Şapka", elif, 290, 6, "Akrilik", 4, "gri_lastik_orgu_bere.jpg", "Kalın örgüsü sayesinde ayazda bile sıcak tutar."],
    ["Fuşya Bere", "Bere & Şapka", ayse, 360, 4, "Yün", 2, "fusya_bere.jpg", "Kıvrık kenarlı, kulakları tamamen kapatan sıcak bere."],
    ["Pembe Kış Beresi", "Bere & Şapka", burak, 430, 2, "Merinos", 3, "pembe_kis_beresi.jpg", "Lastik örgüyle örüldüğü için her kafaya oturur, esner ama bollaşmaz."],
    ["Pudra Pembe Bere", "Bere & Şapka", elif, 310, 9, "Alpaka", 4, "pudra_pembe_bere.jpg", "Yumuşacık iplikten, kaşındırmayan kış beresi."],
    ["Vizon Bere", "Bere & Şapka", ayse, 380, 7, "Akrilik", 2, "vizon_bere.jpg", "Kalın örgüsü sayesinde ayazda bile sıcak tutar."],
    ["Gri Saç Örgülü Bere", "Bere & Şapka", burak, 450, 5, "Yün", 3, "gri_sac_orgulu_bere.jpg", "Kıvrık kenarlı, kulakları tamamen kapatan sıcak bere."],
    ["Renkli Ponponlu Bere", "Bere & Şapka", elif, 330, 3, "Merinos", 4, "renkli_ponponlu_bere.jpg", "Lastik örgüyle örüldüğü için her kafaya oturur, esner ama bollaşmaz."],
    ["Kırmızı Uzun Atkı", "Atkı & Şal", burak, 530, 8, "Merinos", 4, "kirmizi_uzun_atki.jpg", "Omuza da boyuna da olur, hafif ama sıcak tutar."],
    ["Mavi Saç Örgülü Atkı", "Atkı & Şal", gul, 740, 6, "Moher", 5, "mavi_sac_orgulu_atki.jpg", "Elde, sabırla örüldü. Yıkarken elde ve ılık suda yıkayın."],
    ["Püsküllü Çizgili Atkı", "Atkı & Şal", elif, 380, 4, "Alpaka", 6, "puskullu_cizgili_atki.jpg", "Kışın montun üstüne, baharda gömleğin üstüne çok yakışır."],
    ["Bej Omuz Şalı", "Atkı & Şal", ayse, 590, 2, "Akrilik", 7, "bej_omuz_sali.jpg", "Uzun ve yumuşak, boyuna iki tur sarılır."],
    ["Renkli Çizgili Atkı", "Atkı & Şal", burak, 800, 9, "Pamuk", 8, "renkli_cizgili_atki.jpg", "Omuza da boyuna da olur, hafif ama sıcak tutar."],
    ["Sarı Tığ İşi Atkı", "Atkı & Şal", gul, 450, 7, "Yün", 9, "sari_tig_isi_atki.jpg", "Elde, sabırla örüldü. Yıkarken elde ve ılık suda yıkayın."],
    ["Hardal Uzun Atkı", "Atkı & Şal", elif, 660, 5, "Merinos", 10, "hardal_uzun_atki.jpg", "Kışın montun üstüne, baharda gömleğin üstüne çok yakışır."],
    ["Desenli Üçgen Şal", "Atkı & Şal", ayse, 870, 3, "Moher", 3, "desenli_ucgen_sal.jpg", "Uzun ve yumuşak, boyuna iki tur sarılır."],
    ["Kırmızı Dantel Şal", "Atkı & Şal", burak, 510, 1, "Alpaka", 4, "kirmizi_dantel_sal.jpg", "Omuza da boyuna da olur, hafif ama sıcak tutar."],
    ["Beyaz Dantel Şal", "Atkı & Şal", gul, 720, 8, "Akrilik", 5, "beyaz_dantel_sal.jpg", "Elde, sabırla örüldü. Yıkarken elde ve ılık suda yıkayın."],
    ["Fıstık Yeşili Boyunluk", "Atkı & Şal", elif, 360, 6, "Pamuk", 6, "fistik_yesili_boyunluk.jpg", "Kışın montun üstüne, baharda gömleğin üstüne çok yakışır."],
    ["Gri Boyunluk", "Atkı & Şal", ayse, 570, 4, "Yün", 7, "gri_boyunluk.jpg", "Uzun ve yumuşak, boyuna iki tur sarılır."],
    ["Turuncu Boyunluk", "Atkı & Şal", burak, 780, 2, "Merinos", 8, "turuncu_boyunluk.jpg", "Omuza da boyuna da olur, hafif ama sıcak tutar."],
    ["Turkuaz Boyunluk", "Atkı & Şal", gul, 420, 9, "Moher", 9, "turkuaz_boyunluk.jpg", "Elde, sabırla örüldü. Yıkarken elde ve ılık suda yıkayın."],
    ["Pembe Yumuşak Atkı", "Atkı & Şal", elif, 630, 7, "Alpaka", 10, "pembe_yumusak_atki.jpg", "Kışın montun üstüne, baharda gömleğin üstüne çok yakışır."],
    ["Beyaz Kabarık Kazak", "Kazak & Hırka", burak, 1210, 8, "Merinos", 9, "beyaz_kabarik_kazak.jpg", "Bol kesim, rahat bir örgü. Renk değişikliği için not bırakabilirsiniz."],
    ["Kahverengi Örgü Kazak", "Kazak & Hırka", gul, 1530, 6, "Alpaka", 10, "kahverengi_orgu_kazak.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Kiremit Rengi Kazak", "Kazak & Hırka", ayse, 980, 4, "Pamuk", 11, "kiremit_rengi_kazak.jpg", "Kalın ama ağır değil; gün boyu rahatça giyilir."],
    ["Yeşil Lastik Örgü Kazak", "Kazak & Hırka", burak, 1300, 2, "Yün", 12, "yesil_lastik_orgu_kazak.jpg", "S, M ve L bedenleri sipariş üzerine örülür; bedeninizi nota yazın."],
    ["Papatya İşlemeli Kazak", "Kazak & Hırka", gul, 1620, 9, "Merinos", 13, "papatya_islemeli_kazak.jpg", "Bol kesim, rahat bir örgü. Renk değişikliği için not bırakabilirsiniz."],
    ["Norveç Desenli Kazak", "Kazak & Hırka", ayse, 1080, 7, "Alpaka", 14, "norvec_desenli_kazak.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Koyu Yeşil Erkek Kazağı", "Kazak & Hırka", burak, 1400, 5, "Pamuk", 8, "koyu_yesil_erkek_kazagi.jpg", "Kalın ama ağır değil; gün boyu rahatça giyilir."],
    ["Hardal Düğmeli Hırka", "Kazak & Hırka", gul, 1720, 3, "Yün", 9, "hardal_dugmeli_hirka.jpg", "S, M ve L bedenleri sipariş üzerine örülür; bedeninizi nota yazın."],
    ["Bej Uzun Hırka", "Kazak & Hırka", ayse, 1170, 1, "Merinos", 10, "bej_uzun_hirka.jpg", "Bol kesim, rahat bir örgü. Renk değişikliği için not bırakabilirsiniz."],
    ["Tarçın Rengi Hırka", "Kazak & Hırka", burak, 1490, 8, "Alpaka", 11, "tarcin_rengi_hirka.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Turuncu Bol Kazak", "Kazak & Hırka", gul, 950, 6, "Pamuk", 12, "turuncu_bol_kazak.jpg", "Kalın ama ağır değil; gün boyu rahatça giyilir."],
    ["Beyaz Örgü Elbise", "Kazak & Hırka", ayse, 1270, 4, "Yün", 13, "beyaz_orgu_elbise.jpg", "S, M ve L bedenleri sipariş üzerine örülür; bedeninizi nota yazın."],
    ["Gri Balıkçı Yaka Kazak", "Kazak & Hırka", burak, 1590, 2, "Merinos", 14, "gri_balikci_yaka_kazak.jpg", "Bol kesim, rahat bir örgü. Renk değişikliği için not bırakabilirsiniz."],
    ["Granny Kare Hırka", "Kazak & Hırka", gul, 1040, 9, "Alpaka", 8, "granny_kare_hirka.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Krem Bebek Takımı", "Bebek Örgüleri", zeynep, 430, 8, "Merinos", 3, "krem_bebek_takimi.jpg", "0-6 ay ve 6-12 ay bedenleri var, bedeni nota yazın."],
    ["Ponponlu Bebek Beresi", "Bebek Örgüleri", zeynep, 700, 6, "Bambu", 4, "ponponlu_bebek_beresi.jpg", "Makinede hassas programda yıkanabilir."],
    ["Pudra Bebek Beresi", "Bebek Örgüleri", zeynep, 240, 4, "Pamuk", 5, "pudra_bebek_beresi.jpg", "Hastane çantası ve bebek hediyesi için çok tatlı bir seçim."],
    ["Yeşil Bebek Kazağı", "Bebek Örgüleri", zeynep, 510, 2, "Merinos", 6, "yesil_bebek_kazagi.jpg", "Bebek dostu, kaşındırmayan iplikten örüldü."],
    ["Mavi Bebek Patiği", "Bebek Örgüleri", zeynep, 780, 9, "Bambu", 7, "mavi_bebek_patigi.jpg", "0-6 ay ve 6-12 ay bedenleri var, bedeni nota yazın."],
    ["Kırmızı Bebek Patiği", "Bebek Örgüleri", zeynep, 320, 7, "Pamuk", 2, "kirmizi_bebek_patigi.jpg", "Makinede hassas programda yıkanabilir."],
    ["Turuncu Bebek Patiği", "Bebek Örgüleri", zeynep, 590, 5, "Merinos", 3, "turuncu_bebek_patigi.jpg", "Hastane çantası ve bebek hediyesi için çok tatlı bir seçim."],
    ["Tilki Bebek Patiği", "Bebek Örgüleri", zeynep, 860, 3, "Bambu", 4, "tilki_bebek_patigi.jpg", "Bebek dostu, kaşındırmayan iplikten örüldü."],
    ["Pembe Bebek Elbisesi", "Bebek Örgüleri", zeynep, 400, 1, "Pamuk", 5, "pembe_bebek_elbisesi.jpg", "0-6 ay ve 6-12 ay bedenleri var, bedeni nota yazın."],
    ["Kırmızı Ayıcık Tulum", "Bebek Örgüleri", zeynep, 670, 8, "Merinos", 6, "kirmizi_ayicik_tulum.jpg", "Makinede hassas programda yıkanabilir."],
    ["Mavi Bebek Beresi", "Bebek Örgüleri", zeynep, 210, 6, "Bambu", 7, "mavi_bebek_beresi.jpg", "Hastane çantası ve bebek hediyesi için çok tatlı bir seçim."],
    ["Turuncu Bebek Beresi", "Bebek Örgüleri", zeynep, 480, 4, "Pamuk", 2, "turuncu_bebek_beresi.jpg", "Bebek dostu, kaşındırmayan iplikten örüldü."],
    ["Yenidoğan Fotoğraf Seti", "Bebek Örgüleri", zeynep, 750, 2, "Merinos", 3, "yenidogan_fotograf_seti.jpg", "0-6 ay ve 6-12 ay bedenleri var, bedeni nota yazın."],
    ["Zikzak Bebek Battaniyesi", "Bebek Örgüleri", zeynep, 290, 9, "Bambu", 4, "zikzak_bebek_battaniyesi.jpg", "Makinede hassas programda yıkanabilir."],
    ["Yıldız Bebek Battaniyesi", "Bebek Örgüleri", zeynep, 560, 7, "Pamuk", 5, "yildiz_bebek_battaniyesi.jpg", "Hastane çantası ve bebek hediyesi için çok tatlı bir seçim."],
    ["Minik Fare Amigurumi", "Amigurumi", mehmet, 280, 8, "Akrilik", 4, "minik_fare_amigurumi.jpg", "İçi antialerjik elyaf dolgulu, yaklaşık 20 cm boyunda."],
    ["Bereli Tavşan", "Amigurumi", mehmet, 360, 6, "Pamuk", 5, "bereli_tavsan.jpg", "Tığla tek tek örüldü, her biri birbirinden biraz farklı olur."],
    ["Pembe Tavşan", "Amigurumi", mehmet, 220, 4, "Akrilik", 6, "pembe_tavsan.jpg", "Çocuk odası süsü ya da doğum günü hediyesi olarak çok sevilir."],
    ["Saksıda Papatya", "Amigurumi", mehmet, 300, 2, "Pamuk", 3, "saksida_papatya.jpg", "Gözleri işlemedir, küçük çocuklar için güvenlidir."],
    ["Turuncu Tişörtlü Tavşan", "Amigurumi", mehmet, 390, 9, "Akrilik", 4, "turuncu_tisortlu_tavsan.jpg", "İçi antialerjik elyaf dolgulu, yaklaşık 20 cm boyunda."],
    ["Noel Ayıcığı", "Amigurumi", mehmet, 240, 7, "Pamuk", 5, "noel_ayicigi.jpg", "Tığla tek tek örüldü, her biri birbirinden biraz farklı olur."],
    ["Atkılı Ayıcık", "Amigurumi", mehmet, 330, 5, "Akrilik", 6, "atkili_ayicik.jpg", "Çocuk odası süsü ya da doğum günü hediyesi olarak çok sevilir."],
    ["Kahverengi Oyuncak Ayı", "Amigurumi", mehmet, 410, 3, "Pamuk", 3, "kahverengi_oyuncak_ayi.jpg", "Gözleri işlemedir, küçük çocuklar için güvenlidir."],
    ["Penguen Ailesi", "Amigurumi", mehmet, 270, 1, "Akrilik", 4, "penguen_ailesi.jpg", "İçi antialerjik elyaf dolgulu, yaklaşık 20 cm boyunda."],
    ["Örgü Kız ve Erkek Bebek", "Amigurumi", mehmet, 350, 8, "Pamuk", 5, "orgu_kiz_ve_erkek_bebek.jpg", "Tığla tek tek örüldü, her biri birbirinden biraz farklı olur."],
    ["Krem Ayıcık", "Amigurumi", mehmet, 210, 6, "Akrilik", 6, "krem_ayicik.jpg", "Çocuk odası süsü ya da doğum günü hediyesi olarak çok sevilir."],
    ["Gökkuşağı Ayıcık", "Amigurumi", mehmet, 290, 4, "Pamuk", 3, "gokkusagi_ayicik.jpg", "Gözleri işlemedir, küçük çocuklar için güvenlidir."],
    ["İkiz Ayıcıklar", "Amigurumi", mehmet, 380, 2, "Akrilik", 4, "ikiz_ayiciklar.jpg", "İçi antialerjik elyaf dolgulu, yaklaşık 20 cm boyunda."],
    ["Mavi Dinozor", "Amigurumi", mehmet, 230, 9, "Pamuk", 5, "mavi_dinozor.jpg", "Tığla tek tek örüldü, her biri birbirinden biraz farklı olur."],
    ["Düğme Gözlü Tavşan", "Amigurumi", mehmet, 320, 7, "Akrilik", 6, "dugme_gozlu_tavsan.jpg", "Çocuk odası süsü ya da doğum günü hediyesi olarak çok sevilir."],
    ["Kalın İlmek Battaniye", "Ev & Dekor", zeynep, 830, 8, "Akrilik", 4, "kalin_ilmek_battaniye.jpg", "Kalın iplikle örüldü, uzun yıllar kullanılır."],
    ["Lacivert Kalın Battaniye", "Ev & Dekor", mehmet, 1490, 6, "Merinos", 5, "lacivert_kalin_battaniye.jpg", "Renkler isteğe göre değişebilir, sipariş notuna yazın."],
    ["Kırmızı Kalın Battaniye", "Ev & Dekor", gul, 370, 4, "Pamuk", 6, "kirmizi_kalin_battaniye.jpg", "Elde yıkanması önerilir, düz serilerek kurutulur."],
    ["Renkli Kare Battaniye", "Ev & Dekor", zeynep, 1030, 2, "Akrilik", 7, "renkli_kare_battaniye.jpg", "Eve sıcak, el yapımı bir hava katar."],
    ["Papatyalı Battaniye", "Ev & Dekor", mehmet, 1680, 9, "Merinos", 8, "papatyali_battaniye.jpg", "Kalın iplikle örüldü, uzun yıllar kullanılır."],
    ["Mavi Granny Battaniye", "Ev & Dekor", gul, 570, 7, "Pamuk", 9, "mavi_granny_battaniye.jpg", "Renkler isteğe göre değişebilir, sipariş notuna yazın."],
    ["Ananaslı Yastık", "Ev & Dekor", zeynep, 1220, 5, "Akrilik", 10, "ananasli_yastik.jpg", "Elde yıkanması önerilir, düz serilerek kurutulur."],
    ["Yıldız Yastık", "Ev & Dekor", mehmet, 1880, 3, "Merinos", 11, "yildiz_yastik.jpg", "Eve sıcak, el yapımı bir hava katar."],
    ["Sarı Yuvarlak Minder", "Ev & Dekor", gul, 760, 1, "Pamuk", 12, "sari_yuvarlak_minder.jpg", "Kalın iplikle örüldü, uzun yıllar kullanılır."],
    ["Çiçekli Kare Yastık", "Ev & Dekor", zeynep, 1420, 8, "Akrilik", 3, "cicekli_kare_yastik.jpg", "Renkler isteğe göre değişebilir, sipariş notuna yazın."],
    ["Beyaz Örgü Sepet", "Ev & Dekor", mehmet, 300, 6, "Merinos", 4, "beyaz_orgu_sepet.jpg", "Elde yıkanması önerilir, düz serilerek kurutulur."],
    ["Kırmızı Mum Kılıfı", "Ev & Dekor", gul, 960, 4, "Pamuk", 5, "kirmizi_mum_kilifi.jpg", "Eve sıcak, el yapımı bir hava katar."],
    ["Lacivert Saksı Kılıfı", "Ev & Dekor", zeynep, 1610, 2, "Akrilik", 6, "lacivert_saksi_kilifi.jpg", "Kalın iplikle örüldü, uzun yıllar kullanılır."],
    ["Gri Saç Örgülü Çorap", "Çorap & Eldiven", burak, 280, 8, "Merinos", 3, "gri_sac_orgulu_corap.jpg", "Kalın yün sayesinde kışın hiç üşütmez."],
    ["Kırmızı Uzun Çorap", "Çorap & Eldiven", elif, 360, 6, "Akrilik", 4, "kirmizi_uzun_corap.jpg", "Çift kat örüldüğü için uzun süre dayanır."],
    ["Norveç Desenli Çorap", "Çorap & Eldiven", burak, 220, 4, "Yün", 5, "norvec_desenli_corap.jpg", "Ev içinde de, bot içinde de rahatça kullanılır."],
    ["Renkli Çorap Seti", "Çorap & Eldiven", elif, 300, 2, "Merinos", 2, "renkli_corap_seti.jpg", "36-40 numara arası, isterseniz numaranızı nota yazın."],
    ["Lacivert Diz Altı Çorap", "Çorap & Eldiven", burak, 390, 9, "Akrilik", 3, "lacivert_diz_alti_corap.jpg", "Kalın yün sayesinde kışın hiç üşütmez."],
    ["Gri Kalın Yün Çorap", "Çorap & Eldiven", elif, 240, 7, "Yün", 4, "gri_kalin_yun_corap.jpg", "Çift kat örüldüğü için uzun süre dayanır."],
    ["Hardal Kalın Çorap", "Çorap & Eldiven", burak, 330, 5, "Merinos", 5, "hardal_kalin_corap.jpg", "Ev içinde de, bot içinde de rahatça kullanılır."],
    ["Mavi Turuncu Çorap", "Çorap & Eldiven", elif, 410, 3, "Akrilik", 2, "mavi_turuncu_corap.jpg", "36-40 numara arası, isterseniz numaranızı nota yazın."],
    ["Kahve Çizgili Çorap", "Çorap & Eldiven", burak, 270, 1, "Yün", 3, "kahve_cizgili_corap.jpg", "Kalın yün sayesinde kışın hiç üşütmez."],
    ["Ayıcık Eldiven", "Çorap & Eldiven", elif, 350, 8, "Merinos", 4, "ayicik_eldiven.jpg", "Çift kat örüldüğü için uzun süre dayanır."],
    ["Desenli Kış Eldiveni", "Çorap & Eldiven", burak, 210, 6, "Akrilik", 5, "desenli_kis_eldiveni.jpg", "Ev içinde de, bot içinde de rahatça kullanılır."],
    ["Desenli Parmaklı Eldiven", "Çorap & Eldiven", elif, 290, 4, "Yün", 2, "desenli_parmakli_eldiven.jpg", "36-40 numara arası, isterseniz numaranızı nota yazın."],
    ["Beyaz Örgü Eldiven", "Çorap & Eldiven", burak, 380, 2, "Merinos", 3, "beyaz_orgu_eldiven.jpg", "Kalın yün sayesinde kışın hiç üşütmez."],
    ["Kırmızı Eldiven", "Çorap & Eldiven", elif, 230, 9, "Akrilik", 4, "kirmizi_eldiven.jpg", "Çift kat örüldüğü için uzun süre dayanır."],
    ["Gri Parmaklı Eldiven", "Çorap & Eldiven", burak, 320, 7, "Yün", 5, "gri_parmakli_eldiven.jpg", "Ev içinde de, bot içinde de rahatça kullanılır."],
    ["Kalpli Ev Terliği", "Çorap & Eldiven", elif, 400, 5, "Merinos", 2, "kalpli_ev_terligi.jpg", "36-40 numara arası, isterseniz numaranızı nota yazın."],
    ["Bej Örgü Omuz Çantası", "Çanta & Aksesuar", gul, 290, 8, "Akrilik", 2, "bej_orgu_omuz_cantasi.jpg", "Günlük kullanım için hafif ve şık."],
    ["Pembe Örgü Çanta", "Çanta & Aksesuar", mehmet, 470, 6, "Bambu", 3, "pembe_orgu_canta.jpg", "Renk seçeneği için sipariş notuna yazabilirsiniz."],
    ["Mini Askılı Çanta", "Çanta & Aksesuar", elif, 160, 4, "Pamuk", 4, "mini_askili_canta.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Hasır Plaj Çantası", "Çanta & Aksesuar", gul, 340, 2, "Akrilik", 5, "hasir_plaj_cantasi.jpg", "Tığ işi, sağlam saplı ve yıkanabilir."],
    ["Beyaz Örgü Çanta", "Çanta & Aksesuar", mehmet, 520, 9, "Bambu", 1, "beyaz_orgu_canta.jpg", "Günlük kullanım için hafif ve şık."],
    ["Renkli Sepet Çanta", "Çanta & Aksesuar", elif, 220, 7, "Pamuk", 2, "renkli_sepet_canta.jpg", "Renk seçeneği için sipariş notuna yazabilirsiniz."],
    ["Bordo Büzgülü Çanta", "Çanta & Aksesuar", gul, 390, 5, "Akrilik", 3, "bordo_buzgulu_canta.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Renkli Telefon Çantası", "Çanta & Aksesuar", mehmet, 570, 3, "Bambu", 4, "renkli_telefon_cantasi.jpg", "Tığ işi, sağlam saplı ve yıkanabilir."],
    ["Krem Yarım Ay Çanta", "Çanta & Aksesuar", elif, 270, 1, "Pamuk", 5, "krem_yarim_ay_canta.jpg", "Günlük kullanım için hafif ve şık."],
    ["File Pazar Çantası", "Çanta & Aksesuar", gul, 450, 8, "Akrilik", 1, "file_pazar_cantasi.jpg", "Renk seçeneği için sipariş notuna yazabilirsiniz."],
    ["Sarı File Çanta", "Çanta & Aksesuar", mehmet, 140, 6, "Bambu", 2, "sari_file_canta.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Gökkuşağı Çanta", "Çanta & Aksesuar", elif, 320, 4, "Pamuk", 3, "gokkusagi_canta.jpg", "Tığ işi, sağlam saplı ve yıkanabilir."],
    ["Beyaz File Çanta", "Çanta & Aksesuar", gul, 500, 2, "Akrilik", 4, "beyaz_file_canta.jpg", "Günlük kullanım için hafif ve şık."],
    ["Örgü Kalemlik", "Çanta & Aksesuar", mehmet, 200, 9, "Bambu", 5, "orgu_kalemlik.jpg", "Renk seçeneği için sipariş notuna yazabilirsiniz."],
    ["Pastel Mini Çanta", "Çanta & Aksesuar", elif, 370, 7, "Pamuk", 1, "pastel_mini_canta.jpg", "Tek tek elde örülür, aynısından ikinci bir tane yoktur."],
    ["Çiçekli Anahtarlık", "Çanta & Aksesuar", gul, 550, 5, "Akrilik", 2, "cicekli_anahtarlik.jpg", "Tığ işi, sağlam saplı ve yıkanabilir."],
    ["Bordo Örgü Saç Bandı", "Çanta & Aksesuar", mehmet, 250, 3, "Bambu", 3, "bordo_orgu_sac_bandi.jpg", "Günlük kullanım için hafif ve şık."],
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

  // ---------- Galeri: albümlere ayrılmış atölye fotoğrafları ----------
  // Resimler public/img/galeri/ klasöründe. Bazıları bir örgücünün atölyesinden (mağazasına bağlantı verilir).
  const galeri = [
    // [dosya, açıklama, albüm, örgücü (yoksa null)]
    ["orgu_eller.jpg", "Şişte yeni bir örgü", "Örerken", elif],
    ["yumak.jpg", "Yeni gelen yumaklar", "İplikler", null],
    ["ip_rafi.jpg", "Renklere göre dizilmiş ipler", "Atölyeden", elif],
    ["aksam_orgusu.jpg", "Akşam örgüsü", "Örerken", ayse],
    ["mor_ilmekler.jpg", "Mor ilmekler", "Örerken", null],
    ["hardal_yun_siste_buyuyor.jpg", "Hardal yün şişte büyüyor", "Örerken", burak],
    ["yesil_yunle_orgu_saati.jpg", "Yeşil yünle örgü saati", "Örerken", null],
    ["kalpli_isaretcilerle_orgu.jpg", "Kalpli işaretçilerle örgü", "Örerken", zeynep],
    ["salonda_orgu_molasi.jpg", "Salonda örgü molası", "Örerken", null],
    ["pastel_yumaklar.jpg", "Pastel yumaklar", "İplikler", zeynep],
    ["renk_renk_akrilikler.jpg", "Renk renk akrilikler", "İplikler", mehmet],
    ["sepetteki_kis_yunleri.jpg", "Sepetteki kış yünleri", "İplikler", null],
    ["elde_boyanmis_cileler.jpg", "Elde boyanmış çileler", "İplikler", elif],
    ["avucta_bej_merinos.jpg", "Avuçta bej merinos", "İplikler", ayse],
    ["ebruli_yumak.jpg", "Ebruli yumak", "İplikler", null],
    ["tiglar_ve_isaretciler.jpg", "Tığlar ve işaretçiler", "Atölyeden", gul],
    ["tig_isi_masasi.jpg", "Tığ işi masası", "Atölyeden", mehmet],
    ["gri_yun_sepeti.jpg", "Gri yün sepeti", "Atölyeden", burak],
    ["hasir_sepette_ipler.jpg", "Hasır sepette ipler", "Atölyeden", gul],
    ["ipci_dukkaninin_raflari.jpg", "İpçi dükkanının rafları", "Atölyeden", null],
    ["mor_ve_gri_raf.jpg", "Mor ve gri raf", "Atölyeden", elif],
    ["hardal_kabartma_orgu.jpg", "Hardal kabartma örgü", "Desenler", ayse],
    ["katlanmis_sis_orguleri.jpg", "Katlanmış şiş örgüleri", "Desenler", null],
    ["renkli_cizgiler.jpg", "Renkli çizgiler", "Desenler", elif],
    ["kiremit_sac_orgusu.jpg", "Kiremit saç örgüsü", "Desenler", burak],
    ["granny_kareler.jpg", "Granny kareler", "Desenler", gul],
    ["dantel_motif.jpg", "Dantel motif", "Desenler", null],
  ];
  for (const [dosya, aciklama, album, orgucu] of galeri) {
    await Galeri.create({ resim: "/img/galeri/" + dosya, aciklama, album, kullaniciId: orgucu ? orgucu.id : null });
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
