import SizeController from '../../controllers/propsControllers/sizeContriller.mjs'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
import { BASE, ADD } from '../../constants/routes.mjs'

const router = Router()

router.get(BASE, SizeController.getSizes)

router.post(ADD,
    ensureAdmin,
    SizeController.createSize
)

export default router
