import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import UserService from '../services/userService.mjs'
import { prepareToken } from '../utils/jwtHelpers.mjs'
import { ENTRY_POINT, AUTHENTICATION, GOOGLE_CALLBACK } from '../constants/routes.mjs'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}${ENTRY_POINT}${AUTHENTICATION}${GOOGLE_CALLBACK}`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {

        let user = await UserService.getUserByName({ username: profile.emails[0].value })
        if (!user) {

          user = await UserService.addNewUser({
            username: profile.emails[0].value,
            googleId: profile.id,
          })
        }
        const token = prepareToken(
          {
            id: user._id,
            username: user.username,
            role: user.type.title
          },
          req.headers
        )
        user.token = token
        return done(null, user)
      } catch (error) {
        return done(error)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserService.getUserById(id)
    done(null, user)
  } catch (error) {
    done(error)
  }
})

export default passport
