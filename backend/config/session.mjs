import session from 'express-session'
import config from './default.mjs'
const sessionConfig = session({
  secret: config.sessionSecret,
  cookie: { maxAge: 60 * 60 * 1000 },
  resave: false,
  saveUninitialized: false,
})

export default sessionConfig
