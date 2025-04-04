import { SERVER_ROUTES } from "../constants/serverRoutes.mjs"
import apiServer from "../api/indexApi.js"

export const getProps = async () => {
   const [categorys, colors, sizes, brands, sexes] = await Promise.all([
      apiServer.get(SERVER_ROUTES.CATEGORIES),
      apiServer.get(SERVER_ROUTES.COLORS),
      apiServer.get(SERVER_ROUTES.SIZES),
      apiServer.get(SERVER_ROUTES.BRANDS),
      apiServer.get(SERVER_ROUTES.SEXES)
   ])

   const props = {
      categories: categorys.data,
      colors: colors.data,
      sizes: sizes.data,
      brands: brands.data,
      sexes: sexes.data
   }
   return props
}