import mongoose from 'mongoose'

const { Schema } = mongoose

const colorSchema = new Schema({
  name: {
    trim: true,
    type: String,
    required: [true, 'Name of color is required'],
    minlength: [2, 'Name of color must be at least 3 characters long'],
    maxlength: [20, 'Name of color must be at most 20 characters long'],
  },
})

const Color = mongoose.model('Color', colorSchema)
export default Color