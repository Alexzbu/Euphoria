import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { env } from './env.js';
import { signInWithGoogle } from '../services/authService.js';

export const isGoogleConfigured =
  env.GOOGLE_CLIENT_ID !== undefined &&
  env.GOOGLE_CLIENT_SECRET !== undefined &&
  env.GOOGLE_CALLBACK_URL !== undefined;

function emailFrom(profile: Profile): string {
  const primary = profile.emails?.[0];

  if (!primary?.value) {
    throw new Error('Google profile did not include an email address');
  }

  // accounts are matched by email, so an unverified address can't be trusted,
  // otherwise anyone claiming an address they don't own gets linked in. google
  // types this as a boolean but sends a string in the raw payload, hence the
  // String(). anything short of a definite yes counts as unverified.
  if (String(primary.verified) !== 'true') {
    throw new Error('Google account email is not verified');
  }

  return primary.value.toLowerCase();
}

if (isGoogleConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: env.GOOGLE_CALLBACK_URL as string,
        scope: ['profile', 'email'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        void (async () => {
          try {
            done(null, await signInWithGoogle(profile.id, emailFrom(profile)));
          } catch (error) {
            done(error as Error);
          }
        })();
      },
    ),
  );
}

export { passport };
