/**
 * Role-based Access Control Middleware
 * Restricts access based on user roles
 * 
 * Available Roles: user, orphanAdmin, superAdmin, volunteer
 */
const permit = (...allowedRoles) => {
    return (req, res, next) => {
        const { user } = req;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - You do not have permission to access this resource'
            });
        }

        next();
    };
};

/**
 * Check if user is the owner or has admin access
 * Used for donation access control
 */
const checkDonationAccess = async (req, res, next) => {
    const { user } = req;
    const donation = req.donation; // Set by previous middleware or controller

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }

    // SuperAdmin has access to everything
    if (user.role === 'superAdmin') {
        return next();
    }

    // Donor can access their own donations
    if (donation.donorId.toString() === user.id) {
        return next();
    }

    // OrphanAdmin can access donations to their orphanage
    if (user.role === 'orphanAdmin' && 
        user.orphanageId && 
        donation.orphanageId.toString() === user.orphanageId.toString()) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Forbidden - You do not have access to this donation'
    });
};

module.exports = { permit, checkDonationAccess };
