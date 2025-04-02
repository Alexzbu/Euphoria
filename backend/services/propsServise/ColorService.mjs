import Color from "../../models/propsModels/Color.mjs"

class ColorService {
	static async getColorsList() {
		try {

			return await Color.find({})

		} catch (error) {
			return []
		}
	}

	static async addNewColor(data) {
		const color = new Color(data)
		return await color.save()
	}

	static async getLocationById(id) {
		return await Color.findById(id)
	}

	static async updateLocation(id, data) {
		return await Color.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		})
	}

	static async deleteLocation(id) {
		return await Color.findByIdAndDelete(id)
	}
}

export default ColorService
