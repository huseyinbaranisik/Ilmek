# Gramofy · müzik dinle, puanla, listele

MYAZ470 İnternet ve Web Programlama dönem projesi.
Spotify ile Letterboxd'un karışımı bir müzik sitesi. Şarkıları dinlerken ortasında albüm kapağı olan bir plak döner ve o an kaç kişinin dinlediği canlı görünür (Spotify kısmı). **Kitaplık** sayfasında şarkılar rafta duran plak kılıfları gibi dizilir: üzerine gelince kılıf öne çıkar ve plak kılıftan kayar, tıklayınca çalar. Üyeler şarkılara 1-5 yıldız verir, inceleme yazar, liste oluşturur ve kendi şarkılarını yükler (Letterboxd kısmı). Şarkıları kalple "Beğenilen Şarkılar"a ekler, birbirlerini takip eder, **Üyeler** sayfasından başkalarının profillerine, listelerine ve beğendiği şarkılara bakar. Oynatıcıda karıştır ve tekrarla var. Site telefon, tablet ve bilgisayarda düzgün görünür.

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
| Örnek üye | `deniz` | `123456` |
| Örnek üye | `ece` | `123456` |

İlk çalıştırmada `plak.db` veritabanı dosyası otomatik oluşur ve örnek veriler eklenir. Sıfırlamak için sunucuyu durdurup `plak.db` dosyasını silmeniz ve tekrar başlatmanız yeterli.

## Kullanıcı türleri

| Kim | Ne yapabilir |
|---|---|
| **Misafir** (giriş yapmamış) | Bütün şarkıları dinler. Albümleri, listeleri, incelemeleri, üyeleri, profilleri, beğenilen şarkıları, galeriyi ve duyuruları görür. S.S.S.'e soru gönderir. |
| **Üye** | Misafirin yapabildiklerine ek olarak şarkılara puan verir, inceleme yazar, liste oluşturur, şarkı beğenir, diğer üyeleri takip eder ve şarkı yükler. Yüklediği şarkı admin onayından sonra yayınlanır. |
| **Admin** | Üyenin yapabildiklerine ek olarak yüklenen şarkıları onaylar ya da reddeder. Şarkıları, duyuruları, galeriyi, S.S.S.'i ve incelemeleri yönetir. Yüklediği şarkı hemen yayınlanır. |

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
| multer | Şarkı, kapak ve galeri resmi yükleme |
| Bootstrap 5 + Bootstrap Icons | Izgara, açılır menü ve ikonlar |
| Start Bootstrap "Simple Sidebar" | Sayfa iskeleti (sol menü + içerik). Spotify'ın uygulama görünümüne uyarlandı. |
| Inter yazı tipi (`@fontsource-variable/inter`) | Yazı tipi, `node_modules`'tan sunuluyor |

## Dosya yapısı (derste kullanılan MVC yapısı)

```
index.js              Uygulamanın girişi: middleware'ler, route'lar, ilişkiler, sunucu
data/db.js            Sequelize bağlantısı
models/               Tablolar: rol, kullanici, sarki, inceleme, liste, duyuru, soru, galeri, sayac
models/dummy-data.js  Örnek veriler (veritabanı boşsa eklenir)
routes/               user.js (herkes), auth.js (giriş/kayıt), hesap.js (üyeler), admin.js
controller/           Her route'un yaptığı iş
middleware/           config_Session, isAuth, isAdmin, csrf, locals (sayaçlar)
helpers/              slugfield (slugify), yukle (multer), canli (online sayısı), puan (ortalama)
views/                EJS sayfaları (partials/ ortak parçalar, admin/, hesap/)
public/css, js        stil.css (Spotify tarzı koyu tema, dönen plak, kitaplık), oynatici.js (alttaki müzik çalar)
public/img            Bütün resimler: kapaklar/ (örnek albüm kapakları), yuklenen/ (yüklenen kapak ve galeri resimleri), bos.svg, favicon.svg
public/muzik          Örnek müzikler, yuklenen/ (üyelerin yüklediği müzikler)
```

## Proje kriterleri

| Kriter | Nerede |
|---|---|
| Site Map | `/site-haritasi` (üye profilleri dahil) (ziyaretçiler için) ve `/sitemap.xml` (arama motorları için) |
| Ziyaretçi sayacı | Sol menünün altında ve admin panelinde. Her yeni oturum bir kez sayılır. |
| Online kullanıcı sayısı | Sol menünün altında. Ayrıca her şarkının yanında "şu an kaç kişi dinliyor" sayısı var. |
| Duyuru-Haber modülü | `/duyurular`, ana sayfadaki duyuru şeridi, admin panelinden ekleme ve silme |
| Resim galerisi | `/galeri`, tıklayınca büyür. Admin panelinden resim yüklenir. |
| Admin paneli ve yetkilendirme | `/admin`. Misafir, üye ve admin olmak üzere 3 seviye (`isAuth`, `isAdmin`). |
| CSRF | `csurf` paketi. Bütün formlarda gizli `_csrf` alanı. |
| Slugify | `/sarki/sessiz-sokaklar`, `/album/gece-yarisi`, `/liste/sabah-enerjisi`, `/duyuru/gramofy-yayinda` |
| Soru-Cevap | `/sss`: ziyaretçi soru gönderir, admin cevaplayınca yayınlanır |

## Müzikler hakkında

`public/muzik/` klasöründeki müzikler bu proje için bilgisayarda sentezlenerek üretildi, telif hakkı yoktur. Kendi mp3, wav veya ogg dosyalarınızı "Şarkı yükle" sayfasından yükleyebilirsiniz. Telifli şarkı yükleyecekseniz bunları GitHub'a göndermeyin. `public/img/yuklenen/` ve `public/muzik/yuklenen/` klasörleri zaten `.gitignore` içinde.


