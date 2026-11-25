// ============================================================
//  kitaplik.js - Kitaplık sayfasındaki plak kılıfları
//  Üzerine gelince plağın kılıftan çıkması tamamen CSS'te (stil.css -> "Kitaplık").
//  Burada sadece tıklamayı dinliyoruz: kılıfa tıklayınca şarkı çalar, tekrar tıklayınca durur.
// ============================================================
const kiliflar = document.querySelectorAll('.kilif');
const kitaplikListesi = [...kiliflar].map(k => JSON.parse(k.dataset.kilif)); // çalma sırası

kiliflar.forEach(kilif => {
  kilif.addEventListener('click', e => {
    if (e.target.closest('a')) return;   // alttaki şarkı adı linki: şarkı sayfasına git
    window.sarkiyiCal(JSON.parse(kilif.dataset.kilif), kitaplikListesi); // oynatici.js
  });
  // Klavyeyle de kullanılabilsin: Enter ya da boşluk = tıklama
  kilif.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kilif.click(); }
  });
});
