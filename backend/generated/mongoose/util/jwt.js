const jwt = require('jsonwebtoken');

const crypto = require('crypto');

// Require JWT_SECRET in production; generate a random one for development
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable must be set in production');
    process.exit(1);
}
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const JWT = {
    generate(payload, expires = '24h') {
        return jwt.sign(payload, SECRET, { expiresIn: expires });
    },

    verify(token) {
        try {
            return jwt.verify(token, SECRET);
        } catch (e) {
            return false;
        }
    },

    decode(token) {
        try {
            return jwt.decode(token);
        } catch (e) {
            return false;
        }
    },

    isExpired(token) {
        const decoded = this.decode(token);
        if (!decoded || !decoded.exp) return true;
        return Date.now() >= decoded.exp * 1000;
    },

    isExpiringSoon(token, thresholdSeconds = 300) {
        const decoded = this.decode(token);
        if (!decoded || !decoded.exp) return true;
        return (decoded.exp * 1000 - Date.now()) < thresholdSeconds * 1000;
    }
};

module.exports = JWT;
