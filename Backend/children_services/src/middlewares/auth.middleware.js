const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  try {
    let token;

    // 1️⃣ From Browser (Cookies)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2️⃣ From Postman / Frontend (Authorization Header)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ❌ No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('🔍 authMiddleware - decoded token:', JSON.stringify(decoded, null, 2));
    
    req.user = decoded; // attach user payload
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
}

// Optional auth: if token present, verify and attach `req.user`, otherwise continue unauthenticated
async function optionalAuthMiddleware(req, res, next) {
  try {
    let token;
    if (req.cookies && req.cookies.token) token = req.cookies.token;
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    // Invalid token - just continue without user (don't fail for public routes)
    req.user = null;
    return next();
  }
}

module.exports = { authMiddleware, optionalAuthMiddleware };
