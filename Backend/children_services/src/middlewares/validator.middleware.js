
const { body, validationResult } = require('express-validator');


const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}
const childCreateValidations = [
    body('name')
        .exists({ checkFalsy: true }).withMessage('name is required').bail()
        .isString().withMessage('name must be a string'),
    body('age')
        .exists({ checkFalsy: true }).withMessage('age is required').bail()
        .isInt({ min: 0 }).withMessage('age must be a non-negative integer')
        .toInt(),
    body('gender')
        .exists({ checkFalsy: true }).withMessage('gender is required').bail()
        .isIn(['Male', 'Female', 'Other']).withMessage('gender must be Male, Female or Other'),
    body('healthStatus').optional().isString(),
    body('educationStatus').optional().isString(),
    body('background').optional().isString(),
    body('city')
        .exists({ checkFalsy: true }).withMessage('city is required').bail()
        .isString(),
    body('state')
        .exists({ checkFalsy: true }).withMessage('state is required').bail()
        .isString(),
    body('status').optional().isIn(['active', 'archived']).withMessage('Invalid status'),
    respondWithValidationErrors
];

module.exports = { childCreateValidations }