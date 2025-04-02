import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import apiServer from '../../api/indexApi'
import { toast } from "react-hot-toast"

const AddProductForm = () => {
   const { id = '' } = useParams()
   const [name, setName] = useState('')
   const [price, setPrice] = useState('')
   const [description, setDescription] = useState('')
   const [brands, setBrands] = useState([])
   const [brand, setBrand] = useState('')
   const [sexs, setSexs] = useState([])
   const [sex, setSex] = useState('')
   const [colors, setColors] = useState([])
   const [color, setColor] = useState('')
   const [sizes, setSizes] = useState([])
   const [size, setSize] = useState('')
   const [categorys, setCategorys] = useState([])
   const [category, setCategory] = useState('')
   // const [errors, setErrors] = useState({})
   const navigate = useNavigate()
   const [images, setImages] = useState([]);

   const handleFileChange = (e) => {
      setImages(Array.from(e.target.files))
   }

   useEffect(() => {
      const fetchProduct = async () => {
         // if (id) {
         //    try {
         //       const response = await apiServer.get(`/cars/details/${id}`)
         //       setBrand(response.data.car.brand)
         //       setYear(response.data.car.year)
         //       setPrice(response.data.car.price)
         //       setDescription(response.data.car.description)
         //       setLocation(response.data.car.location?._id)
         //    } catch (error) {
         //       console.error('Error fetching car data:', error)
         //    }
         // }
      }
      const fetchProps = async () => {
         try {
            const brandResponse = await apiServer.get('/props/brand')
            setBrands(brandResponse.data)
            setBrand(brandResponse.data[0]._id)

            const sexResponse = await apiServer.get('/props/sex')
            setSexs(sexResponse.data)
            setSex(sexResponse.data[0]._id)

            const colorResponse = await apiServer.get('/props/color')
            setColors(colorResponse.data)
            setColor(colorResponse.data[0]._id)

            const sizeResponse = await apiServer.get('/props/size')
            setSizes(sizeResponse.data)
            setSize(sizeResponse.data[0]._id)

            const categoryResponse = await apiServer.get('/props/category')
            setCategorys(categoryResponse.data)
            setCategory(categoryResponse.data[0]._id)
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
         const formData = new FormData();
         formData.append('name', name);
         formData.append('price', price);
         formData.append('description', description);
         formData.append('brand', brand);
         formData.append('sex', sex);
         formData.append('color', color);
         formData.append('size', size);
         formData.append('category', category);
         if (images.length > 0) {
            for (let i = 0; i < images.length; i++) {
               formData.append('productImage', images[i]);
            }
         }
         const response = await apiServer.post(`/products/add/${id}`, formData, {
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
         // setErrors(error.response.data)
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
                     <select value={brand} name="brand" id="brand" className="form__select" onChange={(e) => setBrand(e.target.value)}>
                        {brands.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=brand">Edit</Link>
               </div>

               <label className="form__label">Sex:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={sex} name="sex" id="sex" className="form__select" onChange={(e) => setSex(e.target.value)}>
                        {sexs.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=sex">Edit</Link>
               </div>

               <label className="form__label">Color:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={color} name="color" id="color" className="form__select" onChange={(e) => setColor(e.target.value)}>
                        {colors.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=color">Edit</Link>
               </div>

               <label className="form__label">Size:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={size} name="size" id="size" className="form__select" onChange={(e) => setSize(e.target.value)}>
                        {sizes.map((item) => (
                           < option value={item._id} key={item._id}>{item.name}</option>
                        ))}
                     </select>
                  </div>
                  <Link className="form__link menu__link" to="/props/?title=size">Edit</Link>
               </div>

               <label className="form__label">Category:</label>
               <div className="form__select-wrapper">
                  <div className="form__select-item">
                     <select value={category} name="category" id="category" className="form__select" onChange={(e) => setCategory(e.target.value)}>
                        {categorys.map((item) => (
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
               />

               <label className="form__label">Price:</label>
               <input
                  className="form__input"
                  ype="number"
                  id="price"
                  name="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
               />

               <label className="form__label">Description:</label>
               <textarea
                  className="form__textarea"
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
