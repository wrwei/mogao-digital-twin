const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/domain/UserController');
const { authMiddleware } = require('../../middleware/auth');

/**
 * User Routes
 *
 * POST   /users/login              - Login (public)
 * POST   /users/register           - Register (public)
 * GET    /users/profile             - Get current user profile
 * PUT    /users/profile             - Update own profile
 * PUT    /users/preferences         - Update own preferences
 * PUT    /users/preferences/:id     - Update user preferences
 * GET    /users/database-stats      - Get database collection stats
 * GET    /users/                    - Get all users
 * GET    /users/:id                 - Get user by ID
 * PUT    /users/:id                 - Update user
 * DELETE /users/:id                 - Delete user
 */

// Public routes (no auth required)
router.post('/login', UserController.login);
router.post('/register', UserController.register);

// All routes below require authentication
router.use(authMiddleware);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.put('/preferences', UserController.updatePreferences);
router.put('/preferences/:id', UserController.updatePreferences);
router.get('/database-stats', UserController.getDatabaseStats);
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

module.exports = router;
