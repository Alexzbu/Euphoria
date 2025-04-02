import UserService from '../services/userService.mjs'
import { prepareToken } from '../utils/jwtHelpers.mjs'

class AuthController {

  static async login(req, res) {
    const MAX_FAILED_ATTEMPTS = 5;
    const LOCK_TIME = 60 * 60 * 1000;

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
          user.failedAttempts = 0
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
      );

      res.cookie('jwt_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: 'Login successful' });
    } catch (err) {
      console.error('Login Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;

