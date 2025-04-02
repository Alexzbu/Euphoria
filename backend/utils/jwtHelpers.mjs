import jwt from 'jsonwebtoken'
import config from '../config/default.mjs'

const expiresIn = '7d'

const tokenKey = config.tokenSecret

export function parseBearer(jwt_token, headers) {

  try {
    return jwt.verify(jwt_token, prepareSecret(headers))
  } catch (err) {
    throw new Error('Invalid token')
  }
}

export function prepareToken(data, headers) {
  return jwt.sign(data, prepareSecret(headers), {
    expiresIn,
  })
}

function prepareSecret(headers) {
  return tokenKey + headers['user-agent'] + headers['accept-language']
}
