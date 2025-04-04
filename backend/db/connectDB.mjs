import config from '../config/default.mjs'
import mongoose from 'mongoose'
import Type from '../models/Type.mjs'
import User from '../models/User.mjs'
import { userType } from '../constants/userType.mjs'

mongoose.Promise = global.Promise

export default async function () {
   try {
      await mongoose.connect(config.mongoURI)

      if (!await Type.findOne()) {
         const typeAdmin = new Type({
            title: userType.ADMIN
         })
         const typeGuest = new Type({
            title: userType.GUEST
         })
         await typeGuest.save()

         const typeId = await typeAdmin.save()
         const admin = new User({
            username: 'admin@admin.com',
            password: 'Admin123$',
            type: typeId._id
         })
         await admin.save()
      }
      console.log('Successfully Connected To MongoDB')
   } catch (err) {
      console.error('MongoDB connection error:', err)
   }
}