import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiServer from '../../api/indexApi'

const Register = () => {
   const [username, setUsername] = useState('')
   const [password, setPassword] = useState('')
   const [passwordConfirm, setPasswordConfirm] = useState('')
   const [errors, setErrors] = useState({})
   const navigate = useNavigate()

   const validateForm = () => {
      const newErrors = {}

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(username)) {
         newErrors.username = 'Invalid email format.'
      }
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(password)) {
         newErrors.password = 'Use 8 or more characters with a mix of letters, numbers & symbols.'
      }

      if (passwordConfirm !== password) {
         newErrors.passwordConfirm = 'Passwords do not match'
      }

      setErrors(newErrors)

      return Object.keys(newErrors).length === 0
   }

   const sendForm = async () => {
      if (!validateForm()) {
         return
      }
      try {
         const response = await apiServer.post('/auth/signup', {
            username, password
         })
         if (response.status === 200) {
            navigate('/login')
         }
      } catch (error) {
         setErrors(error.response.data)
         console.error('Error fetching data:', error)
      }
   }
   return (
      <section className="section sign-up">
         <img className="sign-up__image" src="image/sign/sign-up.jpg" alt="" />
         <div className="sign-up__container">
            <div className="sign-up__body">
               <h1 className="sign-up__title title">Sign Up</h1>
               <div className="sign-up__form form">
                  <label className="form__label">Email address</label>
                  <div className="form__group form__group--input">
                     <input
                        className="form__input"
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                     />
                     {errors.username && <span className="form__error">{errors.username}</span>}

                  </div>
                  <div className="form__pass-box">
                     <label className="form__label">Password</label>
                     <span className="_icon-eye-hide">Hide</span>
                  </div>
                  <div className="form__group form__group--input">
                     <input
                        className="form__input"
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                     {errors.password && <span className="form__error">{errors.password}</span>}
                  </div>
                  <div className="form__pass-box">
                     <label className="form__label">Confirm password</label>
                     <span className="_icon-eye-hide">Hide</span>
                  </div>
                  <div className="form__group form__group--input">
                     <input
                        className="form__input"
                        type="password"
                        id="passwordConfirm"
                        name="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                     />
                     {errors.passwordConfirm && <span className="form__error">{errors.passwordConfirm}</span>}
                  </div>
                  <button
                     className="form__button button form__button--sign-up"
                     onClick={sendForm}
                  >
                     Sign In
                  </button>
               </div>
            </div>
         </div>
      </section>
      // <div classNameName="container">
      //    <h1 classNameName="title">Registration</h1>
      //    <div classNameName="form">
      //       <label classNameName="form__label" htmlFor="username">Email:</label>
      //       <input
      //          classNameName="form__input"
      //          type="text" name="username"
      //          value={username}
      //          onChange={(e) => setUsername(e.target.value)}
      //       />
      //       {errors.username && <span classNameName="error">{errors.username}</span>}

      //       <label classNameName="form__label" htmlFor="password" >Password:</label>
      //       <input
      //          classNameName="form__input"
      //          type="password" name="password"
      //          value={password}
      //          onChange={(e) => setPassword(e.target.value)}
      //       />
      //       {errors.password && <span classNameName="error">{errors.password}</span>}

      //       <label classNameName="form__label" htmlFor="password" >Confirm password:</label>
      //       <input
      //          classNameName="form__input"
      //          type="password"
      //          name="passwordConfirm"
      //          value={passwordConfirm}
      //          onChange={(e) => setPasswordConfirm(e.target.value)}
      //       />
      //       {errors.passwordConfirm && <span classNameName="error">{errors.passwordConfirm}</span>}

      //       <button classNameName="form__button" onClick={sendForm}>Sign up</button>
      //    </div>
      // </div>
   );
};

export default Register