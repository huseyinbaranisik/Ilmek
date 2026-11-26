# İlmek · el emeği pazarı

MYAZ470 İnternet ve Web Programlama dönem projesi.

**İlmek**, el yapımı ürünlerin pazar yeri. Örgü, takı, seramik, ahşap, mum ve sabun yapan üyeler kendi mağazalarını açıp ürün ekler. Diğer üyeler ürünleri favorilerine ekler, mağazaları takip eder ve sipariş talebi gönderir. Satıcı talebi onaylayıp durumu "hazırlanıyor → kargoda → teslim edildi" diye ilerletir. Ürünü teslim alan alıcı yorum ve puan yazabilir. Gerçek ödeme yoktur.

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
| Satıcı (örgü) | `ayse` | `123456` |
| Satıcı (seramik, mum) | `zeynep` | `123456` |
| Satıcı (ahşap) | `mehmet` | `123456` |
| Satıcı (takı, çanta) | `elif` | `123456` |
| Alıcı | `can` | `123456` |

İlk çalıştırmada `ilmek.db` veritabanı dosyası otomatik oluşur ve örnek veriler eklenir. Sıfırlamak için sunucuyu durdurup `ilmek.db` dosyasını silmeniz ve tekrar başlatmanız yeterli.

## Kullanıcı türleri

| Kim | Ne yapabilir |
|---|---|
| **Misafir** (giriş yapmamış) | Ürünlere, kategorilere, mağazalara, yorumlara, galeriye ve duyurulara bakar. Arar, sıralar, fiyata göre süzer. S.S.S.'e soru gönderir. |
| **Üye** | Hem alıcı hem satıcı. Sipariş talebi gönderir ve iptal eder, favoriler, mağaza takip eder, teslim aldığı ürüne yorum yazar. Kendi mağazasına ürün ekler (admin onayından sonra yayınlanır), gelen siparişleri onaylar ve durumunu ilerletir. |
| **Admin** | Ürünleri onaylar ya da reddeder. Kategorileri, duyuruları, galeriyi, S.S.S.'i yönetir. Bütün siparişleri, kullanıcıları ve istatistikleri görür. |

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
routes/               user.js (herkes), auth.js (giriş/kayıt), hesap.js (üyeler), admin.js
controller/           Her route'un yaptığı iş
middleware/           config_Session, isAuth, isAdmin, csrf, locals (sayaçlar, ortak değişkenler)
helpers/              slugfield (slugify), yukle (multer), canli (online sayısı), puan (ortalama puan)
views/                EJS sayfaları (partials/ ortak parçalar, admin/, hesap/)
public/css/stil.css   Sıcak el işi teması
public/js/site.js     Favori kalbi, nabız (online sayısı), adet x fiyat, resim önizleme
public/img            Bütün resimler: urunler/ (örnek ürün resimleri), yuklenen/ (yüklenen resimler), logo.svg
test/test.mjs         Uçtan uca test (npm test)
```

## Resimler nerede?

Resimler veritabanına konmaz. Dosyanın kendisi `public/img/` klasöründe durur, veritabanına sadece adresi (URL) yazılır, örneğin `urun.resim = "/img/urunler/bere.svg"`. Sayfa bu adresi `<img src="...">` içine koyar, Express de `express.static("public")` ile dosyayı o adresten sunar. Yüklenen resimler `public/img/yuklenen/` klasörüne kaydedilir ve veritabanına `/img/yuklenen/dosya-adi.jpg` adresi yazılır. Bu klasör `.gitignore` içinde, GitHub'a gönderilmez.

## Test

`test/test.mjs` misafir, alıcı, satıcı ve admin akışlarını uçtan uca dener: CSRF, XSS, slug, sıralama ve fiyat filtresi, ürün ekleme ve onay, sipariş durumları ve stok, "sadece teslim alan yorum yazabilir" kuralı, favori, takip, kategori yönetimi (43 kontrol). Test yeni bir üye oluşturduğu için boş veritabanında çalıştırılmalı:

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
| Online kullanıcı sayısı | Sayfanın altında. Ayrıca ürün sayfasında "şu an kaç kişi bu ürüne bakıyor". |
| Duyuru-Haber modülü | `/duyurular`, ana sayfadaki duyuru şeridi, admin panelinden ekleme ve silme |
| Resim galerisi | `/galeri` ("atölyelerden kareler"), tıklayınca büyür. Admin panelinden resim yüklenir. |
| Admin paneli ve yetkilendirme | `/admin`. Misafir, üye ve admin olmak üzere 3 seviye (`isAuth`, `isAdmin`). |
| CSRF | `csurf` paketi. Bütün formlarda gizli `_csrf` alanı, fetch isteklerinde `x-csrf-token` başlığı. |
| Slugify | `/urun/el-orgusu-bere`, `/kategori/mum-sabun`, `/duyuru/ilmek-acildi` |
| Soru-Cevap | `/sss`: ziyaretçi soru gönderir, admin cevaplayınca yayınlanır |

## Örnek resimler

`public/img/urunler/` klasöründeki ürün resimleri bu proje için çizilmiş basit SVG illüstrasyonlardır, telif hakkı yoktur.
