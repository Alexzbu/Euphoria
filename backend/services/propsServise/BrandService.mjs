import Brand from "../../models/propsModels/Brand.mjs"

class BrandService {
	static async getBrandsList() {
		try {

			return await Brand.find({})

		} catch (error) {
			return []
		}
	}

	static async addNewBrand(data) {
		const brand = new Brand(data)
		return await brand.save()
	}

	static async getLocationById(id) {
		return await Brand.findById(id)
	}

	static async updateLocation(id, data) {
		return await Brand.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		})
	}

	static async deleteLocation(id) {
		return await Brand.findByIdAndDelete(id)
	}
}

export default BrandService
