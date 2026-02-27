const permit = (...allowedRoles) => (req, res, next) => {
    const { user } = req
    if (!user) return res.status(401).json({ error: 'Not authenticated' })

    const normalizedAllowed = allowedRoles.map((role) => (role || '').toLowerCase())
    const normalizedUserRole = (user.role || '').toLowerCase()

    if (normalizedAllowed.includes(normalizedUserRole)) {
        return next()
    }

    return res.status(403).json({ error: 'Forbidden' })
}

module.exports = { permit };
