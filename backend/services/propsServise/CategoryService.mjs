import Category from "../../models/propsModels/Category.mjs"

class CategoryService {
	static async getCategorysList() {
		try {

			return await Category.find({})

		} catch (error) {
			return []
		}
	}

	static async addNewCategory(data) {
		const category = new Category(data)
		return await category.save()
	}

	static async getLocationById(id) {
		return await Category.findById(id)
	}

	static async updateLocation(id, data) {
		return await Category.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		})
	}

	static async deleteLocation(id) {
		return await Category.findByIdAndDelete(id)
	}
}

export default CategoryService
