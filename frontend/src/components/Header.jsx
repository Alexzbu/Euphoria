import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import apiServer from '../api/indexApi'
import { SERVER_ROUTES } from '../constants/serverRoutes.mjs'
import { ROUTES } from '../constants/routes.mjs'
import { useLocation } from "react-router-dom"
import { LOCAL_STORAGE } from '../constants/localStorage.mjs'

const Header = ({ user, setUser, search, setSearch, productList }) => {
   const navigate = useNavigate()
   const { pathname } = useLocation()

   const handleLogout = async () => {
      try {
         await apiServer.get(SERVER_ROUTES.LOGOUT)
         localStorage.removeItem(LOCAL_STORAGE.USER)
         setUser(null)
         navigate(ROUTES.CATALOG)
      } catch (error) {
         console.error('Error logout:', error)
      }
   }

   const checkPath = () => {
      if (pathname !== ROUTES.CATALOG) {
         navigate(ROUTES.CATALOG)
      }
   }

   return (
      <header className="header">
         <div className="header__container">
            <Link onClick={() => setSearch('')} to="/"><img className="header__logo" src="/image/logo.svg" alt="Logo" /></Link>
            <div className="header__menu menu">
               <nav className="menu__body">
                  <ul className="menu__list">
                     <li className="menu__item">
                        <Link
                           to={ROUTES.CATALOG}
                           className={`menu__link ${search !== 'Men' && search !== 'Women' && pathname === ROUTES.CATALOG ? 'active' : ''}`}
                           onClick={() => setSearch('')}
                        >Catalog
                        </Link>
                     </li>
                     <li className="menu__item">
                        <Link
                           to={ROUTES.CATALOG}
                           className={`menu__link ${search === 'Men' ? 'active' : ''}`}
                           onClick={() => setSearch('Men')}
                        >Men
                        </Link>
                     </li>
                     <li className="menu__item">
                        <Link
                           to={ROUTES.CATALOG}
                           className={`menu__link ${search === 'Women' ? 'active' : ''}`}
                           onClick={() => setSearch('Women')}
                        >Women
                        </Link>
                     </li>
                  </ul>
               </nav>
            </div>
            <form className="header__search search-form">
               <input
                  className="search-form__input"
                  placeholder="Search"
                  type="search"
                  onChange={(e) => {
                     setSearch(e.target.value)
                     checkPath()
                  }}
               />
            </form>
            <div className="header__action action-header">
               {user ? (
                  <>
                     <NavLink to={ROUTES.FAVORITE} className="action-header__item _icon-favorite"></NavLink>
                     <button className="action-header__item _icon-user" onClick={handleLogout}></button>
                  </>
               ) : (
                  <>
                     <NavLink to={ROUTES.LOGIN} className="action-header__button button button--white">Sign in</NavLink>
                  </>
               )}
               <NavLink to={ROUTES.CART} className="action-header__item _icon-cart">
                  {productList.length > 0 && (
                     <span>{productList.reduce((total, item) => total + item.amount, 0)}</span>
                  )}
               </NavLink>
            </div>
            <button className="icon-menu"><span></span></button>
         </div>
      </header >
   )
}

export default Header