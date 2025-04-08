import BrandController from '../../controllers/propsControllers/brandContriller.mjs'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
import { BASE, ADD } from '../../constants/routes.mjs'

const router = Router()

router.get(BASE, BrandController.getBrands)

router.post(ADD,
    ensureAdmin,
    BrandController.createBrand
)



export default router
