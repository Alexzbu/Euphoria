import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiServer from '../api/indexApi'
import Loading from '../components/Loading'
import { userType } from '../constants/userType.mjs'
import { filterSpoller } from '../utils/spollers/filterSpoller.mjs'
import PriceFilter from '../components/PriceFilter'

const Catalog = ({ user, search }) => {
   const [products, setProducts] = useState([])
   const [filter, setFilter] = useState({})
   const [categories, setCategories] = useState([])
   const [colors, setColors] = useState([])
   const [sizes, setSizes] = useState([])
   const [brands, setBrands] = useState([])
   const [loading, setLoading] = useState(false)


   useEffect(() => {
      filterSpoller()
      const fetchData = async () => {
         try {
            setLoading(true)
            const response = await apiServer.get('/products', {
               params: { filter, search }
            })
            setProducts(response.data)
            if (categories.length === 0) {
               const [categoryResponse, colorResponse, sizeResponse, brandResponse] = await Promise.all([
                  apiServer.get('/props/category'),
                  apiServer.get('/props/color'),
                  apiServer.get('/props/size'),
                  apiServer.get('/props/brand')
               ]);

               setCategories(categoryResponse.data);
               setColors(colorResponse.data);
               setSizes(sizeResponse.data);
               setBrands(brandResponse.data);
            }
         } catch (error) {
            console.error('Error fetching data:', error);
         } finally {
            setLoading(false);
         }
      }
      fetchData()
      window.scrollTo(0, 0)
   }, [filter, search])

   return (
      <main className="page">
         <div className="page__catalog catalog">
            <section className="catalog__main">
               <div className="catalog__container">
                  <aside className="catalog__filter filter">
                     <h4 data-spoller="open" data-spoller-media="max,991.98" className="filter__title title-filter">
                        <button type="button" className="title-filter__button title-filter__button--main _icon-filter">Filter</button>
                     </h4>
                     <form className="filter__body">
                        <div className="filter__section section-filter">
                           <h5 data-spoller="open" className="section-filter__title title-filter">
                              <button type="button" className="title-filter__button _icon-ch-down">Category</button>
                           </h5>
                           <div className="section-filter__body">
                              <div className="section-filter__style style-filter" >
                                 {categories.map((item) => (
                                    <label className="style-filter__item _icon-ch-right" key={item._id}>
                                       <input
                                          type="checkbox"
                                          name="category"
                                          className="style-filter__input"
                                          value={item.name}
                                          checked={filter?.category?.includes(item.name) || false}
                                          onChange={(e) => {
                                             setFilter((previous) => {
                                                const isSelected = previous?.category?.includes(e.target.value);
                                                return {
                                                   ...previous,
                                                   category: isSelected
                                                      ? previous.category.filter((cat) => cat !== e.target.value) // Remove if already selected
                                                      : [...(previous.category || []), e.target.value], // Add if not selected
                                                };
                                             });
                                          }}
                                       />
                                       {item.name}
                                    </label>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="filter__section section-filter">
                           <h5 data-spoller="open" className="section-filter__title title-filter">
                              <button type="button" className="title-filter__button _icon-ch-down">Price</button>
                           </h5>
                           <div className="section-filter__body">
                              <PriceFilter filter={filter} setFilter={setFilter} />
                           </div>
                        </div>
                        <div className="filter__section section-filter">
                           <h5 data-spoller="open" className="section-filter__title title-filter">
                              <button type="button" className="title-filter__button _icon-ch-down">Colors</button>
                           </h5>
                           <div className="section-filter__body">
                              <div className="section-filter__colors colors-filter" >
                                 {colors.map((item) => (
                                    <label style={{ '--color': item.name }} className="colors-filter__item" key={item._id}>
                                       <input
                                          type="checkbox"
                                          name="color"
                                          className="colors-filter__input"
                                          value={item.name}
                                          checked={filter?.color?.includes(item.name) || false}
                                          onChange={(e) => {
                                             setFilter((previous) => {
                                                const isSelected = previous?.color?.includes(e.target.value);
                                                return {
                                                   ...previous,
                                                   color: isSelected
                                                      ? previous.color.filter((cat) => cat !== e.target.value) // Remove if already selected
                                                      : [...(previous.color || []), e.target.value], // Add if not selected
                                                };
                                             });
                                          }}
                                       />
                                       {item.name}
                                    </label>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="filter__section section-filter">
                           <h5 data-spoller="open" className="section-filter__title title-filter">
                              <button type="button" className="title-filter__button _icon-ch-down">Size</button>
                           </h5>
                           <div className="section-filter__body">
                              <div className="section-filter__size size-filter">
                                 {sizes.map((item) => (
                                    <label className="size-filter__item" key={item._id}>
                                       <input
                                          type="checkbox"
                                          name="size"
                                          className="size-filter__input"
                                          value={item.name}
                                          checked={filter?.size?.includes(item.name) || false}
                                          onChange={(e) => {
                                             setFilter((previous) => {
                                                const isSelected = previous?.size?.includes(e.target.value);
                                                return {
                                                   ...previous,
                                                   size: isSelected
                                                      ? previous.size.filter((cat) => cat !== e.target.value) // Remove if already selected
                                                      : [...(previous.size || []), e.target.value], // Add if not selected
                                                };
                                             });
                                          }}
                                       />
                                       {item.name}
                                    </label>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="filter__section section-filter">
                           <h5 data-spoller="open" className="section-filter__title title-filter">
                              <button type="button" className="title-filter__button _icon-ch-down">Brand</button>
                           </h5>
                           <div className="section-filter__body">
                              <div className="section-filter__style style-filter">
                                 {brands.map((item) => (
                                    <label className="style-filter__item _icon-ch-right" key={item._id}>
                                       <input
                                          type="checkbox"
                                          name="brand"
                                          className="style-filter__input"
                                          value={item.name}
                                          checked={filter?.brand?.includes(item.name) || false}
                                          onChange={(e) => {
                                             setFilter((previous) => {
                                                const isSelected = previous?.brand?.includes(e.target.value);
                                                return {
                                                   ...previous,
                                                   brand: isSelected
                                                      ? previous.brand.filter((cat) => cat !== e.target.value) // Remove if already selected
                                                      : [...(previous.brand || []), e.target.value], // Add if not selected
                                                };
                                             });
                                          }}
                                       />
                                       {item.name}
                                    </label>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </form>
                  </aside>
                  <div className="catalog__body">
                     {filter && Object.values(filter).some(arr => arr.length > 0) &&
                        <div className="catalog__filter-reset filter-reset">
                           <ul className="filter-reset__items items">
                              {Object.entries(filter).flatMap(([key, values]) =>
                                 values.map((item, index) => (
                                    <li key={`${key}-${index}`} className="items__item">
                                       <button
                                          className="items__button _icon-close"
                                          onClick={() => setFilter((prev) => ({
                                             ...prev,
                                             [key]: prev[key].filter((f) => f !== item) // Remove item from array
                                          }))}
                                       >
                                          {item}
                                       </button>
                                    </li>
                                 ))
                              )}
                           </ul>
                           <div className="filter-reset__reset reset">
                              <button className="reset__button _icon-close"
                                 onClick={() => setFilter({})}
                              >Reset
                              </button>
                           </div>
                        </div>
                     }
                     {user?.role === userType.ADMIN &&
                        <Link to="/addProduct" className="catalog__add-button button">Add procuct</Link>
                     }
                     <div className="catalog__header">
                        <h1 className="catalog__title">{search === 'Men' ? 'Men' : search === 'Women' ? 'Women' : 'Catalog'}</h1>
                        <ul className="catalog__type type-catalog">
                           <li className="type-catalog__item">
                              <button className="type-catalog__button type-catalog__button--active">New</button>
                           </li>
                           <li className="type-catalog__item">
                              <button className="type-catalog__button">Recommended</button>
                           </li>
                        </ul>
                     </div>
                     <div className="catalog__items">
                        {products?.length === 0 && !loading && (<h2>NO MATCHES FOUND</h2>)}
                        {products.map((item) => (
                           < article className="item-product" key={item._id}>
                              <Link to={`/productCard/${item._id}`} className="item-product__picture-link">
                                 <img src={item.image} className="item-product__image" alt={item.name} />
                              </Link>
                              <div className="item-product__body">
                                 <h4 className="item-product__title">
                                    <span className="item-product__link-title">{item.name}</span>
                                 </h4>
                                 <div className="item-product__label">Explore Now!</div>
                                 <div className="item-product__price">$ {item.price}</div>
                              </div>
                           </article>
                        ))}
                        {loading && <Loading />}
                     </div>
                  </div>
               </div>
            </section>
         </div >
         <script src="js/script.js"></script>
      </main >
   )
}

export default Catalog