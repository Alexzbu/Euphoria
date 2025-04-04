import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import apiServer from '../../api/indexApi'
import { SERVER_ROUTES, UPDATE, DELETE } from '../../constants/serverRoutes.mjs'
import Loading from '../../components/Loading'
import EmptyCart from '../../components/EmptyCart'

const Cart = ({ productList, setCartIsChanged, user }) => {
   const [loading, setLoading] = useState(false)


   const updateProductAmount = async (productId, amount) => {
      try {
         setLoading(true)
         await apiServer.post(SERVER_ROUTES.CART + UPDATE, {
            params: { productId, amount, userId: user.id }
         })
         setLoading(false)
         setCartIsChanged((prev) => !prev)
      } catch (error) {
         console.error('Error sending data:', error)
      }
   }

   const deleteItem = async (productId) => {
      try {
         const response = await apiServer.post(SERVER_ROUTES + DELETE, {
            params: { productId, userId: user.id }
         })
         if (response.status === 200) {
            setCartIsChanged((prev) => !prev)
         }
      } catch (error) {
         console.error('Error deleting data:', error)
      }
   }

   return (
      <div className="page__cart cart">
         {productList.length === 0 && !loading && (
            <EmptyCart />
         )}
         {productList.length > 0 && (
            <>
               <div className="cart__header header-cart">
                  <div className="header-cart__container">
                     <ul className="header-cart__titels titles">
                        <li className="titles__item titles__item--details">Product Details</li>
                        <li className="titles__item titles__item--price">Price</li>
                        <li className="titles__item titles__item--quantity">Quantity</li>
                        <li className="titles__item titles__item--shipping">shipping</li>
                        <li className="titles__item titles__item--subtotal">subtotal</li>
                        <li className="titles__item titles__item--action">action</li>
                     </ul>
                  </div>
               </div>
               <div className="cart__body body-cart">
                  <div className="body-cart__container">
                     <div className="body-cart__items">
                        {loading && <Loading />}
                        {productList.map((item) => (
                           <div className="body-cart__item item" key={item.product._id}>
                              <div className="item__details details">
                                 <Link to={`/productCard/${item.product._id}`}>
                                    <img className="details__image" src={item.product.image[0]} alt="" />
                                 </Link>
                                 <div className="details__content content-details">
                                    <h3 className="content-details__titel">{item.product.name}</h3>
                                    <h4 className="content-details__color">{item.product.color.name}</h4>
                                    <h4 className="content-details__size">{item.product.size.name}</h4>
                                 </div>
                              </div>
                              <div className="item__price">${item.product.price}</div>
                              <div className="item__quantyty">
                                 <button
                                    className="item__button item__button--minus"
                                    disabled={item.amount <= 1}
                                    onClick={() => updateProductAmount(item.product._id, item.amount - 1)}
                                 >
                                    -
                                 </button>
                                 <div className="item__count">{item.amount}</div>
                                 <button
                                    className="item__button item__button--plus"
                                    disabled={loading}
                                    onClick={() => updateProductAmount(item.product._id, item.amount + 1)}
                                 >+
                                 </button>
                              </div>
                              <div className="item__shipping">FREE</div>
                              <div className="item__subtotal">${item.amount * (item.product?.price)}</div>
                              <div className="item__trash">
                                 <button
                                    className="item__link _icon-trash"
                                    onClick={() => deleteItem(item.product._id)}
                                 >

                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="cart-footer">
                        <div className="cart-footer__content">
                           <span className="cart-footer__title-summe">Total:  </span>
                           <span
                              className="cart-footer__summe"
                           >$ {productList.reduce((total, item) => total + (item.amount * (item.product?.price)), 0)}
                           </span>
                        </div>
                        <button className="cart-footer__button button">Proceed To Checkout</button>
                     </div>
                  </div>
               </div>
            </>
         )}
      </div>
   )
}

export default Cart