const BASE = process.env.NODE_ENV === "development"
   ? process.env.REACT_APP_DEV_API_URL
   : process.env.REACT_APP_PROD_API_URL

const AUTH = "/auth"
export const ADD = "/add"
export const UPDATE = "/update"
export const DELETE = "/delete"
export const DETAILS = "/details"
export const PROPS = "/props"


export const SERVER_ROUTES = {
   BASE,
   LOGIN: `${AUTH}/login`,
   LOGOUT: `${AUTH}/logout`,
   REGISTER: `${AUTH}/signup`,
   GET_USER: `${AUTH}/me`,
   GOOGLE: `${AUTH}/google`,
   PRODUCTS: "/products",
   CATEGORIES: `${PROPS}/category`,
   COLORS: `${PROPS}/color`,
   SIZES: `${PROPS}/size`,
   SEXES: `${PROPS}/sex`,
   BRANDS: `${PROPS}/brand`,
   CART: "/cart"
}
