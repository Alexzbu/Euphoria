import mongoose from 'mongoose'

const { Schema } = mongoose

const cartProductSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  size: {
    type: String
  },
  amount: {
    type: Number,
    required: [true],
    min: 1
  },
})

const cartSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productList: [cartProductSchema]
})


const Cart = mongoose.model('Cart', cartSchema)
export default Cart
