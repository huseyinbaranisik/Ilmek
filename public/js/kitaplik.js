// ============================================================
//  kitaplik.js - Kitaplık sayfasındaki plak kılıfları
//  Üzerine gelince plağın kılıftan çıkması tamamen CSS'te (stil.css -> "Kitaplık").
//  Burada: kılıfa tıklayınca şarkı çalar, tekrar tıklayınca durur. Bir de sanatçıya göre süzme.
// ============================================================
const kiliflar = document.querySelectorAll('.kilif');

// Çalma sırası: o an rafta görünen (süzülmemiş) kılıflar
const kitaplikListesi = () => [...kiliflar].filter(k => !k.classList.contains('gizli')).map(k => JSON.parse(k.dataset.kilif));

kiliflar.forEach(kilif => {
  kilif.addEventListener('click', e => {
    if (e.target.closest('a')) return;   // alttaki şarkı adı linki: şarkı sayfasına git
    window.sarkiyiCal(JSON.parse(kilif.dataset.kilif), kitaplikListesi()); // oynatici.js
  });
  // Klavyeyle de kullanılabilsin: Enter ya da boşluk = tıklama
  kilif.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kilif.click(); }
  });
});

// Sanatçı çipleri: seçilen sanatçının olmayan kılıflarına "gizli" sınıfı eklenir
document.querySelectorAll('.cip').forEach(cip => {
  cip.addEventListener('click', () => {
    document.querySelectorAll('.cip').forEach(c => c.classList.toggle('aktif', c === cip));
    const secilen = cip.dataset.filtre;   // "" = hepsi
    kiliflar.forEach(k => k.classList.toggle('gizli', secilen !== '' && k.dataset.sanatci !== secilen));
  });
});
