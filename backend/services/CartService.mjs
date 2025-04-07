import Cart from "../models/Cart.mjs"

const POPULATE = {
  path: 'productList.product',
  populate: [
    { path: 'color' },
    { path: 'size' }
  ]
}

class CartService {
  static async getCart(userId) {
    try {
      return await Cart.findOne({ customer: userId })
        .populate(POPULATE)

    } catch (error) {
      throw new Error('Cart not found')
    }
  }

  static async addProduct({ product, userId }) {
    try {
      let cart = await Cart.findOne({ customer: userId })
      if (!Array.isArray(product)) {
        if (cart) {
          const productIndex = cart.productList.findIndex(
            (item) => item.product.toString() === product.id
          )
          if (productIndex >= 0) {
            cart.productList[productIndex].amount += 1
          } else {
            cart.productList.push({ product: product.id, size: product.size, amount: 1 })
          }
          await cart.save()
          return await cart.populate(POPULATE)
        }
        return await Cart.create({
          customer: userId,
          productList: [{ product: product.id, size: product.size, amount: 1 }]
        })
          .populate(POPULATE)
      } else {
        if (!cart) {
          const newCart = await Cart.create({
            customer: userId,
            productList: product
          })
          return await newCart.populate(POPULATE)
        } else {
          cart.productList.push(...product)
          await cart.save()
          return await cart.populate(POPULATE)
        }
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async updateProductAmount({ userId, productId, amount }) {

    try {
      let cart = await Cart.findOne({ customer: userId })
      if (cart) {
        const productIndex = cart.productList.findIndex(
          (item) => item.product.toString() === productId
        )
        cart.productList[productIndex].amount = amount
        await cart.save()
        return await cart.populate(POPULATE)
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async deleteProduct({ userId, productId }) {
    try {
      let cart = await Cart.findOne({ customer: userId })
      if (!cart) {
        throw new Error("Cart not found");
      }
      const updatedProductsList = cart.productList.filter(
        (item) => item.product.toString() !== productId
      )
      if (updatedProductsList.length === cart.productList.length) {
        throw new Error("Product not found in cart");
      }
      cart.productList = updatedProductsList
      await cart.save()
      return await cart.populate(POPULATE)
    } catch (error) {
      console.error("Error deleting product:", error.message);
      throw new Error("Failed to delete product");
    }
  }

}


export default CartService
