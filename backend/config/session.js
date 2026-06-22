const session = require('express-session');
const env = require('./env');

function createSessionMiddleware() {
  return session({
    name: env.session.name,
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    proxy: env.nodeEnv === 'production',
    cookie: {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: env.session.maxAge,
      path: '/',
    },
  });
}

module.exports = { createSessionMiddleware };
