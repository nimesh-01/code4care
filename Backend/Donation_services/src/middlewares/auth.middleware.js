const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT Authentication Middleware
 * Extracts and verifies JWT token from cookies or Authorization header
 */
const authMiddleware = async (req, res, next) => {
    try {
        let token;

        // Check for token in cookies first
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Then check Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
        // Attach user to request
        req.user = {
            id: decoded.id || decoded._id,
            role: decoded.role,
            orphanageId: decoded.orphanageId || null,
            email: decoded.email,
            name: decoded.name
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Token expired'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
};

module.exports = { authMiddleware };
