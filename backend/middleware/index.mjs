import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import config from '../config/default.mjs'
import { fileURLToPath } from 'url'
import cors from 'cors'
import auth from './auth.mjs'
import { limiter } from './limiter.mjs'
import passport from '../config/passport.mjs'
// import sessionConfig from '../config/session.mjs'
// import flash from 'connect-flash'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const middleware = (app) => {

  app.use(cors({
    origin: process.env.BASE_FRONT_URL || 'http://localhost:3000',
    credentials: true,
    methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  }))

  app.use(limiter)
  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'ejs')

  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser(config.cookieSecret))
  auth(app)

  app.use(express.static(path.join(__dirname, '../public')))

  // app.use(sessionConfig)
  app.use(passport.initialize())
  // app.use(passport.session())
  // app.use(flash())
}

export default middleware
