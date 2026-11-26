# Sunum hazırlığı: hocanın sorabileceği sorular

Her cevabın yanında kodun bulunduğu dosya ve fonksiyon yazıyor. Sunumdan önce o dosyaları bir kez açıp oku. Kodun yapısı derste yazdığımız örnek projeyle (Apponsequelize) aynı, bu yüzden hocanın tanıdığı kalıpları göreceksin.

---

## Genel

**Proje ne?**
**İlmek**: el yapımı ürünlerin pazar yeri. Örgü, takı, seramik, ahşap gibi ürünleri yapan üyeler mağaza açıp ürün ekliyor, diğer üyeler sipariş talebi gönderiyor. Gerçek ödeme yok: satıcı talebi onaylıyor, sonra durumu "hazırlanıyor → kargoda → teslim edildi" diye ilerletiyor. Ürünü teslim alan alıcı yorum ve puan yazabiliyor.

**Projenin yapısı nasıl?**
Derste kullandığımız **MVC** yapısı:
- `index.js`: uygulamanın girişi. Middleware'leri, route'ları ve tablo ilişkilerini tanımlıyor, sunucuyu başlatıyor.
- `models/`: tablolar (Sequelize modelleri).
- `routes/`: hangi adres hangi fonksiyona gidecek. Örnek: `router.get("/urun/:slug", controllerUser.urun)`.
- `controller/`: o adreste ne yapılacak (veritabanından oku, sayfayı göster).
- `views/`: EJS sayfaları.
- `middleware/` ve `helpers/`: araya giren fonksiyonlar ve yardımcılar.

**Route dosyaları nasıl bağlanıyor?**
`index.js` içinde `app.use("/admin", adminRouter)` gibi. `routes/admin.js` içindeki `router.get("/urunler")` böylece `/admin/urunler` adresine karşılık geliyor. Dört router var: `user` (herkes), `auth` (giriş/kayıt), `hesap` (üyeler), `admin`.

**Neden EJS?**
HTML'in içine `<%= %>` ile veri yazabiliyoruz. Ortak parçalar `views/partials/` içinde (üst menü, alt bilgi, ürün kartı, yorum, sipariş durumu rozeti), her sayfa onları `include` ile çağırıyor. Örneğin ürün kartı (`urun-kart.ejs`) ana sayfada, kategori sayfasında, mağazada ve favorilerde aynı dosyadan geliyor.

**Veritabanı nedir?**
**Sequelize** ile **SQLite**. Derste Sequelize'ı MySQL ile kullandık. Burada `data/db.js` içinde sadece `dialect: "sqlite"` farklı; modeller, `findAll`, `create`, `hasMany` gibi bütün kod dersteki gibi. SQLite ayrı bir sunucu gerektirmiyor, veritabanı tek bir dosya (`ilmek.db`).

**Tablolar neler, ilişkiler nasıl?**
Modeller `models/` içinde, ilişkiler `index.js`'in "İlişkiler" bölümünde:
- `rol` 1 → çok `kullanici` (dersteki `usercategory` → `users` gibi). Roller: 1 = Admin, 2 = Üye.
- `kategori` 1 → çok `urun`.
- `kullanici` 1 → çok `urun` (satıcı). `urun.kullanici` ürünün satıcısı.
- `urun` 1 → çok `yorum`, `kullanici` 1 → çok `yorum`.
- `siparis`: bir ürüne, bir alıcıya ve bir satıcıya bağlı. Alıcı da satıcı da `kullanici` tablosunda olduğu için `as: "alici"` ve `as: "satici"` ile iki ayrı isimle bağlandı (`foreignKey: "aliciId"` / `"saticiId"`).
- **Favori**: `kullanici` çok ↔ çok `urun` (`belongsToMany`, ara tablo `favori`).
- **Mağaza takibi**: `kullanici` çok ↔ çok `kullanici` (ara tablo `takip`: `takipciId`, `takipEdilenId`).
- Diğerleri: `duyuru`, `soru`, `galeri`, `sayac` ve oturumlar için `Sessions`.

**`db.sync()` ne yapıyor?**
Modellere bakıp tablolar yoksa oluşturuyor (`index.js` en alt). Ardından `dummydata()` tablo boşsa örnek verileri ekliyor (`models/dummy-data.js`). Derste `db.sync({ alter: true })` kullandık, o değişen sütunları da günceller.

**`include` ne işe yarıyor?**
SQL'deki JOIN. Örnek: `Urun.findAll({ include: Kullanici })` ürünle birlikte satıcısını da getiriyor, EJS'te `u.kullanici.magazaAdi` diye kullanılıyor. `required: true` verilirse INNER JOIN oluyor: mağazalar sayfasında sadece en az bir onaylı ürünü olan üyeler geliyor (`controller/user.js` → `magazalar`).

**SQL injection'a karşı ne yaptın?**
Sequelize kullanıyoruz: `Urun.findOne({ where: { slug: req.params.slug } })`. Sequelize değerleri SQL metnine eklemiyor, parametre olarak ayrı gönderiyor. Kullanıcının yazdığı şey SQL komutu olarak çalışamıyor.

**XSS'e karşı ne yaptın?**
EJS'te `<%= %>` `<`, `>`, `"` gibi karakterleri otomatik kaçırıyor. Bir üye ürün adına ya da yoruma `<script>` yazarsa sayfada düz yazı olarak görünür, çalışmaz. `<%- %>` sadece kendi `include` dosyalarımız için kullanıldı. JavaScript'le eklenen bildirimlerde de `innerHTML` değil `textContent` kullanıldı.

**Hatalar nasıl yakalanıyor?**
Derste olduğu gibi: her controller `try { ... } catch (err) { next(err) }` yapıyor, hata `index.js` en alttaki hata middleware'ine düşüyor ve "Bir hata oluştu" sayfası gösteriliyor. Bulunamayan sayfalar için `next()` çağrılıyor, 404 middleware'i "Sayfa bulunamadı" gösteriyor.

---

## 1. Site Map

**Site haritasını nasıl yaptın?**
İki tane var, ikisi de `controller/user.js` içinde:
- `siteHaritasi`: `/site-haritasi`, ziyaretçiler için HTML sayfası. Sayfaları, mağazaları, kategorileri ve içlerindeki ürünleri, duyuruları listeliyor.
- `sitemapXml`: `/sitemap.xml`, arama motorları (Google) için XML dosyası.

İkisi de veritabanından **otomatik** üretiliyor. Yeni ürün, kategori ya da duyuru eklenince haritaya kendiliğinden giriyor. Onay bekleyen ürünler haritada görünmüyor.

**sitemap.xml ne işe yarar?**
Arama motorlarına sitedeki bütün adresleri bildirir. Standart biçim `<urlset><url><loc>adres</loc></url></urlset>`.

---

## 2. Ziyaretçi Sayacı

**Ziyaretçi sayacı nasıl çalışıyor?**
`middleware/locals.js`. Her ziyaretçiye `express-session` ile bir oturum (çerez) veriliyor. Oturumda `sayildi` bilgisi yoksa `Sayac.increment("deger", ...)` ile veritabanındaki sayaç 1 artırılıyor ve `sayildi = true` yapılıyor. Aynı kişi sayfalar arasında gezdikçe tekrar sayılmıyor. Sayı sayfanın en altında (footer) ve admin panelinde görünüyor.

**Sayfayı yenileyince artıyor mu?**
Hayır, aynı oturum devam ediyor. Çerez silinirse ya da başka bir tarayıcıdan girilirse yeni ziyaretçi sayılır.

**Neden veritabanında tutuyorsun?**
Sunucu kapanıp açılınca sıfırlanmasın diye. `sayac` tablosunda `ziyaretci` satırı var.

---

## 3. Online Kullanıcı Sayısı

**Online sayısını nasıl hesaplıyorsun?**
`helpers/canli.js`. Hafızada bir nesne var: `sonGorulme = { oturumId: zaman }`. Her istekte `middleware/locals.js` o ziyaretçinin zamanını güncelliyor. **Son 60 saniyede** görülenler çevrimiçi sayılıyor, eskiler siliniyor.

**Kullanıcı sayfada hiçbir şeye tıklamadan duruyorsa?**
`public/js/site.js` 15 saniyede bir `/api/nabiz` adresine istek atıyor ("nabız"). Sayfa açık kaldığı sürece kişi çevrimiçi görünür, sekme kapanınca 60 saniye sonra düşer. Cevapta gelen sayıyla footer'daki rakam güncelleniyor.

**Ürün sayfasındaki "Şu an 2 kişi bu ürüne bakıyor" nasıl çalışıyor?**
Aynı mantık. Ürün sayfasında nabız isteğiyle `urunId` de gönderiliyor (`controller/user.js` → `nabiz`). Sunucu `bakanlar = { oturumId: { urunId, zaman } }` nesnesinde tutuyor, `bakanSayisi(urunId)` son 40 saniyede o ürün sayfasında olanları sayıyor.

**Neden veritabanında değil de hafızada?**
Bunlar saniyeler içinde değişen anlık bilgiler, kalıcı olmaları gerekmiyor.

**Neden Socket.io kullanmadın?**
Projeyi basit tutmak için. 15 saniyede bir istek atmak (polling) bu iş için yeterli.

---

## 4. Duyuru-Haber Modülü

**Duyurular nasıl ekleniyor?**
Admin panelinde `/admin/duyurular` sayfasındaki formdan (`controller/admin.js` → `duyuruEkle`). Başlıktan otomatik slug üretiliyor, `Duyuru.create()` ile kaydediliyor. Ana sayfada vitrinin altındaki şeritte en son duyuru görünüyor, `/duyurular` hepsini listeliyor.

**Silme neden GET değil POST?**
GET ile silme yapılırsa bir link ya da resim etiketi bile silmeyi tetikleyebilir, ayrıca CSRF koruması GET isteklerinde çalışmıyor. Veriyi değiştiren her işlem POST ile yapılıyor. (Derste ilk yöntem GET ile silmeydi, ikinci ve daha güvenli yöntem form + POST'tu, biz ikincisini kullandık.)

---

## 5. Resim Galerisi

**Galeri nasıl çalışıyor?**
`/galeri` sayfası `galeri` tablosundaki resimleri polaroid fotoğraflar gibi (CSS grid, hafif eğik beyaz çerçeveler) gösteriyor: "atölyelerden kareler". Admin `/admin/galeri`'den resim yüklüyor (`controller/admin.js` → `galeriEkle`).

**Resme tıklayınca büyümesi nasıl oluyor?**
JavaScript kullanmadan, CSS `:target` seçicisiyle. Resim linki `#resim-3` adresine gidiyor, CSS'teki `.buyut:target` kuralı o elemanı tam ekran gösteriyor.

**Resimleri nerede tutuyorsun?**
Veritabanında değil, klasörde. Örnek ürün resimleri `public/img/urunler/`, yüklenen resimler `public/img/yuklenen/`. Veritabanına sadece adres (URL) yazılıyor: `urun.resim = "/img/urunler/bere.svg"`. EJS bunu `<img src="<%= u.resim %>">` içine koyuyor, `express.static("public")` dosyayı o adresten sunuyor.

**Dosya yükleme nasıl ve güvenli mi?**
`multer` paketiyle (`helpers/yukle.js`):
- Sadece resim uzantıları kabul ediliyor: jpg, png, webp, gif.
- En fazla 5 MB.
- Dosya adı `zaman-rastgeleSayı.uzantı` olarak değiştiriliyor, çakışma olmuyor.
- Kullanıcıdan SVG kabul edilmiyor, çünkü SVG içine JavaScript yazılabilir. (Örnek resimler SVG ama onları biz çizdik.)

**Form neden `enctype="multipart/form-data"`?**
Normal formlar sadece metin gönderir. Dosya göndermek için bu biçim gerekiyor, multer da bu biçimi okuyor.

---

## 6. Admin Paneli ve Yetkilendirme

**Kaç tür kullanıcı var?**
Üç seviye:
- **Misafir**: giriş yapmamış. Ürünlere, mağazalara, yorumlara, galeriye ve duyurulara bakar, S.S.S.'e soru gönderir.
- **Üye**: hem alıcı hem satıcı. Sipariş talebi gönderir, favoriler, mağaza takip eder, teslim aldığı ürüne yorum yazar; kendi mağazasına ürün ekler, gelen siparişleri yönetir.
- **Admin**: ürünleri onaylar ya da reddeder; kategorileri, duyuruları, galeriyi, S.S.S.'i yönetir; bütün siparişleri ve kullanıcıları görür.

Rol bilgisi `rol` tablosunda (dersteki `usercategory` gibi), her kullanıcının `rolId`'si var.

**Giriş nasıl çalışıyor?**
`controller/auth.js` → `postGiris`. `Kullanici.findOne({ where: { kullaniciAdi }, include: Rol })` ile kullanıcı bulunuyor, `bcrypt.compare()` ile şifre kontrol ediliyor. Doğruysa oturuma `isAuth = 1` ve `kullanici = { id, ad, admin }` yazılıyor.

**Sayfaları nasıl koruyorsun?**
İki middleware var:
- `middleware/isAuth.js` (dersteki gibi): giriş yapılmamışsa `/auth/giris?url=...` adresine yönlendiriyor, giriş yapınca kullanıcı geldiği sayfaya dönüyor. `routes/hesap.js` içinde `router.use(isAuth)` ile o dosyadaki bütün adreslere uygulanıyor.
- `middleware/isAdmin.js`: giriş yoksa girişe yönlendiriyor, üyeyse 403 "Yetkiniz yok" gösteriyor. `routes/admin.js` içinde `router.use(isAdmin)`.

**Bir üye başkasının ürününü ya da siparişini değiştirebilir mi?**
Hayır. `controller/hesap.js` içinde her işlemde sahiplik kontrolü var: ürün düzenleme/silmede `urun.kullaniciId === benimId(req)`, sipariş durumunu değiştirmede `siparis.saticiId === benimId(req)`, iptalde `siparis.aliciId === benimId(req)`. Değilse 404. Kendi ürününe sipariş veremez, kendini takip edemez.

**Şifreler nasıl saklanıyor?**
`bcrypt.hash(sifre, 10)` ile hash'lenerek (derste kullandığımız gibi). Veritabanında düz şifre yok. bcrypt her şifreye otomatik olarak rastgele bir **tuz (salt)** ekliyor, böylece aynı şifreyi kullanan iki kişinin hash'i farklı oluyor.

**Oturumlar nerede tutuluyor?**
`middleware/config_Session.js`. Dersteki gibi `connect-session-sequelize` ile veritabanındaki `Sessions` tablosunda. Sunucu yeniden başlasa da kullanıcıların girişi düşmüyor.

**Admin panelindeki istatistikler nasıl hesaplanıyor?**
`controller/admin.js` → `panel`: `Urun.count(...)`, teslim edilen siparişlerin toplam tutarı için `Siparis.sum("toplam", ...)`, durumlara göre sipariş sayısı için `GROUP BY`: `Siparis.findAll({ attributes: ["durum", [fn("COUNT", col("id")), "sayi"]], group: ["durum"] })`. Favori ara tablosu için ayrı model yazmadık, Sequelize'ın oluşturduğu modele `db.models.favori.count()` ile ulaşılıyor.

---

## 7. CSRF

**CSRF nedir?**
Cross-Site Request Forgery (siteler arası istek sahteciliği). Bir satıcı sitemizde giriş yapmışken kötü niyetli başka bir siteye girerse, o site gizli bir formla bizim sitemize "şu ürünü sil" isteği gönderebilir. Tarayıcı çerezi otomatik eklediği için istek satıcıdan gelmiş gibi görünür.

**Nasıl korudun?**
Derste kullandığımız `csurf` paketiyle:
1. `index.js` içinde `app.use(csurf())`: her POST isteğinde anahtarı kontrol ediyor.
2. `middleware/csrf.js` (dersteki dosya): `res.locals.csrfToken = req.csrfToken()` ile anahtarı bütün sayfalara gönderiyor.
3. Her formda gizli alan var: `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`.
4. Anahtar yoksa ya da yanlışsa csurf `EBADCSRFTOKEN` hatası veriyor, hata middleware'i 403 "Güvenlik hatası" sayfası gösteriyor.

**fetch isteklerinde (favori kalbi) nasıl?**
Anahtar sayfanın `<meta name="csrf-token">` etiketinde. `site.js` bunu okuyup isteğin `x-csrf-token` başlığına ekliyor, csurf başlığa da bakıyor.

**Dosya yükleme formlarında anahtar neden adreste (`?_csrf=...`)?**
Bu formlar `multipart/form-data` biçiminde. csurf, multer'dan önce çalıştığı için o anda `req.body` boş. csurf adresteki `_csrf` değerine de baktığı için anahtarı oraya koyduk.

**Nasıl test edersin?**
Tarayıcının geliştirici araçlarında gizli `_csrf` alanının değerini değiştirip formu gönderirsen "Güvenlik hatası" sayfası çıkar. `test/test.mjs` de bunu deniyor.

---

## 8. Slugify

**Slug nedir, ne işe yarar?**
Başlığın URL'de kullanılabilen hali: "El Örgüsü Bere" → `el-orgusu-bere`. `/urun/5` yerine `/urun/el-orgusu-bere` hem okunaklı hem de arama motorları (SEO) için daha iyi.

**Nasıl yaptın?**
Derste kullandığımız `slugify` paketiyle, `helpers/slugfield.js` dosyasında (dersteki dosyanın aynısı). Seçenekler: `lower: true` (küçük harf), `strict: true` (özel karakterleri sil), `locale: "tr"` (Türkçe harfleri doğru çevir).

Örnek: "Çılgın Şubat İndirimleri Başladı!" → `cilgin-subat-indirimleri-basladi`

**Hangi sayfalarda var?**
Ürün (`/urun/sirli-seramik-kupa`), kategori (`/kategori/mum-sabun`), duyuru (`/duyuru/ilmek-acildi`). Mağazalarda kullanıcı adı kullanılıyor (`/magaza/ayse`).

**Aynı başlıktan iki tane olursa?**
`benzersizSlug()` fonksiyonu veritabanına bakıyor. Slug alınmışsa sonuna `-2`, `-3` ekliyor.

**Slug'la sayfayı nasıl buluyorsun?**
`router.get("/urun/:slug", ...)` içinde `req.params.slug` ile adresteki değer okunuyor, `Urun.findOne({ where: { slug } })` ile aranıyor. Bulunamazsa `next()` çağrılıyor ve 404 sayfası gösteriliyor (dersteki `viewAnc` fonksiyonu gibi).

---

## 9. Soru-Cevap (S.S.S.)

**Nasıl çalışıyor?**
- `/sss` sayfasında `yayinda: true` olan sorular listeleniyor (`controller/user.js` → `sss`).
- Ziyaretçi alttaki formdan soru gönderiyor, soru cevapsız ve yayında değil olarak kaydediliyor (`soruGonder`).
- Admin `/admin/sss` sayfasında cevapsız soruları görüyor, cevap yazınca `yayinda: true` oluyor (`controller/admin.js` → `soruCevapla`).

**Neden sorular hemen yayınlanmıyor?**
Spam ya da uygunsuz içerik doğrudan sitede görünmesin diye (moderasyon).

---

## Pazar yeri özellikleri

**Ürün ekleme ve onay nasıl?**
`/hesap/urun/yeni` (`controller/hesap.js` → `urunFormu`, `urunKaydet`). Hem "yeni" hem "düzenle" aynı formu kullanıyor: adreste `:id` varsa düzenleme. Üyenin eklediği ürün `onayli: false` kaydediliyor, admin `/admin/urunler`'den onaylayınca yayına giriyor. Admin eklerse hemen yayınlanıyor. Düzenlenen ürün tekrar onaya düşüyor. Onaysız ürünü sadece sahibi ve admin görebiliyor, misafir 404 alıyor.

**Sipariş akışı nasıl?**
`models/siparis.js` içinde durumlar ve izin verilen geçişler tanımlı:
```js
Siparis.SONRAKI = {
  beklemede:    ["hazirlaniyor", "reddedildi"],
  hazirlaniyor: ["kargoda"],
  kargoda:      ["teslim"],
};
```
1. Alıcı ürün sayfasındaki formdan adet, adres ve not yazıp gönderiyor (`siparisVer`). Adet stoktan fazla olamaz, kendi ürününe sipariş veremez. Toplam tutar sipariş anındaki fiyatla kaydediliyor, fiyat sonra değişse de sipariş etkilenmiyor.
2. Satıcı "Gelen siparişler"de düğmelerle durumu ilerletiyor (`siparisDurum`). Sadece `SONRAKI` listesindeki geçişlere izin var: "beklemede"den doğrudan "teslim"e geçilemez.
3. Satıcı onaylayınca (`hazirlaniyor`) ürünün stoğu `decrement("stok", { by: adet })` ile düşüyor. Stok yetmezse onaylanamıyor.
4. Alıcı, satıcı onaylamadan önce siparişi iptal edebiliyor (`siparisIptal`).
5. "Siparişlerim" sayfasında siparişin hangi aşamada olduğu 4 adımlı bir çizgiyle gösteriliyor.

**Yorumu herkes yazabilir mi?**
Hayır, sadece ürünü satın alıp **teslim almış** üye (`controller/hesap.js` → `yorumKaydet`): `Siparis.findOne({ where: { urunId, aliciId, durum: "teslim" } })` yoksa yorum reddediliyor. Böylece yorumlar gerçek alıcılardan geliyor. Aynı ürüne ikinci kez yazarsa eski yorumu güncelleniyor. Her yorumdan sonra `helpers/puan.js` ürünün ortalama puanını ve yorum sayısını yeniden hesaplıyor (ürün kartlarında ve sıralamada kullanılıyor).

**Favori (kalp) nasıl çalışıyor?**
Çoka çok ilişki: `Kullanici.belongsToMany(Urun, { through: "favori", as: { singular: "favori", plural: "favoriler" } })`. `as` sayesinde `ben.addFavori(urun)`, `ben.removeFavori(urun)`, `ben.hasFavori(urun)`, `ben.getFavoriler()` fonksiyonları kendiliğinden oluşuyor. Kalbe basınca `site.js` `fetch` ile `/hesap/favori/5` adresine POST atıyor, sunucu varsa siliyor yoksa ekliyor ve `{ favori: true }` gibi JSON döndürüyor. Sayfa yenilenmiyor, kalp dolup boşalıyor ve altta bildirim çıkıyor.

**Mağaza takibi?**
Kullanıcının kendisiyle çoka çok ilişkisi (`takip` tablosu: `takipciId`, `takipEdilenId`). Takip ettiğin mağazaların yeni ürünleri ana sayfada "Takip ettiğin mağazalardan" bölümünde çıkıyor: `Urun.findAll({ where: { kullaniciId: [2, 4] } })`. Sequelize `where`'e dizi verilince SQL'de `IN (2, 4)` yazıyor.

**Sıralama ve fiyat filtresi?**
`/urunler?sirala=ucuz&min=100&max=500` (`controller/user.js` → `urunler`). Sıralama seçenekleri `SIRALAMALAR` nesnesinde, her birinin `order` dizisi var. Fiyat aralığı `Op.gte` (büyük eşit) ve `Op.lte` (küçük eşit) ile. Form `method="get"` olduğu için seçimler adreste görünüyor, sayfa paylaşılabiliyor. Kategori sayfası da aynı fonksiyonu kullanıyor (`/kategori/:slug`).

**Arama?**
Üst menüdeki kutu `/?q=kupa` adresine gidiyor. `Op.like` ile ürün adında/açıklamasında ve mağaza adında/kullanıcı adında arıyor: `{ [Op.like]: "%kupa%" }`.

---

## Tasarım ve telefon

**Tasarımı nasıl yaptın?**
Bootstrap 5 + kendi `public/css/stil.css` dosyam. Bootstrap'ten navbar (telefonda hamburger menü: `navbar-toggler` + `collapse`), açılır menü (`dropdown`), ızgara (`row`, `col-md-6`) ve yardımcı sınıfları (`d-flex`, `gap-2`) kullandım. Görünüm el işine uygun "sıcak" bir tema: krem kâğıt zemin, kiremit ve zeytin yeşili renkler, dikiş çizgisi gibi kesikli kenarlar (`outline: dashed`), el yazısı notlar, galeride polaroid fotoğraflar.

**Renkler nasıl yönetiliyor?**
`stil.css`'in başındaki `:root` içinde CSS değişkenleri: `--zemin`, `--turuncu` (kiremit), `--yesil` (zeytin) ... Bütün site bu değişkenleri kullandığı için bir rengi değiştirmek tek satır.

**Yazı tipleri?**
Üç tane, hepsi `@fontsource` paketlerinden ve `node_modules`'tan sunuluyor (internete gerek yok): **Fraunces** (başlıklar, fiyatlar), **Caveat** (el yazısı notlar: "el yapımı" etiketi, logo altı yazısı), **Inter** (gövde yazısı). `index.js`'te `/vendor/fraunces` gibi statik yollar var.

**Telefonda nasıl görünüyor?**
- Navbar 992px altında hamburger menüye dönüşüyor (Bootstrap `navbar-expand-lg`).
- Kategori şeridi telefonda yana kaydırılıyor (`overflow-x: auto`).
- Ürün ızgarası `grid-template-columns: repeat(auto-fill, minmax(210px, 1fr))` ile ekran genişliğine göre sütun sayısını kendisi ayarlıyor, 576px altında 2 sütun.
- Ürün sayfası `col-md-6` ile bilgisayarda yan yana, telefonda alt alta.

**Sipariş adımları çizgisi nasıl yapıldı?**
`<ol class="adimlar">` listesi. CSS sayacı (`counter-increment`) her adıma numara veriyor, `::before` yuvarlak numarayı, `::after` aradaki çizgiyi çiziyor. Tamamlanan adımlar `tamam` sınıfıyla kiremit rengine dönüyor.

---

## Test

**Projeyi nasıl test ettin?**
`test/test.mjs` dosyası Node'un kendi `fetch` fonksiyonuyla siteyi gerçek bir kullanıcı gibi geziyor: misafir, alıcı, satıcı ve admin olarak giriş yapıyor, ürün ekliyor, sipariş veriyor, durumu ilerletiyor, yorum yazıyor ve sonuçları kontrol ediyor (43 kontrol). Örnekler: CSRF anahtarı olmadan gönderilen form 403 alıyor; ürün adındaki `<script>` sayfada çalışmadan düz yazı görünüyor; onaysız ürün 404 veriyor; teslim almadan yorum yazılamıyor; satıcı onaylayınca stok düşüyor; "beklemede"den doğrudan "teslim"e geçilemiyor; başkası siparişin durumunu değiştiremiyor. Çalıştırmak için: `ilmek.db`'yi sil, `npm start`, başka terminalde `npm test`.

---

## Olası zor sorular

**Derste MySQL kullandık, sen neden SQLite?**
Kurulum gerektirmediği için, proje her bilgisayarda `npm install` ve `npm start` ile çalışıyor. Sequelize kullandığımız için kodun geri kalanı veritabanından bağımsız. MySQL'e geçmek için `data/db.js`'te dersteki satırı yazmak ve `mysql2` paketini kurmak yeterli.

**Neden gerçek ödeme yok?**
Ders projesi olduğu için ve gerçek ödeme almak güvenlik, sözleşme ve banka entegrasyonu gerektirdiği için. Bunun yerine sipariş talebi + durum takibi yaptık; el yapımı ürünlerde zaten çoğu zaman satıcıyla konuşup kişiye özel ayarlama yapılıyor.

**Aynı anda iki kişi son ürünü alırsa?**
Sipariş talebi stoğu düşürmüyor, satıcı onaylarken düşüyor. Satıcı onaylamaya çalıştığında stok yetmiyorsa "Stok yetersiz" uyarısı alıyor, o siparişi reddedebiliyor.

**`saveUninitialized: false` ne demek?**
Oturuma bir şey yazılmadıkça veritabanına kaydetme demek. Biz ziyaretçi sayacı için ilk istekte `sayildi` yazdığımız için her ziyaretçinin oturumu yine de oluşuyor.

**Sunucu yeniden başlarsa ne olur?**
Oturumlar veritabanında olduğu için kimsenin girişi düşmez. Sadece online sayısı ve "şu an bakan" sayıları sıfırlanır, çünkü onlar hafızada.

**Projeyi geliştirmek isteseydin ne eklerdin?**
Alıcı ile satıcı arasında mesajlaşma, bir ürüne birden fazla resim, kargo takip numarası, e-posta bildirimleri, şifremi unuttum, Socket.io ile anlık bildirimler.
