import Size from "../../models/propsModels/Size.mjs"

class SizeService {
	static async getSizesList() {
		try {

			return await Size.find({})

		} catch (error) {
			return []
		}
	}

	static async addNewSize(data) {
		const size = new Size(data)
		return await size.save()
	}

	static async getLocationById(id) {
		return await Size.findById(id)
	}

	static async updateLocation(id, data) {
		return await Size.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		})
	}

	static async deleteLocation(id) {
		return await Size.findByIdAndDelete(id)
	}
}

export default SizeService
