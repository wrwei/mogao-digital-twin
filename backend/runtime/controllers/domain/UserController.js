const UserService = require('../../services/domain/UserService');
const JWT = require('../../util/jwt');

const UserController = {

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            const user = await UserService.login({ username, password });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (user.accountStatus !== 'active') {
                return res.status(403).json({ message: 'Account is not active' });
            }

            const token = JWT.generate({
                _id: user._id,
                username: user.username,
                role: user.role
            });

            res.setHeader('Authorization', `Bearer ${token}`);
            res.json({
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    gender: user.gender,
                    bio: user.bio,
                    avatar: user.avatar,
                    preferences: user.preferences,
                }
            });
        } catch (error) {
            console.error('Login failed:', error);
            res.status(500).json({ message: 'Login failed', error: error.message });
        }
    },

    register: async (req, res) => {
        try {
            const { username, email, password, fullName, role } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'Username, email, and password are required' });
            }

            const user = await UserService.register({ username, email, password, fullName, role });

            const token = JWT.generate({
                _id: user._id,
                username: user.username,
                role: user.role
            });

            res.setHeader('Authorization', `Bearer ${token}`);
            res.status(201).json({
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ message: 'Username or email already exists' });
            }
            console.error('Registration failed:', error);
            res.status(500).json({ message: 'Registration failed', error: error.message });
        }
    },

    getAll: async (req, res) => {
        try {
            const users = await UserService.getAll();
            res.json(users);
        } catch (error) {
            console.error('Failed to get users:', error);
            res.status(500).json({ message: 'Failed to get users', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const user = await UserService.getById(req.params.id);
            if (!user) return res.status(404).send();
            res.json(user);
        } catch (error) {
            console.error('Failed to get user:', error);
            res.status(500).json({ message: 'Failed to get user', error: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await UserService.getById(req.user._id);
            if (!user) return res.status(404).send();
            res.json(user);
        } catch (error) {
            console.error('Failed to get profile:', error);
            res.status(500).json({ message: 'Failed to get profile', error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const user = await UserService.update(req.params.id, req.body);
            if (!user) return res.status(404).send();
            res.json(user);
        } catch (error) {
            console.error('Failed to update user:', error);
            res.status(500).json({ message: 'Failed to update user', error: error.message });
        }
    },

    updatePreferences: async (req, res) => {
        try {
            const userId = req.params.id || req.user._id;
            const user = await UserService.updatePreferences(userId, req.body);
            if (!user) return res.status(404).send();
            res.json(user.preferences);
        } catch (error) {
            console.error('Failed to update preferences:', error);
            res.status(500).json({ message: 'Failed to update preferences', error: error.message });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { fullName, email, gender, bio } = req.body;
            const update = {};
            if (fullName !== undefined) update.fullName = fullName;
            if (email !== undefined) update.email = email;
            if (gender !== undefined) update.gender = gender;
            if (bio !== undefined) update.bio = bio;
            const user = await UserService.update(req.user._id, update);
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (error) {
            console.error('Failed to update profile:', error);
            res.status(500).json({ message: 'Failed to update profile', error: error.message });
        }
    },

    getDatabaseStats: async (req, res) => {
        try {
            const mongoose = require('mongoose');
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            const stats = {};
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                stats[col.name] = count;
            }
            res.json(stats);
        } catch (error) {
            console.error('Failed to get database stats:', error);
            res.status(500).json({ message: 'Failed to get database stats', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const user = await UserService.delete(req.params.id);
            if (!user) return res.status(404).send();
            res.json(user);
        } catch (error) {
            console.error('Failed to delete user:', error);
            res.status(500).json({ message: 'Failed to delete user', error: error.message });
        }
    },
};

module.exports = UserController;
