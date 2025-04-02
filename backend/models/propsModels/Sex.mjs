import mongoose from 'mongoose'

const { Schema } = mongoose

const sexSchema = new Schema({
  name: {
    trim: true,
    type: String,
    required: [true, 'Name of sex is required'],
    minlength: [2, 'Name of sex must be at least 3 characters long'],
    maxlength: [20, 'Name of sex must be at most 20 characters long'],
  },
})

const Sex = mongoose.model('Sex', sexSchema)
export default Sex