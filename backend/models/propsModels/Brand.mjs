import mongoose from 'mongoose'

const { Schema } = mongoose

const brandSchema = new Schema({
  name: {
    trim: true,
    type: String,
    required: [true, 'Name of brand is required'],
    minlength: [2, 'Name of brand must be at least 3 characters long'],
    maxlength: [20, 'Name of brand must be at most 20 characters long'],
  },
})

const Brand = mongoose.model('Brand', brandSchema)
export default Brand