// Auto-generated Express app with Mongoose routes
// Generated from mogao_dt.ecore metamodel

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:8009,http://localhost:8008,http://127.0.0.1:8009,http://127.0.0.1:8008').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Access'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/exhibit_models', express.static(path.join(__dirname, 'exhibit_models')));

// Authentication
const { authMiddleware, requireWriteAccess } = require('./middleware/auth');
const userRouter = require('./routers/userRouter');

// Simple rate limiter for login endpoint
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 10;

function loginRateLimiter(req, res, next) {
    if (req.path !== '/login' || req.method !== 'POST') return next();
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (record && now - record.firstAttempt < LOGIN_WINDOW_MS) {
        if (record.count >= MAX_LOGIN_ATTEMPTS) {
            return res.status(429).json({ message: 'Too many login attempts. Try again later.' });
        }
        record.count++;
    } else {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
    }
    // Clean old entries periodically
    if (loginAttempts.size > 1000) {
        for (const [key, val] of loginAttempts) {
            if (now - val.firstAttempt > LOGIN_WINDOW_MS) loginAttempts.delete(key);
        }
    }
    next();
}

// User routes (login/register are public, rest require auth)
app.use('/users', loginRateLimiter, userRouter);

// Apply auth middleware to all subsequent routes
app.use(authMiddleware);

// Restrict write operations for guests
app.use(requireWriteAccess);

// Import routers
const caveRouter = require('./routers/caveRouter');
const defectRouter = require('./routers/defectRouter');
const statueRouter = require('./routers/statueRouter');
const muralRouter = require('./routers/muralRouter');
const paintingRouter = require('./routers/paintingRouter');
const inscriptionRouter = require('./routers/inscriptionRouter');
const coordinatesRouter = require('./routers/coordinatesRouter');
const parameterRouter = require('./routers/parameterRouter');
const assetReferenceRouter = require('./routers/assetReferenceRouter');
const dTPackageRouter = require('./routers/dTPackageRouter');
const temperatureRouter = require('./routers/temperatureRouter');
const humidityRouter = require('./routers/humidityRouter');
const lightIntensityRouter = require('./routers/lightIntensityRouter');
const deteriorationRouter = require('./routers/deteriorationRouter');
const exhibitRouter = require('./routers/exhibitRouter');

// Mount routes (no /api prefix to match existing frontend)
app.use('/caves', caveRouter);
app.use('/defects', defectRouter);
app.use('/statues', statueRouter);
app.use('/murals', muralRouter);
app.use('/paintings', paintingRouter);
app.use('/inscriptions', inscriptionRouter);
app.use('/coordinates', coordinatesRouter);
app.use('/parameters', parameterRouter);
app.use('/assetReferences', assetReferenceRouter);
app.use('/dTPackages', dTPackageRouter);
app.use('/temperatures', temperatureRouter);
app.use('/humidities', humidityRouter);
app.use('/lightIntensities', lightIntensityRouter);
app.use('/deterioration', deteriorationRouter);
app.use('/exhibits', exhibitRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'mogao-digital-twin' });
});

// File upload endpoint
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'general';
        const uploadDir = path.join(__dirname, 'exhibit_models', category);
        const fs = require('fs');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    }
});
const ALLOWED_EXTENSIONS = ['.obj', '.mtl', '.jpg', '.jpeg', '.png', '.gif', '.json', '.glb', '.gltf'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_EXTENSIONS.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed: ' + ext));
        }
    }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const category = req.body.category || 'general';
    const serverPath = '/exhibit_models/' + category + '/' + req.file.filename;
    res.json({ path: serverPath, originalName: req.file.originalname, size: req.file.size });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mogao_dt';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
