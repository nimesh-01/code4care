const permit = (...allowedRoles) => (req, res, next) => {
    const { user } = req;
    console.log(user)
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (allowedRoles.includes(user.role)) { return next(); }
    return res.status(403).json({ error: 'Forbidden' });
};

module.exports = { permit };
