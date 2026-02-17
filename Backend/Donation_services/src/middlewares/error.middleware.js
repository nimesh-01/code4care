/**
 * Not Found Handler
 * Handles 404 errors for unknown routes
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Global Error Handler
 * Catches all errors and returns appropriate response
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    // Determine status code
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        err.message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        statusCode = 400;
        err.message = 'Duplicate field value entered';
    }

    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { notFound, errorHandler };
