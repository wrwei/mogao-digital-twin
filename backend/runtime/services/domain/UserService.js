const { User } = require('../../models/User');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const UserService = {

    login: async ({ username, password }) => {
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });
        if (!user) return null;

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        user.lastLoginAt = new Date();
        await user.save();

        return user;
    },

    register: async ({ username, email, password, fullName, role }) => {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            username,
            email,
            passwordHash,
            fullName,
            role: role || 'viewer',
        });
        return user;
    },

    getAll: async () => {
        return User.find().select('-passwordHash');
    },

    getById: async (id) => {
        return User.findById(id).select('-passwordHash');
    },

    update: async (id, data) => {
        // Hash password if being updated
        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
            delete data.password;
        }
        return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-passwordHash');
    },

    updatePreferences: async (id, prefs) => {
        const update = {};
        for (const [key, value] of Object.entries(prefs)) {
            update[`preferences.${key}`] = value;
        }
        return User.findByIdAndUpdate(id, { $set: update }, { new: true }).select('-passwordHash');
    },

    delete: async (id) => {
        return User.findByIdAndDelete(id);
    },
};

module.exports = UserService;
