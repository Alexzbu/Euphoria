import SexService from '../../services/propsServise/SexService.mjs'
import { validationResult } from 'express-validator'

class SexController {
	static async getSexes(req, res) {
		try {
			const sexesList = await SexService.getSexesList()

			res.status(200).json(sexesList)
		} catch (err) {
			res.status(500).json({ error: err.message })
		}
	}

	static async getLocationById(req, res) {
		try {
			const location = await LocationService.getLocationById(req.params.id)

			res.status(200).json({ location })
		} catch (err) {
			res.status(500).json({ error: err.message })
		}
	}

	static async createSex(req, res) {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			const errorMessages = {}
			errors.array().forEach(error => {
				errorMessages[error.path] = error.msg
			})
			return res.status(400).json(errorMessages)
		}

		const sex = req.body
		if (req.params.id) {
			await LocationService.updateLocation(req.params.id, locationData)
		} else {
			await SexService.addNewSex(sex)
		}
		res.status(200).json({ message: 'successful' })
	}



	static async deleteLocation(req, res) {
		try {
			await LocationService.deleteLocation(req.params.id)
			res.status(200).json({ message: 'successful' })
		} catch (err) {
			res.status(500).json({ error: err.message })
		}
	}
}

export default SexController
