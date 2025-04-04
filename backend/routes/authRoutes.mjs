import { Router } from 'express'
import passport from 'passport'
import UserController from '../controllers/userController.mjs'
import AuthController from '../controllers/authController.mjs'
import UserValidator from '../validators/userValidator.mjs'
import { checkSchema } from 'express-validator'

const router = Router()

router.post('/signup',
  checkSchema(UserValidator.userSchema),
  UserController.createUser
)

router.post('/login',
  checkSchema(UserValidator.userSchema),
  AuthController.login
)

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  AuthController.googleLogin
)

router.get('/me',
  AuthController.checkLogin
)

router.get('/logout', (req, res) => {
  res.clearCookie('jwt_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  })
  res.status(200).json({ message: 'Logout successful' });
})

export default router
