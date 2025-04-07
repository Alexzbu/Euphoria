import CartService from '../services/CartService.mjs'
import { validationResult } from 'express-validator'

class CartController {
  static async getProducts(req, res) {
    try {
      const { userId } = req.query
      const productsList = await CartService.getCart(userId)
      res.status(200).json(productsList)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  static async addProduct(req, res) {
    const { product, userId } = req.body
    try {
      const productsList = await CartService.addProduct({ product, userId })
      res.status(200).json(productsList)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  static async updateProductAmount(req, res) {
    const { userId, productId, amount } = req.body.params
    try {
      const productsList = await CartService.updateProductAmount({ userId, productId, amount })
      res.status(200).json(productsList)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  static async deleteProduct(req, res) {
    const { userId, productId } = req.body.params
    try {
      const productsList = await CartService.deleteProduct({ userId, productId })
      res.status(200).json(productsList)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

export default CartController
