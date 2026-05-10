const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./db/mongoose');

// Load env vars
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'lwazi_super_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/lwazi-academy',
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

// Serve static files from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
// We will update these routes later or stub them out to prevent crashes
app.use('/api/tutors', require('./routes/tutors'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/applications', require('./routes/applications'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'Lwazi Academy API', version: '1.0.0' });
});

// SPA fallback — serve index.html for non-API, non-file routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        const filePath = path.join(__dirname, '..', 'public', req.path);
        res.sendFile(filePath, (err) => {
            if (err) {
                res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
            }
        });
    }
});

app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║                                          ║');
    console.log('  ║      🎓  Lwazi Academy Server  🎓       ║');
    console.log('  ║                                          ║');
    console.log(`  ║   → http://localhost:${PORT}               ║`);
    console.log('  ║                                          ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
});
