# İlmek · el örgüsü pazarı

MYAZ470 İnternet ve Web Programlama dönem projesi.

**İlmek**, el örgüsü ürünlerin pazar yeri. Şişle ve tığla ören üyeler kendi mağazalarını açıp kazak, hırka, bere, atkı, bebek patiği, amigurumi gibi örgülerini ekler. Her ürünün **iplik türü** (yün, merinos, alpaka, pamuk...) ve **hazırlanma süresi** (kaç günde örüleceği) vardır. Ziyaretçiler **üye olmadan da** ürünleri sepete ekleyip ödeme yapabilir. Sepet tarayıcıda (localStorage) tutulur. Misafir ödemede adresini ve kart bilgilerini yazar; üyenin adresi ve telefonu hesabında kayıtlı olduğu için sadece kart bilgisini girer. Örgücü siparişi "hazırlanıyor → kargoda → teslim edildi" diye ilerletir. Ürünü teslim alan üye yorum ve puan yazabilir. Ödeme sahtedir (ders projesi): kart bilgileri kontrol edilir ama para çekilmez, kartın sadece son 4 hanesi kaydedilir.

**Dokümanlar:** [BACKEND.md](BACKEND.md), sunucu tarafını kod parçalarıyla adım adım anlatıyor. [SORU-CEVAP.md](SORU-CEVAP.md), sunumda sorulabilecek soruları ve cevaplarını içeriyor.

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
| Örgücü (yelek, boyunluk, tozluk) | `burak` | `123456` |
| Örgücü (tığ işi: dantel şal, battaniye, sepet, ev dekoru) | `gul` | `123456` |
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

Bere & Şapka · Atkı & Şal · Kazak & Hırka · Bebek Örgüleri · Amigurumi · Ev & Dekor · Çorap & Eldiven · Çanta & Aksesuar. Örnek verilerde her kategoride en az 20 ürün var (toplam 160 onaylı ürün). Ürün listeleri sayfa başına 24 ürün gösterir. Admin panelinden yeni kategori eklenebilir.

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

`test/test.mjs` misafir, alıcı, örgücü ve admin akışlarını uçtan uca dener: CSRF, XSS, slug, sıralama, fiyat ve iplik filtresi, arama, ürün ekleme ve onay, sepet ve ödeme (misafir ve üye, kart kontrolleri, fiyatın sunucudan alınması, sipariş sorgulama), stok, sipariş durumları, "sadece teslim alan yorum yazabilir" kuralı, favori, sayfalama, her kategoride en az 20 ürün, benzer ürünler, kategori yönetimi, büyük/küçük harfe duyarsız giriş (63 kontrol). Test yeni bir üye oluşturduğu için boş veritabanında çalıştırılmalı:

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

`public/img/urunler/` klasöründeki fotoğraflar [Unsplash](https://unsplash.com)'ten indirildi ve [Unsplash Lisansı](https://unsplash.com/license) ile kullanılıyor (ücretsiz, ticari kullanım dahil, izin gerekmez). İlk 38 fotoğraf 800x800, sonra eklenen 122 fotoğraf 600x600 piksel kare JPG olarak kırpıldı.

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
| `ponponlu_bere.jpg` | Chris Lorensson | https://unsplash.com/photos/woman-covering-her-face-with-knit-cap-zXdI8XO3ZBs |
| `tig_sapka.jpg` | la crafter | https://unsplash.com/photos/brown-textile-FQi7FgB6GRo |
| `bebek_bere.jpg` | kaushal mishra | https://unsplash.com/photos/baby-in-white-knit-cap-lying-on-white-textile-p76UivR30oo |
| `sac_bandi.jpg` | Yuliia Pakhomova | https://unsplash.com/photos/knitted-green-headband-with-a-twisted-knot-detail-dGezk2g_SQk |
| `panco.jpg` | Milada Vigerova | https://unsplash.com/photos/beige-crochet-poncho-with-fringe-p8Drpg_duLw |
| `yelek.jpg` | Laura Ohlman | https://unsplash.com/photos/a-close-up-of-a-knitted-sweater-with-a-ball-of-yarn-next-to-it-1wM8AxQPQuM |
| `terlik.jpg` | Stacy | https://unsplash.com/photos/cozy-pink-slippers-with-home-sweet-home-sign-AGr29lY9TMA |
| `motifli_battaniye.jpg` | Annie Spratt | https://unsplash.com/photos/kDT-gRJanKw |
| `bebek_battaniye.jpg` | Olivia Anne Snyder | https://unsplash.com/photos/newborn-baby-sleeping-peacefully-on-a-soft-blanket-LcJARfBVhW8 |
| `bebek_hirka.jpg` | David Utt | https://unsplash.com/photos/a-smiling-baby-holds-a-small-leaf-in-a-park-8bCFpXmPyUQ |
| `mantar.jpg` | Anya Chernykh | https://unsplash.com/photos/a-white-ball-of-yarn-with-a-red-mushroom-on-top-of-it-P5vgCstOdJM |
| `bebek_oyuncak.jpg` | Yousef Bagheri | https://unsplash.com/photos/orange-and-white-crochet-doll-HYiMr8Ep0aA |
| `ahtapot.jpg` | Lizzi Sassman | https://unsplash.com/photos/a-crocheted-stuffed-animal-sitting-on-top-of-a-table-eo7kcjkQVcI |
| `fil.jpg` | Stephanie Harvey | https://unsplash.com/photos/black-and-gray-elephant-plush-toy-on-brown-wooden-table-d916id9kurQ |
| `altlik.jpg` | Céline Druguet | https://unsplash.com/photos/a-cup-of-coffee-and-a-crocheted-coaster-next-to-an-open-book-egf6NVZUiMA |
| `sepet.jpg` | Ana Laura Palharini | https://unsplash.com/photos/a-close-up-of-a-woven-piece-of-cloth-UBuv8COUVg4 |
| `kirlent.jpg` | Lucas de Moura | https://unsplash.com/photos/a-brown-couch-with-two-pillows-on-it-b0kTwnDM1O0 |
| `plaj_canta.jpg` | mohadese marvi | https://unsplash.com/photos/red-knit-textile-on-brown-wooden-table-fxGgqbIGQlg |
| `anahtarlik.jpg` | Akshay Malik | https://unsplash.com/photos/brown-and-white-knitted-owl-on-brown-wooden-table-vG3NdHF6dAY |
| `renkli_atki.jpg` | Point Normal | https://unsplash.com/photos/a-crocheted-blanket-with-a-multicolored-design-2QhoX6bZ1rk |
| `dantel_sal.jpg` | Knit Pro | https://unsplash.com/photos/white-chopsticks-on-stainless-steel-bowl-0ZTjxgegQpk |
| `balikci_kazak.jpg` | Kateryna Hliznitsova | https://unsplash.com/photos/a-pile-of-sweaters-laying-on-top-of-each-other-tRknQ2W_0zQ |
| `tozluk.jpg` | Maria Kovalets | https://unsplash.com/photos/a-womans-feet-with-red-nail-polish-and-a-pair-of-socks-wlkGZ0gMBN4 |
| `bustiyer.jpg` | Chidera Faustina Okeke | https://unsplash.com/photos/smiling-woman-in-a-blue-top-leaning-on-a-tree-7rys7hWy9H0 |
| `mavi_kivrik_kenarli_bere.jpg` | Old Youth | https://unsplash.com/photos/a-blue-hat-sitting-on-top-of-a-rock-covered-in-lichen-20tmoT1sVi0 |
| `sari_ponponlu_bere.jpg` | Kerim Ayar | https://unsplash.com/photos/yellow-knit-bubble-cap-WWpJViNdatc |
| `yesil_balikci_beresi.jpg` | Jordan Whitfield | https://unsplash.com/photos/woman-wearing-green-knit-cap-and-blue-denim-jacket-Lprffwrv9cY |
| `turuncu_lastik_orgu_bere.jpg` | Iamninoslav | https://unsplash.com/photos/a-hand-holding-a-brown-hat-on-top-of-a-white-surface-03V5lIoIH0Q |
| `hardal_kalin_bere.jpg` | Norlond | https://unsplash.com/photos/white-knit-cap-on-yellow-textile-lP9OdpFyHFI |
| `bej_yumusak_bere.jpg` | Rainier Watch | https://unsplash.com/photos/a-knit-hat-on-a-table-lJ3ODl-WuDs |
| `melanj_mavi_bere.jpg` | Rainier Watch | https://unsplash.com/photos/a-hat-on-a-table-AHKaxRjLvKk |
| `krem_kivrik_bere.jpg` | Brandon Zacharias | https://unsplash.com/photos/a-woman-wearing-a-knitted-hat-in-the-snow--xOrRBn02XI |
| `buz_mavisi_bere.jpg` | laura adai | https://unsplash.com/photos/woman-in-blue-knit-cap-and-red-jacket-dPy_zYLfh94 |
| `cizgili_renkli_bere.jpg` | laura adai | https://unsplash.com/photos/woman-in-red-scarf-and-brown-knit-cap-eIcVfGTjFgI |
| `gri_lastik_orgu_bere.jpg` | Rainier Watch | https://unsplash.com/photos/a-knitted-hat-on-a-table-2MMaMLOECjA |
| `fusya_bere.jpg` | Diane Helentjaris | https://unsplash.com/photos/pink-knit-cap-a6FTTn_TZFo |
| `pembe_kis_beresi.jpg` | Naomi Goff | https://unsplash.com/photos/a-woman-with-long-hair-wearing-a-pink-hat-sVcmOmUS-8g |
| `pudra_pembe_bere.jpg` | Lucas van Oort | https://unsplash.com/photos/a-pink-knitted-hat-on-a-wooden-post-9HL22MWcP4E |
| `vizon_bere.jpg` | Ken Steele II | https://unsplash.com/photos/woman-in-white-and-brown-fur-coat-wearing-brown-knit-cap-siNs3HmkXvM |
| `gri_sac_orgulu_bere.jpg` | Genessa Panainte | https://unsplash.com/photos/selective-focus-photography-of-woman-with-poncho-GwDWN4bBzgg |
| `renkli_ponponlu_bere.jpg` | Markus Spiske | https://unsplash.com/photos/blue-and-red-bobble-hat-mTi3fmDzguQ |
| `kirmizi_uzun_atki.jpg` | Karen Cantú Q | https://unsplash.com/photos/person-holding-red-and-white-disposable-cup-uYF7pziBO8Y |
| `mavi_sac_orgulu_atki.jpg` | Anastassiya Karfik | https://unsplash.com/photos/a-person-holding-a-blue-and-white-striped-dress-8y84WsCpCog |
| `puskullu_cizgili_atki.jpg` | Susan Wilkinson | https://unsplash.com/photos/red-black-and-white-textile-pJ_x1KcqEyA |
| `bej_omuz_sali.jpg` | Lance Reis | https://unsplash.com/photos/a-woman-is-wearing-a-crocheted-shawl-Yk4o4-IxtvU |
| `renkli_cizgili_atki.jpg` | Compagnons | https://unsplash.com/photos/a-close-up-of-a-crocheted-blanket-with-many-colors-of-yarn-6yAMhY8l63w |
| `sari_tig_isi_atki.jpg` | Shelter | https://unsplash.com/photos/orange-knit-textile-on-white-wooden-table-g3-0bNJzf-M |
| `hardal_uzun_atki.jpg` | Benjamin Klaver | https://unsplash.com/photos/shallow-focus-photo-of-woman-in-white-sweater-UgJ4is2NvV4 |
| `desenli_ucgen_sal.jpg` | Roxann Shepard | https://unsplash.com/photos/woman-in-gray-cardigan-standing-on-green-grass-field-during-daytime-WVR-Hpd3Gkw |
| `kirmizi_dantel_sal.jpg` | Jeremy Mowery | https://unsplash.com/photos/detailed-red-knitted-lace-shawl-with-ombre-effect-EfjmXT8nYuk |
| `beyaz_dantel_sal.jpg` | Carlos Gonçalves | https://unsplash.com/photos/a-white-crocheted-doily-on-a-black-background-eBwvQTUR0nU |
| `fistik_yesili_boyunluk.jpg` | Maria Kovalets | https://unsplash.com/photos/a-woman-wearing-a-green-knitted-scarf-auoQ_QVad9E |
| `gri_boyunluk.jpg` | Maria Kovalets | https://unsplash.com/photos/a-woman-in-a-white-shirt-is-wearing-a-gray-scarf-0_7miTgVK3k |
| `turuncu_boyunluk.jpg` | Maria Kovalets | https://unsplash.com/photos/a-woman-in-a-white-shirt-is-wearing-a-red-scarf-y3XFvXRZgJc |
| `turkuaz_boyunluk.jpg` | Maria Kovalets | https://unsplash.com/photos/a-woman-wearing-a-green-knitted-scarf-Tf72lWciwzI |
| `pembe_yumusak_atki.jpg` | Jimmy Liu | https://unsplash.com/photos/young-girl-with-windswept-hair-smiles-brightly-outdoors-4ljRQYjMOPk |
| `beyaz_kabarik_kazak.jpg` | Valna Studio | https://unsplash.com/photos/person-wearing-grey-knit-sweater-mU88MlEFcoU |
| `kahverengi_orgu_kazak.jpg` | Yuliia Pakhomova | https://unsplash.com/photos/a-brown-knitted-sweater-hangs-on-a-white-hanger-g3AwbdZut70 |
| `kiremit_rengi_kazak.jpg` | Yuliia Pakhomova | https://unsplash.com/photos/a-knitted-rust-colored-sweater-with-loose-yarn-e9W-oPLQOp8 |
| `yesil_lastik_orgu_kazak.jpg` | Renata K. Needham | https://unsplash.com/photos/green-crocheted-fabric-with-a-ball-of-matching-yarn-c9HGlHTG8ik |
| `papatya_islemeli_kazak.jpg` | Liana S | https://unsplash.com/photos/green-sweater-with-white-daisy-pattern-AiF7muLqvX8 |
| `norvec_desenli_kazak.jpg` | la crafter | https://unsplash.com/photos/white-blue-and-gray-knit-textile-GUzkgot7LN8 |
| `koyu_yesil_erkek_kazagi.jpg` | David Suarez | https://unsplash.com/photos/woman-in-gray-sweater-standing-on-brown-wooden-dock-during-daytime-4a1nNlrS5ZI |
| `hardal_dugmeli_hirka.jpg` | Nadin Mario | https://unsplash.com/photos/woman-in-yellow-knit-cardigan-qFDf9mQK0uQ |
| `bej_uzun_hirka.jpg` | Priscilla Luna Riguera | https://unsplash.com/photos/a-pair-of-sunglasses-and-a-sweater-on-a-white-surface-PbzOBFz8Ulc |
| `tarcin_rengi_hirka.jpg` | Nina Elliott | https://unsplash.com/photos/a-smiling-woman-in-a-red-cardigan-by-the-ocean-7ZXwccnFcBg |
| `turuncu_bol_kazak.jpg` | v.arch illustrates | https://unsplash.com/photos/woman-wearing-an-orange-knitted-cardigan-and-blue-jeans-2pcgyjR-aAw |
| `beyaz_orgu_elbise.jpg` | Ihor Rapita | https://unsplash.com/photos/a-white-sweater-hanging-on-a-clothes-rack-m2chM9O-ZHs |
| `gri_balikci_yaka_kazak.jpg` | Mike Cox | https://unsplash.com/photos/a-woman-holding-a-cup-of-coffee-6zyz_80n7Sc |
| `granny_kare_hirka.jpg` | Shelter | https://unsplash.com/photos/a-crocheted-jacket-hanging-on-a-wall-next-to-a-potted-plant-dg0uHhW0Fd4 |
| `krem_bebek_takimi.jpg` | Kateryna Hliznitsova | https://unsplash.com/photos/a-close-up-of-a-baby-holding-a-stuffed-animal-tBoIoacIVeM |
| `ponponlu_bebek_beresi.jpg` | Olivia Anne Snyder | https://unsplash.com/photos/a-smiling-baby-sitting-on-a-pile-of-leaves-lujhhh483QE |
| `pudra_bebek_beresi.jpg` | Olivia Anne Snyder | https://unsplash.com/photos/a-baby-girl-sitting-in-a-pile-of-leaves-_DP38BK--B8 |
| `yesil_bebek_kazagi.jpg` | Nataliia Hordiiuk | https://unsplash.com/photos/a-baby-with-a-pacifier-0s1AxkUUOuk |
| `mavi_bebek_patigi.jpg` | Madhuri Mohite | https://unsplash.com/photos/red-and-white-polka-dot-flip-flops-on-white-textile-kWJm2a6DbAw |
| `kirmizi_bebek_patigi.jpg` | Janko Ferlič | https://unsplash.com/photos/pair-of-babys-pink-knit-shoes-on-bench-jjDqU0P0-SM |
| `turuncu_bebek_patigi.jpg` | Stefan Vibes | https://unsplash.com/photos/orange-crocheted-baby-booties-1ejZA3W2NUo |
| `tilki_bebek_patigi.jpg` | Alexander Mass | https://unsplash.com/photos/couples-hands-gently-hold-tiny-white-baby-booties-GUYl41FmPHw |
| `pembe_bebek_elbisesi.jpg` | Lucia Durdos | https://unsplash.com/photos/a-line-of-crocheted-clothes-hanging-on-a-clothes-line-LCG4kSIteMA |
| `kirmizi_ayicik_tulum.jpg` | Helena Lopes | https://unsplash.com/photos/baby-in-red-knit-cap-and-red-sweater-lying-on-green-textile-o36DEkDgOCk |
| `mavi_bebek_beresi.jpg` | Maria Kovalets | https://unsplash.com/photos/a-blue-knitted-hat-sitting-on-top-of-a-wooden-floor-S-zDTLq_rqc |
| `turuncu_bebek_beresi.jpg` | Maria Kovalets | https://unsplash.com/photos/an-orange-knitted-hat-with-a-pom-pom-91i-pLiqahg |
| `yenidogan_fotograf_seti.jpg` | Kelly Romano | https://unsplash.com/photos/baby-in-white-knit-cap-lying-on-blue-and-white-textile-cPGs8DTqac8 |
| `zikzak_bebek_battaniyesi.jpg` | Ashlee Marie | https://unsplash.com/photos/a-pink-and-white-crocheted-blanket-on-a-bed-mYBtnlepHSQ |
| `yildiz_bebek_battaniyesi.jpg` | Ashlee Marie | https://unsplash.com/photos/a-blue-and-white-crocheted-blanket-with-a-circular-design-DweYOm78-so |
| `minik_fare_amigurumi.jpg` | Daria Nepriakhina | https://unsplash.com/photos/white-and-gray-rabbit-plush-toy-xsYuIrLUxws |
| `bereli_tavsan.jpg` | Liana S | https://unsplash.com/photos/a-crocheted-bunny-wearing-a-hat-and-overalls-uZ_5Zg3iLYQ |
| `pembe_tavsan.jpg` | Orlando García | https://unsplash.com/photos/a-crochet-pink-bunny-peeks-through-the-table-K2bb8D1gQeU |
| `saksida_papatya.jpg` | Trương Tuyết Ly | https://unsplash.com/photos/a-crocheted-flower-in-a-pot-sits-on-a-book-ed6d9SnpcAQ |
| `turuncu_tisortlu_tavsan.jpg` | Mockup Graphics | https://unsplash.com/photos/white-and-yellow-rabbit-plush-toy-aUkYaG12Dgs |
| `noel_ayicigi.jpg` | Mockup Graphics | https://unsplash.com/photos/white-and-blue-bear-plush-toy-F-_5X92mH1Q |
| `atkili_ayicik.jpg` | Mockup Graphics | https://unsplash.com/photos/pink-bear-plush-toy-with-pink-scarf-PNsj6RiHAF4 |
| `kahverengi_oyuncak_ayi.jpg` | D W | https://unsplash.com/photos/brown-and-white-amigurumi-doll-Q4vWchoavUs |
| `penguen_ailesi.jpg` | Joachim Schnürle | https://unsplash.com/photos/five-colorful-crocheted-penguin-toys-stacked-on-a-table-F5UMrX9L26c |
| `orgu_kiz_ve_erkek_bebek.jpg` | Mavi Atlas | https://unsplash.com/photos/two-colorful-handmade-knitted-dolls-hanging-side-by-side-92bwSf5NecY |
| `krem_ayicik.jpg` | Moon Moons | https://unsplash.com/photos/a-crocheted-teddy-bear-sitting-next-to-a-cup-of-coffee-U7K4t9CgVU0 |
| `gokkusagi_ayicik.jpg` | Rahul Mishra | https://unsplash.com/photos/a-knitted-stuffed-animal-9uPoWLy71Qg |
| `ikiz_ayiciklar.jpg` | Michal Balog | https://unsplash.com/photos/brown-bear-and-pink-bird-plush-toys-on-wall-qnHkKbIw8Xk |
| `mavi_dinozor.jpg` | Allahverdi Israfilli | https://unsplash.com/photos/a-stuffed-animal-hanging-on-a-wooden-fence-LgfttbmGx5A |
| `dugme_gozlu_tavsan.jpg` | Peter Barrett Bryan | https://unsplash.com/photos/a-crocheted-bunny-with-black-button-eyes-Wjbf4lwL7Bc |
| `kalin_ilmek_battaniye.jpg` | Bearaby | https://unsplash.com/photos/a-bed-with-a-blanket-on-top-of-it-agb2CTvG3qs |
| `lacivert_kalin_battaniye.jpg` | Bearaby | https://unsplash.com/photos/a-pile-of-marshmallows-sitting-on-top-of-a-blanket-mfaIaLbj1ak |
| `kirmizi_kalin_battaniye.jpg` | Fujiphilm | https://unsplash.com/photos/a-large-monstera-plant-behind-an-orange-knitted-blanket-RjXpzpXoc4E |
| `renkli_kare_battaniye.jpg` | Bogdan Nesterenko | https://unsplash.com/photos/a-crocheted-blanket-is-laying-on-a-bed-Lt8LMbCauBo |
| `papatyali_battaniye.jpg` | Nicole Almendrada | https://unsplash.com/photos/crocheted-squares-with-yarn-and-hook-EdZMHCmKQZA |
| `mavi_granny_battaniye.jpg` | Kiy Turk | https://unsplash.com/photos/white-and-multicolored-textile-mbGZsV328Cg |
| `ananasli_yastik.jpg` | Jacqueline Liban | https://unsplash.com/photos/throw-pillow-on-chair-beside-plant-on-stand-3ugRoVpotNk |
| `yildiz_yastik.jpg` | Bilge Hatun Yurdagelen | https://unsplash.com/photos/pink-star-shaped-crochet-pillow-on-a-sofa-4jMmIWHkoXY |
| `sari_yuvarlak_minder.jpg` | Radu Prodan | https://unsplash.com/photos/a-yellow-chair-in-front-of-a-bookshelf-6ujZvVDgPS8 |
| `cicekli_kare_yastik.jpg` | Liana S | https://unsplash.com/photos/close-up-shot-of-a-colorful-crocheted-flower-pattern-LAaAdVDQA50 |
| `beyaz_orgu_sepet.jpg` | Olivier Bergeron | https://unsplash.com/photos/white-and-green-ceramic-bowl-80JQZdq6fFc |
| `kirmizi_mum_kilifi.jpg` | Eugene Kuznetsov | https://unsplash.com/photos/white-candle-on-red-round-textile-t3obHBr_YLI |
| `lacivert_saksi_kilifi.jpg` | Valquiria Caramalac | https://unsplash.com/photos/a-close-up-of-a-potted-plant-on-a-table-Yn7fBD-DAOY |
| `gri_sac_orgulu_corap.jpg` | Nynne Schrøder | https://unsplash.com/photos/gray-sock-on-white-textile-axt96zsVXL8 |
| `kirmizi_uzun_corap.jpg` | The Happy Toe | https://unsplash.com/photos/a-person-sitting-on-a-set-of-stairs-with-red-socks-D1OFwpugDzk |
| `norvec_desenli_corap.jpg` | Anna Evans | https://unsplash.com/photos/three-pairs-of-patterned-socks-laying-on-a-white-sheet-gDtnXXUrd9k |
| `renkli_corap_seti.jpg` | The Happy Toe | https://unsplash.com/photos/a-stack-of-three-socks-sitting-on-top-of-a-wooden-table-RFGrTK9oE3s |
| `lacivert_diz_alti_corap.jpg` | The Happy Toe | https://unsplash.com/photos/a-person-standing-on-a-set-of-stairs-wearing-socks-HeVcSiTLsVI |
| `gri_kalin_yun_corap.jpg` | Laura Ohlman | https://unsplash.com/photos/a-pair-of-knitted-socks-sitting-on-top-of-a-wooden-floor-yAzHPISQ1lw |
| `hardal_kalin_corap.jpg` | Åsmund Arup Seip | https://unsplash.com/photos/yellow-shoes-ffr3v3cXeoY |
| `mavi_turuncu_corap.jpg` | Jonathan Taylor | https://unsplash.com/photos/person-wearing-blue-denim-jeans-and-red-socks-_o7Skp6hgC4 |
| `kahve_cizgili_corap.jpg` | Yuliia Pakhomova | https://unsplash.com/photos/pair-of-knitted-socks-with-brown-and-white-pattern-iGF-0P1oxg4 |
| `ayicik_eldiven.jpg` | Valeriia Miller | https://unsplash.com/photos/brown-bear-knit-plush-toy-8PmRRwLxuBM |
| `desenli_kis_eldiveni.jpg` | Emily Underworld | https://unsplash.com/photos/a-pair-of-mittens-sitting-on-top-of-a-bed-YyaGU5JQiLY |
| `desenli_parmakli_eldiven.jpg` | Tamara Gak | https://unsplash.com/photos/person-in-white-and-black-knit-gloves-qLhOOuVHDtE |
| `beyaz_orgu_eldiven.jpg` | engin akyurt | https://unsplash.com/photos/persons-hand-with-white-background-O2moT-1rGIM |
| `kirmizi_eldiven.jpg` | Alla Hetman | https://unsplash.com/photos/a-pair-of-red-mittens-holding-a-bouquet-of-flowers-GpIy8BtGRYM |
| `gri_parmakli_eldiven.jpg` | Aren Nagulyan | https://unsplash.com/photos/a-person-wearing-a-pair-of-gray-gloves-DE1sePGb3pE |
| `kalpli_ev_terligi.jpg` | Simona Sergi | https://unsplash.com/photos/white-and-brown-heart-shaped-cookies-SKQ7ntsB9ko |
| `bej_orgu_omuz_cantasi.jpg` | Мария Волк | https://unsplash.com/photos/person-holding-brown-and-white-tote-bag-ieppoqQTIto |
| `pembe_orgu_canta.jpg` | Colton Sturgeon | https://unsplash.com/photos/a-pink-and-white-crocheted-bag-sitting-on-a-wooden-floor-uCLB3X5cpd0 |
| `mini_askili_canta.jpg` | Mavi Atlas | https://unsplash.com/photos/crocheted-bag-with-flowers-on-door-LQ5_lVRtjag |
| `hasir_plaj_cantasi.jpg` | ZEELOOL Glasses | https://unsplash.com/photos/sunglasses-and-vinyl-record-in-a-straw-bag-X-qUe3w9PuM |
| `beyaz_orgu_canta.jpg` | engin akyurt | https://unsplash.com/photos/person-holding-clear-handbag-in-dress-6_S-_HRaXkg |
| `renkli_sepet_canta.jpg` | Liana S | https://unsplash.com/photos/a-colorful-bag-filled-with-yarn-sits-on-snow-vjEVaBLaVng |
| `bordo_buzgulu_canta.jpg` | mohadese marvi | https://unsplash.com/photos/red-and-white-floral-textile-t5V3oe3KMgY |
| `renkli_telefon_cantasi.jpg` | Husam El Haq | https://unsplash.com/photos/assortment-of-colorful-handmade-bags-hanging-on-display-SM-HlwKg3Sw |
| `krem_yarim_ay_canta.jpg` | Andrijana Bozic | https://unsplash.com/photos/white-knit-round-textile-on-white-printer-paper-HIqBgqP6AA0 |
| `file_pazar_cantasi.jpg` | Carmen Nie | https://unsplash.com/photos/a-single-red-tomato-in-a-net-bag-WSlCDBqnQSE |
| `sari_file_canta.jpg` | Ksenia Kazak | https://unsplash.com/photos/a-person-holding-a-piece-of-food-Aut1eiuY-6U |
| `gokkusagi_canta.jpg` | Liana S | https://unsplash.com/photos/a-colorful-crochet-bag-with-bold-stripes-F87UroHL9Zs |
| `beyaz_file_canta.jpg` | Margaret Young | https://unsplash.com/photos/a-cream-colored-macrame-tote-bag-with-fringe-hanging-ddNtzPcgfr8 |
| `orgu_kalemlik.jpg` | Urja Bhatt | https://unsplash.com/photos/a-purse-with-a-phone-and-other-items-on-a-table-aGr9h2KHbRE |
| `pastel_mini_canta.jpg` | Joy Ru | https://unsplash.com/photos/a-miniature-purse-is-sitting-on-a-table-QKDemhgdwcQ |
| `cicekli_anahtarlik.jpg` | COPPERTIST WU | https://unsplash.com/photos/a-key-chain-with-a-white-flower-on-it-GvOCTRQ0IN0 |
| `bordo_orgu_sac_bandi.jpg` | Riccardo Vicidomini Varotto | https://unsplash.com/photos/woman-standing-behind-green-leafed-tre-aCj0dNnkgSc |
