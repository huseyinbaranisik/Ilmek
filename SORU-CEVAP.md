# Sunum hazırlığı: hocanın sorabileceği sorular

Her cevabın yanında kodun bulunduğu dosya ve fonksiyon yazıyor. Sunumdan önce o dosyaları bir kez açıp oku. Kodun yapısı derste yazdığımız örnek projeyle (Apponsequelize) aynı, bu yüzden hocanın tanıdığı kalıpları göreceksin.

---

## Genel

**Projenin yapısı nasıl?**
Derste kullandığımız **MVC** yapısı:
- `index.js`: uygulamanın girişi. Middleware'leri, route'ları ve tablo ilişkilerini tanımlıyor, sunucuyu başlatıyor.
- `models/`: tablolar (Sequelize modelleri).
- `routes/`: hangi adres hangi fonksiyona gidecek. Örnek: `router.get("/sarki/:slug", controllerUser.sarki)`.
- `controller/`: o adreste ne yapılacak (veritabanından oku, sayfayı göster).
- `views/`: EJS sayfaları.
- `middleware/` ve `helpers/`: araya giren fonksiyonlar ve yardımcılar.

**Route dosyaları nasıl bağlanıyor?**
`index.js` içinde `app.use("/admin", adminRouter)` gibi. `routes/admin.js` içindeki `router.get("/sarkilar")` böylece `/admin/sarkilar` adresine karşılık geliyor. Dört router var: `user` (herkes), `auth` (giriş/kayıt), `hesap` (üyeler), `admin`.

**Neden EJS?**
HTML'in içine `<%= %>` ile veri yazabiliyoruz. Ortak parçalar (üst menü, alt oynatıcı, inceleme kartı) `views/partials/` içinde, her sayfa onları `include` ile çağırıyor.

**Veritabanı nedir?**
**Sequelize** ile **SQLite**. Derste Sequelize'ı MySQL ile kullandık. Burada `data/db.js` içinde sadece `dialect: "sqlite"` farklı, modeller, `findAll`, `create`, `hasMany` gibi bütün kod dersteki gibi. SQLite ayrı bir sunucu gerektirmiyor, veritabanı tek bir dosya (`plak.db`). İstenirse `db.js`'i dersteki MySQL ayarıyla değiştirmek yeterli.

**Tablolar neler, ilişkiler nasıl?**
Modeller `models/` içinde, ilişkiler `index.js`'in "İlişkiler" bölümünde:
- `rol` 1 → çok `kullanici` (dersteki `usercategory` → `users` gibi). Roller: 1 = Admin, 2 = Üye.
- `kullanici` 1 → çok `sarki` (yükleyen), `inceleme`, `liste`.
- `sarki` 1 → çok `inceleme`.
- `liste` çok ↔ çok `sarki`: `belongsToMany` ile. Sequelize bunun için `listeSarki` ara tablosunu kendisi oluşturuyor.
- Diğerleri: `duyuru`, `soru`, `galeri`, `sayac`, ve oturumlar için `Sessions`.

**`db.sync()` ne yapıyor?**
Modellere bakıp tablolar yoksa oluşturuyor (`index.js` en alt). Ardından `dummydata()` tablo boşsa örnek verileri ekliyor (`models/dummy-data.js`). Derste `db.sync({ alter: true })` kullandık, o değişen sütunları da günceller.

**`include` ne işe yarıyor?**
SQL'deki JOIN. Örnek: `Inceleme.findAll({ include: [Kullanici, Sarki] })` incelemeyle birlikte yazan kişiyi ve şarkıyı da getiriyor. EJS'te `i.kullanici.kullaniciAdi` diye kullanılıyor.

**SQL injection'a karşı ne yaptın?**
Sequelize kullanıyoruz: `Sarki.findOne({ where: { slug: req.params.slug } })`. Sequelize değerleri SQL metnine eklemiyor, parametre olarak ayrı gönderiyor. Kullanıcının yazdığı şey SQL komutu olarak çalışamıyor.

**XSS'e karşı ne yaptın?**
EJS'te `<%= %>` `<`, `>`, `"` gibi karakterleri otomatik kaçırıyor. Bir üye incelemesine `<script>` yazarsa sayfada düz yazı olarak görünür, çalışmaz. `<%- %>` sadece kendi `include` dosyalarımız için kullanıldı.

**Hatalar nasıl yakalanıyor?**
Derste olduğu gibi: her controller `try { ... } catch (err) { next(err) }` yapıyor, hata `index.js` en alttaki hata middleware'ine düşüyor ve "Bir hata oluştu" sayfası gösteriliyor. Bulunamayan sayfalar için `next()` çağrılıyor, 404 middleware'i "Sayfa bulunamadı" gösteriyor.

---

## 1. Site Map

**Site haritasını nasıl yaptın?**
İki tane var, ikisi de `controller/user.js` içinde:
- `siteHaritasi`: `/site-haritasi`, ziyaretçiler için HTML sayfası. Bütün sayfaları, albümleri, şarkıları, listeleri ve duyuruları listeliyor.
- `sitemapXml`: `/sitemap.xml`, arama motorları (Google) için XML dosyası.

İkisi de veritabanından **otomatik** üretiliyor. Yeni şarkı, liste ya da duyuru eklenince haritaya kendiliğinden giriyor. Onay bekleyen şarkılar haritada görünmüyor.

**sitemap.xml ne işe yarar?**
Arama motorlarına sitedeki bütün adresleri bildirir, böylece sayfaların taranması kolaylaşır. Standart biçim `<urlset><url><loc>adres</loc></url></urlset>`.

---

## 2. Ziyaretçi Sayacı

**Ziyaretçi sayacı nasıl çalışıyor?**
`middleware/locals.js`. Her ziyaretçiye `express-session` ile bir oturum (çerez) veriliyor. Oturumda `sayildi` bilgisi yoksa `Sayac.increment("deger", ...)` ile veritabanındaki sayaç 1 artırılıyor ve `sayildi = true` yapılıyor. Aynı kişi sayfalar arasında gezdikçe tekrar sayılmıyor.

**Sayfayı yenileyince artıyor mu?**
Hayır, aynı oturum devam ediyor. Çerez silinirse ya da başka bir tarayıcıdan girilirse yeni ziyaretçi sayılır.

**Neden veritabanında tutuyorsun?**
Sunucu kapanıp açılınca sıfırlanmasın diye. `sayac` tablosunda `ziyaretci` satırı var.

---

## 3. Online Kullanıcı Sayısı

**Online sayısını nasıl hesaplıyorsun?**
`helpers/canli.js`. Hafızada bir nesne var: `sonGorulme = { oturumId: zaman }`. Her istekte `middleware/locals.js` o ziyaretçinin zamanını güncelliyor. **Son 60 saniyede** görülenler çevrimiçi sayılıyor, eskiler siliniyor.

**Kullanıcı sayfada hiçbir şeye tıklamadan duruyorsa?**
`public/js/oynatici.js` 15 saniyede bir `/api/nabiz` adresine istek atıyor ("nabız"). Sayfa açık kaldığı sürece kişi çevrimiçi görünür, sekme kapanınca 60 saniye sonra düşer.

**"Şu an 3 kişi dinliyor" nasıl çalışıyor?**
Aynı mantık. Şarkı çalarken nabız isteğinde `sarkiId` de gönderiliyor (`controller/user.js` → `nabiz`). Sunucu `dinleyenler = { oturumId: { sarkiId, zaman } }` nesnesinde tutuyor. Son 40 saniyede haber verenler şarkı bazında sayılıyor, cevapta dönen sayılarla JavaScript sayfadaki rakamları güncelliyor.

**Neden veritabanında değil de hafızada?**
Bunlar saniyeler içinde değişen anlık bilgiler, kalıcı olmaları gerekmiyor.

**Neden Socket.io kullanmadın?**
Projeyi basit tutmak için. 15 saniyede bir istek atmak (polling) bu iş için yeterli.

---

## 4. Duyuru-Haber Modülü

**Duyurular nasıl ekleniyor?**
Admin panelinde `/admin/duyurular` sayfasındaki formdan (`controller/admin.js` → `duyuruEkle`). Başlıktan otomatik slug üretiliyor, `Duyuru.create()` ile kaydediliyor. Ana sayfanın üstündeki şeritte en son duyuru görünüyor.

**Silme neden GET değil POST?**
GET ile silme yapılırsa bir link ya da resim etiketi bile silmeyi tetikleyebilir, ayrıca CSRF koruması GET isteklerinde çalışmıyor. Veriyi değiştiren her işlem POST ile yapılıyor. (Derste ilk yöntem GET ile silmeydi, ikinci ve daha güvenli yöntem form + POST'tu, biz ikincisini kullandık.)

---

## 5. Resim Galerisi

**Galeri nasıl çalışıyor?**
`/galeri` sayfası `galeri` tablosundaki resimleri ızgara (CSS grid) şeklinde gösteriyor. Admin `/admin/galeri`'den resim yüklüyor (`controller/admin.js` → `galeriEkle`).

**Resme tıklayınca büyümesi nasıl oluyor?**
JavaScript kullanmadan, CSS `:target` seçicisiyle. Resim linki `#resim-3` adresine gidiyor, CSS'teki `.buyut:target` kuralı o elemanı tam ekran gösteriyor.

**Dosya yükleme nasıl ve güvenli mi?**
`multer` paketiyle (`helpers/yukle.js`):
- Sadece izin verilen uzantılar kabul ediliyor: resim için jpg, png, webp, gif. Ses için mp3, wav, ogg.
- En fazla 20 MB.
- Dosya adı `zaman-rastgeleSayı.uzantı` olarak değiştiriliyor, çakışma olmuyor.
- SVG kabul edilmiyor, çünkü SVG içine JavaScript yazılabilir.

**Form neden `enctype="multipart/form-data"`?**
Normal formlar sadece metin gönderir. Dosya göndermek için bu biçim gerekiyor, multer da bu biçimi okuyor.

---

## 6. Admin Paneli ve Yetkilendirme

**Kaç tür kullanıcı var?**
Üç seviye:
- **Misafir**: giriş yapmamış. Dinler, gezer, S.S.S.'e soru gönderir.
- **Üye**: puan verir, inceleme yazar, liste oluşturur, şarkı beğenir, üye takip eder, şarkı yükler.
- **Admin**: şarkıları onaylar, duyuru, galeri, S.S.S. ve incelemeleri yönetir.

Rol bilgisi `rol` tablosunda (dersteki `usercategory` gibi), her kullanıcının `rolId`'si var.

**Giriş nasıl çalışıyor?**
`controller/auth.js` → `postGiris`. `Kullanici.findOne({ where: { kullaniciAdi }, include: Rol })` ile kullanıcı bulunuyor, `bcrypt.compare()` ile şifre kontrol ediliyor. Doğruysa oturuma `isAuth = 1` ve `kullanici = { id, ad, admin }` yazılıyor.

**Sayfaları nasıl koruyorsun?**
İki middleware var:
- `middleware/isAuth.js` (dersteki gibi): giriş yapılmamışsa `/auth/giris?url=...` adresine yönlendiriyor. Giriş yapınca kullanıcı geldiği sayfaya dönüyor. `routes/hesap.js` içindeki her route'ta var.
- `middleware/isAdmin.js`: giriş yoksa girişe yönlendiriyor, üyeyse 403 "Yetkiniz yok" gösteriyor. `routes/admin.js` içinde `router.use(isAdmin)` ile o dosyadaki **bütün** adreslere uygulanıyor.

**Bir üye başkasının listesini ya da incelemesini silebilir mi?**
Hayır. `controller/hesap.js` içinde `benimListem()` fonksiyonu listenin `kullaniciId`'si oturumdaki kullanıcıyla aynı mı diye bakıyor. İnceleme silmede de aynı kontrol var, ek olarak admin her incelemeyi silebiliyor.

**Şifreler nasıl saklanıyor?**
`bcrypt.hash(sifre, 10)` ile hash'lenerek (derste kullandığımız gibi). Veritabanında düz şifre yok. `10` hash'leme turu sayısı, ne kadar büyükse kırmak o kadar zor. bcrypt her şifreye otomatik olarak rastgele bir **tuz (salt)** ekliyor, böylece aynı şifreyi kullanan iki kişinin hash'i farklı oluyor.

**Oturumlar nerede tutuluyor?**
`middleware/config_Session.js`. Dersteki gibi `connect-session-sequelize` ile veritabanındaki `Sessions` tablosunda. Sunucu yeniden başlasa da kullanıcıların girişi düşmüyor.

---

## 7. CSRF

**CSRF nedir?**
Cross-Site Request Forgery (siteler arası istek sahteciliği). Admin sitemizde giriş yapmışken kötü niyetli başka bir siteye girerse, o site gizli bir formla bizim sitemize "şu şarkıyı sil" isteği gönderebilir. Tarayıcı çerezi otomatik eklediği için istek admin'den gelmiş gibi görünür.

**Nasıl korudun?**
Derste kullandığımız `csurf` paketiyle:
1. `index.js` içinde `app.use(csurf())`: her POST isteğinde anahtarı kontrol ediyor.
2. `middleware/csrf.js` (dersteki dosya): `res.locals.csrfToken = req.csrfToken()` ile anahtarı bütün sayfalara gönderiyor.
3. Her formda gizli alan var: `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`.
4. Anahtar yoksa ya da yanlışsa csurf `EBADCSRFTOKEN` hatası veriyor, hata middleware'i 403 "Güvenlik hatası" sayfası gösteriyor.

Kötü niyetli site bu anahtarı bilemez, bu yüzden sahte istek reddediliyor.

**Derste csrf middleware'ini sadece formlu sayfalara eklemiştik, sen neden hepsine ekledin?**
Bu sitede neredeyse her sayfada form var (üst menüdeki çıkış butonu, oynatıcının fetch istekleri). Her route'a tek tek eklemek yerine `app.use(csrfToken)` ile bir kere ekledik.

**fetch isteklerinde nasıl?**
Anahtar sayfanın `<meta name="csrf-token">` etiketinde. `oynatici.js` bunu okuyup isteğin `x-csrf-token` başlığına ekliyor, csurf başlığa da bakıyor.

**Dosya yükleme formlarında anahtar neden adreste (`?_csrf=...`)?**
Bu formlar `multipart/form-data` biçiminde. csurf, multer'dan önce çalıştığı için o anda `req.body` boş. csurf adresteki `_csrf` değerine de baktığı için anahtarı oraya koyduk.

**Nasıl test edersin?**
Tarayıcının geliştirici araçlarında gizli `_csrf` alanının değerini değiştirip formu gönderirsen "Güvenlik hatası" sayfası çıkar.

---

## 8. Slugify

**Slug nedir, ne işe yarar?**
Başlığın URL'de kullanılabilen hali: "Sessiz Sokaklar" → `sessiz-sokaklar`. `/sarki/5` yerine `/sarki/sessiz-sokaklar` hem okunaklı hem de arama motorları (SEO) için daha iyi.

**Nasıl yaptın?**
Derste kullandığımız `slugify` paketiyle, `helpers/slugfield.js` dosyasında (dersteki dosyanın aynısı). Seçenekler: `lower: true` (küçük harf), `strict: true` (özel karakterleri sil), `locale: "tr"` (Türkçe harfleri doğru çevir).

Örnek: "Çılgın Şubat Konseri İçin Ön Satış!" → `cilgin-subat-konseri-icin-on-satis`

**Hangi sayfalarda var?**
Şarkı (`/sarki/kor`), albüm (`/album/gece-yarisi`), liste (`/liste/sabah-enerjisi`), duyuru (`/duyuru/plak-yayinda`). Profillerde kullanıcı adı kullanılıyor (`/uye/deniz`).

**Aynı başlıktan iki tane olursa?**
`benzersizSlug()` fonksiyonu veritabanına bakıyor. Slug alınmışsa sonuna `-2`, `-3` ekliyor.

**Slug'la sayfayı nasıl buluyorsun?**
`router.get("/sarki/:slug", ...)` içinde `req.params.slug` ile adresteki değer okunuyor, `Sarki.findOne({ where: { slug } })` ile aranıyor. Bulunamazsa `next()` çağrılıyor ve 404 sayfası gösteriliyor (dersteki `viewAnc` fonksiyonu gibi).

---

## 9. Soru-Cevap (S.S.S.)

**Nasıl çalışıyor?**
- `/sss` sayfasında `yayinda: true` olan sorular listeleniyor (`controller/user.js` → `sss`).
- Ziyaretçi alttaki formdan soru gönderiyor, soru cevapsız ve yayında değil olarak kaydediliyor (`soruGonder`).
- Admin `/admin/sss` sayfasında cevapsız soruları görüyor, cevap yazınca `yayinda: true` oluyor (`controller/admin.js` → `soruCevapla`).

**Neden sorular hemen yayınlanmıyor?**
Spam ya da uygunsuz içerik doğrudan sitede görünmesin diye (moderasyon).

---

## Letterboxd kısmı: puan, inceleme, liste

**Puan nasıl veriliyor?**
Şarkı sayfasındaki formda 5 tane radio butonu var, CSS ile yıldız gibi görünüyor. Form `/hesap/inceleme/:sarkiId` adresine gidiyor (`controller/hesap.js` → `incelemeKaydet`).

**Aynı şarkıya iki kere puan verilebilir mi?**
Hayır. Önce `Inceleme.findOne({ where: { kullaniciId, sarkiId } })` ile eski inceleme aranıyor. Varsa güncelleniyor, yoksa yenisi oluşturuluyor.

**Ortalama puan nasıl hesaplanıyor?**
`helpers/puan.js` → `puanGuncelle()`. İnceleme eklenince, güncellenince ya da silinince çağrılıyor. O şarkının bütün incelemelerini alıp puanları topluyor, sayıya bölüyor ve şarkının `ortPuan` ve `incelemeSayisi` sütunlarına yazıyor. Ortalamayı her sayfa açılışında hesaplamak yerine bir kere hesaplayıp saklıyoruz, böylece "En yüksek puanlılar" listesi basit bir `order: [["ortPuan", "DESC"]]` sorgusu oluyor.

**Yıldızlar nasıl gösteriliyor?**
`middleware/locals.js` içindeki `yildiz()` fonksiyonu: `"★".repeat(4) + "☆".repeat(1)` → ★★★★☆.

**Listeler nasıl çalışıyor?**
Liste ile şarkı arasında çoka çok ilişki var (`belongsToMany`). Sequelize bize `liste.addSarki(sarki)` ve `liste.removeSarki(id)` fonksiyonlarını hazır veriyor, bunlar `listeSarki` ara tablosuna satır ekliyor ya da siliyor.

**Profil sayfasında neler var?**
`/uye/:kullaniciAdi` (`controller/user.js` → `profil`). Üyenin incelemeleri (dinleme günlüğü), listeleri ve yüklediği şarkılar. Onay bekleyen şarkıları sadece kendisi görüyor.

---

## Spotify kısmı: şarkı yükleme ve oynatıcı

**Üye şarkı yükleyince ne oluyor?**
`controller/hesap.js` → `postYukle`. Dosyalar multer ile kaydediliyor: resim `public/img/yuklenen/`, müzik `public/muzik/yuklenen/` (`helpers/yukle.js`, formdaki alanın adına göre klasör seçiyor). Veritabanına dosyanın kendisi değil adresi yazılıyor, şarkı `onayli: false` olarak veritabanına ekleniyor. Admin `/admin/sarkilar` sayfasında şarkıyı dinleyip "Onayla" derse `onayli: true` oluyor ve sitede görünmeye başlıyor. Admin yüklerse şarkı hemen yayınlanıyor.

**Onaylanmamış şarkı nasıl gizleniyor?**
Ziyaretçi sayfalarındaki bütün sorgularda `where: { onayli: true }` var. Adresi bilen biri bile `/sarki/...` sayfasını açamaz, 404 alır.

**Kapak yüklemezse ne oluyor?**
Aynı albümden şarkı varsa o albümün kapağı kullanılıyor. Yeni albümse kapak zorunlu.

**Kitaplık sayfasındaki plak kılıfları nasıl çalışıyor?**
`/kitaplik` (`views/kitaplik.ejs`, `public/js/kitaplik.js`, `stil.css` → "Kitaplık" bölümü). Bütün hareket CSS'te, JavaScript sadece sınıf ekleyip çıkarıyor:
- Kılıflar yan yana dizili ve negatif `margin-left` ile üst üste biniyor, her birinin sadece renkli sırtı görünüyor.
- Üzerine gelince (`:hover`) kılıf `translateY(-14px) scale(1.04)` ile yükselip öne geliyor ve kılıfın arkasında saklı duran plak `translateX(-62%)` ile sola kayarak çıkıyor.
- `.kilif:hover ~ .kilif` seçicisi sağdaki kılıfları sağa, `.kilif:has(~ .kilif:hover)` seçicisi soldaki kılıfları sola kaydırıyor, böylece kapağa ve plağa yer açılıyor. Bunların hepsi CSS, JavaScript yok.
- Tıklayınca `kitaplik.js`, `oynatici.js`'teki `sarkiyiCal()` fonksiyonunu çağırıyor ve şarkı başlıyor. Tekrar tıklayınca duruyor. Plağın `data-plak` özelliği olduğu için oynatıcı ona `doner` sınıfını ekliyor ve plak dönmeye başlıyor.
- Yumuşaklık `transition: transform .5s cubic-bezier(...)` ile sağlanıyor. Sadece `transform` değiştiği için tarayıcı bunu ekran kartıyla akıcı çiziyor.
- `isolation: isolate`: her kılıfı ayrı bir katman yapıyor, böylece kayan kılıflar birbirinin önüne yanlış sırada geçmiyor.

**Plak nasıl dönüyor?**
CSS animasyonuyla (`stil.css`): `@keyframes don { to { transform: rotate(360deg); } }`. Animasyon varsayılan olarak durdurulmuş (`paused`). Şarkı çalınca JavaScript plağa `doner` sınıfı ekliyor ve animasyon çalışmaya başlıyor.

**Arka plan rengi kapaktan nasıl geliyor?**
Her şarkının bir `renk` değeri var. EJS bunu `style="--renk: #185FA5"` olarak yazıyor, CSS'te `color-mix()` ile koyulaştırılıp arka plan yapılıyor.

**Başka sayfaya geçince müzik neden kaldığı yerden devam ediyor?**
`oynatici.js` çalan şarkıyı, listeyi ve saniyeyi tarayıcının `localStorage`'ına kaydediyor. Yeni sayfa açılınca aynı saniyeden devam ediyor.

**Dinlenme sayısı nasıl artıyor?**
Şarkı çalmaya başlayınca `oynatici.js` `/api/dinlendi/:id` adresine POST atıyor, sunucu `Sarki.increment("dinlenme", ...)` yapıyor.

---

## Üyeler, beğeniler, takip (Spotify özellikleri)

**Başkalarının hesaplarına nasıl bakılıyor?**
Sol menüdeki **Üyeler** (`/uyeler`, `controller/user.js` → `uyeler`) bütün üyeleri kart olarak gösteriyor. Her kartta takipçi, liste, inceleme ve beğeni sayısı var. Sayılar Sequelize'in ilişki fonksiyonlarıyla geliyor: `u.countIncelemeler()`, `u.countListeler()`, `u.countBegenilenler()`, `u.countTakipciler()`. Karta tıklayınca profil (`/uye/ece`) açılıyor. Profilde üyenin incelemeleri, listeleri, beğendiği şarkılar, yüklediği şarkılar, takip ettikleri ve takipçileri var. Bunlar misafirlere de açık, sadece onaylanmamış şarkıları yalnızca sahibi görüyor.

**Beğenilen Şarkılar (kalp) nasıl çalışıyor?**
Çoka çok ilişki: bir üye çok şarkı beğenir, bir şarkıyı çok üye beğenir. `index.js`'te:
`Kullanici.belongsToMany(Sarki, { through: "begeni", as: { singular: "begenilen", plural: "begenilenler" } })`.
Sequelize `begeni` adında ara tablo oluşturuyor (kullaniciId, sarkiId). `as` ile isim verdik çünkü kullanıcı ile şarkı arasında "yüklediği şarkılar" ilişkisi (`hasMany`) zaten var, iki ilişki karışmasın. Bu isim sayesinde `ben.addBegenilen(sarki)`, `ben.removeBegenilen(sarki)`, `ben.hasBegenilen(sarki)` ve `uye.getBegenilenler()` fonksiyonları kendiliğinden oluşuyor.

**Kalbe basınca sayfa neden yenilenmiyor?**
Kalp düğmesi (`data-begen="5"`) `oynatici.js`'te `fetch` ile `/hesap/begen/5` adresine POST atıyor (CSRF anahtarı `x-csrf-token` başlığında). Sunucu (`controller/hesap.js` → `begen`) beğenmişse siliyor, beğenmemişse ekliyor ve `{ begendi: true }` gibi JSON döndürüyor. JavaScript sayfadaki aynı şarkının bütün kalplerini dolduruyor ya da boşaltıyor. Sayfa açılırken hangi şarkıların beğenildiği `middleware/locals.js`'ten `begenilenIdler` olarak geliyor. Route `isAuth` arkasında olduğu için misafir beğenemez.

**Takip nasıl çalışıyor?**
Kullanıcının kendisiyle çoka çok ilişkisi. `takip` tablosunda iki sütun var: `takipciId` (takip eden) ve `takipEdilenId` (takip edilen). Aynı tablo iki yönden tanımlanıyor:
- `Kullanici.belongsToMany(Kullanici, { through: "takip", as: "takipEdilenler", foreignKey: "takipciId", otherKey: "takipEdilenId" })` → benim takip ettiklerim
- tersi `as: "takipciler"` → beni takip edenler
Profildeki "Takip et" formu `/hesap/takip/ece` adresine POST atıyor. `controller/hesap.js` → `takip` fonksiyonu `hasTakipEdilen` ile bakıyor, takip ediyorsa `removeTakipEdilen`, etmiyorsa `addTakipEdilen` yapıyor. Kişi kendini takip edemiyor.

**Profildeki "Şu an dinliyor" nereden geliyor?**
Oynatıcı zaten 15 saniyede bir `/api/nabiz`'e hangi şarkıyı çaldığını bildiriyordu. Buna giriş yapmış kişinin kullanıcı adını da ekledik (`helpers/canli.js` → `dinleyenler`). `neDinliyor("ece")` fonksiyonu ece'nin son 40 saniyede çaldığı şarkıyı buluyor. Spotify'daki "arkadaş etkinliği" gibi. Veritabanına yazılmıyor, sunucu hafızasında.

**Karıştır ve tekrarla nasıl çalışıyor?**
Tamamen tarayıcıda (`oynatici.js`), sunucuya bir şey gitmiyor. `karisik` açıksa sıradaki şarkı `Math.random()` ile seçiliyor. `tekrar` üç durum arasında dönüyor: kapalı → listeyi tekrarla (liste bitince başa döner) → şarkıyı tekrarla (şarkı bitince `currentTime = 0`). Seçim `localStorage`'a kaydediliyor, sayfa değişince kaybolmuyor.

---

## Resimler ve dosyalar

**Resimleri nerede tutuyorsun?**
Veritabanında değil, klasörde. Bütün resimler `public/img/` altında: örnek albüm kapakları `public/img/kapaklar/`, yüklenen kapaklar ve galeri resimleri `public/img/yuklenen/`. Veritabanına sadece resmin adresi (URL) yazılıyor: `sarki.kapak = "/img/kapaklar/gece-yarisi.svg"`. EJS bu adresi `<img src="<%= s.kapak %>">` içine koyuyor, `index.js`'teki `express.static("public")` da dosyayı o adresten sunuyor. Müzikler de aynı şekilde `public/muzik/`'te.

**Yüklenen resim nereye gidiyor?**
`helpers/yukle.js`'teki multer ayarı formdaki alanın adına bakıyor: `ses` alanıysa `public/muzik/yuklenen/`, değilse (kapak, galeri resmi) `public/img/yuklenen/`. Dosya adı çakışmasın diye `zaman-rastgeleSayı.uzantı` yapılıyor. Controller veritabanına `"/img/yuklenen/" + req.file.filename` adresini yazıyor.

---

## Telefon ve tablet

**Site telefonda nasıl görünüyor?**
`stil.css`'in sonundaki `@media` kurallarıyla:
- 768px altı (telefon, dikey tablet): sol menü gizleniyor, menü düğmesiyle soldan kayarak açılıyor. Renkli üst bölümler alt alta diziliyor.
- 576px altı (telefon): kartlar 2 sütun, oynatıcıda sadece şarkı + kalp + çal + ileri kalıyor (Spotify'ın telefon uygulaması gibi), yazılar biraz küçülüyor.
- 1200px altı: Bootstrap'in `col-lg` sütunları ekranın genişliğine bakıyor ama içerik sol menü kadar daha dar. Bu yüzden iki sütunlu bölümler (incelemeler + liste) bu genişlikte alt alta diziliyor.
- `@media (hover: none)`: dokunmatik ekranda "üzerine gelme" olmadığı için kartlardaki çal düğmeleri hep görünüyor.
`<meta name="viewport" content="width=device-width, initial-scale=1">` etiketi de telefonun sayfayı küçültmeden göstermesini sağlıyor.

---

## Tasarım

**Tasarımı nasıl yaptın, hazır şablon var mı?**
Sayfa iskeleti derste verilen **Start Bootstrap "Simple Sidebar"** şablonundan geliyor. Aynı id'ler kullanılıyor: `#wrapper`, solda `#sidebar-wrapper`, sağda `#page-content-wrapper`, menüyü açıp kapatan `#sidebarToggle` düğmesi. Şablonun `scripts.js` kodu da `views/partials/alt.ejs`'in sonunda neredeyse aynen var: düğmeye basınca `body`'ye `sb-sidenav-toggled` sınıfı ekleniyor ve durum `localStorage`'a yazılıyor (`sb|sidebar-toggle`). Görünümü Spotify'ın web uygulamasına benzettim: siyah zemin üzerinde yuvarlak köşeli koyu paneller, solda menü ve "Listelerin", altta tam genişlikte oynatıcı.

**Hangi dosyalarda?**
`views/partials/ust.ejs` (sol menü + üst çubuk), `views/partials/alt.ejs` (oynatıcı + menü ve kaydırma scripti), `public/css/stil.css` (bütün görünüm). Bootstrap'in ızgarası (`row`, `col-lg-7`), yardımcı sınıfları (`d-flex`, `gap-2`) ve açılır menüsü (`dropdown`) de kullanılıyor.

**Sayfa nasıl tek ekran gibi duruyor, oynatıcı neden hiç kaybolmuyor?**
`body` bir CSS grid: üst satır menü + içerik, alt satır oynatıcı (`grid-template-rows: minmax(0, 1fr) auto`). Sayfanın kendisi kaymıyor (`overflow: hidden`), sadece sağdaki içerik paneli kayıyor (`#page-content-wrapper { overflow-y: auto }`). Bu yüzden menü ve oynatıcı hep yerinde.

**Menü küçülünce ne oluyor?**
Masaüstünde `sb-sidenav-toggled` sınıfı varken menünün genişliği 300px'ten 72px'e iniyor ve `.gizlenir` sınıflı yazılar saklanıyor, sadece ikonlar kalıyor. Telefonda (768px altı, `@media`) menü normalde ekranın solunda gizli (`transform: translateX(-100%)`), aynı sınıf gelince kayarak açılıyor. İçeriğe dokununca kapanıyor.

**Sol menüdeki "Listelerin" nereden geliyor?**
`middleware/locals.js` her istekte giriş yapan üyenin listelerini çekip `res.locals.menuListeler`'e koyuyor. `ust.ejs` bunları sıralıyor. Misafire bunun yerine "Üye ol" kutusu çıkıyor.

**Üstteki renkli bölümler nasıl yapılıyor?**
Albüm, şarkı, liste ve profil sayfalarının başındaki bölüm sayfanın `--renk` değerinden bir `linear-gradient` ile boyanıyor ve aşağıda panelin rengine kayboluyor. `margin-top: -64px` ile üst çubuğun arkasına kadar uzanıyor, üst çubuk şeffaf olduğu için renk en üstten başlıyor gibi görünüyor. Sayfa aşağı kayınca `alt.ejs`'teki küçük script üst çubuğa `dolu` sınıfı ekliyor ve çubuk aynı renkle doluyor.

**Kartlardaki çal düğmesi nasıl çıkıyor?**
`.kart-cal` normalde `opacity: 0` ve biraz aşağıda (`translateY(8px)`). `.kart:hover .kart-cal` olunca görünür olup yerine kayıyor. `transition` ile yumuşak geçiyor.

**Yazı tipi?**
Inter (`@fontsource-variable/inter` paketi). İnternetten değil, `index.js`'teki `/vendor/inter` statik yolundan, yani `node_modules`'tan geliyor, Bootstrap gibi.

---

## Olası zor sorular

**Derste MySQL kullandık, sen neden SQLite?**
Kurulum gerektirmediği için, proje her bilgisayarda `npm install` ve `npm start` ile çalışıyor. Sequelize kullandığımız için kodun geri kalanı veritabanından bağımsız. MySQL'e geçmek için `data/db.js`'te dersteki satırı yazmak ve `mysql2` paketini kurmak yeterli.

**`saveUninitialized: false` ne demek?**
Oturuma bir şey yazılmadıkça veritabanına kaydetme demek. Biz ziyaretçi sayacı için ilk istekte `sayildi` yazdığımız için her ziyaretçinin oturumu yine de oluşuyor.

**Sunucu yeniden başlarsa ne olur?**
Oturumlar veritabanında olduğu için kimsenin girişi düşmez. Sadece online sayısı ve dinleyici sayıları sıfırlanır, çünkü onlar hafızada.

**Müzikler telifli mi?**
Hayır. Örnek müzikler bu proje için bilgisayarda matematiksel olarak sentezlendi, kapaklar da basit SVG çizimleri.

**Projeyi geliştirmek isteseydin ne eklerdin?**
Kullanıcıları takip etme ve takip ettiklerinin incelemelerini görme, incelemeleri beğenme, şarkı düzenleme, şifremi unuttum, Socket.io ile anlık sayılar.
