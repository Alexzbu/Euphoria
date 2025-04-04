import CartController from '../controllers/cartController.mjs'
import { Router } from 'express'
const router = Router()

router.get('/', CartController.getProducts)

router.post('/add', CartController.addProduct)
router.post('/update', CartController.updateProductAmount)
router.post('/delete', CartController.deleteProduct)

export default router
