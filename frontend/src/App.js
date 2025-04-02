import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Header from './components/Header'
import AppRoutes from './router/Routes'
import Footer from './components/Footer'
import apiServer from './api/indexApi'
import ScrollToTop from './components/ScrollToTop'
import MyToaster from './components/Toaster'
import { slideToggle } from './utils/spollers/slideToggle.mjs'

const App = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')))
  const [search, setSearch] = useState('')
  const [productList, setProductList] = useState([])
  const [cartIsChanged, setCartIsChanged] = useState(false)

  useEffect(() => {
    slideToggle()
  }, [])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const response = await apiServer.get('/cart', {
            params: { userId: user.id }
          })
          setProductList(response.data.productList)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }

      fetchData()
    }
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
