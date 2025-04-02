import SizeController from '../../controllers/propsControllers/sizeContriller.mjs'
// import LocationValidator from '../validators/LocationValidator.mjs'
import { checkSchema } from 'express-validator'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
const router = Router()

router.get('/', SizeController.getSizes)

// router.get('/:id', LocationController.getLocationById)

router.post('/add/:id?/',
    ensureAdmin,
    // checkSchema(LocationValidator.locationSchema),
    SizeController.createSize
)

// router.delete('/:id', LocationController.deleteLocation)


export default router
