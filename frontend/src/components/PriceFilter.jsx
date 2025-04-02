import React, { useState, useEffect } from "react";
import noUiSlider from 'nouislider'
import wNumb from 'wnumb'

const PriceFilter = ({ filter, setFilter }) => {
   const [range, setRange] = useState([0, 1000])
   useEffect(() => {
      const filterRange = document.querySelector('.price-filter__range');

      if (filterRange && !filterRange.noUiSlider) {
         noUiSlider.create(filterRange, {
            start: range,
            connect: true,
            range: {
               'min': 0,
               'max': 1000
            },
            format: wNumb({
               decimals: 0,
               thousand: '',
               prefix: ''
            })
         });
         filterRange.noUiSlider.on('update', function (values) {
            setRange(values)

         })
         filterRange.noUiSlider.on('change', function (values) {
            setRange(values)
            setFilter((prev) => ({
               ...prev,
               priceFrom: values[0] > 0 ? [values[0]] : [],
               priceTo: values[1] < 1000 ? [values[1]] : []
            }))

         })

      }

      filterRange.noUiSlider.setHandle(0, Number(filter.priceFrom) || 0)
      filterRange.noUiSlider.setHandle(1, Number(filter.priceTo) || 1000)
   }, [filter.priceFrom, filter.priceTo])

   return (
      <div className="section-filter__price price-filter">
         <div className="price-filter__range">
         </div>
         <div className="price-filter__inputs">
            <input
               type="text"
               name="price-from"
               placeholder='0'
               className="price-filter__input price-filter__input--from"
               value={range[0] === '0' ? '' : '$' + range[0]}
               onChange={(e) => setRange([e.target.value, range[1]])}
               onKeyDown={(e) => {
                  e.key === "Enter" & range[0] > 0 && setFilter((prev) => { return { ...prev, priceFrom: [range[0]] } })
               }}
            />
            <input
               type="text"
               name="price-to"
               placeholder='1000'
               className="price-filter__input price-filter__input--to"
               value={range[1] === '1000' ? '' : '$' + range[1]}
               onChange={(e) => setRange([range[0], e.target.value])}
               onKeyDown={(e) => {
                  e.key === "Enter" & range[1] < 1000 && setFilter((prev) => { return { ...prev, priceTo: [range[1]] } })
               }}
            />
         </div>
      </div>
   );
};

export default PriceFilter;
