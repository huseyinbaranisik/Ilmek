// ============================================================
//  helpers/slugfield.js - Slugify (dersteki helpers/slugfield.js ile aynı)
//  "Çılgın Şubat Konseri!" -> "cilgin-subat-konseri"
// ============================================================
const slugify = require("slugify");

const options = {
  replacement: "-",  // boşlukların yerine "-"
  lower: true,       // küçük harfe çevir
  strict: true,      // harf, rakam ve "-" dışındakileri sil
  locale: "tr",      // Türkçe harfleri doğru çevir (ı -> i, ş -> s ...)
  trim: true,        // baştaki ve sondaki "-" leri sil
};

function slugField(str) {
  // slugify "&" işaretini İngilizce "and" yapar. Türkçe "ve" olsun: "Bere & Şapka" -> "bere-ve-sapka"
  return slugify(str.replace(/&/g, " ve "), options) || "icerik";
}

// Aynı slug veritabanında varsa sonuna -2, -3 ... ekler ("kor", "kor-2")
async function benzersizSlug(Model, str) {
  const temel = slugField(str);
  let slug = temel, i = 2;
  while (await Model.findOne({ where: { slug } })) slug = temel + "-" + i++;
  return slug;
}

module.exports = { slugField, benzersizSlug };
