/**
 * Async Handler Wrapper
 * Wraps async functions to handle errors automatically
 * Eliminates need for try-catch in every controller
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
