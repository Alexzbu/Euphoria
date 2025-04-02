import { Router } from 'express'
import passport from 'passport'
import { parseBearer } from '../utils/jwtHelpers.mjs'
import UserController from '../controllers/userController.mjs'
import AuthController from '../controllers/authController.mjs'
import UserValidator from '../validators/userValidator.mjs'
import { checkSchema } from 'express-validator'

const router = Router()

router.post('/signup/:id?',
  checkSchema(UserValidator.userSchema),
  UserController.createUser)

router.post('/login',
  checkSchema(UserValidator.userSchema),
  AuthController.login)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication failed' })
    }
    res.cookie('jwt_token', req.user.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.redirect((process.env.BASE_FRONT_URL ?? 'http://localhost:3000') + '/login?successful=true')
  }
)

router.get('/me', (req, res) => {
  const token = req.cookies.jwt_token
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' })
  }
  try {
    const user = parseBearer(token, req.headers)
    res.json({ user })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

router.get('/logout', (req, res) => {
  res.clearCookie('jwt_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax'
  })
  res.status(200).json({ message: 'Logout successful' });
})

export default router
