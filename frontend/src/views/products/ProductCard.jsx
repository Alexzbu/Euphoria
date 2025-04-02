
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import apiServer from '../../api/indexApi'
import { toast } from "react-hot-toast"

const ProductCard = ({ user, setCartIsChanged }) => {
   const { id = '' } = useParams()
   const [loading, setLoading] = useState(false)
   const [product, setProduct] = useState({})
   const [thumbsSwiper, setThumbsSwiper] = useState(null)
   const [props, setProps] = useState({})
   const [colorToSearch, setColorToSearch] = useState('')

   useEffect(() => {
      const fetchProduct = async () => {
         if (id) {
            try {
               const response = await apiServer.get(`/products/details/${id}`)
               setProduct(response.data.product)
               const propsResponse = await apiServer.get(`/products/props`, {
                  params: { name: response.data.product.name },
               })
               setProps(propsResponse.data[0])
            } catch (error) {
               console.error('Error fetching product data:', error);
            }
         }
      };

      fetchProduct();
   }, [])

   useEffect(() => {
      const fetchProductByColor = async () => {
         if (colorToSearch) {
            try {
               const response = await apiServer.get(`/products/details`, {
                  params: { name: product?.name, color: colorToSearch }
               });
               setProduct(response.data.product)
            } catch (error) {
               console.error('Error fetching product data:', error);
            }
         }
      }

      fetchProductByColor()
   }, [colorToSearch])

   const addProductToCart = async () => {

      if (!user) {
         toast('Please sign in to add this product to your cart')
         return
      }
      try {
         setLoading(true)
         const response = await apiServer.post(`/cart/add`, {
            params: { productId: product._id, userId: user.id }
         })
         toast.success('This product was added to your cart')
         setLoading(false)
         setCartIsChanged((prev) => !prev)
      } catch (error) {
         console.error('Error sending data:', error);
      }
   }

   return (
      <main className="page">
         <div className="page__product product">
            <section className="product__main main-product">
               <div className="main-product__container">
                  <div className="main-product__body">
                     <ul className="main-product__breadcrumbs breadcrumbs">
                        <li className="breadcrumbs__item _icon-ch-right">
                           <a href="#" className="breadcrumbs__link">Shop</a>
                        </li>
                        <li className="breadcrumbs__item _icon-ch-right">
                           <a href="#" className="breadcrumbs__link">Women</a>
                        </li>
                        <li className="breadcrumbs__item">
                           <span className="breadcrumbs__current">Top</span>
                        </li>
                     </ul>
                     <h1 className="main-product__title">{product?.name}</h1>
                     <div className="main-product__rating-comments">
                        {/* <!-- Rating --> */}
                        <div data-rating="4.5" className="rating">
                           <div className="rating__items">
                              <label className="rating__item">
                                 <input className="rating__input" type="radio" name="rating" value="1" />
                              </label>
                              <label className="rating__item">
                                 <input className="rating__input" type="radio" name="rating" value="2" />
                              </label>
                              <label className="rating__item">
                                 <input className="rating__input" type="radio" name="rating" value="3" />
                              </label>
                              <label className="rating__item">
                                 <input className="rating__input" type="radio" name="rating" value="4" />
                              </label>
                              <label className="rating__item">
                                 <input className="rating__input" type="radio" name="rating" value="5" />
                              </label>
                           </div>
                           <div className="rating__value">3.5</div>
                        </div>
                        <a href="#" className="main-product__comments _icon-comment">120 comment</a>
                     </div>
                     <div className="main-product__sizes sizes-product">
                        <div className="sizes-product__header">
                           <h5 className="sizes-product__title">Select Size</h5>
                           <a href="#" className="sizes-product__guide _icon-a-right">Size Guide</a>
                        </div>
                        <div className="sizes-product__items">
                           {props?.sizes?.map((item, index) => (
                              <label className="sizes-product__item" key={index}>
                                 {item}
                                 <input type="radio" value={item} className="sizes-product__input" name="product-size" />
                              </label>
                           ))}
                        </div>
                     </div>
                     <div className="main-product__colors colors-product">
                        <h5 className="colors-product__title">Colours Available</h5>
                        <div className="colors-product__items">
                           {props?.colors?.map((item, index) => (
                              <label style={{ '--color': item }} className="colors-product__item" key={index}>
                                 <input
                                    checked={item === product?.color?.name}
                                    type="radio"
                                    value={item}
                                    className="colors-product__input"
                                    name="product-colors"
                                    onChange={(e) => setColorToSearch(e.target.value)}
                                 />
                              </label>
                           ))}
                        </div>
                     </div>
                     <div className="main-product__footer">
                        <button
                           className="main-product__button button"
                           disabled={loading}
                           onClick={addProductToCart}
                        >
                           <span
                              className="_icon-cart"
                           >{loading ? "Adding..." : "Add to cart"}
                           </span>
                        </button>
                        <div className="main-product__price">${product?.price}</div>
                     </div>
                     <div className="main-product__info info-product">
                        <div className="info-product__item _icon-credit-cart">Secure payment</div>
                        <div className="info-product__item _icon-size-fit">Size & Fit</div>
                        <div className="info-product__item _icon-truck">Free shipping</div>
                        <div className="info-product__item _icon-free-shiping">Free Shipping & Returns</div>
                     </div>
                  </div>
                  <div className="main-product__images">
                     <div className="main-product__thumb-slider thumb-slider">
                        <div className="thumb-slider__slider swiper">
                           <Swiper
                              onSwiper={setThumbsSwiper}
                              spaceBetween={20}
                              slidesPerView={3}
                              direction='vertical'
                              loop={true}
                              speed={800}
                              className="thumb-slider__wrapper swiper-wrapper"
                           >
                              {product?.image?.map((image, index) => (
                                 <SwiperSlide key={index}>
                                    <div className="thumb-slider__slide">
                                       <img src={image} className="thumb-slider__image" alt="Image" />
                                    </div>
                                 </SwiperSlide>
                              ))}
                           </Swiper>

                        </div>
                        <div className="thumb-slider__arrows">
                           <button type="button" className="thumb-slider__arrow thumb-slider__arrow--up _icon-ch-up"></button>
                           <button type="button" className="thumb-slider__arrow thumb-slider__arrow--down _icon-ch-down"></button>
                        </div>
                     </div>
                     <div className="main-product__slider swiper">
                        <div className="main-product__wrapper swiper-wrapper">
                           <Swiper
                              modules={[Navigation, Thumbs]}
                              spaceBetween={0}
                              slidesPerView={1}
                              loop={true}
                              speed={800}
                              navigation={{
                                 nextEl: '.thumb-slider__arrow--down',
                                 prevEl: '.thumb-slider__arrow--up',
                              }}
                              thumbs={{ swiper: thumbsSwiper }}
                           >
                              {product?.image?.map((image, index) => (
                                 <SwiperSlide key={index}>
                                    <div className="main-product__slide">
                                       <img src={image} className="main-product__image" alt="Image" />
                                    </div>
                                 </SwiperSlide>
                              ))}
                           </Swiper>
                        </div>
                     </div>
                  </div>
               </div>
            </section>
            <section className="product__description description">
               <div className="description__container">
                  <h2 className="description__title title">Product Description</h2>
                  <div className="description__body">
                     <div data-tabs className="description__tabs tabs">
                        <ul className="tabs__navigation">
                           <li data-tabs-button className="tabs__item active">
                              <button className="tabs__button">Description</button>
                           </li>
                           <li data-tabs-button className="tabs__item">
                              <button className="tabs__button">User comments <span
                                 className="tabs__comment-info">21</span></button>
                           </li>
                           <li data-tabs-button className="tabs__item">
                              <button className="tabs__button">Question & Answer<span
                                 className="tabs__faq-info">4</span></button>
                           </li>
                        </ul>
                        <div className="tabs__body">
                           <div data-tabs-element className="tabs__element">
                              <div className="product-description">
                                 <div className="product-description__text">
                                    <p>{product?.description}</p>
                                 </div>
                                 <div className="product-description__table">
                                    <div className="product-description__item">
                                       <div className="product-description__label">Fabric</div>
                                       <div className="product-description__value">Bio-washed Cotton</div>
                                    </div>
                                    <div className="product-description__item">
                                       <div className="product-description__label">Pattern</div>
                                       <div className="product-description__value">Printed</div>
                                    </div>
                                    <div className="product-description__item">
                                       <div className="product-description__label">Fit</div>
                                       <div className="product-description__value">Regular-fit</div>
                                    </div>
                                    <div className="product-description__item">
                                       <div className="product-description__label">Neck</div>
                                       <div className="product-description__value">Round Neck</div>
                                    </div>
                                    <div className="product-description__item">
                                       <div className="product-description__label">Sleeve</div>
                                       <div className="product-description__value">Half-sleevess</div>
                                    </div>
                                    <div className="product-description__item">
                                       <div className="product-description__label">Style</div>
                                       <div className="product-description__value">Casual Wear</div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div data-tabs-element hidden className="tabs__element">
                              2
                           </div>
                           <div data-tabs-element hidden className="tabs__element">
                              3
                           </div>
                        </div>
                     </div>
                     {/* <iframe className="description__video"
                        src="https://www.youtube.com/embed/fvrrpexa-gI?si=baBsH57NSPXI1WRb" title="YouTube video player"
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                        allowFullScreen></iframe> */}
                  </div>
               </div>
            </section>
            <section className="product__products products">
               <div className="products__container">
                  <h2 className="products__title title">Similar Products</h2>
                  <div className="products__items">
                     <article className="item-product">
                        <a href="#" className="item-product__favorite _icon-favorite"></a>
                        <a href="#" className="item-product__picture-link">
                           <img src="img/modules/for-men/01.jpg" className="item-product__image" alt="Image" />
                        </a>
                        <div className="item-product__body">
                           <h4 className="item-product__title">
                              <a href="#" className="item-product__link-title">Lorem ipsum dolor sit amet consectetur
                                 adipisicing elit. Nemo, molestias!</a>
                           </h4>
                           <div className="item-product__label">Explore Now!</div>
                           <div className="item-product__price">$38.00</div>
                        </div>
                     </article>
                     <article className="item-product">
                        <a href="#" className="item-product__favorite _icon-favorite"></a>
                        <a href="#" className="item-product__picture-link">
                           <img src="img/modules/for-men/01.jpg" className="item-product__image" alt="Image" />
                        </a>
                        <div className="item-product__body">
                           <h4 className="item-product__title">
                              <a href="#" className="item-product__link-title">Lorem ipsum dolor sit amet consectetur
                                 adipisicing elit. Nemo, molestias!</a>
                           </h4>
                           <div className="item-product__label">Explore Now!</div>
                           <div className="item-product__price">$38.00</div>
                        </div>
                     </article>
                     <article className="item-product">
                        <a href="#" className="item-product__favorite _icon-favorite"></a>
                        <a href="#" className="item-product__picture-link">
                           <img src="img/modules/for-men/01.jpg" className="item-product__image" alt="Image" />
                        </a>
                        <div className="item-product__body">
                           <h4 className="item-product__title">
                              <a href="#" className="item-product__link-title">Lorem ipsum dolor sit amet consectetur
                                 adipisicing elit. Nemo, molestias!</a>
                           </h4>
                           <div className="item-product__label">Explore Now!</div>
                           <div className="item-product__price">$38.00</div>
                        </div>
                     </article>
                     <article className="item-product">
                        <a href="#" className="item-product__favorite _icon-favorite"></a>
                        <a href="#" className="item-product__picture-link">
                           <img src="img/modules/for-men/01.jpg" className="item-product__image" alt="Image" />
                        </a>
                        <div className="item-product__body">
                           <h4 className="item-product__title">
                              <a href="#" className="item-product__link-title">Lorem ipsum dolor sit amet consectetur
                                 adipisicing elit. Nemo, molestias!</a>
                           </h4>
                           <div className="item-product__label">Explore Now!</div>
                           <div className="item-product__price">$38.00</div>
                        </div>
                     </article>
                  </div>
               </div>
            </section>
         </div >
      </main >
   )
}

export default ProductCard