class LocationValidator {

  static locationSchema = {
    title: {
      trim: true,
      escape: true,
      notEmpty: {
        errorMessage: 'Name is required.'
      },
      isLength: {
        options: { min: 2, max: 20 },
        errorMessage: 'Name of the location should be from 2 to 20 characters',
      },
    },
    address: {
      trim: true,
      escape: true,
      notEmpty: {
        errorMessage: 'Address is required.'
      },
      isLength: {
        options: { min: 3, max: 50 },
        errorMessage: 'Address must be from 3 to 50 characters',
      },

    },
  }
}

export default LocationValidator
