const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, '..');
const POSTS_DIR = path.join(__dirname, 'posts');
const POSTS_INDEX = path.join(__dirname, 'posts.json');

const slugify = (text) => {
    return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
};

const server = http.createServer((req, res) => {
    // Basic API routes
    if (req.url.startsWith('/api/posts')) {
        // Only allow from localhost
        const isLocal = req.socket.localAddress === req.socket.remoteAddress;

        if (req.method === 'GET') {
            const data = fs.readFileSync(POSTS_INDEX, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(data);
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const post = JSON.parse(body);
                const posts = JSON.parse(fs.readFileSync(POSTS_INDEX, 'utf8'));

                // Generate slug from title
                const id = slugify(post.title) || Date.now().toString();

                // Add to index
                const summary = {
                    id: id,
                    title: post.title,
                    category: post.category,
                    readTime: post.readTime,
                    excerpt: post.excerpt,
                    date: post.date || new Date().toISOString().split('T')[0]
                };
                post.id = id;

                posts.unshift(summary);
                fs.writeFileSync(POSTS_INDEX, JSON.stringify(posts, null, 4));
                fs.writeFileSync(path.join(POSTS_DIR, `${id}.json`), JSON.stringify(post, null, 4));

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(post));
            });
            return;
        }

        if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                const post = JSON.parse(body);
                const posts = JSON.parse(fs.readFileSync(POSTS_INDEX, 'utf8'));

                const oldId = post.id;
                const newId = slugify(post.title);

                // If title changed, we need to handle file renaming
                if (oldId !== newId) {
                    const oldPath = path.join(POSTS_DIR, `${oldId}.json`);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                    post.id = newId;
                }

                // Update index
                const idx = posts.findIndex(p => p.id === oldId);
                if (idx !== -1) {
                    posts[idx] = {
                        id: newId,
                        title: post.title,
                        category: post.category,
                        readTime: post.readTime,
                        excerpt: post.excerpt,
                        date: post.date
                    };
                    fs.writeFileSync(POSTS_INDEX, JSON.stringify(posts, null, 4));
                    fs.writeFileSync(path.join(POSTS_DIR, `${newId}.json`), JSON.stringify(post, null, 4));
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(post));
            });
            return;
        }

        if (req.method === 'DELETE') {
            const id = req.url.split('/').pop();
            const posts = JSON.parse(fs.readFileSync(POSTS_INDEX, 'utf8'));
            const filtered = posts.filter(p => p.id !== id);
            fs.writeFileSync(POSTS_INDEX, JSON.stringify(filtered, null, 4));

            const filePath = path.join(POSTS_DIR, `${id}.json`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            res.writeHead(204);
            return res.end();
        }
    }

    // Redirect /blog to /blog/ (some browsers need this for relative paths, though we'll use absolute)
    if (req.url === '/blog') {
        res.writeHead(301, { 'Location': '/blog/' });
        return res.end();
    }

    // Serve static files
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

    // SPA Routing: If it's a /blog/... path without an extension, serve blog/index.html
    const isBlogPath = req.url.startsWith('/blog');
    const hasExtension = path.extname(req.url) !== '';

    if (isBlogPath && !hasExtension && !fs.existsSync(filePath)) {
        filePath = path.join(PUBLIC_DIR, 'blog', 'index.html');
    }

    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Blog Dev Server running at http://localhost:${PORT}`);
    console.log(`CRUD operations enabled for localhost.`);
});
