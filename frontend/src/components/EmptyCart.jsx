import { Link } from 'react-router-dom'

const EmptyCart = () => {
   return (
      <section className="cart__empty empty-cart">
         <div className="empty-cart__content">
            <div className="empty-cart__picture">
               <img src="/image/cart/empty-cart.svg" alt="" className="empty-cart__image" />
            </div>
            <h2 className="empty-cart__title">Your cart is empty and sad :(</h2>
            <p className="empty-cart__text">Add something to make it happy!</p>
            <Link to="/catalog" className="empty-cart__button button">Continue Shopping</Link>
         </div>
      </section>
   )

}

export default EmptyCart