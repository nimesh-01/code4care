const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for REST API
 * Validates JWT token from cookies
 */
async function authMiddleware(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid token'
        });
    }
}

/**
 * Socket authentication middleware
 * Validates JWT token from socket handshake
 */
function socketAuthMiddleware(socket, next) {
    try {
        // Get token from handshake auth or cookies
        const token = socket.handshake.auth?.token || 
                      socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];

        if (!token) {
            return next(new Error('Authentication error - No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error - Invalid token'));
    }
}

/**
 * Role-based access middleware for chat
 * Allows: orphanAdmin, user, volunteer
 * SuperAdmin: view only (optional audit)
 */
function chatAccessMiddleware(req, res, next) {
    const allowedRoles = ['orphanAdmin', 'user', 'volunteer', 'superAdmin'];
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden - You do not have permission to access chat'
        });
    }
    
    next();
}

/**
 * Validate chat permissions between roles
 * Admin ↔ User, Admin ↔ Volunteer
 */
function validateChatPermission(senderRole, receiverRole) {
    const allowedCombinations = [
        ['orphanAdmin', 'user'],
        ['user', 'orphanAdmin'],
        ['orphanAdmin', 'volunteer'],
        ['volunteer', 'orphanAdmin']
    ];

    return allowedCombinations.some(
        ([s, r]) => s === senderRole && r === receiverRole
    );
}

module.exports = {
    authMiddleware,
    socketAuthMiddleware,
    chatAccessMiddleware,
    validateChatPermission
};
