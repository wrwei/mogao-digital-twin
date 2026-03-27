const JWT = require('../util/jwt');

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/users/login',
    '/users/register',
    '/health',
];

function authMiddleware(req, res, next) {
    // Skip auth for public routes
    const isPublic = PUBLIC_ROUTES.some(route => req.path.startsWith(route));
    if (isPublic) {
        return next();
    }

    // Check for Authorization header first (takes priority over guest)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = JWT.verify(token);

        if (!payload) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        req.user = { _id: payload._id, username: payload.username, role: payload.role };

        if (JWT.isExpiringSoon(token)) {
            const newToken = JWT.generate({
                _id: payload._id,
                username: payload.username,
                role: payload.role
            });
            res.setHeader('Authorization', `Bearer ${newToken}`);
        }

        return next();
    }

    // Fall back to guest access (read-only)
    const isGuest = req.headers['x-guest-access'] === 'true';
    if (isGuest) {
        req.user = { username: 'guest', role: 'guest' };
        return next();
    }

    return res.status(401).json({ message: 'Authentication required' });
}

/**
 * Middleware to restrict write operations (POST, PUT, DELETE) for guests.
 * Guests can only perform GET requests.
 */
function requireWriteAccess(req, res, next) {
    if (req.method === 'GET') {
        return next();
    }

    if (req.user && req.user.role === 'guest') {
        return res.status(403).json({ message: 'Guest users have read-only access' });
    }

    next();
}

module.exports = { authMiddleware, requireWriteAccess };
