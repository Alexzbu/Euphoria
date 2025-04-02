import { Link } from "react-router-dom"

const Footer = () => {

   return (
      <footer className="footer">
         <div className="footer__container">
            <div className="footer__menu menu-footer">
               <div className="menu-footer__block">
                  <h5 className="menu-footer__title">Need Help</h5>
                  <ul className="menu-footer__list">
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Contact Us</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Track Order</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Returns & Refunds</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">FAQ's</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Career</Link>
                     </li>
                  </ul>
               </div>
               <div className="menu-footer__block">
                  <h5 className="menu-footer__title">Company</h5>
                  <ul className="menu-footer__list">
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">About Us</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Euphoria Blog</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Euphoriastan</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Collaboration</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Media</Link>
                     </li>
                  </ul>
               </div>
               <div className="menu-footer__block">
                  <h5 className="menu-footer__title">More Info</h5>
                  <ul className="menu-footer__list">
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Term and Conditions</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Privacy Policy</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Shipping Policy</Link>
                     </li>
                     <li className="menu-footer__item">
                        <Link to="#" className="menu-footer__link">Sitemap</Link>
                     </li>
                  </ul>
               </div>
               <div className="menu-footer__block">
                  <h5 className="menu-footer__title">Location</h5>
                  <ul className="menu-footer__list">
                     <li className="menu-footer__item">
                        <Link to="mailto:support@euphoria.in" className="menu-footer__link">support@euphoria.in</Link>
                     </li>
                     <li className="menu-footer__item">
                        Eklingpura Chouraha, Ahmedabad Main Road
                     </li>
                     <li className="menu-footer__item">
                        (NH 8- Near Mahadev Hotel) Udaipur, India - 313002
                     </li>
                  </ul>
               </div>
            </div>
            <div className="footer__body">
               <div className="footer__social social-footer">
                  <ul className="social-footer__list">
                     <li className="social-footer__item">
                        <Link target="_blank" to="#" className="social-footer__link _icon-s-facebook"></Link>
                     </li>
                     <li className="social-footer__item">
                        <Link target="_blank" to="#" className="social-footer__link _icon-s-instagram"></Link>
                     </li>
                     <li className="social-footer__item">
                        <Link target="_blank" to="#" className="social-footer__link _icon-s-twitter"></Link>
                     </li>
                     <li className="social-footer__item">
                        <Link target="_blank" to="#" className="social-footer__link _icon-s-linkedin"></Link>
                     </li>
                  </ul>
               </div>
               <div className="footer__download download-apps">
                  <h5 className="download-apps__title">Download The App</h5>
                  <div className="download-apps__items">
                     <Link to="#" className="download-apps__item" target="_blank" >
                        <img src="image/google.svg" alt="Google Play" />
                     </Link>
                     <Link to="#" className="download-apps__item" target="_blank">
                        <img src="image/apple.svg" alt="Apple Store" />
                     </Link>
                  </div>
               </div>
            </div>
            <div className="footer__categories popular-categories">
               <h5 data-spoller className="popular-categories__title">
                  <button className="popular-categories__button-title _icon-ch-down">Popular Categories</button>
               </h5>
               <div className="popular-categories__body">
                  <ul className="popular-categories__list">
                     <li className="popular-categories__item">
                        <Link to="#" className="popular-categories__link">Men</Link>
                     </li>
                     <li className="popular-categories__item">
                        <Link to="#" className="popular-categories__link">Women</Link>
                     </li>
                  </ul>
               </div>
            </div>
            <div className="footer__copy">
               Copyright © 2023 Euphoria Folks Pvt Ltd. All rights reserved.
            </div>
         </div>
      </footer >
   )
}

export default Footer