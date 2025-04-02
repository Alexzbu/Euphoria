import ColorController from '../../controllers/propsControllers/colorContriller.mjs'
// import LocationValidator from '../validators/LocationValidator.mjs'
import { checkSchema } from 'express-validator'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
const router = Router()

router.get('/', ColorController.getColors)

// router.get('/:id', LocationController.getLocationById)

router.post('/add/:id?/',
    ensureAdmin,
    // checkSchema(LocationValidator.locationSchema),
    ColorController.createColor
)

// router.delete('/:id', LocationController.deleteLocation)


export default router
