import { Router } from 'express'
import passport from 'passport'
import UserController from '../controllers/userController.mjs'
import AuthController from '../controllers/authController.mjs'
import UserValidator from '../validators/userValidator.mjs'
import { checkSchema } from 'express-validator'
import { SIGNUP, LOGIN, GET_USER, GOOGLE, GOOGLE_CALLBACK, LOGOUT } from '../constants/routes.mjs'

const router = Router()

router.post(SIGNUP,
  checkSchema(UserValidator.userSchema),
  UserController.createUser
)

router.post(LOGIN,
  checkSchema(UserValidator.userSchema),
  AuthController.login
)

router.get(GOOGLE,
  passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get(GOOGLE_CALLBACK,
  passport.authenticate('google', { session: false }),
  AuthController.googleLogin
)

router.get(GET_USER,
  AuthController.checkLogin
)

router.get(LOGOUT, (req, res) => {
  res.clearCookie('jwt_token', {
    domain: process.env.DOMAIN ?? req.hostname,
    httpOnly: true,
    secure: true,
    sameSite: process.env.SAME_SITE,
  })
  res.status(200).json({ message: 'Logout successful' });
})

export default router
