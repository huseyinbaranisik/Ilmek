# İlmek · el örgüsü pazarı

MYAZ470 İnternet ve Web Programlama dönem projesi.

**İlmek**, el örgüsü ürünlerin pazar yeri. Şişle ve tığla ören üyeler kendi mağazalarını açıp kazak, hırka, bere, atkı, bebek patiği, amigurumi gibi örgülerini ekler. Her ürünün **iplik türü** (yün, merinos, alpaka, pamuk...) ve **hazırlanma süresi** (kaç günde örüleceği) vardır. Ziyaretçiler **üye olmadan da** ürünleri sepete ekleyip ödeme yapabilir. Sepet tarayıcıda (localStorage) tutulur. Misafir ödemede adresini ve kart bilgilerini yazar; üyenin adresi ve telefonu hesabında kayıtlı olduğu için sadece kart bilgisini girer. Örgücü siparişi "hazırlanıyor → kargoda → teslim edildi" diye ilerletir. Ürünü teslim alan üye yorum ve puan yazabilir. Ödeme sahtedir (ders projesi): kart bilgileri kontrol edilir ama para çekilmez, kartın sadece son 4 hanesi kaydedilir.

## Kurulum ve çalıştırma

Node.js 22 veya daha yeni bir sürüm gerekir.

```bash
npm install
npm start
```

Tarayıcıda: http://localhost:3000

| Hesap | Kullanıcı adı | Şifre |
|---|---|---|
| Yönetici | `admin` | `admin123` |
| Örgücü (kazak, hırka, bere, atkı) | `ayse` | `123456` |
| Örgücü (bebek örgüleri, battaniye) | `zeynep` | `123456` |
| Örgücü (amigurumi, tığ işi çiçek) | `mehmet` | `123456` |
| Örgücü (çorap, eldiven, şal, çanta) | `elif` | `123456` |
| Alıcı (adresi kayıtlı) | `can` | `123456` |

Ödeme sayfasında deneme için herhangi bir 16 haneli numara yazabilirsiniz, örneğin `4242 4242 4242 4242`, son kullanma `12/30`, CVV `123`.

İlk çalıştırmada `ilmek.db` veritabanı dosyası otomatik oluşur ve örnek veriler eklenir. Sıfırlamak için sunucuyu durdurup `ilmek.db` dosyasını silmeniz ve tekrar başlatmanız yeterli.

## Kullanıcı türleri

| Kim | Ne yapabilir |
|---|---|
| **Misafir** (giriş yapmamış) | Örgülere, kategorilere, örgücülere, yorumlara, galeriye ve duyurulara bakar. Arar, sıralar, fiyata ve iplik türüne göre süzer. **Sepete ekler ve satın alır** (adres + kart bilgilerini her seferinde yazar), siparişini "Sipariş sorgula" sayfasından görür. S.S.S.'e soru gönderir. |
| **Üye** | Hem alıcı hem örgücü. Satın alır (adresi ve telefonu kayıtlı, sadece kart bilgisi girer), favoriler, teslim aldığı ürüne yorum yazar. Kendi mağazasına ürün ekler (admin onayından sonra yayınlanır), gelen siparişleri kargoya verir. |
| **Admin** | Ürünleri onaylar ya da reddeder. Kategorileri, duyuruları, galeriyi, S.S.S.'i yönetir. Bütün siparişleri, kullanıcıları ve istatistikleri görür. |

## Kategoriler

Bere & Şapka · Atkı & Şal · Kazak & Hırka · Bebek Örgüleri · Amigurumi · Ev & Dekor · Çorap & Eldiven · Çanta & Aksesuar. Admin panelinden yenileri eklenebilir.

## Kullanılan teknolojiler (derste işlenenler)

| Teknoloji | Ne için |
|---|---|
| Node.js + Express | Sunucu, `express.Router()` ile route dosyaları |
| EJS | HTML şablonları, `include` ile ortak parçalar |
| Sequelize | Veritabanı modelleri ve ilişkiler (`hasMany`, `belongsTo`, `belongsToMany`) |
| SQLite (`sqlite3`) | Veritabanı. Derste MySQL kullanıldı, burada kurulum gerektirmediği için SQLite tercih edildi. Sequelize kodu aynı. |
| express-session + connect-session-sequelize | Oturumlar veritabanında saklanır |
| bcrypt | Şifre hash'leme |
| csurf | CSRF koruması |
| slugify | SEO dostu adresler (`locale: 'tr'`) |
| body-parser | Form verilerini okuma |
| multer | Ürün ve galeri resmi yükleme |
| Bootstrap 5 + Bootstrap Icons | Navbar (telefonda hamburger menü), açılır menü, ızgara, ikonlar |
| Yazı tipleri (`@fontsource`) | Fraunces (başlıklar), Caveat (el yazısı notlar), Inter (gövde). Hepsi `node_modules`'tan sunuluyor, internete gerek yok |

## Dosya yapısı (derste kullanılan MVC yapısı)

```
index.js              Uygulamanın girişi: middleware'ler, route'lar, ilişkiler, sunucu
data/db.js            Sequelize bağlantısı
models/               Tablolar: rol, kullanici, kategori, urun, siparis, yorum, duyuru, soru, galeri, sayac
models/dummy-data.js  Örnek veriler (veritabanı boşsa eklenir)
routes/               user.js (herkes), sepet.js (sepet, ödeme, sipariş sorgulama), auth.js (giriş/kayıt), hesap.js (üyeler), admin.js
controller/           Her route'un yaptığı iş
middleware/           config_Session, isAuth, isAdmin, csrf, locals (sayaçlar, ortak değişkenler)
helpers/              slugfield (slugify), yukle (multer), canli (online sayısı), puan (ortalama puan)
views/                EJS sayfaları (partials/ ortak parçalar, admin/, hesap/)
public/css/stil.css   Sıcak el işi teması
public/js/site.js     Sepet (localStorage), favori kalbi, nabız (online sayısı), adet x fiyat, resim önizleme
public/img            Bütün resimler: urunler/ (ürün ve galeri fotoğrafları), yuklenen/ (yüklenen resimler), logo.svg
test/test.mjs         Uçtan uca test (npm test)
```

## Resimler nerede?

Resimler veritabanına konmaz. Dosyanın kendisi `public/img/` klasöründe durur, veritabanına sadece adresi (URL) yazılır, örneğin `urun.resim = "/img/urunler/bere.jpg"`. Sayfa bu adresi `<img src="...">` içine koyar, Express de `express.static("public")` ile dosyayı o adresten sunar. Yüklenen resimler `public/img/yuklenen/` klasörüne kaydedilir ve veritabanına `/img/yuklenen/dosya-adi.jpg` adresi yazılır. Bu klasör `.gitignore` içinde, GitHub'a gönderilmez.

## Test

`test/test.mjs` misafir, alıcı, örgücü ve admin akışlarını uçtan uca dener: CSRF, XSS, slug, sıralama, fiyat ve iplik filtresi, arama, ürün ekleme ve onay, sepet ve ödeme (misafir ve üye, kart kontrolleri, fiyatın sunucudan alınması, sipariş sorgulama), stok, sipariş durumları, "sadece teslim alan yorum yazabilir" kuralı, favori, kategori yönetimi (57 kontrol). Test yeni bir üye oluşturduğu için boş veritabanında çalıştırılmalı:

```bash
# ilmek.db dosyasını silin, sonra:
npm start      # bir terminalde
npm test       # başka bir terminalde
```

## Proje kriterleri

| Kriter | Nerede |
|---|---|
| Site Map | `/site-haritasi` (ziyaretçiler için) ve `/sitemap.xml` (arama motorları için) |
| Ziyaretçi sayacı | Sayfanın altında (footer) ve admin panelinde. Her yeni oturum bir kez sayılır. |
| Online kullanıcı sayısı | Sayfanın altında (footer) ve admin panelinde. |
| Duyuru-Haber modülü | `/duyurular`, ana sayfadaki duyuru şeridi, admin panelinden ekleme ve silme |
| Resim galerisi | `/galeri` (atölyelerden kareler, polaroid görünüm), tıklayınca büyür. Admin panelinden resim yüklenir. |
| Admin paneli ve yetkilendirme | `/admin`. Misafir, üye ve admin olmak üzere 3 seviye (`isAuth`, `isAdmin`). |
| CSRF | `csurf` paketi. Bütün formlarda gizli `_csrf` alanı, fetch isteklerinde `x-csrf-token` başlığı. |
| Slugify | `/urun/sac-orgulu-kazak`, `/kategori/bere-ve-sapka`, `/duyuru/ilmek-acildi` |
| Soru-Cevap | `/sss`: ziyaretçi soru gönderir, admin cevaplayınca yayınlanır |

## Fotoğraf kaynakları

`public/img/urunler/` klasöründeki fotoğraflar [Unsplash](https://unsplash.com)'ten indirildi ve [Unsplash Lisansı](https://unsplash.com/license) ile kullanılıyor (ücretsiz, ticari kullanım dahil, izin gerekmez). 800x800 piksel kare JPG olarak kırpıldı.

| Dosya | Fotoğrafçı | Kaynak |
|---|---|---|
| `bere.jpg` | la crafter | https://unsplash.com/photos/y7NBxZuL-_w |
| `atki.jpg` | Susan Wilkinson | https://unsplash.com/photos/red-and-black-striped-textile-9dDJk8lvUwg |
| `kazak.jpg` | Tijana Drndarski | https://unsplash.com/photos/white-and-brown-knit-textile-Ds4TsdS095U |
| `hirka.jpg` | Andreas Eriksson | https://unsplash.com/photos/rose-knit-cardigan-with-white-yoke-detail-MvulYlZRyFI |
| `patik.jpg` | Elsa Lilja | https://unsplash.com/photos/white-bear-plush-toy-on-white-table-xlkuA0VQshU |
| `bebek.jpg` | Justin Simmonds | https://unsplash.com/photos/cozy-nursery-decor-with-shelves-and-a-sweater-J6H8G9jCXVc |
| `battaniye.jpg` | Sarah Claeys | https://unsplash.com/photos/brown-knit-textile-in-close-up-photography-lxw686JyMT8 |
| `ayicik.jpg` | Moon Moons | https://unsplash.com/photos/6bFNsRzla_c |
| `tavsan.jpg` | Hasnain Ayaz | https://unsplash.com/photos/crocheted-rabbit-with-orange-carrot-OAyiEB_jw2s |
| `cicek.jpg` | Jason Leung | https://unsplash.com/photos/a-vase-filled-with-blue-and-white-flowers-_1UY85AM1j8 |
| `corap.jpg` | Kate Laine | https://unsplash.com/photos/a-pair-of-socks-and-a-hat-on-a-wooden-table-xERcZRbf42E |
| `eldiven.jpg` | Ahmadreza Rezaie | https://unsplash.com/photos/cozy-knitted-mittens-and-mugs-on-snow-x5yedveMCbw |
| `sal.jpg` | Giulia Bertelli | https://unsplash.com/photos/a-knitted-teddy-bear-laying-on-top-of-a-blanket-7j737kkSoBs |
| `canta.jpg` | Anna Tukhfatullina | https://unsplash.com/photos/brown-knit-handbag-PF-PYpnA0JM |
| `yastik.jpg` | la crafter | https://unsplash.com/photos/white-and-brown-knit-textile-0-i_R_vSpOI |
| `yumak.jpg` | Margarida Afonso | https://unsplash.com/photos/orange-blue-and-white-yarn-ahMCpXdUjv0 |
| `ip_rafi.jpg` | Paul Hanaoka | https://unsplash.com/photos/assorted-color-textiles-4nabmlliGdU |
| `orgu_eller.jpg` | Tanaphong Toochinda | https://unsplash.com/photos/a-woman-is-knitting-a-piece-of-fabric-WddCult7llk |
