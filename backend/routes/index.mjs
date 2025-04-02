import { Router } from 'express'
import productsRoutes from './productsRoutes.mjs'
import cartRoutes from './cartRoutes.mjs'
import propsRoutes from './propsRoutes/index.mjs'
import authRoutes from './authRoutes.mjs'



const router = Router()

router.get('/', (req, res) => {
  res.render('index', { user: req.user })
})

router.use('/products', productsRoutes)
router.use('/cart', cartRoutes)
router.use('/props', propsRoutes);
router.use('/auth', authRoutes)

// router.get('/logout', (req, res) => {
//   req.logout((err) => {
//     if (err) {
//       return next(err)
//     }
//     res.redirect('/')
//   })
// })

export default router