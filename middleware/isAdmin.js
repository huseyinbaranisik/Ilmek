// Sadece "Admin" rolündeki kullanıcıları geçirir.
// Giriş yapmamışsa giriş sayfasına, üyeyse "Yetkiniz yok" sayfasına gider.
module.exports = (req, res, next) => {
  if (!req.session.isAuth) {
    return res.redirect("/auth/giris?url=" + encodeURIComponent(req.originalUrl));
  }
  if (req.session.kullanici.admin) return next();
  res.status(403).render("hata", { baslik: "Yetkiniz yok", aciklama: "Bu sayfaya sadece yöneticiler girebilir." });
};
