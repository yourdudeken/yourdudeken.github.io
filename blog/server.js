const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_db';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Helper to generate slug from title
const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

// Post Schema
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    author: { type: String, default: 'Admin' },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field and generate slug if not provided
postSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    if (!this.slug) {
        this.slug = slugify(this.title);
    }
    next();
});

const Post = mongoose.model('Post', postSchema);

// API Routes

/**
 * @api {get} /api/posts Get all posts
 * @apiQuery {String} [tag] Filter by tag
 * @apiQuery {Number} [page=1] Pagination page
 * @apiQuery {Number} [limit=10] Max items per page
 */
app.get('/api/posts', async (req, res) => {
    try {
        const { tag, page = 1, limit = 10, status = 'published' } = req.query;
        const query = { status };

        if (tag) {
            query.tags = tag;
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Post.countDocuments(query);

        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalPosts: count
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single post by ID or Slug
app.get('/api/posts/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        let post;

        // Try searching by ID first, then by slug
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            post = await Post.findById(identifier);
        } else {
            post = await Post.findOne({ slug: identifier });
        }

        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a post
app.post('/api/posts', async (req, res) => {
    const post = new Post({
        title: req.body.title,
        slug: req.body.slug || slugify(req.body.title),
        content: req.body.content,
        excerpt: req.body.excerpt || req.body.content.substring(0, 150) + '...',
        author: req.body.author,
        tags: req.body.tags || [],
        status: req.body.status || 'published'
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (req.body.title) {
            post.title = req.body.title;
            // Only update slug if user didn't provide a custom one
            if (!req.body.slug) post.slug = slugify(req.body.title);
        }
        if (req.body.slug) post.slug = req.body.slug;
        if (req.body.content) {
            post.content = req.body.content;
            if (!req.body.excerpt) post.excerpt = req.body.content.substring(0, 150) + '...';
        }
        if (req.body.excerpt) post.excerpt = req.body.excerpt;
        if (req.body.author) post.author = req.body.author;
        if (req.body.tags) post.tags = req.body.tags;
        if (req.body.status) post.status = req.body.status;

        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
