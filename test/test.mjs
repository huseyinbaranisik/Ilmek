// ============================================================
//  test/test.mjs - Uçtan uca test (misafir, üye, admin akışları)
//  Kullanım: 1) plak.db'yi silip sunucuyu başlat (npm start)  2) başka terminalde: npm test
//  Test, "testuye" adında yeni bir üye oluşturduğu için her seferinde boş veritabanında çalıştırılmalı.
// ============================================================

import fs from 'node:fs';
const B = process.env.ADRES || 'http://localhost:3000';
function istemci() {
  let cerez = '';
  async function istek(yol, opt = {}) {
    const r = await fetch(B + yol, { redirect: 'manual', ...opt, headers: { ...(opt.headers || {}), cookie: cerez } });
    const sc = r.headers.getSetCookie();
    if (sc.length) cerez = sc.map(c => c.split(';')[0]).join('; ');
    return { durum: r.status, yer: r.headers.get('location'), metin: await r.text() };
  }
  async function token(yol = '/') { const r = await istek(yol); return r.metin.match(/name="csrf-token" content="([^"]+)"/)[1]; }
  async function form(yol, veri, tk) { return istek(yol, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: tk, ...veri }) }); }
  return { istek, token, form };
}
const sonuc = (ad, ok, ek = '') => console.log((ok ? 'OK  ' : 'HATA') + ' ' + ad + ' ' + ek);

// --- Misafir ---
const m = istemci();
let tk = await m.token();
let r = await m.form('/hesap/inceleme/1', { puan: 5 }, tk);
sonuc('misafir inceleme yazamaz -> girişe', r.durum === 302 && r.yer.startsWith('/auth/giris'), r.yer);
r = await m.form('/sss', { soru: 'CSRF anahtarsız soru' }, 'yanlis');
sonuc('yanlış CSRF -> 403', r.durum === 403);
r = await m.istek('/sss', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'soru=anahtarsiz+soru' });
sonuc('CSRF yok -> 403', r.durum === 403);

// --- Üye: kayıt ---
const u = istemci();
tk = await u.token('/auth/kayit');
r = await u.form('/auth/kayit', { kullaniciAdi: 'testuye', sifre: 'abcdef' }, tk);
sonuc('kayıt', r.durum === 302 && r.yer === '/', r.yer);
tk = await u.token('/sarki/kor');
const sarkiId = (await u.istek('/sarki/kor')).metin.match(/action="\/hesap\/inceleme\/(\d+)"/)[1];
r = await u.form('/hesap/inceleme/' + sarkiId, { puan: 5, yorum: 'Harika <script>alert(1)</script>' }, tk);
sonuc('inceleme kaydet', r.durum === 302, r.yer);
let sayfa = (await u.istek('/sarki/kor')).metin;
sonuc('inceleme görünüyor + XSS kaçırıldı', sayfa.includes('&lt;script&gt;') && !sayfa.includes('<script>alert'));
sonuc('ortalama puan güncellendi (3 ve 5 -> 4.0)', sayfa.includes('<b>4.0</b>'));
r = await u.form('/hesap/inceleme/' + sarkiId, { puan: 1, yorum: '' }, tk);
sayfa = (await u.istek('/sarki/kor')).metin;
sonuc('inceleme güncelleme (tek inceleme kalır, ort 2.0)', sayfa.includes('<b>2.0</b>') && sayfa.includes('(2 inceleme)'));
r = await u.form('/hesap/liste', { baslik: 'Çalışırken Dinlediklerim', sarkiId }, tk);
r = await u.istek('/liste/calisirken-dinlediklerim');
sonuc('liste oluştur + şarkı ekle + slug', r.durum === 200 && r.metin.includes('/sarki/kor'));

// --- Üye: şarkı yükleme (multipart, CSRF adreste) ---
const fd = new FormData();
fd.append('baslik', 'Deneme Şarkısı'); fd.append('sanatci', 'Test'); fd.append('album', 'Gece Yarısı'); fd.append('renk', '#123456');
fd.append('ses', new Blob([fs.readFileSync(new URL('../public/muzik/kor.wav', import.meta.url))]), 'deneme.wav');
r = await u.istek('/hesap/yukle?_csrf=' + encodeURIComponent(tk), { method: 'POST', body: fd });
sonuc('üye şarkı yükledi -> profile', r.durum === 302 && r.yer === '/uye/testuye', r.yer);
r = await u.istek('/sarki/deneme-sarkisi');
sonuc('onaysız şarkı yayında değil (404)', r.durum === 404);
sayfa = (await u.istek('/uye/testuye')).metin;
sonuc('profilde "Onay bekliyor"', sayfa.includes('Onay bekliyor'));
r = await u.istek('/admin');
sonuc('üye admin paneline giremez (403)', r.durum === 403);

// --- Admin ---
const a = istemci();
tk = await a.token('/auth/giris');
r = await a.form('/auth/giris', { kullaniciAdi: 'admin', sifre: 'yanlis' }, tk);
sonuc('yanlış şifre reddedildi', r.durum === 200 && r.metin.includes('hatalı'));
r = await a.form('/auth/giris', { kullaniciAdi: 'admin', sifre: 'admin123' }, tk);
sonuc('admin giriş -> /admin', r.yer === '/admin', r.yer);
tk = await a.token('/admin/sarkilar');
const bekleyen = (await a.istek('/admin/sarkilar')).metin.match(/\/admin\/sarkilar\/(\d+)\/onayla/)[1];
r = await a.form('/admin/sarkilar/' + bekleyen + '/onayla', {}, tk);
r = await a.istek('/sarki/deneme-sarkisi');
sonuc('admin onayladı -> yayında', r.durum === 200);
r = await a.form('/admin/duyurular', { baslik: 'Çılgın Şubat Konseri İçin Ön Satış!', icerik: 'deneme' }, tk);
r = await a.istek('/duyuru/cilgin-subat-konseri-icin-on-satis');
sonuc('duyuru slug', r.durum === 200);
r = await a.istek('/admin/kullanicilar');
sonuc('kullanıcılar sayfası', r.durum === 200 && r.metin.includes('testuye'));

// --- Yeni özellikler: yüklenen dosyalar doğru klasörde mi ---
sayfa = (await a.istek('/sarki/deneme-sarkisi')).metin;
sonuc('yüklenen müzik /muzik/yuklenen/ adresinde', /\/muzik\/yuklenen\/\d+-\d+\.wav/.test(sayfa));
const dosyaAdresi = sayfa.match(/\/muzik\/yuklenen\/\d+-\d+\.wav/)[0];
sonuc('yüklenen dosya sunuluyor', (await a.istek(dosyaAdresi)).durum === 200);

// --- Beğeni ---
tk = await u.token('/sarki/kor');
const begen = () => u.istek('/hesap/begen/' + sarkiId, { method: 'POST', headers: { 'x-csrf-token': tk } });
r = await begen();
sonuc('beğen -> begendi: true', JSON.parse(r.metin).begendi === true);
sayfa = (await u.istek('/uye/testuye/begeniler')).metin;
sonuc('beğenilenler sayfasında görünüyor', sayfa.includes('/sarki/kor'));
r = await begen();
sonuc('tekrar basınca beğeni kalkar', JSON.parse(r.metin).begendi === false);
r = await m.istek('/hesap/begen/' + sarkiId, { method: 'POST', headers: { 'x-csrf-token': await m.token() } });
sonuc('misafir beğenemez -> girişe', r.durum === 302 && r.yer.startsWith('/auth/giris'));

// --- Takip ---
r = await u.form('/hesap/takip/deniz', {}, tk);
sayfa = (await u.istek('/uye/deniz')).metin;
sonuc('takip et -> düğme "Takibi bırak"', sayfa.includes('Takibi bırak'));
sayfa = (await u.istek('/')).metin;
sonuc('ana sayfada takip edilenin incelemesi', sayfa.includes('Takip ettiklerin') && sayfa.includes('/uye/deniz'));
r = await u.form('/hesap/takip/testuye', {}, tk);
sayfa = (await u.istek('/uye/testuye')).metin;
sonuc('kendini takip edemez', sayfa.includes('0 takipçi'));
r = await u.form('/hesap/takip/deniz', {}, tk);
sayfa = (await u.istek('/uye/deniz')).metin;
sonuc('takibi bırak', sayfa.includes('>Takip et<'));

// --- Üyeler ve arama ---
sayfa = (await m.istek('/uyeler')).metin;
sonuc('üyeler sayfası (misafir)', sayfa.includes('/uye/testuye') && sayfa.includes('/uye/ece'));
sayfa = (await m.istek('/?q=den')).metin;
sonuc('arama üyeleri de buluyor', sayfa.includes('/uye/deniz'));
sonuc('kısa sayı (2.6k gibi)', /\d\.\dk/.test((await m.istek('/album/gece-yarisi')).metin));
sayfa = (await a.istek('/admin')).metin;
sonuc('admin panelinde beğeni ve takip sayıları', sayfa.includes('Beğeni') && sayfa.includes('Takip'));
