// Middleware to prevent caching
const preventCache = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
};

module.exports = preventCache;