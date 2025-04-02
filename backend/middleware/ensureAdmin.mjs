import { userType } from "../constants/userType.mjs"

export function ensureAdmin(req, res, next) {
   if (req.user.role === userType.ADMIN) {
      return next()
   }
   res.status(403).json({ message: 'Forbidden' })
}