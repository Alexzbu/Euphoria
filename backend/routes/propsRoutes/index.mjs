import { Router } from 'express'
import brandRoutes from './brandRoutes.mjs'
import sexRoutes from './sexRoutes.mjs'
import colorRoutes from './colorRoutes.mjs'
import sizeRoutes from './sizeRoutes.mjs'
import categoryRoutes from './categoryRoutes.mjs'



const router = Router()

router.use('/brand', brandRoutes)
router.use('/sex', sexRoutes)
router.use('/color', colorRoutes)
router.use('/size', sizeRoutes)
router.use('/category', categoryRoutes)

export default router