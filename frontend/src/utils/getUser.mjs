import { SERVER_ROUTES } from "../constants/serverRoutes.mjs"
import apiServer from "../api/indexApi.js"
import { LOCAL_STORAGE } from "../constants/localStorage.mjs"

export const getUser = async () => {
   const response = await apiServer.get(SERVER_ROUTES.GET_USER)
   localStorage.setItem(LOCAL_STORAGE.USER, JSON.stringify({
      id: response.data.user.id,
      name: response.data.user.username,
      role: response.data.user.role
   }))
   return response.data.user
}