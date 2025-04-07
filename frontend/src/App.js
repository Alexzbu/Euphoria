import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Header from './components/Header'
import AppRoutes from './router/Routes'
import Footer from './components/Footer'
import apiServer from './api/indexApi'
import { SERVER_ROUTES, ADD } from './constants/serverRoutes.mjs'
import ScrollToTop from './components/ScrollToTop'
import MyToaster from './components/Toaster'
import { slideToggle } from './utils/spollers/slideToggle.mjs'
import { LOCAL_STORAGE } from './constants/localStorage.mjs'

const App = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')))
  const [search, setSearch] = useState('')
  const [productList, setProductList] = useState([])
  const [cartIsChanged, setCartIsChanged] = useState(false)

  useEffect(() => {
    slideToggle()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      let storedProducts = JSON.parse(localStorage.getItem(LOCAL_STORAGE.PRODUCTS)) || []
      if (user) {
        if (storedProducts.length > 0) {
          const productToSend = storedProducts.map(item => ({
            product: item.product._id,
            size: item.product.size.name,
            amount: item.amount
          }))
          try {
            const response = await apiServer.post(`${SERVER_ROUTES.CART}${ADD}`, {
              product: productToSend, userId: user.id
            })
            response.data && setProductList(response.data.productList)
            localStorage.removeItem(LOCAL_STORAGE.PRODUCTS)
          } catch (error) {
            console.error('Error sending data:', error);
          } finally {
          }
        }
        if (storedProducts.length === 0) {
          try {
            const response = await apiServer.get(SERVER_ROUTES.CART, {
              params: { userId: user.id }
            })
            response.data && setProductList(response.data.productList)
          } catch (error) {
            console.error('Error fetching data:', error)
          }
        }
      } else {
        if (storedProducts.length > 0) {
          setProductList(storedProducts)
        } else {
          setProductList([])
        }
      }
    }
    fetchData()
  }, [user, cartIsChanged])

  return (
    <Router>
      <ScrollToTop />
      <MyToaster />
      <Header
        user={user}
        setUser={setUser}
        search={search}
        setSearch={setSearch}
        productList={productList}
      />
      <AppRoutes
        user={user}
        setUser={setUser}
        search={search}
        productList={productList}
        setProductList={setProductList}
        setCartIsChanged={setCartIsChanged}
      />
      <Footer />
    </Router>
  )
}

export default App
