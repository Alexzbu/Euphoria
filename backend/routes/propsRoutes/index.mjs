import { Router } from 'express'
import brandRoutes from './brandRoutes.mjs'
import sexRoutes from './sexRoutes.mjs'
import colorRoutes from './colorRoutes.mjs'
import sizeRoutes from './sizeRoutes.mjs'
import categoryRoutes from './categoryRoutes.mjs'
import { BRAND, SEX, COLOR, SIZE, CATEGORY } from '../../constants/routes.mjs'


const router = Router()

router.use(BRAND, brandRoutes)
router.use(SEX, sexRoutes)
router.use(COLOR, colorRoutes)
router.use(SIZE, sizeRoutes)
router.use(CATEGORY, categoryRoutes)

export default router