const express = require('express');
const multer = require('multer');
const path = require('path');
const connectDB = require('./database');
const cors = require('cors');
const basicAuth = require('express-basic-auth');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());

// Authentication
const users = {
    admin: process.env.ADMIN_PASSWORD || 'admin123' // Default password, recommend changing
};

app.use(basicAuth({
    users: users,
    challenge: true,
    unauthorizedResponse: 'Unauthorized access'
}));

// Secure all admin routes
app.use('/api', basicAuth({users: users}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
let db;
(async () => {
    db = await connectDB();
})();

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
