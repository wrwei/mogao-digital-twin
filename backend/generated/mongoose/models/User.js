const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'researcher', 'conservator', 'viewer', 'guest'],
        default: 'viewer'
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'pending_verification', 'deactivated'],
        default: 'active'
    },
    bio: { type: String },
    avatar: { type: String },
    lastLoginAt: { type: Date },
    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        language: { type: String, default: 'en' },
    },
}, {
    timestamps: true,
    collection: 'users'
});

const User = mongoose.model('User', UserSchema);

module.exports = { User, UserSchema };
