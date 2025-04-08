import SexController from '../../controllers/propsControllers/sexContriller.mjs'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
import { BASE, ADD } from '../../constants/routes.mjs'

const router = Router()

router.get(BASE, SexController.getSexes)

router.post(ADD,
    ensureAdmin,
    SexController.createSex
)

export default router
