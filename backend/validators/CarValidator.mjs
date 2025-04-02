class CarValidator {

  static carSchema = {
    brand: {
      trim: true,
      escape: true,
      notEmpty: {
        errorMessage: 'Brand is required.'
      },
      isLength: {
        options: { min: 2, max: 30 },
        errorMessage: 'Brand must be at most 30 characters long.',
      },
    },
    year: {
      isInt: {
        options: { min: 1886, max: new Date().getFullYear() },
        errorMessage: 'Please enter a valid year',
      }
    },
    price: {
      isInt: {
        options: { min: 0 },
        errorMessage: 'Please enter a valid year',
      }
    },
    image: {
      custom: {
        options: (value, { req }) => {
          if (!req.params.id && !req.file) {
            return false;
          }
          return true;
        },
        errorMessage: 'Image is required'
      }
    }
  }
}

export default CarValidator
