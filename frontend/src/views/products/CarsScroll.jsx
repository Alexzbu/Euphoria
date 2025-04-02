import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiServer from '../../api/indexApi'
import Loading from '../../components/Loading'

const CarsScroll = ({ isAuthenticated }) => {
   const [data, setData] = useState([])
   const [page, setPage] = useState(0)
   const [filter, setFilter] = useState('')
   const [sort, setSort] = useState('')
   const [totalPages, setTotalPages] = useState(0)
   const [loading, setLoading] = useState(false)
   const [del, setDel] = useState(false)
   const navigate = useNavigate()
   const limit = 9

   const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
         setPage(prevPage => {
            if (prevPage <= totalPages) {
               return prevPage + 1
            } else {
               window.removeEventListener('scroll', handleScroll)
            }
            return prevPage
         })
      }

   }

   const fetchData = async () => {
      try {
         if (loading) return
         setLoading(true)
         const response = await apiServer.get('/cars', {
            params: { page, limit, sort, filter },
         })
         setData(prevData => [...prevData, ...response.data.carList])
         setTotalPages(Math.ceil(response.data.count / limit))
         setLoading(false)
      } catch (error) {
         console.error('Error fetching data:', error);
      }
   }

   useEffect(() => {
      fetchData()
   }, [page, sort, filter, del])

   useEffect(() => {
      window.addEventListener('scroll', handleScroll)
   }, [sort, filter, del])


   const deleteItem = async (id) => {
      try {
         const response = await apiServer.delete(`/cars/${id}`)
         if (response.status === 200) {
            setDel(true)
         }
      } catch (error) {
         console.error('Error deleting data:', error)
      }
   }

   return (
      <div className="container">
         <h1 className="title">List of fleet cars</h1>
         <div className='filter-block'>
            <div className="form">
               <input
                  className="form__input"
                  type="text"
                  placeholder="Filter by brand"
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setPage(0); setData([]) }}
               />
               <div className="form__select-wrapper">
                  <select className="form__select" onChange={(e) => { setSort(e.target.value); setPage(0); setData([]) }}>
                     <option value="">Sort by price:</option>
                     <option value="price:asc">Price: Low to high</option>
                     <option value="price:desc">Price: High to low</option>
                  </select>
               </div>
            </div>
         </div>
         <div className="car-list">
            {data.map((item, index) => (

               <div className="car-card" key={index}>
                  <Link to={`/carDetail/${item._id}`}>
                     <img className="car-card__image" src={item.image} alt={item.brand} />
                  </Link>
                  <h2 className="car-card__title">{item.brand} {item.year}</h2>
                  <p className="car-card__number">Price (hour): {item.price}$</p>
                  <p className="car-card__number">Location: {item.location?.title}</p>
                  {isAuthenticated && (
                     <div className="car-card__actions">
                        <button className="car-card__link delete-button" onClick={() => deleteItem(item._id)}>Remove</button>
                        <button className="car-card__link" onClick={() => navigate(`/addCar/${item._id}`)}>Edit</button>
                     </div>
                  )}
               </div>
            ))}
         </div>
         {loading &&
            <Loading />
         }
      </div>
   )
}

export default CarsScroll