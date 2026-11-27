// ============================================================
//  test/test.mjs - Uçtan uca test (misafir, üye, satıcı, admin akışları; sepet ve ödeme dahil)
//  Kullanım: 1) ilmek.db'yi silip sunucuyu başlat (npm start)  2) başka terminalde: npm test
//  Test "testuye" adında yeni bir üye oluşturduğu için her seferinde boş veritabanında çalıştırılmalı.
//  Node'un kendi fetch fonksiyonuyla siteyi gerçek bir kullanıcı gibi gezer, sonucu kontrol eder.
// ============================================================
const B = process.env.ADRES || 'http://localhost:3000';
let hataSayisi = 0;

// Kendi çerezini (oturumunu) tutan küçük bir tarayıcı
function istemci() {
  let cerez = '';
  async function istek(yol, opt = {}) {
    const r = await fetch(B + yol, { redirect: 'manual', ...opt, headers: { ...(opt.headers || {}), cookie: cerez } });
    const sc = r.headers.getSetCookie();
    if (sc.length) cerez = sc.map(c => c.split(';')[0]).join('; ');
    return { durum: r.status, yer: r.headers.get('location') || '', metin: await r.text() };
  }
  async function token(yol = '/') { return (await istek(yol)).metin.match(/name="csrf-token" content="([^"]+)"/)[1]; }
  async function form(yol, veri, tk) {
    return istek(yol, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: tk, ...veri }) });
  }
  async function json(yol, tk) { const r = await istek(yol, { method: 'POST', headers: { 'x-csrf-token': tk } }); return JSON.parse(r.metin); }
  async function giris(ad, sifre) { const tk = await token('/auth/giris'); return form('/auth/giris', { kullaniciAdi: ad, sifre }, tk); }
  return { istek, token, form, json, giris };
}
const sonuc = (ad, ok, ek = '') => { if (!ok) hataSayisi++; console.log((ok ? 'OK  ' : 'HATA') + ' ' + ad + ' ' + ek); };
const urunId = async (c, slug) => (await c.istek('/urun/' + slug)).metin.match(/data-urun="(\d+)"/)[1];
// 1x1 piksellik PNG resim (ürün resmi yükleme testi için)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

// ================= MİSAFİR =================
const m = istemci();
let tk = await m.token();
let r = await m.istek('/hesap/urunlerim');
sonuc('misafir hesap sayfasına giremez -> girişe', r.durum === 302 && r.yer.startsWith('/auth/giris'), r.yer);
r = await m.form('/sss', { soru: 'Yanlış anahtarla soru' }, 'yanlis');
sonuc('yanlış CSRF -> 403', r.durum === 403);
r = await m.istek('/sss', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'soru=anahtarsiz+soru' });
sonuc('CSRF yok -> 403', r.durum === 403);
sonuc('onaysız ürün misafire görünmez (404)', (await m.istek('/urun/orgu-yastik-kilifi')).durum === 404);
let sayfa = (await m.istek('/kategori/bere-ve-sapka')).metin;
sonuc('kategori sayfası (slug, & -> ve)', sayfa.includes('/urun/el-orgusu-bere') && !sayfa.includes('/urun/bebek-patigi'));
// Sayfadaki kartların fiyatlarını sırayla al ("1.250 ₺" -> 1250)
const fiyatlar = (html) => [...html.matchAll(/class="fiyat">([\d.]+) ₺/g)].map(x => Number(x[1].replace(/\./g, '')));
sayfa = (await m.istek('/urunler?sirala=ucuz')).metin;
let f = fiyatlar(sayfa);
sonuc('sıralama: en ucuz önce', f.length > 0 && f.every((x, i) => i === 0 || f[i - 1] <= x), f.slice(0, 5).join(','));
sayfa = (await m.istek('/urunler?min=1000')).metin;
f = fiyatlar(sayfa);
sonuc('fiyat filtresi (en az 1000)', f.length > 0 && f.every(x => x >= 1000) && !sayfa.includes('/urun/bebek-patigi'));
// Sayfalama: 24'er ürün, 2. sayfa farklı ürünler, son sayfadan sonrası boş
const kartlar = (html) => [...html.matchAll(/<a href="(\/urun\/[^"]+)" class="urun-ad"/g)].map(x => x[1]);
const s1 = kartlar((await m.istek('/urunler')).metin);
sayfa = (await m.istek('/urunler?sayfa=2')).metin;
const s2 = kartlar(sayfa);
sonuc('sayfalama: sayfa başına 24 ürün, 2. sayfa farklı', s1.length === 24 && s2.length === 24 && !s2.some(x => s1.includes(x)) && sayfa.includes('class="sayfalama"'));
sonuc('sayfalama: olmayan sayfa boş liste', kartlar((await m.istek('/urunler?sayfa=99')).metin).length === 0);
// Her kategoride en az 20 ürün var (toplam yazısından okunur)
let azKategori = [];
for (const k of ['bere-ve-sapka', 'atki-ve-sal', 'kazak-ve-hirka', 'bebek-orguleri', 'amigurumi', 'ev-ve-dekor', 'corap-ve-eldiven', 'canta-ve-aksesuar']) {
  const adet = Number(((await m.istek('/kategori/' + k)).metin.match(/(\d+) el örgüsü ürün/) || [0, 0])[1]);
  if (adet < 20) azKategori.push(k + ':' + adet);
}
sonuc('her kategoride en az 20 ürün', azKategori.length === 0, azKategori.join(' '));
sayfa = (await m.istek('/urunler?iplik=Alpaka')).metin;
sonuc('iplik filtresi (Alpaka)', sayfa.includes('/urun/pembe-motifli-hirka') && !sayfa.includes('/urun/el-orgusu-bere'));
sonuc('arama ürün buluyor', (await m.istek('/?q=pati')).metin.includes('/urun/bebek-patigi'));
sonuc('arama iplik türünü buluyor', (await m.istek('/?q=merinos')).metin.includes('/urun/sac-orgulu-kazak'));
sonuc('arama örgücü buluyor', (await m.istek('/?q=Minik')).metin.includes('/magaza/zeynep'));
sayfa = (await m.istek('/urun/sac-orgulu-kazak')).metin;
sonuc('ürün sayfasında iplik ve hazırlanma süresi', sayfa.includes('Merinos') && sayfa.includes('12 günde örülür'));
sayfa = (await m.istek('/sitemap.xml')).metin;
sonuc('sitemap.xml', sayfa.includes('/urun/el-orgusu-bere') && sayfa.includes('/magaza/ayse') && sayfa.includes('/kategori/bebek-orguleri'));
// Benzer ürünler: aynı kategoriden, ürünün kendisi ve "mağazasından" bölümündekiler tekrar etmez
sayfa = (await m.istek('/urun/amigurumi-tavsan')).metin;
const [ustKisim, benzerKismi = ''] = sayfa.split('Benzer ürünler');
const magazaKismi = kartlar(ustKisim.split('mağazasından')[1] || '');
const benzerler = kartlar(benzerKismi);
const amigurumiler = kartlar((await m.istek('/kategori/amigurumi')).metin);
sonuc('benzer ürünler aynı kategoriden, tekrar yok',
  benzerler.length === 8 && benzerler.every(x => amigurumiler.includes(x)) && !benzerler.includes('/urun/amigurumi-tavsan') && !benzerler.some(x => magazaKismi.includes(x)),
  benzerler.length + ' benzer');

// Giriş: kullanıcı adında büyük harf ve boşluk sorun olmamalı (telefon klavyesi "Can " yazabilir)
r = await istemci().giris(' Can ', '123456');
sonuc('girişte büyük/küçük harf ve boşluk önemsiz', r.durum === 302 && r.yer === '/', r.yer);
r = await istemci().giris('Can', 'yanlis99');
sonuc('yanlış şifreyle giriş olmuyor', r.durum === 200 && r.metin.includes('hatalı'));

// ================= YENİ ÜYE (alıcı + satıcı) =================
const u = istemci();
tk = await u.token('/auth/kayit');
r = await u.form('/auth/kayit', { kullaniciAdi: 'testuye', sifre: 'abcdef' }, tk);
sonuc('kayıt', r.durum === 302 && r.yer === '/', r.yer);

// Ürün ekleme: resimli form (multipart), CSRF anahtarı adreste
tk = await u.token('/hesap/urun/yeni');
const kategoriId = (await u.istek('/hesap/urun/yeni')).metin.match(/<option value="(\d+)"/)[1];
const fd = new FormData();
fd.append('baslik', 'Test Bere <script>alert(1)</script>'); fd.append('fiyat', '150'); fd.append('stok', '4');
fd.append('kategoriId', kategoriId); fd.append('aciklama', 'deneme'); fd.append('iplik', 'Moher'); fd.append('hazirlikGunu', '6');
fd.append('resim', new Blob([PNG], { type: 'image/png' }), 'resim.png');
r = await u.istek('/hesap/urun/yeni?_csrf=' + encodeURIComponent(tk), { method: 'POST', body: fd });
sonuc('ürün eklendi -> ürünlerim', r.durum === 302 && r.yer === '/hesap/urunlerim', r.yer);
sayfa = (await u.istek('/hesap/urunlerim')).metin;
sonuc('ürünlerimde "Onay bekliyor"', sayfa.includes('Onay bekliyor'));
sonuc('XSS kaçırıldı', sayfa.includes('&lt;script&gt;') && !sayfa.includes('<script>alert'));
const yeniSlug = sayfa.match(/href="\/urun\/(test-bere[^"]*)"/)[1];
sonuc('yüklenen resim /img/yuklenen/ adresinde', /\/img\/yuklenen\/\d+-\d+\.png/.test(sayfa));
sonuc('onaysız ürün misafire görünmez', (await m.istek('/urun/' + yeniSlug)).durum === 404);

// ================= SEPET VE ÖDEME =================
const patikId = Number(await urunId(m, 'bebek-patigi'));      // Minik İlmek (zeynep), 220 ₺, stok 8
const corapId = Number(await urunId(m, 'cizgili-yun-corap')); // Elif Örgü Evi, 240 ₺
const kart = { kartSahibi: 'TEST KART', kartNo: '4242 4242 4242 4242', sonKullanma: '12/30', cvv: '123' };
const adresBilgisi = { adSoyad: 'Misafir Alıcı', telefon: '0555 111 22 33', eposta: 'misafir@test.com', adres: 'Deneme Mah. Test Sok. No:5 Ankara' };
const sepetYaz = liste => JSON.stringify(liste);

let j = JSON.parse((await m.istek('/api/sepet?idler=' + patikId + ',' + corapId)).metin);
sonuc('sepet API ürün bilgilerini veriyor', j.length === 2 && j.some(x => x.fiyat === 220));

// Misafir: hatalı bilgiler
tk = await m.token('/odeme');
r = await m.form('/odeme', { sepet: sepetYaz([{ id: patikId, adet: 1 }]), ...adresBilgisi, ...kart, kartNo: '1234' }, tk);
sonuc('hatalı kart numarası reddedildi', r.durum === 200 && r.metin.includes('16 haneli'));
r = await m.form('/odeme', { sepet: sepetYaz([{ id: patikId, adet: 1 }]), ...adresBilgisi, ...kart, sonKullanma: '01/20' }, tk);
sonuc('süresi geçmiş kart reddedildi', r.metin.includes('son kullanma tarihi geçmiş'));
r = await m.form('/odeme', { sepet: sepetYaz([{ id: patikId, adet: 999 }]), ...adresBilgisi, ...kart }, tk);
sonuc('stoktan fazla adet reddedildi', r.metin.includes('stokta sadece'));
r = await m.form('/odeme', { sepet: '[]', ...adresBilgisi, ...kart }, tk);
sonuc('boş sepet reddedildi', r.metin.includes('Sepetiniz boş'));
r = await m.form('/odeme', { sepet: sepetYaz([{ id: patikId, adet: 1 }]), ...kart }, tk);
sonuc('misafir adres yazmadan ödeyemez', r.metin.includes('Ad soyad yazın') && r.metin.includes('Teslimat adresini'));

// Misafir: başarılı ödeme. Tarayıcıdan "fiyat: 1" gönderilse bile fiyat veritabanından alınır.
r = await m.form('/odeme', { sepet: sepetYaz([{ id: patikId, adet: 2, fiyat: 1 }, { id: corapId, adet: 1 }]), ...adresBilgisi, ...kart, aliciNotu: 'Mavi olsun' }, tk);
sonuc('misafir ödemesi -> sipariş sayfası', r.durum === 302 && r.yer.startsWith('/siparis/IL-'), r.yer);
const misafirNo = r.yer.split('/')[2].split('?')[0];
sayfa = (await m.istek(r.yer)).metin;
sonuc('teşekkür sayfası, toplam veritabanı fiyatıyla (2x220 + 240 = 680)', sayfa.includes('Teşekkürler') && sayfa.includes('680 ₺'));
sonuc('kartın sadece son 4 hanesi görünüyor', sayfa.includes('**** 4242') && !sayfa.includes('4242 4242 4242 4242'));
const baska = istemci();
sonuc('başkası sipariş sayfasını göremez (404)', (await baska.istek('/siparis/' + misafirNo)).durum === 404);
r = await baska.istek('/siparis-sorgula?no=' + misafirNo + '&eposta=yanlis@test.com');
sonuc('sorgulama: yanlış e-posta reddedildi', r.metin.includes('bulunamadı'));
r = await baska.istek('/siparis-sorgula?no=' + misafirNo + '&eposta=misafir@test.com');
sonuc('sorgulama: numara + e-posta doğru -> sipariş', r.durum === 302 && (await baska.istek(r.yer)).metin.includes('Misafir Alıcı'));

// Üye: ilk alışverişte adres sorulur ve hesabına kaydedilir, sonra sadece kart bilgisi
tk = await u.token('/odeme');
sonuc('üye ilk alışverişte adres formunu görüyor', (await u.istek('/odeme')).metin.includes('name="adres"'));
r = await u.form('/odeme', { sepet: sepetYaz([{ id: patikId, adet: 1 }]), adSoyad: 'Test Üye', telefon: '05001112233', eposta: 'uye@test.com', adres: 'Üye Mah. Test Sok. No:9 Ankara', ...kart }, tk);
sonuc('üye ödemesi', r.yer.startsWith('/siparis/IL-'), r.yer);
const uyeNo = r.yer.split('/')[2].split('?')[0];
sayfa = (await u.istek('/odeme')).metin;
sonuc('ikinci alışverişte adres sorulmuyor (hesapta kayıtlı)', !sayfa.includes('name="adres"') && sayfa.includes('Üye Mah. Test Sok.'));
r = await u.form('/odeme', { sepet: sepetYaz([{ id: corapId, adet: 1 }]), ...kart }, tk);
sonuc('üye sadece kart bilgisiyle ödeyebiliyor', r.yer.startsWith('/siparis/IL-'), r.yer);
sayfa = (await u.istek('/hesap/siparislerim')).metin;
sonuc('siparişlerimde "Hazırlanıyor"', sayfa.includes(uyeNo) && sayfa.includes('Hazırlanıyor'));
r = await u.form('/hesap/yorum/' + patikId, { puan: 5, metin: 'erken yorum' }, tk);
sonuc('teslim almadan yorum yazılamaz', (await u.istek(r.yer)).metin.includes('Sadece teslim aldığınız'));

// Favori
j = await u.json('/hesap/favori/' + patikId, tk);
sonuc('favoriye ekle (JSON)', j.favori === true);
sonuc('favorilerimde görünüyor', (await u.istek('/hesap/favorilerim')).metin.includes('/urun/bebek-patigi'));
j = await u.json('/hesap/favori/' + patikId, tk);
sonuc('tekrar basınca favoriden çıkar', j.favori === false);
r = await m.istek('/hesap/favori/' + patikId, { method: 'POST', headers: { 'x-csrf-token': await m.token() } });
sonuc('misafir favorileyemez -> girişe', r.durum === 302 && r.yer.startsWith('/auth/giris'));
sonuc('üye admin paneline giremez (403)', (await u.istek('/admin')).durum === 403);

// ================= SATICI (zeynep) =================
const z = istemci();
await z.giris('zeynep', '123456');
sayfa = (await z.istek('/hesap/gelen-siparisler')).metin;
sonuc('satıcıya üye ve misafir siparişi geldi', sayfa.includes('Test Üye') && sayfa.includes('Misafir Alıcı') && sayfa.includes('Mavi olsun'));
sonuc('ödemeyle stoktan düştü (8 - 2 - 1 = 5)', (await z.istek('/urun/bebek-patigi')).metin.includes('Stok: <b>5</b>'));
// Üyenin siparişi en yeni, sayfada ilk sırada
const siparisId = sayfa.match(/\/hesap\/siparis\/(\d+)\/durum/)[1];
tk = await z.token('/hesap/gelen-siparisler');
r = await z.form('/hesap/siparis/' + siparisId + '/durum', { durum: 'teslim' }, tk);
sonuc('yanlış durum geçişi reddedildi', (await z.istek(r.yer)).metin.includes('geçirilemez'));
r = await u.form('/hesap/siparis/' + siparisId + '/durum', { durum: 'kargoda' }, await u.token());
sonuc('başkasının siparişini değiştiremez (404)', r.durum === 404);
await z.form('/hesap/siparis/' + siparisId + '/durum', { durum: 'kargoda' }, tk);
await z.form('/hesap/siparis/' + siparisId + '/durum', { durum: 'teslim' }, tk);
sonuc('alıcı "Teslim edildi" görüyor', (await u.istek('/hesap/siparislerim')).metin.includes('Teslim edildi'));

// Teslimden sonra yorum
tk = await u.token('/urun/bebek-patigi');
r = await u.form('/hesap/yorum/' + patikId, { puan: 3, metin: 'Güzel ama <b>biraz</b> küçük' }, tk);
sonuc('teslimden sonra yorum yazıldı', r.yer.startsWith('/urun/bebek-patigi'), r.yer);
sayfa = (await m.istek('/urun/bebek-patigi')).metin;
sonuc('yorum görünüyor ve ortalama güncellendi (5 ve 3 -> 4.0)', sayfa.includes('&lt;b&gt;biraz&lt;/b&gt;') && sayfa.includes('<b>4.0</b>'));

// ================= ADMİN =================
const a = istemci();
r = await a.giris('admin', 'yanlis');
sonuc('yanlış şifre reddedildi', r.durum === 200 && r.metin.includes('hatalı'));
r = await a.giris('admin', 'admin123');
sonuc('admin giriş -> /admin', r.yer === '/admin', r.yer);
tk = await a.token('/admin/urunler');
const yeniId = (await a.istek('/admin/urunler')).metin.match(new RegExp('href="/urun/' + yeniSlug + '"[\\s\\S]*?/admin/urunler/(\\d+)/onayla'))[1];
await a.form('/admin/urunler/' + yeniId + '/onayla', {}, tk);
sonuc('admin onayladı -> ürün yayında', (await m.istek('/urun/' + yeniSlug)).durum === 200);
await a.form('/admin/kategoriler', { ad: 'Cam İşleri', ikon: 'cup-straw' }, tk);
sonuc('kategori eklendi (slug: cam-isleri)', (await m.istek('/kategori/cam-isleri')).durum === 200);
const orguId = (await a.istek('/admin/kategoriler')).metin.match(/\/admin\/kategoriler\/(\d+)\/sil/)[1];
r = await a.form('/admin/kategoriler/' + orguId + '/sil', {}, tk);
sonuc('içinde ürün olan kategori silinemez', (await a.istek(r.yer)).metin.includes('Bu kategoride ürün var'));
await a.form('/admin/duyurular', { baslik: 'Çılgın Şubat İndirimleri Başladı!', icerik: 'deneme' }, tk);
sonuc('duyuru slug', (await m.istek('/duyuru/cilgin-subat-indirimleri-basladi')).durum === 200);
sonuc('admin siparişler', (await a.istek('/admin/siparisler')).metin.includes('testuye'));
sayfa = (await a.istek('/admin')).metin;
sonuc('admin panelinde ciro ve durumlar', sayfa.includes('Toplam satış') && sayfa.includes('Siparişlerin durumu'));

console.log(hataSayisi ? '\n' + hataSayisi + ' kontrol başarısız' : '\nBütün kontroller geçti');
process.exitCode = hataSayisi ? 1 : 0;
