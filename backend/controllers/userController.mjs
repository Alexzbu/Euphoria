import UserService from '../services/userService.mjs'
import { validationResult } from 'express-validator'

class UserController {

	static async createUser(req, res) {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			const errorMessages = {}
			errors.array().forEach(error => {
				errorMessages[error.path] = error.msg
			})
			return res.status(400).json(errorMessages)
		}

		try {
			const { username, password } = req.body

			await UserService.addNewUser({ username, password }, req)
			res.status(200).json({ success: true })
		} catch (error) {
			res.status(500).json({ username: 'User with this E-Mail already exists' })
		}
	}
}

export default UserController
