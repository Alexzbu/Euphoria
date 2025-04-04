import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../constants/routes.mjs';
import MainPage from '../views/MainPage'
import Catalog from '../views/Catalog';
import ProductCard from '../views/products/ProductCard';
import ProductForm from '../views/products/ProductForm';
import Cart from '../views/products/Cart';
import Props from '../views/props/Props';
import AddPropsForm from '../views/props/AddPropsForm';
import Login from '../views/auth/Login'
import Register from '../views/auth/Register'


const ProtectedRoute = ({ children, isAuthenticated }) => {
   return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} />
}

const AppRoutes = ({ user, setUser, search, productList, setProductList, setCartIsChanged }) => {
   return (
      <Routes>
         <Route path="/" element={<MainPage />} />
         <Route path={ROUTES.CATALOG} element={<Catalog user={user} search={search} />} />
         <Route path={ROUTES.CART}
            element={
               <Cart
                  user={user}
                  productList={productList}
                  setProductList={setProductList}
                  setCartIsChanged={setCartIsChanged}
               />}
         />
         <Route path={ROUTES.PRODUCT_CARD()} element={<ProductCard user={user} setCartIsChanged={setCartIsChanged} />} />
         <Route path={ROUTES.ADD_PRODUCT}
            element={
               // <ProtectedRoute isAuthenticated={isAuthenticated}>
               <ProductForm />
               // </ProtectedRoute>
            } />
         <Route path="/props" element={<Props user={user} />} />
         <Route path="/addProps/:id?/:title"
            element={
               // <ProtectedRoute isAuthenticated={isAuthenticated}>
               <AddPropsForm />
               // </ProtectedRoute>
            } />
         <Route path={ROUTES.LOGIN} element={<Login setUser={setUser} />} />
         <Route path={ROUTES.REGISTER} element={<Register />} />
      </Routes>
   );
};

export default AppRoutes;
