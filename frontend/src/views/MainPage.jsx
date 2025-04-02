import React from 'react'
import { Link } from 'react-router-dom'
import MainSwiper from '../components/mainPage/MainSwiper'
import NewProductSwiper from '../components/mainPage/NewProductSwiper.jsx'

const MainPage = () => {

   return (
      <>
         <MainSwiper />
         <section className="page__shop-now shop-now">
            <div className="shop-now__container">
               <div className="shop-now__content">
                  <h2 className="shop-now__title">WE MADE YOUR EVERYDAY FASHION BETTER!</h2>
                  <div className="shop-now__text">
                     <p>In our journey to improve everyday fashion, euphoria presents EVERYDAY wear range - Comfortable & Affordable fashion 24/7</p>
                  </div>
                  <Link to="/catalog" className="shop-now__button button button--white">Shop Now</Link>
               </div>
               <img className="shop-now__image" src="image/shop-now/01.jpg" alt="" />
            </div>
         </section>
         <NewProductSwiper />
      </>
   )
}

export default MainPage
