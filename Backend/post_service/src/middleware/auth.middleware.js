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
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' })
  }
}

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

// Role-based access: only orphanAdmin allowed
function orphanAdminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'orphanAdmin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Only orphanage admins can perform this action' })
  }
  next()
}

module.exports = { authMiddleware, optionalAuthMiddleware, orphanAdminOnly }
