import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const { Schema } = mongoose


const userSchema = new Schema({
   username: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Email is already taken'],
   },
   googleId: {
      type: String,
   },
   password: {
      type: String,
      select: false,
   },
   type: {
      type: Schema.Types.ObjectId,
      ref: 'Type',
   },
   failedAttempts: {
      type: Number,
      default: 0
   },
   lockUntil: {
      type: Date
   }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
   if (!this.isModified('password')) return next()
   if (!this.password) return next()
   const salt = await bcrypt.genSalt(10)
   this.password = await bcrypt.hash(this.password, salt)
   next()
})

userSchema.pre('findOneAndUpdate', async function (next) {
   if (!this._update.password) return next()
   const salt = await bcrypt.genSalt(10)
   this._update.password = await bcrypt.hash(this._update.password, salt)
   next()
})

userSchema.methods.validPassword = async function (password) {
   return bcrypt.compare(password, this.password)
}

userSchema.methods.isLocked = function () {
   return this.lockUntil && this.lockUntil > Date.now()
}

const User = mongoose.model('User', userSchema)
export default User
