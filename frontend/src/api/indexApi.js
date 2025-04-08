import axios from 'axios'
import { SERVER_ROUTES } from '../constants/serverRoutes.mjs';

const apiServer = axios.create({
   baseURL: SERVER_ROUTES.BASE,
   withCredentials: true,
   headers: {
      'Content-Type': 'application/json',
   },
})

// apiServer.interceptors.response.use(
//    (response) => response,
//    (error) => {
//       if (error.response && error.response.status === 401) {
//          console.error("Session expired. Redirecting to login...");
//          window.location.href = '/login';
//       }
//       return Promise.reject(error);
//    }
// )

export default apiServer