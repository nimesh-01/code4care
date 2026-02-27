
const jwt = require('jsonwebtoken')

async function authMiddleware(req, res, next) {
    let token = req.cookies.token

    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ')
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
            token = parts[1]
        }
    }

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
module.exports = { authMiddleware }