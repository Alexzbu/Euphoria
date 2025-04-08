import { Router } from 'express'
import productsRoutes from './productsRoutes.mjs'
import cartRoutes from './cartRoutes.mjs'
import propsRoutes from './propsRoutes/index.mjs'
import authRoutes from './authRoutes.mjs'
import { PRODUCTS, CART, PROPS, AUTHENTICATION } from '../constants/routes.mjs'

const router = Router()

router.use(PRODUCTS, productsRoutes)
router.use(CART, cartRoutes)
router.use(PROPS, propsRoutes);
router.use(AUTHENTICATION, authRoutes)

export default router