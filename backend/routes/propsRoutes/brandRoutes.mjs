import BrandController from '../../controllers/propsControllers/brandContriller.mjs'
// import LocationValidator from '../validators/LocationValidator.mjs'
import { checkSchema } from 'express-validator'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'

const router = Router()

router.get('/', BrandController.getBrands)

// router.get('/:id', LocationController.getLocationById)

router.post('/add/:id?/',
    ensureAdmin,
    // checkSchema(LocationValidator.locationSchema),
    BrandController.createBrand
)

// router.delete('/:id', LocationController.deleteLocation)


export default router
