const jwt = require('jsonwebtoken')

const extractToken = (req) => {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token
    }
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7)
    }
    return null
}

async function authMiddleware(req, res, next) {
    const token = extractToken(req)

    if (!token) {
        return res.status(401).json({ message: 'Unauthorised' })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    }
    catch (err) {
        return res.status(401).json({ message: 'Unauthorised' })
    }

}

// Optional auth middleware - doesn't fail if no token, just sets req.user if available
async function optionalAuthMiddleware(req, res, next) {
    const token = extractToken(req)
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