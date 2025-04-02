import { parseBearer } from '../utils/jwtHelpers.mjs'

const auth = (app) => {

  app.use((req, res, next) => {
    const openPathes = [
      /^\/api\/auth\/.*/,
      /^\/api\/products$/,
      /^\/api\/products\/props(\?.*)?$/,
      /^\/api\/props\/[a-z]+$/,
      /^\/api\/products\/details$/,
      /^\/api\/products\/details\/[0-9a-fA-F]{24}$/,
      /^\/api\/locations$/
    ]

    const isOpenPath = openPathes.some((pattern) => pattern.test(req.path))
    if (!isOpenPath) {
      try {
        req.user = parseBearer(req.cookies.jwt_token, req.headers)
      } catch (err) {
        return res.status(401).json({ result: 'Access Denied' })
      }
    }
    next()
  })
}

export default auth
