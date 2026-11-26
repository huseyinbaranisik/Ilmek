# Sunum hazırlığı: hocanın sorabileceği sorular

Her cevabın yanında kodun bulunduğu dosya ve fonksiyon yazıyor. Sunumdan önce o dosyaları bir kez açıp oku. Kodun yapısı derste yazdığımız örnek projeyle (Apponsequelize) aynı, bu yüzden hocanın tanıdığı kalıpları göreceksin.

---

## Genel

**Proje ne?**
**İlmek**: el örgüsü ürünlerin pazar yeri. Şişle ve tığla ören üyeler mağaza açıp kazak, bere, bebek patiği, amigurumi gibi örgülerini ekliyor, misafirler ve üyeler sepete ekleyip ödeme yapıyor. Her ürünün iplik türü ve kaç günde örüleceği (hazırlanma süresi) yazıyor. Ödeme sahte (ders projesi): kart bilgileri kontrol ediliyor ama para çekilmiyor. Satıcı siparişi "kargoda → teslim edildi" diye ilerletiyor. Ürünü teslim alan üye yorum ve puan yazabiliyor.

**Kodu kim yazdı, neden bu kadar düz?**
Kodu bilerek basit tuttum: her controller fonksiyonu yukarıdan aşağı okunuyor, kısa yollar (`?.`, iç içe üçlü `? :`, `...` gibi) yerine düz `if` ve `for` kullandım, değişken adları Türkçe (`hata`, `sepet`, `kalemler`, `teslimat`). Böylece her satırı açıklayabiliyorum.

**Projenin yapısı nasıl?**
Derste kullandığımız **MVC** yapısı:
- `index.js`: uygulamanın girişi. Middleware'leri, route'ları ve tablo ilişkilerini tanımlıyor, sunucuyu başlatıyor.
- `models/`: tablolar (Sequelize modelleri).
- `routes/`: hangi adres hangi fonksiyona gidecek. Örnek: `router.get("/urun/:slug", controllerUser.urun)`.
- `controller/`: o adreste ne yapılacak (veritabanından oku, sayfayı göster).
- `views/`: EJS sayfaları.
- `middleware/` ve `helpers/`: araya giren fonksiyonlar ve yardımcılar.

**Route dosyaları nasıl bağlanıyor?**
`index.js` içinde `app.use("/admin", adminRouter)` gibi. `routes/admin.js` içindeki `router.get("/urunler")` böylece `/admin/urunler` adresine karşılık geliyor. Beş router var: `user` (herkes), `sepet` (sepet, ödeme, sipariş sorgulama; misafir de kullanır), `auth` (giriş/kayıt), `hesap` (üyeler), `admin`.

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
- `siparis`: sepetteki her ürün için bir satır; bir ürüne, bir satıcıya ve (üyeyse) bir alıcıya bağlı. Misafir siparişinde `aliciId` boş (null), teslimat bilgileri siparişin kendi sütunlarında (`adSoyad`, `telefon`, `eposta`, `adres`). Alıcı da satıcı da `kullanici` tablosunda olduğu için `as: "alici"` ve `as: "satici"` ile iki ayrı isimle bağlandı.
- **Favori**: `kullanici` çok ↔ çok `urun` (`belongsToMany`, ara tablo `favori`).
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

**Neden veritabanında değil de hafızada?**
Saniyeler içinde değişen anlık bir bilgi, kalıcı olması gerekmiyor.

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
Veritabanında değil, klasörde. Örnek ürün resimleri `public/img/urunler/`, yüklenen resimler `public/img/yuklenen/`. Veritabanına sadece adres (URL) yazılıyor: `urun.resim = "/img/urunler/bere.jpg"`. EJS bunu `<img src="<%= u.resim %>">` içine koyuyor, `express.static("public")` dosyayı o adresten sunuyor.

**Ürün fotoğrafları nereden geldi, telifli mi?**
Unsplash'ten indirildi (`public/img/urunler/*.jpg`). Unsplash Lisansı fotoğrafların ücretsiz indirilmesine ve ticari olanlar dahil her projede kullanılmasına izin veriyor, izin almak gerekmiyor. Yine de fotoğrafçıların adlarını ve fotoğrafların bağlantılarını README'ye yazdık. Fotoğraflar 800x800 piksel, kare kırpılmış JPG; tanesi 100 KB civarında, sayfa hızlı açılsın diye büyük hallerini indirmedik.

**Dosya yükleme nasıl ve güvenli mi?**
`multer` paketiyle (`helpers/yukle.js`):
- Sadece resim uzantıları kabul ediliyor: jpg, png, webp, gif.
- En fazla 5 MB.
- Dosya adı `zaman-rastgeleSayı.uzantı` olarak değiştiriliyor, çakışma olmuyor.
- SVG kabul edilmiyor, çünkü SVG içine JavaScript yazılabilir.

**Form neden `enctype="multipart/form-data"`?**
Normal formlar sadece metin gönderir. Dosya göndermek için bu biçim gerekiyor, multer da bu biçimi okuyor.

---

## 6. Admin Paneli ve Yetkilendirme

**Kaç tür kullanıcı var?**
Üç seviye:
- **Misafir**: giriş yapmamış. Ürünlere, mağazalara, yorumlara, galeriye ve duyurulara bakar, S.S.S.'e soru gönderir. **Sepet oluşturup alışveriş yapabilir**; ödemede adresini ve kart bilgilerini kendisi yazar, siparişini sonra "Sipariş sorgula" ile görür.
- **Üye**: hem alıcı hem satıcı. Alışveriş yapar (adresi ve telefonu hesabında kayıtlı, her seferinde sorulmaz), favoriler, teslim aldığı ürüne yorum yazar; kendi mağazasına ürün ekler, gelen siparişleri kargoya verir.
- **Admin**: ürünleri onaylar ya da reddeder; kategorileri, duyuruları, galeriyi, S.S.S.'i yönetir; bütün siparişleri ve kullanıcıları görür.

Rol bilgisi `rol` tablosunda (dersteki `usercategory` gibi), her kullanıcının `rolId`'si var.

**Giriş nasıl çalışıyor?**
`controller/auth.js` → `postGiris`. `Kullanici.findOne({ where: { kullaniciAdi }, include: Rol })` ile kullanıcı bulunuyor, `bcrypt.compare()` ile şifre kontrol ediliyor. Doğruysa oturuma `isAuth = 1` ve `kullanici = { id, ad, admin }` yazılıyor.

**Sayfaları nasıl koruyorsun?**
İki middleware var:
- `middleware/isAuth.js` (dersteki gibi): giriş yapılmamışsa `/auth/giris?url=...` adresine yönlendiriyor, giriş yapınca kullanıcı geldiği sayfaya dönüyor. `routes/hesap.js` içinde `router.use(isAuth)` ile o dosyadaki bütün adreslere uygulanıyor.
- `middleware/isAdmin.js`: giriş yoksa girişe yönlendiriyor, üyeyse 403 "Yetkiniz yok" gösteriyor. `routes/admin.js` içinde `router.use(isAdmin)`.

**Bir üye başkasının ürününü ya da siparişini değiştirebilir mi?**
Hayır. `controller/hesap.js` içinde her işlemde sahiplik kontrolü var: ürün düzenleme/silmede `urun.kullaniciId != req.session.kullanici.id` ise, sipariş durumunu değiştirmede `siparis.saticiId != req.session.kullanici.id` ise 404 dönüyor. Kendi ürününü satın alamıyor. Sipariş sayfasını da sadece siparişi veren üye, bu oturumda sipariş veren misafir ve admin görebiliyor.

**Şifreler nasıl saklanıyor?**
`bcrypt.hash(sifre, 10)` ile hash'lenerek (derste kullandığımız gibi). Veritabanında düz şifre yok. bcrypt her şifreye otomatik olarak rastgele bir **tuz (salt)** ekliyor, böylece aynı şifreyi kullanan iki kişinin hash'i farklı oluyor.

**Oturumlar nerede tutuluyor?**
`middleware/config_Session.js`. Dersteki gibi `connect-session-sequelize` ile veritabanındaki `Sessions` tablosunda. Sunucu yeniden başlasa da kullanıcıların girişi düşmüyor.

**Admin panelindeki istatistikler nasıl hesaplanıyor?**
`controller/admin.js` → `panel`: `Urun.count(...)`, bütün satışların toplam tutarı için `Siparis.sum("toplam")`, durumlara göre sipariş sayısı için `GROUP BY`: `Siparis.findAll({ attributes: ["durum", [fn("COUNT", col("id")), "sayi"]], group: ["durum"] })`. Favori ara tablosu için ayrı model yazmadık, Sequelize'ın oluşturduğu modele `db.models.favori.count()` ile ulaşılıyor.

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

**Kategori adındaki "&" nasıl çevriliyor?**
slugify "&" işaretini İngilizce "and" yapıyor ("Bere & Şapka" → `bere-and-sapka`). Türkçe olsun diye `slugField()` içinde önce `str.replace(/&/g, " ve ")` yapıyoruz, sonuç `bere-ve-sapka` oluyor.

**Hangi sayfalarda var?**
Ürün (`/urun/sac-orgulu-kazak`), kategori (`/kategori/bere-ve-sapka`), duyuru (`/duyuru/ilmek-acildi`). Mağazalarda kullanıcı adı kullanılıyor (`/magaza/ayse`).

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

**Sepet nerede tutuluyor?**
Sunucuda değil, **tarayıcıda** (`localStorage`, "sepet" anahtarı). Bu yüzden giriş yapmayan misafir de sepet oluşturabiliyor. Sepette sadece ürün id'si ve adet var: `[{ "id": 3, "adet": 2 }]`. `public/js/site.js` içindeki `sepetiOku()` / `sepetiKaydet()` fonksiyonları `JSON.parse` / `JSON.stringify` ile okuyup yazıyor. "Sepete ekle" düğmesi ürünü listeye ekliyor, ürün zaten varsa adedini artırıyor, stoktan fazlasına izin vermiyor. Üst menüdeki sepet rozeti toplam adedi gösteriyor.

**Sepet sayfası ürünlerin adını, fiyatını nereden biliyor?**
Sepette sadece id var. `site.js` sunucuya `/api/sepet?idler=3,5` isteği atıyor (`controller/sepet.js` → `sepetBilgisi`), sunucu o ürünlerin adını, fiyatını, resmini JSON olarak döndürüyor. Sayfa bu bilgiyle dolduruluyor. Ürün adları `textContent` ile yazılıyor (XSS olmasın diye `innerHTML` kullanılmıyor).

**Ödeme nasıl çalışıyor?** (`controller/sepet.js` → `odemeYap`)
1. Form gönderilirken `site.js` tarayıcıdaki sepeti gizli bir `sepet` alanına JSON olarak koyuyor.
2. Sunucu her ürünü veritabanından tekrar buluyor: hâlâ satışta mı, stok yetiyor mu, kendi ürünü mü. **Fiyat her zaman veritabanından alınıyor**; tarayıcıdan gelen sepette fiyat yok, birisi elle fiyat eklese bile dikkate alınmıyor.
3. Teslimat bilgileri: **misafir** ad soyad, telefon, e-posta ve adresi formda yazıyor. **Üyenin** bu bilgileri hesabında kayıtlıysa formda hiç sorulmuyor, hesabından alınıyor. Üye ilk kez alışveriş yapıyorsa bir kere yazıyor ve bilgiler hesabına kaydediliyor (`ben.update(teslimat)`), bir dahakine sorulmuyor. "Hesap bilgilerim" sayfasından değiştirilebiliyor.
4. Kart bilgileri herkesten her alışverişte isteniyor ve basitçe kontrol ediliyor: kart numarası 16 rakam (`/^\d{16}$/`), CVV 3 rakam, son kullanma tarihi AA/YY biçiminde ve geçmemiş olmalı. Hata varsa sayfa hatalarla birlikte tekrar gösteriliyor (kart numarası ve CVV geri doldurulmuyor).
5. Her sepet ürünü için `siparis` tablosuna bir satır ekleniyor. Aynı alışverişin bütün satırlarının `siparisNo`'su aynı (`"IL-" + Date.now()`). Stok `decrement("stok", { by: adet })` ile hemen düşüyor.
6. Kullanıcı "Teşekkürler" sayfasına yönlendiriliyor, o sayfa `localStorage.removeItem('sepet')` ile sepeti boşaltıyor.

**Kart bilgileri saklanıyor mu?**
Hayır. Sadece kartın **son 4 hanesi** (`kartNo.slice(-4)`) siparişe kaydediliyor, sipariş sayfasında "**** 4242" diye görünsün diye. Kart numarasının tamamı ve CVV hiçbir yere yazılmıyor. Gerçek bir sitede kart bilgileri hiç bizim sunucumuza gelmez, iyzico/Stripe gibi bir ödeme şirketinin sayfasında girilir; bu proje bir ders projesi olduğu için ödeme sahte.

**Misafir siparişini nasıl görüyor?**
Ödemeden sonra sipariş numarası oturuma yazılıyor (`req.session.siparisNolari`), aynı tarayıcıda sipariş sayfasını görebiliyor. Sonra görmek isterse "Sipariş sorgula" sayfasında sipariş numarası ve e-postasını yazıyor; ikisi eşleşirse sipariş gösteriliyor. Başka biri sadece numarayla siparişi göremiyor (404).

**Sipariş durumu nasıl ilerliyor?**
Ödeme yapıldığı için sipariş "Hazırlanıyor" diye başlıyor. Satıcı "Gelen siparişler" sayfasında önce "Kargoya verdim", sonra "Teslim edildi" düğmesine basıyor (`controller/hesap.js` → `siparisDurum`). Sadece sıradaki duruma geçilebiliyor, "hazırlanıyor"dan doğrudan "teslim"e geçilemiyor. "Siparişlerim" sayfasında siparişin hangi aşamada olduğu 3 adımlı bir çizgiyle gösteriliyor.

**Yorumu herkes yazabilir mi?**
Hayır, sadece ürünü satın alıp **teslim almış** üye (`controller/hesap.js` → `yorumKaydet`): `Siparis.findOne({ where: { urunId, aliciId, durum: "teslim" } })` yoksa yorum reddediliyor. Böylece yorumlar gerçek alıcılardan geliyor. Aynı ürüne ikinci kez yazarsa eski yorumu güncelleniyor. Her yorumdan sonra `helpers/puan.js` ürünün ortalama puanını ve yorum sayısını yeniden hesaplıyor (ürün kartlarında ve sıralamada kullanılıyor).

**Favori (kalp) nasıl çalışıyor?**
Çoka çok ilişki: `Kullanici.belongsToMany(Urun, { through: "favori", as: { singular: "favori", plural: "favoriler" } })`. `as` sayesinde `ben.addFavori(urun)`, `ben.removeFavori(urun)`, `ben.hasFavori(urun)`, `ben.getFavoriler()` fonksiyonları kendiliğinden oluşuyor. Kalbe basınca `site.js` `fetch` ile `/hesap/favori/5` adresine POST atıyor, sunucu varsa siliyor yoksa ekliyor ve `{ favori: true }` gibi JSON döndürüyor. Sayfa yenilenmiyor, kalp dolup boşalıyor ve altta bildirim çıkıyor.

**Ürün sayfasındaki "Benzer ürünler" nasıl seçiliyor?**
`controller/user.js` → `urun`. Aynı kategorideki, **başka örgücülerin** ürünleri: `kullaniciId: { [Op.ne]: urun.kullaniciId }` (ne = eşit değil). Aynı örgücünün ürünleri zaten üstteki "... mağazasından" bölümünde görünüyor, iki bölümde aynı ürün tekrar etmesin diye. Aynı kategoride 4 ürün yoksa, aynı iplikten örülmüş başka ürünlerle tamamlanıyor (`Op.notIn` ile zaten seçilenler tekrar gelmiyor).

**Sıralama ve fiyat filtresi?**
`/urunler?sirala=ucuz&min=100&max=500` (`controller/user.js` → `urunler`). Sıralama seçenekleri `SIRALAMALAR` nesnesinde, her birinin `sira` dizisi var. Fiyat aralığı için `Op.between` (ikisi de varsa), `Op.gte` (büyük eşit) ya da `Op.lte` (küçük eşit) kullanılıyor. Form `method="get"` olduğu için seçimler adreste görünüyor, sayfa paylaşılabiliyor. Kategori sayfası da aynı fonksiyonu kullanıyor (`/kategori/:slug`).

**İplik türü ve hazırlanma süresi nasıl tutuluyor?**
`models/urun.js` içinde iki sütun: `iplik` (metin) ve `hazirlikGunu` (sayı). Seçilebilecek iplikler aynı dosyada bir dizi: `Urun.IPLIKLER = ["Yün", "Merinos", "Alpaka", "Moher", "Pamuk", "Bambu", "Akrilik"]`. Ürün formundaki açılır liste bu diziden oluşuyor. Kaydederken `Urun.IPLIKLER.includes(req.body.iplik)` ile kontrol ediliyor, listede olmayan bir değer gönderilirse "Yün" yazılıyor. Hazırlanma süresi 1 ile 60 gün arasına sınırlanıyor. Ürün sayfasında "12 günde örülür" gibi gösteriliyor.

**İplik türüne göre süzme?**
Ürünler sayfasındaki çipler `/urunler?iplik=Alpaka` adresine gidiyor. `controller/user.js` → `urunler` fonksiyonu değer listede varsa `where.iplik = "Alpaka"` ekliyor. Sıralama ve fiyat aralığıyla birlikte de çalışıyor (çiplerin adresine diğer seçimler de ekleniyor).

**Arama?**
Üst menüdeki kutu `/?q=kazak` adresine gidiyor. `Op.like` ile ürün adında, açıklamasında ve iplik türünde, ayrıca mağaza adında ve kullanıcı adında arıyor: `{ [Op.like]: "%kazak%" }`. "merinos" yazınca merinos iplikten örülmüş ürünler de çıkıyor.

---

## Tasarım ve telefon

**Tasarımı nasıl yaptın?**
Bootstrap 5 + kendi `public/css/stil.css` dosyam. Bootstrap'ten navbar (telefonda hamburger menü: `navbar-toggler` + `collapse`), açılır menü (`dropdown`), ızgara (`row`, `col-md-6`) ve yardımcı sınıfları (`d-flex`, `gap-2`) kullandım. Görünüm örgüye uygun "sıcak" bir tema: krem kâğıt zemin, kiremit ve zeytin yeşili renkler, dikiş çizgisi gibi kesikli kenarlar (`outline: dashed`), el yazısı notlar, galeride polaroid fotoğraflar.

**Renkler nasıl yönetiliyor?**
`stil.css`'in başındaki `:root` içinde CSS değişkenleri: `--zemin`, `--turuncu` (kiremit), `--yesil` (zeytin) ... Bütün site bu değişkenleri kullandığı için bir rengi değiştirmek tek satır.

**Yazı tipleri?**
Üç tane, hepsi `@fontsource` paketlerinden ve `node_modules`'tan sunuluyor (internete gerek yok): **Fraunces** (başlıklar, fiyatlar), **Caveat** (el yazısı notlar: "el örgüsü" etiketi, logo altı yazısı), **Inter** (gövde yazısı). `index.js`'te `/vendor/fraunces` gibi statik yollar var.

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
`test/test.mjs` dosyası Node'un kendi `fetch` fonksiyonuyla siteyi gerçek bir kullanıcı gibi geziyor: misafir, üye, satıcı ve admin olarak giriş yapıyor, ürün ekliyor, sepetle ödeme yapıyor, durumu ilerletiyor, yorum yazıyor ve sonuçları kontrol ediyor (58 kontrol). Örnekler: CSRF anahtarı olmadan gönderilen form 403 alıyor; ürün adındaki `<script>` sayfada çalışmadan düz yazı görünüyor; hatalı ya da süresi geçmiş kart reddediliyor; sepete elle "fiyat: 1" yazılsa bile toplam veritabanı fiyatıyla hesaplanıyor; sipariş sayfasında kartın sadece son 4 hanesi görünüyor; misafirin siparişini başkası göremiyor; üye ikinci alışverişte adres yazmıyor; teslim almadan yorum yazılamıyor; "hazırlanıyor"dan doğrudan "teslim"e geçilemiyor. Çalıştırmak için: `ilmek.db`'yi sil, `npm start`, başka terminalde `npm test`.

---

## Olası zor sorular

**Derste MySQL kullandık, sen neden SQLite?**
Kurulum gerektirmediği için, proje her bilgisayarda `npm install` ve `npm start` ile çalışıyor. Sequelize kullandığımız için kodun geri kalanı veritabanından bağımsız. MySQL'e geçmek için `data/db.js`'te dersteki satırı yazmak ve `mysql2` paketini kurmak yeterli.

**Neden gerçek ödeme yok?**
Ders projesi olduğu için ve gerçek ödeme almak güvenlik, sözleşme ve banka entegrasyonu gerektirdiği için. Ödeme formu gerçek gibi çalışıyor (kart kontrolleri, sipariş oluşturma, stok düşme) ama para çekilmiyor. Gerçek bir sitede bu adımda iyzico ya da Stripe gibi bir ödeme şirketine bağlanılırdı.

**Aynı anda iki kişi son ürünü alırsa?**
Ödeme sırasında stok tekrar kontrol ediliyor. İlk ödeyen alıyor ve stok düşüyor; ikinci kişi ödemeye bastığında "stokta sadece 0 adet var" hatası alıyor.

**Sepet neden sunucuda değil?**
Misafir de alışveriş yapabilsin diye ve basit olsun diye. Sunucuda tutsaydık her ziyaretçi için oturumda ya da veritabanında sepet saklamamız gerekirdi. Tarayıcıda tutmanın dezavantajı: başka bir bilgisayarda aynı sepet görünmez. Bu yüzden fiyat ve stok gibi önemli şeyleri ödeme sırasında sunucuda tekrar kontrol ediyoruz.

**`saveUninitialized: false` ne demek?**
Oturuma bir şey yazılmadıkça veritabanına kaydetme demek. Biz ziyaretçi sayacı için ilk istekte `sayildi` yazdığımız için her ziyaretçinin oturumu yine de oluşuyor.

**Sunucu yeniden başlarsa ne olur?**
Oturumlar veritabanında olduğu için kimsenin girişi düşmez. Sadece online sayısı sıfırlanır, çünkü o hafızada.

**Projeyi geliştirmek isteseydin ne eklerdin?**
Alıcı ile satıcı arasında mesajlaşma, bir ürüne birden fazla resim, kargo takip numarası, e-posta bildirimleri, şifremi unuttum, Socket.io ile anlık bildirimler.
