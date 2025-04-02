import Sex from "../../models/propsModels/Sex.mjs"

class SexService {
	static async getSexesList() {
		try {

			return await Sex.find({})

		} catch (error) {
			return []
		}
	}

	static async addNewSex(data) {
		const sex = new Sex(data)
		return await sex.save()
	}

	static async getLocationById(id) {
		return await Sex.findById(id)
	}

	static async updateLocation(id, data) {
		return await Sex.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		})
	}

	static async deleteLocation(id) {
		return await Sex.findByIdAndDelete(id)
	}
}

export default SexService
