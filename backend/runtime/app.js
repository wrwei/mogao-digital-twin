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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Access'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files — public, no auth required
// Must be registered BEFORE authMiddleware so the JWT check never runs on these paths.
app.use('/exhibit_models', express.static(path.join(__dirname, 'exhibit_models')));
// Fallback: if the exact path isn't found, search all subdirectories for the filename.
// This handles stale DB paths where the stored subdir doesn't match where the file landed.
app.use('/exhibit_models', (req, res) => {
    const filename = path.basename(req.path);
    if (!filename || filename.includes('..')) {
        return res.status(404).json({ error: 'Not found' });
    }
    const baseDir = path.join(__dirname, 'exhibit_models');
    try {
        const subdirs = fs.readdirSync(baseDir).filter(d =>
            fs.statSync(path.join(baseDir, d)).isDirectory()
        );
        for (const sub of subdirs) {
            const candidate = path.join(baseDir, sub, filename);
            if (fs.existsSync(candidate)) {
                return res.sendFile(candidate);
            }
        }
    } catch (_) {}
    res.status(404).json({ error: 'Model file not found', path: req.path });
});

// Authentication
const { authMiddleware, requireWriteAccess } = require('./middleware/auth');
const userRouter = require('./routers/domain/userRouter');

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

// Telemetry sample-ingestion routes use sensor-API-key auth (NOT JWT), so
// they must be mounted BEFORE the global authMiddleware.
const { sensorRouter: telemetryIngestRouter, adminRouter: sensorAdminRouter }
    = require('./routers/domain/telemetryRouter');
app.use('/telemetry', telemetryIngestRouter);

// Snapshot ingestion is the visual counterpart to telemetry — same auth model.
// - /snapshots/ingest      : X-Sensor-Key auth (camera push)
// - /snapshots/:gid/image  : public (mirrors /exhibit_models pattern so <img src> works)
// - /snapshots, DELETE     : JWT auth (mounted with the admin routes below)
const {
    sensorRouter:   snapshotIngestRouter,
    publicRouter:   snapshotPublicRouter,
    adminRouter:    snapshotAdminRouter
} = require('./routers/domain/snapshotRouter');
app.use('/snapshots/ingest', snapshotIngestRouter);
app.use('/snapshots',        snapshotPublicRouter);

// Pigment-analysis cache — binary map is public (like /exhibit_models),
// metadata + upsert/delete behind JWT.
const {
    publicRouter: pigmentAnalysisPublicRouter,
    adminRouter:  pigmentAnalysisAdminRouter
} = require('./routers/domain/pigmentAnalysisRouter');
app.use('/pigment-analyses', pigmentAnalysisPublicRouter);

// Apply auth middleware to all subsequent routes
app.use(authMiddleware);

// Restrict write operations for guests (exempt computation endpoints)
app.use((req, res, next) => {
    if (req.path.startsWith('/deterioration')) return next();
    return requireWriteAccess(req, res, next);
});

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
const deteriorationRouter = require('./routers/domain/deteriorationRouter');
const exhibitRouter = require('./routers/domain/exhibitRouter');
const maintenanceRouter = require('./routers/domain/maintenanceRouter');
// sensorAdminRouter is defined above (before authMiddleware) alongside telemetryIngestRouter

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
app.use('/sensors', sensorAdminRouter);
app.use('/snapshots', snapshotAdminRouter);
app.use('/pigment-analyses', pigmentAnalysisAdminRouter);
app.use('/maintenance', maintenanceRouter);
app.use('/emulator', require('./routers/domain/emulatorRouter'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'mogao-digital-twin' });
});

// File upload endpoint
// NOTE: multer's destination callback runs BEFORE req.body is parsed, so req.body.category
// is always undefined there. We save to a fixed base dir and use req.body.category only when
// building the returned path (which IS available by the time the route handler runs).
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Always save to exhibit_models/uploads/ — category-based subdirs are handled
        // after the fact by reading req.body.category in the route handler.
        const uploadDir = path.join(__dirname, 'exhibit_models', 'uploads');
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
    // req.body is now available. Move the file from uploads/ into the category subdir.
    const category = (req.body.category || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const destDir = path.join(__dirname, 'exhibit_models', category);
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, req.file.filename);
    fs.renameSync(req.file.path, destPath);
    const serverPath = '/exhibit_models/' + category + '/' + req.file.filename;
    res.json({ path: serverPath, originalName: req.file.originalname, size: req.file.size });
});

// Avatar upload endpoint
app.post('/api/avatar', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const serverPath = '/exhibit_models/avatar/' + req.file.filename;
    res.json({ path: serverPath });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mogao_dt';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
