import User from '../models/User.mjs'
import Type from '../models/Type.mjs'
import { userType } from '../constants/userType.mjs'

class UserService {
	static async getUserList() {
		try {

			return await User.find({})

		} catch (error) {
			return []
		}
	}

	static async addNewUser({ username, password, googleId }, req) {
		let type = {}

		try {
			if (req?.user?.role === userType.ADMIN) {
			} else {
				type = await Type.findOne({ title: userType.GUEST })
			}
			const userData = {
				username: username,
				password: password,
				googleId: googleId,
				type: type
			}
			const user = new User(userData)

			return await user.save()
		} catch (error) {
			console.log(error)
			throw new Error('Unable to create user.')
		}
	}

	static async getUserById(id) {
		return await User.findById(id)
	}

	static async getUserByName({ username: username }) {
		return await User.findOne({ username: username }).select('+password').populate('type')
	}

	async update(id, data) {
		return await User.findOneAndUpdate({ _id: id }, data)
	}

	static async deleteUser(id) {
		return await User.findByIdAndDelete(id)
	}
}

export default UserService
