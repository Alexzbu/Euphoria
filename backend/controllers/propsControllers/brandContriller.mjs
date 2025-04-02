import BrandService from '../../services/propsServise/BrandService.mjs'
import { validationResult } from 'express-validator'

class BrandController {
	static async getBrands(req, res) {
		try {
			const brandsList = await BrandService.getBrandsList()

			res.status(200).json(brandsList)
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

	static async createBrand(req, res) {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			const errorMessages = {}
			errors.array().forEach(error => {
				errorMessages[error.path] = error.msg
			})
			return res.status(400).json(errorMessages)
		}

		const brand = req.body
		if (req.params.id) {
			await LocationService.updateLocation(req.params.id, locationData)
		} else {
			await BrandService.addNewBrand(brand)
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

export default BrandController
