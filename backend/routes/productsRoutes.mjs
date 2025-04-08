import ProductController from '../controllers/productController.mjs'
import CarValidator from '../validators/CarValidator.mjs'
import upload from '../middleware/UploadManager.mjs'
import { checkSchema } from 'express-validator'
import { Router } from 'express'
import { ensureAdmin } from '../middleware/ensureAdmin.mjs'
import { BASE, ADD, DETAILS, PROPS } from '../constants/routes.mjs'

const router = Router()

router.get(BASE, ProductController.getProducts)


router.post(ADD,
    ensureAdmin,
    upload.array('productImage', 5),
    // checkSchema(CarValidator.carSchema),
    ProductController.createProduct
)

// router.delete('/:id', CarsController.deleteCar)

router.get(DETAILS, ProductController.productDetails)
router.get(PROPS, ProductController.getProductProps)


export default router
