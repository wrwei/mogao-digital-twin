const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

/**
 * User Routes
 *
 * POST   /users/login              - Login
 * POST   /users/register           - Register
 * GET    /users/profile             - Get current user profile
 * GET    /users/                    - Get all users
 * GET    /users/:id                 - Get user by ID
 * PUT    /users/:id                 - Update user
 * PUT    /users/preferences         - Update own preferences
 * PUT    /users/preferences/:id     - Update user preferences
 * PUT    /users/profile             - Update own profile
 * GET    /users/database-stats      - Get database collection stats
 * DELETE /users/:id                 - Delete user
 */

// Public routes (no auth required)
router.post('/login', UserController.login);
router.post('/register', UserController.register);

// Protected routes
router.get('/profile', UserController.getProfile);
router.put('/preferences', UserController.updatePreferences);
router.put('/preferences/:id', UserController.updatePreferences);
router.put('/profile', UserController.updateProfile);
router.get('/database-stats', UserController.getDatabaseStats);
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);

module.exports = router;
