// ============================================================
//  middleware/csrf.js - CSRF anahtarını sayfalara gönderir (dersteki csrf.js ile aynı)
//
//  index.js'de app.use(csurf()) ile her POST isteği kontrol ediliyor.
//  Bu middleware req.csrfToken() ile üretilen anahtarı res.locals'a koyar,
//  böylece her EJS sayfasında <%= csrfToken %> ile kullanılabilir.
//  Formlarda: <input type="hidden" name="_csrf" value="<%= csrfToken %>">
// ============================================================
module.exports = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};
