const { body, query, validationResult } = require('express-validator')

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}
const registerUserValidations = [
    body("username")
        .isString()
        .withMessage("Username must be a string")
        .isLength({ min: 3 })
        .withMessage('Username must be 3 charaters long'),
    body("email")
        .isString()
        .withMessage("Email must be a string"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be 6 digits longer"),
    body("fullname.firstname")
        .isString()
        .withMessage("Firstname must be string")
        .notEmpty()
        .withMessage("Firstname is required"),
    body("fullname.lastname")
        .isString()
        .withMessage("Lastname must be string"),
    body('role')
        .optional()
        .isIn(['superAdmin', 'orphanAdmin', 'volunteer', 'user'])
        .withMessage("Role must be either 'user' , 'volunteer' and 'orphanAdmin'"),
    respondWithValidationErrors
]
const loginUserValidations = [
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be 6 digits longer"),
    body().custom(body => {
        if (!body.username && !body.email) {
            throw new Error("Either username or email is required");
        }
        return true;
    }),
    respondWithValidationErrors
]
const addressValidations = [
    body('street')
        .isString().withMessage('Street must be a string')
        .notEmpty().withMessage('Street is required'),
    body('city')
        .isString().withMessage('City must be a string')
        .notEmpty().withMessage('City is required'),
    body('state')
        .isString().withMessage('State must be a string')
        .notEmpty().withMessage('State is required'),
    body('pincode')
        .isString().withMessage('Pincode must be a string')
        .notEmpty().withMessage('Pincode is required'),
    body('country')
        .isString().withMessage('Country must be a string')
        .notEmpty().withMessage('Country is required'),
    body('isDefault')
        .optional().isBoolean().withMessage('isDefault must be a boolean'),
    respondWithValidationErrors
];
const forgotPasswordValidations = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
    respondWithValidationErrors
];
const resetPasswordValidations = [
    body('token')
        .isString()
        .withMessage('Token is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    respondWithValidationErrors
];
const orphanageValidations = [
    body('name')
        .isString().withMessage('Name must be a string')
        .notEmpty().withMessage('Name is required'),
    body('registrationNumber')
        .isString().withMessage('Registration number must be a string')
        .notEmpty().withMessage('Registration number is required'),
    body('orphanage_mail')
        .isEmail().withMessage('Valid orphanage email is required'),
    body('orphanage_phone')
        .isString().withMessage('Phone must be a string')
        .notEmpty().withMessage('Phone is required'),
    body('address.street')
        .optional().isString().withMessage('Street must be a string'),
    body('address.city')
        .optional().isString().withMessage('City must be a string'),
    body('address.state')
        .optional().isString().withMessage('State must be a string'),
    body('address.pincode')
        .optional().isString().withMessage('Pincode must be a string'),
    body('address.country')
        .optional().isString().withMessage('Country must be a string'),
    body('documents.registrationCertificate')
        .optional().isURL().withMessage('registrationCertificate must be a URL'),
    body('documents.governmentLicense')
        .optional().isURL().withMessage('governmentLicense must be a URL'),
    body('documents.otherDocuments')
        .optional().isArray().withMessage('otherDocuments must be an array'),
    body('documents.otherDocuments.*')
        .optional().isURL().withMessage('Each document must be a URL'),
    body('status')
        .optional().isIn(['pending', 'approved', 'rejected', 'blocked']).withMessage('Invalid status'),
    body('verifiedBy')
        .optional().isMongoId().withMessage('verifiedBy must be a valid id'),
    body('orphanAdmin')
        .isMongoId().withMessage('orphanAdmin must be a valid id'),
    body('verificationNote')
        .optional().isString().withMessage('verificationNote must be a string'),
    body('approvedAt')
        .optional().isISO8601().withMessage('approvedAt must be a valid date').toDate(),
    respondWithValidationErrors
];
const orphanageUpdateValidations = [
    body('name').optional().isString().withMessage('Name must be a string'),
    body('orphanage_mail').optional().isEmail().withMessage('Valid orphanage email is required'),
    body('orphanage_phone').optional().isString().withMessage('Phone must be a string'),
    body('address.street').optional().isString().withMessage('Street must be a string'),
    body('address.city').optional().isString().withMessage('City must be a string'),
    body('address.state').optional().isString().withMessage('State must be a string'),
    body('address.pincode').optional().isString().withMessage('Pincode must be a string'),
    body('address.country').optional().isString().withMessage('Country must be a string'),
    body('documents.registrationCertificate').optional().isURL().withMessage('registrationCertificate must be a URL'),
    body('documents.governmentLicense').optional().isURL().withMessage('governmentLicense must be a URL'),
    body('documents.otherDocuments').optional().isArray().withMessage('otherDocuments must be an array'),
    body('documents.otherDocuments.*').optional().isURL().withMessage('Each document must be a URL'),
    respondWithValidationErrors
];
const orphanageListValidations = [
    query('state').optional().isString().withMessage('state must be a string'),
    query('city').optional().isString().withMessage('city must be a string'),
    query('limit').optional().isInt({ min: 1 }).withMessage('limit must be a positive integer').toInt(),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
    respondWithValidationErrors
];
const updateUserValidations = [
    body('username').optional().isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('fullname.firstname').optional().isString().withMessage('Firstname must be string'),
    body('fullname.lastname').optional().isString().withMessage('Lastname must be string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('address.street').optional().isString().withMessage('Street must be a string'),
    body('address.city').optional().isString().withMessage('City must be a string'),
    body('address.state').optional().isString().withMessage('State must be a string'),
    body('address.pincode').optional().isString().withMessage('Pincode must be a string'),
    body('address.country').optional().isString().withMessage('Country must be a string'),
    respondWithValidationErrors
];
module.exports = {
    registerUserValidations,
    loginUserValidations,
    addressValidations,
    forgotPasswordValidations,
    resetPasswordValidations,
    orphanageValidations
    , orphanageUpdateValidations
    , updateUserValidations
    , orphanageListValidations
}