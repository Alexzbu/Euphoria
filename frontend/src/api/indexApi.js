import axios from 'axios';

const apiServer = axios.create({
   baseURL: process.env.NODE_ENV === "development"
      ? process.env.REACT_APP_DEV_API_URL
      : process.env.REACT_APP_PROD_API_URL,
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

export default apiServer;