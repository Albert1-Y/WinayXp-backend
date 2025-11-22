const jwt = require('jsonwebtoken');
const ms = require('ms');

function crearTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const maxAge = ms(process.env.COOKIE_MAXAGE);

  res.cookie('auth_token', token, {
    httpOnly: true,
    signed: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    maxAge: maxAge,
  });

  return token;
}
const UtilsTokenAcceso = {
  crearTokenCookie,
};

module.exports = { UtilsTokenAcceso };
