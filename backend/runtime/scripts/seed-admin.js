/**
 * Seed a default administrator account.
 *
 * Idempotent: skips creation if a user with the target username already exists.
 *
 * Usage (from backend/runtime):
 *     node scripts/seed-admin.js
 *
 * Env vars (all optional):
 *     MONGO_URI       MongoDB connection string (default: mongodb://localhost:27017/mogao_dt)
 *     ADMIN_USERNAME  default: admin
 *     ADMIN_EMAIL     default: admin@mogao.local
 *     ADMIN_PASSWORD  default: admin123    <-- CHANGE FOR PRODUCTION
 *     ADMIN_FULLNAME  default: Administrator
 *
 * Examples:
 *     ADMIN_PASSWORD=s3cure! node scripts/seed-admin.js
 *     MONGO_URI=mongodb://db:27017/mogao_dt node scripts/seed-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mogao_dt';
const USERNAME  = process.env.ADMIN_USERNAME  || 'admin';
const EMAIL     = process.env.ADMIN_EMAIL     || 'admin@mogao.local';
const PASSWORD  = process.env.ADMIN_PASSWORD  || 'admin123';
const FULLNAME  = process.env.ADMIN_FULLNAME  || 'Administrator';

const SALT_ROUNDS = 10;

(async () => {
    try {
        console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);

        const existing = await User.findOne({ username: USERNAME });
        if (existing) {
            console.log(`✔ User "${USERNAME}" already exists (role=${existing.role}). Nothing to do.`);
            process.exit(0);
        }

        console.log(`Creating administrator "${USERNAME}"...`);
        const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
        const user = await User.create({
            username: USERNAME,
            email: EMAIL,
            passwordHash,
            fullName: FULLNAME,
            role: 'admin',
            accountStatus: 'active'
        });

        console.log('✔ Admin account created:');
        console.log(`    username : ${user.username}`);
        console.log(`    email    : ${user.email}`);
        console.log(`    role     : ${user.role}`);
        console.log(`    password : ${PASSWORD}  ← keep this safe, change it after first login`);
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    }
})();
