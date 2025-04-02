class UserValidator {

   static userSchema = {
      username: {
         matches: {
            options: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            errorMessage: 'Invalid email format'
         },
      },
      password: {
         matches: {
            options: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            errorMessage: 'Use 8 or more characters with a mix of letters, numbers & symbols'
         },
      }
   }
}

export default UserValidator
