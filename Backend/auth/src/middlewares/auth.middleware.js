
const jwt = require('jsonwebtoken')

async function authMiddleware(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ message: "Unauthorised" })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = decoded
        req.user = user
        next()
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorised" })
    }

}

// Optional auth middleware - doesn't fail if no token, just sets req.user if available
async function optionalAuthMiddleware(req, res, next) {
    const token = req.cookies.token
    if (!token) {
        req.user = null
        return next()
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
    } catch (err) {
        req.user = null
    }
    next()
}

module.exports = { authMiddleware, optionalAuthMiddleware }