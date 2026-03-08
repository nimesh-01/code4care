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
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorised' })
    }
}

module.exports = { authMiddleware }
