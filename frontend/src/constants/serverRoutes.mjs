const AUTH = "/auth"
export const ADD = "/add"
export const UPDATE = "/update"
export const DELETE = "/delete"
export const DETAILS = "/details"
export const PROPS = "/props"


export const SERVER_ROUTES = {
   BASE: process.env.REACT_APP_API_URL,
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
