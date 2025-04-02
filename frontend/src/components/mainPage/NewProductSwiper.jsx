import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';

const NewProductSwiper = () => {

   const slideCount = 4
   const slides = Array.from({ length: slideCount })

   return (
      <section className="page__new new">
         <div className="new__container">
            <h2 className="new__title title title--margin">New Arrival</h2>
            <div className="new__slider swiper">
               <div className="new__wrapper swiper-wrapper">
                  <Swiper
                     modules={[Navigation, Autoplay]}
                     spaceBetween={38}
                     slidesPerView={3}
                     loop={true}
                     speed={800}
                     autoplay={{
                        delay: 2500,
                        disableOnInteraction: false,
                     }}
                     navigation={{
                        prevEl: '.new__arrow--left',
                        nextEl: '.new__arrow--right',
                     }}
                  >
                     {slides.map((_, index) => (
                        <SwiperSlide key={index}>
                           <div className="new__slide swiper-slide">
                              <article className="new__item item-new">
                                 <Link href="#" className="item-new__link">
                                    <img src={`image/new/0${index + 1}.jpg`} className="item-new__image" alt="Slide" />
                                    <h5 className="item-new__title">Knitted Joggers</h5>
                                 </Link>
                              </article>
                           </div>
                        </SwiperSlide>
                     ))}
                  </Swiper>
               </div>
               <button className="new__arrow new__arrow--left _icon-a-left"></button>
               <button className="new__arrow new__arrow--right _icon-a-right"></button>
            </div>
         </div>
      </section>
   )
}

export default NewProductSwiper
