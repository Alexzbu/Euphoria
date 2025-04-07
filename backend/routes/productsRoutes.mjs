import ProductController from '../controllers/productController.mjs'
import CarValidator from '../validators/CarValidator.mjs'
import upload from '../middleware/UploadManager.mjs'
import { checkSchema } from 'express-validator'
import { Router } from 'express'
import { ensureAdmin } from '../middleware/ensureAdmin.mjs'
const router = Router()

router.get('/', ProductController.getProducts)


router.post('/add/:id?',
    ensureAdmin,
    upload.array('productImage', 5),
    // checkSchema(CarValidator.carSchema),
    ProductController.createProduct
)

// router.delete('/:id', CarsController.deleteCar)

router.get('/details', ProductController.productDetails)
router.get('/props', ProductController.getProductProps)


export default router
