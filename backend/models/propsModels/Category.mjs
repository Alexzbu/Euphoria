import mongoose from 'mongoose'

const { Schema } = mongoose

const categorySchema = new Schema({
  name: {
    trim: true,
    type: String,
    required: [true, 'Name of category is required'],
    minlength: [2, 'Name of gategory must be at least 3 characters long'],
    maxlength: [20, 'Name of category must be at most 20 characters long'],
  },
})

const Category = mongoose.model('Category', categorySchema)
export default Category