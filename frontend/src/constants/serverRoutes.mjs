const BASE = process.env.NODE_ENV === "development"
   ? process.env.REACT_APP_DEV_API_URL
   : process.env.REACT_APP_PROD_API_URL

export const ADD = "/add"
export const UPDATE = "/update"
export const DELETE = "/delete"

export const SERVER_ROUTES = {
   BASE,
   LOGIN: "/auth/login",
   LOGOUT: "/auth/logout",
   REGISTER: "/auth/signup",
   GET_USER: "/auth/me",
   GOOGLE: "/auth/google",
   PRODUCTS: "/products",
   CATEGORIES: "/props/category",
   COLORS: "/props/color",
   SIZES: "/props/size",
   SIZES: "/props/size",
   SEXES: "/props/sex",
   BRANDS: "/props/brand",
   CART: "/cart"
}
