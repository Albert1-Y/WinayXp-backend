import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel } from '../models/user.model.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const nombre_persona = profile.displayName;
      let user = await UserModel.findOneByEmail(email); // <-- Esto sí retorna el usuario si existe
      console.log('Email recibido:', email);
      console.log('Usuario encontrado:', user);
      if (!user) {
        // Solo crear si no existe
        user = await UserModel.createPersona({
          nombre_persona,
          email,
          rol: 'estudiante',
        });
        // Usuario creado pero inactivo
        return done(null, false, {
          message: 'Usuario creado. Contacta al administrador para acceso.',
        });
      }
      if (!user.activo) {
        // Usuario existe pero está inactivo
        return done(null, false, {
          message: 'Usuario inactivo. Contacta al administrador para acceso.',
        });
      }
      return done(null, user);
    }
  )
);

export default passport;
