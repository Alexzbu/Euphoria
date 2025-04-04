import React, { useState, useEffect } from 'react'
import apiServer from '../../api/indexApi'
import Loading from '../../components/Loading'
import { useNavigate, useSearchParams } from 'react-router-dom'

const Props = () => {
   const [searchParams] = useSearchParams()
   const title = searchParams.get('title')
   const [data, setData] = useState([])
   const [loading, setLoading] = useState(true)
   const navigate = useNavigate()

   useEffect(() => {
      const fetchData = async () => {
         try {
            setLoading(true)
            const response = await apiServer.get(`/props/${title}`)
            setData(response.data)
            setLoading(false)
         } catch (error) {
            console.error('Error fetching data:', error)
         }
      }
      fetchData();
   }, [])

   const deleteItem = async (id) => {
      try {
         const response = await apiServer.delete(`/locations/${id}`)
         if (response.status === 200) {
            window.location.reload()
         }
      } catch (error) {
         console.error('Error deleting data:', error)
      }
   }

   return (
      <main className="props-list">
         <div className="props-list__container">
            <h1 className="props-list__title title">Props list</h1>
            <ul className="props-list__items">
               {data.map((item) => (
                  <li className="props-list__item item" key={item._id}>{item.name}
                     <div className="item__action">
                        <a className="item__link menu__link" href="#">Edit</a>
                        <a className="item__link menu__link" href="#">Delete</a>
                     </div>
                  </li>
               ))}
            </ul>
            <button className=" button" onClick={() => navigate(`/addProps/${title}`)}>Add new</button>
         </div>
      </main>
   )
}

export default Props