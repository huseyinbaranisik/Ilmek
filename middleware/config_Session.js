// ============================================================
//  middleware/config_Session.js - Oturum ayarları (dersteki dosyayla aynı mantık)
//  Oturumlar veritabanında saklanır (connect-session-sequelize),
//  böylece sunucu yeniden başlasa da kullanıcıların girişi düşmez.
// ============================================================
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const db = require("../data/db");

const configSession = session({
  secret: "7f3c2a9e-4b1d-4e8a-9c6f-plak-oturum", // oturum çerezini imzalamak için gizli anahtar
  resave: false,             // sadece oturum değiştiğinde kaydet
  saveUninitialized: false,  // boş oturumları kaydetme
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 saat sonra çerez silinsin
  },
  store: new SequelizeStore({ db: db }), // oturumları "Sessions" tablosunda tut
});

module.exports = configSession;
