import UserService from '../services/userService.mjs'
import { prepareToken, parseBearer } from '../utils/jwtHelpers.mjs'

const SUCCESSFUL_LOGIN = '/login?successful=true'
const MAX_FAILED_ATTEMPTS = 5
const LOCK_TIME = 60 * 60 * 1000
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

class AuthController {

  static async login(req, res) {

    if (!req.body.username) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!req.body.password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    try {
      const user = await UserService.getUserByName({ username: req.body.username });
      if (!user) {
        return res.status(401).json({ message: 'Incorrect username or password.' });
      }

      if (user.isLocked()) {
        return res.status(403).json({ message: 'Account locked. Try again later.' });
      }

      const isMatch = await user.validPassword(req.body.password);
      if (!isMatch) {
        user.failedAttempts += 1;

        if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = Date.now() + LOCK_TIME;
        }

        await user.save();
        return res.status(401).json({ message: 'Incorrect username or password.' });
      }

      user.failedAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      const token = prepareToken(
        { id: user._id, username: user.username, role: user.type.title },
        req.headers
      )

      setCookies(req, res, token)

      res.status(200).json({ message: 'Login successful' });
    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async googleLogin(req, res) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication failed' })
    }

    setCookies(req, res)

    res.redirect(`${process.env.BASE_FRONT_URL}${SUCCESSFUL_LOGIN}`)
  }

  static async checkLogin(req, res) {
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
  }
}

function setCookies(req, res, token) {
  res.cookie('jwt_token', token || req?.user?.token, {
    httpOnly: true,
    secure: process.env.SECURE,
    sameSite: process.env.SAME_SITE,
    maxAge: COOKIE_MAX_AGE,
  })
}

export default AuthController

