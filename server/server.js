import 'dotenv/config';
console.log('Debug - MONGODB_URI:', process.env.MONGODB_URI);
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './database.js';
import cors from 'cors';
import basicAuth from 'express-basic-auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: process.env.UPLOADS_DIR || 'uploads/' });

// Middleware
app.use(cors());

// Authentication
const users = {
    'admin': process.env.ADMIN_PASSWORD || '1234' // Simple default credentials
};

// Apply auth only to API routes
app.use('/api', basicAuth({
    users: users,
    challenge: true, 
    unauthorizedResponse: 'Unauthorized access'
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
let db;
(async () => {
    db = await connectDB();
})();

// Protected health check endpoint (for authentication testing)
app.get('/health', basicAuth({
    users: { 'admin': process.env.ADMIN_PASSWORD || '1234' },
    challenge: true
}), (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date(),
        database: db ? 'connected' : 'disconnected'
    });
});

// Admin API Routes
app.post('/api/update-home', upload.single('image'), async (req, res) => {
    try {
        const { text } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;
        
        await db.collection('home').updateOne(
            {}, 
            { $set: { text, image } },
            { upsert: true }
        );
        
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/create-post', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;
        
        await db.collection('posts').insertOne({
            title,
            content,
            image,
            createdAt: new Date()
        });
        
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/update-about', async (req, res) => {
    try {
        const { text } = req.body;
        
        await db.collection('about').updateOne(
            {}, 
            { $set: { text } },
            { upsert: true }
        );
        
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
