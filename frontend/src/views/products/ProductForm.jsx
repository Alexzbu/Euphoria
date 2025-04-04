import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiServer from '../../api/indexApi'
import { SERVER_ROUTES, ADD } from '../../constants/serverRoutes.mjs'
import { toast } from "react-hot-toast"
import { getProps } from '../../utils/getProps.mjs'

const AddProductForm = () => {
   const { id = '' } = useParams()
   const [product, setProduct] = useState(null)
   const [props, setProps] = useState(null)
   // const [errors, setErrors] = useState({})
   const navigate = useNavigate()
   const [images, setImages] = useState([]);

   const handleFileChange = (e) => {
      setImages(Array.from(e.target.files))
   }

   useEffect(() => {
      const fetchProduct = async () => {

      }
      const fetchProps = async () => {
         try {
            const props = await getProps()
            setProps(props)
         } catch (error) {
            console.error('Error fetching props:', error)
         }
      }
      fetchProduct()
      fetchProps()
   }, [])

   // const validateForm = () => {
   //    const newErrors = {}

   //    if (!brand.trim()) {
   //       newErrors.brand = 'Brand is required.'
   //    }
   //    if (brand.length > 30) {
   //       newErrors.brand = 'Brand must be at most 30 characters long.'
   //    }

   //    if (!year || year < 1886 || year > new Date().getFullYear()) {
   //       newErrors.year = 'Please enter a valid year.'
   //    }

   //    if (!price || price <= 0) {
   //       newErrors.price = 'Price must be greater than 0.'
   //    }

   //    if (!description.trim()) {
   //       newErrors.description = 'Description is required.'
   //    }

   //    if (!image && !id) { // Image is required only for adding a new car
   //       newErrors.image = 'Image is required.'
   //    }

   //    setErrors(newErrors)

   //    return Object.keys(newErrors).length === 0
   // }


   const sendForm = async () => {
      // if (!validateForm()) {
      //    return
      // }
      try {
         const formData = new FormData()
         if (images.length > 0) {
            for (let i = 0; i < images.length; i++) {
               formData.append('productImage', images[i])
            }
         }
         formData.append('product', JSON.stringify(product))

         const response = await apiServer.post(`${SERVER_ROUTES.PRODUCTS}${ADD}`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         })
         if (response.status === 200) {
            navigate('/catalog')
         }

      } catch (error) {
         if (error.response.status === 401 || 403) {
            toast.error('Access Denied')
         }
         console.error('Error adding product:', error)
      }
   };

   return (
      <main className="add-product">
         <div className="add-product__container">
            <h1 className="add-product__title title">Add new product</h1>
            <div className="form">
               <label className="form__label">Brand:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={props?.brands?.[0]._id}
                        name="brand"
                        id="brand"
                        className="form__select"
                        onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                     >
                        {props?.brands?.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=brand">Edit</Link>
               </div>

               <label className="form__label">Sex:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={props?.sexes?.[0]._id}
                        name="sex"
                        id="sex"
                        className="form__select"
                        onChange={(e) => setProduct({ ...product, sex: e.target.value })}
                     >
                        {props?.sexes?.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=sex">Edit</Link>
               </div>

               <label className="form__label">Color:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={props?.colors?.[0]._id}
                        name="color" id="color"
                        className="form__select"
                        onChange={(e) => setProduct({ ...product, color: e.target.value })}
                     >
                        {props?.colors?.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=color">Edit</Link>
               </div>

               <label className="form__label">Size:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={props?.sizes?.[0]._id}
                        name="size"
                        id="size"
                        className="form__select"
                        onChange={(e) => setProduct({ ...product, size: e.target.value })}
                     >
                        {props?.sizes?.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=size">Edit</Link>
               </div>

               <label className="form__label">Category:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={props?.categories?.[0]._id}
                        name="category" id="category"
                        className="form__select"
                        onChange={(e) => setProduct({ ...product, category: e.target.value })}
                     >
                        {props?.categorys?.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=category">Edit</Link>
               </div>
               <label className="form__label">Name:</label>
               <input className="form__input"
                  type="text"
                  id="name"
                  name="name"
                  value={product?.name ?? ""}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
               />

               <label className="form__label">Price:</label>
               <input
                  className="form__input"
                  ype="number"
                  id="price"
                  name="price"
                  value={product?.price ?? ""}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
               />

               <label className="form__label">Description:</label>
               <textarea
                  className="form__textarea"
                  id="description"
                  name="description"
                  value={product?.description ?? ""}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
               ></textarea>
               <ul>
                  {images.map((file, index) => (
                     <li key={index}>{file.name}</li>
                  ))}
               </ul>
               <label className="form__label" htmlFor="image">Image:</label>
               <input
                  className="form__input"
                  type="file"
                  id="image"
                  name="image"
                  multiple
                  onChange={handleFileChange}
               />

               <button className="form__button button" onClick={sendForm}>
                  Add
               </button>
            </div>
         </div>
      </main >
   );
};

export default AddProductForm;
