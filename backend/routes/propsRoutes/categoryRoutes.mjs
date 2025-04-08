import CategoryController from '../../controllers/propsControllers/categoryContriller.mjs'
import { ensureAdmin } from '../../middleware/ensureAdmin.mjs'
import { Router } from 'express'
import { BASE, ADD } from '../../constants/routes.mjs'

const router = Router()

router.get(BASE, CategoryController.getCategorys)

router.post(ADD,
    ensureAdmin,
    CategoryController.createCategory
)

export default router
