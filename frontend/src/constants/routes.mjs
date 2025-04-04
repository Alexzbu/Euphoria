export const ROUTES = {
   LOGIN: "/login",
   REGISTER: "/register",
   CATALOG: "/catalog",
   PRODUCT_CARD: (id) => id ? `/product-card/${id}` : '/product-card/:id',
   ADD_PRODUCT: "/add-product",
   CART: "/cart"
}
