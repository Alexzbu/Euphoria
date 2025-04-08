import ColorController from '../../controllers/propsControllers/colorContriller.mjs'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
import { BASE, ADD } from '../../constants/routes.mjs'

const router = Router()

router.get(BASE, ColorController.getColors)

router.post(ADD,
    ensureAdmin,
    ColorController.createColor
)

export default router
