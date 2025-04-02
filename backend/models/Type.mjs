import mongoose from 'mongoose'

const { Schema } = mongoose

const userTypeSchema = new Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Name is required'],
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [50, 'Name must be at most 50 characters long'],
  },
})


const Cart = mongoose.model('Type', userTypeSchema)
export default Cart
