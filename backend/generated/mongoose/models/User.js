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
    gender: {
        type: String,
        enum: ['confidential', 'male', 'female'],
        default: 'confidential'
    },
    bio: { type: String, maxlength: 200 },
    avatar: { type: String },
    lastLoginAt: { type: Date },
    preferences: {
        theme: {
            type: String,
            enum: ['mogao', 'ocean', 'forest', 'slate', 'plum', 'ember', 'midnight', 'sakura'],
            default: 'mogao'
        },
        language: { type: String, default: 'en' },
        fontSize: { type: Number, default: 14, min: 12, max: 20 },
        sidebarCollapsed: { type: Boolean, default: false },
        notifications: {
            email: { type: Boolean, default: true },
            inApp: { type: Boolean, default: true },
            digest: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' }
        }
    },
}, {
    timestamps: true,
    collection: 'users'
});

const User = mongoose.model('User', UserSchema);

module.exports = { User, UserSchema };
