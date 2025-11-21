const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { UserModel } = require("../models/user.model.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      proxy: true, // honor X-Forwarded-* headers when behind a reverse proxy (e.g. Render)
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const nombre_persona = profile.displayName;
      let user = await UserModel.findOneByEmail(email); // <-- Esto sí retorna el usuario si existe
      //console.log('Email recibido:', email);
      //console.log('Usuario encontrado:', user);
      if (!user) {
        return done(null, false, {
          message: "Usuario no registrado. Solicita acceso al administrador.",
        });
      }
      if (!user.activo) {
        // Usuario existe pero está inactivo
        return done(null, false, {
          message: "Usuario inactivo. Contacta al administrador para acceso.",
        });
      }
      return done(null, user);
    },
  ),
);

module.exports = passport;
