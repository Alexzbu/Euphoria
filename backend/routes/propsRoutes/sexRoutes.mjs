import SexController from '../../controllers/propsControllers/sexContriller.mjs'
// import LocationValidator from '../validators/LocationValidator.mjs'
import { checkSchema } from 'express-validator'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
const router = Router()

router.get('/', SexController.getSexes)

// router.get('/:id', LocationController.getLocationById)

router.post('/add/:id?/',
    ensureAdmin,
    // checkSchema(LocationValidator.locationSchema),
    SexController.createSex
)

// router.delete('/:id', LocationController.deleteLocation)


export default router
