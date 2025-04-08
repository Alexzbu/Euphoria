import CartController from '../controllers/cartController.mjs'
import { Router } from 'express'
import { BASE, ADD, UPDATE, DELETE } from '../constants/routes.mjs'

const router = Router()

router.get(BASE, CartController.getProducts)

router.post(ADD, CartController.addProduct)
router.post(UPDATE, CartController.updateProductAmount)
router.post(DELETE, CartController.deleteProduct)

export default router
