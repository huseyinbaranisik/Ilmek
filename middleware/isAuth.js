// Giriş yapmamış kullanıcıyı giriş sayfasına gönderir (dersteki isAuth ile aynı).
// Giriş yaptıktan sonra geldiği sayfaya geri dönebilmesi için adresi ?url= ile taşır.
module.exports = (req, res, next) => {
  if (!req.session.isAuth) {
    return res.redirect("/auth/giris?url=" + encodeURIComponent(req.originalUrl));
  }
  return next();
};
