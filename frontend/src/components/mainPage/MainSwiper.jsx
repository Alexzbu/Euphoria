import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';

const MainSwiper = () => {

   const slideCount = 3
   const slides = Array.from({ length: slideCount })

   return (
      <section className="page__hero hero">
         <div className="hero__wrapper">
            <Swiper
               modules={[Navigation, Pagination, Autoplay]}
               spaceBetween={50}
               slidesPerView={1}
               loop={true}
               speed={800}
               autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
               }}
               parallax={true}
               navigation={{
                  prevEl: '.hero__arrow--prev',
                  nextEl: '.hero__arrow--next',
               }}
               pagination={{
                  el: '.hero__pagination',
                  clickable: true,
               }}
            >
               {slides.map((_, index) => (
                  <SwiperSlide key={index}>
                     <div className="hero__slide slide-hero">
                        <div className="slide-hero__container">
                           <div className="slide-hero__body">
                              <div data-swiper-parallax="-80%" className="slide-hero__label">T-shirt / Tops</div>
                              <h2 data-swiper-parallax="-100%" className="slide-hero__title">Some other <br /> products</h2>
                              <div data-swiper-parallax="-60%" className="slide-hero__label">cool / colorful / comfy</div>
                              <Link data-swiper-parallax="-100%" to="/catalog" className="slide-hero__button button button--white">Shop Now</Link>
                           </div>
                        </div>
                        <img
                           src={`image/hero/slide-${index + 1}.jpg`}
                           className="slide-hero__image slide-hero__image--top-right"
                           alt=""
                        />
                     </div>
                  </SwiperSlide>
               ))}
            </Swiper>
         </div>
         <div className="hero__pagination"></div>
         <button className="hero__arrow hero__arrow--prev _icon-ch-left"></button>
         <button className="hero__arrow hero__arrow--next _icon-ch-right"></button>
      </section>
   )
}

export default MainSwiper
