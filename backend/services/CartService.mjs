import Cart from "../models/Cart.mjs"

class CartService {
  static async getCart(userId) {
    try {
      return await Cart.findOne({ customer: userId })
        .populate({
          path: 'productList.product',
          populate: [
            { path: 'color' },
            { path: 'size' }
          ]
        })

    } catch (error) {
      throw new Error('Cart not found')
    }
  }

  static async addProduct(userId, productId) {

    try {
      let cart = await Cart.findOne({ customer: userId })
      if (cart) {
        const productIndex = cart.productList.findIndex(
          (item) => item.product.toString() === productId
        )
        if (productIndex >= 0) {
          cart.productList[productIndex].amount += 1
        } else {
          cart.productList.push({ product: productId, amount: 1 })
        }
        return await cart.save()
      } else {
        return await Cart.create({
          customer: userId,
          productList: [{ product: productId, amount: 1 }]
        })
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async updateProductAmount(userId, productId, amount) {

    try {
      let cart = await Cart.findOne({ customer: userId })
      if (cart) {
        const productIndex = cart.productList.findIndex(
          (item) => item.product.toString() === productId
        )
        cart.productList[productIndex].amount = amount

        return await cart.save()
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async deleteProduct(userId, productId) {
    try {
      // Find the cart
      console.log(userId)

      let cart = await Cart.findOne({ customer: userId });

      if (!cart) {
        throw new Error("Cart not found");
      }

      // Filter out the product from productsList
      const updatedProductsList = cart.productList.filter(
        (item) => item.product.toString() !== productId
      );

      // Check if the product was actually removed
      if (updatedProductsList.length === cart.productList.length) {
        throw new Error("Product not found in cart");
      }

      // Update the cart and save
      cart.productList = updatedProductsList;
      await cart.save();

      return cart;
    } catch (error) {
      console.error("Error deleting product:", error.message);
      throw new Error("Failed to delete product");
    }
  }

}


export default CartService
